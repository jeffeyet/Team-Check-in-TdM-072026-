# Restricciones (RES)

Límites que el desarrollo debe respetar. A diferencia de los RF/RNF, las
restricciones no se "implementan": se cumplen. Cambiar una restricción
requiere CC y, si es técnica, ADR. Convenciones: [README.md](README.md).

---

## RES-001 · La app corre en Replit

- **Límite:** toda funcionalidad debe correr en la infraestructura elegida
  por el instructor: un repl con despliegue Autoscale, como **un solo
  servicio** (el backend construye y sirve el frontend).
- **Origen:** decisión del instructor del curso (relatada por el equipo);
  configuración en `.replit` (`run` = `install:all && build && start`,
  `deploymentTarget = "autoscale"`).

## RES-002 · Replit KV como única base de datos

- **Límite:** no se agregan bases de datos externas. Consecuencia práctica
  (verificada): `REPLIT_DB_URL` solo existe dentro de Replit, así que las
  escrituras reales solo se prueban ahí.
- **Origen:** [ADR-0002](../decisiones/0002-evolucion-replit-nativa.md);
  comportamiento verificado de `@replit/database`. El
  [ADR-0003](../decisiones/0003-stack-moderno-typescript-react.md) mantiene
  esta restricción: la reescritura conserva Replit KV como único
  almacenamiento (llaves `team:*` y `prompt:*`, vía `backend/src/db.ts`).

## RES-003 · Stack moderno sobre Replit, sin infraestructura nueva

- **Límite:** se permite un stack moderno con build y TypeScript —backend
  Node + Express 4 en TypeScript (compilado con `tsc`) y frontend React +
  Vite—, pero se **mantiene** Replit como host, **un solo servicio** (el
  backend sirve `frontend/dist`) y **Replit KV como única base de datos**.
  No se introduce base de datos externa ni servicios adicionales.
- **Origen:** [ADR-0003](../decisiones/0003-stack-moderno-typescript-react.md);
  configuración en `.replit`, `package.json` (raíz), `backend/package.json` y
  `frontend/package.json`.
- **Nota:** el ADR-0003 **cambió** esta restricción. La redacción anterior
  ("Node + Express 4 en CommonJS, frontend HTML/JS vanilla en un archivo, sin
  build step, sin frameworks nuevos ni TypeScript"), heredada del
  [ADR-0002](../decisiones/0002-evolucion-replit-nativa.md), ya **no aplica**.

## RES-004 · Trabajo solo en `Solanum_Branch`

- **Límite:** nunca se hace commit ni push a `main`; `main` pertenece al
  upstream del instructor (`jeffeyet/Team-Check-in-TdM-072026-`). El
  trabajo del equipo queda evidenciado en la rama.
- **Origen:** acuerdo de equipo (documentado en `CLAUDE.md` y `README.md`).

## RES-005 · Compatibilidad con los datos existentes

- **Límite:** las llaves `team:*` y `prompt:*` de la edición 07/2026 deben
  seguir siendo legibles mientras la edición esté en curso; cualquier
  migración de formato incluye su plan para estos datos.
- **Origen:** la app está en uso durante el curso (contexto relatado por el
  equipo). La reescritura del ADR-0003 conserva el mismo formato de llaves y
  de valores (verificado por paridad).

## RES-006 · Plazo de la propuesta

- **Límite:** la propuesta del equipo se presenta el **2026-07-09**; lo que
  se muestre ese día debe estar terminado o ser honesto sobre su estado.
- **Origen:** instrucción del curso (relatada por el equipo).

## RES-007 · Perfil del equipo

- **Límite:** el equipo es mayormente no desarrollador; cada cambio debe
  poder explicarse en la presentación y mantenerse con apoyo de IA. Ante dos
  soluciones, se prefiere la legible sobre la ingeniosa.
- **Origen:** declarado por el propio equipo.
