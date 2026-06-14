# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## SDD: rol leader (features nuevas)

Este repositorio usa **Spec Driven Development**. Para features marcadas con `"sdd": true`
en `feature_list.json`, actúas como el agente `leader` definido en `.claude/agents/leader.md`.

**Reglas duras:**

- ❌ No escribas código en `src/` sin spec aprobado por el humano.
- ❌ No saltes la fase de spec ni la puerta de aprobación humana (`spec_ready → in_progress`).
- ✅ Lanza subagentes vía `Agent` (`spec_author`, `implementer`, `reviewer`).
- ✅ Lee `AGENTS.md` al inicio de cualquier sesión de feature nueva.

**Protocolo de arranque:** Lee `AGENTS.md` → `feature_list.json` → `progress/current.md` → ejecuta `./init.sh`.

**Para iniciar una feature:** describe lo que quieres en lenguaje natural. Si no está en `feature_list.json`, el leader la agrega automáticamente antes de arrancar el flujo. No necesitas editar el JSON manualmente.

**No aplica:** preguntas de exploración, bug fixes pequeños, cambios en `docs/`/`progress/`/config.

---

## Project

Enterprise backend core (NestJS 11 + TypeScript strict + Prisma/PostgreSQL + Redis/BullMQ + Firebase Auth) — multi-tenant, RBAC + granular permissions, CQRS, event-driven. Package manager: **pnpm**.

## Commands

```bash
pnpm start:dev      # dev server (http://localhost:3000/api/v1, Swagger at /api/docs)
pnpm build          # nest build — also the fastest full type-check
pnpm lint           # eslint --fix  |  pnpm lint:check (no fix, used in CI)
pnpm test           # all unit tests  |  pnpm test:cov (coverage, 80% threshold)
pnpm test:e2e       # e2e — requires postgres+redis + valid .env
docker compose up -d postgres redis
pnpm prisma:migrate && pnpm prisma:generate && pnpm prisma:seed
```

## Architecture

Modular monolith organized by DDD bounded contexts:

- `src/contexts/` — business domains (`iam/`, `tenancy/`, `audit/`, `crm/`, `sales/`); each exposes a `*-context.module.ts` imported by `AppModule`.
- `src/platform/` — technical services (Redis cache, BullMQ jobs, outbox publisher, health).
- `src/shared/` — shared kernel: DDD base classes, exception hierarchy, `RequestContextStorage`, `PrismaService`, `UnitOfWork`.
- `src/config/` — typed configuration + Joi validation.

Path aliases: `@contexts/*`, `@platform/*`, `@shared/*`, `@config/*`.

**Dependency rules:** a context never imports another context's internals — integrate via EventBus or what the `*-context.module.ts` explicitly exports. `platform/` and `shared/` never depend on `contexts/`. Full module layout and "adding a module" steps → `docs/architecture.md`.

### Key mechanics (cross-file, non-obvious)

- **Write vs read paths differ on purpose**: command handlers go through the repository port and domain aggregate (emits events); query handlers bypass the domain and use `PrismaService` directly, returning read models.
- **Domain events → outbox → audit trail**: `repository.save(aggregate, events)` writes events atomically to `domain_event_outbox` in the same Prisma transaction. `OutboxPublisherProcessor` (BullMQ, every 10 s) writes audit logs. `EventBus.publishAll(events)` fires immediately in-process for low-latency handlers (cache invalidation). **Always** call `pullDomainEvents()` and pass the result to `repository.save()` — otherwise the audit trail is silently lost.
- **Outbox is the audit source of truth**: `DomainEventsAuditHandler` was removed; auditing happens exclusively via the outbox processor.
- **Request context is AsyncLocalStorage** (`RequestContextStorage`): `CorrelationIdMiddleware` initializes it; Firebase strategy stores `UserContext` there. No parameter threading needed.
- **Auth flow**: Firebase ID token → passport-custom strategy → `UserContextService` builds roles+permissions from PostgreSQL, cached in Redis 120 s. Invalidate with `userContextCacheKey(firebaseUid)` on any role/permission change.
- **Platform super admin vs tenant roles**: `isPlatformAdmin` flag on `User` = global operator, bypasses all guards, can cross tenants via `x-tenant-id` header. Never a per-tenant role. Gate platform-only routes with `@PlatformAdmin()` + `PlatformAdminGuard`. Inside a tenant, `ADMIN` is the top role — no cross-tenant reach.
- **No privilege escalation**: `assertCanGrantPermissions()` (from `@shared/authorization/`) must be called in any handler that lets a user assign roles or edit role permissions. System roles (`isSystem`) are immutable.
- **Global guard order**: `Throttler → FirebaseAuth → Tenant → Roles → Permissions → PlatformAdmin`. Routes are authenticated by default; opt out with `@Public()` (from `@shared/presentation/decorators/`). Use `@Permissions(Perm.x.y)` / `@Roles('ADMIN')` / `@PlatformAdmin()` to authorize.
- **Cross-tenant for platform admins**: use `@EffectiveTenantId()` (from `@shared/presentation/decorators/`) instead of `@CurrentUser('tenantId')` in controllers a platform admin may call across tenants.
- **Multi-tenancy in queries**: every business table has `tenant_id`; every query must filter by it **and** `deletedAt: null`. Soft-delete is mandatory — never hard-delete.
- **`PrismaService` is a tenant-aware facade**: proxies calls through `TenantClientResolver` for the tenant in `RequestContextStorage`. Inside `UnitOfWork.run()`, all calls use the active transaction transparently.
- **Branded types**: `TenantId`, `UserId`, `RoleId`, `PermissionId` (from `@shared/domain/types`). Cast raw strings at system boundaries (handlers, mappers) with factory functions. Never in domain internals.
- **Email is a Value Object** (`Email` from `@shared/domain/value-objects/`): normalizes on construction; getter returns plain `string`. Mappers call `Email.from(raw)` when rehydrating from Prisma.
- **Response envelope is automatic**: controllers return plain data; `ResponseInterceptor` wraps it as `{success, data, message}`. Throw `DomainException` (422) / `BusinessException` (400/404/409) / `InfrastructureException` (500) — never raw `HttpException`. Annotate with `@ApiStandardResponse` / `@ApiPaginatedResponse` (never raw `@ApiOkResponse`).

## Project tooling

- **SDD harness** — `AGENTS.md`, `feature_list.json`, `docs/`, `specs/`, `progress/`, `./init.sh`, `.claude/agents/` — see `AGENTS.md` for the full map.
- **`/new-module <context> <module>`** — scaffolds a new DDD module following the canonical `users` pattern.
- **`arch-guardian` agent** — read-only architecture review (cross-context imports, tenant isolation, soft-delete, domain events, endpoint protection). Run after implementing features in `src/contexts` or `src/platform`, before committing.

## Conventions

- Conventional Commits enforced via commitlint + husky; lint-staged runs eslint+prettier on staged files.
- ESLint uses type-checked rules; `esModuleInterop` is on → use default imports (`import request from 'supertest'`, not `import * as`).
- Controllers: `@Controller({ path: 'x', version: '1' })` → routes are `/api/v1/...`.
