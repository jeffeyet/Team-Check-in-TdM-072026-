# CC-010 · `teamCount` consistente con el roster (deduplicado)

- **Fecha:** 2026-07-09
- **Solicitante:** Equipo Solanum
- **Estado:** implementado

## Descripción

Hacer que el `teamCount` del índice de cohortes (panel de instructor) refleje el
**mismo dedupe** que el roster: contar equipos únicos por nombre (última entrada
gana), no las llaves crudas. `promptCount` se mantiene crudo porque las bitácoras
se muestran todas (RF-005), así que el conteo crudo ya coincide con lo mostrado.

## Motivación

La revisión detectó que `countCohort` contaba las llaves crudas de
`cohort:<id>:team:*` (incluye reenvíos), mientras el roster (RF-004) deduplica por
nombre. Resultado: el número que ve el instructor en la lista de cohortes podía
ser mayor que las filas del roster. Alinear el conteo con lo mostrado evita
confusión.

Fuera de alcance (se mantienen como comportamiento **intencional**, documentado):
el dedupe "última gana" hace que un reenvío eclipse el envío anterior del mismo
nombre (el previo persiste en el KV, recuperable por RF-016 / borrable por
RF-014), y los truncados del envío (idea ≤240, LinkedIn ≤300, ≤6 miembros) son
silenciosos (RNF-004). Cambiar eso sería una decisión de producto aparte.

## Requisitos afectados

- **Modificados:** RF-011 (`countCohort` ahora deduplica el `teamCount`).
- **Resuelto** (límite conocido de la revisión): `teamCount` podía exceder las
  filas del roster.

## Impacto

- **Código (solo backend):** `backend/src/services/cohorts.ts` — `countCohort`
  calcula `teamCount` como `dedupeTeams(await loadTeams(id)).length`
  (reutiliza la lógica del roster; import call-time, sin ciclo de carga real).
  `promptCount` sigue siendo el número de llaves de prompts.
- **Datos:** ninguno.
- **Esfuerzo y riesgo:** bajo. `countCohort` hace más lecturas (un `get` por
  equipo, ya que reutiliza `loadTeams`); aceptable a la escala del curso.

## Decisión

Aprobado el 2026-07-09 (Equipo Solanum). Refina la implementación de
[ADR-0004](../decisiones/0004-aislamiento-por-cohorte.md); no requiere ADR nuevo.

## Verificación

Ejecutado el 2026-07-09 (Equipo Solanum). Build + `tsc --noEmit` del backend sin
errores. Prueba de runtime sobre el `devStore`:

- Guardado **dos veces** el mismo equipo `T1` (2 llaves crudas) y **dos**
  bitácoras en la cohorte `alpha`; `countCohort("alpha")` → **`teamCount: 1`**
  (deduplicado, coincide con el roster) y **`promptCount: 2`** (todas las
  bitácoras). Confirma también que el import call-time de `loadTeams`/`dedupeTeams`
  desde `cohorts.ts` resuelve sin problemas de ciclo.
