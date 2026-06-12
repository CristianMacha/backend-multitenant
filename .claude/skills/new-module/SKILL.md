---
name: new-module
description: Scaffold a new business module (or whole bounded context) following this project's DDD/CQRS pattern, using the IAM users module as the canonical template. Use when asked to create a new domain module, e.g. "/new-module inventory products" or "create the invoices module in a billing context".
argument-hint: <context> <module> [aggregate description]
---

# Scaffold a new business module

Arguments: `$ARGUMENTS` — first word is the bounded context (e.g. `inventory`), second is the module (e.g. `products`), the rest (optional) describes the aggregate's fields/behavior. If the user gave no description, ask what fields and business rules the aggregate needs before writing code; do not invent a domain model.

The canonical template is `src/contexts/iam/users/` — mirror its structure, naming, and idioms exactly. Read it (entity, events, repository port, one command + handler, one query + handler, Prisma repository, mapper, controller, DTOs, module) before generating anything.

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
  - private constructor; static `create(...)` that validates invariants (throw `DomainException`) and emits the created event; static `fromPersistence(props)` that emits nothing.
  - mutation methods that validate, mutate, `this.touch()`, and `addDomainEvent(...)` — never a public setter.
  - `delete()` using `softDelete()`.
- `repositories/<entity>.repository.ts`: `export const <ENTITY>_REPOSITORY = Symbol(...)` + interface with `findById(id, tenantId)`, `save(entity)`, and whatever finders the use cases need. All finders take `tenantId`.

### 3. Application layer — `application/`

- `commands/`: classes extending `Command<Result>` from `@nestjs/cqrs` (constructor holds readonly fields incl. `tenantId`).
- `queries/`: classes extending `Query<ReadModel | PaginatedResultDto<ReadModel>>`.
- `read-models/`: plain interfaces for the query side.
- `handlers/`:
  - Command handlers inject the repository port by Symbol, check existence/uniqueness (throw `EntityNotFoundException`/`EntityAlreadyExistsException`), mutate the aggregate, `save()`, then `this.eventBus.publishAll(aggregate.pullDomainEvents())` — never skip the publish.
  - Query handlers inject `PrismaService` directly (read side bypasses the domain), always filtering `tenantId` and `deletedAt: null`; paginated lists use `PaginatedResultDto.of(...)` with a `$transaction([findMany, count])`.

### 4. Infrastructure layer — `infrastructure/`

- `mappers/<entity>.mapper.ts`: `toDomain` (via `fromPersistence`) and `toPersistence`.
- `repositories/prisma-<entity>.repository.ts`: implements the port; `save()` is an upsert; filters `deletedAt: null` in finders.

### 5. Presentation layer — `presentation/`

- `dto/`: class-validator DTOs with `@ApiProperty` on every field; reuse `PaginationQueryDto` for lists.
- `controllers/`: `@Controller({ path: '<module>', version: '1' })`, `@ApiTags`, `@ApiBearerAuth`; every route protected with `@Permissions('<module>.<action>')`; tenant comes from `@CurrentUser('tenantId')`; mutations return `204` (`@HttpCode(HttpStatus.NO_CONTENT)`) except create which returns `{ id }`.

### 6. Wiring

- `<module>.module.ts`: imports `CqrsModule` + `AuthModule`; provides `{ provide: <ENTITY>_REPOSITORY, useClass: Prisma<Entity>Repository }` and all handlers.
- Context aggregator: if the context is new, create `src/contexts/<context>/<context>-context.module.ts` (see `iam-context.module.ts`) and import it in `AppModule`; if it exists, add the module to its `imports`.

### 7. Permissions, audit, tests

- Add `<module>.create/read/update/delete` permission rows to `PERMISSIONS` in `prisma/seed.ts` and grant them to the appropriate `SYSTEM_ROLES`.
- Register the new domain events in `DomainEventsAuditHandler` (`src/contexts/audit/audit-logs/application/event-handlers/`) so they reach the audit trail.
- Write a unit spec for the aggregate (`<entity>.entity.spec.ts`) covering: create + event emission, invariant violations, update on deleted entity rejected, double-delete rejected — mirror `user.entity.spec.ts`.

### 8. Verify

Run `pnpm build && pnpm lint && pnpm test`. All three must pass before reporting done. Finish by summarizing the created endpoints and the permission codes that were registered.
