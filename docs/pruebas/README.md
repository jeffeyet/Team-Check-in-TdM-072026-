# Pruebas

## Estrategia

La app es un backend TypeScript modular (`backend/src/`) más un frontend React +
Vite (`frontend/src/`); ver [../arquitectura.md](../arquitectura.md). La
verificación combina dos capas:

- **Verificación estática previa:** `npm run typecheck` (`tsc --noEmit` del
  backend) y `npm run build` (Vite + `tsc`) deben pasar sin errores antes de
  desplegar. El tipado atrapa desajustes de contrato entre UI, API y datos que
  la app anterior de un solo archivo no podía detectar.
- **Verificación de comportamiento manual y disciplinada:** la
  [checklist de humo](checklist-humo.md) se ejecuta completa antes de cada
  despliegue y después de cada cambio que toque código. Cada CC define además
  sus propios criterios de verificación ([../cambios/](../cambios/README.md)).

Si el código crece hasta que la checklist se vuelva insuficiente, la adopción
de pruebas automatizadas se decidirá con un ADR.

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
