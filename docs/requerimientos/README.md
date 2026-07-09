# Requerimientos

Qué debe hacer el sistema y bajo qué condiciones. Tres documentos:

| Documento | Prefijo | Contenido |
|---|---|---|
| [funcionales.md](funcionales.md) | `RF-###` | Comportamientos del sistema |
| [no-funcionales.md](no-funcionales.md) | `RNF-###` | Cualidades: simplicidad, seguridad, accesibilidad, escala |
| [restricciones.md](restricciones.md) | `RES-###` | Límites impuestos por el curso, la infraestructura o el equipo |

## Estado actual

Los tres documentos contienen la **línea base**: lo que la app ya hace hoy,
redactado desde el código (cada requisito cita su fuente). Los requisitos de
las funcionalidades nuevas los definirá el equipo en sesión (fase F1 del
[roadmap](../roadmap.md)) y entrarán por control de cambios.

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
