# Requisitos no funcionales (RNF)

Línea base redactada desde el código el 2026-07-08. El 2026-07-09 las
referencias de **Fuente** se remapearon al stack moderno
([ADR-0003](../decisiones/0003-stack-moderno-typescript-react.md)), que ahora
vive en la raíz (`backend/` Express + TypeScript, `frontend/` React + Vite).

**Actualización 2026-07-09 ([CC-003](../cambios/CC-003-cohortes.md), [CC-004](../cambios/CC-004-seguridad-acceso.md), [ADR-0004](../decisiones/0004-aislamiento-por-cohorte.md)):**
el aislamiento por cohorte y el endurecimiento del acceso agregaron cuatro
requisitos nuevos —**RNF-007 … RNF-010**— y resolvieron dos "límites conocidos"
de la línea base (passcode en query string y borrado sin respaldo), que se
actualizan al final del documento. Las **Fuente** de los RNF de línea base se
ajustaron a las líneas actuales del código reorganizado. Convenciones:
[README.md](README.md).

**Actualización 2026-07-09 ([CC-005](../cambios/CC-005-dia3-github-onboarding.md), [CC-006](../cambios/CC-006-materiales-profesor.md)):**
el Día 3 (guía) y los materiales del profesor formalizan una cualidad que ya era
decisión del equipo: **sin IA en tiempo de ejecución**. Se añade **RNF-011**.

---

## RNF-001 · Simplicidad del stack

- **Descripción:** la app se mantiene deliberadamente pequeña y de piezas
  conocidas: **un solo servicio** en Replit (el backend compila el frontend y
  lo sirve), backend con dependencias de producción mínimas y frontend con un
  framework estándar (React), sin infraestructura extra ni servicios
  adicionales.
- **Criterios de aceptación:**
  - Desde la raíz, `npm run build` + `npm start` bastan para construir y
    correr todo como un único proceso Node que sirve `frontend/dist`.
  - El backend mantiene exactamente 2 dependencias de producción
    (`express`, `@replit/database`).
  - El frontend usa solo React (`react`, `react-dom`) como dependencias de
    producción; sin librerías de estado, routing ni UI adicionales.
- **Estado:** implementado (redacción actualizada por ADR-0003).
- **Fuente:** `package.json` (raíz: scripts `build`/`start`),
  `backend/package.json` (2 deps de producción),
  `frontend/package.json` (solo React), `.replit` (un solo servicio).
- **Nota:** el [ADR-0003](../decisiones/0003-stack-moderno-typescript-react.md)
  cambió este requisito. La redacción original ("sin build step, sin
  frameworks, sin TypeScript; frontend en un solo archivo estático") ya **no
  aplica**: ahora hay build (`vite build` + `tsc`), TypeScript en todo el
  código y React en el frontend. Lo que se conserva es el *espíritu*:
  mínimas piezas, un solo servicio y dependencias acotadas.

## RNF-002 · Verificación del passcode resistente a timing

- **Descripción:** la comparación del passcode no filtra información por
  tiempo de respuesta.
- **Criterios de aceptación:** la comparación usa hashes SHA-256 y
  `crypto.timingSafeEqual`, con longitud constante (los digests SHA-256 tienen
  siempre 32 bytes, sin retorno temprano).
- **Estado:** implementado.
- **Fuente:** `backend/src/auth.ts:16-21` (`checkCode`: hash SHA-256 de ambos
  valores y `crypto.timingSafeEqual`).

## RNF-003 · Neutralización de HTML en datos de usuario

- **Descripción:** todo dato capturado por usuarios se muestra como texto y
  nunca se interpreta como HTML al insertarse en el DOM.
- **Criterios de aceptación:** un nombre de equipo como `<b>hola</b>` se
  muestra literal, sin interpretarse como HTML (cubierto por el paso 6 de la
  [checklist de humo](../pruebas/checklist-humo.md)).
- **Estado:** implementado (redacción actualizada por ADR-0003).
- **Fuente:** el escape lo da automáticamente React al renderizar los datos
  con `{valor}` (JSX): p. ej. `frontend/src/views/Admin.tsx:370` (nombre de
  equipo), `:383-385` (idea), `:389` (nombre de miembro), `:497` (idea
  revisada). No se usa `dangerouslySetInnerHTML` en ningún archivo de
  `frontend/src`.
- **Nota:** el [ADR-0003](../decisiones/0003-stack-moderno-typescript-react.md)
  cambió el mecanismo. Antes el escape era manual, con la función `esc()` del
  frontend de un solo archivo; ahora lo garantiza el escape por defecto de
  React (JSX). El comportamiento observable es el mismo.

## RNF-004 · Límites de tamaño en el servidor

- **Descripción:** el servidor trunca toda entrada de usuario a longitudes
  máximas, independientemente de lo que valide la interfaz.
- **Criterios de aceptación:** nombre de equipo ≤120, idea ≤240, nombre de
  miembro ≤120, LinkedIn ≤300, enlace de documento ≤500 caracteres; máximo
  6 miembros por equipo. Además, la etiqueta de cohorte se trunca a 120.
- **Estado:** implementado.
- **Fuente:** `backend/src/routes/student.ts:47-61` (equipo/idea/miembro/LinkedIn
  y `.slice(0, 6)` de miembros en el Día 1), `:80-85` (equipo/idea/enlace del
  Día 2); `backend/src/services/cohorts.ts:54` y `:81-82` (etiqueta de cohorte
  a 120).

## RNF-005 · Operable con teclado (parcial)

- **Descripción:** los controles de navegación no nativos son accesibles con
  teclado.
- **Criterios de aceptación:** las pestañas (día y admin) tienen
  `role="tab"`, `aria-selected` y responden a Enter/Espacio; los campos de
  formulario tienen `label`.
- **Estado:** implementado. Cobertura parcial: no se ha hecho una auditoría
  completa de accesibilidad.
- **Fuente:** `frontend/src/ui.tsx:5-12` (`keyActivate`, Enter/Espacio) y
  `:47-80` (`DayTabs` con `role="tab"`/`aria-selected`);
  `frontend/src/views/Admin.tsx:19-26` (`keyActivate`) y `:617-640` (pestañas
  del panel de instructor); `label` con `htmlFor` en los formularios
  (`frontend/src/views/Day1.tsx:136,181,211`,
  `frontend/src/views/Day2.tsx:92,110,128`).

## RNF-006 · Escala del curso

- **Descripción:** el sistema atiende la escala real del curso (decenas de
  equipos por cohorte) sin optimizaciones adicionales.
- **Criterios de aceptación:** las vistas de instructor cargan en tiempos
  razonables con decenas de registros. Cada consulta lee el KV llave por llave
  (O(n) `get`s por request), pero **acotado al prefijo de la cohorte**: ya no
  hay un barrido global de todas las llaves en las **lecturas de datos por
  cohorte** como en la línea base. (Excepción intencional: el respaldo completo
  `buildBackup` con `db.list("")` y la migración `migrateLegacy` con
  `db.list("team:")`/`db.list("prompt:")` sí barren llaves amplias; son
  operaciones de admin, ver RF-016/RF-017.)
- **Estado:** implementado (actualizado por CC-003: lecturas por prefijo de
  cohorte).
- **Fuente:** `backend/src/services/teams.ts:6-15` (`loadTeams`: un `get` por
  cada llave `cohort:<id>:team:`), `backend/src/services/prompts.ts:6-19`
  (`loadPrompts`: un `get` por cada llave `cohort:<id>:prompt:`),
  `backend/src/services/cohorts.ts:8-16` (helpers de prefijo).

---

## RNF-007 · Fail-closed del passcode en producción

- **Descripción:** en producción, la ausencia de un passcode configurado
  deshabilita por completo el acceso de instructor, en vez de recurrir a un
  default débil.
- **Criterios de aceptación:**
  - Si `NODE_ENV=production` o existe `REPLIT_DEPLOYMENT`, y `PASSCODE` no está
    definido (o está vacío), toda ruta de admin responde 500
    `Server passcode not configured.` (JSON o texto según la ruta).
  - En desarrollo (sin producción y sin `PASSCODE`) se usa el default
    `roster2026` con una advertencia clara al arranque.
- **Estado:** implementado.
- **Fuente:** `backend/src/config.ts:6-15` (`IS_PRODUCTION`,
  `PASSCODE_CONFIGURED`, `PASSCODE`), `:20-32` (`warnPasscodeAtStartup`),
  `backend/src/auth.ts:24-26` (`passcodeUnavailable`), `:30-32` y `:39-41`
  (respuesta 500 en `requirePasscode`/`requirePasscodeText`).

## RNF-008 · Passcode fuera de la URL

- **Descripción:** el passcode nunca viaja por la query string, para que no
  quede en URLs, historiales de navegador ni logs de acceso.
- **Criterios de aceptación:**
  - El servidor lee el passcode solo del header `X-Passcode` o del body JSON
    (`code`); nunca de `req.query`.
  - El cliente envía el passcode por el header `X-Passcode` en todas las rutas
    de admin, y las descargas (CSV, backup) se hacen por `fetch`+blob, sin
    `?code=` en la URL.
- **Estado:** implementado.
- **Fuente:** `backend/src/auth.ts:8-13` (`readCode`: header o body, nunca
  query); `frontend/src/api.ts:9-16` (`authHeaders` con `X-Passcode`),
  `:193-233` (`downloadBlob` y exports/backup por blob con el header).

## RNF-009 · Higiene de secretos y datos exportados

- **Descripción:** los exports con datos personales (PII) no se versionan; el
  passcode real no vive en el repositorio.
- **Criterios de aceptación:**
  - `.gitignore` ignora `*.csv`, de modo que los CSV exportados (que contienen
    nombres, LinkedIn e ideas) no se suben al fork público.
  - El passcode de producción se provee por Secret (`PASSCODE`), no en código
    (el default `roster2026` es solo para desarrollo; ver RNF-007).
- **Estado:** implementado.
- **Fuente:** `.gitignore:6` (`*.csv`); `backend/src/config.ts:1-15`
  (`PASSCODE` desde `process.env`, default solo en desarrollo).

## RNF-010 · Degradación ante fallo del KV (no crashea el servidor)

- **Descripción:** un fallo de lectura o escritura del KV se contiene en el
  handler y no derriba el proceso; el cliente recibe un error controlado.
- **Criterios de aceptación:**
  - Toda ruta que toca el KV está envuelta en `try/catch`: en error devuelve un
    status apropiado (500 `Save failed.` / `Load failed.` / `Export failed.` /
    `Backup failed.` / etc.) sin propagar la excepción.
  - `GET /api/c/:cohort/teamnames` degrada a `{names: []}` en cualquier error,
    para que el formulario del Día 2 siga funcionando.
  - Fuera de Replit (sin `REPLIT_DB_URL`) las escrituras fallan de forma
    esperada como `Save failed.` y las lecturas devuelven vacío, sin crash.
- **Estado:** implementado.
- **Fuente:** `backend/src/routes/student.ts:12-18,31-33,38-66,71-90`
  (try/catch por handler; `{names:[]}` en `:32`),
  `backend/src/routes/admin.ts:24-35,40-47,52-59,64-70,75-81,89-118,126-145,153-163,168-174,179-186,191-198`
  (try/catch en cada ruta de admin), `backend/src/db.ts:3-5` (cliente único;
  el fallo fuera de Replit es esperado y se maneja arriba).

---

## RNF-011 · Sin IA en tiempo de ejecución (contenido pre-escrito)

- **Descripción:** la app **no** usa IA en tiempo de ejecución. Todo el contenido
  que ve el alumno (la guía del Día 3 y los materiales del profesor) es texto
  **pre-escrito**, autorado en desarrollo (con o sin ayuda de IA); ningún
  componente genera texto ni llama a un servicio de IA en runtime. Formaliza la
  decisión deliberada de no integrar IA registrada en `CLAUDE.md`.
- **Criterios de aceptación:**
  - No hay dependencias de SDK de IA en `frontend/package.json` ni
    `backend/package.json`.
  - El contenido de las guías vive como datos pre-escritos
    (`frontend/src/content/days.ts`); los materiales, al implementarse, como texto
    en el manifest (ver [RF-020](funcionales.md#rf-020--materiales-del-profesor-por-día)).
    Nada se genera al vuelo.
  - Los diagramas son SVG inline o imágenes autoradas, no render de
    Markdown/Mermaid en el cliente.
- **Estado:** implementado (la cualidad se cumple hoy: la guía del Día 3 es
  contenido pre-escrito y no hay IA en el código; los materiales heredarán la
  misma regla al construirse).
- **Fuente:** `frontend/src/content/days.ts` (contenido pre-escrito), ausencia de
  dependencias de IA en `frontend/package.json` y `backend/package.json`,
  `CLAUDE.md` ("No AI (deliberate)"). Origen:
  [CC-005](../cambios/CC-005-dia3-github-onboarding.md) /
  [CC-006](../cambios/CC-006-materiales-profesor.md) /
  [ADR-0006](../decisiones/0006-materiales-estaticos-sin-upload.md).

---

## Límites conocidos (observaciones; no son requisitos)

Comportamientos reales de la app hoy que la línea base **no** garantiza como
cualidades (registrados aquí como hechos, no como trabajo planeado; su
priorización futura se decide en [F1 del roadmap](../roadmap.md)):

- No hay rate limiting en ningún endpoint (envíos públicos ni intentos de
  passcode).
- Los re-envíos del Día 1 dejan llaves antiguas en el KV que ya no se muestran
  (solo la más reciente por nombre **dentro de la cohorte**), pero siguen
  ocupando espacio. El instructor puede borrarlas una a una (RF-014).
- El aislamiento entre cohortes es por *conocimiento del id* del grupo: quien
  conozca (o adivine) el slug de una cohorte activa puede escribir en ella y
  leer sus nombres de equipo por `GET /api/c/:cohort/teamnames` (rutas de alumno
  sin passcode, por diseño). Las vistas de instructor sí exigen passcode.

### Añadidos por la revisión de cohortes (2026-07-09)

Hallazgos de la revisión multiagente de la lógica de cohortes, confirmados
contra el código. Son riesgos de baja probabilidad a la escala del curso (un
instructor, pocas cohortes) o límites intencionales; se registran como hechos.
Ninguno es una fuga de datos entre cohortes ni una escritura cruzada.

- **Índice `cohorts` sin atomicidad (concurrencia).** El índice vive en una sola
  llave con lectura-modificación-escritura sin compare-and-set (Replit KV no
  ofrece transacciones; `backend/src/services/cohorts.ts:34-36`,
  `backend/src/db.ts:87-101`). Operaciones de gestión simultáneas (dos pestañas
  del instructor, doble clic en "crear", o crear+archivar a la vez) pueden perder
  una entrada del índice por *last-write-wins*, y el check-then-set de
  `createCohort` (`:61-73`) no garantiza unicidad bajo concurrencia. Los datos
  `cohort:<id>:*` no se destruyen y son recuperables vía
  `GET /api/admin/backup.json`. Mitigación: un solo instructor, una pestaña a la
  vez.
- **`migrateLegacy` no atómico ni idempotente.** Mueve cada llave con `set`+`del`
  independientes, sin transacción ni marca de progreso
  (`backend/src/services/cohorts.ts:140-147`); un fallo del KV entre ambos deja un
  registro **duplicado** (en legado y prefijado). Además vuelca **todo**
  `team:*`/`prompt:*` heredado en una sola cohorte destino (no separa ediciones
  previas; los homónimos se colapsan al deduplicar). Es una acción de adopción de
  una sola vez; conviene respaldar antes (RF-016).
- **`teamnames` no aplica el gate de archivado.** `GET /api/c/:cohort/teamnames`
  (`backend/src/routes/student.ts:23-34`) no pasa por `getActiveCohort`, así que
  devuelve los nombres de equipo de una cohorte **archivada** a quien conozca el
  slug (sin passcode). Solo expone nombres de equipo; miembros, LinkedIn e ideas
  siguen protegidos por passcode en admin. Matiza [RF-015](funcionales.md#rf-015--archivar-cohorte-borrado-suave).
  Corrección posible (vía CC): añadir `getActiveCohort` al handler.
- **Normalización del id solo en la resolución.** `getCohort`/`getActiveCohort`
  normalizan con `slugify` (`cohorts.ts:41`), pero las lecturas/borrados por
  prefijo (`loadTeams`, `loadPrompts`, `countCohort`, `deleteSubmission`) y
  `updateCohort`/`archiveCohort` asumen que el caller ya pasa el slug **canónico**
  (la UI siempre lo hace). Un id no canónico (p. ej. `Julio-2026`) resuelve la
  cohorte pero devuelve lista vacía o 404 espurio, **sin** fuga entre cohortes ni
  escritura cruzada (las escrituras usan el `cohort.id` ya resuelto). La
  verificación anti-borrado-cruzado de `deleteSubmission` es correcta.
- **`teamCount` puede exceder las filas visibles del roster.** `countCohort`
  (`cohorts.ts:98-106`) cuenta las llaves crudas del prefijo (incluye reenvíos),
  mientras que el roster deduplica por nombre (última gana), así que el conteo por
  cohorte del panel puede ser mayor que el número de equipos mostrados. Un
  **reenvío** del Día 1 eclipsa el envío anterior del mismo nombre en roster y
  CSV aunque el nuevo sea menos completo (el previo persiste en el KV,
  recuperable por RF-016 / borrable por RF-014). Los truncados del envío son
  **silenciosos**: idea ≤240, LinkedIn ≤300 y `members.slice(0,6)` descarta
  miembros extra sin aviso al alumno ni al instructor.

### Resueltos el 2026-07-09 (antes eran límites; ya no aplican)

- **Passcode en query string** → resuelto por RNF-008: el passcode viaja por el
  header `X-Passcode` (o body), nunca por la URL.
- **"Clear" sin deshacer ni respaldo** → resuelto por CC-003: se eliminó el
  borrado total destructivo (antiguo [RF-008](funcionales.md#rf-008--borrado-total-por-día--reemplazado))
  y se sustituyó por archivar cohorte / borrado suave (RF-015), borrado
  individual de envíos (RF-014) y respaldo completo JSON (RF-016).
