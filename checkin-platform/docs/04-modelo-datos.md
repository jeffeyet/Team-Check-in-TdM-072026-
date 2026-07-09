# 04 · Modelo de datos (borrador)

## Entidades y relaciones

    instructors ──1:N── classes ──1:N── activities ──1:N── submissions
                           │                                    │
                           └────────1:N── teams ─────1:N────────┘
                                            │
                                            └──1:N── members

## Tablas (campos clave)

| Tabla | Campos principales |
|---|---|
| `instructors` | id, email (único), password_hash, name, created_at |
| `classes` | id, owner_id → instructors, name, term, join_code (único), timezone, status (active/archived), created_at |
| `activities` | id, class_id → classes, type (`team-checkin` \| `link-submission`), title, instructions, opens_at, closes_at, config (JSONB), position |
| `teams` | id, class_id → classes, name (único por clase, case-insensitive), created_at |
| `members` | id, team_id → teams, name, linkedin, is_pm |
| `submissions` | id, activity_id → activities, team_id → teams, payload (JSONB), submitted_at |

Notas:

- `payload` JSONB da flexibilidad por tipo de actividad sin crear una tabla
  por tipo; los campos que se filtren u ordenen mucho se promueven a columnas
  cuando haga falta.
- Aislamiento por clase: **toda** consulta parte de `class_id`; nunca hay
  lecturas "globales" como el `db.list("team:")` actual.
- La unicidad de equipo por clase reemplaza el dedupe por nombre en memoria
  que hace hoy el servidor.

## Mapeo desde la app actual

| Hoy (Replit KV) | Mañana |
|---|---|
| `team:<ts>_<rand>` → {teamName, members[], idea} | `teams` + `members` + `submissions` (actividad `team-checkin`) |
| `prompt:<ts>_<rand>` → {teamName, idea, docUrl} | `submissions` (actividad `link-submission`) |
| Passcode único | `instructors` + sesiones |
| "Clear all" | archivar clase / borrar envíos con confirmación |
