# Registro de cambios (CC)

Bitácora de todos los cambios de alcance, en orden. Proceso:
[README.md](README.md).

| ID | Fecha | Solicitante | Descripción | Afecta | Estado |
|---|---|---|---|---|---|
| [CC-001](CC-001-reestructura-documental.md) | 2026-07-08 | Equipo Solanum | Reestructura documental: absorber el plan `checkin-platform/` en `docs/` y pivotar a evolución Replit-nativa | [ADR-0002](../decisiones/0002-evolucion-replit-nativa.md); crea la línea base RF/RNF/RES | implementado |
| [CC-002](CC-002-stack-moderno.md) | 2026-07-09 | Equipo Solanum | Stack moderno EN LA RAÍZ (TS+Express / React+Vite), reemplaza la app de un solo archivo | [ADR-0003](../decisiones/0003-stack-moderno-typescript-react.md) | implementado |
| [CC-003](CC-003-cohortes.md) | 2026-07-09 | Equipo Solanum | Aislamiento por cohorte (cajas de datos separadas sobre Replit KV, esquema `cohort:<id>:*`, migración sin pérdida, reemplazo del borrado destructivo) | [ADR-0004](../decisiones/0004-aislamiento-por-cohorte.md); nuevos RF-011…RF-017, afecta RF-002/004/005/006/007/RNF-006, descarta RF-008 | implementado |
| [CC-004](CC-004-seguridad-acceso.md) | 2026-07-09 | Equipo Solanum | Endurecimiento del acceso: passcode por header (no query), fail-closed en producción, descargas por blob, `.gitignore *.csv` | [ADR-0004](../decisiones/0004-aislamiento-por-cohorte.md); nuevos RNF-007…RNF-010, afecta RF-009/RNF-002 | implementado |
| [CC-005](CC-005-dia3-github-onboarding.md) | 2026-07-09 | Equipo Solanum | Día 3: onboarding de GitHub como guía read-only (guía-como-dato) + handoff al kit externo `AI_GITHUB_Connection`; solo frontend, sin backend ni deps | [ADR-0005](../decisiones/0005-guias-como-datos.md); nuevos RF-018/RF-019; avanza la mitad read-only de "actividades como datos" | implementado |
| [CC-006](CC-006-materiales-profesor.md) | 2026-07-09 | Equipo Solanum | Materiales del profesor por día (Opción B1: archivos estáticos en `frontend/public/materials/` + manifest tipado), sin subida y sin IA en runtime | [ADR-0006](../decisiones/0006-materiales-estaticos-sin-upload.md); nuevos RF-020/RF-021/RNF-011 | aprobado |
| [CC-007](CC-007-endurecimiento-cohortes.md) | 2026-07-09 | Equipo Solanum | Endurecimiento de cohortes tras la revisión: `teamnames` respeta el archivado (Fix A) y normalización consistente del id vía helpers de prefijo + `updateCohort` (Fix B) | Refina [ADR-0004](../decisiones/0004-aislamiento-por-cohorte.md); afecta RF-015/RF-011/RF-014; resuelve 2 límites conocidos | implementado |
