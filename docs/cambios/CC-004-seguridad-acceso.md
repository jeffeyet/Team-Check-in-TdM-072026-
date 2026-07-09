# CC-004 · Endurecimiento del acceso de instructor

- **Fecha:** 2026-07-09
- **Solicitante:** Equipo Solanum
- **Estado:** implementado

## Descripción

Corregir un problema de acceso detectado por el equipo al preparar la adopción:
el passcode de instructor viajaba por la **query string** (`?code=`) y el fork
**público** arrastraba el passcode **por defecto** (`roster2026`). Se endurece
el acceso: el passcode viaja por el header `X-Passcode` (o el body en POST),
nunca por la URL; en producción el sistema es **fail-closed** si no hay passcode
configurado; las descargas (CSV y respaldo) se hacen por `fetch`+blob
autenticado en vez de navegar con `?code=`; y `.gitignore` ignora `*.csv` para
no subir exports con PII al fork público.

Este cambio acompaña al [ADR-0004](../decisiones/0004-aislamiento-por-cohorte.md)
(modelo de acceso: un passcode de instructor + alumno por enlace de cohorte).

## Motivación

El passcode en la URL queda en el historial del navegador, en logs de acceso y
en referers, y es exactamente el tipo de fuga que
[RNF-002](../requerimientos/no-funcionales.md) (comparación resistente a timing)
no cubre. Peor aún, el fork es **público** y traía el default `roster2026`
incrustado, de modo que un despliegue sin configurar el secreto quedaba abierto
a cualquiera. Estos dos comportamientos ya estaban registrados como **límites
conocidos** en [no-funcionales.md](../requerimientos/no-funcionales.md); este CC
los convierte de "límite aceptado" a "corregido".

## Requisitos afectados

- **Nuevos** (a formalizar en `docs/requerimientos/`; ver *Docs* y *Pendiente*):
  - RNF-007 · El passcode viaja por el header `X-Passcode` (o el body en POST),
    **nunca** por la query string.
  - RNF-008 · **Fail-closed** en producción: sin `PASSCODE` configurado, las
    rutas de admin responden 500 `Server passcode not configured.`; en
    desarrollo usa el default `roster2026` con advertencia al arranque.
  - RNF-009 · Descargas (CSV y `backup.json`) por `fetch`+blob autenticado con
    el header, no por navegación con `?code=` en la URL.
  - RNF-010 · Higiene: `.gitignore` ignora `*.csv` para no subir exports con
    PII al fork público.
- **Modificados:**
  - RF-009 (acceso por passcode): el passcode ya **no** se acepta por query
    param; ahora por header `X-Passcode` o body `code`.
  - RNF-002 (timing-safe): se **conserva** la comparación SHA-256 +
    `crypto.timingSafeEqual`; solo cambia de **dónde** se lee el passcode.
  - Se **resuelven** dos límites conocidos de
    [no-funcionales.md](../requerimientos/no-funcionales.md): "el passcode viaja
    como query param" y (respecto a exports) "el único respaldo es descargar los
    CSV" ahora se hace por descarga autenticada.

## Impacto

- **Código:**
  - `backend/src/auth.ts`: `readCode` lee `X-Passcode` o body `code`, nunca la
    query (`:8-13`); comparación timing-safe (`:16-21`); fail-closed
    `passcodeUnavailable` (`:24-26`) y middlewares `requirePasscode` /
    `requirePasscodeText` que responden 500 si el passcode no está configurado
    en producción (`:29-35`, `:38-43`).
  - `backend/src/config.ts`: `IS_PRODUCTION` (`:6-7`), `PASSCODE_CONFIGURED`
    (`:9-10`), `PASSCODE` efectivo (`:15`) y `warnPasscodeAtStartup` (`:20-32`).
  - `frontend/src/api.ts`: header `X-Passcode` centralizado (`:5-9`) y
    descargas por blob (`downloadBlob`, `:193`).
  - `.gitignore`: `*.csv` (línea 6).
- **Datos:** ninguno. No cambia el formato de llaves ni requiere migración.
- **Docs:** este CC-004; se referencia desde el
  [ADR-0004](../decisiones/0004-aislamiento-por-cohorte.md). **Pendiente:**
  actualizar `docs/requerimientos/` con RNF-007…RNF-010, ajustar RF-009 y RNF-002
  y quitar los límites conocidos ya resueltos.
- **Esfuerzo y riesgo:** bajo-medio. Cambia el contrato de autenticación (de
  query a header), lo cual exige que el frontend y cualquier cliente usen el
  header; ya cubierto en `frontend/src/api.ts`.

## Decisión

Aprobado e **implementado** el 2026-07-09 por el Equipo Solanum, junto con
[CC-003](CC-003-cohortes.md). El modelo de acceso resultante (un passcode de
instructor endurecido + alumno por enlace de cohorte) queda en el
[ADR-0004](../decisiones/0004-aislamiento-por-cohorte.md).

## Verificación

Ejecutado el 2026-07-09 por el Equipo Solanum:

- **Typecheck y build** sin errores; incluido en el **smoke 33/33** de
  [CC-003](CC-003-cohortes.md).
- **Passcode fuera de la URL:** las rutas de admin exigen el header
  `X-Passcode` (o body en POST); sin él responden 401 `Bad passcode.` /
  `Unauthorized`.
- **Fail-closed en producción:** con `NODE_ENV=production` (o
  `REPLIT_DEPLOYMENT`) y sin `PASSCODE`, las rutas de admin responden 500
  `Server passcode not configured.`; en desarrollo usa el default con
  advertencia al arranque.
- **Descargas por blob:** CSV y `backup.json` se descargan con el header, sin
  `?code=` en la URL.
- **Higiene del repo:** `.gitignore` ignora `*.csv`.
- **Checklist de humo:** ver [checklist-humo.md](../pruebas/checklist-humo.md)
  antes del despliegue.
