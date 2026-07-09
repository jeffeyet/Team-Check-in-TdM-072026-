# Requisitos no funcionales (RNF)

Línea base redactada desde el código el 2026-07-08. El 2026-07-09 las
referencias de **Fuente** se remapearon al stack moderno
([ADR-0003](../decisiones/0003-stack-moderno-typescript-react.md)), que ahora
vive en la raíz (`backend/` Express + TypeScript, `frontend/` React + Vite).
El comportamiento es paridad exacta con la app anterior; solo cambió dónde
vive el código. **Excepción:** RNF-001 y RNF-003 describen el propio stack y
la técnica de escape, que sí cambiaron con ADR-0003; su texto se actualizó
(ver notas en cada uno). Convenciones: [README.md](README.md).

---

## RNF-001 · Simplicidad del stack

- **Descripción:** la app se mantiene deliberadamente pequeña y de piezas
  conocidas: **un solo servicio** en Replit (el backend compila el frontend y
  lo sirve), backend con dependencias de producción mínimas y frontend con un
  framework estándar (React), sin infraestructura extra ni servicios
  adicionales.
- **Criterios de aceptación:**
  - Desde la raíz, `npm run build` + `npm start` bastan para construir y
    correr todo como un único proceso Node que sirve `frontend/dist`.
  - El backend mantiene exactamente 2 dependencias de producción
    (`express`, `@replit/database`).
  - El frontend usa solo React (`react`, `react-dom`) como dependencias de
    producción; sin librerías de estado, routing ni UI adicionales.
- **Estado:** implementado (línea base, redacción actualizada por ADR-0003).
- **Fuente:** `package.json` (raíz: scripts `build`/`start`),
  `backend/package.json` (2 deps de producción),
  `frontend/package.json` (solo React), `.replit` (un solo servicio).
- **Nota:** el [ADR-0003](../decisiones/0003-stack-moderno-typescript-react.md)
  cambió este requisito. La redacción original ("sin build step, sin
  frameworks, sin TypeScript; frontend en un solo archivo estático") ya **no
  aplica**: ahora hay build (`vite build` + `tsc`), TypeScript en todo el
  código y React en el frontend. Lo que se conserva es el *espíritu*:
  mínimas piezas, un solo servicio y dependencias acotadas.

## RNF-002 · Verificación del passcode resistente a timing

- **Descripción:** la comparación del passcode no filtra información por
  tiempo de respuesta.
- **Criterios de aceptación:** la comparación usa hashes SHA-256 y
  `crypto.timingSafeEqual`, con longitud constante.
- **Estado:** implementado (línea base).
- **Fuente:** `backend/src/auth.ts:7-9` (hash SHA-256 de ambos valores y
  `crypto.timingSafeEqual`).

## RNF-003 · Neutralización de HTML en datos de usuario

- **Descripción:** todo dato capturado por usuarios se muestra como texto y
  nunca se interpreta como HTML al insertarse en el DOM.
- **Criterios de aceptación:** un nombre de equipo como `<b>hola</b>` se
  muestra literal, sin interpretarse como HTML (cubierto por el paso 6 de la
  [checklist de humo](../pruebas/checklist-humo.md)).
- **Estado:** implementado (línea base, redacción actualizada por ADR-0003).
- **Fuente:** el escape lo da automáticamente React al renderizar los datos
  con `{valor}` (JSX): p. ej. `frontend/src/views/Admin.tsx:166` (nombre de
  equipo), `:170` (idea), `:176` (nombre de miembro), `:297` (idea revisada).
  No se usa `dangerouslySetInnerHTML` en ningún archivo de `frontend/src`.
- **Nota:** el [ADR-0003](../decisiones/0003-stack-moderno-typescript-react.md)
  cambió el mecanismo. Antes el escape era manual, con la función `esc()` del
  frontend de un solo archivo; ahora lo garantiza el escape por defecto de
  React (JSX). El comportamiento observable es el mismo.

## RNF-004 · Límites de tamaño en el servidor

- **Descripción:** el servidor trunca toda entrada de usuario a longitudes
  máximas, independientemente de lo que valide la interfaz.
- **Criterios de aceptación:** nombre de equipo ≤120, idea ≤240, nombre de
  miembro ≤120, LinkedIn ≤300, enlace de documento ≤500 caracteres; máximo
  6 miembros por equipo.
- **Estado:** implementado (línea base).
- **Fuente:** `backend/src/routes/teams.ts:24-38` (equipo/idea/miembro/LinkedIn
  y `.slice(0, 6)` de miembros), `backend/src/routes/prompts.ts:19-24`
  (equipo/idea/enlace del Día 2).

## RNF-005 · Operable con teclado (parcial)

- **Descripción:** los controles de navegación no nativos son accesibles con
  teclado.
- **Criterios de aceptación:** las pestañas (día y admin) tienen
  `role="tab"`, `aria-selected` y responden a Enter/Espacio; los campos de
  formulario tienen `label`.
- **Estado:** implementado (línea base). Cobertura parcial: no se ha hecho
  una auditoría completa de accesibilidad.
- **Fuente:** `frontend/src/ui.tsx:5-12` (`keyActivate`, Enter/Espacio) y
  `:39-72` (`DayTabs` con `role="tab"`/`aria-selected`);
  `frontend/src/views/Admin.tsx:13-20` (`keyActivate`) y `:388-411` (pestañas
  del panel de instructor); `label` con `htmlFor` en los formularios
  (`frontend/src/views/Day1.tsx:132,144,207`,
  `frontend/src/views/Day2.tsx:88,106,124`).

## RNF-006 · Escala del curso

- **Descripción:** el sistema atiende la escala real del curso (decenas de
  equipos) sin optimizaciones adicionales.
- **Criterios de aceptación:** las vistas de instructor cargan en tiempos
  razonables con decenas de registros, aun cuando cada consulta lee el KV
  llave por llave (O(n) `get`s por request).
- **Estado:** implementado (línea base).
- **Fuente:** `backend/src/services/teams.ts:4-13` (`loadTeams`: un `get` por
  cada llave `team:`), `backend/src/services/prompts.ts:4-17` (`loadPrompts`:
  un `get` por cada llave `prompt:`).

---

## Límites conocidos (observaciones; no son requisitos)

Comportamientos reales de la app hoy que la línea base **no** garantiza como
cualidades (registrados aquí como hechos, no como trabajo planeado; su
priorización futura se decide en [F1 del roadmap](../roadmap.md)):

- El passcode es único y compartido; viaja como query param en varias rutas
  (queda en historiales y logs de acceso).
- No hay rate limiting en ningún endpoint (envíos públicos ni intentos de
  passcode).
- "Clear" no tiene deshacer ni papelera; el único respaldo es descargar los
  CSV antes (ver [operacion.md](../operacion.md)).
- Los re-envíos del Día 1 dejan llaves antiguas en el KV que ya no se
  muestran (solo la más reciente por nombre), pero siguen ocupando espacio.
