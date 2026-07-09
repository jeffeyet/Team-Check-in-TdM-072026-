# ADR 0007 · Tipos: backend canónico + espejo documentado en el cliente

- **Estado:** aceptada
- **Fecha:** 2026-07-09

## Contexto

Las formas de datos del dominio (`Member`, `Team`, `PromptLog`, `Cohort`) están
declaradas **dos veces**: `backend/src/types.ts` y `frontend/src/types.ts`. Una
auditoría encontró que ya habían **divergido** sin que nadie lo notara: en el
frontend `Member.linkedin` era opcional (en el backend, obligatorio) y el
frontend añadía campos (`key?`, `ts?` opcional, `teamCount?`, `promptCount?`)
que el backend modela con tipos separados (`TeamRecord`/`PromptLogRecord` y el
índice con conteos). Al no haber una fuente de verdad, el contrato entre API y UI
puede seguir separándose en silencio y el typecheck no lo detecta (cada lado
compila contra su propia copia).

La pregunta que obliga a decidir: **¿cómo eliminamos la deriva sin romper el
stack actual?** El backend es CommonJS con `rootDir: "src"` y `frontend/` es un
proyecto Vite (ESM, `moduleResolution: bundler`) con su propio `include: ["src"]`.

## Decisión

Se conserva **una copia por proyecto**, pero con una **fuente canónica única y
explícita**: `backend/src/types.ts` es el **contrato de datos** (lo que se
almacena en el KV y lo que viaja por la API). `frontend/src/types.ts` es un
**espejo declarado** de ese contrato: sus tipos de datos deben coincidir campo a
campo con el backend, y **solo** puede añadir campos marcados como propios del
cliente (forma de respuesta de la API o conveniencia de la UI), enumerados en un
encabezado del archivo. La reconciliación de la deriva actual y esas notas de
sincronización se hacen en [CC-012](../cambios/CC-012-higiene-y-tipos.md).

## Alternativas consideradas

- **Paquete de tipos compartido (`shared/types.ts` importado por ambos).**
  Rechazado por ahora: rompe el layout de build. El backend usa `rootDir: "src"`;
  importar un archivo fuera de `src` obliga a subir el `rootDir` al ancestro
  común, y entonces `tsc` emite a `dist/backend/src/...` en vez de `dist/...`, lo
  que rompe `npm start` (`node dist/index.js`). Además introduce npm workspaces /
  monorepo, en tensión con [RNF-001](../requerimientos/no-funcionales.md#rnf-001--simplicidad-del-stack)
  (mínimas piezas, un solo servicio). Es un cambio que rompe, fuera del alcance de
  la remediación de auditoría. Queda como candidato a un ADR futuro si el código
  crece.
- **Generación por codegen (un lado genera el otro).** Rechazado: añade un paso
  de build y herramienta para dos archivos de ~40 líneas; el costo supera al
  beneficio a esta escala.
- **Dejar las dos copias sin gobierno.** Rechazado: es justo lo que causó la
  deriva silenciosa que encontró la auditoría.

## Consecuencias

- **Más fácil:** el contrato tiene un dueño claro (backend); un revisor sabe qué
  archivo manda y qué diferencias del frontend son legítimas (las enumeradas) y
  cuáles son deriva a corregir.
- **Más difícil / pendiente:** la sincronización sigue siendo **manual**; nada
  automatizado impide una divergencia futura. Se mitiga con las notas de
  encabezado y la revisión de código, no con tooling. Si esto resulta frágil, la
  alternativa del paquete compartido se reabre con un ADR nuevo (y el cambio de
  layout de build que implica).
