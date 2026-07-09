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

## F2 — Implementación incremental (pendiente)

- La base para esta fase es ya el **stack moderno en la raíz** (F1). Sobre ella
  se implementan los CC aprobados en incrementos pequeños. Cada incremento:
  CC → código → [checklist de humo](pruebas/checklist-humo.md) (más
  `typecheck`/`build`) → registro actualizado.
- Orden sugerido por dependencia: actividades como datos → aislamiento por
  clase → administración fina. **Nada de esto está implementado aún**; la F1
  entregó la base, no las funcionalidades de la visión.
- **Salida:** cada incremento desplegado y verificado en Replit.

## F3 — Cierre

- Demo final, respaldo CSV de los datos de la edición, retrospectiva del
  equipo.
- **Salida:** entrega cerrada y datos respaldados.
