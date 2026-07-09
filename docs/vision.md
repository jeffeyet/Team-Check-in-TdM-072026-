# Visión

*Adaptada del plan original de Iker (`checkin-platform/docs/01-vision.md`) al
alcance Replit-nativo — ver [ADR-0002](decisiones/0002-evolucion-replit-nativa.md).
Este documento es dirección para la propuesta del equipo: se convierte en
requisitos solo a través del [control de cambios](cambios/README.md).*

## Problema

El portal funciona bien para **una** edición del curso, pero está construido
alrededor de esa única edición (detalle: [contexto.md](contexto.md)):

- Actividades fijas en el código; agregar o cambiar una implica programar.
- Un solo espacio de datos: no existe la noción de "clase".
- Un único passcode compartido para todos los instructores.
- Reutilizarlo exige borrar todo y perder el histórico.

## Visión

**La misma app, evolucionada en su lugar**: el instructor define actividades
como datos (tipo, título, instrucciones, ventana de apertura/cierre) sin
tocar código, cada clase o edición vive en su propio espacio de datos, y la
administración permite un manejo fino (borrado individual, histórico) — todo
con el mismo stack y la misma infraestructura que eligió el instructor
(Replit, Express, KV, un solo servicio, sin build).

## Usuarios y roles

| Rol | Qué hace |
|---|---|
| Instructor | Define actividades, ve entregas por clase, exporta CSV |
| Estudiante / equipo | Entra a su clase, ve actividades abiertas, envía |

## Objetivos (dirección; pendientes de convertirse en requisitos)

1. **Actividades configurables sin tocar código** — definidas como registros
   en el KV, generalizando los dos tipos que ya existen (check-in de equipo
   y entrega de enlace).
2. **Aislamiento por clase/edición** — espacios de datos separados (p. ej.
   prefijos de llave y código de acceso por clase), con histórico.
3. **Administración más fina** — borrado individual de envíos y export por
   actividad; "borrar todo" deja de ser la única herramienta.
4. **Fricción mínima para el alumno, conservada** — sin registro: un enlace
   o código y listo.
5. **Operación simple y sin costo adicional** — la misma instancia de Replit.

## No-objetivos

Heredados del plan original: no es un LMS (sin calificaciones ni rúbricas),
sin integraciones (Canvas, Google Classroom, SSO), sin apps móviles nativas
ni tiempo real, sin multi-tenancy comercial.

Añadidos por el re-alcance (cambiar cualquiera requiere un ADR):

- Sin frameworks de frontend ni build step.
- Sin base de datos externa: el KV de Replit es la única base de datos.
- Sin sistema de cuentas con sesiones; el control de acceso sigue siendo por
  passcode (queda por evaluar un passcode por clase).

## Principio guía

Del plan original, ahora aplicado también al stack: **simplicidad sobre
complejidad** — cada pieza debe justificar su existencia; ante la duda, la
opción más aburrida y estándar.
