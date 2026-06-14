# Convenciones de backend-bear

## Commits

Conventional Commits, enforced via commitlint + husky.
Formato: `type(scope): descripción`
Tipos válidos: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`.

## TypeScript

- Modo `strict` activado. No `any` sin justificación.
- `esModuleInterop: true` — usar default imports: `import request from 'supertest'`, nunca `import * as`.
- Path aliases: `@contexts/*`, `@platform/*`, `@shared/*`, `@config/*` — usar siempre, nunca rutas relativas largas.
- Tipos branded para IDs: `TenantId(str)`, `UserId(str)` etc. Castear en handlers y mappers, nunca en domain.

## Naming

- Archivos: `kebab-case.ts` (ej. `create-user.handler.ts`).
- Clases: `PascalCase`.
- Módulos NestJS: `XxxModule`.
- Símbolos de repositorio: `REPOSITORY_TOKEN` en el mismo archivo del interface.
- Domain events: `XxxCreatedEvent`, `XxxUpdatedEvent`, `XxxDeletedEvent`.
- Commands: `CreateXxxCommand`, `UpdateXxxCommand`, `DeleteXxxCommand`.
- Queries: `GetXxxQuery`, `ListXxxsQuery`.

## Estructura de controllers

```typescript
@Controller({ path: 'resource-name', version: '1' })
// → /api/v1/resource-name
```

Global prefix es `api`. Versión siempre declarada en el controller.

## DTOs y Swagger

- DTOs de entrada: `CreateXxxDto`, `UpdateXxxDto`, usando `class-validator`.
- `@ApiStandardResponse({ type: XxxReadModel })` para respuestas únicas.
- `@ApiPaginatedResponse(XxxReadModel)` para listas.
- Nunca usar `@ApiOkResponse` directo — siempre los wrappers del proyecto.

## Manejo de errores

- No lanzar `HttpException` crudo. Usar la jerarquía de excepciones:
  - `DomainException` → 422 (invariante de dominio violado)
  - `BusinessException` → 400/404/409 (lógica de negocio)
  - `InfrastructureException` → 500 (fallo técnico inesperado)
- `GlobalExceptionFilter` mapea estas excepciones al envelope `{success: false, message, code, timestamp, correlationId}`.

## Tests

- Spec junto al handler: `create-user.handler.spec.ts` vive en la misma carpeta que `create-user.handler.ts`.
- Comando handlers: mock del repositorio port + mock del EventBus.
- Query handlers: mock de `PrismaService`.
- No mockear lo que Prisma hace — probar el handler, no la infraestructura.
- Cobertura mínima global: 80%.
- Ejecutar tests: `pnpm test` (todos) | `pnpm test -- path/to/file.spec.ts` (uno) | `pnpm test -- -t "nombre"` (por nombre).

## Lint

- ESLint con reglas type-checked.
- `pnpm lint` → fix automático.
- `pnpm lint:check` → solo verificación (usado en CI y en `init.sh`).
- staged files pasan por lint-staged automáticamente en el pre-commit hook.

## Email (Value Object)

`Email` de `@shared/domain/value-objects/` normaliza con `trim().toLowerCase()`.
Mappers llaman `Email.from(raw)` al rehidratar desde Prisma.

## Soft delete

Nunca usar `DELETE` en Prisma. Siempre `update({ data: { deletedAt: new Date() } })`.
Toda query debe incluir `deletedAt: null` en el filtro.

## Módulo de permisos

Registrar permisos en `prisma/seed.ts` usando el catálogo.
Proteger endpoints con `@Permissions(Perm.context.action)` importando `Perm` de `@shared/authorization/permissions`.
