# Design — Platform · Notifications

> Cómo se construye la feature `notifications`. Ubicación: `src/platform/notifications/`
> (servicio técnico, no un bounded context). Sigue las 4 capas DDD y la ruta de escritura
> vs lectura del proyecto (`docs/architecture.md`).

## 1. Ubicación y por qué `platform/`

El módulo vive en `src/platform/notifications/` y no en `src/contexts/`. Razón: es un
servicio técnico de entrega de mensajes al usuario, consumido por varios contextos
(`crm/activities` hoy, otros mañana) sin pertenecer a ningún dominio de negocio concreto.

Cumple la regla de dependencia: `platform/` no importa internals de ningún `contexts/`.
El consumidor del recordatorio lee la tabla `activities` como **read model** (modelo Prisma),
no importa clases del módulo `crm/activities` — igual que cualquier query handler lee Prisma
directamente.

`crm/activities` ya **produce** la señal: `JobsService.enqueueActivityReminder()` encola el
job `activity-reminder-due` en la cola `activity-reminders` (ver
`src/platform/jobs/domain/queues.ts` y `application/jobs.service.ts`). Hoy esa cola **no
tiene consumidor**; esta feature añade el consumidor.

## 2. Estructura del módulo (4 capas)

```
src/platform/notifications/
├── notifications.module.ts
├── domain/
│   ├── entities/
│   │   ├── notification.entity.ts            # AggregateRoot<NotificationProps>
│   │   └── notification.entity.spec.ts
│   ├── events/
│   │   └── notification.events.ts            # NotificationCreatedEvent
│   └── repositories/
│       └── notification.repository.ts        # interface + NOTIFICATION_REPOSITORY Symbol
├── application/
│   ├── notification.read-model.ts            # NotificationReadModel + toNotificationReadModel
│   ├── notification.service.ts               # NotificationService (export público) + spec
│   ├── notification.service.spec.ts
│   ├── mark-notification-read/
│   │   ├── mark-notification-read.command.ts
│   │   ├── mark-notification-read.handler.ts
│   │   └── mark-notification-read.handler.spec.ts
│   ├── mark-all-notifications-read/
│   │   ├── mark-all-notifications-read.command.ts
│   │   ├── mark-all-notifications-read.handler.ts
│   │   └── mark-all-notifications-read.handler.spec.ts
│   ├── get-notifications/
│   │   ├── get-notifications.query.ts
│   │   ├── get-notifications.handler.ts
│   │   └── get-notifications.handler.spec.ts
│   └── get-unread-count/
│       ├── get-unread-count.query.ts
│       ├── get-unread-count.handler.ts
│       └── get-unread-count.handler.spec.ts
├── infrastructure/
│   ├── mappers/
│   │   ├── notification.mapper.ts
│   │   └── notification.mapper.spec.ts
│   ├── repositories/
│   │   └── prisma-notification.repository.ts
│   └── workers/
│       ├── activity-reminder.worker.ts       # consumidor BullMQ de activity-reminders
│       └── activity-reminder.worker.spec.ts
└── presentation/
    ├── controllers/
    │   └── notifications.controller.ts
    └── dto/
        ├── notifications-query.dto.ts
        ├── notification-response.dto.ts
        └── unread-count-response.dto.ts
```

## 3. Dominio

### Agregado `Notification` (extiende `AggregateRoot<NotificationProps>`)

`NotificationProps extends BaseEntityProps`:

- `tenantId: TenantId`
- `userId: UserId`
- `type: NotificationType` (`'ACTIVITY_REMINDER' | 'SYSTEM' | 'GENERIC'`)
- `title: string`
- `body: string`
- `read: boolean`
- `readAt?: Date`

Métodos:

- `static create({ tenantId, userId, type, title, body })`: valida `title`/`body` no vacíos
  (tras `trim()`), si vacío lanza `DomainException('...', 'INVALID_NOTIFICATION')`; inicializa
  `read = false`, `readAt = undefined`; emite `NotificationCreatedEvent`. Cubre R2, R6, R8.
- `static fromPersistence(props)`: rehidratación desde Prisma (sin eventos).
- `markAsRead()`: si `read` ya es `true`, no-op (idempotente, no `touch()` ni evento — R18);
  en otro caso fija `read = true`, `readAt = new Date()`, `touch()`. Cubre R16, R18.
- `delete()`: `softDelete()` (disponible si en el futuro se borra; no expuesto por endpoint).
- getters de todas las props.

### Domain event `NotificationCreatedEvent` (extiende `DomainEvent`)

`eventName = 'notification.created'`. Constructor:
`(aggregateId, tenantId, userId, type, title)`. El outbox lo convierte en audit log
`notification.created` automáticamente vía `OutboxPublisherProcessor`.

> Nota: marcar como leída **no** emite domain event al outbox (decisión, ver §8). El audit
> trail del proyecto se nutre del outbox y se reserva para creaciones; las lecturas de
> notificaciones propias no son auditables de negocio. Esto mantiene el outbox liviano.

### Repository port `NotificationRepository` (`domain/repositories/notification.repository.ts`)

```ts
export const NOTIFICATION_REPOSITORY = Symbol('NOTIFICATION_REPOSITORY');

export interface NotificationRepository {
  findById(
    id: NotificationId,
    tenantId: TenantId,
  ): Promise<Notification | null>;
  save(notification: Notification, outboxEvents?: DomainEvent[]): Promise<void>;
  markAllAsRead(tenantId: TenantId, userId: UserId): Promise<number>; // devuelve afectadas
}
```

`NotificationId` se añade a `@shared/domain/types` (branded type + factory), siguiendo el
patrón de `ActivityId`.

## 4. Aplicación

### `NotificationService` (export público del módulo) — R4, R5, R6, R7

Inyecta `NOTIFICATION_REPOSITORY` y `EventBus`. Método:

```ts
async create(input: {
  tenantId: string; userId: string; type: NotificationType;
  title: string; body: string;
}): Promise<{ id: string }>
```

Construye el agregado con `Notification.create(...)` (castea ids con `TenantId`/`UserId`),
`pullDomainEvents()`, `repository.save(agg, events)`, `eventBus.publishAll(events)`, retorna
`{ id }`. Es la API que otros contextos usan; se exporta en `exports` del módulo. No es un
`CommandHandler` CQRS porque debe ser invocable directamente por otros módulos sin pasar por
el `CommandBus` (que es local al request).

### Commands (ruta de escritura, repo + agregado)

- `MarkNotificationReadHandler` / `MarkNotificationReadCommand(notificationId, tenantId, userId)`:
  `findById` filtrando por `tenantId`; si null o `userId` ≠ propietario → `NotFoundException`
  (R17); `markAsRead()`; `save()` (sin outbox event); idempotente (R16, R18).
- `MarkAllNotificationsReadHandler` / `MarkAllNotificationsReadCommand(tenantId, userId)`:
  llama `repository.markAllAsRead(tenantId, userId)` (update masivo Prisma, filtra
  `read = false`, `deletedAt: null`, `userId`); retorna `{ updated: number }` (R19, R20).

### Queries (ruta de lectura, `PrismaService` directo, sin repositorio)

- `GetNotificationsHandler` / `GetNotificationsQuery(tenantId, userId, page, limit)`: where
  `{ tenantId, userId, deletedAt: null }`, `orderBy createdAt desc`, `skip/take`, devuelve
  `PaginatedResultDto<NotificationReadModel>` (R12, R13, R14, R15).
- `GetUnreadCountHandler` / `GetUnreadCountQuery(tenantId, userId)`: `prisma.notification.count`
  con where `{ tenantId, userId, read: false, deletedAt: null }`; devuelve `number` (R21).

`NotificationReadModel` + `toNotificationReadModel(raw)` viven en
`application/notification.read-model.ts` (regla del proyecto: read models junto a queries).

## 5. Infraestructura

### `PrismaNotificationRepository` (implementa `NotificationRepository`) — R5, R6, R13

- `findById`: `prisma.notification.findFirst({ where: { id, tenantId, deletedAt: null } })`.
- `save`: `prisma.$transaction` → `upsert` por `id` + `writeToOutbox(tx, outboxEvents)`
  (mismo patrón que `PrismaActivityRepository`).
- `markAllAsRead`: `prisma.notification.updateMany({ where: { tenantId, userId, read: false,
deletedAt: null }, data: { read: true, readAt: new Date() } })` → devuelve `result.count`.

`NotificationMapper` (`toDomain` / `toPersistence`) idéntico en estilo a `ActivityMapper`.

### `ActivityReminderWorker` (consumidor BullMQ) — R9, R10, R11

```ts
@Processor(QUEUES.ACTIVITY_REMINDERS)
export class ActivityReminderWorker extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {
    super();
  }

  async process(job: Job<ActivityReminderJobData>): Promise<void> {
    if (job.name !== JOB_NAMES.ACTIVITY_REMINDER_DUE) return;
    const { activityId, tenantId } = job.data;
    const activity = await this.prisma.activity.findFirst({
      where: { id: activityId, tenantId, deletedAt: null },
      select: { id: true, ownerId: true, subject: true, dueAt: true },
    });
    if (!activity || !activity.ownerId) return; // R11
    await this.notificationService.create({
      tenantId,
      userId: activity.ownerId,
      type: 'ACTIVITY_REMINDER',
      title: 'Activity reminder',
      body: `Reminder: "${activity.subject}" is due.`,
    });
  }
}
```

- Lee la tabla `activities` como read model (no importa clases de `crm/activities`): respeta
  la regla de no-cross-context-internals.
- `tenantId` en `where` explícito garantiza aislamiento (el worker corre fuera del request, sin
  `RequestContextStorage`; el `SharedDatabaseClientResolver` devuelve el cliente por defecto y
  el filtro por `tenantId` hace el aislamiento — igual que `OutboxPublisherProcessor`).
- Registra la cola con `BullModule.registerQueue({ name: QUEUES.ACTIVITY_REMINDERS })` en
  `NotificationsModule` para que el `@Processor` tenga su worker. `JobsModule` ya la registra
  como productor; registrarla aquí como consumidor es válido (BullMQ permite múltiples
  registros de la misma cola).

## 6. Presentación

`NotificationsController` — `@Controller({ path: 'notifications', version: '1' })`,
`@ApiTags('Notifications')`, `@ApiBearerAuth()`. Usa `CommandBus`/`QueryBus`,
`@EffectiveTenantId()` y `@CurrentUser('userId')`.

| Método  | Ruta                                 | Permiso                     | Acción                                 | R             |
| ------- | ------------------------------------ | --------------------------- | -------------------------------------- | ------------- |
| `GET`   | `/api/v1/notifications`              | `Perm.notifications.read`   | `GetNotificationsQuery`                | R12, R15, R22 |
| `GET`   | `/api/v1/notifications/unread-count` | `Perm.notifications.read`   | `GetUnreadCountQuery`                  | R21, R22      |
| `PATCH` | `/api/v1/notifications/:id/read`     | `Perm.notifications.update` | `MarkNotificationReadCommand`, 204     | R16, R17, R23 |
| `PATCH` | `/api/v1/notifications/read-all`     | `Perm.notifications.update` | `MarkAllNotificationsReadCommand`, 200 | R19, R23      |

> Orden de rutas: declarar `read-all` y `unread-count` (literales) antes de `:id/read` para
> evitar colisión de path. `:id` con `ParseUUIDPipe`. Swagger con `@ApiPaginatedResponse` /
> `@ApiStandardResponse` (nunca `@ApiOkResponse` crudo).

DTOs:

- `NotificationsQueryDto`: `page`, `limit` (reusar el patrón de `ActivitiesQueryDto`).
- `NotificationResponseDto`: forma del read model para Swagger.
- `UnreadCountResponseDto`: `{ count: number }`.

El controller pasa siempre `@CurrentUser('userId')` a query/command → garantiza R24 (un usuario
nunca ve ni muta notificaciones de otro; no hay rama "manager/admin ve las de otros").

## 7. Cambios en `prisma/schema.prisma` — R1, R3

Nuevo enum y modelo, más back-relations:

```prisma
enum NotificationType {
  ACTIVITY_REMINDER
  SYSTEM
  GENERIC

  @@map("notification_type")
}

model Notification {
  id        String           @id @default(uuid()) @db.Uuid
  tenantId  String           @map("tenant_id") @db.Uuid
  userId    String           @map("user_id") @db.Uuid
  type      NotificationType @default(GENERIC)
  title     String
  body      String
  read      Boolean          @default(false)
  readAt    DateTime?        @map("read_at")
  createdAt DateTime         @default(now()) @map("created_at")
  updatedAt DateTime         @updatedAt @map("updated_at")
  deletedAt DateTime?        @map("deleted_at")

  tenant Tenant @relation(fields: [tenantId], references: [id])
  user   User   @relation(fields: [userId], references: [id])

  @@index([tenantId])
  @@index([tenantId, userId, read])
  @@index([tenantId, userId, createdAt])
  @@map("notifications")
}
```

- Añadir `notifications Notification[]` a `model Tenant` y a `model User` (back-relations).
- Ejecutar `pnpm prisma:migrate` (nombre sugerido: `add_notifications`) + `pnpm prisma:generate`.
- `updatedAt` se incluye aunque el acceptance original lista sólo hasta `createdAt`: el proyecto
  usa `updatedAt` en todas las tablas de negocio (consistencia con `BaseEntityProps` y `touch()`).

## 8. Permisos — R25

- Añadir a `@shared/authorization/permissions.ts`:
  ```ts
  notifications: {
    read: 'notifications.read',
    update: 'notifications.update',
  },
  ```
- Registrar en `prisma/seed.ts` (módulo `notifications`):
  - `{ code: Perm.notifications.read, module: 'notifications', description: 'Read own notifications' }`
  - `{ code: Perm.notifications.update, module: 'notifications', description: 'Mark own notifications as read' }`

## 9. Wiring de módulos

- `NotificationsModule` (`@Module`): `imports: [CqrsModule, BullModule.registerQueue({ name:
QUEUES.ACTIVITY_REMINDERS })]`; `controllers: [NotificationsController]`; `providers`:
  binding `{ provide: NOTIFICATION_REPOSITORY, useClass: PrismaNotificationRepository }`,
  `NotificationService`, los command/query handlers, `ActivityReminderWorker`;
  `exports: [NotificationService]`.
- `PlatformModule`: añadir `NotificationsModule` a `imports` y a `exports` (para que otros
  contextos puedan inyectar `NotificationService`).
- `BullModule.forRoot` ya está configurado globalmente en `JobsModule`; `registerQueue` aquí
  reutiliza esa conexión.

## 10. UnitOfWork

No se usa `UnitOfWork`. Cada caso de uso toca una sola raíz de agregado (`Notification`):
la atomicidad agregado+outbox la cubre el `$transaction` interno del repositorio (`save`).
`markAllAsRead` es un único `updateMany`. No hay operación que mute varias raíces de agregado
en una transacción que cruce repositorios, que es el escenario para el que existe `UnitOfWork`.

## 11. Alternativas descartadas

- **Entregar el recordatorio escribiendo la notificación dentro del propio handler de
  `crm/activities`** (sin cola/worker en notifications): descartada. Acopla la entrega al
  contexto CRM y rompe el desacoplamiento exigido (R4); además el productor ya encola el job y
  la entrega in-app es responsabilidad de `platform/notifications`.
- **Que el consumidor importe el `ActivityRepository`/agregado de `crm/activities` para obtener
  el `ownerId`**: descartada. Violaría la regla de no importar internals de otro contexto desde
  `platform/`. En su lugar se lee la tabla `activities` como read model (modelo Prisma), que es
  el mecanismo de lectura cross-context permitido.
- **Emitir un domain event `NotificationRead` al outbox al marcar leída**: descartada por ahora.
  El outbox alimenta el audit trail de mutaciones de negocio; la lectura de notificaciones
  propias no aporta valor de auditoría y engrosaría el outbox. Sólo `NotificationCreated` va al
  outbox (R6). Si en el futuro se requiere auditar lecturas, se añade el evento sin cambiar el
  contrato del agregado.
- **Pasar `userId`/`ownerId` dentro del `ActivityReminderJobData`** para evitar la lectura de
  la tabla `activities`: descartada para no modificar el productor en `crm/activities` (fuera
  del alcance de esta feature) y porque el `ownerId` puede cambiar entre el encolado y el
  vencimiento; leerlo en el momento del disparo es más correcto.
