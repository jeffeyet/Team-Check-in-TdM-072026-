# Arquitectura

## Cómo está hoy (verificado)

La app se reescribió a un stack moderno y vive **en la raíz** del repo (backend
TypeScript + Express y frontend React + Vite), reemplazando a la app anterior de
un solo archivo. Corre en Replit como **un solo servicio**. Ver
[ADR-0003](decisiones/0003-stack-moderno-typescript-react.md).

Sobre esa base, el **2026-07-09** el equipo implementó el **aislamiento por
cohorte** (varios grupos con datos separados), el **endurecimiento del acceso**
(passcode por header, fail-closed en producción) y la **seguridad de datos**
(archivar, borrar por envío, respaldo, migración), reemplazando el borrado
destructivo "Clear all". Todo verificado con build + typecheck limpios y un smoke
test de handlers reales sobre un KV en memoria (33/33); ver
[pruebas/README.md](pruebas/README.md).

    ┌──────────────────────────┐      HTTP/JSON      ┌──────────────────────────────┐
    │  Navegador               │ ──────────────────▶ │  backend/ (Express 4 + TS)    │
    │  frontend/ (React 18 +   │   alumno: /api/c/*  │  rutas ALUMNO (por cohorte) + │
    │  Vite) servido como       │   admin: /api/admin │  rutas ADMIN (passcode por    │
    │  build estático (dist/)   │ ◀────────────────── │  header X-Passcode, SHA-256   │
    └──────────────────────────┘                     │  timing-safe, fail-closed)    │
                                                      └───────────────┬───────────────┘
                                                                     │  lecturas SIEMPRE
                                                             ┌───────▼────────┐ por prefijo
                                                             │  Replit KV     │
                                                             │  cohorts       │
                                                             │  cohort:<id>:  │
                                                             │   team:* /     │
                                                             │   prompt:*     │
                                                             └────────────────┘

- **Un solo servicio:** el backend compila a `backend/dist/` y, en producción,
  sirve el build del frontend (`frontend/dist/`) como estático más un fallback
  SPA; sobre eso expone el API (`backend/src/index.ts:16-25`).
- **Sin sesiones:** cada request de admin lleva el passcode en el header
  `X-Passcode` (o `{code}` en el body de un POST); **nunca** por query string.
  La verificación es timing-safe sobre SHA-256 (`backend/src/auth.ts:8-21`).
- **Despliegue:** Replit Autoscale. El `.replit` corre un solo flujo:
  `npm run install:all && npm run build && npm run start` (ver
  [operacion.md](operacion.md)).

### Estructura del código

| Carpeta / archivo | Responsabilidad |
|---|---|
| `backend/src/index.ts` | Arranque de Express; cabeceras de seguridad + límite JSON, `trust proxy`, monta `/api/c` (alumno) y `/api/admin` (instructor, con rate limit); sirve `frontend/dist` + fallback SPA; manejador de error final |
| `backend/src/config.ts` | Configuración (`PASSCODE`, `PORT`) y advertencia de passcode al arranque (`warnPasscodeAtStartup`) |
| `backend/src/db.ts` | Wrapper de `@replit/database` (Replit KV): `get`, `set`, `list(prefix)`, `del` |
| `backend/src/auth.ts` | `checkCode` timing-safe (SHA-256), `requirePasscode`/`requirePasscodeText`, fail-closed en producción |
| `backend/src/routes/student.ts` | Rutas ALUMNO por cohorte (montadas en `/api/c`) |
| `backend/src/routes/admin.ts` | Rutas INSTRUCTOR (montadas en `/api/admin`), todas passcode-gated |
| `backend/src/services/cohorts.ts` | Índice de cohortes, prefijos de llave, crear/actualizar/archivar, contar, borrar envío, migrar legado, respaldo |
| `backend/src/services/teams.ts` | Lectura/escritura de equipos por prefijo de cohorte y dedupe por cohorte |
| `backend/src/services/prompts.ts` | Lectura/escritura de bitácoras de prompts por prefijo de cohorte |
| `backend/src/lib/{csv,validate,security}.ts` | Helpers: CSV (con anti-inyección de fórmulas), validación de URL `http(s)`, y seguridad (cabeceras/CSP + rate limiter, sin dependencias) |
| `frontend/src/App.tsx` | Router por estado; lee `?grupo=<id>` y valida la cohorte antes de las vistas de alumno |
| `frontend/src/views/{Day1,Day2,Admin}.tsx` | Las vistas de alumno (Día 1/Día 2) y la de instructor (gestión de cohortes + detalle) |
| `frontend/src/api.ts` | Cliente `fetch` tipado; centraliza el header `X-Passcode` y las descargas por blob |
| `frontend/src/types.ts` | Espejo de los tipos de `backend/src/types.ts` (contrato canónico, ADR-0007) + tipos de vista |
| `frontend/vite.config.ts` | Build; en dev, proxy `/api` → `:3000` |
| `package.json` (raíz) | Orquestador: `install:all`, `build`, `start`, `dev:*`, `typecheck` |

## Modelo de datos actual (verificado)

Los datos están **aislados por cohorte**. Una cohorte es una caja de datos
separada (un grupo / edición del curso); ver `backend/src/types.ts:29-36`.

| Llave | Valor | Escrita por |
|---|---|---|
| `cohorts` | JSON array de `Cohort {id, label, createdAt, archived}` — el índice de cohortes | `backend/src/services/cohorts.ts` (`createCohort`, `updateCohort`, `archiveCohort`) |
| `cohort:<id>:team:<ts>_<uuid>` | `{teamName ≤120, idea ≤240, members[≤6]{name ≤120, linkedin http(s) o "" ≤300, isPM}, ts}` | `POST /api/c/:cohort/submit` → `saveTeam` |
| `cohort:<id>:prompt:<ts>_<uuid>` | `{teamName ≤120, idea ≤240, docUrl http(s) ≤500, ts}` | `POST /api/c/:cohort/prompt-submit` → `savePrompt` |

Particularidades que conviene conocer:

- **Lecturas SIEMPRE por prefijo.** Cada servicio de datos lista solo las llaves
  de su cohorte (`db.list(teamPrefix(id))` / `db.list(promptPrefix(id))`), nunca
  la lista global. Esto elimina el barrido O(n) sobre todo el KV que existía antes
  y garantiza que una cohorte no ve datos de otra
  (`backend/src/services/{teams,prompts}.ts`, prefijos en
  `backend/src/services/cohorts.ts:16-24`). *Excepción intencional:* el respaldo
  (`buildBackup`, `db.list("")`) y la migración de datos heredados
  (`migrateLegacy`, `db.list("team:")`/`db.list("prompt:")`) sí barren llaves
  amplias; son operaciones de admin, no lecturas de datos por cohorte.
- **Dedupe por cohorte.** El roster del Día 1 muestra un solo registro por
  nombre de equipo (trim + lowercase), tomando el más reciente. Como el dedupe
  opera sobre la lista ya acotada a una cohorte (`dedupeTeams` en
  `backend/src/services/teams.ts:19-25`), **corrige el bug previo de dedupe
  global** que colisionaba equipos homónimos de cohortes distintas. Las
  bitácoras del Día 2 se muestran todas (`backend/src/services/prompts.ts`).
- **IDs de cohorte por slug.** El id se deriva del nombre (o de un id
  personalizado) con `slugify` (minúsculas, sin acentos, guiones)
  (`backend/src/services/cohorts.ts:27-35`, `80-102`). Crear una cohorte con id
  repetido devuelve 409.
- **Robustez.** Los handlers que leen el KV capturan errores y responden 500
  (`Load failed.` / `Save failed.`) en vez de tumbar el servidor; fuera de
  Replit las escrituras fallan por diseño y la app degrada con gracia (rutas
  `student.ts` y `admin.ts`).

## Rutas

### Alumno — `backend/src/routes/student.ts`, montado en `/api/c`

Acceso por la cohorte a la que se escribe (enlace `?grupo=<id>`); no requiere
passcode. Si la cohorte no existe o está **archivada**, responde
`404 "Group not found."` (`getActiveCohort`).

| Método y ruta | Qué hace |
|---|---|
| `GET /api/c/:cohort` | Resuelve la cohorte por id (404 si falta o está archivada); devuelve `{cohort:{id,label}}` |
| `GET /api/c/:cohort/teamnames` | Nombres de equipo únicos y ordenados de esa cohorte; nunca 401, `{names:[]}` ante error |
| `POST /api/c/:cohort/submit` | Día 1: alta de equipo (valida, recorta a límites); 400 si faltan campos |
| `POST /api/c/:cohort/prompt-submit` | Día 2: bitácora de prompts (equipo, idea revisada, link al Doc); 400 si faltan campos |

### Instructor — `backend/src/routes/admin.ts`, montado en `/api/admin`

Todas passcode-gated (`requirePasscode` / `requirePasscodeText`). En producción
sin passcode configurado responden `500 "Server passcode not configured."`; con
passcode incorrecto, `401`.

| Método y ruta | Qué hace |
|---|---|
| `GET /cohorts` | Índice de cohortes con conteos por cohorte (`teamCount`, `promptCount`) |
| `POST /cohorts` | Crear cohorte `{label, id?}`; 409 si el id ya existe |
| `PATCH /cohorts/:id` | Actualizar `{label?, archived?}`; 404 si no existe |
| `GET /cohorts/:id/roster` | Equipos deduplicados de esa cohorte (alfabético) |
| `GET /cohorts/:id/prompts` | Bitácoras de esa cohorte (por nombre de equipo y luego `ts`) |
| `GET /cohorts/:id/export/teams.csv` | CSV de equipos de esa cohorte |
| `GET /cohorts/:id/export/prompts.csv` | CSV de bitácoras de esa cohorte |
| `DELETE /cohorts/:id/submissions/:key` | Borra un envío individual, verificando que la llave pertenece a esa cohorte |
| `POST /cohorts/:id/archive` | Borrado **suave**: marca `archived:true`, nunca destruye datos |
| `POST /migrate-legacy` | Mueve llaves heredadas sin prefijo (`team:*`/`prompt:*`) a una cohorte |
| `GET /backup.json` | Respaldo completo portátil: índice de cohortes + todas las llaves/valores |

Se **eliminaron** las rutas globales previas (`routes/teams.ts`,
`routes/prompts.ts`) y la acción destructiva "Clear all".

## Modelo de acceso

- **Un solo passcode de instructor.** El profesor es el único admin. Llega por
  el header `X-Passcode` (o `{code}` en el body de un POST), nunca por la URL,
  así que no queda en logs ni en el historial del navegador
  (`backend/src/auth.ts:8-13`, `frontend/src/api.ts:9-16`).
- **Fail-closed en producción.** Si `NODE_ENV=production` o hay
  `REPLIT_DEPLOYMENT` y `PASSCODE` no está definido, las rutas de admin
  responden `500 "Server passcode not configured."`; en desarrollo se usa el
  default `roster2026` con una advertencia al arranque
  (`backend/src/config.ts`, `backend/src/auth.ts:24-44`).
- **Aislamiento del alumno por enlace.** El alumno accede a una cohorte por
  `?grupo=<id>`; el front valida la cohorte contra `GET /api/c/:cohort` y, si
  falta, muestra una pantalla para ingresar el código del grupo
  (`frontend/src/App.tsx`). No hay cuentas de alumno.
- **Descargas sin passcode en la URL.** CSV y `backup.json` se bajan por
  `fetch` + blob desde el front, con el header de passcode; no por navegación
  con `?code=` (`frontend/src/api.ts:193-233`).
- **Endurecimiento de auditoría (CC-011), sin dependencias nuevas.** URLs de
  usuario solo `http(s)` (cierra XSS por `href`, RNF-012), anti-inyección de
  fórmulas en CSV (RNF-013), cabeceras de seguridad + CSP + límite de cuerpo
  (RNF-014), rate limiting por IP en POST públicos y `/api/admin` (RNF-015, en
  memoria) y un manejador de error final que no filtra el stack. Ver
  `backend/src/lib/{validate,security,csv}.ts` e `index.ts`.

## Decisiones que ya se cerraron (antes "abiertas")

Estas preguntas quedaron resueltas por la implementación del 2026-07-09:

1. **Formato de llaves y datos actuales.** Las llaves se prefijan por cohorte
   (`cohort:<id>:team:*` / `cohort:<id>:prompt:*`) y el índice vive en la llave
   `cohorts`. Los datos heredados sin prefijo **no se pierden**: se importan a
   una cohorte con `POST /api/admin/migrate-legacy`.
2. **Passcode por clase o global.** Se optó por **un solo passcode de
   instructor** (el profesor es el único admin); el aislamiento del alumno es
   por la cohorte a la que escribe, mediante el enlace. Sin cuentas.
3. **Tipos de actividad.** Se conservan las dos actividades existentes (Día 1 /
   Día 2), ahora por cohorte. Generalizar "actividades como dato" queda como
   trabajo futuro (ver [roadmap.md](roadmap.md)).

**Sin IA:** decisión deliberada del equipo; no se integra IA por ahora. Se
retomaría solo con una idea realmente creativa.

## De dónde viene esta arquitectura

Esta estructura (backend TS/Express + frontend React/Vite en la raíz) es
resultado del [ADR-0003](decisiones/0003-stack-moderno-typescript-react.md)
(2026-07-09), que reemplaza al ADR-0002. La reescritura se hizo **a paridad
funcional** y **en la raíz** (in-place), sustituyendo la app anterior de un solo
archivo (`index.js` + `public/index.html`) que corría sin build. El aislamiento
por cohorte y el endurecimiento de seguridad se construyeron **sobre** esa base,
sin piezas nuevas de infraestructura.

La restricción de plataforma no cambió: sigue siendo Replit como un solo
servicio y **Replit KV** como almacenamiento, ahora con llaves prefijadas por
cohorte y sin base de datos externa.

**Respaldo de la versión anterior:** la app de un solo archivo quedó en el
historial de git, en el commit `37760a9`. Para recuperarla:
`git checkout 37760a9 -- index.js public`. El detalle y las consecuencias de la
decisión están en el
[ADR-0003](decisiones/0003-stack-moderno-typescript-react.md).
