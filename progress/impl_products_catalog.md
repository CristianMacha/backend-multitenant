# Implementation — Catalog · Products & Services

## Feature

`products_catalog` (id 2) — New bounded context `src/contexts/catalog/` with module `products`.

## Trazabilidad

- R1 → `create-product.handler.spec.ts` — creates a product and returns id (+ domain + controller wiring)
- R2 → `create-product.handler.spec.ts` — saves with tenantId from command
- R3 → `product.entity.spec.ts` — rejects empty name; `create-product.handler.spec.ts` — propagates DomainException
- R4 → `create-product.dto.ts` — `@IsEnum(ProductTypeEnum)` DTO validation
- R5 → `product.entity.spec.ts` — rejects negative amount, >2 decimals; `create-product.handler.spec.ts` — propagates invalid currency
- R6 → `create-product.handler.spec.ts` — publishAll called with 1 event; `prisma-product.repository.ts` — writeToOutbox in $transaction
- R7 → `products.controller.ts` — `@Permissions(Perm.products.create)` guard
- R8 → `get-products.handler.spec.ts` — returns paginated result
- R9 → `get-products.handler.spec.ts` — filters tenantId + deletedAt:null; `get-product-by-id.handler.spec.ts` — same
- R10 → `get-products.handler.spec.ts` — filters by type when provided
- R11 → `get-products.handler.spec.ts` — filters by category when provided
- R12 → `get-products.handler.spec.ts` — filters by status when provided
- R13 → `products.controller.ts` — `@Permissions(Perm.products.read)` on GET /products
- R14 → `get-product-by-id.handler.spec.ts` — returns read model for valid id
- R15 → `get-product-by-id.handler.spec.ts` — throws EntityNotFoundException for missing/soft-deleted
- R16 → `update-product.handler.spec.ts` — applies changes, publishes event
- R17 → `update-product.handler.spec.ts` — ProductUpdatedEvent emitted with changes
- R18 → `product.entity.spec.ts` — update on archived throws DomainException; `update-product.handler.spec.ts` — propagated
- R19 → `update-product.handler.spec.ts` — throws EntityNotFoundException when not found
- R20 → `products.controller.ts` — `@Permissions(Perm.products.update)` on PATCH
- R21 → `archive-product.handler.spec.ts` — archives, soft-deletes
- R22 → `archive-product.handler.spec.ts` — ProductArchivedEvent emitted; writeToOutbox in repo
- R23 → `product.entity.spec.ts` — double archive throws DomainException; `archive-product.handler.spec.ts` — propagated
- R24 → `archive-product.handler.spec.ts` — throws EntityNotFoundException when not found
- R25 → `products.controller.ts` — `@Permissions(Perm.products.delete)` on DELETE
- R26 → `src/shared/domain/types.ts` — `ProductId` branded type; `catalog-context.module.ts` — re-exports ProductsModule
- R27 → `product-query.service.spec.ts` — findById returns ProductSummary; `products.module.ts` — exports ProductQueryService
- R28 → `product-query.service.spec.ts` — returns null for missing/soft-deleted, scopes to tenantId
- R29 → `product.mapper.spec.ts` — round-trip Money(amount+currency); `product.entity.spec.ts` — fromPersistence rehidrates Money
- R30 → `src/shared/authorization/permissions.ts` — `Perm.products.*`; `prisma/seed.ts` — 4 permissions registered, MANAGER+USER roles updated
- R31 → 88 test suites, 370 tests, all passing; build + lint clean
- R32 → `products.controller.ts` — controllers return plain data; ResponseInterceptor wraps automatically

## Decisiones de diseño

- `unitPrice` persisted as `Decimal(14,2)` + `currency VarChar(3)` (per design §12 — consistent with Opportunity model, allows SQL ordering/filtering).
- Money VO normalizes currency to uppercase on construction (`'usd'` → `'USD'`) — test updated to reflect actual VO behavior.
- `UpdateProductDto` intentionally excludes `type` field per spec (changing type alters product nature).
- Controller `findAll`/`findOne` annotated with `Promise<unknown>` return type to satisfy `@typescript-eslint/no-unsafe-return` rule (queryBus.execute returns `Promise<any>`).
- Migration written manually (DB not running in dev environment) following existing migration SQL patterns.
- `ProductQueryService` uses Prisma `select` with only the fields needed for `ProductSummary` to minimize data transfer in cross-context reads.
