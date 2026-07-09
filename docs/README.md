# Documentación — equipo Solanum

Planeación y proceso del desarrollo de la app, que vive **en la raíz** del repo
(backend TypeScript + Express en `backend/`, frontend React + Vite en
`frontend/`) y corre en Replit como un solo servicio. Este stack moderno empezó
como una reescritura **a paridad** de la app anterior de un solo archivo (ver
[ADR-0003](decisiones/0003-stack-moderno-typescript-react.md); la versión previa
quedó en git, commit `37760a9`); sobre esa base, el **2026-07-09** se agregó el
**aislamiento por cohorte** (grupos con datos separados), el endurecimiento del
acceso y la seguridad de datos, así que ya no es paridad exacta con el original
(ver [arquitectura.md](arquitectura.md)). Esta carpeta sustituye al plan anterior
`checkin-platform/` (ver [ADR-0002](decisiones/0002-evolucion-replit-nativa.md)).

## Orden de lectura sugerido

1. [contexto.md](contexto.md) — qué es la plataforma hoy y cómo se opera el curso
2. [vision.md](vision.md) — hacia dónde queremos llevarla
3. [requerimientos/](requerimientos/README.md) — qué debe hacer (línea base hoy; lo nuevo, tras la sesión de equipo)
4. [arquitectura.md](arquitectura.md) — cómo está construida y la dirección técnica
5. [roadmap.md](roadmap.md) — fases y fechas

## Mapa completo

| Carpeta / archivo | Para qué |
|---|---|
| [contexto.md](contexto.md) | La plataforma tal como está hoy y cómo se opera el curso |
| [vision.md](vision.md) | Hacia dónde queremos llevarla |
| [requerimientos/](requerimientos/README.md) | Requisitos funcionales (RF), no funcionales (RNF) y restricciones (RES) |
| [arquitectura.md](arquitectura.md) | Cómo está construida y la dirección técnica |
| [roadmap.md](roadmap.md) | Fases y fechas |
| [cambios/](cambios/README.md) | Control de cambios: cómo se propone, aprueba y registra un cambio (CC) |
| [decisiones/](decisiones/README.md) | Decisiones de arquitectura (ADR) |
| [notas/](notas/README.md) | Minutas de reunión del equipo |
| [pruebas/](pruebas/README.md) | Estrategia de verificación: estática, smoke test automatizado y checklist de humo |
| [operacion.md](operacion.md) | Correr, desplegar y respaldar la app |

## Reglas del proceso

- El **alcance** solo cambia mediante un CC en [cambios/](cambios/README.md);
  los requisitos afectados se actualizan al aprobarse el CC.
- Las **decisiones técnicas** con consecuencias duraderas se registran como
  ADR en [decisiones/](decisiones/README.md).
- Cada cambio se **verifica** con la
  [checklist de humo](pruebas/checklist-humo.md) antes de darse por terminado.

## Convenciones

- Identificadores: `RF-###` (funcional), `RNF-###` (no funcional), `RES-###`
  (restricción), `CC-###` (cambio), `ADR NNNN` (decisión). Secuenciales;
  nunca se reutilizan.
- Documentación en español; código, comentarios y textos de la interfaz en
  inglés (así los dejó el instructor y así se mantienen).
- Fechas en formato `AAAA-MM-DD`.
