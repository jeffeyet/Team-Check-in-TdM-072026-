# Operación — correr, desplegar y respaldar

## Correr localmente (build + un servicio)

Igual que en Replit: un solo servicio que sirve el frontend ya compilado.
Ejecutar desde la raíz del repo:

```bash
npm run install:all   # instala dependencias de backend/ y frontend/
npm run build         # vite build (frontend/dist) + tsc (backend/dist)
npm run start         # → http://localhost:3000
```

`npm run start` levanta el backend (`node backend/dist/index.js`), que sirve el
build del frontend (`frontend/dist`) más el fallback SPA y expone el API. Antes
de un despliegue conviene correr `npm run typecheck` (`tsc --noEmit` del
backend).

## Correr en modo desarrollo (dos terminales)

Para iterar con recarga en caliente, dos procesos en paralelo:

```bash
# Terminal 1 — API con recarga (tsx watch)
npm run dev:backend    # → http://localhost:3000

# Terminal 2 — Vite dev server
npm run dev:frontend   # → http://localhost:5173
```

Se trabaja en `http://localhost:5173`; Vite hace **proxy** de `/api` hacia el
backend en `:3000` (configurado en `frontend/vite.config.ts`).

**Limitación verificada:** fuera de Replit el servidor arranca y la interfaz
carga, pero toda operación de base de datos falla (los envíos devuelven
`Save failed.`), porque `@replit/database` necesita el `REPLIT_DB_URL` que
solo existe dentro de un workspace de Replit. Lo local sirve para trabajar
interfaz y rutas; las lecturas/escrituras reales se prueban en Replit.

## Desplegar en Replit

1. Importar el repo: **Create App → Import from GitHub** (rama
   `Solanum_Branch`).
2. **Run** para probar; **Deploy → Autoscale** para obtener URL pública.
3. La configuración de arranque vive en `.replit` (raíz del repo), que corre un
   solo flujo: `npm run install:all && npm run build && npm run start`. Replit
   instala, compila y levanta el servicio único.

## Configuración

| Variable | Default | Propósito |
|---|---|---|
| `PASSCODE` | *(ninguno en producción)* | Passcode del instructor. **Obligatorio en producción** — definirlo como Secret en Replit (Tools → Secrets) |
| `PORT` | `3000` | Puerto HTTP |

**`PASSCODE` es obligatorio en producción (fail-closed).** Si
`NODE_ENV=production` o hay `REPLIT_DEPLOYMENT` y `PASSCODE` **no** está
definido, todas las rutas de instructor responden
`500 "Server passcode not configured."` — la app no cae a un default. Solo en
**desarrollo** se usa el default `roster2026`, y el servidor lo advierte al
arranque (`backend/src/config.ts`, `backend/src/auth.ts`). Definir el Secret
`PASSCODE` en Replit antes de desplegar es un paso obligatorio.

El passcode se envía **por el header `X-Passcode`** (o `{code}` en el body de un
POST), nunca por la URL. Las descargas (CSV y `backup.json`) se bajan por
`fetch` + blob desde el front, así que el passcode tampoco queda en la barra de
direcciones ni en el historial.

## Crear un grupo y compartir el enlace (instructor)

1. Abrir la app, entrar a la **vista de instructor** (switch en la cabecera) e
   ingresar el passcode.
2. En **New group name**, escribir el nombre del grupo (p. ej. `July 2026`); el
   id (slug) se deriva solo, o se puede fijar uno en **Custom id (optional)**.
   Pulsar **Create group**.
3. En la tarjeta del grupo, usar **Copy link** para copiar el enlace
   `/?grupo=<id>` y compartirlo con los alumnos de ese grupo. Todo lo que
   envíen queda aislado en ese grupo.

Un alumno que abre la app **sin** `?grupo=` (o con un grupo inexistente o
archivado) ve una pantalla para ingresar el código del grupo; no puede enviar
nada hasta resolver una cohorte válida (`frontend/src/App.tsx`).

Para reutilizar la app en otra edición: crear un grupo nuevo (los anteriores
siguen intactos) y, cuando un grupo termine, **Archive** lo retira del acceso de
alumnos **sin borrar** sus datos.

## Respaldos

**Datos.** El borrado destructivo "Clear all" **ya no existe**. Las opciones de
mantenimiento de datos, todas desde la vista de instructor, son:

- **Respaldo completo (JSON):** botón **Download backup (JSON)** →
  `GET /api/admin/backup.json`. Baja el índice de cohortes más todas las
  llaves/valores del KV. Es el respaldo recomendado antes de cualquier
  operación destructiva o migración.
- **CSV por grupo:** dentro de un grupo, **Export CSV** en las pestañas Teams y
  Prompt logs (`.../export/teams.csv` y `.../export/prompts.csv`). Cada archivo
  contiene solo los datos de ese grupo.
- **Borrado por envío:** botón **Delete** en una tarjeta de equipo o de
  bitácora borra únicamente ese registro (sí es irreversible, con confirmación).
- **Archivar grupo:** **Archive** marca el grupo como archivado (borrado suave);
  sus datos se conservan y siguen apareciendo en el respaldo.
- **Migrar datos heredados:** **Import legacy** mueve llaves antiguas sin
  prefijo (`team:*` / `prompt:*`) al grupo elegido, para adoptar la versión por
  cohortes sin perder datos.

> **Nota de higiene:** `.gitignore` ignora `*.csv` para no subir exports con
> datos personales al fork público. Guardar los CSV y el `backup.json` fuera del
> repo.

**Código.** La app anterior de un solo archivo (`index.js` + `public/`) no
existe ya en el árbol de trabajo; su respaldo es el **historial de git**, en el
commit `37760a9`. Para recuperarla: `git checkout 37760a9 -- index.js public`
(ver [ADR-0003](decisiones/0003-stack-moderno-typescript-react.md)).
