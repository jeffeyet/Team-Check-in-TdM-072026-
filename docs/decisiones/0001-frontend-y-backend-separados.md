# ADR 0001 · Código nuevo con frontend y backend separados, dentro del fork

- **Estado:** reemplazada por [0002](0002-evolucion-replit-nativa.md) (2026-07-08)
- **Fecha:** 2026-07-08

> Documento histórico del plan original (`checkin-platform/`). Se conserva
> íntegro; la decisión vigente es el ADR 0002. Nota: las fases «F1–F3» que
> menciona el cuerpo pertenecen al roadmap de ese plan retirado y no
> corresponden a las fases F1–F3 del [roadmap vigente](../roadmap.md).

## Contexto

La app actual vive en dos archivos (`index.js`, `public/index.html`) acoplados
a una sola edición del curso: actividades fijas, un passcode compartido, un KV
global sin relaciones. Queremos gestionar varias clases en paralelo. El repo
del equipo (`erickmdgz/...`) es un fork del repo del curso (upstream del
instructor, `jeffeyet/...`); el trabajo del equipo se evidencia en la rama
`Solanum_Branch`, nunca en `main`.

## Decisión

Construir la plataforma como **código nuevo** bajo `checkin-platform/` en este
mismo repo (rama `Solanum_Branch`), con `frontend/` (SPA) y `backend/` (API
REST + base de datos relacional) separados en código, y la opción de
desplegarse como un solo servicio al inicio. La app actual (raíz del repo) no
se modifica y sigue en uso para la edición 07/2026.

## Alternativas consideradas

- **Evolucionar el código actual** — el acoplamiento (UI + API + datos en dos
  archivos, KV sin relaciones) hace que "evolucionar" sea reescribir por
  partes, pero con las restricciones de la app en producción encima.
- **Carpeta o repo aparte, fuera del fork** — no deja evidencia del trabajo
  del equipo donde el curso lo evalúa.
- **Front y back en repos separados** — más ceremonia (dos repos, versionar el
  contrato del API) sin beneficio a este tamaño de equipo.

## Consecuencias

- (+) Libertad total de stack y de modelo de datos; histórico por clase desde
  el día uno.
- (+) El API queda documentado y testeable por sí solo.
- (+) Todo el avance queda trazado en `Solanum_Branch`, visible para el equipo
  y el curso.
- (−) Conviven dos apps en un mismo repo durante la transición (F1–F3); si la
  plataforma crece, moverla a repo propio será una decisión futura (nuevo ADR).
- (−) La migración de datos de la edición actual solo puede hacerse vía
  export CSV.
