# Backend Bear — Enterprise Backend Core

Backend Core empresarial listo para producción, diseñado como base para múltiples sistemas y módulos futuros (ERP, CRM, RRHH, Inventario, Compras, Ventas, Finanzas, etc.).

## Stack

| Capa          | Tecnología                                         |
| ------------- | -------------------------------------------------- |
| Framework     | NestJS 11 + TypeScript (strict)                    |
| Base de datos | PostgreSQL + Prisma ORM                            |
| Cache / Colas | Redis (ioredis) + BullMQ                           |
| Autenticación | Firebase Authentication (Admin SDK) + Passport     |
| Documentación | Swagger / OpenAPI (`/api/docs`)                    |
| Logging       | NestJS Pino (JSON estructurado + correlation id)   |
| Testing       | Jest + Supertest (cobertura mínima 80%)            |
| DevOps        | Docker multi-stage, Docker Compose, GitHub Actions |
| Calidad       | ESLint, Prettier, Husky, lint-staged, Commitlint   |

## Arquitectura

Monolito modular con **DDD + CQRS + Clean Architecture / Hexagonal**, organizado en **Bounded Contexts** y preparado para extraer microservicios en el futuro.

```text
src/
├── contexts/                  # Bounded contexts (dominio de negocio)
│   ├── iam/                   # Identity & Access Management
│   │   ├── auth/              # JWT Firebase, UserContext, guards, decoradores
│   │   ├── users/             # CRUD de usuarios + asignación de roles (ejemplar CQRS)
│   │   ├── roles/             # Gestión de roles y sus permisos (RBAC)
│   │   ├── permissions/       # Catálogo de permisos (cacheado en Redis)
│   │   └── iam-context.module.ts
│   ├── tenancy/               # Ciclo de vida de tenants (solo platform admin, @PlatformAdmin())
│   └── audit/                 # Consulta de audit_logs (la escritura vive en platform/outbox)
├── platform/                  # Servicios técnicos (no son bounded contexts)
│   ├── cache/                 # CacheService (cache-aside, invalidación por patrón)
│   ├── jobs/                  # BullMQ: emails, notifications, reports, integrations
│   ├── outbox/                # Outbox transaccional → audit trail (fuente de verdad)
│   ├── health/                # /health, /health/live, /health/ready (Terminus)
│   └── platform.module.ts
├── shared/                    # Shared kernel: bases DDD, excepciones, ALS, filtros
└── config/                    # Configuración tipada + validación Joi
```

Cada módulo dentro de un contexto sigue las 4 capas, con `application/`
organizado en **slices verticales** (una carpeta por caso de uso):

```text
module/
├── application/     # Un folder por caso de uso (slice vertical):
│   ├── create-user/         # create-user.command.ts + .handler.ts + .handler.spec.ts
│   ├── get-users/           # get-users.query.ts + .handler.ts
│   ├── on-user-mutated/     # event handlers agrupados por trigger (ej. invalidar cache)
│   └── user.read-model.ts   # read model compartido (interface + toXReadModel)
├── domain/          # Aggregates, Entities, Value Objects, Domain Events, Repository ports
├── infrastructure/  # Prisma repositories, mappers (write-path), providers externos
└── presentation/    # Controllers, DTOs, Guards, Decorators
```

> **Write vs read paths** difieren a propósito: los command handlers pasan por el
> puerto del repositorio y el agregado de dominio (que emite eventos); los query
> handlers bypassean el dominio y usan `PrismaService` directo, devolviendo read
> models.

Reglas de dependencia entre contextos:

- Un contexto **no importa internals** de otro: la integración es vía domain events (EventBus) o los módulos exportados por `*-context.module.ts`.
- `platform/` y `shared/` no dependen jamás de `contexts/`.
- Path aliases: `@contexts/*`, `@platform/*`, `@shared/*`, `@config/*`.

Principios aplicados: SOLID, Event-Driven (EventBus de `@nestjs/cqrs`, contratos de eventos listos para Kafka/RabbitMQ/NATS), inversión de dependencias mediante puertos (`USER_REPOSITORY`, `ROLE_REPOSITORY`).

### Bloques clave (shared kernel / platform)

- **Outbox transaccional** (`platform/outbox`) — fuente de verdad del audit trail (ver [Auditoría](#auditoría)).
- **Branded types** para ids (`TenantId`, `UserId`, `RoleId`, `PermissionId` en `@shared/domain/types`) — previenen bugs de orden de parámetros; se castean en los bordes con las factory functions.
- **`Email` value object** (`@shared/domain/value-objects`) — normaliza a `trim().toLowerCase()`; el getter devuelve `string` plano.
- **`PrismaService` tenant-aware facade** — proxya cada llamada al cliente que resuelve `TenantClientResolver` para el tenant del request (hoy DB compartida; migrar a schema/DB por tenant no toca los call sites).
- **`UnitOfWork`** (`@shared/infrastructure/prisma`) — envuelve un lambda en una sola transacción Prisma vía ALS; úsalo cuando un handler debe tocar dos agregados atómicamente.
- **`@PlatformAdmin()` + `PlatformAdminGuard`**, **`@EffectiveTenantId()`**, y los decoradores Swagger `@ApiStandardResponse` / `@ApiPaginatedResponse` (documentan el envelope real `{success, data, message}`).

## Flujo de autenticación

1. El frontend se autentica contra Firebase y obtiene un ID token (JWT).
2. Envía `Authorization: Bearer <token>` al backend.
3. `FirebaseJwtStrategy` valida el token con Firebase Admin SDK.
4. `UserContextService` construye el `UserContext` (usuario + roles + permisos) desde PostgreSQL, con cache en Redis (TTL 120s).
5. Guards globales aplican, en orden: **Throttler → FirebaseAuth → Tenant → Roles → Permissions → PlatformAdmin**.

> El usuario debe existir en la tabla `users` (vinculado por `firebase_uid`).
> Un **platform super admin** —operador global identificado por el flag
> `User.isPlatformAdmin` (lo asigna únicamente `scripts/bootstrap-super-admin.ts`)—
> bypassea las verificaciones de rol/permiso y puede operar cross-tenant enviando
> el header `x-tenant-id`. **No es un rol per-tenant.**

## Multi-tenant

- Todas las entidades de negocio llevan `tenant_id`.
- `TenantMiddleware` captura `x-tenant-id`; `TenantGuard` impide acceso cross-tenant a quien no sea platform admin.
- El tenant efectivo vive en `RequestContextStorage` (AsyncLocalStorage), accesible desde cualquier capa.
- En controllers que un platform admin pueda llamar cross-tenant, usar `@EffectiveTenantId()` (devuelve el tenant del header `x-tenant-id` para platform admins, y el tenant propio para el resto) en vez de `@CurrentUser('tenantId')`.

## Convenciones de API

- Versionado: `/api/v1/...`
- Respuesta exitosa: `{ "success": true, "data": {...}, "message": "..." }`
- Respuesta de error: `{ "success": false, "message": "...", "code": "...", "timestamp": "...", "correlationId": "..." }`
- Trazabilidad: header `x-request-id` (se genera si no se envía y se devuelve siempre).
- Soft delete obligatorio (`deleted_at`); ninguna query devuelve registros borrados.

## Puesta en marcha

```bash
# 1. Dependencias
pnpm install

# 2. Variables de entorno
cp .env.sample .env   # completar credenciales de Firebase

# 3. Infraestructura local (PostgreSQL + Redis)
docker compose up -d postgres redis

# 4. Base de datos
pnpm prisma:migrate     # aplica migraciones
pnpm prisma:seed        # tenant default, permisos y roles del sistema

# 5. Primer platform super admin (one-time, tras el seed)
FIREBASE_UID=<uid> EMAIL=<email> FIRST_NAME=Admin LAST_NAME=User \
  npx ts-node -r tsconfig-paths/register scripts/bootstrap-super-admin.ts

# 6. Desarrollo
pnpm start:dev          # http://localhost:3000/api/v1 — docs en /api/docs
```

### Stack completo con Docker

```bash
docker compose up -d --build
```

## Scripts

| Script                                                  | Descripción                                              |
| ------------------------------------------------------- | -------------------------------------------------------- |
| `pnpm start:dev`                                        | Desarrollo con hot-reload                                |
| `pnpm build` / `pnpm start:prod`                        | Build y arranque de producción                           |
| `pnpm test` / `pnpm test:cov` / `pnpm test:e2e`         | Tests unitarios / cobertura / e2e (requiere infra local) |
| `pnpm lint` / `pnpm format`                             | Calidad de código                                        |
| `pnpm prisma:migrate` / `prisma:seed` / `prisma:studio` | Base de datos                                            |

## Seguridad

- Helmet, CORS configurable (`CORS_ORIGIN`), rate limiting (`@nestjs/throttler`).
- `ValidationPipe` global con `whitelist` + `forbidNonWhitelisted` (sanitización de entrada).
- Headers sensibles redactados en logs (`authorization`, `cookie`).
- RBAC + permisos granulares (`users.create`, `roles.update`, ...). Roles del sistema (per-tenant): `ADMIN`, `MANAGER`, `USER`. `ADMIN` es el rol tope del tenant (recibe todos los permisos del tenant **excepto** `tenants.*`). El **platform super admin** es global (flag `isPlatformAdmin`), no un rol.
- **Sin escalada de privilegios**: un no-platform-admin nunca puede otorgar autoridad que no posee. `assertCanGrantPermissions()` (de `@shared/authorization`) lo aplica en los handlers de asignar roles y editar permisos de un rol. Los roles `isSystem` son inmutables.

## Auditoría

La auditoría usa un **outbox transaccional** (fuente de verdad, nunca pierde entradas):

1. Tras `repository.save(aggregate, events)`, los domain events se escriben en `domain_event_outbox` **en la misma transacción** del DB.
2. `OutboxPublisherProcessor` (BullMQ, cada 10s) drena las entradas no publicadas y escribe en `audit_logs` vía `AuditLogService` (en `platform/outbox/`).
3. En paralelo, el `EventBus` in-process despacha de inmediato a los handlers de baja latencia (ej. invalidación de cache).

Cada entrada guarda: usuario, acción, entidad, valores nuevos, IP, user agent y correlation id (el contexto del actor se captura al escribir el outbox, dentro del request). Consulta vía `GET /api/v1/audit-logs` (permiso `audit-logs.read`).

## Observabilidad

- Logs JSON estructurados (Pino) con `correlationId` y `tenantId` en cada línea.
- Health checks listos para Kubernetes (`/health/live`, `/health/ready`).
- Preparado para OpenTelemetry/Prometheus: añadir `@opentelemetry/auto-instrumentations-node` y un endpoint `/metrics` sin tocar la arquitectura.

## Extender el core (nuevo bounded context de negocio)

1. Crear `src/contexts/<contexto>/<modulo>` con las 4 capas y un `<contexto>-context.module.ts` agregador (ej. `contexts/inventory/products/`).
2. Modelar el agregado extendiendo `AggregateRoot`, emitir domain events en cada mutación y usar **branded types** (`TenantId`, `UserId`, …) en props y puertos.
3. Definir el puerto del repositorio (interfaz + `Symbol`) en `domain/` e implementarlo con Prisma en `infrastructure/`; el `save()` llama a `writeToOutbox(tx, events)` dentro de su transacción.
4. Estructurar `application/` en **slices verticales** (una carpeta por caso de uso); cada handler hace `pullDomainEvents()` **antes** de `save()`, lo pasa como 2º arg y luego `eventBus.publishAll(events)`. Controller + DTOs en `presentation/`: proteger rutas con `@Permissions(Perm.x.y)` (gatear rutas platform-only con `@PlatformAdmin()`), resolver tenant con `@EffectiveTenantId()` y documentar respuestas con `@ApiStandardResponse`/`@ApiPaginatedResponse`.
5. Registrar permisos del módulo en `prisma/seed.ts` (usando `Perm`) y proteger rutas con `@Permissions(...)`. Si el módulo asigna roles o edita permisos, llamar `assertCanGrantPermissions()`.
6. Importar el `*-context.module.ts` en `AppModule`. Para integrarse con otros contextos, suscribirse a sus domain events — nunca importar sus internals.

> Atajo: el skill `/new-module <contexto> <modulo>` scaffoldea todo este patrón a partir del módulo `users` como plantilla canónica.

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`): install → prisma generate → lint → test → build → docker build (en `main`). El paso de deploy queda parametrizado por entorno (ECS, Cloud Run, K8s...).
