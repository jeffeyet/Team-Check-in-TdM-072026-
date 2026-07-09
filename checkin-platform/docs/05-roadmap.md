# 05 · Roadmap

Fases pequeñas; cada una termina en algo usable o demostrable.

## F0 — Planeación (aquí)

- Validar visión, requisitos y stack con el equipo; registrar ADRs.
- **Salida:** docs 01–04 revisados y ADR 0001 aceptado; repo creado en GitHub.

## F1 — Backend mínimo

- Esquema de base de datos + migraciones; auth de instructor; CRUD de clases
  y actividades; endpoints públicos de join/envío. Probado con curl o tests.
- **Salida:** flujo completo por API: crear clase → actividad → envío de
  alumno → verlo como instructor.

## F2 — Frontend mínimo

- Portal alumno (`/c/:code`) y dashboard instructor contra el API real.
- **Salida:** el mismo flujo de F1, ahora desde el navegador.

## F3 — Paridad y piloto

- Paridad funcional con la app actual (CSV, autocompletar, stats), estados
  vacíos y de error cuidados, accesibilidad básica; desplegado; piloto con
  una clase real (o una réplica de la edición 07/2026).
- **Salida:** una clase real gestionada de inicio a fin en la plataforma.

## F4 — Multi-clase de verdad

- Varias clases en paralelo con instructores distintos; co-instructores,
  duplicar clases/actividades, rate limiting, zonas horarias.
- **Salida:** dos clases simultáneas operando sin interferirse.

La app actual sigue sirviendo la edición 07/2026 durante todo el proceso; no
se apaga hasta después de F3.
