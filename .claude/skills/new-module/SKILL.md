---
name: new-module
description: Scaffold a new business module (or whole bounded context) following this project's DDD/CQRS pattern, using the IAM users module as the canonical template. Use when asked to create a new domain module, e.g. "/new-module inventory products" or "create the invoices module in a billing context".
argument-hint: <context> <module> [aggregate description]
---

# Scaffold a new business module

Arguments: `$ARGUMENTS` — first word is the bounded context (e.g. `inventory`), second is the module (e.g. `products`), the rest (optional) describes the aggregate's fields/behavior. If the user gave no description, ask what fields and business rules the aggregate needs before writing code; do not invent a domain model.

The canonical template is `src/contexts/iam/users/` — mirror its structure, naming, and idioms exactly. Read it (entity, events, repository port, use-case folders, Prisma repository, mapper, controller, DTOs, module) before generating anything.

## Steps

### 1. Prisma schema

Add the model to `prisma/schema.prisma` following the existing conventions:

- `id String @id @default(uuid()) @db.Uuid`
- `tenantId String @map("tenant_id") @db.Uuid` + relation to `Tenant` + `@@index([tenantId])`
- `createdAt`/`updatedAt`/`deletedAt` mapped to snake_case; `@@map("<plural_snake>")`
- Add the back-relation on the `Tenant` model.

Then run `pnpm prisma:generate`. If a local database is available, `pnpm prisma:migrate`; otherwise generate the migration SQL offline:
`pnpm prisma migrate diff --from-schema-datamodel <previous schema> --to-schema-datamodel prisma/schema.prisma --script` into `prisma/migrations/<timestamp>_<name>/migration.sql`.

### 2. Domain layer — `src/contexts/<context>/<module>/domain/`

- `events/<entity>.events.ts`: one class per lifecycle event extending `DomainEvent` (`<Entity>CreatedEvent`, `<Entity>UpdatedEvent`, `<Entity>DeletedEvent`), `eventName` like `'<entity>.created'`, always carrying `tenantId`.
- `entities/<entity>.entity.ts`: aggregate extending `AggregateRoot<Props>` with:
  - `Props` interface uses `TenantId` (from `@shared/domain/types`) for `tenantId` and branded id types for any cross-aggregate foreign keys.
  - private constructor; static `create(...)` that validates invariants (throw `DomainException`) and emits the created event; static `fromPersistence(props)` that emits nothing. The mapper calls branded-type factory functions (`TenantId(raw)`) when calling `fromPersistence`.
  - mutation methods that validate, mutate (`this.props = { ...this.props, ...changes }` — never `.push()` on arrays), `this.touch()`, and `addDomainEvent(...)`.
  - `delete()` using `softDelete()`.
  - Use `Email.from(raw)` (from `@shared/domain/value-objects/email.vo`) for email fields; the getter returns the plain string value.
- `repositories/<entity>.repository.ts`: `export const <ENTITY>_REPOSITORY = Symbol(...)` + interface with `findById(id: <Entity>Id, tenantId: TenantId)`, `save(entity, outboxEvents?: DomainEvent[])`, and whatever finders the use cases need. All finders take `TenantId`.

### 3. Application layer — vertical slices under `application/`

One folder per use case. Each folder contains the command or query, the handler, and its spec:

```
application/
  <entity>.read-model.ts            ← shared read model (interface + toXReadModel fn) — always at root
  create-<entity>/
    create-<entity>.command.ts
    create-<entity>.handler.ts
    create-<entity>.handler.spec.ts
  update-<entity>/
    update-<entity>.command.ts
    update-<entity>.handler.ts
  delete-<entity>/
    delete-<entity>.command.ts
    delete-<entity>.handler.ts
  get-<entities>/
    get-<entities>.query.ts
    get-<entities>.handler.ts
  get-<entity>-by-id/
    get-<entity>-by-id.query.ts
    get-<entity>-by-id.handler.ts
```

**Read model**: define the interface and a `toXReadModel(raw)` projection function in `application/<entity>.read-model.ts` (root of application, not inside a slice — both `get-list` and `get-by-id` import from it). The projection function maps the raw Prisma result (with joined relations) to the flat read model interface; it lives in `application/` because it belongs to the read path, not the infrastructure mapper (which maps Prisma ↔ domain aggregate for the write path).

**Command handlers**: inject the repository port by Symbol; cast raw string ids to branded types at the top of `execute()` (`TenantId(command.tenantId)`, etc.); check existence/uniqueness (throw `EntityNotFoundException`/`EntityAlreadyExistsException`); mutate the aggregate; then:

```ts
const events = aggregate.pullDomainEvents();
await this.repository.save(aggregate, events); // events go to outbox in same tx
this.eventBus.publishAll(events); // fast in-process dispatch (cache, etc.)
```

Never skip the `pullDomainEvents()` + `save(aggregate, events)` pattern — the audit trail depends on it.

**Query handlers**: inject `PrismaService` directly (read side bypasses the domain); always filter `tenantId` and `deletedAt: null`; paginated lists use `PaginatedResultDto.of(...)` with `$transaction([findMany, count])`.

### 4. Infrastructure layer — `infrastructure/`

- `mappers/<entity>.mapper.ts`: `toDomain` calls `Entity.fromPersistence({ ..., tenantId: TenantId(raw.tenantId) })` and `toPersistence` returns plain strings (branded types serialize as strings).
- `repositories/prisma-<entity>.repository.ts`: implements the port; `save(entity, outboxEvents = [])` is an upsert inside `$transaction(async (tx) => { ...; await writeToOutbox(tx, outboxEvents); })`. Import `writeToOutbox` from `@shared/infrastructure/prisma/outbox.helper`. All finders filter `tenantId` and `deletedAt: null`.

### 5. Presentation layer — `presentation/`

- `dto/`: class-validator DTOs with `@ApiProperty` on every field; reuse `PaginationQueryDto` for lists.
- `controllers/`: `@Controller({ path: '<module>', version: '1' })`, `@ApiTags`, `@ApiBearerAuth`; every route protected with `@Permissions(Perm.<module>.<action>)` — import `Perm` from `@shared/authorization/permissions`; use `@EffectiveTenantId()` (from `@shared/presentation/decorators/`) instead of `@CurrentUser('tenantId')` for tenant resolution — this supports platform admin cross-tenant automatically; mutations return `204` (`@HttpCode(HttpStatus.NO_CONTENT)`) except create which returns `{ id }`; document responses with `@ApiStandardResponse`/`@ApiPaginatedResponse` (from `@shared/presentation/swagger/`).

### 6. Wiring

- `<module>.module.ts`: imports `CqrsModule` + `AuthModule`; provides `{ provide: <ENTITY>_REPOSITORY, useClass: Prisma<Entity>Repository }` and all handlers (group them in `const commandHandlers`, `queryHandlers`, `eventHandlers` arrays for readability).
- Context aggregator: if the context is new, create `src/contexts/<context>/<context>-context.module.ts` (see `iam-context.module.ts`) and import it in `AppModule`; if it exists, add the module to its `imports`.

### 7. Permissions, audit, tests

- Add the new permission codes to `Perm` in `src/shared/authorization/permissions.ts` first (e.g. `<module>: { create: '<module>.create', read: '<module>.read', ... }`), then add those rows to `PERMISSIONS` in `prisma/seed.ts` using `Perm.<module>.*` (never raw strings) and grant them to the appropriate `SYSTEM_ROLES`. The outbox automatically handles the audit trail — no changes needed to `DomainEventsAuditHandler` (it was removed; the `OutboxPublisherProcessor` in `platform/outbox/` processes all domain events generically via `eventName`).
- If the module lets a user assign roles or edit a role's permissions, the handler MUST call `assertCanGrantPermissions(...)` (from `@shared/authorization`) so a non-platform-admin can't grant authority they don't hold — mirror `AssignRoleHandler` / `SetRolePermissionsHandler`.
- Write a unit spec for the aggregate (`<entity>.entity.spec.ts`) covering: create + event emission (using `TenantId(...)` branded types in test props), invariant violations, update on deleted entity rejected, double-delete rejected, immutability of collection props on mutation — mirror `user.entity.spec.ts`.

### 8. Verify

Run `pnpm build && pnpm lint && pnpm test`. All three must pass before reporting done. Finish by summarizing the created endpoints and the permission codes that were registered.
