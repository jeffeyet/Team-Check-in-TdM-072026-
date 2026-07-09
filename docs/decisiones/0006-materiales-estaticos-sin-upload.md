# ADR 0006 · Materiales del profesor: archivos estáticos + manifest, sin subida ni IA en runtime

- **Estado:** propuesta
- **Fecha:** 2026-07-09

## Contexto

El portal debe mostrar por día los **materiales del profesor** (PDF,
presentaciones, imágenes, enlaces) de forma comprensible para el alumno (ver
[CC-006](../cambios/CC-006-materiales-profesor.md)). La restricción de plataforma
sigue vigente: Replit, un solo servicio y **Replit KV** como única base de datos
([RES-001..003](../requerimientos/restricciones.md)); el KV es clave-valor de
*strings*, no hay object storage y no se quiere infraestructura nueva
([RES-007](../requerimientos/restricciones.md), equipo mayormente no-dev).

Un hecho de la arquitectura actual habilita una solución barata: el backend sirve
`frontend/dist` con `express.static` y un fallback SPA que excluye solo `/api`
(`backend/src/index.ts:20-25`). Vite copia `frontend/public/*` tal cual a
`dist/`, así que un archivo en `frontend/public/materials/...` queda servido en
`/materials/...` **sin tocar Express**. (`frontend/public/` aún no existe; se
crea con este cambio.) Se suma la decisión de **no-IA** en la app
([CLAUDE.md](../../CLAUDE.md)): las explicaciones no pueden generarse en runtime.

## Decisión

Servir los materiales como **archivos estáticos versionados** en
`frontend/public/materials/day-NN/`, declarados en un **manifest tipado**
(`frontend/src/content/materials.ts`) que mapea día → `{ intro?, summary?,
guidingQuestions?[], items: [{ title, kind, href, note? }] }`. Un componente
`MaterialsList` los renderiza (enlace en pestaña nueva con `rel=noopener` para
PDF/slides/enlaces; `<img>` inline para imágenes). Toda la prosa (explicación
previa, resumen, preguntas guía) es **texto pre-escrito** en el manifest —
autoría asistida por IA **en desarrollo**, nunca IA en runtime. Los diagramas se
autoran como **imágenes PNG/SVG**, no como Markdown/Mermaid en cliente. Un README
(`frontend/public/materials/README.md`) guía a la IA al agregar material nuevo.

## Alternativas consideradas

- **Subir archivos desde la plataforma (Opción A)** — autoservicio para el
  profesor, sin redeploy, pero: el KV no sirve para binarios grandes; no hay
  object storage; un upload real exige `multer` + validación de tipo/tamaño +
  persistencia entre deploys + endpoint de streaming; el filesystem de Replit no
  es duradero entre despliegues. Demasiada superficie (deps, seguridad, storage)
  para el stack y el equipo. Se **descarta por ahora**. *Criterio de disparo
  futuro:* si se adopta un object storage (o Postgres/Neon, ver criterio del
  [ADR-0004](0004-aislamiento-por-cohorte.md)) y el volumen de materiales lo
  justifica, se reabre con un ADR nuevo.
- **`materials/` en la raíz servido por un `express.static` extra + manifest por
  `fetch` (B2)** — separa los materiales del bundle, pero añade una línea de
  backend (y cuidado con el orden respecto al fallback `app.get("*")`), un estado
  de carga/error en el frontend y pierde el tipado en build, sin beneficio real
  frente a B1.
- **Markdown/Mermaid en runtime** (`react-markdown` / `marked` / `mermaid`) —
  daría prosa y diagramas ricos, pero añade dependencias y **superficie XSS**, y
  choca con la postura de no-IA/simplicidad. Se usa texto pre-escrito e imágenes.

## Consecuencias

- (+) **Cero backend, cero endpoints, cero dependencias nuevas**; se apoya en el
  `express.static`/fallback ya existente.
- (+) Manifest **tipado** (import en build, sin `fetch` extra, con autocompletado
  y chequeo de tipos); `frontend/public/` **sí** se versiona (`dist/` está en
  `.gitignore`, `public/` no), así que los materiales sobreviven al build. Mismo
  origen ⇒ descargas y visor nativo de PDF sin CORS. No hay IA en runtime.
- (−) Los materiales quedan **públicos** en `/materials/...` (sin passcode ni
  aislamiento por cohorte): apropiado para material de clase; material sensible
  sería una decisión aparte.
- (−) Agregar material exige **editar TS + build/deploy** (no es subida desde la
  UI); el README para la IA mitiga la fricción para el equipo no-dev.
- (−) Los binarios versionados **inflan el repo** con el tiempo: mantener pocos
  archivos y tamaños razonables.
- Queda **pendiente** formalizar RF-020/RF-021/RNF-011 en
  `docs/requerimientos/`; el estado pasa a **aceptada** al implementar el CC-006.
