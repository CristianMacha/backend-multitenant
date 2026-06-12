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
│   ├── tenancy/               # Ciclo de vida de tenants (solo SUPER_ADMIN)
│   └── audit/                 # Auditoría automática vía domain events
├── platform/                  # Servicios técnicos (no son bounded contexts)
│   ├── cache/                 # CacheService (cache-aside, invalidación por patrón)
│   ├── jobs/                  # BullMQ: emails, notifications, reports, integrations
│   ├── health/                # /health, /health/live, /health/ready (Terminus)
│   └── platform.module.ts
├── shared/                    # Shared kernel: bases DDD, excepciones, ALS, filtros
└── config/                    # Configuración tipada + validación Joi
```

Cada módulo dentro de un contexto sigue las 4 capas:

```text
module/
├── application/     # Commands, Queries, Handlers, Event Handlers, Read Models
├── domain/          # Aggregates, Entities, Value Objects, Domain Events, Repository ports
├── infrastructure/  # Prisma repositories, mappers, providers externos
└── presentation/    # Controllers, DTOs, Guards, Decorators
```

Reglas de dependencia entre contextos:

- Un contexto **no importa internals** de otro: la integración es vía domain events (EventBus) o los módulos exportados por `*-context.module.ts`.
- `platform/` y `shared/` no dependen jamás de `contexts/`.
- Path aliases: `@contexts/*`, `@platform/*`, `@shared/*`, `@config/*`.

Principios aplicados: SOLID, Event-Driven (EventBus de `@nestjs/cqrs`, contratos de eventos listos para Kafka/RabbitMQ/NATS), inversión de dependencias mediante puertos (`USER_REPOSITORY`, `ROLE_REPOSITORY`).

## Flujo de autenticación

1. El frontend se autentica contra Firebase y obtiene un ID token (JWT).
2. Envía `Authorization: Bearer <token>` al backend.
3. `FirebaseJwtStrategy` valida el token con Firebase Admin SDK.
4. `UserContextService` construye el `UserContext` (usuario + roles + permisos) desde PostgreSQL, con cache en Redis (TTL 120s).
5. Guards globales aplican, en orden: throttling → autenticación → aislamiento de tenant → roles → permisos.

> El usuario debe existir en la tabla `users` (vinculado por `firebase_uid`). `SUPER_ADMIN` puede operar cross-tenant enviando el header `x-tenant-id`.

## Multi-tenant

- Todas las entidades de negocio llevan `tenant_id`.
- `TenantMiddleware` captura `x-tenant-id`; `TenantGuard` impide acceso cross-tenant a usuarios no SUPER_ADMIN.
- El tenant efectivo vive en `RequestContextStorage` (AsyncLocalStorage), accesible desde cualquier capa.

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

# 5. Desarrollo
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
- RBAC + permisos granulares (`users.create`, `roles.update`, ...). Roles del sistema: `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `USER`.

## Auditoría

Cada domain event publicado (creación/actualización/borrado de usuarios y roles, asignación de roles) se persiste en `audit_logs` con: usuario, acción, entidad, valores nuevos, IP, user agent y correlation id. Consulta vía `GET /api/v1/audit-logs` (permiso `audit-logs.read`).

## Observabilidad

- Logs JSON estructurados (Pino) con `correlationId` y `tenantId` en cada línea.
- Health checks listos para Kubernetes (`/health/live`, `/health/ready`).
- Preparado para OpenTelemetry/Prometheus: añadir `@opentelemetry/auto-instrumentations-node` y un endpoint `/metrics` sin tocar la arquitectura.

## Extender el core (nuevo bounded context de negocio)

1. Crear `src/contexts/<contexto>/<modulo>` con las 4 capas y un `<contexto>-context.module.ts` agregador (ej. `contexts/inventory/products/`).
2. Modelar el agregado extendiendo `AggregateRoot` y emitir domain events.
3. Definir el puerto del repositorio (interfaz + `Symbol`) en `domain/` e implementarlo con Prisma en `infrastructure/`.
4. Commands/Queries/Handlers en `application/`; controller + DTOs en `presentation/`.
5. Registrar permisos del módulo en `prisma/seed.ts` y proteger rutas con `@Permissions(...)`.
6. Importar el `*-context.module.ts` en `AppModule`. Para integrarse con otros contextos, suscribirse a sus domain events — nunca importar sus internals.

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`): install → prisma generate → lint → test → build → docker build (en `main`). El paso de deploy queda parametrizado por entorno (ECS, Cloud Run, K8s...).
