# Requisitos funcionales (RF)

Línea base redactada desde el código el 2026-07-08. El 2026-07-09 las
referencias de **Fuente** se remapearon al stack moderno ([ADR-0003](../decisiones/0003-stack-moderno-typescript-react.md)),
que reemplazó a la app de un solo archivo y ahora vive en la raíz
(`backend/` con Express + TypeScript, `frontend/` con React + Vite).

**Actualización 2026-07-09 ([CC-003](../cambios/CC-003-cohortes.md), [ADR-0004](../decisiones/0004-aislamiento-por-cohorte.md)):**
el mismo día se incorporó el **aislamiento por cohorte** (cada grupo/edición
es una caja de datos separada, con llaves `cohort:<id>:team:*` y
`cohort:<id>:prompt:*`) y un **endurecimiento del acceso** de instructor. Esto
**cambió** varias rutas `/api` y el comportamiento de varios requisitos de la
línea base:

- Las rutas de alumno ahora están bajo `/api/c/:cohort` (`backend/src/routes/student.ts`)
  y las de instructor bajo `/api/admin` (`backend/src/routes/admin.ts`); se
  eliminaron los routers globales previos (`routes/teams.ts`, `routes/prompts.ts`).
- El passcode viaja por el header `X-Passcode` (o `{code}` en el body), nunca
  por query string.
- El borrado total destructivo (antiguo RF-008) se **eliminó** y se reemplazó
  por archivar cohorte (borrado suave) y borrado individual de envíos.

Los requisitos afectados llevan su texto y su **Fuente** actualizados abajo; los
requisitos nuevos de esta entrega son **RF-011 … RF-017**.

Convenciones y ciclo de vida: [README.md](README.md).

---

## RF-001 · Check-in de equipo (Día 1)

- **Descripción:** un integrante registra a su equipo dentro de una cohorte:
  nombre del equipo, 1–6 miembros (nombre obligatorio, LinkedIn opcional) y la
  idea del equipo en una frase. La interfaz permite marcar a lo más un PM
  (marcar uno desmarca a los demás); el servidor no valida esa unicidad —
  guarda tal cual los miembros que reciba. El envío se escribe en la caja de la
  cohorte indicada en la ruta.
- **Criterios de aceptación:**
  - Responde HTTP 404 `Group not found.` si la cohorte de la ruta no existe o
    está archivada.
  - Rechaza el envío (HTTP 400) si falta el nombre de equipo, la lista de
    miembros está vacía o falta la idea.
  - Trunca: nombre de equipo a 120, idea a 240, nombre de miembro a 120,
    LinkedIn a 300 caracteres; acepta máximo 6 miembros.
  - En la interfaz, marcar PM en un miembro desmarca a los demás.
  - El envío exitoso muestra confirmación y permite registrar otro equipo.
- **Estado:** implementado (actualizado por CC-003: ahora por cohorte).
- **Fuente:** `backend/src/routes/student.ts:37-67` (`POST /api/c/:cohort/submit`;
  404 de cohorte en `:39-40`, validación 400 en `:42-46`, truncados en `:47-61`,
  guardado en `:62`), `backend/src/services/teams.ts:27-31` (`saveTeam` con
  prefijo de cohorte); `frontend/src/views/Day1.tsx:125-239` (formulario),
  `:58-65` (regla de un solo PM), `:67-100` (validación de la interfaz y llamada
  `submitTeam(cohort.id, …)`).

## RF-002 · Autocompletado de nombres de equipo (por cohorte)

- **Descripción:** el sistema expone la lista pública de nombres de equipo
  registrados **en una cohorte**, y el formulario del Día 2 de esa misma
  cohorte la ofrece como autocompletado.
- **Criterios de aceptación:**
  - `GET /api/c/:cohort/teamnames` devuelve los nombres de esa cohorte sin
    duplicados exactos (distingue mayúsculas y espacios, a diferencia del dedupe
    del roster) y ordenados lexicográficamente por punto de código (las
    mayúsculas van antes que las minúsculas); no requiere passcode.
  - Ante un error interno devuelve `{names: []}` y la interfaz sigue
    funcionando.
- **Estado:** implementado (actualizado por CC-003: ahora por cohorte).
- **Fuente:** `backend/src/routes/student.ts:23-34` (`Set` + `.sort()` por
  defecto, sin passcode, `{names:[]}` en error, lectura por prefijo de cohorte);
  `frontend/src/views/Day2.tsx:103-107` (`<datalist>`),
  `frontend/src/api.ts:36-44` (`getTeamNames(cohort)`).

## RF-003 · Bitácora de prompts (Día 2)

- **Descripción:** un equipo envía, dentro de su cohorte, el enlace al Google
  Doc con la sesión de 20 prompts y su idea revisada en una frase.
- **Criterios de aceptación:**
  - Responde HTTP 404 `Group not found.` si la cohorte de la ruta no existe o
    está archivada.
  - Rechaza el envío (HTTP 400) si falta el equipo, la idea revisada o el
    enlace.
  - Trunca: equipo a 120, idea a 240, enlace a 500 caracteres.
  - El envío exitoso muestra confirmación; se permiten varios envíos del
    mismo equipo (todos se conservan y se listan).
- **Estado:** implementado (actualizado por CC-003: ahora por cohorte).
- **Fuente:** `backend/src/routes/student.ts:70-91`
  (`POST /api/c/:cohort/prompt-submit`; 404 de cohorte en `:72-73`, validación
  400 en `:75-79`, truncados en `:80-85`, guardado en `:86`),
  `backend/src/services/prompts.ts:21-25` (`savePrompt` con prefijo de cohorte);
  `frontend/src/views/Day2.tsx:81-157` (formulario), `:30-56` (validación de la
  interfaz y llamada `submitPrompt(cohort.id, …)`).

## RF-004 · Roster de equipos para el instructor (por cohorte)

- **Descripción:** con el passcode, el instructor ve los equipos del Día 1 **de
  una cohorte**: estadísticas (equipos, estudiantes, PMs nombrados) y una
  tarjeta por equipo con idea, miembros, insignia del PM y enlaces de LinkedIn.
- **Criterios de aceptación:**
  - El passcode se envía por el header `X-Passcode`; sin passcode válido
    responde HTTP 401. Si la cohorte no existe, HTTP 404 `Cohort not found.`
  - La lista se deduplica por nombre de equipo (case-insensitive) **dentro de
    la cohorte**: se muestra la entrada más reciente de cada nombre, en orden
    alfabético. (El dedupe por cohorte corrige el bug previo en que equipos
    homónimos de distintas cohortes colisionaban en un dedupe global.)
  - Los enlaces de LinkedIn abren en pestaña nueva.
- **Estado:** implementado (actualizado por CC-003: por cohorte + auth por
  header).
- **Fuente:** `backend/src/routes/admin.ts:63-71`
  (`GET /api/admin/cohorts/:id/roster`, `requirePasscode`, 404 de cohorte en
  `:66`), `backend/src/services/teams.ts:19-25` (`dedupeTeams`: última por
  nombre en minúsculas, orden alfabético; per-cohorte porque `loadTeams` lee por
  prefijo, `:6-15`); `backend/src/auth.ts:29-35` (`requirePasscode`);
  `frontend/src/views/Admin.tsx:299-406` (`TeamsTab`: estadísticas y tarjetas;
  LinkedIn con `target="_blank"` en `:391-393`).

## RF-005 · Vista de bitácoras para el instructor (por cohorte)

- **Descripción:** con el passcode, el instructor ve todas las entregas del
  Día 2 **de una cohorte**, agrupadas por equipo, con la idea revisada y el
  enlace al documento.
- **Criterios de aceptación:**
  - El passcode se envía por el header `X-Passcode`; sin passcode válido
    responde HTTP 401. Si la cohorte no existe, HTTP 404 `Cohort not found.`
  - Se muestran todas las entregas de la cohorte (sin deduplicar), agrupadas por
    equipo y ordenadas por nombre de equipo y fecha.
  - El enlace al documento abre en pestaña nueva.
- **Estado:** implementado (actualizado por CC-003: por cohorte + auth por
  header).
- **Fuente:** `backend/src/routes/admin.ts:74-82`
  (`GET /api/admin/cohorts/:id/prompts`, `requirePasscode`, 404 de cohorte en
  `:77`), `backend/src/services/prompts.ts:6-19` (`loadPrompts`: lectura por
  prefijo de cohorte, orden por nombre de equipo y luego fecha, sin dedupe);
  `frontend/src/views/Admin.tsx:410-531` (`PromptsTab`: agrupación por equipo
  en `:449-456`, enlace con `target="_blank"` en `:500-507`).

## RF-006 · Export CSV del Día 1 (por cohorte)

- **Descripción:** con el passcode, descarga de los check-ins **de una cohorte**
  en CSV, una fila por miembro.
- **Criterios de aceptación:**
  - Columnas: `team, member, linkedin, isPM, idea, submittedAt`; comillas
    escapadas; el servidor entrega el archivo como `team-checkins.csv` y el front
    lo guarda como `<id>-team-checkins.csv`.
  - Aplica el mismo dedupe por equipo que el roster (RF-004), acotado a la
    cohorte.
  - El passcode se envía por el header `X-Passcode` y la descarga se hace por
    `fetch`+blob (el passcode no viaja en la URL); sin passcode válido responde
    HTTP 401.
- **Estado:** implementado (actualizado por CC-003: por cohorte + descarga por
  blob).
- **Fuente:** `backend/src/routes/admin.ts:85-119`
  (`GET /api/admin/cohorts/:id/export/teams.csv`, `requirePasscodeText`,
  cabecera y nombre de archivo en `:109-113`),
  `backend/src/lib/csv.ts:2-6` (escapado de comillas),
  `backend/src/services/teams.ts:19-25` (mismo `dedupeTeams`);
  `frontend/src/api.ts:193-217` (`downloadBlob`/`exportTeamsCsv`, header
  `X-Passcode` y nombre `<id>-team-checkins.csv`).

## RF-007 · Export CSV del Día 2 (por cohorte)

- **Descripción:** con el passcode, descarga de las bitácoras **de una cohorte**
  en CSV, una fila por entrega.
- **Criterios de aceptación:**
  - Columnas: `team, revisedIdea, docUrl, submittedAt`; comillas escapadas; el
    servidor entrega el archivo como `prompt-logs.csv` y el front lo guarda como
    `<id>-prompt-logs.csv`.
  - El passcode se envía por el header `X-Passcode` y la descarga se hace por
    `fetch`+blob; sin passcode válido responde HTTP 401.
- **Estado:** implementado (actualizado por CC-003: por cohorte + descarga por
  blob).
- **Fuente:** `backend/src/routes/admin.ts:122-146`
  (`GET /api/admin/cohorts/:id/export/prompts.csv`, `requirePasscodeText`,
  cabecera y nombre de archivo en `:139-140`),
  `backend/src/lib/csv.ts:2-6` (escapado de comillas);
  `frontend/src/api.ts:219-225` (`exportPromptsCsv`, nombre
  `<id>-prompt-logs.csv`).

## RF-008 · Borrado total por día — *reemplazado*

- **Estado:** **reemplazado** por [CC-003](../cambios/CC-003-cohortes.md). El borrado
  total destructivo se eliminó del sistema.
- **Descripción original (línea base, ya no aplica):** con el passcode, el
  instructor podía borrar todos los check-ins (`POST /api/clear`) o todas las
  bitácoras (`POST /api/prompt-clear`), eliminando todas las llaves `team:*` o
  `prompt:*`. No había deshacer ni respaldo.
- **Motivo del reemplazo:** el borrado total sin respaldo era el riesgo de
  pérdida de datos más grave del portal. CC-003 lo sustituye por operaciones no
  destructivas y de grano fino:
  - **RF-015 · Archivar cohorte (borrado suave):** ocultar un grupo sin destruir
    sus datos.
  - **RF-014 · Borrado individual de envíos:** eliminar una entrega concreta,
    con confirmación.
  - **RF-016 · Respaldo completo JSON:** exportar todo antes de cualquier
    limpieza.
- **Nota:** este requisito **no se borra** del documento; se conserva marcado
  como reemplazado para mantener la historia. Las rutas `POST /api/clear` y
  `POST /api/prompt-clear` y sus servicios `clearTeams`/`clearPrompts` ya no
  existen en `backend/src`.

## RF-009 · Acceso de instructor por passcode (header)

- **Descripción:** las vistas y rutas de instructor se protegen con un passcode
  único, configurable por Secret (`PASSCODE`). El passcode se transmite fuera de
  la URL.
- **Criterios de aceptación:**
  - El passcode se acepta en el header `X-Passcode` (preferente) o en el body
    JSON (`code`) en POST; **nunca** se lee de la query string, así que no queda
    en URLs, historiales ni logs de acceso.
  - Passcode incorrecto: HTTP 401 (`Bad passcode.` en JSON, `Unauthorized` en
    rutas de texto/CSV) y mensaje en la interfaz.
  - Comparación timing-safe con hashes SHA-256 (ver [RNF-002](no-funcionales.md#rnf-002--verificación-del-passcode-resistente-a-timing)).
  - En producción sin `PASSCODE` configurado, las rutas de admin responden 500
    `Server passcode not configured.` (fail-closed; ver
    [RNF-007](no-funcionales.md#rnf-007--fail-closed-del-passcode-en-producción)).
- **Estado:** implementado (actualizado por CC-003: passcode por header, no por
  query).
- **Fuente:** `backend/src/config.ts:4-15` (`PASSCODE`, `IS_PRODUCTION`,
  `PASSCODE_CONFIGURED`), `backend/src/auth.ts:8-13` (`readCode`: header
  `x-passcode` o `req.body.code`, nunca query), `:16-21` (comparación
  timing-safe), `:29-44` (`requirePasscode`/`requirePasscodeText`, 401/500);
  `frontend/src/api.ts:9-16` (`authHeaders` con `X-Passcode`),
  `frontend/src/views/Admin.tsx:30-87` (puerta de passcode y mensaje).

## RF-010 · Navegación del portal (alumno por cohorte)

- **Descripción:** la interfaz es una SPA. Las vistas de alumno (Día 1 y Día 2)
  operan dentro de una cohorte tomada de `?grupo=<id>` en la URL; la vista de
  instructor es independiente de la cohorte. La navegación no recarga la página.
- **Criterios de aceptación:**
  - Al abrir `/` se muestra la vista del Día 2 (vista por defecto).
  - Si falta `?grupo=` o la cohorte no es válida/activa, las vistas de alumno
    muestran una pantalla para ingresar el código del grupo (ver
    [RF-012](#rf-012--acceso-del-alumno-por-cohorte)); no se muestra el
    formulario hasta resolver una cohorte activa.
  - Las pestañas Monday/Tuesday cambian de vista; "Instructor view" lleva a la
    puerta de passcode y "Back" regresa.
- **Estado:** implementado (actualizado por CC-003: flujo de alumno por
  cohorte).
- **Fuente:** `frontend/src/App.tsx:15-117` (router por estado; vista por
  defecto `day2` en `:17`; lectura de `?grupo=` en `:11-13` y `:22-38`;
  verificación de cohorte en `:41-63`; gate/loading en `:84-97`),
  `frontend/src/ui.tsx:47-80` (`DayTabs` Monday/Tuesday) y `:40-42` (botón
  "Instructor view ↔ Back").

---

## RF-011 · Gestión de cohortes (instructor)

- **Descripción:** con el passcode, el instructor crea, lista y renombra
  cohortes (grupos/ediciones), y obtiene para cada una un enlace para compartir
  con los alumnos. Cada cohorte es una caja de datos aislada
  (`{id, label, createdAt, archived}` en el índice `cohorts`). El archivado se
  detalla en [RF-015](#rf-015--archivar-cohorte-borrado-suave).
- **Criterios de aceptación:**
  - `GET /api/admin/cohorts` lista las cohortes con su conteo de equipos y
    prompts por cohorte.
  - `POST /api/admin/cohorts` crea una cohorte a partir de `{label, id?}`: el
    `label` es obligatorio (400 `Missing label.` si falta) y se trunca a 120; el
    `id` es un slug derivado del label o del `id` provisto (400
    `Invalid cohort id.` si el slug queda vacío); si el `id` ya existe responde
    409 `Cohort already exists.`
  - `PATCH /api/admin/cohorts/:id` actualiza `{label?, archived?}`; 404
    `Cohort not found.` si no existe.
  - La interfaz ofrece un enlace `"/?grupo=<id>"` por cohorte con botón para
    copiar.
  - Todas las rutas exigen el header `X-Passcode` (401 sin passcode válido).
- **Estado:** implementado.
- **Fuente:** `backend/src/services/cohorts.ts:29-87` (`getCohorts`,
  `getCohort`, `createCohort` con `slugify` en `:19-27` y validaciones en
  `:53-71`, `updateCohort` para renombrar/archivar en `:73-87`),
  `backend/src/services/cohorts.ts:95-103` (`countCohort`),
  `backend/src/routes/admin.ts:23-60` (`GET/POST /cohorts`, `PATCH /cohorts/:id`);
  `frontend/src/views/Admin.tsx:121-295` (`CohortsView`: alta/listado),
  `:91-117` (`ShareLink`: enlace + copiar), `frontend/src/api.ts:75-124`
  (`listCohorts`/`createCohort`/`patchCohort`), `:272-274` (`shareLink`).

## RF-012 · Acceso del alumno por cohorte

- **Descripción:** el alumno accede a los formularios mediante un enlace que
  lleva `?grupo=<id>`. La app valida la cohorte antes de mostrar el formulario;
  si falta o no es válida, presenta una puerta para ingresar el código del
  grupo.
- **Criterios de aceptación:**
  - `GET /api/c/:cohort` resuelve la cohorte y devuelve `{id, label}` solo si
    existe y **no** está archivada; si no, HTTP 404 `Group not found.`
  - Con `?grupo=` presente y válido, se muestra el formulario del día
    correspondiente con la etiqueta del grupo visible.
  - Sin `?grupo=`, o con una cohorte inexistente/archivada, se muestra la puerta
    de código de grupo; al enviar un código, se escribe `?grupo=<id>` en la URL
    (sin recarga) y se revalida. Si no se encuentra, la puerta muestra el mensaje
    de "grupo no encontrado".
- **Estado:** implementado.
- **Fuente:** `backend/src/routes/student.ts:11-19` (`GET /api/c/:cohort`, 404 en
  `:14`), `backend/src/services/cohorts.ts:44-47` (`getActiveCohort`: excluye
  archivadas); `frontend/src/App.tsx:11-13` (`readGrupo`), `:30-63` (escribe
  `?grupo=` y verifica), `:84-97` (loading/gate),
  `frontend/src/ui.tsx:118-177` (`GroupGate`), `frontend/src/api.ts:25-34`
  (`getCohort`).

## RF-013 · Vistas y export acotados a la cohorte (instructor)

- **Descripción:** toda lectura de instructor (roster, bitácoras y exports CSV)
  se resuelve leyendo únicamente las llaves de la cohorte seleccionada, mediante
  prefijo `cohort:<id>:…`. No existe una vista global que barra todas las llaves.
- **Criterios de aceptación:**
  - El panel de instructor primero lista cohortes y luego abre una cohorte
    concreta; roster (RF-004), bitácoras (RF-005) y exports (RF-006, RF-007)
    operan sobre esa cohorte.
  - Las lecturas usan `db.list(prefijo)` de la cohorte, no un `list()` global
    (elimina el barrido O(n) global de la línea base).
- **Estado:** implementado.
- **Fuente:** `backend/src/services/cohorts.ts:8-16` (helpers de prefijo
  `teamPrefix`/`promptPrefix`), `backend/src/services/teams.ts:6-15`
  (`loadTeams` por prefijo), `backend/src/services/prompts.ts:6-19`
  (`loadPrompts` por prefijo); `frontend/src/views/Admin.tsx:535-662`
  (`CohortDetail`: tabs Teams/Prompts y exports por cohorte), `:719-743`
  (selección de cohorte).

## RF-014 · Borrado individual de envíos (instructor)

- **Descripción:** con el passcode, el instructor elimina un envío concreto
  (un check-in del Día 1 o una bitácora del Día 2) por su llave de
  almacenamiento, sin afectar al resto.
- **Criterios de aceptación:**
  - `DELETE /api/admin/cohorts/:id/submissions/:key` acepta la llave completa
    (`cohort:<id>:team:…`) o un sufijo (`team:…` / `prompt:…`) y siempre
    verifica que la llave resuelta pertenece a esa cohorte antes de borrar.
  - Responde 404 `Submission not found.` si la llave no existe; 401 sin passcode
    válido.
  - La interfaz pide confirmación ("This cannot be undone.") antes de borrar.
- **Estado:** implementado.
- **Fuente:** `backend/src/services/cohorts.ts:108-120` (`deleteSubmission`:
  fuerza el prefijo de la cohorte y verifica existencia),
  `backend/src/routes/admin.ts:149-164`
  (`DELETE /cohorts/:id/submissions/:key`); `frontend/src/api.ts:161-174`
  (`deleteSubmission`), `frontend/src/views/Admin.tsx:578-586` (confirmación),
  botones "Delete" en `:373-381` (equipos) y `:511-522` (bitácoras).

## RF-015 · Archivar cohorte (borrado suave)

- **Descripción:** con el passcode, el instructor archiva una cohorte. El
  archivado es un **borrado suave**: marca `archived:true` sin destruir datos.
  Reemplaza el borrado total destructivo del antiguo RF-008.
- **Criterios de aceptación:**
  - `POST /api/admin/cohorts/:id/archive` marca la cohorte como archivada y
    conserva todas sus llaves `cohort:<id>:…`; responde 404 `Cohort not found.`
    si no existe.
  - Una cohorte archivada deja de ser accesible para alumnos (`getActiveCohort`
    la excluye; el alumno recibe 404 en `/api/c/:cohort`).
  - La interfaz pide confirmación indicando explícitamente que los datos se
    conservan ("Its data is kept, not deleted.").
  - Una cohorte archivada sigue siendo visible y legible para el instructor.
- **Estado:** implementado.
- **Fuente:** `backend/src/services/cohorts.ts:90-93` (`archiveCohort` vía
  `updateCohort`), `:44-47` (`getActiveCohort` excluye archivadas),
  `backend/src/routes/admin.ts:167-175` (`POST /cohorts/:id/archive`);
  `frontend/src/api.ts:114-124` (`archiveCohort`),
  `frontend/src/views/Admin.tsx:157-166` (confirmación).

## RF-016 · Respaldo completo en JSON (instructor)

- **Descripción:** con el passcode, el instructor descarga un respaldo portable
  con el índice de cohortes y todas las llaves/valores del KV.
- **Criterios de aceptación:**
  - `GET /api/admin/backup.json` devuelve `{cohorts, data}` donde `data` mapea
    cada llave del KV a su valor; se entrega como adjunto `backup.json` y el
    front lo guarda como `team-checkin-backup.json`.
  - La descarga se hace por `fetch`+blob con el header `X-Passcode` (el passcode
    no viaja en la URL); 401 sin passcode válido.
- **Estado:** implementado.
- **Fuente:** `backend/src/services/cohorts.ts:148-158` (`buildBackup`:
  `db.list("")` + `db.get` de cada llave), `backend/src/routes/admin.ts:190-199`
  (`GET /backup.json`); `frontend/src/api.ts:227-233` (`downloadBackup`),
  `frontend/src/views/Admin.tsx:185-191` (`doBackup`), botón en `:200-202`.

## RF-017 · Migración de datos heredados a una cohorte (instructor)

- **Descripción:** con el passcode, el instructor mueve los datos heredados sin
  prefijo (llaves `team:*` / `prompt:*` de antes del aislamiento por cohorte)
  hacia la caja de una cohorte, para adoptar el modelo por cohorte sin perder
  datos.
- **Criterios de aceptación:**
  - `POST /api/admin/migrate-legacy` recibe `{cohortId}` (400 `Missing cohortId.`
    si falta); si la cohorte no existe, la crea; mueve cada llave heredada a
    `cohort:<id>:<llave>` y borra la original; deja intactas las llaves que ya
    empiezan por `cohort:`; devuelve `{moved}` con la cantidad movida.
  - 401 sin passcode válido.
  - La interfaz pide confirmación e informa cuántos registros se importaron.
- **Estado:** implementado.
- **Fuente:** `backend/src/services/cohorts.ts:124-146` (`migrateLegacy`:
  crea la cohorte si falta, mueve `team:`/`prompt:` sin prefijo, ignora las ya
  prefijadas), `backend/src/routes/admin.ts:178-187`
  (`POST /migrate-legacy`); `frontend/src/api.ts:177-189` (`migrateLegacy`),
  `frontend/src/views/Admin.tsx:168-183` (confirmación y aviso de conteo).
