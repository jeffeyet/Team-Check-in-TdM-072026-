# CC-001 · Reestructura documental y pivote Replit-nativo

- **Fecha:** 2026-07-08
- **Solicitante:** Equipo Solanum
- **Estado:** implementado

## Descripción

Absorber el plan `checkin-platform/` en una estructura documental en `docs/`
(raíz), crear los módulos de requerimientos (RF/RNF/RES), control de
cambios, decisiones, notas, pruebas y operación, y re-alcanzar el desarrollo
hacia la evolución de la app existente dentro de Replit.

## Motivación

El plan original proponía React + PostgreSQL + cuentas con sesiones:
desproporcionado para el plazo (propuesta el 2026-07-09), el perfil del
equipo y la continuidad con la infraestructura del instructor. El detalle de
la decisión está en el
[ADR-0002](../decisiones/0002-evolucion-replit-nativa.md).

## Requisitos afectados

- Nuevos: RF-001…RF-010, RNF-001…RNF-006, RES-001…RES-007 (línea base,
  redactada desde el código).
- Modificados / descartados: ninguno (no existía registro previo).

## Impacto

- **Código:** ninguno. Higiene aparte: `gitignore` → `.gitignore` y
  `replit` → `.replit` (estaban inactivos por el punto faltante).
- **Datos:** ninguno.
- **Docs:** `checkin-platform/` retirada (su contenido se adaptó en
  `docs/`); `README.md` y `CLAUDE.md` actualizados a la nueva estructura.
- **Esfuerzo y riesgo:** bajo; sin efecto en la app en uso.

## Decisión

Acordado el 2026-07-08: continuar el trabajo de planeación de Iker con
alcance Replit-nativo, absorbiendo sus documentos y retirando la carpeta.

## Verificación

- Cada directorio tiene README y los enlaces internos resuelven.
- Cada requisito de la línea base cita `archivo:líneas` del código real.
- La checklist de humo es ejecutable sobre la app actual tal cual está.
