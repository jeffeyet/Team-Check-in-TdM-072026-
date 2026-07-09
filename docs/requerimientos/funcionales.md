# Requisitos funcionales (RF)

Línea base redactada desde el código el 2026-07-08. El 2026-07-09 las
referencias de **Fuente** se remapearon al stack moderno ([ADR-0003](../decisiones/0003-stack-moderno-typescript-react.md)),
que reemplazó a la app de un solo archivo y ahora vive en la raíz
(`backend/` con Express + TypeScript, `frontend/` con React + Vite). El
comportamiento es **paridad exacta** con la app anterior (mismas rutas
`/api`, mensajes, status y límites); solo cambió **dónde** vive el código,
así que el texto de cada requisito y sus criterios se conservan.

Convenciones y ciclo de vida: [README.md](README.md). Los requisitos de
funcionalidades nuevas se agregarán vía
[control de cambios](../cambios/README.md) tras la sesión de equipo (F1).

---

## RF-001 · Check-in de equipo (Día 1)

- **Descripción:** un integrante registra a su equipo: nombre del equipo,
  1–6 miembros (nombre obligatorio, LinkedIn opcional) y la idea del equipo
  en una frase. La interfaz permite marcar a lo más un PM (marcar uno
  desmarca a los demás); el servidor no valida esa unicidad — guarda tal cual
  los miembros que reciba.
- **Criterios de aceptación:**
  - Rechaza el envío (HTTP 400) si falta el nombre de equipo, la lista de
    miembros está vacía o falta la idea.
  - Trunca: nombre de equipo a 120, idea a 240, nombre de miembro a 120,
    LinkedIn a 300 caracteres; acepta máximo 6 miembros.
  - En la interfaz, marcar PM en un miembro desmarca a los demás.
  - El envío exitoso muestra confirmación y permite registrar otro equipo.
- **Estado:** implementado (línea base).
- **Fuente:** `backend/src/routes/teams.ts:16-44` (validación 400 y truncados
  en `:19-38`), `backend/src/services/teams.ts:23-26` (guardado);
  `frontend/src/views/Day1.tsx:122-235` (formulario), `:56-63` (regla de un
  solo PM), `:65-98` (validación de la interfaz).

## RF-002 · Autocompletado de nombres de equipo

- **Descripción:** el sistema expone la lista pública de nombres de equipo
  registrados, y el formulario del Día 2 la ofrece como autocompletado.
- **Criterios de aceptación:**
  - `GET /api/teamnames` devuelve los nombres sin duplicados exactos
    (distingue mayúsculas y espacios, a diferencia del dedupe del roster) y
    ordenados lexicográficamente por punto de código (las mayúsculas van
    antes que las minúsculas); no requiere passcode.
  - Ante un error interno devuelve `{names: []}` y la interfaz sigue
    funcionando.
- **Estado:** implementado (línea base).
- **Fuente:** `backend/src/routes/teams.ts:92-101` (`Set` + `.sort()` por
  defecto, sin passcode, `{names:[]}` en error);
  `frontend/src/views/Day2.tsx:91-104` (`<datalist>`),
  `frontend/src/api.ts:31-39` (`getTeamNames`).

## RF-003 · Bitácora de prompts (Día 2)

- **Descripción:** un equipo envía el enlace a su Google Doc con la sesión
  de 20 prompts y su idea revisada en una frase.
- **Criterios de aceptación:**
  - Rechaza el envío (HTTP 400) si falta el equipo, la idea revisada o el
    enlace.
  - Trunca: equipo a 120, idea a 240, enlace a 500 caracteres.
  - El envío exitoso muestra confirmación; se permiten varios envíos del
    mismo equipo (todos se conservan y se listan).
- **Estado:** implementado (línea base).
- **Fuente:** `backend/src/routes/prompts.ts:11-30` (validación 400 y
  truncados en `:14-24`), `backend/src/services/prompts.ts:19-23` (guardado);
  `frontend/src/views/Day2.tsx:78-155` (formulario), `:28-54` (validación de
  la interfaz).

## RF-004 · Roster de equipos para el instructor

- **Descripción:** con el passcode, el instructor ve los equipos del Día 1:
  estadísticas (equipos, estudiantes, PMs nombrados) y una tarjeta por
  equipo con idea, miembros, insignia del PM y enlaces de LinkedIn.
- **Criterios de aceptación:**
  - Sin passcode válido responde HTTP 401.
  - La lista se deduplica por nombre de equipo (case-insensitive): se
    muestra la entrada más reciente de cada nombre, en orden alfabético.
  - Los enlaces de LinkedIn abren en pestaña nueva.
- **Estado:** implementado (línea base).
- **Fuente:** `backend/src/routes/teams.ts:46-53` (`GET /api/roster`, 401 en
  `:47`), `backend/src/services/teams.ts:15-21` (`dedupeTeams`: última por
  nombre en minúsculas, orden alfabético);
  `frontend/src/views/Admin.tsx:79-192` (`TeamsTab`: estadísticas y tarjetas;
  LinkedIn con `target="_blank"` en `:177-183`).

## RF-005 · Vista de bitácoras para el instructor

- **Descripción:** con el passcode, el instructor ve todas las entregas del
  Día 2 agrupadas por equipo, con la idea revisada y el enlace al documento.
- **Criterios de aceptación:**
  - Sin passcode válido responde HTTP 401.
  - Se muestran todas las entregas (sin deduplicar), agrupadas por equipo y
    ordenadas por nombre de equipo y fecha.
  - El enlace al documento abre en pestaña nueva.
- **Estado:** implementado (línea base).
- **Fuente:** `backend/src/routes/prompts.ts:32-39` (`GET /api/prompt-roster`,
  401 en `:33`), `backend/src/services/prompts.ts:4-17` (`loadPrompts`:
  orden por nombre de equipo y luego fecha, sin dedupe);
  `frontend/src/views/Admin.tsx:194-319` (`PromptsTab`: agrupación por equipo
  en `:230-239`, enlace con `target="_blank"` en `:299-307`).

## RF-006 · Export CSV del Día 1

- **Descripción:** con el passcode, descarga de los check-ins en CSV, una
  fila por miembro.
- **Criterios de aceptación:**
  - Columnas: `team, member, linkedin, isPM, idea, submittedAt`; comillas
    escapadas; archivo `team-checkins.csv`.
  - Aplica el mismo dedupe por equipo que el roster (RF-004).
  - Sin passcode válido responde HTTP 401.
- **Estado:** implementado (línea base).
- **Fuente:** `backend/src/routes/teams.ts:65-89` (`GET /api/export.csv`, 401
  en `:66`, cabecera y nombre de archivo en `:86-88`),
  `backend/src/lib/csv.ts:2-6` (escapado de comillas),
  `backend/src/services/teams.ts:15-21` (mismo `dedupeTeams`).

## RF-007 · Export CSV del Día 2

- **Descripción:** con el passcode, descarga de las bitácoras en CSV, una
  fila por entrega.
- **Criterios de aceptación:**
  - Columnas: `team, revisedIdea, docUrl, submittedAt`; comillas escapadas;
    archivo `prompt-logs.csv`.
  - Sin passcode válido responde HTTP 401.
- **Estado:** implementado (línea base).
- **Fuente:** `backend/src/routes/prompts.ts:51-63` (`GET /api/prompt-export.csv`,
  401 en `:52`, cabecera y nombre de archivo en `:60-62`),
  `backend/src/lib/csv.ts:2-6` (escapado de comillas).

## RF-008 · Borrado total por día

- **Descripción:** con el passcode, el instructor puede borrar todos los
  check-ins (Día 1) o todas las bitácoras (Día 2).
- **Criterios de aceptación:**
  - La interfaz pide confirmación antes de borrar.
  - `POST /api/clear` elimina todas las llaves `team:*`;
    `POST /api/prompt-clear`, todas las `prompt:*`.
  - Sin passcode válido responde HTTP 401.
- **Estado:** implementado (línea base).
- **Fuente:** `backend/src/routes/teams.ts:55-63` (`POST /api/clear`, 401 en
  `:56`) con `backend/src/services/teams.ts:28-31` (`clearTeams`);
  `backend/src/routes/prompts.ts:41-49` (`POST /api/prompt-clear`, 401 en
  `:42`) con `backend/src/services/prompts.ts:25-28` (`clearPrompts`);
  confirmación en la interfaz en `frontend/src/views/Admin.tsx:152-156`
  (equipos) y `:268-272` (bitácoras).

## RF-009 · Acceso de instructor por passcode

- **Descripción:** las vistas y rutas de instructor se protegen con un
  passcode único, configurable por Secret (`PASSCODE`, default
  `roster2026`).
- **Criterios de aceptación:**
  - El passcode se acepta como query param (`?code=`) o en el body JSON
    (`code`).
  - Passcode incorrecto: HTTP 401 y mensaje en la interfaz.
- **Estado:** implementado (línea base).
- **Fuente:** `backend/src/config.ts:2` (`PASSCODE`),
  `backend/src/auth.ts:5-10` (`checkCode`: lee `req.query.code` o
  `req.body.code`), `backend/src/lib/respond.ts:3-8` (respuestas 401);
  `frontend/src/views/Admin.tsx:22-77` (puerta de passcode y mensaje).

## RF-010 · Navegación del portal

- **Descripción:** la interfaz es una SPA con tres vistas: Día 1 (check-in),
  Día 2 (bitácora) y vista de instructor, navegables sin recargar la
  página.
- **Criterios de aceptación:**
  - Al abrir `/` se muestra la vista del Día 2 (vista por defecto actual).
  - Las pestañas Monday/Tuesday cambian de vista; "Instructor view" lleva a
    la puerta de passcode y "Back" regresa.
- **Estado:** implementado (línea base).
- **Fuente:** `frontend/src/App.tsx:7-36` (router por estado; vista por
  defecto `day2` en `:9`), `frontend/src/ui.tsx:39-72` (`DayTabs`
  Monday/Tuesday) y `:32-35` (botón "Instructor view ↔ Back").
