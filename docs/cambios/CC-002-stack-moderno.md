# CC-002 · Stack moderno: reescritura a paridad en la raíz

- **Fecha:** 2026-07-09
- **Solicitante:** Equipo Solanum
- **Estado:** implementado

## Descripción

Cambiar el rumbo técnico hacia un stack moderno completo: reescribir la
plataforma **a paridad funcional** y **en la raíz** (in-place), reemplazando la
app de un solo archivo por un backend TypeScript + Express (`backend/`) y un
frontend React + Vite (`frontend/`, con build step), corriendo en Replit como un
solo servicio (el backend sirve el build del frontend). El almacenamiento sigue
siendo Replit KV. La versión anterior (`index.js`, `public/`) se retira del
árbol de trabajo; su respaldo es el historial de git (commit `37760a9`,
recuperable con `git checkout 37760a9 -- index.js public`).

## Motivación

Seguir creciendo la app de la raíz hacia la visión (actividades configurables,
aislamiento por clase, administración fina) significa acumular lógica sin tipos
ni componentes en dos archivos acoplados. El equipo decide priorizar una base
tipada, modular y con componentes reutilizables sobre la que varias personas
puedan trabajar. El detalle y las consecuencias honestas de la decisión están
en el [ADR-0003](../decisiones/0003-stack-moderno-typescript-react.md), que
reemplaza al [ADR-0002](../decisiones/0002-evolucion-replit-nativa.md).

## Requisitos afectados

- Nuevos: ninguno. La reescritura es **a paridad**: su primera meta es
  reproducir la línea base RF-001…RF-010 sin añadir funcionalidad.
- Modificados / descartados: ninguno. Los requisitos siguen vigentes; cambia la
  implementación, no el alcance funcional. Lo nuevo entrará después por CC.

## Impacto

- **Código:** **reemplaza la app de la raíz** por el stack moderno en el sitio.
  El backend TypeScript + Express vive en `backend/` (CommonJS, `tsc` → `dist/`)
  y el frontend React + Vite en `frontend/`; un `package.json` orquestador en la
  raíz coordina instalación, build y arranque. `index.js` y `public/` se retiran
  del árbol de trabajo; la versión anterior queda en git (commit `37760a9`).
- **Datos:** ninguno. Se conserva Replit KV con las mismas llaves
  (`team:*`, `prompt:*`); no hay migración.
- **Docs:** nuevo [ADR-0003](../decisiones/0003-stack-moderno-typescript-react.md)
  (reemplaza al 0002); `docs/arquitectura.md` describe el stack moderno en la
  raíz (`backend/` + `frontend/`); `README.md` y `CLAUDE.md` de la raíz reflejan
  la nueva estructura.
- **Esfuerzo y riesgo:** alto y honesto. Introduce build step y más
  dependencias, y mayor superficie de mantenimiento para un equipo mayormente
  no desarrollador. Riesgo de reescribir el día de la presentación y de
  reemplazar en el sitio, mitigado porque la versión anterior queda preservada
  en el historial de git (commit `37760a9`).

## Decisión

Aprobado el 2026-07-09 por el Equipo Solanum e **implementado** el mismo día: ir
al stack moderno a paridad, reescribiendo en la raíz y reemplazando la app de un
solo archivo. La decisión técnica queda registrada en el
[ADR-0003](../decisiones/0003-stack-moderno-typescript-react.md).

## Verificación

Cómo se comprobó que la reescritura quedó a paridad (ejecutado el 2026-07-09):

- **Typecheck y build:** `npm run typecheck` y `npm run build` (Vite para el
  frontend, `tsc` para el backend) corren **sin errores**.
- **Arranque:** el servicio único levanta y el **backend sirve el build del
  frontend** (`frontend/dist` con fallback SPA).
- **Smoke test con paridad exacta de endpoints:** el API responde igual que la
  app anterior en rutas, mensajes, status y formas:
  - `GET /api/teamnames` → `{ "names": [] }`.
  - `GET /api/roster` y `POST /api/clear` sin passcode válido → `401`
    `Bad passcode.`.
  - `GET /api/export.csv` sin passcode válido → `401` `Unauthorized`.
  - `POST /api/submit` incompleto → `400`
    `Missing team name, members, or idea.`.
  - `POST /api/prompt-submit` incompleto → `400`
    `Missing team, revised idea, or Google Doc link.`.

La reescritura en la raíz es ya la fuente de verdad de la edición 07/2026. La
app de un solo archivo queda como respaldo en el historial de git (commit
`37760a9`).
