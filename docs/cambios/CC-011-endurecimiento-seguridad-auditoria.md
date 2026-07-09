# CC-011 · Endurecimiento de seguridad tras auditoría

- **Fecha:** 2026-07-09
- **Solicitante:** Equipo Solanum
- **Estado:** implementado

## Descripción

Aplicar cinco correcciones de seguridad de bajo riesgo surgidas de una auditoría
del código, **sin añadir dependencias** (se respeta
[RNF-001](../requerimientos/no-funcionales.md#rnf-001--simplicidad-del-stack): el
backend mantiene exactamente 2 dependencias de producción). Todas son de backend
o defensa en profundidad en el frontend, sin cambiar el formato de datos del KV:

- **Fix A — URLs restringidas a `http(s)`.** El servidor solo recortaba la
  longitud de `linkedin` y `docUrl`; no validaba el esquema. Un alumno podía
  guardar `docUrl = "javascript:..."` y, al hacer clic el instructor en “Open
  prompts”, ese enlace corría en la sesión del instructor (que tiene el passcode).
  React **no** sanea `href`. Ahora el servidor acepta solo `http://` / `https://`
  (el LinkedIn inválido se descarta a `""`; un `docUrl` inválido devuelve 400), y
  el frontend además **no renderiza** un `href` que no sea `http(s)` (defensa en
  profundidad ante datos viejos ya almacenados).
- **Fix B — neutralización de inyección de fórmulas en CSV.** `csvLine` ya
  entrecomillaba y duplicaba comillas (impide romper el delimitador), pero no
  neutralizaba valores que empiezan con `= + - @` (o tab/CR): al abrir el CSV en
  Excel/Sheets se evaluarían como fórmula. Se prefija ese caso con una comilla
  simple para forzar texto.
- **Fix C — cabeceras de seguridad + límite de cuerpo explícito.** Un middleware
  propio (sin Helmet) fija `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer` y una CSP restrictiva.
  `express.json()` pasa a `{ limit: "100kb" }` explícito.
- **Fix D — rate limiting básico en memoria.** Un limitador propio (ventana fija
  por IP, sin dependencias) protege los POST públicos (`/submit`,
  `/prompt-submit`) y el gate de admin (`GET /cohorts`) contra inundación y
  fuerza bruta. Devuelve 429 al exceder. Igual que `withIndexLock`
  ([CC-008](CC-008-indice-cohortes-serializado.md)), es **en memoria**: no cubre
  múltiples instancias (ver “Impacto” y los límites conocidos).
- **Fix E — manejo global de errores.** Un middleware de error final devuelve
  `400 {error:"Malformed request body."}` ante JSON inválido (que ocurre en
  `express.json()` **antes** del `try/catch` del handler) y `500` genérico en
  otro caso, **sin** filtrar el stack.

## Motivación

La auditoría confirmó cada punto contra el código. Fix A cierra un vector de XSS
almacenado contra la sesión del instructor (el de mayor severidad). Fix B protege
al instructor al abrir los CSV exportados. Fix C y Fix D reducen la superficie de
ataque de una app pública (los enlaces de grupo no llevan passcode) sin salir de
la restricción de dependencias mínimas. Fix E evita respuestas de error crudas de
Express (con posible stack) ante cuerpos malformados. El límite conocido “no hay
rate limiting en ningún endpoint” pasa a **parcialmente resuelto** (in-memory).

## Requisitos afectados

- **Nuevos:**
  - **RNF-012** · Validación de esquema de URL (solo `http(s)`) en entradas.
  - **RNF-013** · Neutralización de inyección de fórmulas en CSV.
  - **RNF-014** · Cabeceras de seguridad HTTP + límite de cuerpo explícito.
  - **RNF-015** · Rate limiting básico (en memoria, por IP).
- **Modificados:**
  - RNF-003 · nota: el escape de HTML por JSX **no** cubre `href`; RNF-012 lo
    complementa.
  - RNF-004 · el límite de cuerpo pasa a ser explícito (`100kb`), no solo el
    default implícito de `express.json()`.
- **Resueltos (parcial):** el límite conocido “no hay rate limiting” pasa a
  “resuelto en memoria (un proceso)”; residual: múltiples instancias.

## Impacto

- **Código (backend):**
  - `backend/src/lib/validate.ts` — **nuevo**: `isHttpUrl`/`sanitizeHttpUrl`.
  - `backend/src/lib/csv.ts` — prefijo anti-fórmula.
  - `backend/src/lib/security.ts` — **nuevo**: `securityHeaders` y `rateLimit`
    (ambos de cero dependencias).
  - `backend/src/routes/student.ts` — validación de `linkedin`/`docUrl`.
  - `backend/src/index.ts` — cabeceras, `express.json({limit})`, limitadores en
    las rutas públicas y en `/cohorts`, y el middleware de error final.
- **Código (frontend, defensa en profundidad):**
  - `frontend/src/views/Admin.tsx` — guarda `href` (solo `http(s)`).
  - `frontend/src/views/Day2.tsx` — valida el link antes de enviar.
  - `frontend/src/api.ts` — helper `isHttpUrl` compartido por las vistas.
- **Datos:** ninguno. No cambia el formato de llaves ni requiere migración. Los
  `docUrl`/`linkedin` ya almacenados que no sean `http(s)` simplemente dejan de
  renderizarse como enlace (se muestran como texto o “no link”).
- **API:** cambio menor de contrato: `POST /api/c/:cohort/prompt-submit` ahora
  devuelve 400 si `docUrl` no es `http(s)`; las rutas con límite devuelven **429**
  al excederlo. El resto del contrato no cambia.
- **Dependencias:** **cero nuevas** (RNF-001 intacto). Cabeceras, rate limit y
  manejo de errores son código propio.
- **Docs:** este CC-011; nuevos RNF-012…RNF-015 y actualización de RNF-003/RNF-004
  y de los “Límites conocidos” en `no-funcionales.md`; notas de seguridad en
  `CLAUDE.md`, `arquitectura.md` y `backend/README.md`; pasos nuevos en la
  `checklist-humo.md`.
- **Esfuerzo y riesgo:** bajo. Sin dependencias nuevas ni cambio de datos. El
  rate limiting en memoria hereda el caveat multi-instancia ya documentado para el
  lock del índice; a la escala del curso (un proceso) es efectivo.

## Decisión

Aprobado el 2026-07-09 (Equipo Solanum). Refina la postura de seguridad de
[ADR-0004](../decisiones/0004-aislamiento-por-cohorte.md) /
[CC-004](CC-004-seguridad-acceso.md) sin cambiar su decisión; no requiere ADR
nuevo. La restricción de “cero dependencias nuevas” fue explícita para no violar
RNF-001.

## Verificación

Ejecutado el 2026-07-09 (Equipo Solanum). `npm run build` y `tsc --noEmit`
(backend y frontend) sin errores. Verificación E2E contra el servidor real
(`node backend/dist/index.js` con el `devStore` file-backed, que sí permite
escrituras en local):

- **Fix A** — `POST /prompt-submit` con `docUrl:"javascript:alert(1)"` → 400
  `Missing team, revised idea, or Google Doc link.`/URL inválida; con
  `docUrl:"https://docs.google.com/..."` → `{ok:true}`. Un `linkedin` no `http(s)`
  en el Día 1 se guarda como `""` (no aparece como enlace en el roster).
- **Fix B** — un equipo llamado `=1+1` aparece en `teams.csv` como `"'=1+1"`
  (prefijo de comilla simple; Excel/Sheets lo tratan como texto).
- **Fix C** — `curl -I` a la raíz muestra `X-Content-Type-Options`,
  `X-Frame-Options`, `Referrer-Policy` y `Content-Security-Policy`; un body > 100kb
  devuelve 413/400 controlado.
- **Fix D** — superar el umbral de `/submit` en la ventana devuelve **429**; al
  pasar la ventana, se vuelve a aceptar.
- **Fix E** — `POST` con `Content-Type: application/json` y cuerpo `"{"` devuelve
  `400 {"error":"Malformed request body."}` sin stack.
- **Checklist de humo:** ver [checklist-humo.md](../pruebas/checklist-humo.md)
  (pasos 17–19 nuevos) antes del despliegue en Replit.
