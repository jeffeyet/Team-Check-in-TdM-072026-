# 01 · Visión

## Problema

El portal actual (Team Check-In) funciona bien para **una** edición del curso,
pero está construido alrededor de esa única edición:

- Dos actividades fijas en el código (check-in del lunes, prompt log del
  martes); añadir o cambiar una actividad implica tocar backend y frontend.
- Un solo espacio de datos (KV `team:*` / `prompt:*`): no existe la noción de
  "clase", así que dos grupos no pueden usarlo a la vez sin mezclarse.
- Un único passcode compartido para todos los instructores, sin cuentas.
- Reutilizarlo en otra edición exige borrar todo ("Clear") y perder el
  histórico.

## Visión

Una plataforma con **frontend y backend separados** donde un instructor crea
clases, define actividades con ventanas de apertura/cierre, y los equipos
envían sus entregas — con varias clases conviviendo en paralelo sin mezclarse
y con histórico por edición.

## Usuarios y roles

| Rol | Qué hace |
|---|---|
| Instructor | Crea clases y actividades, ve entregas, exporta CSV |
| Estudiante / equipo | Entra a su clase (código o enlace), ve actividades abiertas, envía |
| Co-instructor (futuro) | Acceso de lectura/gestión a clases compartidas |

## Objetivos

1. Gestionar N clases simultáneas con datos aislados por clase.
2. Actividades configurables sin tocar código (tipo + ventana + instrucciones).
3. Cuentas reales de instructor (adiós al passcode compartido).
4. Conservar la fricción mínima para el alumno: sin registro, un enlace y listo.
5. Mantener la operación barata (hosting gratuito o casi) y el stack simple.

## No-objetivos (por ahora)

- No es un LMS: sin calificaciones, rúbricas ni gradebook.
- Sin integraciones (Canvas, Google Classroom, SSO institucional).
- Sin apps móviles nativas ni tiempo real (websockets).
- Sin multi-tenancy comercial (organizaciones, facturación).

## Principio guía

**Simplicidad sobre complejidad**: cada pieza del stack debe justificar su
existencia; ante la duda, la opción más aburrida y estándar.
