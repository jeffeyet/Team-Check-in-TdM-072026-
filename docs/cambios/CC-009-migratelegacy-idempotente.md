# CC-009 · `migrateLegacy` idempotente y seguro ante fallos parciales

- **Fecha:** 2026-07-09
- **Solicitante:** Equipo Solanum
- **Estado:** implementado

## Descripción

Hacer `migrateLegacy` **seguro de re-ejecutar** tras un fallo parcial: antes de
mover una llave heredada (`team:*` / `prompt:*`) a `cohort:<id>:...`, comprobar si
la llave destino **ya existe**; si existe (movida en una corrida previa que falló
entre `set` y `del`), solo se borra la llave heredada sobrante en vez de volver a
escribir. Así una re-ejecución converge sin duplicar registros.

## Motivación

La revisión confirmó que `migrateLegacy` mueve con `set`+`del` no atómicos: un
fallo del KV entre ambos deja un registro **duplicado** (en legado y prefijado),
y una re-ejecución lo volvía a copiar. Replit KV no tiene transacciones, así que
no se puede lograr atomicidad real; el objetivo alcanzable es la **idempotencia**
(re-ejecutar es seguro y limpia los sobrantes).

Lo que **no** se puede corregir en código (y se acepta/documenta): la migración
vuelca **todo** el legado plano `team:*`/`prompt:*` en **una** cohorte destino,
porque las llaves heredadas no llevan información de edición para separarlas; los
homónimos se colapsan al deduplicar. Se recomienda respaldar (RF-016) antes.

## Requisitos afectados

- **Modificados:** RF-017 (migración) — ahora idempotente y seguro ante fallos
  parciales; se aclara que la fusión en una cohorte es inherente.
- **Resuelto parcialmente** (límite conocido de la revisión): no-atomicidad de
  `migrateLegacy` — mitigada por idempotencia; la fusión de ediciones queda como
  límite aceptado.

## Impacto

- **Código (solo backend):** `backend/src/services/cohorts.ts` — en el bucle de
  `migrateLegacy`, `db.get(destKey)` antes de `db.set`; si existe, `db.del` del
  origen y `continue` sin recontar.
- **Datos:** ninguno en operación normal; en un estado ya duplicado por un fallo
  previo, una re-ejecución lo limpia.
- **Esfuerzo y riesgo:** bajo. Un `get` extra por llave durante la migración
  (acción de una sola vez).

## Decisión

Aprobado el 2026-07-09 (Equipo Solanum). Refina la implementación de
[ADR-0004](../decisiones/0004-aislamiento-por-cohorte.md); no requiere ADR nuevo.

## Verificación

Ejecutado el 2026-07-09 (Equipo Solanum). Build + `tsc --noEmit` del backend sin
errores. Prueba de runtime sobre el `devStore`:

- Sembrado un estado de fallo parcial: `team:LEG1` (origen) **y**
  `cohort:mig:team:LEG1` (destino ya escrito, valor `L1-EXISTING`), más un
  `team:LEG2` limpio. `migrateLegacy("mig")` → **moved: 1** (solo LEG2): el origen
  `team:LEG1` se elimina, el destino se **conserva intacto** (no se sobrescribe ni
  se duplica ni se recuenta); `team:LEG2` se mueve y su origen se borra.
- **Re-ejecución** → **moved: 0** (converge; idempotente).
