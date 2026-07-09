# CC-006 · Materiales del profesor por día

- **Fecha:** 2026-07-09
- **Solicitante:** Equipo Solanum
- **Estado:** aprobado

## Descripción

Permitir que el portal muestre, por día, **materiales del profesor** (PDF,
presentaciones, imágenes, enlaces) de forma comprensible para el alumno. Se
adopta la **Opción B**: los archivos viven en `frontend/public/materials/day-NN/`
(Vite los copia tal cual a `dist/`, servidos por el `express.static` ya existente
en `/materials/day-NN/`), y un **manifest tipado** (`frontend/src/content/
materials.ts`) mapea día → materiales + textos pre-escritos (explicación previa,
resumen, preguntas guía). Un componente los muestra en la vista del día.

Las explicaciones y resúmenes son **texto pre-escrito** en el manifest, autoría
asistida por IA **en desarrollo**; la app **no** usa IA en tiempo de ejecución
(sigue vigente la decisión de [no-IA](../../CLAUDE.md)). Se añade además un README
de instrucciones para la IA (`frontend/public/materials/README.md`) que la guía
al **agregar material nuevo**: qué preguntarle al profesor (explicación previa,
resumen posterior, enlaces, diagrama, preguntas guía, instrucciones para no
técnicos), dónde poner los archivos y cómo registrarlos en el manifest. Ver el
[ADR-0006](../decisiones/0006-materiales-estaticos-sin-upload.md).

## Motivación

El mismo problema del [CC-005](CC-005-dia3-github-onboarding.md): los alumnos
necesitan el material del profesor accesible y explicado desde el portal, sin
depender de correos o enlaces sueltos. La Opción B lo resuelve **sin backend
nuevo, sin endpoints y sin dependencias**, apoyándose en infraestructura que ya
existe.

## Requisitos afectados

- **Nuevos** (a formalizar en `docs/requerimientos/`; ver *Docs*):
  - RF-020 · El portal muestra por día los materiales del profesor (enlace/botón
    para PDF/slides/enlaces; `<img>` inline para imágenes) con textos
    pre-escritos opcionales (intro, resumen, preguntas guía).
  - RF-021 · Los materiales son **archivos estáticos versionados** bajo
    `frontend/public/materials/day-NN/`, declarados en un manifest tipado
    (`frontend/src/content/materials.ts`); **no** hay subida desde la plataforma.
  - RNF-011 · No se usa IA en tiempo de ejecución para materiales: toda la prosa
    es texto pre-escrito en el manifest (autoría con IA solo en desarrollo).
- **Sin cambios:** modelo de datos (KV) y de acceso.

## Impacto

- **Código (solo frontend):**
  - `frontend/public/materials/day-NN/` (NUEVO) — archivos del profesor. Vite
    copia `frontend/public/*` a `dist/`, servido por el `express.static` de
    `backend/src/index.ts:20-21` en `/materials/...` (el fallback SPA excluye
    solo `/api`, `:22-25`).
  - `frontend/public/materials/README.md` (NUEVO) — instrucciones para la IA al
    agregar material (alternativa si no se quiere publicar: `docs/
    materiales-profesor.md`).
  - `frontend/src/content/materials.ts` (NUEVO) — manifest tipado día→materiales.
  - `frontend/src/ui.tsx` — componente `MaterialsList`.
  - `frontend/src/views/*` / `frontend/src/App.tsx` — insertar `MaterialsList` en
    la vista del día (o en una pestaña propia).
  - `frontend/src/styles.css` — estilos de la lista de materiales.
- **Datos:** ninguno. No toca el KV.
- **Docs:** este CC-006;
  [ADR-0006](../decisiones/0006-materiales-estaticos-sin-upload.md). RF-020/RF-021
  (estado `aprobado`) y RNF-011 formalizados en
  [funcionales.md](../requerimientos/funcionales.md) y
  [no-funcionales.md](../requerimientos/no-funcionales.md).
- **Esfuerzo y riesgo:** bajo. Sin backend ni dependencias nuevas. Riesgos: los
  materiales quedan **públicos** en `/materials/...` (sin passcode); los binarios
  versionados inflan el repo (mantener pocos y livianos); agregar material exige
  editar TS + build/deploy (el README para la IA mitiga la fricción).

## Comparación con la Opción A (subir desde la plataforma) — descartada

Que el profesor **suba** archivos desde el dashboard es autoservicio, pero mucho
más complejo con el stack actual: Replit KV es clave-valor de *strings* (no sirve
para binarios grandes; base64 en KV es abusivo), no hay object storage
configurado, y un upload real exige `multer` + validación de tipo/tamaño +
persistencia entre despliegues + endpoint de streaming. El filesystem de Replit
no es duradero entre deploys sin volumen dedicado. Demasiada superficie (deps,
seguridad, storage) para un equipo mayormente no-dev. Se **descarta por ahora**.

## Decisión

Aprobado el 2026-07-09 (Equipo Solanum): **Opción B1** (archivos estáticos +
manifest tipado en el frontend). Rationale duradero y criterio de disparo para
reconsiderar la Opción A en el
[ADR-0006](../decisiones/0006-materiales-estaticos-sin-upload.md).

## Verificación

Criterios (a comprobar al implementar):

- **Build + typecheck** sin errores; un archivo en `frontend/public/materials/
  day-03/` queda servido en `/materials/day-03/...` tras `npm run build` +
  `npm start`.
- En la vista del día, cada PDF/slide/enlace abre en pestaña nueva
  (`rel=noopener`) y cada imagen se muestra inline; intro/resumen/preguntas guía
  aparecen si están en el manifest.
- No hay subida de archivos, ni endpoint nuevo, ni IA en runtime.
- **Checklist de humo:** ver [checklist-humo.md](../pruebas/checklist-humo.md).
