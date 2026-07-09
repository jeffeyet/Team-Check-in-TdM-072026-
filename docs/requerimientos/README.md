# Requerimientos

Qué debe hacer el sistema y bajo qué condiciones. Tres documentos:

| Documento | Prefijo | Contenido |
|---|---|---|
| [funcionales.md](funcionales.md) | `RF-###` | Comportamientos del sistema |
| [no-funcionales.md](no-funcionales.md) | `RNF-###` | Cualidades: simplicidad, seguridad, accesibilidad, escala |
| [restricciones.md](restricciones.md) | `RES-###` | Límites impuestos por el curso, la infraestructura o el equipo |

## Estado actual

Los tres documentos parten de la **línea base** (RF-001…RF-010, RNF-001…RNF-006):
lo que la app hacía al redactarse desde el código, con su fuente `archivo:líneas`.

El **2026-07-09** ([CC-003](../cambios/CC-003-cohortes.md), [ADR-0004](../decisiones/0004-aislamiento-por-cohorte.md))
se agregó el **aislamiento por cohorte** y el **endurecimiento del acceso**, que:

- Añaden **RF-011 … RF-017** (gestión de cohortes, acceso del alumno por
  cohorte, vistas/export por cohorte, borrado individual, archivar cohorte,
  respaldo JSON y migración de datos heredados).
- Añaden **RNF-007 … RNF-010** (fail-closed del passcode, passcode fuera de la
  URL, higiene de secretos/datos, degradación ante fallo del KV).
- **Modifican** RF-001…RF-007, RF-009 y RF-010 (ahora por cohorte y con auth por
  header), **reemplazan** RF-008 (borrado total destructivo) y actualizan
  RES-002 y RES-005.

Todos estos requisitos están en estado `implementado` (build + typecheck
limpios; verificados en Replit). Los requisitos citados como CC-003 / ADR-0004
dependen de que esos documentos se formalicen en `docs/cambios/` y
`docs/decisiones/`.

## Formato de un requisito

- **ID** — `RF-###` / `RNF-###` / `RES-###`, secuencial; nunca se reutiliza.
- **Nombre** — corto y verbal.
- **Descripción** — qué hace / qué cualidad garantiza / qué límite impone.
- **Criterios de aceptación** — condiciones observables para darlo por
  cumplido.
- **Prioridad** — MoSCoW (Must / Should / Could / Won't) para los requisitos
  nuevos. La línea base no lleva prioridad: ya existe.
- **Estado** — ver ciclo de vida.
- **Fuente / origen** — `archivo:líneas` de código para la línea base; el CC
  que lo introdujo para los nuevos.

## Ciclo de vida

    propuesto → aprobado → en desarrollo → implementado → verificado
        └──────────→ descartado (en cualquier punto antes de implementarse)

- La línea base nace directamente en `implementado`; pasa a `verificado`
  cuando la [checklist de humo](../pruebas/checklist-humo.md) la cubre y se
  corre.
- **Todo requisito nuevo, y todo cambio a uno existente, entra por un CC**
  ([../cambios/](../cambios/README.md)); el CC lista los IDs afectados.
- Un requisito descartado no se borra del documento: se marca como
  `descartado`, para conservar la historia.
