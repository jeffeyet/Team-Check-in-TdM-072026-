# CC-008 · Serializar las mutaciones del índice `cohorts`

- **Fecha:** 2026-07-09
- **Solicitante:** Equipo Solanum
- **Estado:** implementado

## Descripción

Eliminar el *lost update* del índice `cohorts` (una sola llave KV con
lectura-modificación-escritura sin compare-and-set) serializando **en el proceso**
todas las mutaciones del índice (`createCohort`, `updateCohort` y, por delegación,
`archiveCohort`) mediante un pequeño mutex asíncrono (cola de promesas). Como la
app corre como **un solo proceso** Express en Replit, serializar en memoria basta
para que dos handlers concurrentes no se pisen.

## Motivación

La revisión de cohortes confirmó que dos escrituras concurrentes al índice (dos
pestañas del instructor, doble clic en "crear", o crear+archivar a la vez) leen
el mismo arreglo base y la segunda `saveCohorts` pisa a la primera: se pierde una
entrada del índice (los datos `cohort:<id>:*` sobreviven, pero la cohorte
desaparece del sistema). Además el check-then-set de unicidad de `createCohort`
no es atómico. Replit KV no ofrece transacciones ni CAS, así que la vía viable a
esta escala es serializar en el proceso.

## Requisitos afectados

- **Modificados:** RF-011 (gestión de cohortes) — las altas/renombrados/archivados
  concurrentes ya no pierden entradas del índice; unicidad de id garantizada
  dentro del proceso.
- **Resuelto** (límite conocido de la revisión): índice `cohorts` sin atomicidad.

## Impacto

- **Código (solo backend):** `backend/src/services/cohorts.ts` — mutex
  `withIndexLock` que encola las secciones read-modify-write de `createCohort` y
  `updateCohort`. Los reads (`getCohorts`/`getCohort`/`getActiveCohort`) y
  `migrateLegacy` (que ya llama a `createCohort`) no cambian su firma.
- **Datos:** ninguno.
- **Límite residual:** el mutex es **en memoria**, válido para el despliegue
  actual (un solo servicio Replit). Si algún día se corre con varias instancias,
  no serializaría entre instancias; se reevaluaría con getAll/setAll o un lock
  externo. Se documenta como límite conocido.
- **Esfuerzo y riesgo:** bajo. No cambia contratos de API; el mutex es local.

## Decisión

Aprobado el 2026-07-09 (Equipo Solanum). Refina la implementación de
[ADR-0004](../decisiones/0004-aislamiento-por-cohorte.md); no requiere ADR nuevo.

## Verificación

Ejecutado el 2026-07-09 (Equipo Solanum). Build + `tsc --noEmit` del backend sin
errores. Prueba de runtime importando los servicios compilados sobre el
`devStore`:

- **3 `createCohort` concurrentes** (`Promise.all`, ids distintos) → `getCohorts()`
  termina con **3** entradas (`alpha,beta,gamma`); sin el mutex se perdería alguna
  por *last-write-wins*.
- **2 `createCohort` concurrentes con el MISMO id** → exactamente **1 ok + 1 409**
  y **1** entrada en el índice (unicidad garantizada dentro del proceso).
- El flujo secuencial normal no cambia (el mutex solo encola; `slugify` y las
  lecturas no se tocan).
