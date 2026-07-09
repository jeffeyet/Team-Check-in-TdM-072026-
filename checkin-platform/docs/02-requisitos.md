# 02 · Requisitos

Priorizados con MoSCoW. "v1" = fases F1–F3 del roadmap.

## Must (v1 no sale sin esto)

- **Clases**: crear/editar/archivar; cada clase con nombre, periodo y código de
  acceso (join code) único; datos totalmente aislados por clase.
- **Actividades**: crear por clase con tipo, título, instrucciones y ventana
  (abre/cierra). Tipos iniciales, equivalentes a lo que ya existe:
  - `team-checkin` — nombre de equipo, hasta N miembros (LinkedIn opcional,
    un PM marcado), idea en una frase.
  - `link-submission` — enlace (Google Doc u otro) + texto corto (idea
    revisada).
- **Portal alumno**: entrar vía `/c/<join-code>`; ver solo actividades
  abiertas de su clase; enviar; autocompletar nombre de equipo desde envíos
  previos de esa clase.
- **Dashboard instructor**: login con cuenta; lista de sus clases; por clase:
  entregas por actividad, stats básicas, export CSV, borrar envíos
  individuales (no solo "borrar todo").
- **Auth instructor**: email + contraseña (hash fuerte), sesión con cookie
  httpOnly; sin recuperación de contraseña sofisticada en v1 (reset manual).

## Should

- Duplicar una actividad o clase (plantillas informales).
- Co-instructores por clase.
- Rate limiting en endpoints públicos y de login.
- Zona horaria por clase (las ventanas se muestran en hora local de la clase).

## Could

- Catálogo de tipos de actividad extensible (formularios definidos por JSON).
- Estadísticas agregadas entre clases.
- Interfaz bilingüe ES/EN.

## Won't (v1)

- Calificaciones, comentarios del instructor por entrega, notificaciones por
  email, SSO, tiempo real.

## No funcionales

- **Simplicidad**: monorepo, un solo lenguaje (JS/TS), sin microservicios.
- **Coste**: hosting en capas gratuitas o < 5 USD/mes.
- **Seguridad**: OWASP básico — hash de contraseñas, comparaciones
  timing-safe, validación de entrada en el borde del API, aislamiento por
  clase verificado en cada consulta.
- **Accesibilidad**: WCAG 2.1 AA básico (formularios etiquetados, operable por
  teclado, contraste).
- **Escala esperada**: decenas de clases, cientos de alumnos — no hace falta
  optimizar más allá de índices correctos en la base de datos.
