# ADR 0004 · Aislamiento por cohorte sobre Replit KV

- **Estado:** aceptada
- **Fecha:** 2026-07-09

## Contexto

El [ADR-0003](0003-stack-moderno-typescript-react.md) dejó una base moderna
(TypeScript + Express, React + Vite) que reproduce a paridad la app original:
un único conjunto de datos con llaves planas `team:*` y `prompt:*`, pensado
para **una** corrida del curso. El instructor pidió algo que la línea base no
cubre: usar el portal con **varios grupos a lo largo del tiempo** y conservar
el **histórico** de las ediciones anteriores sin que los datos de un grupo se
mezclen con los de otro.

Con el esquema plano heredado esto no se sostiene:

- Todos los grupos comparten el mismo espacio de llaves. Un equipo de la
  cohorte de julio y otro homónimo de la de agosto colisionan.
- El dedupe del roster (RF-004) se hacía **global** por nombre de equipo, así
  que dos equipos con el mismo nombre en cohortes distintas se pisaban: solo
  sobrevivía el más reciente (bug real detectado).
- Cada consulta del instructor barría **todas** las llaves del KV
  (RNF-006, O(n) `get`s globales), sin forma de acotar por grupo.
- El único mecanismo de limpieza era el **borrado total** (RF-008,
  `POST /api/clear` / `prompt-clear`), destructivo y sin respaldo ni papelera
  (registrado como límite conocido). Para "empezar un grupo nuevo" había que
  borrar el anterior, perdiendo el histórico que justamente se quiere guardar.

Además, al preparar la adopción se detectó un problema de acceso (ver
[CC-004](../cambios/CC-004-seguridad-acceso.md)): el passcode viajaba por la
URL y el fork público arrastraba un default. Esa corrección va de la mano de
esta decisión porque el nuevo modelo de acceso (un passcode de instructor +
alumno por enlace de cohorte) es parte del mismo rediseño.

La restricción de plataforma no cambia: sigue siendo Replit, un solo servicio
y Replit KV como única base de datos ([RES-001](../requerimientos/restricciones.md),
[RES-002](../requerimientos/restricciones.md), [RES-003](../requerimientos/restricciones.md)),
y los datos existentes deben seguir siendo legibles
([RES-005](../requerimientos/restricciones.md)).

## Decisión

Introducir **aislamiento por cohorte**: cada grupo/edición es una **caja de
datos separada** dentro del mismo Replit KV, mediante un esquema de llaves con
prefijo y un índice de cohortes.

- **Modelo de datos.** Un índice bajo la llave `cohorts` guarda un arreglo JSON
  de `Cohort {id, label, createdAt, archived}`
  (`backend/src/types.ts:31-36`, `backend/src/services/cohorts.ts:29-36`). Los
  datos de cada grupo viven bajo los prefijos `cohort:<id>:team:*` y
  `cohort:<id>:prompt:*` (`backend/src/services/cohorts.ts:8-16`). El `id` es un
  slug derivado del label (`slugify`, `:19-27`).
- **Lecturas siempre por prefijo.** Se elimina el `list()` global de las
  **lecturas de datos por cohorte**: toda lectura de equipos/bitácoras se acota
  al prefijo de una cohorte (`backend/src/services/teams.ts:6-15`,
  `backend/src/services/prompts.ts`). Esto elimina el barrido O(n) sobre todo
  el KV y hace el **dedupe por cohorte** (`dedupeTeams` opera sobre la lista ya
  acotada a un grupo, `backend/src/services/teams.ts:19-25`), corrigiendo la
  colisión de equipos homónimos entre cohortes. *Excepción intencional:* el
  respaldo (`buildBackup`, `db.list("")`) y la migración (`migrateLegacy`,
  `db.list("team:")`/`db.list("prompt:")`) sí hacen barridos amplios; son
  operaciones de admin (ver RF-016/RF-017), no lecturas de datos por cohorte.
- **Modelo de acceso, sin cuentas.** Un **único passcode de instructor** (el
  profesor es el único admin) protege las rutas de gestión; el aislamiento del
  **alumno** es por la **cohorte a la que escribe**, vía el enlace
  `/?grupo=<id>` (`frontend/src/App.tsx:12`, `:50`). El alumno nunca elige
  cohorte con credenciales: la elige el enlace. El passcode se endurece en el
  mismo cambio (header `X-Passcode`, fail-closed en producción — detalle en
  [CC-004](../cambios/CC-004-seguridad-acceso.md)).
- **Rutas reorganizadas.** Rutas de alumno acotadas por cohorte en
  `backend/src/routes/student.ts`, montadas en `/api/c`
  (`GET /:cohort`, `GET /:cohort/teamnames`, `POST /:cohort/submit`,
  `POST /:cohort/prompt-submit`; 404 `Group not found.` si la cohorte no existe
  o está archivada, `student.ts:11-19`, `:37-40`, `:70-73`). Rutas de
  instructor en `backend/src/routes/admin.ts`, montadas en `/api/admin`
  (gestión de cohortes, roster/prompts y export por cohorte, borrado
  individual, archivar, `migrate-legacy`, `backup.json`;
  `backend/src/index.ts:16-17`). Se retiran las rutas globales anteriores
  (`routes/teams.ts`, `routes/prompts.ts`).
- **Seguridad de datos en vez de borrado destructivo.** El borrado total
  desaparece y se reemplaza por: **archivar** cohorte (borrado suave,
  `archived:true`, `backend/src/services/cohorts.ts:93-96`), **borrado
  individual** de un envío con verificación de que la llave pertenece a la
  cohorte (`:111-123`) y **respaldo completo** en JSON (`buildBackup`,
  `:152-161`; ruta `GET /api/admin/backup.json`).
- **Migración segura para adopción sin pérdida
  ([RES-005](../requerimientos/restricciones.md)).** `migrateLegacy` mueve las
  llaves heredadas sin prefijo (`team:*` / `prompt:*`) a la caja de una
  cohorte, dejando intactas las que ya están bajo `cohort:`
  (`backend/src/services/cohorts.ts:127-149`; ruta
  `POST /api/admin/migrate-legacy`). En el caso feliz los datos existentes no se
  pierden ni quedan ilegibles (mueve con `set` antes de `del`). *Matices
  registrados en la revisión de cohortes (ver
  [no-funcionales.md](../requerimientos/no-funcionales.md) “Límites conocidos”):*
  el movimiento **no es atómico ni idempotente** (un fallo del KV entre `set` y
  `del` puede dejar un registro duplicado) y **funde todo** el legado plano
  `team:*`/`prompt:*` en una sola cohorte destino (no separa ediciones previas;
  homónimos se colapsan al deduplicar).

## Alternativas consideradas

- **Etiqueta de cohorte en un campo del valor** (dejar las llaves planas
  `team:*`/`prompt:*` y añadir un campo `cohort` a cada registro, filtrando en
  memoria) — el cambio más pequeño, pero conserva el barrido global O(n) sobre
  todo el KV en cada consulta y no da aislamiento real: un error de filtrado
  expone datos de otro grupo, y las llaves siguen en un solo espacio. No
  resuelve la colisión de nombres a nivel de almacenamiento.
- **Base de datos relacional externa (Neon / Postgres)** con tablas
  `cohorts`, `teams`, `prompts` y claves foráneas — es el modelo más limpio y
  el que da consultas e integridad "de verdad", pero **choca con
  [RES-002](../requerimientos/restricciones.md)** (Replit KV como única base de
  datos) y con [RES-003](../requerimientos/restricciones.md) (sin
  infraestructura nueva), añade un servicio y superficie de mantenimiento que
  [RES-007](../requerimientos/restricciones.md) desaconseja para un equipo
  mayormente no desarrollador, y no era proporcional al plazo
  ([RES-006](../requerimientos/restricciones.md)). Se **descarta por ahora**.
  *Criterio de disparo futuro:* si las cohortes activas y su volumen crecen al
  punto de que el patrón O(n) por prefijo del KV se vuelva lento de forma
  perceptible, o si se necesitan consultas relacionales (cruces entre grupos,
  reportes agregados) o integridad referencial, entonces se reabre esta
  alternativa con un ADR nuevo que reemplace a este.

## Consecuencias

- (+) **Aislamiento real** por grupo: los datos de cada cohorte viven en su
  propia caja de llaves; un equipo homónimo en dos cohortes ya no colisiona
  (corrige el bug de dedupe global).
- (+) **Histórico sin pérdida**: empezar un grupo nuevo ya no exige borrar el
  anterior; el borrado destructivo se reemplaza por archivar + borrado
  individual + respaldo.
- (+) **Consultas acotadas**: las lecturas por prefijo eliminan el barrido
  global del KV; el trabajo por request escala con el tamaño de **una** cohorte,
  no de todo el histórico.
- (+) **Adopción sin fricción** de los datos ya capturados:
  `migrate-legacy` los mueve a una cohorte sin pérdida, cumpliendo
  [RES-005](../requerimientos/restricciones.md).
- (+) **Acceso más claro y más seguro**: un solo admin (passcode), alumnos
  por enlace; el passcode sale de la URL (ver
  [CC-004](../cambios/CC-004-seguridad-acceso.md)).
- (−) **Más superficie**: aparece el concepto de cohorte en datos, rutas y UI;
  hay más llaves y más rutas que entender y mantener
  ([RES-007](../requerimientos/restricciones.md)). Se mitiga manteniendo el
  código legible y las lecturas por un único helper de prefijo.
- (−) **Ruptura de rutas y de esquema respecto a la línea base**: las rutas
  globales `/api/*` de la app original desaparecen a favor de `/api/c/:cohort`
  y `/api/admin/*`; los datos nuevos viven bajo `cohort:<id>:*`. Los datos
  heredados **no** se leen ya de forma automática: requieren correr
  `migrate-legacy` una vez.
- (−) **El patrón O(n) por prefijo se conserva dentro de cada cohorte** (un
  `get` por llave). Es aceptable a la escala del curso
  ([RNF-006](../requerimientos/no-funcionales.md)); si deja de serlo, aplica el
  criterio de disparo hacia una base relacional.
- (−) **Sin atomicidad en el KV.** El índice `cohorts` es una sola llave con
  lectura-modificación-escritura sin compare-and-set, y `migrateLegacy` mueve con
  `set`+`del` no atómicos. A la escala del curso (un instructor) el riesgo es
  bajo pero real: dos pestañas o un doble clic pueden perder una entrada del
  índice por *last-write-wins*; un fallo del KV a media migración puede duplicar
  un registro. Detalle en
  [no-funcionales.md](../requerimientos/no-funcionales.md) “Límites conocidos”.
- Normalización del id: originalmente `getCohort`/`getActiveCohort` normalizaban
  con `slugify` pero las lecturas/borrados por prefijo y `updateCohort` no, así
  que un id no canónico daba lista vacía o 404 espurio (sin fuga entre cohortes).
  **Resuelto** en [CC-007](../cambios/CC-007-endurecimiento-cohortes.md): los
  helpers de prefijo y `updateCohort` ahora aplican `slugify`.
- La sincronización de los RF/RNF nuevos y afectados de
  [CC-003](../cambios/CC-003-cohortes.md) y
  [CC-004](../cambios/CC-004-seguridad-acceso.md) con `docs/requerimientos/`
  quedó **hecha** (RF-011…RF-017, RNF-007…RNF-010).
