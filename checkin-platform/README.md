# Checkin Platform (nombre provisional)

Evolución escalada del portal "Team Check-In" del AI Leadership Intensive:
frontend y backend separados, para gestionar las actividades de **varias
clases** en distintos momentos o en paralelo.

**Estado: fase de planeación (F0).** Aquí todavía no hay código — esta carpeta
lleva la planeación y deja lista la estructura para el desarrollo.

## Cómo navegar

| Carpeta | Qué contiene |
|---|---|
| `docs/` | La planeación: visión, requisitos, arquitectura, modelo de datos, roadmap (leer en orden 01 → 05) |
| `docs/decisiones/` | Decisiones de arquitectura (ADRs), una por archivo |
| `docs/notas/` | Notas de reuniones del equipo |
| `backend/` | Esqueleto del futuro API (vacío por ahora) |
| `frontend/` | Esqueleto de la futura SPA (vacío por ahora) |

Las elecciones de stack son **propuestas** hasta que el equipo las confirme en
un ADR.

## Relación con la app actual

La app original (raíz de este repo: `index.js`, `public/`) sigue siendo la
versión en uso para la edición de julio 2026 y no se modifica desde aquí. La
plataforma nueva se planea y desarrolla en esta carpeta, dentro del fork del
equipo (rama `Solanum_Branch`), para dejar evidencia del trabajo; ver
`docs/decisiones/0001-frontend-y-backend-separados.md`.

## Próximos pasos

1. Revisar y discutir `docs/01-vision.md` y `docs/02-requisitos.md` en equipo.
2. Confirmar o cambiar el stack propuesto en `docs/03-arquitectura.md`
   (registrar la decisión en un ADR).
3. Cuando el plan esté validado: arrancar la fase F1 del roadmap en `backend/`
   (y decidir en un ADR si la plataforma se queda en este repo o se muda a
   uno propio al crecer).
