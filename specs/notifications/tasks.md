# Tasks — Platform · Notifications

> Orden de implementación NestJS: schema Prisma → tipos/permisos → domain → events →
> repository port → application (service + handlers) + tests → infrastructure (mapper, repo,
> worker) → presentation (controller, DTOs) → seed → wiring de módulos.
> Cada task referencia los `R<n>` que cubre. El implementer marca `[x]` al completar.

- [x] T1 — Añadir enum `NotificationType` y modelo `Notification` a `prisma/schema.prisma`
      (campos de R1, índices `[tenantId]`, `[tenantId, userId, read]`, `[tenantId, userId, createdAt]`,
      `@@map("notifications")`). Cubre: R1, R3.

- [x] T2 — Añadir back-relations `notifications Notification[]` a `model Tenant` y `model User`.
      Cubre: R1.

- [x] T3 — Ejecutar `pnpm prisma:migrate` (migración `add_notifications`) + `pnpm prisma:generate`.
      Cubre: R1, R2, R3.

- [x] T4 — Añadir el branded type `NotificationId` (+ factory) a `@shared/domain/types`.
      Cubre: R5.

- [x] T5 — Añadir `notifications: { read, update }` al catálogo `Perm` en
      `@shared/authorization/permissions.ts`. Cubre: R22, R23, R25.

- [x] T6 — Crear el agregado `Notification` extendiendo `AggregateRoot` con `create`,
      `fromPersistence`, `markAsRead` (idempotente), `delete`, getters; validación de `title`/`body`.
      Cubre: R2, R8, R16, R18.

- [x] T7 — Tests del agregado `notification.entity.spec.ts`: crea con `read=false`/`readAt=null`,
      rechaza `title`/`body` vacíos, `markAsRead` fija `read`/`readAt`, `markAsRead` idempotente.
      Cubre: R2, R8, R16, R18.

- [x] T8 — Definir `NotificationCreatedEvent` (`eventName='notification.created'`) en
      `domain/events/notification.events.ts`. Cubre: R6.

- [x] T9 — Definir el port `NotificationRepository` (interface + `NOTIFICATION_REPOSITORY`
      Symbol) con `findById`, `save`, `markAllAsRead`. Cubre: R5, R13, R19.

- [x] T10 — Implementar `NotificationService` (`application/notification.service.ts`): método
      `create(...)` → agregado, `pullDomainEvents()`, `save(agg, events)`, `eventBus.publishAll`.
      Cubre: R4, R5, R6, R7, R8.

- [x] T11 — Tests `notification.service.spec.ts` (mock repo + mock EventBus): crea y devuelve id,
      `save` recibe los eventos, `publishAll` llamado, rechaza `title`/`body` vacíos. Cubre: R4, R5,
      R6, R7, R8.

- [x] T12 — Implementar `MarkNotificationReadCommand` + `MarkNotificationReadHandler`
      (`findById` por `tenantId`; 404 si no existe o `userId` ≠ propietario; `markAsRead`; `save`).
      Cubre: R16, R17, R18, R24.

- [x] T13 — Tests `mark-notification-read.handler.spec.ts`: marca leída y guarda; 404 si null;
      404 si pertenece a otro usuario; idempotente si ya leída. Cubre: R16, R17, R18, R24.

- [x] T14 — Implementar `MarkAllNotificationsReadCommand` + `MarkAllNotificationsReadHandler`
      (`repository.markAllAsRead(tenantId, userId)`, devuelve `{ updated }`). Cubre: R19, R20, R24.

- [x] T15 — Tests `mark-all-notifications-read.handler.spec.ts`: invoca `markAllAsRead` con
      `tenantId`+`userId` y devuelve el contador. Cubre: R19, R20, R24.

- [x] T16 — Crear `notification.read-model.ts` (`NotificationReadModel` +
      `toNotificationReadModel`). Cubre: R12.

- [x] T17 — Implementar `GetNotificationsQuery` + `GetNotificationsHandler` (`PrismaService`
      directo: where `{ tenantId, userId, deletedAt: null }`, `orderBy createdAt desc`, paginado).
      Cubre: R12, R13, R14, R15, R24.

- [x] T18 — Tests `get-notifications.handler.spec.ts` (mock `PrismaService`): filtra por
      `tenantId`+`userId`+`deletedAt: null`, ordena desc, pagina. Cubre: R12, R13, R14, R15, R24.

- [x] T19 — Implementar `GetUnreadCountQuery` + `GetUnreadCountHandler` (`prisma.notification.count`
      con `{ tenantId, userId, read: false, deletedAt: null }`). Cubre: R21, R24.

- [x] T20 — Tests `get-unread-count.handler.spec.ts`: cuenta sólo `read:false`+propias+no
      borradas. Cubre: R21, R24.

- [x] T21 — Implementar `NotificationMapper` (`toDomain`/`toPersistence`) + spec. Cubre: R5, R13.

- [x] T22 — Implementar `PrismaNotificationRepository`: `findById` (filtra `deletedAt: null`),
      `save` (`$transaction` upsert + `writeToOutbox`), `markAllAsRead` (`updateMany` con filtro
      `read:false`/`deletedAt:null`/`userId`, devuelve `count`). Cubre: R5, R6, R13, R19, R20.

- [x] T23 — Implementar `ActivityReminderWorker` (`@Processor(QUEUES.ACTIVITY_REMINDERS)`):
      para job `activity-reminder-due` lee `activities` por `id`+`tenantId`+`deletedAt:null`,
      si existe y tiene `ownerId` llama `NotificationService.create({ type:'ACTIVITY_REMINDER' })`;
      si no, retorna sin error. Cubre: R9, R10, R11.

- [x] T24 — Tests `activity-reminder.worker.spec.ts` (mock `PrismaService` + mock
      `NotificationService`): crea notificación para el owner con `type='ACTIVITY_REMINDER'`; no
      crea si actividad no existe / soft-deleted / sin owner; ignora jobs de otro nombre. Cubre:
      R9, R10, R11.

- [x] T25 — Crear DTOs: `NotificationsQueryDto` (page/limit), `NotificationResponseDto`,
      `UnreadCountResponseDto`. Cubre: R12, R15, R21.

- [x] T26 — Implementar `NotificationsController` con las 4 rutas, `@Permissions(...)`,
      `@EffectiveTenantId()`, `@CurrentUser('userId')`, Swagger (`@ApiPaginatedResponse` /
      `@ApiStandardResponse`), `:id` con `ParseUUIDPipe`, rutas literales antes de `:id`.
      Cubre: R12, R15, R16, R17, R19, R21, R22, R23, R24.

- [x] T27 — Registrar permisos `notifications.read` y `notifications.update` en `prisma/seed.ts`
      (módulo `notifications`) y ejecutar `pnpm prisma:seed`. Cubre: R25.

- [x] T28 — Crear `NotificationsModule` (imports `CqrsModule` + `BullModule.registerQueue(
ACTIVITY_REMINDERS)`; controller; providers repo binding + service + handlers + worker;
      `exports: [NotificationService]`). Cubre: R4, R9.

- [x] T29 — Importar `NotificationsModule` en `PlatformModule` (`imports` y `exports`) para que
      otros contextos puedan inyectar `NotificationService`. Cubre: R4.

- [x] T30 — Verificación final: `pnpm build`, `pnpm lint:check`, `pnpm test` verde con
      cobertura ≥ 80%; documentar el mapa de trazabilidad `R<n> → test` en `progress/impl_notifications.md`.
      Cubre: R26.
