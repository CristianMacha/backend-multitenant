# Arquitectura de backend-bear

> Referencia rápida para agentes. Para detalles completos leer `CLAUDE.md`.

## Stack

NestJS 11 · TypeScript strict · Prisma/PostgreSQL · Redis/BullMQ · Firebase Auth · pnpm

## Estructura de carpetas

```
src/
├── contexts/   # Dominios de negocio (un contexto = un bounded context)
│   ├── iam/    # auth, users, roles, permissions
│   ├── tenancy/
│   ├── audit/
│   ├── crm/
│   └── sales/
├── platform/   # Servicios técnicos (cache, jobs, outbox, health)
├── shared/     # Kernel compartido (base classes, excepciones, PrismaService, UnitOfWork)
└── config/     # Configuración tipada + validación Joi
```

## Reglas de dependencia

- Un contexto **nunca** importa internals de otro contexto. Solo lo que el
  `*-context.module.ts` exporta explícitamente, o vía EventBus.
- `platform/` y `shared/` **nunca** dependen de `contexts/`.
- Path aliases: `@contexts/*`, `@platform/*`, `@shared/*`, `@config/*`.

## Capas de cada módulo (obligatorio, sin excepción)

```
<module>/
├── domain/          # AggregateRoot, domain events, repository port (interface + Symbol)
├── application/     # Vertical slices — un folder por caso de uso
│   ├── create-x/
│   │   ├── create-x.command.ts
│   │   ├── create-x.handler.ts
│   │   └── create-x.handler.spec.ts   ← spec junto al handler
│   └── get-xs/
│       ├── get-xs.query.ts
│       └── get-xs.handler.ts
├── infrastructure/  # Implementaciones Prisma, mappers (Prisma ↔ domain)
└── presentation/    # Controllers, DTOs, guards, decorators
```

## Ruta de escritura vs. lectura

- **Comando**: handler → repositorio port → agregado (emite eventos) → `repository.save(aggregate, events)`.
- **Query**: handler → `PrismaService` directamente (sin repositorio, sin agregado) → read model.
- Los mappers (`*.mapper.ts`) son solo para la ruta de escritura.
- Las funciones `toXReadModel` viven en `application/` junto a los query handlers.

## Domain events → Outbox → Auditoría

1. El agregado emite eventos con `apply(new XEvent(...))`.
2. El handler llama `aggregate.pullDomainEvents()` y los pasa a `repository.save(agg, events)`.
3. La implementación del repositorio llama `writeToOutbox(tx, events)` dentro de la misma transacción Prisma.
4. `OutboxPublisherProcessor` (BullMQ, cada 10 s) escribe los audit logs.
5. `EventBus.publishAll(events)` se llama inmediatamente para handlers en-proceso (ej. invalidar caché).

**Regla**: si no se llama `writeToOutbox`, la auditoría se pierde silenciosamente.

## Auth y contexto de request

- Firebase ID token → estrategia passport-custom → `UserContextService` builds roles+permisos desde PostgreSQL, cacheado en Redis 120 s.
- `RequestContextStorage` (AsyncLocalStorage): `CorrelationIdMiddleware` lo inicializa; la estrategia Firebase guarda `UserContext`.
- Clave de caché: `userContextCacheKey(firebaseUid)` — invalidar en cambios de roles/permisos.

## Guards globales (orden)

`Throttler → FirebaseAuth → Tenant → Roles → Permissions → PlatformAdmin`

- Rutas públicas: `@Public()` de `@shared/presentation/decorators/`.
- Autorización: `@Permissions(Perm.x.y)` / `@Roles('ADMIN')` / `@PlatformAdmin()`.

## Multi-tenancy

- Toda tabla de negocio tiene `tenant_id`. Toda query **debe** filtrar por él y por `deletedAt: null`.
- `PrismaService` es una fachada tenant-aware (usa `TenantClientResolver`).
- Soft-delete es obligatorio. Nunca `DELETE` real.

## Platform super admin vs. roles de tenant

- `isPlatformAdmin` (flag en `User`): operador global, bypasea role/permission checks, puede cruzar tenants via `x-tenant-id`.
- `ADMIN` dentro de un tenant: rol más alto, no tiene alcance cross-tenant.
- Rutas solo de plataforma: `@PlatformAdmin()` + `PlatformAdminGuard`.
- Usar `@EffectiveTenantId()` en controllers que un platform admin puede llamar cross-tenant.

## Seguridad en gestión de roles

`assertCanGrantPermissions()` de `@shared/authorization/` debe llamarse en cualquier handler
que permita asignar roles o editar permisos de rol. Roles de sistema (`isSystem`) son inmutables.

## Tipos branded

`TenantId`, `UserId`, `RoleId`, `PermissionId` de `@shared/domain/types`.
Castear strings crudos en handlers y mappers con las factory functions.

## UnitOfWork

`UnitOfWork.run(lambda)` — todas las llamadas a `PrismaService` dentro participan en la misma transacción Prisma.

## Swagger

- `@ApiStandardResponse({ type: X })` para respuestas únicas.
- `@ApiPaginatedResponse(X)` para listas paginadas.
- El `ResponseInterceptor` wrappea la respuesta en `{success, data, message}` automáticamente.

## Pasos para añadir un módulo nuevo

1. Crear `src/contexts/<context>/<module>/` con las 4 capas.
2. Modelar el agregado extendiendo `AggregateRoot`; emitir domain events en cada mutación.
3. Definir el repository port (interface + Symbol) en `domain/`; implementar en `infrastructure/`.
4. Estructurar `application/` como vertical slices. Handlers: `pullDomainEvents()` → `save()` → `eventBus.publishAll()`.
5. Añadir entidad a `prisma/schema.prisma` (UUID pk, `tenant_id`, `created_at/updated_at/deleted_at`, snake_case `@@map`).
6. Ejecutar `pnpm prisma:migrate` + `pnpm prisma:generate`.
7. Registrar permisos en `prisma/seed.ts` y proteger rutas con `@Permissions(...)`.
8. Importar el módulo en el `*-context.module.ts` correspondiente y ese en `AppModule`.
