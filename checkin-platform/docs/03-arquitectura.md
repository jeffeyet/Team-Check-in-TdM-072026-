# 03 · Arquitectura (propuesta)

> Todo lo de este documento es propuesta hasta confirmarse en un ADR
> (`decisiones/`).

## Vista general

    ┌──────────────────────┐        HTTPS/JSON         ┌──────────────────────┐
    │  frontend/  (SPA)    │ ────────────────────────▶ │  backend/  (API)     │
    │  Vite + React        │        /api/v1/...        │  Node + Express      │
    │  portal alumno +     │ ◀──────────────────────── │  auth, validación,   │
    │  dashboard instructor│                           │  lógica de negocio   │
    └──────────────────────┘                           └──────────┬───────────┘
                                                                  │ SQL
                                                           ┌──────▼───────┐
                                                           │  PostgreSQL  │
                                                           └──────────────┘

Separación en **código y responsabilidades**; el despliegue puede empezar
unificado (el backend sirve el build estático del frontend) y separarse
después sin tocar código de aplicación.

## Stack propuesto

| Capa | Propuesta | Por qué | Alternativa considerada |
|---|---|---|---|
| API | Node LTS + Express | continuidad con lo que el equipo ya conoce | Fastify, Hono |
| Base de datos | PostgreSQL gestionado (Neon/Supabase/Railway) | lo relacional encaja con clases→actividades→entregas; capa gratuita | SQLite (si un solo servidor) |
| Acceso a datos | `pg` + migraciones SQL numeradas | lo más simple que funciona | Drizzle ORM (si crecen las consultas) |
| Frontend | Vite + React (SPA) | abundancia de ejemplos y documentación | Svelte, seguir con vanilla |
| Estilos | CSS plano (heredar la estética actual) | cero dependencias | Tailwind |
| Auth | sesión en cookie httpOnly + bcrypt/argon2 | más simple de razonar que JWT | JWT, magic links |

## Esbozo del API (v1)

Instructor (requiere sesión):

| Método | Ruta | Propósito |
|---|---|---|
| POST | `/api/v1/auth/login` · `/logout` | sesión de instructor |
| GET/POST/PATCH | `/api/v1/classes` (+ `/:id`) | CRUD de clases |
| GET/POST/PATCH/DELETE | `/api/v1/classes/:id/activities` | CRUD de actividades |
| GET | `/api/v1/classes/:id/submissions?activity=` | entregas |
| GET | `/api/v1/classes/:id/export.csv?activity=` | export |

Alumno (público, ámbito = join code):

| Método | Ruta | Propósito |
|---|---|---|
| GET | `/api/v1/join/:code` | clase + actividades abiertas |
| GET | `/api/v1/join/:code/teamnames` | autocompletar equipo |
| POST | `/api/v1/join/:code/activities/:id/submissions` | enviar |

Respuestas: `{ data: ... }` o `{ error: { code, message } }`; códigos HTTP
convencionales (400/401/403/404/429/500).

## Decisiones abiertas (para ADRs)

1. ¿TypeScript o JavaScript? (inclinación: TS al menos en el backend).
2. ¿`pg` a pelo o Drizzle desde el inicio?
3. Hosting concreto (Render / Railway / Fly / Replit).
4. Identidad de equipo del alumno: ¿solo nombre (como hoy) o token por equipo?
