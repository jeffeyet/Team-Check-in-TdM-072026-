# CC-005 · Día 3: onboarding de GitHub como guía

- **Fecha:** 2026-07-09
- **Solicitante:** Equipo Solanum
- **Estado:** implementado

## Descripción

Añadir un **Día 3** al portal del alumno que **guíe** —en lenguaje llano y con
visuales simples— a alumnos no técnicos a conectar su computadora con GitHub y a
entender el flujo mínimo (Git, GitHub, clonar, fork, rama, commit, push, pull
request, merge). El Día 3 **no** es un formulario: es contenido **read-only** más
un *handoff* al kit externo `AI_GITHUB_Connection` (el alumno descarga el ZIP,
abre la carpeta en su app de IA y manda un mensaje; la IA hace el trabajo
técnico). Team-Check **no** ejecuta los scripts del kit ni añade IA en tiempo de
ejecución: solo explica el flujo y enlaza.

Se implementa como **guía-como-dato**: un catálogo tipado en el frontend
(`frontend/src/content/days.ts`) describe los días, y un componente genérico
(`frontend/src/views/Guide.tsx`) renderiza las entradas de tipo `guide`. El Día 1
y el Día 2 (formularios que **escriben** datos) quedan intactos. Ver el
[ADR-0005](../decisiones/0005-guias-como-datos.md).

## Motivación

En la sesión real, el profesor pidió clonar su repositorio, pero muchos alumnos
no sabían usar la terminal ni conectar GitHub y se trabaron. El
[syllabus](../AI_Leadership_Intensive_Syllabus.md) ya prevé el Día 3
("Vibe Coding 101 — Your First Build", con "we will help you set one up on Day
3"): esta guía cubre exactamente ese hueco para que los alumnos se autoatiendan.

Además, esta es la forma más barata de **empezar a pagar** la deuda de
[roadmap → "actividades como datos"](../roadmap.md): la **mitad read-only**
(guías) se modela como datos sin tocar los formularios ni el backend.

## Requisitos afectados

- **Nuevos** (a formalizar en `docs/requerimientos/`; ver *Docs*):
  - RF-018 · Existe un Día 3 **read-only** que guía la conexión con GitHub y el
    flujo Git/PR, con handoff al kit externo `AI_GITHUB_Connection`.
  - RF-019 · Los días se modelan como **datos** (`content/days.ts`); las entradas
    de tipo `guide` se pintan con un componente genérico, sin ruta ni vista nueva
    por guía.
- **Sin cambios:** RF de Día 1 / Día 2 (siguen siendo formularios dedicados que
  escriben por cohorte); modelo de acceso (CC-003/CC-004) intacto.

## Impacto

- **Código (solo frontend):**
  - `frontend/src/types.ts:1` — ampliar `View` a incluir `"day3"` (o introducir
    un `DayId`) y añadir los tipos del modelo de contenido de guía.
  - `frontend/src/App.tsx:17,67,99-116` — ampliar `onSelectDay` y el ruteo por
    estado para incluir `day3`; el Día 3 se muestra **tras el `GroupGate`**, como
    las otras pestañas. El *default* sigue siendo `day2` (`:17`).
  - `frontend/src/ui.tsx:47` — `DayTabs`: añadir el tercer tab
    ("Wednesday · GitHub"); idealmente renderizar los tabs desde el catálogo.
  - `frontend/src/views/Guide.tsx` (NUEVO) — componente genérico para días
    `kind:"guide"`.
  - `frontend/src/content/days.ts` (NUEVO) — catálogo de días + contenido del
    Día 3 (texto copiado del README/AGENTS.md del kit, no inventado).
  - `frontend/src/styles.css` — clases para tarjetas-concepto, diagrama SVG,
    tabla "humano vs IA" y checklist, reutilizando los tokens de `:root`.
  - **Sin cambios** en `backend/*` ni en `frontend/src/api.ts` (el Día 3 no llama
    al backend).
- **Datos:** ninguno. No toca el KV ni requiere migración.
- **Docs:** este CC-005; [ADR-0005](../decisiones/0005-guias-como-datos.md);
  nota de avance parcial en [roadmap.md](../roadmap.md). **Pendiente:** formalizar
  RF-018/RF-019 en `docs/requerimientos/`.
- **Esfuerzo y riesgo:** bajo. Solo frontend, sin dependencias nuevas
  (visuales con SVG inline + emoji + CSS; **nada** de Mermaid/react-markdown/
  marked). El typecheck atrapa el efecto dominó de ampliar `View`.

## Decisión

Aprobado el 2026-07-09 (Equipo Solanum). Se elige la **guía-como-dato**
(opción B) sobre una vista `Day3.tsx` dedicada (opción A, repite el anti-patrón
"día cableado") y sobre un simple enlace/banner (opción C, no cumple el encargo
de *guiar* con visuales). Rationale duradero en el
[ADR-0005](../decisiones/0005-guias-como-datos.md).

## Verificación

Ejecutado el 2026-07-09 (Equipo Solanum):

- **Build + typecheck** sin errores: `tsc --noEmit` en frontend (exit 0) y
  `npm run build` OK (38 módulos; frontend `dist/` + backend `dist/`).
- **Render del Día 3** confirmado con el componente `Guide` montado en aislado
  (cohorte simulada) y captura headless: se ve la tercera pestaña
  "Wednesday · GitHub Setup", la intro, las tarjetas-concepto (Git/GitHub/repo/
  clonar/fork/rama/commit/push/PR/merge), el diagrama SVG del ciclo
  (computadora ⇄ GitHub; commit→push→PR→merge), la sección "Use the kit" con el
  mensaje exacto para copiar y el enlace al kit, la tabla "You do vs the AI does",
  el checklist ("`ssh -T` … *does not provide shell access* = éxito") y la línea
  de troubleshooting. Sin formulario.
- **Sin regresión de tipos:** ampliar `View`/`onSelectDay` a `DayId` se propagó a
  `App.tsx`, `ui.tsx`, `Day1.tsx`, `Day2.tsx` sin errores. El *default view* sigue
  siendo `day2`; los formularios Día 1 / Día 2 no se reescribieron.
- **Sin dependencias nuevas** (visuales con SVG inline + emoji + CSS) ni cambios
  de backend.
- **Límite de la verificación:** el flujo real por `?grupo=<id>` a través del
  `GroupGate` no se probó localmente porque `getCohort` necesita el KV de Replit
  (fuera de Replit los reads vuelven vacíos, ver *Known quirks* en `CLAUDE.md`).
  Comprobar ese camino y correr la
  [checklist de humo](../pruebas/checklist-humo.md) en el despliegue de Replit.
