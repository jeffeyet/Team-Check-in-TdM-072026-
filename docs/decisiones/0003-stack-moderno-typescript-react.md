# ADR 0003 · Stack moderno: TypeScript + Express y React + Vite

- **Estado:** aceptada
- **Fecha:** 2026-07-09
- **Reemplaza a:** [0002](0002-evolucion-replit-nativa.md)

## Contexto

El ADR 0002 (2026-07-08) decidió evolucionar la app existente **en su lugar**,
conservando el stack del instructor: Express + Replit KV + un solo HTML sin
build. La justificación era proporción y continuidad de cara a la presentación
del 2026-07-09.

Hoy, el mismo día de la presentación, el equipo revisa esa decisión. La app de
un solo archivo cumple, pero seguir creciéndola significa acumular lógica en dos
archivos (`index.js`, `public/index.html`) sin tipos, sin componentes y sin
separación clara entre UI, API y datos. La visión —actividades configurables,
aislamiento por clase, administración fina ([vision.md](../vision.md))— pide una
base sobre la que varias personas puedan trabajar sin pisarse. El equipo
decide, de forma deliberada, priorizar esa base por encima de la continuidad
estricta con el stack del instructor.

La restricción de plataforma no cambia: sigue corriendo en Replit como un solo
servicio y el almacenamiento sigue siendo Replit KV. Lo que cambia es cómo se
construye el código encima de eso.

El respaldo de la versión anterior es el **historial de git**: la app de un solo
archivo (`index.js` + `public/index.html`) queda preservada en el commit
`37760a9` y es recuperable con `git checkout 37760a9 -- index.js public`. No se
conserva una copia en el árbol de trabajo.

## Decisión

Reescribir la plataforma **a paridad funcional** y **en la raíz** (in-place),
reemplazando la app de un solo archivo por un stack moderno completo:

- **Backend:** TypeScript + Express, en `backend/` (CommonJS, `tsc` → `dist/`).
- **Frontend:** React + Vite (con build step), en `frontend/`.
- **Un solo servicio en Replit:** el backend sirve el build del frontend, igual
  que antes Express servía `public/`. No se añade un segundo proceso ni un
  despliegue aparte. Un `package.json` orquestador en la raíz coordina
  instalación, build y arranque; `.replit` corre todo como un solo servicio.
- **Almacenamiento:** se conserva Replit KV. No se agrega base de datos externa.
- **Reemplazo en el sitio:** `index.js` y `public/` se retiran del árbol de
  trabajo; el stack moderno ocupa su lugar en la raíz. La versión anterior no se
  deja como copia paralela: su respaldo es el historial de git (commit
  `37760a9`, recuperable con `git checkout 37760a9 -- index.js public`).

"A paridad" significa que la primera meta de la reescritura fue reproducir el
comportamiento actual (Día 1, Día 2, dashboard de instructor con passcode,
export CSV, borrado), no añadir funcionalidad nueva. Lo nuevo entra después,
por los cauces normales (CC + requisitos). La paridad se verificó con smoke
test: mismas rutas `/api`, mismos mensajes de error, mismos status, mismos
límites y CSV que la app anterior.

## Alternativas consideradas

- **Mantener el ADR 0002 tal cual** (evolucionar en su lugar, sin build) — es la
  opción de menor riesgo para hoy, pero deja la base sin tipos ni componentes;
  cada funcionalidad de la visión se implementa sobre dos archivos acoplados.
- **ADR 0002 modular sin build** (separar `index.js` en módulos CommonJS y el
  HTML en varios archivos servidos estáticos) — mejora el orden sin introducir
  build, pero no da tipado ni componentes reutilizables; el frontend sigue
  siendo JS a mano.
- **Modular + JSDoc** (misma modularización, tipos vía anotaciones JSDoc y
  `checkJs`) — acerca algo del beneficio de TypeScript sin build de backend,
  pero es un tipado parcial e incómodo y no resuelve el frontend.

## Consecuencias

- (+) Base **tipada y modular**: contratos explícitos entre UI, API y datos;
  menos errores silenciosos al crecer.
- (+) **Componentes reutilizables** en React: las vistas dejan de ser un
  `render()` a mano sobre un `<script>` único.
- (+) Estructura pensada para **varias personas y para crecer** hacia la visión
  (actividades, clases, admin fino) sin reescribir de nuevo.
- (−) Introduce un **build step** y **más dependencias** (TypeScript, Vite,
  React y su tooling), algo que el ADR 0002 evitaba a propósito.
- (−) **Mayor superficie de mantenimiento** para un equipo mayormente no
  desarrollador: más piezas que entender, actualizar y depurar con apoyo de IA.
- (−) Se asumió el **riesgo de reescribir el día de la presentación** y de
  **reemplazar la app en el sitio** en lugar de dejarla como copia paralela.
  Mitigado porque la versión anterior queda preservada en el historial de git
  (commit `37760a9`): si la reescritura fallara, se recupera con
  `git checkout 37760a9 -- index.js public`. La paridad se verificó con smoke
  test antes de dar el cambio por bueno.
- Queda **un solo árbol de código** en la raíz (`backend/` + `frontend/` +
  `package.json` orquestador), ya como fuente de verdad de la edición 07/2026.
  No conviven dos versiones en el árbol de trabajo: la app de un solo archivo
  vive únicamente en git.
