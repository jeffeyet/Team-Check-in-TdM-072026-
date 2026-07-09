# ADR 0005 · Guías (contenido read-only) como datos

- **Estado:** aceptada
- **Fecha:** 2026-07-09

## Contexto

El profesor pidió un **Día 3** que guíe a alumnos no técnicos a conectar GitHub
y entender el flujo Git/PR (ver
[CC-005](../cambios/CC-005-dia3-github-onboarding.md)). El Día 3 es distinto de
los Días 1 y 2: estos son **formularios que escriben** datos por cohorte
(`POST /api/c/...`), mientras que el Día 3 es **contenido read-only** más un
*handoff* a un kit externo — no envía nada, no toca el KV, no necesita backend.

La línea base cablea cada día en código: una entrada en el union `View`
(`frontend/src/types.ts:1`), una rama de ruteo (`frontend/src/App.tsx:99-116`),
un tab (`frontend/src/ui.tsx:47`) y una vista dedicada por día. El
[roadmap](../roadmap.md) marca como pendiente "actividades como datos"
(`roadmap.md:66-68`): generalizar los días para no programar una ruta y una vista
por cada actividad nueva. Añadir el Día 3 copiando el patrón Día1/Día2 repetiría
justamente ese anti-patrón.

## Decisión

Modelar los días como **datos** para su mitad **read-only**: un catálogo tipado
`frontend/src/content/days.ts` (`{ id, tabLabel, dayLabel, kind: "form" | "guide",
content }`) y un componente genérico `frontend/src/views/Guide.tsx` que pinta las
entradas `kind:"guide"` desde un modelo de contenido simple (intro,
tarjetas-concepto, diagrama, pasos, tabla, checklist). El Día 1 y el Día 2 siguen
siendo sus **componentes-formulario** actuales (que escriben datos), solo
referenciados por el catálogo; **no** se reescriben. El Día 3 es la primera
entrada `guide`. Los visuales se hacen con **SVG inline + emoji + CSS** (tokens de
`:root`), sin dependencias nuevas.

## Alternativas consideradas

- **Vista `Day3.tsx` dedicada** (copiar el patrón Día1/Día2) — la más rápida y
  familiar, pero vuelve a cablear un día en código: es exactamente el anti-patrón
  que el roadmap marca como deuda, y el Día 4/5 repetiría el copy-paste. No
  adelanta nada de "actividades como datos".
- **Solo un enlace/banner** al kit externo — esfuerzo casi nulo, pero **no
  cumple**: el profesor pidió *guiar* con visuales sobre Git/GitHub, no solo
  enlazar; deja al alumno igual de perdido.
- **Motor de actividades completo** (generalizar también los formularios Día1/
  Día2 a datos) — es la meta final de "actividades como datos", pero
  desproporcionado ahora: los formularios escriben, validan y dependen del
  backend por cohorte; generalizarlos toca rutas, servicios y validación. Se
  hace solo la **mitad read-only** (guías), la más barata y segura. *Criterio de
  disparo futuro:* cuando haya varias actividades-formulario que difieran solo en
  campos, se reabre esta alternativa para generalizar también los `kind:"form"`.

## Consecuencias

- (+) Cumple el encargo (guía visual + handoff) **y** paga la mitad read-only de
  la deuda "actividades como datos" a un costo muy cercano al de una vista
  dedicada.
- (+) Añadir una guía futura (Día 4/5) = editar **un** archivo de config, sin
  ruta ni vista nuevas.
- (+) Sin backend y sin dependencias nuevas; el contenido es TS tipado y
  autodocumentado. Mantiene la distinción correcta: **actividad que escribe** vs
  **guía read-only**.
- (−) Exige diseñar un mini-esquema de contenido (riesgo de sobre-ingeniería si
  crece): se mantiene mínimo y no se anticipan tipos de bloque sin uso.
- (−) Generalización solo **parcial**: los Días 1/2 (formularios) siguen siendo
  componentes especiales; el catálogo los referencia pero no los unifica.
- Queda **pendiente** formalizar RF-018/RF-019 en `docs/requerimientos/` y, más
  adelante, la mitad `kind:"form"` de "actividades como datos".
