# Tasks — Catalog · Products & Services

> Checklist ejecutable para `products_catalog`. Cada task referencia los `R<n>` que cubre.
> El implementer marca `[x]` al completar. Orden natural NestJS: schema → domain → events →
> repo port → handlers → tests → infra → presentation → seed → wiring.

## Scaffolding

- [x] **T0** — Ejecutar la skill `/new-module catalog products "Product aggregate for the catalog context"`
      para generar el esqueleto de las 4 capas. Luego ajustar al diseño. Cubre: base de todas.

## Schema + migración

- [x] **T1** — Añadir enums `ProductType` (`PRODUCT|SERVICE`, `@@map("product_type")`) y
      `ProductStatus` (`ACTIVE|ARCHIVED`, `@@map("product_status")`) y el modelo `Product` a
      `prisma/schema.prisma` según design §4; añadir relación inversa `products Product[]` en
      `Tenant`. Cubre: R1, R9, R29.
- [x] **T2** — `pnpm prisma:migrate` + `pnpm prisma:generate`. (Depende de T1). Cubre: R1, R29.

## Tipo branded

- [x] **T3** — Añadir `ProductId` (branded type + factory) a `src/shared/domain/types.ts`
      junto a los demás ids CRM. Cubre: R26. (Depende de: nada)

## Dominio

- [x] **T4** — Crear eventos `ProductCreatedEvent` (`product.created`, `name`, `type`),
      `ProductUpdatedEvent` (`product.updated`, `changes`), `ProductArchivedEvent`
      (`product.archived`) en `domain/events/product.events.ts`. Cubre: R6, R17, R22.
- [x] **T5** — Crear el agregado `Product` (`domain/entities/product.entity.ts`) extendiendo
      `AggregateRoot`: `create` (valida name, construye `Money.of`, status ACTIVE, emite
      Created), `fromPersistence`, `update` (assertActive, emite Updated), `archive` (softDelete,
      emite Archived), getters. (Depende de T3, T4). Cubre: R1, R3, R5, R6, R16, R17, R18, R21,
      R22, R23, R29.
- [x] **T6** — Tests del agregado (`product.entity.spec.ts`): create válido/invalido, name
      vacío, money negativa/decimales/currency inválida, update sobre archivado lanza, archive
      doble lanza. Cubre: R3, R5, R18, R23.

## Repository port

- [x] **T7** — Definir `ProductRepository` port + `PRODUCT_REPOSITORY` Symbol en
      `domain/repositories/product.repository.ts` (`findById`, `findMany`, `save`). (Depende de
      T5). Cubre: R1, R9, R16, R21.

## Application — command handlers + tests

- [x] **T8** — `CreateProductCommand` + `CreateProductHandler`: `Product.create(...)` →
      `pullDomainEvents` → `repo.save` → `eventBus.publishAll`; devuelve `{ id }`. (Depende de
      T5, T7). Cubre: R1, R2, R3, R5, R6.
- [x] **T9** — Tests de `CreateProductHandler` (mock repo + EventBus): crea y devuelve id,
      emite ProductCreated, propaga errores de dominio. Cubre: R1, R3, R5, R6.
- [x] **T10** — `UpdateProductCommand` + `UpdateProductHandler`: `findById` (404 si null),
      `update(changes)`, `save`, `publishAll`. (Depende de T5, T7). Cubre: R16, R17, R18, R19.
- [x] **T11** — Tests de `UpdateProductHandler`: actualiza+emite Updated, 404 si no existe,
      lanza si archivado. Cubre: R16, R17, R18, R19.
- [x] **T12** — `ArchiveProductCommand` + `ArchiveProductHandler`: `findById` (404 si null),
      `archive()`, `save`, `publishAll`. (Depende de T5, T7). Cubre: R21, R22, R23, R24.
- [x] **T13** — Tests de `ArchiveProductHandler`: archiva+softDelete+emite Archived, 404 si no
      existe, lanza si ya archivado. Cubre: R21, R22, R23, R24.

## Application — query handlers + read model + tests

- [x] **T14** — `product.read-model.ts`: `ProductReadModel` + `toProductReadModel` (mapea
      `unitPrice` → `{amount, currency}`). Cubre: R8, R14.
- [x] **T15** — `GetProductsQuery` + `GetProductsHandler` (PrismaService directo): filtra por
      `tenantId` + `deletedAt: null`, + filtros opcionales `type`/`category`/`status`, paginado.
      (Depende de T14, T2). Cubre: R8, R9, R10, R11, R12.
- [x] **T16** — Tests de `GetProductsHandler` (mock PrismaService): filtra por tenant+deletedAt,
      aplica filtros opcionales, pagina. Cubre: R9, R10, R11, R12.
- [x] **T17** — `GetProductByIdQuery` + `GetProductByIdHandler`: `findFirst` con tenant+
      deletedAt, 404 si null. (Depende de T14, T2). Cubre: R14, R15.
- [x] **T18** — Tests de `GetProductByIdHandler`: devuelve read model, 404 si no existe/
      soft-deleted. Cubre: R14, R15.

## ProductQueryService (export cross-context) + tests

- [x] **T19** — `application/product-query.service.ts`: `@Injectable()` con
      `findById(tenantId, productId)` devolviendo `ProductSummary | null`, filtrando por tenant +
      `deletedAt: null`. (Depende de T2, T3). Cubre: R27, R28.
- [x] **T20** — Tests de `ProductQueryService`: devuelve summary, `null` si inexistente/
      soft-deleted, no cruza tenant. Cubre: R27, R28.

## Infraestructura

- [x] **T21** — `ProductMapper` (`infrastructure/mappers/product.mapper.ts`): `toDomain`
      (rehidrata Money desde unitPrice+currency) y `toPersistence`. (Depende de T2, T5). Cubre:
      R29.
- [x] **T22** — Tests del mapper (`product.mapper.spec.ts`): round-trip domain↔persistence,
      Money preservada. Cubre: R29.
- [x] **T23** — `PrismaProductRepository` (`infrastructure/repositories/`): `findById`/
      `findMany` con tenant+deletedAt; `save` con `$transaction(upsert + writeToOutbox(tx,
events))`. (Depende de T7, T21). Cubre: R6, R9, R17, R22.

## Presentación

- [x] **T24** — DTOs: `MoneyDto`, `CreateProductDto`, `UpdateProductDto` (sin `type`),
      `ListProductsQueryDto extends PaginationQueryDto`, `ProductResponseDto` con `class-validator`
      y Swagger. Cubre: R3, R4, R5, R10, R11, R12.
- [x] **T25** — `ProductsController` (`@Controller({ path: 'products', version: '1' })`):
      POST/GET/GET:id/PATCH/DELETE con `@Permissions(...)`, `@EffectiveTenantId()`,
      `@ApiStandardResponse`/`@ApiPaginatedResponse`, status codes del diseño §7. (Depende de
      T8, T10, T12, T15, T17, T24). Cubre: R1, R7, R8, R13, R14, R15, R16, R20, R21, R25, R32.

## Permisos (seed)

- [x] **T26** — Añadir `products: {create,read,update,delete}` a `Perm` en
      `@shared/authorization/permissions.ts`. Cubre: R30.
- [x] **T27** — Registrar las 4 entradas `products.*` en `PERMISSIONS` de `prisma/seed.ts`
      (`module: 'products'`); añadir `products.read`+`products.update` a `MANAGER` y
      `products.read` a `USER`. (Depende de T26). Cubre: R30.

## Wiring de módulos

- [x] **T28** — `products.module.ts`: registrar `{ provide: PRODUCT_REPOSITORY, useClass:
PrismaProductRepository }`, command/query handlers, `ProductQueryService`, controller;
      `exports: [PRODUCT_REPOSITORY, ProductQueryService]`. (Depende de T8–T25). Cubre: R27.
- [x] **T29** — `catalog-context.module.ts`: importa y reexporta `ProductsModule`. (Depende de
      T28). Cubre: R26, R27.
- [x] **T30** — Registrar `CatalogContextModule` en `AppModule`. (Depende de T29). Cubre: R1.

## Cierre

- [x] **T31** — `pnpm lint:check && pnpm build && pnpm test:cov`; verificar cobertura >= 80% y
      el mapa de trazabilidad `R<n> → test`. (Depende de todo). Cubre: R31.
