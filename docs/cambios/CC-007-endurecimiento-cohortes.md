# CC-007 · Endurecimiento de la lógica de cohortes (revisión)

- **Fecha:** 2026-07-09
- **Solicitante:** Equipo Solanum
- **Estado:** implementado

## Descripción

Aplicar dos correcciones de bajo riesgo surgidas de la revisión multiagente de la
lógica de cohortes (ver [no-funcionales.md](../requerimientos/no-funcionales.md)
“Límites conocidos”). Ambas son de backend, sin cambios de datos ni de API:

- **Fix A — `teamnames` respeta el archivado.** `GET /api/c/:cohort/teamnames`
  no pasaba por `getActiveCohort`, así que devolvía los nombres de equipo de una
  cohorte **archivada** a quien conociera el slug. Se añade el gate: si la
  cohorte no existe o está archivada, responde `{names: []}` (conserva el
  contrato "nunca falla / nunca 401" de esa ruta, sin filtrar datos).
- **Fix B — normalización consistente del id de cohorte.** `getCohort`/
  `getActiveCohort` normalizan con `slugify`, pero las lecturas/borrados por
  prefijo y `updateCohort`/`archiveCohort` usaban el id crudo, así que un id no
  canónico (p. ej. `Julio-2026`) resolvía la cohorte pero devolvía lista vacía o
  404 espurio. Se normaliza en el único punto de estrangulamiento: los helpers de
  prefijo (`cohortPrefix`/`teamPrefix`/`promptPrefix`) aplican `slugify`, y
  `updateCohort` normaliza su búsqueda. Idempotente para ids canónicos (la UI
  siempre los pasa), sin cambio de comportamiento en el flujo normal.

## Motivación

La revisión confirmó ambos como riesgos reales (aunque de baja probabilidad a la
escala del curso). Fix A cierra una fuga menor de nombres de equipo de ediciones
archivadas y alinea el código con [RF-015](../requerimientos/funcionales.md#rf-015--archivar-cohorte-borrado-suave)
("una cohorte archivada deja de ser accesible para alumnos"). Fix B elimina una
asimetría latente que podría hacer creer al instructor que se perdieron datos
(roster vacío para una cohorte que sí existe) si alguna vez llega un id no
canónico por API directa o por un cambio futuro de la UI.

## Requisitos afectados

- **Modificados:**
  - RF-015 · el archivado ahora **también** aplica a `teamnames` (se elimina la
    excepción documentada por la revisión).
  - RF-011 / RF-014 · `updateCohort`/`archiveCohort` y `deleteSubmission` ahora
    normalizan el id; dejan de depender de que el caller pase el slug canónico.
- **Resueltos** (dos "Límites conocidos" añadidos por la revisión): el gate de
  archivado de `teamnames` y la normalización asimétrica del id.
- **Sin resolver** (siguen como límites conocidos, fuera de alcance de este CC):
  la falta de atomicidad del índice `cohorts` (concurrencia) y de `migrateLegacy`.

## Impacto

- **Código (solo backend):**
  - `backend/src/services/cohorts.ts` — `cohortPrefix`/`teamPrefix`/`promptPrefix`
    aplican `slugify(id)`; `updateCohort` normaliza el id de búsqueda.
  - `backend/src/routes/student.ts` — el handler de `teamnames` resuelve con
    `getActiveCohort` y usa `cohort.id`.
- **Datos:** ninguno. No cambia el formato de llaves ni requiere migración; las
  escrituras ya usaban ids canónicos, así que no hay llaves con prefijo no
  canónico que queden huérfanas.
- **API:** sin cambios de contrato. `teamnames` sigue devolviendo `{names}` /
  `{names: []}`; el único cambio observable es que una cohorte archivada ahora
  devuelve `[]`.
- **Docs:** este CC-007; actualizar RF-015 (quitar la excepción), mover los dos
  límites resueltos a la subsección "Resueltos" de no-funcionales.md, y ajustar
  las notas de normalización en ADR-0004 y CLAUDE.md.
- **Esfuerzo y riesgo:** bajo. `slugify` es idempotente sobre ids canónicos, así
  que el flujo normal (UI con `?grupo=` y Admin con ids del índice) no cambia. El
  typecheck cubre las firmas.

## Decisión

Aprobado el 2026-07-09 (Equipo Solanum). Refina la implementación de
[ADR-0004](../decisiones/0004-aislamiento-por-cohorte.md) sin cambiar su decisión;
no requiere ADR nuevo.

## Verificación

Ejecutado el 2026-07-09 (Equipo Solanum). Build + `tsc --noEmit` del backend sin
errores. Verificación E2E contra el servidor real (`node backend/dist/index.js`
con el `devStore` file-backed, que sí permite escrituras en local):

- **Fix A** — `GET /api/c/agosto-2026/teamnames` con la cohorte activa devuelve
  `{"names":["Alpha"]}`; tras archivarla, la misma ruta devuelve `{"names":[]}`
  (ya no filtra los nombres de la cohorte archivada); `GET /api/c/agosto-2026`
  archivada sigue devolviendo 404 `Group not found.`
- **Fix B** — con id **no canónico** (`AGOSTO 2026`, URL-encoded):
  `teamnames` → `{"names":["Alpha"]}`; `roster` → devuelve el equipo Alpha;
  `PATCH` → 200 con la cohorte renombrada (ya no 404 espurio). `archive` de una
  cohorte inexistente sigue devolviendo 404 `Cohort not found.` La verificación
  anti-borrado-cruzado de `deleteSubmission` se conserva (el `:` final del
  prefijo y la re-prefijación impiden salir de la cohorte).
- **Flujo normal** (ids canónicos vía `?grupo=` y Admin) sin cambios; `slugify`
  es idempotente sobre slugs canónicos.
- **Checklist de humo:** ver [checklist-humo.md](../pruebas/checklist-humo.md)
  antes del despliegue en Replit.
