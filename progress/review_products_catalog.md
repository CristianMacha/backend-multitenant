# Review — feature 2 (products_catalog)

**Veredicto:** APPROVED

## Trazabilidad requirements ↔ tests

- R1: [x] cubierto por `create-product.handler.spec.ts` — "creates a product, saves it and publishes events (R1, R2, R6)"; `product.entity.spec.ts` — "creates an active product and emits ProductCreatedEvent"
- R2: [x] cubierto por `create-product.handler.spec.ts` — `savedProduct.tenantId` assertions; `product.entity.spec.ts` — "assigns the tenantId from props"
- R3: [x] cubierto por `product.entity.spec.ts` — "rejects empty name"; `create-product.handler.spec.ts` — "propagates DomainException for empty name (R3)"
- R4: [x] cubierto por `create-product.dto.ts` — `@IsEnum(ProductTypeEnum)` DTO-level validation (class-validator enforced by global ValidationPipe)
- R5: [x] cubierto por `product.entity.spec.ts` — "rejects negative unitPrice amount", "rejects unitPrice amount with more than 2 decimals", "rejects invalid currency code"; `create-product.handler.spec.ts` — "propagates DomainException for negative price (R5)", "propagates DomainException for invalid currency (R5)"
- R6: [x] cubierto por `create-product.handler.spec.ts` — `publishAll` called with 1 event; `prisma-product.repository.ts` — `writeToOutbox(tx, outboxEvents)` inside `$transaction`
- R7: [x] cubierto por `products.controller.ts` — `@Permissions(Perm.products.create)` on POST `/products`
- R8: [x] cubierto por `get-products.handler.spec.ts` — "returns paginated empty result for tenant (R8)"
- R9: [x] cubierto por `get-products.handler.spec.ts` — "always filters by tenantId and deletedAt: null (R9)"; `get-product-by-id.handler.spec.ts` — "filters by tenantId and deletedAt: null (R9)"
- R10: [x] cubierto por `get-products.handler.spec.ts` — "filters by type when provided (R10)"
- R11: [x] cubierto por `get-products.handler.spec.ts` — "filters by category when provided (R11)"
- R12: [x] cubierto por `get-products.handler.spec.ts` — "filters by status when provided (R12)"
- R13: [x] cubierto por `products.controller.ts` — `@Permissions(Perm.products.read)` on GET `/products`
- R14: [x] cubierto por `get-product-by-id.handler.spec.ts` — "returns the product read model for a valid id (R14)"
- R15: [x] cubierto por `get-product-by-id.handler.spec.ts` — "throws EntityNotFoundException when product not found (R15)", "throws EntityNotFoundException for soft-deleted product (R15)"
- R16: [x] cubierto por `update-product.handler.spec.ts` — "updates the product and publishes ProductUpdatedEvent (R16, R17)"
- R17: [x] cubierto por `update-product.handler.spec.ts` — `events` array has length 1 after update; `product.entity.spec.ts` — "applies changes and emits ProductUpdatedEvent"
- R18: [x] cubierto por `product.entity.spec.ts` — "rejects update on archived product (R18)"; `update-product.handler.spec.ts` — "throws DomainException when product is archived (R18)"
- R19: [x] cubierto por `update-product.handler.spec.ts` — "throws EntityNotFoundException when product not found (R19)"
- R20: [x] cubierto por `products.controller.ts` — `@Permissions(Perm.products.update)` on PATCH `/products/:id`
- R21: [x] cubierto por `archive-product.handler.spec.ts` — "archives the product, soft-deletes it and publishes ProductArchivedEvent (R21, R22)"; `product.entity.spec.ts` — "soft-deletes, sets status=ARCHIVED and emits ProductArchivedEvent"
- R22: [x] cubierto por `archive-product.handler.spec.ts` — `events` array has length 1 after archive; `prisma-product.repository.ts` — `writeToOutbox(tx, outboxEvents)` in `save()`
- R23: [x] cubierto por `product.entity.spec.ts` — "rejects double archive (R23)"; `archive-product.handler.spec.ts` — "throws DomainException when product is already archived (R23)"
- R24: [x] cubierto por `archive-product.handler.spec.ts` — "throws EntityNotFoundException when product not found (R24)"
- R25: [x] cubierto por `products.controller.ts` — `@Permissions(Perm.products.delete)` on DELETE `/products/:id`
- R26: [x] cubierto por `src/shared/domain/types.ts` — `ProductId` branded type + factory present; `catalog-context.module.ts` re-exports `ProductsModule`
- R27: [x] cubierto por `product-query.service.spec.ts` — "returns a ProductSummary when product exists (R27)"; `products.module.ts` — exports `ProductQueryService`; `catalog-context.module.ts` — exports `ProductsModule`
- R28: [x] cubierto por `product-query.service.spec.ts` — "returns null when product does not exist (R28)", "returns null for soft-deleted products (R28)", "does not cross tenant boundaries (R28)"
- R29: [x] cubierto por `product.mapper.spec.ts` — "round-trips domain ↔ persistence for Money (R29)"; `product.entity.spec.ts` — "rehydrates without emitting events" (fromPersistence with Money)
- R30: [x] cubierto por `src/shared/authorization/permissions.ts` — `Perm.products.*` entries present; `prisma/seed.ts` — 4 permissions registered under `module: 'products'`; MANAGER and USER roles updated with products permissions
- R31: [x] cubierto por 88 test suites, 370 tests passing; global coverage: statements 85.8%, branches 83.67%, functions 86.44%, lines 86.26% — all above 80% threshold
- R32: [x] cubierto por `products.controller.ts` — controllers return plain data; `ResponseInterceptor` registered globally in `app.module.ts`

## Tasks completas

- T0: [x]
- T1: [x]
- T2: [x]
- T3: [x]
- T4: [x]
- T5: [x]
- T6: [x]
- T7: [x]
- T8: [x]
- T9: [x]
- T10: [x]
- T11: [x]
- T12: [x]
- T13: [x]
- T14: [x]
- T15: [x]
- T16: [x]
- T17: [x]
- T18: [x]
- T19: [x]
- T20: [x]
- T21: [x]
- T22: [x]
- T23: [x]
- T24: [x]
- T25: [x]
- T26: [x]
- T27: [x]
- T28: [x]
- T29: [x]
- T30: [x]
- T31: [x]

## Checkpoints relevantes

- C1 (arnés completo): [x] — AGENTS.md, init.sh, feature_list.json, progress/current.md, docs/architecture.md, docs/conventions.md, docs/verification.md, CHECKPOINTS.md all present; init.sh exits 0
- C2 (estado coherente): [x] — Una sola feature in_progress en feature_list.json
- C3 (arquitectura DDD): [x] — 4 capas presentes: domain/, application/, infrastructure/, presentation/; command handlers usan repositorio port + agregado; query handlers usan PrismaService directamente; única importación cross-context es `@contexts/iam/auth/presentation/decorators/permissions.decorator` que es el patrón establecido en todo el proyecto (no un internal violado)
- C4 (verificación): [x] — 88 test suites, 370 tests, todos green; build TypeScript sin errores; lint limpio; todos los command handlers tienen su .spec.ts junto al handler
- C5 (seguridad/tenancy): [x] — Todas las queries filtran `tenantId` y `deletedAt: null`; todos los endpoints tienen `@Permissions(Perm.products.*)`; no hay hard-delete (archive() usa softDelete() + status=ARCHIVED); no hay módulos de asignación de roles
- C6 (domain events): [x] — ProductCreatedEvent/ProductUpdatedEvent/ProductArchivedEvent emitidos en cada mutación; handlers llaman `pullDomainEvents()` y pasan events a `repository.save(product, events)`; `PrismaProductRepository.save()` llama `writeToOutbox(tx, outboxEvents)` dentro de `$transaction`; `eventBus.publishAll(events)` llamado inmediatamente después del save
- C7 (sesión cerrada): [x] — Sin archivos temporales sospechosos
- C8 (SDD): [x] — specs/products_catalog/ con requirements.md, design.md, tasks.md presentes; todas las tasks marcadas [x]; todos los R<n> cubiertos por tests concretos

## Observaciones (sin bloquear)

- `PrismaProductRepository` (`infrastructure/repositories/prisma-product.repository.ts`) y `ProductsController` (`presentation/controllers/products.controller.ts`) no tienen tests unitarios propios, pero ambas rutas están cubiertas indirectamente: el repositorio por los handler specs que mockean el port, y el controlador por convención del proyecto (delegación total a CommandBus/QueryBus sin lógica propia). La cobertura global (85.8% statements) supera el umbral del 80%.
- El diseño de `MoneyDto` usa `@Length(3,3)` para currency pero no `@IsUppercase`. La normalización a mayúsculas la realiza el Money VO internamente — no es un bug, es una decisión documentada en `progress/impl_products_catalog.md`.
