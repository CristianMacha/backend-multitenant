# Implementation — Platform · Notifications

Feature 1 — `notifications` — implemented 2026-06-14.

## Archivos creados

### Dominio

- `src/platform/notifications/domain/entities/notification.entity.ts`
- `src/platform/notifications/domain/entities/notification.entity.spec.ts`
- `src/platform/notifications/domain/events/notification.events.ts`
- `src/platform/notifications/domain/repositories/notification.repository.ts`

### Aplicación

- `src/platform/notifications/application/notification.read-model.ts`
- `src/platform/notifications/application/notification.service.ts`
- `src/platform/notifications/application/notification.service.spec.ts`
- `src/platform/notifications/application/mark-notification-read/mark-notification-read.command.ts`
- `src/platform/notifications/application/mark-notification-read/mark-notification-read.handler.ts`
- `src/platform/notifications/application/mark-notification-read/mark-notification-read.handler.spec.ts`
- `src/platform/notifications/application/mark-all-notifications-read/mark-all-notifications-read.command.ts`
- `src/platform/notifications/application/mark-all-notifications-read/mark-all-notifications-read.handler.ts`
- `src/platform/notifications/application/mark-all-notifications-read/mark-all-notifications-read.handler.spec.ts`
- `src/platform/notifications/application/get-notifications/get-notifications.query.ts`
- `src/platform/notifications/application/get-notifications/get-notifications.handler.ts`
- `src/platform/notifications/application/get-notifications/get-notifications.handler.spec.ts`
- `src/platform/notifications/application/get-unread-count/get-unread-count.query.ts`
- `src/platform/notifications/application/get-unread-count/get-unread-count.handler.ts`
- `src/platform/notifications/application/get-unread-count/get-unread-count.handler.spec.ts`

### Infraestructura

- `src/platform/notifications/infrastructure/mappers/notification.mapper.ts`
- `src/platform/notifications/infrastructure/mappers/notification.mapper.spec.ts`
- `src/platform/notifications/infrastructure/repositories/prisma-notification.repository.ts`
- `src/platform/notifications/infrastructure/workers/activity-reminder.worker.ts`
- `src/platform/notifications/infrastructure/workers/activity-reminder.worker.spec.ts`

### Presentación

- `src/platform/notifications/presentation/controllers/notifications.controller.ts`
- `src/platform/notifications/presentation/dto/notifications-query.dto.ts`
- `src/platform/notifications/presentation/dto/notification-response.dto.ts`
- `src/platform/notifications/presentation/dto/unread-count-response.dto.ts`

### Módulo

- `src/platform/notifications/notifications.module.ts`

### Archivos modificados

- `prisma/schema.prisma` — enum `NotificationType` + modelo `Notification` + back-relations en `Tenant` y `User`
- `prisma/migrations/20260614202254_add_notifications/migration.sql` — migración generada
- `prisma/seed.ts` — permisos `notifications.read` y `notifications.update`
- `src/shared/domain/types.ts` — tipo branded `NotificationId` + factory
- `src/shared/authorization/permissions.ts` — `notifications: { read, update }` en catálogo `Perm`
- `src/platform/platform.module.ts` — importa y exporta `NotificationsModule`

## Trazabilidad

| Requerimiento                                               | Test                                                                                                                                                                                                                                      |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1 — Modelo Notification en Prisma                          | `notification.entity.spec.ts` → `creates with read=false`                                                                                                                                                                                 |
| R2 — Creación con read=false y readAt=null                  | `notification.entity.spec.ts` → `creates with read=false and readAt=undefined`                                                                                                                                                            |
| R3 — Soft-delete (sin hard delete)                          | `prisma-notification.repository.ts` → `markAllAsRead` no hace delete, `delete()` en entity llama `softDelete()`                                                                                                                           |
| R4 — NotificationService inyectable                         | `notification.service.spec.ts` → `creates a notification and returns its id`                                                                                                                                                              |
| R5 — Persiste via repositorio                               | `notification.service.spec.ts` → `save` llamado                                                                                                                                                                                           |
| R6 — Emite NotificationCreatedEvent al outbox               | `notification.entity.spec.ts` → `emits NotificationCreatedEvent`; `notification.service.spec.ts` → `passes domain events to repository.save`                                                                                              |
| R7 — publishAll después del save                            | `notification.service.spec.ts` → `calls eventBus.publishAll with domain events`                                                                                                                                                           |
| R8 — Rechaza title/body vacíos                              | `notification.entity.spec.ts` → `throws DomainException when title/body is empty`; `notification.service.spec.ts` → idem                                                                                                                  |
| R9 — Crea notificación al recibir activity-reminder-due     | `activity-reminder.worker.spec.ts` → `creates a notification with type ACTIVITY_REMINDER`                                                                                                                                                 |
| R10 — type = ACTIVITY_REMINDER                              | `activity-reminder.worker.spec.ts` → `callArg.type === 'ACTIVITY_REMINDER'`                                                                                                                                                               |
| R11 — No crea si actividad no existe/soft-deleted/sin owner | `activity-reminder.worker.spec.ts` → 3 tests de no-create                                                                                                                                                                                 |
| R12 — GET paginated con status 200                          | `get-notifications.handler.spec.ts` → `returns a paginated list`                                                                                                                                                                          |
| R13 — Filtra por tenantId + userId + deletedAt:null         | `get-notifications.handler.spec.ts` → `passes tenantId, userId, and deletedAt:null`                                                                                                                                                       |
| R14 — Ordena por createdAt desc                             | `get-notifications.handler.spec.ts` → `orders results by createdAt desc`                                                                                                                                                                  |
| R15 — Paginación page/limit                                 | `get-notifications.handler.spec.ts` → `applies pagination with skip and take` + `returns correct pagination meta`                                                                                                                         |
| R16 — PATCH /:id/read marca read=true + readAt              | `mark-notification-read.handler.spec.ts` → `marks an unread notification as read`                                                                                                                                                         |
| R17 — 404 si no existe o de otro usuario                    | `mark-notification-read.handler.spec.ts` → `throws EntityNotFoundException when not found` + `when belongs to another user`                                                                                                               |
| R18 — Idempotente si ya leída                               | `mark-notification-read.handler.spec.ts` → `is idempotent`; `notification.entity.spec.ts` → `is idempotent`                                                                                                                               |
| R19 — PATCH /read-all marca todas + devuelve contador       | `mark-all-notifications-read.handler.spec.ts` → `calls markAllAsRead and returns the count`                                                                                                                                               |
| R20 — read-all solo afecta deletedAt:null + read:false      | Cubierto en `PrismaNotificationRepository.markAllAsRead` (where clause incluye `read:false, deletedAt:null`)                                                                                                                              |
| R21 — GET /unread-count devuelve entero                     | `get-unread-count.handler.spec.ts` → `returns the count of unread notifications`                                                                                                                                                          |
| R22 — Protege GET con notifications.read                    | `notifications.controller.ts` → `@Permissions(Perm.notifications.read)` en GET routes                                                                                                                                                     |
| R23 — Protege PATCH con notifications.update                | `notifications.controller.ts` → `@Permissions(Perm.notifications.update)` en PATCH routes                                                                                                                                                 |
| R24 — Acotado por userId autenticado                        | `mark-notification-read.handler.spec.ts` → `throws when belongs to another user`; `get-notifications.handler.spec.ts` → where includes `userId`; `mark-all-notifications-read.handler.spec.ts` → `passes the correct tenantId and userId` |
| R25 — Permisos en seed.ts y Perm catalog                    | `prisma/seed.ts` + `@shared/authorization/permissions.ts`                                                                                                                                                                                 |
| R26 — Cobertura ≥ 80%                                       | `pnpm test:cov` → 84.77% global; 318 tests en 80 test suites                                                                                                                                                                              |

## Resultados finales

- `pnpm build` — sin errores TypeScript
- `pnpm lint:check` — limpio
- `pnpm test` — 318 tests / 80 suites / 0 fallos
- `pnpm test:cov` — 84.77% global (> 80%)
- `./init.sh` — verde
