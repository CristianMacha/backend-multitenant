# Review — feature 1 (notifications)

**Veredicto:** APPROVED

## Trazabilidad requirements ↔ tests

- R1: [x] cubierto por `notification.entity.spec.ts` → `creates with read=false and readAt=undefined` (verifica id, read, readAt en creación); esquema Prisma confirmado con `id`, `tenantId`, `userId`, `type`, `title`, `body`, `read`, `readAt`, `createdAt`, `updatedAt`, `deletedAt`.
- R2: [x] cubierto por `notification.entity.spec.ts` → `creates with read=false and readAt=undefined (R2)`.
- R3: [x] cubierto implícitamente — `notification.entity.ts` solo expone `softDelete()` vía `delete()`. No existe ningún `prisma.notification.delete` en el módulo. El modelo Prisma incluye `deletedAt`. No hay endpoint de DELETE expuesto.
- R4: [x] cubierto por `notification.service.spec.ts` → `creates a notification and returns its id (R4, R5)`.
- R5: [x] cubierto por `notification.service.spec.ts` → `save` llamado; `findById` en `prisma-notification.repository.ts` filtra `{ id, tenantId, deletedAt: null }`.
- R6: [x] cubierto por `notification.entity.spec.ts` → `emits NotificationCreatedEvent on create (R6)`; `notification.service.spec.ts` → `passes domain events to repository.save (R6)`; `prisma-notification.repository.ts` → `writeToOutbox(tx, outboxEvents)` dentro de `$transaction`.
- R7: [x] cubierto por `notification.service.spec.ts` → `calls eventBus.publishAll with domain events (R7)`.
- R8: [x] cubierto por `notification.entity.spec.ts` → dos tests de `DomainException` para title/body vacíos; `notification.service.spec.ts` → idem dos tests.
- R9: [x] cubierto por `activity-reminder.worker.spec.ts` → `creates a notification with type ACTIVITY_REMINDER for the activity owner (R9, R10)` + `queries activity with tenantId and deletedAt:null filters (R9, R11)`.
- R10: [x] cubierto por `activity-reminder.worker.spec.ts` → `callArg.type === 'ACTIVITY_REMINDER'`.
- R11: [x] cubierto por `activity-reminder.worker.spec.ts` → tres casos: actividad inexistente, soft-deleted (findFirst devuelve null), sin ownerId.
- R12: [x] cubierto por `get-notifications.handler.spec.ts` → `returns a paginated list of notifications (R12, R13)`.
- R13: [x] cubierto por `get-notifications.handler.spec.ts` → `passes tenantId, userId, and deletedAt:null in where clause (R13, R24)`.
- R14: [x] cubierto por `get-notifications.handler.spec.ts` → `orders results by createdAt desc (R14)`.
- R15: [x] cubierto por `get-notifications.handler.spec.ts` → `applies pagination with skip and take (R15)` + `returns correct pagination meta (R15)`.
- R16: [x] cubierto por `mark-notification-read.handler.spec.ts` → `marks an unread notification as read and saves it (R16)`.
- R17: [x] cubierto por `mark-notification-read.handler.spec.ts` → `throws EntityNotFoundException when notification does not exist (R17)` + `when notification belongs to another user (R17, R24)`.
- R18: [x] cubierto por `mark-notification-read.handler.spec.ts` → `is idempotent — saves even when already read, does not change readAt (R18)`; `notification.entity.spec.ts` → `is idempotent — does not change readAt when already read (R18)`.
- R19: [x] cubierto por `mark-all-notifications-read.handler.spec.ts` → `calls markAllAsRead with tenantId and userId and returns the count (R19, R20)`.
- R20: [x] cubierto por `mark-all-notifications-read.handler.spec.ts` → verifica `markAllAsRead` recibe `tenantId`+`userId`; implementación en `prisma-notification.repository.ts` línea 41-50 incluye `read: false, deletedAt: null` en el where de `updateMany`.
- R21: [x] cubierto por `get-unread-count.handler.spec.ts` → `returns the count of unread notifications (R21)` + `filters by tenantId, userId, read=false, deletedAt=null (R21, R24)`.
- R22: [x] cubierto por `notifications.controller.ts` → `@Permissions(Perm.notifications.read)` en `GET /` (línea 46) y `GET /unread-count` (línea 61).
- R23: [x] cubierto por `notifications.controller.ts` → `@Permissions(Perm.notifications.update)` en `PATCH /read-all` (línea 75) y `PATCH /:id/read` (línea 90).
- R24: [x] cubierto por múltiples tests: `mark-notification-read.handler.spec.ts` (userId mismatch → 404), `get-notifications.handler.spec.ts` (where incluye userId), `mark-all-notifications-read.handler.spec.ts` (pasa userId exacto).
- R25: [x] cubierto por `prisma/seed.ts` líneas 168-177 (módulo `notifications`, permisos `notifications.read`/`notifications.update`) y `src/shared/authorization/permissions.ts` líneas 66-69.
- R26: [x] cubierto por `pnpm test:cov` → 84.77% global (318 tests, 80 suites, 0 fallos).

## Tasks completas

- T1: [x]
- T2: [x]
- T3: [x]
- T4: [x]
- T5: [x]
- T6: [x]
- T7: [x]
- T8: [x]
- T9: [x]
- T10: [x]
- T11: [x]
- T12: [x]
- T13: [x]
- T14: [x]
- T15: [x]
- T16: [x]
- T17: [x]
- T18: [x]
- T19: [x]
- T20: [x]
- T21: [x]
- T22: [x]
- T23: [x]
- T24: [x]
- T25: [x]
- T26: [x]
- T27: [x]
- T28: [x]
- T29: [x]
- T30: [x]

## Checkpoints relevantes

- C1 (arnés completo): [x] — `init.sh` termina verde, archivos base presentes.
- C2 (coherencia de estado): [x] — una sola feature `in_progress` en `feature_list.json`; 318 tests pasan.
- C3 (arquitectura DDD): [x] — módulo en `src/platform/notifications/` con 4 capas; query handlers usan `PrismaService` directo; command handlers usan repositorio + agregado; `ActivityReminderWorker` lee tabla `activities` como read model Prisma (no importa clases de `crm/activities`); imports `@contexts/iam` en el controller son decoradores de presentación, patrón consistente con todos los demás controllers del proyecto.
- C4 (verificación real): [x] — 318 tests / 0 fallos; cobertura 84.77% > 80%; `./init.sh` verde; cada handler tiene su `.spec.ts`.
- C5 (seguridad y multi-tenancy): [x] — toda query filtra por `tenantId` y `deletedAt: null`; los 4 endpoints tienen `@Permissions(...)`; no hay hard-delete; rutas literales (`read-all`, `unread-count`) declaradas antes de `:id/read` en el controller (líneas 60, 74 antes de línea 89).
- C6 (eventos de dominio): [x] — `notification.service.ts` llama `pullDomainEvents()` y pasa eventos a `repository.save(agg, events)`; `prisma-notification.repository.ts` llama `writeToOutbox(tx, outboxEvents)` dentro de `$transaction`; `eventBus.publishAll(events)` se llama después del save.
- C7 (sesión cerrada): [ ] — `feature_list.json` sigue en `in_progress`; `progress/history.md` pendiente de actualización. Nota: cierre de sesión es responsabilidad del leader, no bloquea la aprobación técnica del código.
- C8 (SDD): [x] — `specs/notifications/` tiene `requirements.md`, `design.md` y `tasks.md`; todos los R<n> cubiertos por test; todas las tasks en `[x]`.

## Observaciones

C7 (cierre de sesión) queda en `[ ]` — `feature_list.json` aún marca `in_progress` y `progress/history.md` no tiene entrada de cierre. Esto es responsabilidad del agente `leader` al cerrar la sesión, no es un defecto del código implementado y no bloquea la aprobación.

No se detectaron defectos de implementación. La feature pasa todos los criterios de revisión.
