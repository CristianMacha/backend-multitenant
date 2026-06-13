# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Enterprise backend core (NestJS 11 + TypeScript strict + Prisma/PostgreSQL + Redis/BullMQ + Firebase Auth) meant as the foundation for future business systems (ERP, CRM, HR, etc.). Multi-tenant, RBAC + granular permissions, CQRS, event-driven. Package manager is **pnpm**.

## Commands

```bash
pnpm start:dev                 # dev server with hot reload (http://localhost:3000/api/v1, Swagger at /api/docs)
pnpm build                     # nest build (also the fastest full type-check)
pnpm lint                      # eslint --fix        | pnpm lint:check (no fix, used in CI)
pnpm test                      # all unit tests
pnpm test -- path/to/file.spec.ts          # single test file
pnpm test -- -t "test name"                # single test by name
pnpm test:cov                  # coverage (80% global threshold enforced)
pnpm test:e2e                  # e2e — requires postgres+redis running and a valid .env
docker compose up -d postgres redis        # local infrastructure
pnpm prisma:migrate            # apply/create migrations (dev)
pnpm prisma:seed               # default tenant, permission catalog, system roles
pnpm prisma:generate           # regenerate Prisma client (run after schema.prisma changes)

# One-time bootstrap of the first platform super admin (after prisma:seed):
FIREBASE_UID=<uid> EMAIL=<email> FIRST_NAME=Admin LAST_NAME=User \
  npx ts-node -r tsconfig-paths/register scripts/bootstrap-super-admin.ts
```

Local setup requires `cp .env.sample .env` with real Firebase service-account credentials; env vars are validated with Joi at boot ([src/config/env.validation.ts](src/config/env.validation.ts)) and the app refuses to start if any required one is missing.

## Architecture

Modular monolith organized by **DDD bounded contexts**:

- `src/contexts/` — business domains, one folder per bounded context, each exposing a single `*-context.module.ts` aggregator that `AppModule` imports:
  - `iam/` (auth, users, roles, permissions), `tenancy/` (tenants), `audit/` (audit-logs)
- `src/platform/` — technical services, not domain: cache (Redis), jobs (BullMQ), outbox publisher, health (Terminus). Aggregated by `platform.module.ts`.
- `src/shared/` — shared kernel: DDD base classes, exception hierarchy, AsyncLocalStorage request context, global filter/interceptor/middleware, PrismaService, UnitOfWork.
- `src/config/` — typed configuration + Joi validation.

Path aliases (tsconfig + jest moduleNameMapper in package.json + test/jest-e2e.json — keep all three in sync): `@contexts/*`, `@platform/*`, `@shared/*`, `@config/*`.

**Dependency rules:** a context never imports another context's internals — integrate via domain events on the CQRS EventBus or via what the other `*-context.module.ts` exports. `platform/` and `shared/` never depend on `contexts/`. `@Public()` lives in `@shared/presentation/decorators/` (the re-export in auth/decorators is for backward compat only).

Each module inside a context follows four layers:

```text
module/
├── domain/          # aggregates (extend AggregateRoot), domain events, repository ports (interface + Symbol token)
├── application/     # vertical slices — one folder per use case:
│   ├── create-user/
│   │   ├── create-user.command.ts
│   │   ├── create-user.handler.ts
│   │   └── create-user.handler.spec.ts   ← spec lives next to handler
│   ├── get-users/
│   │   ├── get-users.query.ts
│   │   └── get-users.handler.ts
│   ├── on-user-mutated/                  ← event handlers grouped by trigger
│   │   └── invalidate-user-cache.handler.ts
│   └── user.read-model.ts               ← shared read model (interface + projection fn) when multiple query slices need the same shape
├── infrastructure/  # Prisma repository implementations, mappers (Prisma ↔ domain aggregate), external providers
└── presentation/    # controllers, DTOs, guards, decorators
```

**Every module follows this vertical-slice layout** — there is no "compact variant". Infrastructure mappers (`*.mapper.ts`) handle the write-path (Prisma ↔ domain aggregate). Read-model projection functions (`toXReadModel`) belong in `application/` next to the query handlers that use them, never in `infrastructure/`.

### Key mechanics (cross-file, non-obvious)

- **Write vs read paths differ on purpose**: command handlers go through the repository port and domain aggregate (which emits events); query handlers bypass the domain and use PrismaService directly, returning read models.
- **Domain events → outbox → audit trail**: after `repository.save(aggregate, events)`, the events are written atomically to `domain_event_outbox` in the same DB transaction. `platform/outbox/OutboxPublisherProcessor` (BullMQ, every 10 s) reads unpublished entries and writes audit logs via `AuditLogService`. In-process `EventBus.publishAll(events)` still fires immediately for low-latency handlers (e.g. cache invalidation). When adding mutations: emit an event from the aggregate AND pass `pullDomainEvents()` to `repository.save()` as the second argument — otherwise the audit trail will be missing.
- **Outbox is the audit source of truth**: `DomainEventsAuditHandler` was removed; auditing happens exclusively via the outbox processor. This ensures audit entries are never lost if the process crashes between save and EventBus dispatch.
- **Request context is AsyncLocalStorage** (`RequestContextStorage` in `src/shared/context/`): `CorrelationIdMiddleware` initializes it, the Firebase strategy stores the authenticated `UserContext` there, and any layer (audit, logging) reads it without parameter threading.
- **Auth flow**: Firebase ID token → passport-custom strategy verifies it → `UserContextService` builds roles+permissions from PostgreSQL, cached in Redis for 120s. Anything that changes a user's roles/permissions must invalidate that cache (key helper: `userContextCacheKey(firebaseUid)`).
- **Platform super admin vs tenant roles (two distinct concepts)**: a _platform super admin_ is a **global operator** identified by the `User.isPlatformAdmin` flag (set only by `scripts/bootstrap-super-admin.ts`) — it bypasses role/permission checks and may cross tenants via `x-tenant-id`. It is **never a per-tenant role**. Inside a tenant, `ADMIN` is the top role (tenant owner); it gets every tenant-scoped permission **except** `tenants.*` and has no cross-tenant reach. Gate platform-only routes (e.g. tenant management) with `@PlatformAdmin()` (from `@contexts/iam/auth/presentation/decorators/`), enforced by `PlatformAdminGuard`. Do **not** create a `SUPER_ADMIN` role per tenant.
- **No privilege escalation via role management**: a non-platform-admin can never grant authority they don't hold. `assertCanGrantPermissions()` (from `@shared/authorization/`) enforces this in `AssignRoleHandler` and `SetRolePermissionsHandler` — any new module that lets a user assign roles or edit role permissions MUST call it. System roles (`isSystem`) are immutable: the `Role` aggregate blocks `update`/`delete`/`setPermissions` on them.
- **Global guard order** (registered in `AppModule`): Throttler → FirebaseAuth → Tenant → Roles → Permissions → PlatformAdmin. Routes are authenticated by default; opt out with `@Public()` (from `@shared/presentation/decorators/`). Authorize with `@Permissions(Perm.users.create)` (use `Perm` from `@shared/authorization/permissions`) / `@Roles('ADMIN')` / `@PlatformAdmin()`. A platform super admin bypasses role/permission checks and may cross tenants via the `x-tenant-id` header.
- **Cross-tenant for platform admins**: use `@EffectiveTenantId()` (from `@shared/presentation/decorators/`) instead of `@CurrentUser('tenantId')` in controllers a platform admin may call across tenants. It returns the `x-tenant-id` header tenant for platform admins, and the user's own tenant for everyone else.
- **Multi-tenancy is enforced in queries, not the DB**: every business table has `tenant_id`; repositories and query handlers must always filter by it (and by `deletedAt: null` — soft delete is mandatory, never hard-delete).
- **`PrismaService` is a tenant-aware facade**: it proxies every call to the client returned by `TenantClientResolver` (token bound in `PrismaModule`) for the tenant in `RequestContextStorage`. Today that's `SharedDatabaseClientResolver` (single shared DB); migrating to schema- or database-per-tenant means binding a new resolver implementation — consumers never change. Inside a `UnitOfWork.run()`, all PrismaService calls automatically use the active transaction.
- **`UnitOfWork`** (from `@shared/infrastructure/prisma/`): wraps a lambda in a single Prisma transaction via AsyncLocalStorage — all `PrismaService` calls inside participate transparently. Use when a handler must touch two aggregates atomically.
- **Branded types for ids**: `TenantId`, `UserId`, `RoleId`, `PermissionId` (from `@shared/domain/types`). Cast raw strings at system boundaries (handlers, mappers) with the factory functions: `TenantId(str)`, `UserId(str)`. Repository interfaces use them to prevent parameter-order bugs.
- **Email is a Value Object** (`Email` in `@shared/domain/value-objects/`): normalizes to `trim().toLowerCase()` on construction. `user.email` getter returns a plain `string` — transparent to consumers. Mappers call `Email.from(raw)` when rehydrating from Prisma.
- **System roles per tenant**: `CreateTenantHandler` seeds ADMIN/MANAGER/USER roles (with their permissions) in the same transaction as the tenant creation — every new tenant starts ready to use. Platform super admins are **not** seeded here (they are the global `isPlatformAdmin` flag, not a tenant role).
- **Swagger must document the envelope**: annotate endpoints with `@ApiStandardResponse({ type: X })` / `@ApiPaginatedResponse(X)` (from `@shared/presentation/swagger/`) instead of raw `@ApiOkResponse`, so docs show the real `{success, data, message}` shape.
- **Response envelope is automatic**: controllers return plain data; `ResponseInterceptor` wraps it as `{success, data, message}` and `GlobalExceptionFilter` maps the exception hierarchy (`DomainException` 422 / `BusinessException` 400/404/409 / `InfrastructureException` 500 — all in `src/shared/exceptions/`) to `{success: false, message, code, timestamp, correlationId}`. Throw these typed exceptions instead of raw `HttpException`.

### Adding a new business module

1. Create `src/contexts/<context>/<module>/` with the four layers (new domain → new context folder + `<context>-context.module.ts`; import it in `AppModule`).
2. Model the aggregate extending `AggregateRoot`; emit domain events for every mutation; use `TenantId`/branded types in entity props and repository interface.
3. Define the repository port (interface + `Symbol`) in `domain/`, implement it with Prisma in `infrastructure/` (call `writeToOutbox(tx, events)` inside `save()`), bind with `{ provide: TOKEN, useClass: ... }`.
4. Structure `application/` as vertical slices (one folder per use case). Handlers call `pullDomainEvents()` before `save()` and pass the result as the second arg, then `eventBus.publishAll(events)`.
5. Add the entity to `prisma/schema.prisma` (UUID pk, `tenant_id`, `created_at/updated_at/deleted_at`, snake_case `@@map`), run `pnpm prisma:migrate` + `pnpm prisma:generate`.
6. Register the module's permissions in `prisma/seed.ts` and protect routes with `@Permissions(...)`.

## Project tooling

- `/new-module <context> <module>` — skill that scaffolds a new business module following the canonical `users` pattern (schema → 4 layers → wiring → permissions → tests).
- `arch-guardian` agent — read-only architecture review (cross-context imports, tenant isolation, soft delete, domain events, endpoint protection). Run it after implementing features in `src/contexts` or `src/platform`, before committing.

## Conventions

- Conventional Commits enforced via commitlint + husky; lint-staged runs eslint+prettier on staged files.
- ESLint uses type-checked rules; `esModuleInterop` is on, so use default imports (`import request from 'supertest'`, not `import * as`).
- Controllers declare versioning as `@Controller({ path: 'x', version: '1' })`; global prefix is `api` → routes are `/api/v1/...`.
