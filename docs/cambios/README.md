# Control de cambios

Mecanismo para que el alcance cambie de forma visible y acordada, y no como
"alguien lo cambió y nadie supo". Aplica a: requisitos nuevos, modificación o
descarte de requisitos existentes, y cambios de arquitectura o de proceso.
No aplica a correcciones que no alteran el alcance (typos, bugs que
restauran el comportamiento ya especificado).

## Flujo

    propuesto → evaluado → aprobado → implementado → verificado
                    └─────────→ rechazado

1. **Proponer** — copiar [plantilla-cambio.md](plantilla-cambio.md) a
   `CC-###-titulo-corto.md` en esta carpeta y agregar la fila en
   [registro.md](registro.md).
2. **Evaluar** — completar el impacto: requisitos afectados (IDs), cambios
   en código/datos/docs, esfuerzo y riesgo.
3. **Decidir** — en reunión de equipo (la minuta queda en
   [../notas/](../notas/README.md)); el registro pasa a `aprobado` o
   `rechazado`.
4. **Implementar** — los commits mencionan el ID (p. ej. `CC-002: ...`); los
   documentos de requisitos afectados se actualizan.
5. **Verificar** — criterios del propio CC + la
   [checklist de humo](../pruebas/checklist-humo.md); el registro pasa a
   `verificado`.

## Reglas

- Numeración `CC-###` secuencial; un ID nunca se reutiliza.
- Un CC rechazado se conserva (fila en el registro y archivo): el "por qué
  no" también es historia útil.
- Si el cambio implica una decisión técnica duradera, además del CC se
  escribe un ADR ([../decisiones/](../decisiones/README.md)) y se
  referencian mutuamente.

Ejemplo completo:
[CC-001 · Reestructura documental](CC-001-reestructura-documental.md).
