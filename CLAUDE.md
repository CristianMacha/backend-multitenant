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
```

Local setup requires `cp .env.sample .env` with real Firebase service-account credentials; env vars are validated with Joi at boot ([src/config/env.validation.ts](src/config/env.validation.ts)) and the app refuses to start if any required one is missing.

## Architecture

Modular monolith organized by **DDD bounded contexts**:

- `src/contexts/` — business domains, one folder per bounded context, each exposing a single `*-context.module.ts` aggregator that `AppModule` imports:
  - `iam/` (auth, users, roles, permissions), `tenancy/` (tenants), `audit/` (audit-logs)
- `src/platform/` — technical services, not domain: cache (Redis), jobs (BullMQ), health (Terminus). Aggregated by `platform.module.ts`.
- `src/shared/` — shared kernel: DDD base classes, exception hierarchy, AsyncLocalStorage request context, global filter/interceptor/middleware, PrismaService.
- `src/config/` — typed configuration + Joi validation.

Path aliases (tsconfig + jest moduleNameMapper in package.json + test/jest-e2e.json — keep all three in sync): `@contexts/*`, `@platform/*`, `@shared/*`, `@config/*`.

**Dependency rules:** a context never imports another context's internals — integrate via domain events on the CQRS EventBus or via what the other `*-context.module.ts` exports. `platform/` and `shared/` never depend on `contexts/`.

Each module inside a context follows four layers:

```text
module/
├── domain/          # aggregates (extend AggregateRoot), domain events, repository ports (interface + Symbol token)
├── application/     # commands/queries (extend Command<T>/Query<T> from @nestjs/cqrs), handlers, event-handlers, read models
├── infrastructure/  # Prisma repository implementations, mappers, external providers
└── presentation/    # controllers, DTOs, guards, decorators
```

**The `users` module is the canonical example** — copy its layout for new modules. Roles/tenants use a compact variant (commands/queries/handlers grouped per file), which is acceptable for small modules.

### Key mechanics (cross-file, non-obvious)

- **Write vs read paths differ on purpose**: command handlers go through the repository port and domain aggregate (which emits events); query handlers bypass the domain and use PrismaService directly, returning read models.
- **Domain events drive side effects**: handlers call `user.pullDomainEvents()` after `repository.save()` and publish via `eventBus.publishAll()`. The audit context (`DomainEventsAuditHandler`) and cache invalidation (`InvalidateUserCacheHandler`) subscribe to these. When adding mutations, emit an event from the aggregate — the audit trail depends on it.
- **Request context is AsyncLocalStorage** (`RequestContextStorage` in `src/shared/context/`): `CorrelationIdMiddleware` initializes it, the Firebase strategy stores the authenticated `UserContext` there, and any layer (audit, logging) reads it without parameter threading.
- **Auth flow**: Firebase ID token → passport-custom strategy verifies it → `UserContextService` builds roles+permissions from PostgreSQL, cached in Redis for 120s. Anything that changes a user's roles/permissions must invalidate that cache (key helper: `userContextCacheKey(firebaseUid)`).
- **Global guard order** (registered in `AppModule`): Throttler → FirebaseAuth → Tenant → Roles → Permissions. Routes are authenticated by default; opt out with `@Public()`. Authorize with `@Permissions('users.create')` / `@Roles('ADMIN')`. `SUPER_ADMIN` bypasses role/permission checks and may cross tenants via the `x-tenant-id` header.
- **Multi-tenancy is enforced in queries, not the DB**: every business table has `tenant_id`; repositories and query handlers must always filter by it (and by `deletedAt: null` — soft delete is mandatory, never hard-delete).
- **Response envelope is automatic**: controllers return plain data; `ResponseInterceptor` wraps it as `{success, data, message}` and `GlobalExceptionFilter` maps the exception hierarchy (`DomainException` 422 / `BusinessException` 400/404/409 / `InfrastructureException` 500 — all in `src/shared/exceptions/`) to `{success: false, message, code, timestamp, correlationId}`. Throw these typed exceptions instead of raw `HttpException`.

### Adding a new business module

1. Create `src/contexts/<context>/<module>/` with the four layers (new domain → new context folder + `<context>-context.module.ts`; import it in `AppModule`).
2. Model the aggregate extending `AggregateRoot`, emit domain events for every mutation.
3. Define the repository port (interface + `Symbol`) in `domain/`, implement it with Prisma in `infrastructure/`, bind with `{ provide: TOKEN, useClass: ... }`.
4. Add the entity to `prisma/schema.prisma` (UUID pk, `tenant_id`, `created_at/updated_at/deleted_at`, snake_case `@@map`), run `pnpm prisma:migrate`.
5. Register the module's permissions in `prisma/seed.ts` and protect routes with `@Permissions(...)`.

## Project tooling

- `/new-module <context> <module>` — skill that scaffolds a new business module following the canonical `users` pattern (schema → 4 layers → wiring → permissions → tests).
- `arch-guardian` agent — read-only architecture review (cross-context imports, tenant isolation, soft delete, domain events, endpoint protection). Run it after implementing features in `src/contexts` or `src/platform`, before committing.

## Conventions

- Conventional Commits enforced via commitlint + husky; lint-staged runs eslint+prettier on staged files.
- ESLint uses type-checked rules; `esModuleInterop` is on, so use default imports (`import request from 'supertest'`, not `import * as`).
- Controllers declare versioning as `@Controller({ path: 'x', version: '1' })`; global prefix is `api` → routes are `/api/v1/...`.
