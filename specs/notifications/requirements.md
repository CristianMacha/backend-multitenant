# Requirements — Platform · Notifications

> Feature 1 de `feature_list.json` (`name: notifications`, `context: platform`, `sdd: true`).
> Sistema de notificaciones in-app a nivel de `src/platform/`. Crea notificaciones desde
> otros contextos sin acoplamiento directo, consume la señal `ReminderDue` del módulo
> `crm/activities` (BullMQ) y expone 4 endpoints REST bajo `/api/v1/notifications`.

EARS estricto (`docs/specs.md`). Cada `R<n>` es verificable por al menos un test concreto.

---

## Persistencia y modelo

## R1

El sistema DEBE definir un modelo `Notification` en `prisma/schema.prisma` con los campos
`id` (uuid pk), `tenantId`, `userId`, `type`, `title`, `body`, `read` (boolean, default `false`),
`readAt` (nullable), `createdAt`, `updatedAt` y `deletedAt` (nullable, soft-delete).

## R2

El sistema DEBE persistir cada notificación con `read = false` y `readAt = null` en el momento
de su creación.

## R3

El sistema NO DEBE eliminar físicamente una notificación; toda baja DEBE realizarse marcando
`deletedAt` (soft-delete).

---

## Creación in-app y desacoplamiento

## R4

El sistema DEBE exponer un `NotificationService` inyectable por otros contextos a través del
export del `NotificationsModule`, con un método de creación que reciba `tenantId`, `userId`,
`type`, `title` y `body`.

## R5

CUANDO `NotificationService` crea una notificación, el sistema DEBE persistirla mediante el
repositorio y el agregado de dominio (ruta de escritura), filtrando por `tenantId`.

## R6

CUANDO `NotificationService` crea una notificación, el sistema DEBE emitir el domain event
`NotificationCreated` y escribirlo al outbox (`writeToOutbox`) dentro de la misma transacción
Prisma que el `save` del agregado.

## R7

CUANDO `NotificationService` crea una notificación, el sistema DEBE publicar el evento en
proceso vía `EventBus.publishAll(events)` después de persistir, usando `pullDomainEvents()`.

## R8

SI `title` o `body` están vacíos (tras `trim()`) ENTONCES el sistema DEBE rechazar la creación
lanzando una `DomainException`.

---

## Consumo de ReminderDue (BullMQ)

## R9

CUANDO llega un job `activity-reminder-due` a la cola `activity-reminders` (señal `ReminderDue`
emitida por `crm/activities`), el sistema DEBE crear una notificación in-app para el dueño
(`ownerId`) de la actividad referenciada por `activityId`, en el `tenantId` del job.

## R10

CUANDO el consumidor de `activity-reminder-due` crea la notificación de recordatorio, el
sistema DEBE asignarle `type = 'ACTIVITY_REMINDER'`.

## R11

SI la actividad referenciada por `activityId` no existe, está soft-deleted, o no tiene
`ownerId` ENTONCES el sistema NO DEBE crear ninguna notificación y DEBE finalizar el job sin
lanzar error.

---

## Listado (GET /api/v1/notifications)

## R12

CUANDO un usuario con permiso `notifications.read` envía `GET /api/v1/notifications`, el
sistema DEBE devolver una lista paginada de sus propias notificaciones con status 200.

## R13

El sistema DEBE filtrar el listado de notificaciones por `tenantId`, por `userId` del usuario
autenticado y por `deletedAt: null`.

## R14

El sistema DEBE ordenar el listado de notificaciones por `createdAt` descendente.

## R15

El sistema DEBE aceptar los parámetros de paginación `page` y `limit` en el listado y devolver
el resultado en el envelope paginado del proyecto (`PaginatedResultDto`).

---

## Marcar una como leída (PATCH /api/v1/notifications/:id/read)

## R16

CUANDO un usuario con permiso `notifications.update` envía
`PATCH /api/v1/notifications/:id/read` sobre una notificación propia no leída, el sistema DEBE
marcar `read = true` y fijar `readAt` con la fecha actual, y responder 204.

## R17

SI la notificación indicada en `:id` no existe, está soft-deleted, o no pertenece al usuario
autenticado dentro de su `tenantId` ENTONCES el sistema DEBE responder 404.

## R18

CUANDO se marca como leída una notificación ya leída, el sistema NO DEBE volver a modificar
`readAt` ni emitir mutación adicional, y DEBE responder 204 (operación idempotente).

---

## Marcar todas como leídas (PATCH /api/v1/notifications/read-all)

## R19

CUANDO un usuario con permiso `notifications.update` envía
`PATCH /api/v1/notifications/read-all`, el sistema DEBE marcar como leídas
(`read = true`, `readAt = ahora`) todas las notificaciones propias no leídas del usuario
autenticado dentro de su `tenantId`, y responder 200 con el número de notificaciones afectadas.

## R20

El sistema DEBE limitar el efecto de `read-all` a las notificaciones con `deletedAt: null`,
`userId` del usuario autenticado y `read = false`.

---

## Conteo de no leídas (GET /api/v1/notifications/unread-count)

## R21

CUANDO un usuario con permiso `notifications.read` envía
`GET /api/v1/notifications/unread-count`, el sistema DEBE responder 200 con un entero igual al
número de notificaciones propias con `read = false`, `deletedAt: null` y su `tenantId`.

---

## Autorización y multi-tenancy

## R22

El sistema DEBE proteger `GET /api/v1/notifications` y
`GET /api/v1/notifications/unread-count` con `@Permissions(Perm.notifications.read)`.

## R23

El sistema DEBE proteger `PATCH /api/v1/notifications/:id/read` y
`PATCH /api/v1/notifications/read-all` con `@Permissions(Perm.notifications.update)`.

## R24

El sistema NO DEBE permitir que un usuario lea, cuente o mute notificaciones de otro usuario:
toda operación DEBE acotarse por el `userId` del usuario autenticado además del `tenantId`.

## R25

El sistema DEBE registrar los permisos `notifications.read` y `notifications.update` en
`prisma/seed.ts` bajo el módulo `notifications`, y exponerlos en el catálogo
`Perm.notifications` de `@shared/authorization/permissions`.

---

## Calidad

## R26

El sistema DEBE tener tests unitarios para `NotificationService`, para el consumidor de
`activity-reminder-due` y para todos los command y query handlers, alcanzando una cobertura
global ≥ 80%.
