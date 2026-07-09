# CC-003 · Aislamiento por cohorte

- **Fecha:** 2026-07-09
- **Solicitante:** Equipo Solanum
- **Estado:** implementado

## Descripción

Convertir el portal de una sola corrida de datos a **varios grupos aislados a
lo largo del tiempo**. Cada grupo/edición es una **cohorte**: una caja de datos
separada dentro del mismo Replit KV, con esquema de llaves con prefijo
(`cohort:<id>:team:*`, `cohort:<id>:prompt:*`) y un índice bajo la llave
`cohorts`. Las lecturas se acotan siempre por prefijo, el alumno entra por el
enlace de su cohorte (`/?grupo=<id>`) y el instructor gestiona las cohortes con
un único passcode. El borrado destructivo se reemplaza por archivar + borrado
individual + respaldo, y se añade una migración de datos heredados.

La decisión técnica, con contexto, alternativas y consecuencias, está en el
[ADR-0004](../decisiones/0004-aislamiento-por-cohorte.md).

## Motivación

El instructor pidió usar el portal con varios grupos en el tiempo y conservar
el histórico. El esquema plano heredado (`team:*` / `prompt:*`) no lo permite:
mezcla los datos de todos los grupos, hace un dedupe **global** que colisiona
equipos homónimos entre cohortes (bug real), barre todo el KV en cada consulta
([RNF-006](../requerimientos/no-funcionales.md)) y solo ofrece borrado total
para "empezar de nuevo", lo que destruiría el histórico que se quiere guardar.

## Requisitos afectados

- **Nuevos** (formalizados en
  [`docs/requerimientos/funcionales.md`](../requerimientos/funcionales.md)):
  - RF-011 · Gestión de cohortes (crear / listar / archivar; enlace para
    compartir).
  - RF-012 · Acceso del alumno por enlace de cohorte (`/?grupo=<id>`), con
    resolución/validación de la cohorte (404 si no existe o está archivada).
  - RF-013 · Vistas (roster / bitácoras) y export CSV del instructor
    **acotados por cohorte**.
  - RF-014 · Borrado individual de un envío (con verificación de pertenencia a
    la cohorte).
  - RF-015 · Archivar cohorte (borrado suave, `archived:true`).
  - RF-016 · Respaldo completo del KV en JSON (`backup.json`).
  - RF-017 · Migración de datos heredados sin prefijo a una cohorte
    (`migrate-legacy`).
- **Modificados:**
  - RF-002 (autocompletado), RF-004/RF-005 (roster / bitácoras), RF-006/RF-007
    (export CSV): conservan su comportamiento, pero ahora **acotados a una
    cohorte** y servidos por rutas nuevas.
  - RNF-006 (escala): se elimina el barrido global del KV; las lecturas son por
    prefijo de cohorte (el patrón O(n) se conserva **dentro** de cada cohorte).
- **Descartados:**
  - RF-008 (borrado total por día, `POST /api/clear` / `prompt-clear`): se
    retira por destructivo y se reemplaza por archivar + borrado individual +
    respaldo (RF-015/RF-016/RF-017).

## Impacto

- **Código:**
  - Modelo: `Cohort {id, label, createdAt, archived}` en
    `backend/src/types.ts:31-37`; servicio de cohortes en
    `backend/src/services/cohorts.ts` (índice `cohorts` `:29-36`; helpers de
    prefijo `:8-16`; `slugify` `:19-27`; archivar `:89-93`; borrado individual
    `:105-120`; `migrateLegacy` `:122-146`; `buildBackup` `:148-157`).
  - Servicios acotados por prefijo y **dedupe por cohorte**:
    `backend/src/services/teams.ts:6-15` (`loadTeams`), `:17-25` (`dedupeTeams`),
    `:27-31` (`saveTeam`); `backend/src/services/prompts.ts`.
  - Rutas reorganizadas: alumno en `backend/src/routes/student.ts` (montado en
    `/api/c`); instructor en `backend/src/routes/admin.ts` (montado en
    `/api/admin`), ambas en `backend/src/index.ts:16-17`. Se retiran
    `routes/teams.ts` y `routes/prompts.ts`.
  - Frontend: `frontend/src/App.tsx` lee `?grupo=<id>` (`:12`, `:50`) y valida
    la cohorte; `frontend/src/views/Admin.tsx` gestiona cohortes (crear /
    listar / archivar, selector, tabs por cohorte, enlace para compartir),
    `frontend/src/api.ts` centraliza el header `X-Passcode` y las descargas por
    blob, `frontend/src/types.ts` agrega `Cohort`.
- **Datos:** cambia el esquema de llaves. Los datos nuevos viven bajo
  `cohort:<id>:team:*` y `cohort:<id>:prompt:*`, con índice en `cohorts`. Los
  datos heredados (`team:*` / `prompt:*`) **requieren migración** una vez con
  `POST /api/admin/migrate-legacy`, que respeta
  [RES-005](../requerimientos/restricciones.md) (no se pierden ni quedan
  ilegibles). Se conserva Replit KV como única base de datos
  ([RES-002](../requerimientos/restricciones.md)).
- **Docs:** nuevo [ADR-0004](../decisiones/0004-aislamiento-por-cohorte.md);
  este CC-003; [CC-004](CC-004-seguridad-acceso.md) para el endurecimiento del
  acceso que acompaña al cambio; y los RF/RNF nuevos y afectados ya
  formalizados en [`docs/requerimientos/`](../requerimientos/README.md).
- **Esfuerzo y riesgo:** medio-alto. Toca datos, rutas y UI, y rompe las rutas
  y el esquema de la línea base. Mitigado por la migración sin pérdida, el
  reemplazo del borrado destructivo por operaciones reversibles/respaldables, y
  la verificación (abajo).

## Decisión

Aprobado e **implementado** el 2026-07-09 por el Equipo Solanum. La decisión
técnica duradera queda en el
[ADR-0004](../decisiones/0004-aislamiento-por-cohorte.md).

## Verificación

Ejecutado el 2026-07-09 por el Equipo Solanum:

- **Typecheck y build:** `npm run typecheck` y `npm run build` corren **sin
  errores**.
- **Smoke en memoria:** **33/33** casos pasan (rutas de alumno acotadas por
  cohorte, gestión de cohortes, dedupe por cohorte, migración, respaldo,
  archivar y borrado individual).
- **Servidor real verificado:** el servicio levanta y responde. Como parte de
  esta verificación se **corrigió la degradación ante fallo del KV**: los
  handlers que leen el KV ahora capturan el error y devuelven 500
  (`Save failed.` / `Load failed.`) en vez de tumbar el proceso
  (`backend/src/routes/student.ts:16-18`, `:64-66`, `:88-90`); las rutas de
  nombres degradan a `{names:[]}` (`:31-33`). El servidor real degrada con
  gracia y no crashea.
- **Checklist de humo:** ver [checklist-humo.md](../pruebas/checklist-humo.md)
  antes del despliegue.
