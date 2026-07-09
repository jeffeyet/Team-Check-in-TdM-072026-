# CC-012 · Higiene de código y consistencia de tipos

- **Fecha:** 2026-07-09
- **Solicitante:** Equipo Solanum
- **Estado:** implementado

## Descripción

Cuatro arreglos de la auditoría que **no** amplían la funcionalidad. Tres son
higiene de código que, en rigor, no alteran el alcance (ver
[README de control de cambios](README.md): “no aplica a correcciones que no
alteran el alcance”); se registran aquí por trazabilidad junto al cuarto, que sí
implica una decisión duradera (ADR-0007):

- **Fix A — eliminar código muerto.** `backend/src/lib/respond.ts`
  (`badPasscode`/`unauthorizedText`) no se importaba en ningún archivo; `auth.ts`
  ya responde 401 en línea. Se borra el archivo.
- **Fix B — llaves con `crypto.randomUUID()`.** `saveTeam`/`savePrompt` generaban
  la llave con `ts + "_" + Math.random().toString(36).slice(2,7)`; dos envíos en
  el mismo milisegundo con el mismo sufijo de 5 caracteres podían colisionar y
  sobrescribirse. Se usa `crypto.randomUUID()` conservando el prefijo `<ts>_` (el
  orden por `ts` y el borrado por llave no cambian).
- **Fix C — portapapeles robusto en la guía.** `Guide.tsx` usaba
  `navigator.clipboard?.writeText` directo, que falla en silencio en contextos no
  seguros o navegadores viejos. Pasa a usar el helper `copyText` de `api.ts` (con
  fallback a `execCommand`), igual que el resto de la app.
- **Fix D — reconciliar tipos front/back.** Se elimina la deriva entre
  `backend/src/types.ts` y `frontend/src/types.ts` y se documenta el backend como
  fuente canónica y el frontend como espejo, según
  [ADR-0007](../decisiones/0007-tipos-canonicos-espejo-cliente.md).

## Motivación

Reducir deuda y sorpresas: código muerto que confunde (Fix A), una colisión de
llaves improbable pero real que perdería un envío (Fix B), una inconsistencia de
UX que rompe el “Copy” en algunos navegadores (Fix C) y una deriva de tipos que
el typecheck no detecta porque cada lado compila su propia copia (Fix D).

## Requisitos afectados

- **Nuevos:** ninguno.
- **Modificados:** ninguno de RF/RNF cambia de contrato. Fix D materializa
  ADR-0007 (decisión de arquitectura nueva, sin requisito asociado).

## Impacto

- **Código (backend):**
  - `backend/src/lib/respond.ts` — **eliminado**.
  - `backend/src/services/teams.ts`, `backend/src/services/prompts.ts` — llave con
    `crypto.randomUUID()`.
  - `backend/src/types.ts` — encabezado que lo declara fuente canónica.
- **Código (frontend):**
  - `frontend/src/views/Guide.tsx` — usa `copyText`.
  - `frontend/src/types.ts` — encabezado de “espejo”, campos client-only marcados,
    `Member.linkedin` reconciliado con el backend.
- **Datos:** ninguno. El formato de llave sigue siendo
  `cohort:<id>:{team|prompt}:<ts>_<sufijo>`; solo cambia el sufijo (aleatorio →
  UUID). Las llaves existentes siguen siendo válidas.
- **API:** sin cambios de contrato.
- **Dependencias:** cero nuevas (`crypto` es de Node; `copyText` ya existía).
- **Docs:** este CC-012, ADR-0007 y su índice; actualización de la fila
  `lib/{csv,respond}` en `arquitectura.md` y `backend/README.md` (ya sin
  `respond.ts`), y de las notas de tipos en `CLAUDE.md`/`arquitectura.md`.
- **Esfuerzo y riesgo:** muy bajo. Cambios locales; el typecheck cubre las firmas.

## Decisión

Aprobado el 2026-07-09 (Equipo Solanum). Fix D adopta
[ADR-0007](../decisiones/0007-tipos-canonicos-espejo-cliente.md); Fix A/B/C son
higiene sin decisión duradera.

## Verificación

Ejecutado el 2026-07-09 (Equipo Solanum). `npm run build` y `tsc --noEmit`
(backend y frontend) sin errores tras borrar `respond.ts` (confirmando que no lo
importaba nadie). Verificación E2E:

- **Fix B** — dos envíos del Día 1 “simultáneos” producen dos llaves distintas
  (`grep` de las llaves en `.dev-kv.json` muestra sufijos UUID únicos); ninguno se
  sobrescribe.
- **Fix C** — el botón “Copy” de la guía del Día 3 copia el mensaje también fuera
  de un contexto seguro (ruta de fallback `execCommand`).
- **Fix D** — `frontend/src/types.ts` y `backend/src/types.ts` coinciden campo a
  campo en los tipos de dominio; las únicas diferencias son los campos client-only
  enumerados en el encabezado del frontend.
- **Checklist de humo:** el flujo completo sigue pasando (sin regresiones).
