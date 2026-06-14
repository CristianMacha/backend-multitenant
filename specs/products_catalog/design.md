# Design — Catalog · Products & Services

> Cómo se construye la feature `products_catalog`. Nuevo bounded context
> `src/contexts/catalog/`, único módulo `products`. Sigue las 4 capas DDD y la ruta de
> escritura vs lectura del proyecto (`docs/architecture.md`). Espejo estructural del módulo
> de referencia `crm/accounts`.

## 1. Ubicación y por qué un nuevo contexto

El catálogo de productos/servicios es un dominio de negocio propio (no un servicio técnico),
por lo que vive en `src/contexts/catalog/` y no en `platform/`. El contexto `sales/` necesitará
referenciar productos por id; lo hará vía el `ProductQueryService` y el tipo `ProductId`
exportados por `catalog-context.module.ts`, sin importar internals del módulo (regla de
dependencia de `docs/architecture.md`).

`catalog-context.module.ts` se importa en `AppModule` junto a `CrmContextModule` /
`SalesContextModule`.

## 2. Estructura del módulo (4 capas)

```
src/contexts/catalog/
├── catalog-context.module.ts                 # importa ProductsModule; reexporta ProductsModule
└── products/
    ├── products.module.ts                    # exporta PRODUCT_REPOSITORY + ProductQueryService
    ├── domain/
    │   ├── entities/
    │   │   ├── product.entity.ts             # AggregateRoot<ProductProps>
    │   │   └── product.entity.spec.ts
    │   ├── events/
    │   │   └── product.events.ts             # ProductCreated/Updated/Archived events
    │   └── repositories/
    │       └── product.repository.ts         # interface + PRODUCT_REPOSITORY Symbol
    ├── application/
    │   ├── product.read-model.ts             # ProductReadModel + toProductReadModel
    │   ├── product-query.service.ts          # ProductQueryService (export público) + spec
    │   ├── product-query.service.spec.ts
    │   ├── create-product/
    │   │   ├── create-product.command.ts
    │   │   ├── create-product.handler.ts
    │   │   └── create-product.handler.spec.ts
    │   ├── update-product/
    │   │   ├── update-product.command.ts
    │   │   ├── update-product.handler.ts
    │   │   └── update-product.handler.spec.ts
    │   ├── archive-product/
    │   │   ├── archive-product.command.ts
    │   │   ├── archive-product.handler.ts
    │   │   └── archive-product.handler.spec.ts
    │   ├── get-products/
    │   │   ├── get-products.query.ts
    │   │   ├── get-products.handler.ts
    │   │   └── get-products.handler.spec.ts
    │   └── get-product-by-id/
    │       ├── get-product-by-id.query.ts
    │       ├── get-product-by-id.handler.ts
    │       └── get-product-by-id.handler.spec.ts
    ├── infrastructure/
    │   ├── mappers/
    │   │   ├── product.mapper.ts
    │   │   └── product.mapper.spec.ts
    │   └── repositories/
    │       └── prisma-product.repository.ts
    └── presentation/
        ├── controllers/
        │   └── products.controller.ts
        └── dto/
            ├── money.dto.ts                  # MoneyDto (amount, currency)
            ├── create-product.dto.ts
            ├── update-product.dto.ts
            ├── list-products-query.dto.ts
            └── product-response.dto.ts
```

> Nota de scaffolding: la skill `/new-module catalog products` genera el esqueleto de las 4
> capas siguiendo el patrón canónico. El implementer la corre primero (Task 0) y luego ajusta
> a este diseño.

## 3. Modelo de dominio — agregado `Product`

`Product extends AggregateRoot<ProductProps>` (igual que `Account`).

```ts
export type ProductType = 'PRODUCT' | 'SERVICE';
export type ProductStatus = 'ACTIVE' | 'ARCHIVED';

interface ProductProps extends BaseEntityProps {
  tenantId: TenantId;
  name: string;
  description?: string;
  type: ProductType;
  category?: string;
  unitPrice: Money; // value object de @shared/domain/value-objects/money.vo
  unitOfMeasure: string; // free-text: "unit", "hour", "kg"
  status: ProductStatus;
}
```

Métodos:

- `static create(props: CreateProductProps): Product` — valida `name` no vacío, construye
  `Money.of(amount, currency)`, fija `status = ACTIVE`, emite `ProductCreatedEvent`. (R1, R3,
  R5, R6)
- `static fromPersistence(props: RehydrateProductProps): Product` — rehidrata sin eventos;
  reconstruye `Money.of(...)` desde `amount`/`currency`. (R29)
- `update(changes: UpdateProductProps): void` — `assertActive()` (lanza `DomainException`
  422 si archivado), aplica solo campos definidos, `touch()`, emite `ProductUpdatedEvent` con
  el set de cambios aplicados. (R16, R17, R18)
- `archive(): void` — lanza `DomainException` si ya archivado; fija `status = ARCHIVED`,
  `softDelete()`, emite `ProductArchivedEvent`. (R21, R22, R23)
- Getters: `tenantId`, `name`, `description`, `type`, `category`, `unitPrice` (Money),
  `unitOfMeasure`, `status`, `isArchived`.

Value objects usados: `Money` (shared kernel, ya existe — valida amount >= 0, <= 2 decimales,
currency ISO 4217). No se crea VO nuevo.

`CreateProductProps` recibe `unitPriceAmount: number` + `unitPriceCurrency: string` crudos;
el agregado construye el `Money`. `UpdateProductProps` usa la semántica de `Account`:
`undefined` = no tocar, `null` = limpiar opcional (`description`, `category`).

## 4. Cambios en `prisma/schema.prisma`

Nuevos enums + modelo (estilo copiado de `Account` / `Opportunity`):

```prisma
enum ProductType {
  PRODUCT
  SERVICE

  @@map("product_type")
}

enum ProductStatus {
  ACTIVE
  ARCHIVED

  @@map("product_status")
}

model Product {
  id            String        @id @default(uuid()) @db.Uuid
  tenantId      String        @map("tenant_id") @db.Uuid
  name          String
  description   String?
  type          ProductType
  category      String?
  unitPrice     Decimal       @default(0) @map("unit_price") @db.Decimal(14, 2)
  currency      String        @db.VarChar(3)
  unitOfMeasure String        @map("unit_of_measure")
  status        ProductStatus @default(ACTIVE)
  createdAt     DateTime      @default(now()) @map("created_at")
  updatedAt     DateTime      @updatedAt @map("updated_at")
  deletedAt     DateTime?     @map("deleted_at")

  tenant Tenant @relation(fields: [tenantId], references: [id])

  @@index([tenantId])
  @@index([tenantId, type])
  @@index([tenantId, status])
  @@index([tenantId, category])
  @@map("products")
}
```

Añadir `products Product[]` a la relación inversa del modelo `Tenant` (igual que
`accounts Account[]`). Money se persiste como `unitPrice` (Decimal) + `currency` (VarChar(3))
y se rehidrata a `Money.of(...)` en el mapper (R29).

Migración: `pnpm prisma:migrate` + `pnpm prisma:generate`.

## 5. Capa de aplicación

### Commands (ruta de escritura: handler → repo port → agregado → save → eventBus)

| Command                 | Input                                                                                              | Output           | Cubre              |
| ----------------------- | -------------------------------------------------------------------------------------------------- | ---------------- | ------------------ |
| `CreateProductCommand`  | `tenantId, name, type, unitPriceAmount, unitPriceCurrency, unitOfMeasure, description?, category?` | `{ id: string }` | R1, R2, R3, R5, R6 |
| `UpdateProductCommand`  | `id, tenantId, changes: UpdateProductDto`                                                          | `void`           | R16, R17, R18, R19 |
| `ArchiveProductCommand` | `id, tenantId`                                                                                     | `void`           | R21, R22, R23, R24 |

`UpdateProductHandler` y `ArchiveProductHandler`: `repo.findById(id, tenantId)`; si `null` →
`EntityNotFoundException('Product', id)` (404). Tras mutar: `pullDomainEvents()` →
`repo.save(agg, events)` → `eventBus.publishAll(events)`.

### Queries (ruta de lectura: handler → PrismaService directo → read model)

| Query                 | Input                                              | Output                                 | Cubre                 |
| --------------------- | -------------------------------------------------- | -------------------------------------- | --------------------- |
| `GetProductsQuery`    | `tenantId, page, limit, type?, category?, status?` | `PaginatedResultDto<ProductReadModel>` | R8, R9, R10, R11, R12 |
| `GetProductByIdQuery` | `id, tenantId`                                     | `ProductReadModel`                     | R14, R15              |

`GetProductsHandler`: `where = { tenantId, deletedAt: null, ...(type?), ...(category?),
...(status?) }`; `$transaction([findMany, count])`; `PaginatedResultDto.of(...)`.
`GetProductByIdHandler`: `findFirst({ where: { id, tenantId, deletedAt: null } })`; si `null`
→ `EntityNotFoundException`.

### `ProductReadModel` (`application/product.read-model.ts`)

```ts
interface ProductReadModel {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  type: string;
  category: string | null;
  unitPrice: { amount: number; currency: string };
  unitOfMeasure: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
```

`toProductReadModel(raw: PrismaProduct)`: mapea `unitPrice` → `{ amount:
Number(raw.unitPrice), currency: raw.currency }`.

### `ProductQueryService` (export cross-context)

`application/product-query.service.ts`, `@Injectable()`, inyecta `PrismaService`:

```ts
findById(tenantId: TenantId, productId: ProductId): Promise<ProductSummary | null>
```

Devuelve un read model ligero (`ProductSummary`: `id, name, type, unitPrice {amount,
currency}, status`) o `null` si no existe / soft-deleted en ese tenant. Filtra siempre por
`tenantId` y `deletedAt: null`. No filtra cross-tenant. (R27, R28)

## 6. Capa de infraestructura

- **`ProductRepository` port** (`domain/repositories/product.repository.ts`): `Symbol
PRODUCT_REPOSITORY` + interface con `findById(id, tenantId)`, `findMany(options)`,
  `save(product, outboxEvents?)`. Espejo de `AccountRepository`.
- **`PrismaProductRepository`** (`infrastructure/repositories/`): implementa el port.
  `save()` hace `$transaction(tx => { upsert; writeToOutbox(tx, events); })` (R6, R17, R22).
  `findById` / `findMany` filtran por `tenantId` + `deletedAt: null` (R9).
- **`ProductMapper`** (`infrastructure/mappers/`): `toDomain(raw)` →
  `Product.fromPersistence({ ..., unitPriceAmount: Number(raw.unitPrice), unitPriceCurrency:
raw.currency })`; `toPersistence(product)` → `Prisma.ProductUncheckedCreateInput` con
  `unitPrice: product.unitPrice.amount`, `currency: product.unitPrice.currency`,
  `deletedAt: product.deletedAt` (R29).

## 7. Capa de presentación

`ProductsController` — `@Controller({ path: 'products', version: '1' })` → `/api/v1/products`.
Usa `@EffectiveTenantId()` (cross-tenant para platform admin) y `CommandBus`/`QueryBus`.

| Método   | Ruta            | Permiso                | Status                   | Cubre       |
| -------- | --------------- | ---------------------- | ------------------------ | ----------- |
| `POST`   | `/products`     | `Perm.products.create` | 201 `IdResponseDto`      | R1, R7      |
| `GET`    | `/products`     | `Perm.products.read`   | 200 paginado             | R8, R10–R13 |
| `GET`    | `/products/:id` | `Perm.products.read`   | 200 `ProductResponseDto` | R14, R15    |
| `PATCH`  | `/products/:id` | `Perm.products.update` | 204                      | R16, R20    |
| `DELETE` | `/products/:id` | `Perm.products.delete` | 204                      | R21, R25    |

DTOs (`class-validator`):

- `MoneyDto`: `amount: number` (`@IsNumber`, `@Min(0)`), `currency: string` (`@Length(3,3)`,
  `@IsUppercase` / transform). (R5)
- `CreateProductDto`: `name` (`@IsNotEmpty`), `type` (`@IsEnum(['PRODUCT','SERVICE'])`),
  `unitPrice: MoneyDto` (`@ValidateNested`), `unitOfMeasure` (`@IsNotEmpty`), `description?`,
  `category?`. (R3, R4, R5)
- `UpdateProductDto`: todos opcionales (`name?`, `description?`, `category?`, `unitPrice?`,
  `unitOfMeasure?`); `type` NO mutable (cambiar el tipo de un producto altera su naturaleza).
- `ListProductsQueryDto extends PaginationQueryDto`: `type?`, `category?`, `status?`
  (`@IsEnum`/`@IsOptional`). (R10–R12)
- `ProductResponseDto`: forma del `ProductReadModel` para Swagger.

Swagger: `@ApiStandardResponse` / `@ApiPaginatedResponse` (nunca `@ApiOkResponse`). El
`ResponseInterceptor` envuelve la respuesta (R32).

## 8. Exports cross-context — `catalog-context.module.ts`

- `ProductId` se añade a `src/shared/domain/types.ts` (branded type + factory, junto a los
  demás CRM ids) y se reexporta conceptualmente vía el contexto. (R26)
- `products.module.ts` exporta `PRODUCT_REPOSITORY` y `ProductQueryService`.
- `catalog-context.module.ts` importa `ProductsModule` y reexporta `ProductsModule` (de modo
  que `ProductQueryService` quede disponible a quien importe el contexto). (R27)
- `AppModule` importa `CatalogContextModule`.

## 9. Domain events — payload

`domain/events/product.events.ts` (extienden `DomainEvent(aggregateId, tenantId)`):

| Evento                 | `eventName`        | Payload extra                      |
| ---------------------- | ------------------ | ---------------------------------- |
| `ProductCreatedEvent`  | `product.created`  | `name: string`, `type: string`     |
| `ProductUpdatedEvent`  | `product.updated`  | `changes: Record<string, unknown>` |
| `ProductArchivedEvent` | `product.archived` | —                                  |

Todos se escriben al `domain_event_outbox` vía `writeToOutbox(tx, events)` en `save()` y se
publican in-process con `eventBus.publishAll(events)`.

## 10. Permisos (seed)

Añadir a `Perm` en `@shared/authorization/permissions.ts`:

```ts
products: { create: 'products.create', read: 'products.read',
            update: 'products.update', delete: 'products.delete' },
```

Registrar las 4 entradas en `PERMISSIONS` de `prisma/seed.ts` (`module: 'products'`). Mapeo
de roles: `ADMIN` ya recibe todo lo no-`tenants.*` automáticamente; añadir a `MANAGER`
`products.read` + `products.update` (oversight de catálogo). `USER` recibe `products.read`.
(R30)

## 11. UnitOfWork

No se usa `UnitOfWork.run()`. Cada caso de uso afecta a un único agregado `Product`, y la
atomicidad evento+entidad ya la garantiza el `$transaction` interno de
`PrismaProductRepository.save()` (con `writeToOutbox`). `UnitOfWork` solo se justifica cuando
un caso de uso coordina varios agregados/tablas en una transacción; no aplica aquí.

## 12. Alternativa descartada

**Persistir `unitPrice` como JSON `{amount, currency}` en una sola columna** (como `Account.address`).
Descartada: un `Decimal(14,2)` + `currency VarChar(3)` es consistente con el modelo
`Opportunity` ya existente, permite ordenar/filtrar/agregar por precio en SQL y evita parsear
JSON en queries. El coste (dos columnas) es trivial frente a la pérdida de capacidad de
consulta del JSON.

## 13. Secuencia — crear producto

```
Client                ProductsController        CommandBus   CreateProductHandler   Product(agg)   PrismaProductRepository   EventBus
  | POST /api/v1/products  |                        |               |                   |                  |                    |
  |----------------------->|                        |               |                   |                  |                    |
  |   @Permissions(products.create) guard OK        |               |                   |                  |                    |
  |                        | execute(CreateProductCommand)          |                   |                  |                    |
  |                        |----------------------->|               |                   |                  |                    |
  |                        |                        |-- execute --->|                   |                  |                    |
  |                        |                        |               | Product.create()  |                  |                    |
  |                        |                        |               |------------------>| (Money.of valida)|                    |
  |                        |                        |               |   emite ProductCreatedEvent          |                    |
  |                        |                        |               | pullDomainEvents()|                  |                    |
  |                        |                        |               |---- save(agg, events) -------------->|                    |
  |                        |                        |               |                   | $transaction: upsert + writeToOutbox  |
  |                        |                        |               |---- publishAll(events) ------------------------------------>|
  |                        |   { id }               |<--------------|                   |                  |                    |
  |  201 {success,data:{id}}|<----------------------|               |                   |                  |                    |
  |<-----------------------|                        |               |                   |                  |                    |
```

</content>
