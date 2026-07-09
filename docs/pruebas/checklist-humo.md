# Checklist de humo

Pasos manuales de **comportamiento** que cubren la funcionalidad actual: el flujo
por **cohortes** (grupos con datos aislados), el acceso del alumno por enlace y la
gestión del instructor. Ejecutarla completa antes de desplegar.

Antes de empezar:

- Correr `npm run typecheck` y `npm run build` sin errores (verificación estática
  previa; ver [README.md](README.md)).
- Levantar la app (ver [../operacion.md](../operacion.md)): un solo servicio con
  `npm run build && npm run start` (`:3000`), o en dev con `npm run dev:backend` +
  `npm run dev:frontend` (`:5173`, proxy a `:3000`).
- Los pasos con base de datos (crear, enviar, exportar, borrar) requieren correr
  **dentro de Replit**: fuera de Replit las escrituras fallan por diseño de
  `@replit/database` y devuelven `Save failed.` (no es un bug; ver
  [../operacion.md](../operacion.md)). Con `PASSCODE` configurado como Secret.

> El paso 12 borra un envío y el 13 archiva un grupo (borrado suave, recuperable).
> Hacerlos en una instancia de pruebas y siempre tras el respaldo del paso 11.

| # | Paso | Resultado esperado |
|---|---|---|
| 1 | Instructor: abrir la app, entrar a la vista de instructor e ingresar el passcode correcto | Se desbloquea la lista de grupos (o "No groups yet") |
| 2 | Instructor: en **New group name** escribir un nombre y pulsar **Create group** | Aparece una tarjeta de grupo, marcada **Active**, con su id (slug) y conteos en 0 |
| 3 | Instructor: pulsar **Copy link** en la tarjeta del grupo | Se copia el enlace `/?grupo=<id>` (botón muestra "Copied ✓") |
| 4 | Alumno: abrir ese enlace `/?grupo=<id>` | Carga la vista de alumno del grupo (por defecto Prompt Log / Tuesday), sin pedir passcode |
| 5 | Alumno — Día 1: cambiar a Monday, enviar el formulario vacío | Error por campo faltante; nada se envía |
| 6 | Alumno — Día 1: llenar equipo + 1 miembro (marcar un PM) + idea y enviar | Confirmación "… is checked in." |
| 7 | Alumno — Día 2: hacer clic en el campo de equipo | Autocompleta con los equipos registrados en el Día 1 **de ese grupo** |
| 8 | Alumno — Día 2: enviar sin link; luego con equipo + idea revisada + link al Doc | Sin link → error; con todo → confirmación |
| 9 | Instructor: crear un **segundo** grupo y registrar en él un equipo con el **mismo nombre** que en el paso 6 | Al abrir cada grupo, el instructor ve **solo** los datos de ese grupo; los equipos homónimos no se mezclan (dedupe por cohorte) |
| 10 | Instructor: abrir el primer grupo, pestañas **Teams (Mon)** y **Prompt logs (Tue)** | Muestran stats y tarjetas solo de ese grupo; LinkedIn / Doc abren en pestaña nueva |
| 11 | Instructor: **Export CSV** en cada pestaña y **Download backup (JSON)** desde la lista de grupos | Descargan `<id>-team-checkins.csv`, `<id>-prompt-logs.csv` y `team-checkin-backup.json` (por `fetch`+blob, sin passcode en la URL) |
| 12 | Instructor: en una tarjeta, pulsar **Delete** en un envío y confirmar | Ese registro desaparece; el resto del grupo permanece |
| 13 | Instructor: **Archive** un grupo y confirmar | El grupo pasa a **Archived**; sus datos siguen en el respaldo |
| 14 | Alumno: abrir el enlace `/?grupo=<id>` del grupo archivado | Pantalla de código de grupo ("no encontrado"); no puede enviar |
| 15 | Instructor: ingresar un passcode **incorrecto** | "That passcode did not match." (el servidor responde 401) |
| 16 | Alumno: abrir la app **sin** `?grupo=` (o con un id inexistente) | Pantalla para ingresar el código del grupo; no hay vista de envío hasta resolver una cohorte válida |

Verificación estática asociada: `npm run typecheck` y `npm run build` deben pasar
sin errores antes de correr esta checklist.

Cobertura pendiente conocida: el comportamiento timing-safe (RNF-002) y la escala
(RNF-006) no se verifican a mano; se dan por cubiertos por lectura de código y por
el diseño de lecturas por prefijo (sin barrido global).
