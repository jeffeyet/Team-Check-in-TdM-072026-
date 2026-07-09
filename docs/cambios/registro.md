# Registro de cambios (CC)

Bitácora de todos los cambios de alcance, en orden. Proceso:
[README.md](README.md).

| ID | Fecha | Solicitante | Descripción | Afecta | Estado |
|---|---|---|---|---|---|
| [CC-001](CC-001-reestructura-documental.md) | 2026-07-08 | Equipo Solanum | Reestructura documental: absorber el plan `checkin-platform/` en `docs/` y pivotar a evolución Replit-nativa | [ADR-0002](../decisiones/0002-evolucion-replit-nativa.md); crea la línea base RF/RNF/RES | implementado |
| [CC-002](CC-002-stack-moderno.md) | 2026-07-09 | Equipo Solanum | Stack moderno EN LA RAÍZ (TS+Express / React+Vite), reemplaza la app de un solo archivo | [ADR-0003](../decisiones/0003-stack-moderno-typescript-react.md) | implementado |
| [CC-003](CC-003-cohortes.md) | 2026-07-09 | Equipo Solanum | Aislamiento por cohorte (cajas de datos separadas sobre Replit KV, esquema `cohort:<id>:*`, migración sin pérdida, reemplazo del borrado destructivo) | [ADR-0004](../decisiones/0004-aislamiento-por-cohorte.md); nuevos RF-011…RF-017, afecta RF-002/004/005/006/007/RNF-006, descarta RF-008 | implementado |
| [CC-004](CC-004-seguridad-acceso.md) | 2026-07-09 | Equipo Solanum | Endurecimiento del acceso: passcode por header (no query), fail-closed en producción, descargas por blob, `.gitignore *.csv` | [ADR-0004](../decisiones/0004-aislamiento-por-cohorte.md); nuevos RNF-007…RNF-010, afecta RF-009/RNF-002 | implementado |
