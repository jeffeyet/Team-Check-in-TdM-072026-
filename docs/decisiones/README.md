# Decisiones de arquitectura (ADR)

Registro de decisiones técnicas con consecuencias duraderas: elección o
cambio de stack, formato de datos, cambios de rumbo. Una decisión por
archivo, con la [plantilla](plantilla.md). Un ADR en estado «aceptada» no se
edita: se reemplaza con un ADR nuevo, y el anterior se marca como
«reemplazada».

## Índice

| ADR | Título | Estado |
|---|---|---|
| [0001](0001-frontend-y-backend-separados.md) | Código nuevo con frontend y backend separados | reemplazada por 0002 |
| [0002](0002-evolucion-replit-nativa.md) | Evolucionar la app existente, Replit-nativa | reemplazada por 0003 |
| [0003](0003-stack-moderno-typescript-react.md) | Stack moderno: TypeScript + Express y React + Vite | aceptada |
| [0004](0004-aislamiento-por-cohorte.md) | Aislamiento por cohorte sobre Replit KV | aceptada |

## Cuándo escribir un ADR

- Se elige entre alternativas técnicas y la elección condiciona el futuro
  (formato de llaves del KV, esquema de passcode, tipos de actividad).
- Se revierte o reemplaza una decisión anterior.
- En caso de duda: si dentro de un mes alguien preguntaría "¿por qué está
  así?", merece ADR.
