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
| `PASSCODE` | `roster2026` | Passcode del instructor — definirlo como Secret en Replit (Tools → Secrets) |
| `PORT` | `3000` | Puerto HTTP |

## Respaldos

**Datos.** El único borrado disponible hoy es total ("Clear" por día) y no
tiene deshacer. **Antes de cualquier Clear o de probar sobre datos reales:**
descargar los dos CSV desde la vista de instructor (`/api/export.csv` y
`/api/prompt-export.csv`) y guardarlos fuera de Replit.

**Código.** La app anterior de un solo archivo (`index.js` + `public/`) no
existe ya en el árbol de trabajo; su respaldo es el **historial de git**, en el
commit `37760a9`. Para recuperarla: `git checkout 37760a9 -- index.js public`
(ver [ADR-0003](decisiones/0003-stack-moderno-typescript-react.md)).
