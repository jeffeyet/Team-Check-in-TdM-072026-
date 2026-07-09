# Checklist de humo

Pasos manuales de **comportamiento** que cubren la funcionalidad actual (línea
base RF-001…RF-010). Siguen vigentes porque el stack moderno se reescribió **a
paridad** con la app anterior. Ejecutarla completa antes de desplegar.

Antes de empezar, levantar la app (ver [../operacion.md](../operacion.md)): en
un solo servicio con `npm run build && npm run start` (`:3000`), o en modo
desarrollo con `npm run dev:backend` + `npm run dev:frontend` (`:5173`, con
proxy a `:3000`). Conviene además haber corrido `npm run typecheck` y
`npm run build` sin errores. Los pasos con base de datos requieren correr
**dentro de Replit** (en local los envíos fallan por diseño; ver
[../operacion.md](../operacion.md)).

> **Los pasos 12–13 borran datos.** Solo en instancia de pruebas, y siempre
> descargando antes los CSV (paso 11).

| # | Paso | Resultado esperado |
|---|---|---|
| 1 | Abrir `/` | Carga la vista **Prompt Log** (Tuesday), la vista por defecto |
| 2 | Alternar las pestañas Monday/Tuesday con clic y con teclado (Tab + Enter/Espacio) | La vista cambia en ambos casos |
| 3 | Día 1: enviar el formulario vacío | Mensaje de error por el campo faltante; nada se envía |
| 4 | Día 1: marcar PM en un miembro y luego en otro | Solo el último queda marcado |
| 5 | Día 1: llenar equipo + 1 miembro + idea y enviar | Pantalla de confirmación "… is checked in." |
| 6 | Día 1: registrar un equipo cuyo nombre incluya `<b>hola</b>` | En el roster del instructor se ve literal, sin negritas (escape de HTML) |
| 7 | Día 2: hacer clic en el campo de equipo | Autocompleta con los equipos registrados el Día 1 |
| 8 | Día 2: enviar sin link | Error "Paste your Google Doc link."; al llenar todo → confirmación |
| 9 | Instructor view: passcode incorrecto | "That passcode did not match." |
| 10 | Instructor view: passcode correcto | Dashboard con pestañas Teams/Prompt logs, stats y tarjetas; los enlaces de LinkedIn/Doc abren en pestaña nueva |
| 11 | Export CSV en ambas pestañas | Descargan `team-checkins.csv` y `prompt-logs.csv` con los datos enviados |
| 12 | Clear teams / Clear logs | Piden confirmación; al aceptar, la lista queda vacía |
| 13 | Tras el clear, recargar y volver a entrar | Estados vacíos correctos ("No team check-ins yet" / "No prompt logs yet") |

Cobertura pendiente conocida: RNF-002 (timing-safe) y RNF-006 (escala) no
son verificables a mano; se dan por cubiertos por lectura de código.
