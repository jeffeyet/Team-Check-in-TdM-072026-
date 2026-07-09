# Arquitectura

## Cómo está hoy (verificado)

La app se reescribió a un stack moderno y vive **en la raíz** del repo (backend
TypeScript + Express y frontend React + Vite), reemplazando a la app anterior de
un solo archivo. Corre en Replit como **un solo servicio**, a **paridad
funcional** con la versión previa: mismas rutas `/api`, mismos mensajes de error,
mismos status, mismos límites de caracteres, mismo dedupe y mismos CSV
(verificado con smoke test). Ver [ADR-0003](decisiones/0003-stack-moderno-typescript-react.md).

    ┌──────────────────────────┐      HTTP/JSON      ┌──────────────────────────────┐
    │  Navegador               │ ──────────────────▶ │  backend/ (Express 4 + TS)    │
    │  frontend/ (React 18 +   │                     │  rutas Día 1, Día 2 y admin;  │
    │  Vite) servido como       │ ◀────────────────── │  passcode por request         │
    │  build estático (dist/)   │                     │  (timing-safe SHA-256)        │
    └──────────────────────────┘                     └───────────────┬───────────────┘
                                                                     │
                                                             ┌───────▼────────┐
                                                             │  Replit KV     │
                                                             │  team:* /      │
                                                             │  prompt:*      │
                                                             └────────────────┘

- **Un solo servicio:** el backend compila a `backend/dist/` y, en producción,
  sirve el build del frontend (`frontend/dist/`) como estático más un fallback
  SPA; sobre eso expone el API (`backend/src/index.ts`).
- **Sin sesiones:** cada request de admin lleva el passcode (query o body); la
  verificación es timing-safe sobre SHA-256 (`backend/src/auth.ts`).
- **Despliegue:** Replit Autoscale. El `.replit` corre un solo flujo:
  `npm run install:all && npm run build && npm run start` (ver
  [operacion.md](operacion.md)).

### Estructura del código

| Carpeta / archivo | Responsabilidad |
|---|---|
| `backend/src/index.ts` | Arranque de Express; sirve `frontend/dist` + fallback SPA |
| `backend/src/config.ts` | Configuración (`PASSCODE`, `PORT`) |
| `backend/src/db.ts` | Wrapper de `@replit/database` (Replit KV) |
| `backend/src/auth.ts` | `checkCode` timing-safe (SHA-256) |
| `backend/src/routes/teams.ts` | Rutas Día 1: submit, teamnames, roster, export.csv, clear |
| `backend/src/routes/prompts.ts` | Rutas Día 2: prompt-submit, prompt-roster, prompt-export.csv, prompt-clear |
| `backend/src/services/{teams,prompts}.ts` | Lógica de datos (lectura/escritura, dedupe) sobre el KV |
| `backend/src/lib/{csv,respond}.ts` | Helpers de CSV y de respuesta JSON |
| `frontend/src/App.tsx` | Router por estado; vista por defecto `day2` |
| `frontend/src/views/{Day1,Day2,Admin}.tsx` | Las tres vistas |
| `frontend/src/api.ts` | Cliente `fetch` tipado del API |
| `frontend/src/styles.css` | CSS portado verbatim del original |
| `frontend/vite.config.ts` | Build; en dev, proxy `/api` → `:3000` |
| `package.json` (raíz) | Orquestador: `install:all`, `build`, `start`, `dev:*`, `typecheck` |

## Modelo de datos actual (verificado)

| Llave | Valor | Escrita por |
|---|---|---|
| `team:<ts>_<rand>` | `{teamName ≤120, idea ≤240, members[≤6]{name ≤120, linkedin ≤300, isPM}, ts}` | `POST /api/submit` |
| `prompt:<ts>_<rand>` | `{teamName ≤120, idea ≤240, docUrl ≤500, ts}` | `POST /api/prompt-submit` |

Particularidades que conviene conocer:

- **El "dedupe" del roster es de lectura**: si un equipo se registra dos
  veces, ambas llaves quedan en el KV; el roster y el CSV del Día 1 muestran
  solo la más reciente por nombre (case-insensitive)
  (`backend/src/services/teams.ts`). Las bitácoras del Día 2, en cambio, se
  muestran todas (`backend/src/services/prompts.ts`).
- **Lecturas O(n)**: cada consulta lista las llaves y hace un `get` por cada
  una (servicios `teams`/`prompts` sobre `backend/src/db.ts`). A la escala del
  curso (decenas de equipos) es suficiente.
- Tabla completa del API: [`README.md` de la raíz](../README.md).

## Dirección técnica (propuesta — pendiente de requisitos y ADRs)

La visión se implementa **sobre esta misma arquitectura**, sin piezas nuevas:

- **Actividades como datos:** registros `activity:*` en el KV (tipo, título,
  instrucciones, ventana de apertura/cierre); las rutas se generalizan para
  servir cualquier actividad en lugar de una por día.
- **Aislamiento por clase:** prefijo de clase en las llaves (p. ej.
  `c:<código>:team:*`) y acceso del alumno mediante el código de su clase.
- **Admin más fino:** borrado por llave individual además del borrado total.

Decisiones abiertas (cada una se cierra con un ADR cuando el equipo defina
los requisitos en la sesión de F1):

1. Formato exacto de las llaves y qué pasa con los datos actuales: ¿las
   llaves `team:*` / `prompt:*` se migran a una "clase 07/2026" o se
   congelan como legado legible?
2. ¿Passcode por clase o passcode global? ¿Dónde y cómo se guarda?
3. ¿Qué tipos de actividad cubre la primera versión: los dos existentes
   generalizados, u otros más?

## De dónde viene esta arquitectura

Esta estructura (backend TS/Express + frontend React/Vite en la raíz) es
resultado del [ADR-0003](decisiones/0003-stack-moderno-typescript-react.md)
(2026-07-09), que reemplaza al ADR-0002. La reescritura se hizo **a paridad
funcional** y **en la raíz** (in-place), sustituyendo la app anterior de un solo
archivo (`index.js` + `public/index.html`) que corría sin build. El stack
moderno vive directamente en la raíz; no hay una carpeta aparte.

La restricción de plataforma no cambió: sigue siendo Replit como un solo
servicio y **Replit KV** como almacenamiento, con las mismas llaves `team:*` /
`prompt:*` y sin base de datos externa.

**Respaldo de la versión anterior:** la app de un solo archivo quedó en el
historial de git, en el commit `37760a9`. Para recuperarla:
`git checkout 37760a9 -- index.js public`. Ya no existe una copia en el árbol de
trabajo. El detalle y las consecuencias honestas de la decisión están en el
[ADR-0003](decisiones/0003-stack-moderno-typescript-react.md).
