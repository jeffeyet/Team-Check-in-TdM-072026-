# Roadmap

Fases pequeñas; cada una termina en algo usable o demostrable. Las fechas de
las dos primeras las fija el curso; el resto depende de cómo continúe.

## F0 — Estructura y línea base · 2026-07-08 (hoy) ✔

- Estructura documental creada (requerimientos, control de cambios, ADRs,
  pruebas, notas, operación) y línea base de requisitos redactada desde el
  código.
- Pivote registrado: [ADR-0002](decisiones/0002-evolucion-replit-nativa.md)
  y [CC-001](cambios/CC-001-reestructura-documental.md).

## F1 — Propuesta del equipo y base moderna · 2026-07-09 ✔

- Sesión de equipo: validada la [visión](vision.md); revisada la decisión
  técnica y **pivote de rumbo** al stack moderno
  ([ADR-0003](decisiones/0003-stack-moderno-typescript-react.md), reemplaza al
  ADR-0002) vía [CC-002](cambios/CC-002-stack-moderno.md).
- **Reescritura del stack implementada (2026-07-09):** la app pasó a un stack
  moderno —backend TypeScript + Express y frontend React + Vite, un solo
  servicio en Replit, Replit KV— **en la raíz** (in-place), reemplazando a la
  app de un solo archivo (que queda en git, commit `37760a9`). La reescritura es
  **a paridad funcional**: verificada con smoke test (mismas rutas, mensajes,
  status, límites, dedupe y CSV). **No** añade funcionalidad nueva todavía.
- Revisar los [límites conocidos de la línea base](requerimientos/no-funcionales.md)
  como candidatos a RNF nuevos (rate limiting, passcode fuera de la query
  string, respaldo antes de borrar).
- **Salida:** propuesta presentada; base moderna a paridad en la raíz. Los
  requisitos nuevos de la visión aún no se registran como `aprobado`.

## F2 — Implementación incremental (en curso)

La base para esta fase es el **stack moderno en la raíz** (F1). El orden por
dependencia previsto era: aislamiento por clase → administración fina →
actividades como datos.

### Implementado · 2026-07-09 ✔

Primer incremento entregado, sobre la misma arquitectura y sin piezas nuevas
de infraestructura. Verificado con build + typecheck limpios y un smoke test de
handlers reales sobre KV en memoria (33/33); el servidor real degrada con
gracia y no cae (ver [pruebas/README.md](pruebas/README.md)).

- **Aislamiento por cohorte.** Índice en la llave `cohorts` y datos por prefijo
  `cohort:<id>:team:*` / `cohort:<id>:prompt:*`; lecturas siempre por prefijo
  (se elimina el barrido global O(n)) y **dedupe por cohorte** (corrige la
  colisión de equipos homónimos entre grupos). Rutas reorganizadas: alumno en
  `/api/c/*`, instructor en `/api/admin/*`; se eliminaron las rutas globales y
  el "Clear all" destructivo.
- **Endurecimiento del acceso.** Passcode por header `X-Passcode` (nunca en la
  URL), **fail-closed en producción** (obligatorio o 500), comparación
  timing-safe conservada, descargas por blob y `.gitignore` que ignora `*.csv`.
- **Seguridad de datos.** Archivar cohorte (borrado suave), borrar envío
  individual, respaldo completo (`backup.json`) y migración de datos heredados
  (`migrate-legacy`), en reemplazo del borrado destructivo.
- **Robustez.** Los handlers capturan errores del KV y responden 500 en vez de
  tumbar el servidor.

Detalle en [arquitectura.md](arquitectura.md) y [operacion.md](operacion.md).
El registro formal (CC/ADR de este trabajo) queda pendiente de la sesión de
equipo; ver [cambios/registro.md](cambios/registro.md).

### Pendiente

- **Actividades como datos:** generalizar el Día 1 / Día 2 a actividades
  configurables (tipo, título, ventana), para no programar una ruta y una vista
  por cada actividad nueva. La **mitad read-only** (guías) avanza con
  [CC-005](cambios/CC-005-dia3-github-onboarding.md) /
  [ADR-0005](decisiones/0005-guias-como-datos.md): los días se modelan como datos
  y las guías (Día 3) se pintan con un componente genérico. La mitad
  **`kind:"form"`** (los formularios que escriben, Día 1 / Día 2) sigue siendo
  la limitación de línea base vigente.
- **Materiales del profesor por día:** mostrar PDF/presentaciones/enlaces por día
  desde archivos estáticos + manifest tipado
  ([CC-006](cambios/CC-006-materiales-profesor.md) /
  [ADR-0006](decisiones/0006-materiales-estaticos-sin-upload.md)), sin subida
  desde la plataforma y sin IA en runtime.
- **Sin IA por ahora:** decisión deliberada del equipo; se retomaría solo con
  una idea realmente creativa.

Cada incremento sigue el ciclo: CC → código →
[checklist de humo](pruebas/checklist-humo.md) (más `typecheck`/`build`) →
registro actualizado.

- **Salida:** cada incremento desplegado y verificado en Replit.

## F3 — Cierre

- Demo final, respaldo CSV de los datos de la edición, retrospectiva del
  equipo.
- **Salida:** entrega cerrada y datos respaldados.
