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

## Cómo funciona hoy

- **Día 1 — Team Check-In:** un integrante registra nombre del equipo, hasta
  6 miembros (LinkedIn opcional, un PM marcado) y la idea en una frase.
- **Día 2 — Prompt Log:** el equipo envía el enlace a su Google Doc con 20
  prompts y la idea revisada; el nombre del equipo se autocompleta con los
  registros del Día 1.
- **Vista instructor:** protegida con un passcode compartido; muestra
  estadísticas, tarjetas por equipo, export CSV y "borrar todo" por día.

Detalle técnico: [arquitectura.md](arquitectura.md); tabla completa del API:
[`README.md` de la raíz](../README.md).

## Contexto del curso (relatado por el equipo; no consta en el repo)

- El instructor evaluará a los equipos a través de esta plataforma, que se
  irá construyendo durante el curso.
- Cada equipo hizo fork del repo con la instrucción de "clonar y modificar lo
  que quieran", y presenta su **propuesta el 2026-07-09**.
- Nuestro equipo (Solanum) trabaja en la rama `Solanum_Branch`; `main`
  pertenece al upstream del instructor.

## Limitaciones observadas (verificadas en el código)

1. **Actividades fijas en el código** — agregar la actividad del Día 3 exige
   programar rutas y vista nuevas (una ruta en `backend/src/routes/` y una vista
   en `frontend/src/views/`). El stack cambió, pero la actividad sigue siendo
   código, no dato configurable.
2. **Sin noción de "clase"** — las llaves del KV son globales (`team:*`,
   `prompt:*`); dos grupos usando la misma instancia se mezclarían.
3. **Un passcode compartido** para cualquier instructor, sin cuentas ni
   sesiones (`backend/src/config.ts`, `backend/src/auth.ts`).
4. **Borrado de todo o nada** — el único mantenimiento de datos es "Clear"
   por día; no hay borrado individual, y reutilizar la app en otra edición
   implica perder el histórico.

Estas limitaciones son la base de la [visión](vision.md). El diagnóstico
proviene del plan original de Iker (`checkin-platform/`, hoy absorbido en
esta carpeta — ver [ADR-0002](decisiones/0002-evolucion-replit-nativa.md)) y
se verificó contra el código.
