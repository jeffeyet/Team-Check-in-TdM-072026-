# Contexto — la plataforma tal como está hoy

*Última revisión: 2026-07-09.*

## Qué es

Portal web del **AI Leadership Intensive** (Berkeley Innovation Group). El
instructor (upstream `jeffeyet/Team-Check-in-TdM-072026-`) lo construyó sobre
la marcha: cada día del curso agrega la actividad que toca y los equipos la
usan en clase. Corre en Replit.

## Cómo se ha construido (historial del upstream, verificado en git)

| Commit | Qué agregó |
|---|---|
| `b4a2d96` "Add files via upload" | La app inicial: check-in de equipos (Día 1) |
| `29271f4` "Added Day 2 prompt log" | Segunda actividad: bitácora de prompts (Día 2) |
| `08692fd` "Update index.html" | Ajustes a la interfaz |

En el upstream el patrón era: **cada actividad nueva implicaba editar `index.js`
(rutas) y `public/index.html` (vista) a mano** en una app de un solo archivo.

## Cómo evolucionó (equipo Solanum)

El equipo reescribió la app a un **stack moderno** —backend TypeScript + Express
y frontend React + Vite— que hoy vive **en la raíz** del repo, reemplazando a la
app de un solo archivo. La reescritura se hizo **a paridad funcional** (mismo
comportamiento observable) y en su lugar, no en una carpeta aparte; ver
[CC-002](cambios/CC-002-stack-moderno.md) y
[ADR-0003](decisiones/0003-stack-moderno-typescript-react.md). El **historial
del upstream** de la tabla anterior y el **contexto del curso** se conservan sin
cambios.

La **versión de un solo archivo** (`index.js` + `public/index.html`) quedó en el
historial de git, en el commit `37760a9`; se recupera con
`git checkout 37760a9 -- index.js public`. Ya no hay copia en el árbol de
trabajo.

Sobre esa base moderna, el **2026-07-09** el equipo agregó el manejo de
**múltiples grupos (cohortes) con datos aislados e histórico**: cada grupo es
una caja de datos separada, el instructor comparte un enlace por grupo, y
reutilizar la app en otra edición ya no implica perder los datos anteriores
(archivar en vez de borrar). Ver [arquitectura.md](arquitectura.md) y
[operacion.md](operacion.md).

## Cómo funciona hoy

- **Grupos (cohortes):** el instructor crea un grupo, obtiene un enlace
  (`/?grupo=<id>`) y lo comparte. Los datos de cada grupo quedan aislados de los
  demás; los grupos viejos se pueden archivar sin borrar su histórico.
- **Día 1 — Team Check-In:** un integrante registra, **dentro de su grupo**,
  nombre del equipo, hasta 6 miembros (LinkedIn opcional, un PM marcado) y la
  idea en una frase.
- **Día 2 — Prompt Log:** el equipo envía el enlace a su Google Doc con 20
  prompts y la idea revisada; el nombre del equipo se autocompleta con los
  registros del Día 1 de ese mismo grupo.
- **Vista instructor:** protegida con un passcode (enviado por header, nunca en
  la URL); lista los grupos, y por grupo muestra estadísticas, tarjetas por
  equipo, export CSV, borrado de un envío individual, archivar el grupo y
  respaldo completo en JSON. El "borrar todo" destructivo ya no existe.

Detalle técnico: [arquitectura.md](arquitectura.md); tabla completa del API:
[`README.md` de la raíz](../README.md).

## Contexto del curso (relatado por el equipo; no consta en el repo)

- El instructor evaluará a los equipos a través de esta plataforma, que se
  irá construyendo durante el curso.
- Cada equipo hizo fork del repo con la instrucción de "clonar y modificar lo
  que quieran", y presenta su **propuesta el 2026-07-09**.
- Nuestro equipo (Solanum) trabaja en la rama `Solanum_Branch`; `main`
  pertenece al upstream del instructor.

## Estado de las limitaciones de la línea base

El diagnóstico original de la línea base (base del plan de Iker,
`checkin-platform/`, hoy absorbido en esta carpeta — ver
[ADR-0002](decisiones/0002-evolucion-replit-nativa.md)) listaba cuatro
limitaciones. Con la implementación del 2026-07-09, tres se resolvieron:

1. **Actividades fijas en el código** — *sigue vigente*. Agregar la actividad
   del Día 3 exige programar una ruta y una vista nuevas. La actividad sigue
   siendo código, no dato configurable (queda como trabajo futuro en el
   [roadmap](roadmap.md)).
2. **Sin noción de "clase"** — *resuelto*. Las llaves del KV se prefijan por
   cohorte (`cohort:<id>:team:*` / `prompt:*`) y las lecturas son por prefijo;
   los grupos ya no se mezclan (`backend/src/services/cohorts.ts`,
   `teams.ts`, `prompts.ts`).
3. **Un passcode compartido, sin cuentas** — *mitigado*. Sigue siendo un solo
   passcode de instructor (decisión deliberada: el profesor es el único admin),
   pero ahora viaja por el header `X-Passcode` (nunca en la URL) y es
   obligatorio en producción (fail-closed) (`backend/src/auth.ts`,
   `backend/src/config.ts`).
4. **Borrado de todo o nada** — *resuelto*. Hay borrado por envío individual,
   archivar la cohorte (borrado suave) y respaldo completo en JSON; reutilizar
   la app en otra edición ya no implica perder el histórico
   (`backend/src/routes/admin.ts`, `backend/src/services/cohorts.ts`).

Estas limitaciones fueron la base de la [visión](vision.md).
