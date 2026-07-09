# Pruebas

## Estrategia

La app es un backend TypeScript modular (`backend/src/`) más un frontend React +
Vite (`frontend/src/`); ver [../arquitectura.md](../arquitectura.md). La
verificación combina tres capas:

- **Verificación estática previa:** `npm run typecheck` (`tsc --noEmit` del
  backend) y `npm run build` (Vite + `tsc`) deben pasar sin errores antes de
  desplegar. El tipado atrapa desajustes de contrato entre UI, API y datos que
  la app anterior de un solo archivo no podía detectar.
- **Smoke test automatizado (handlers reales sobre KV en memoria):** el
  aislamiento por cohorte y la seguridad se validaron ejercitando los handlers
  reales del backend contra un **KV en memoria** (un stub que reemplaza a
  `@replit/database`), lo que permite probar la lógica de datos fuera de Replit.
  En la implementación del 2026-07-09 la corrida fue **33/33** y confirmó,
  además, que el servidor real degrada con gracia (los handlers capturan
  errores del KV y devuelven 500 en vez de caer).
  **Estado:** hasta ahora este smoke test se corrió como arnés puntual durante
  el cambio; **no** hay todavía un archivo de pruebas versionado en el repo ni
  un script `npm test`. Formalizarlo como suite versionada es trabajo pendiente
  (se decidiría con un CC/ADR).
- **Verificación de comportamiento manual y disciplinada:** la
  [checklist de humo](checklist-humo.md) se ejecuta completa antes de cada
  despliegue y después de cada cambio que toque código. Cubre el flujo por
  cohortes de extremo a extremo (crear grupo → enlace → alumno → instructor →
  export → borrar → archivar → respaldo). Cada CC define además sus propios
  criterios de verificación ([../cambios/](../cambios/README.md)).

Si el código crece, la adopción de una suite automatizada versionada (a partir
del arnés de smoke ya usado) se decidirá con un ADR.

## Dónde probar

- **Interfaz y rutas:** en local es suficiente, con `npm run build && npm run
  start` (un servicio en `:3000`) o en modo dev con `npm run dev:backend` +
  `npm run dev:frontend` (`:5173`, proxy a `:3000`). Ver
  [../operacion.md](../operacion.md).
- **Lecturas y escrituras reales:** solo dentro de Replit. Fuera de Replit
  las operaciones de base de datos fallan por diseño de `@replit/database`
  (detalle: [../operacion.md](../operacion.md)). Un envío que devuelve
  `Save failed.` en local no es un bug.

## Registro de resultados

El resultado de la checklist se anota en la sección "Verificación" del CC
correspondiente, con fecha y quién la corrió.
