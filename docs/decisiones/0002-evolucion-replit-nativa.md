# ADR 0002 · Evolucionar la app existente, Replit-nativa

- **Estado:** reemplazada por [0003](0003-stack-moderno-typescript-react.md) (2026-07-09)
- **Fecha:** 2026-07-08
- **Reemplaza a:** [0001](0001-frontend-y-backend-separados.md)

> Reemplazada por el [ADR-0003](0003-stack-moderno-typescript-react.md): el equipo optó por un stack moderno a paridad, reescrito en la raíz.

## Contexto

El ADR 0001 proponía construir una plataforma nueva bajo `checkin-platform/`
con frontend y backend separados; su arquitectura propuesta —explícitamente
pendiente de confirmarse en un ADR— contemplaba Vite + React, PostgreSQL y
cuentas de instructor con sesiones. El diagnóstico del problema era correcto
y las ideas de producto siguen vigentes — actividades configurables, aislamiento
por clase, administración fina — hoy recogidas en [vision.md](../vision.md).

Restricciones que ese plan no incorporaba:

- El curso corre sobre la infraestructura que eligió el instructor: un solo
  repl con Express + Replit KV, sin build step. La propuesta del equipo debe
  seguir corriendo ahí.
- La propuesta se presenta el 2026-07-09.
- El equipo es mayormente no desarrollador; el resultado debe poder
  explicarse y mantenerse con apoyo de IA.

Precisión técnica, para ser justos con el plan original: Replit sí puede
alojar PostgreSQL y apps con build. La decisión no es por imposibilidad,
sino por **proporción y continuidad**.

## Decisión

Evolucionar **la app existente en su lugar** (raíz del repo: `index.js`,
`public/`), conservando el stack del instructor: Express + Replit KV + un
solo HTML sin build. La planeación vive en `docs/` (raíz);
`checkin-platform/` se retira y sus documentos se absorben adaptados (visión,
plantillas de ADR y de reunión, este historial de decisiones). Las
funcionalidades de la visión se implementan con medios simples: actividades
como datos en el KV, prefijos de llave por clase, borrado individual.

## Alternativas consideradas

- **Continuar el plan del ADR 0001** — desproporcionado para el plazo y el
  perfil del equipo; rompe la continuidad con la infraestructura del curso
  sin necesidad.
- **Mantener ambos árboles (`docs/` y `checkin-platform/`)** — dos fuentes de
  verdad, una de ellas desactualizada desde el día uno.
- **Repo aparte para la plataforma nueva** — ya descartado en el ADR 0001: no
  deja evidencia donde el curso evalúa.

## Consecuencias

- (+) La propuesta es demostrable de inmediato sobre la app real.
- (+) Un solo stack que todo el equipo puede seguir; cero costo nuevo.
- (+) Los datos de la edición 07/2026 se conservan y siguen sirviendo.
- (−) La visión debe caber en las restricciones del KV y de un solo servicio;
  lo que no quepa se pospone.
- (−) Si el proyecto crece hasta necesitar la separación que planteaba el
  ADR 0001, será una decisión nueva (otro ADR), con este trabajo como base.
