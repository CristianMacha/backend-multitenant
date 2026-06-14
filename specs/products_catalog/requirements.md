# Requirements — Catalog · Products & Services

> Feature `products_catalog` (id 2). Nuevo bounded context `catalog/`, módulo `products`.
> Notación EARS estricta (ver `docs/specs.md`). Cada `R<n>` es verificable por un test concreto.

## Functional Requirements

### Crear producto

## R1

CUANDO un usuario con permiso `products.create` envía `POST /api/v1/products` con un
cuerpo válido (`name`, `type`, `unitPrice.amount`, `unitPrice.currency`), el sistema DEBE
crear el producto en la base de datos con `status = ACTIVE` y devolver su `id` con status 201.

## R2

CUANDO se crea un producto, el sistema DEBE asignarle el `tenantId` del usuario autenticado
(o el `x-tenant-id` efectivo si el solicitante es platform admin).

## R3

SI el `name` enviado a `POST /api/v1/products` está vacío o solo contiene espacios ENTONCES
el sistema DEBE rechazar la petición con un error de validación (422 dominio / 400 DTO) y NO
DEBE crear el producto.

## R4

SI el `type` enviado no es `PRODUCT` ni `SERVICE` ENTONCES el sistema DEBE rechazar la
petición con error de validación y NO DEBE crear el producto.

## R5

SI el `unitPrice.amount` enviado es negativo o tiene más de 2 decimales, o el
`unitPrice.currency` no es un código ISO 4217 de 3 letras ENTONCES el sistema DEBE rechazar
la petición con un error de dominio (422) y NO DEBE crear el producto.

## R6

CUANDO un producto se crea correctamente, el sistema DEBE emitir el evento de dominio
`ProductCreated` y escribirlo al `domain_event_outbox` dentro de la misma transacción de
persistencia.

## R7

SI un usuario sin permiso `products.create` invoca `POST /api/v1/products` ENTONCES el
sistema DEBE responder 403 y NO DEBE crear el producto.

### Listar productos

## R8

CUANDO un usuario con permiso `products.read` invoca `GET /api/v1/products`, el sistema DEBE
devolver una lista paginada de productos del tenant efectivo con status 200.

## R9

El sistema DEBE filtrar toda query de productos por `tenantId` y `deletedAt: null`.

## R10

DONDE la petición a `GET /api/v1/products` incluya el query param `type`, el sistema DEBE
devolver solo los productos cuyo `type` coincida.

## R11

DONDE la petición a `GET /api/v1/products` incluya el query param `category`, el sistema DEBE
devolver solo los productos cuya `category` coincida.

## R12

DONDE la petición a `GET /api/v1/products` incluya el query param `status`, el sistema DEBE
devolver solo los productos cuyo `status` coincida.

## R13

SI un usuario sin permiso `products.read` invoca `GET /api/v1/products` ENTONCES el sistema
DEBE responder 403.

### Obtener producto por id

## R14

CUANDO un usuario con permiso `products.read` invoca `GET /api/v1/products/:id` con un id
existente en su tenant, el sistema DEBE devolver el read model del producto con status 200.

## R15

SI el `id` solicitado en `GET /api/v1/products/:id` no existe en el tenant efectivo o tiene
`deletedAt != null` ENTONCES el sistema DEBE responder 404 con un mensaje descriptivo en
`message`.

### Actualizar producto

## R16

CUANDO un usuario con permiso `products.update` invoca `PATCH /api/v1/products/:id` con
campos válidos, el sistema DEBE aplicar los cambios, actualizar `updatedAt` y responder 204.

## R17

CUANDO un producto se actualiza correctamente, el sistema DEBE emitir el evento de dominio
`ProductUpdated` con el conjunto de campos modificados y escribirlo al `domain_event_outbox`
en la misma transacción.

## R18

SI se invoca `PATCH /api/v1/products/:id` sobre un producto con `status = ARCHIVED` ENTONCES
el sistema DEBE rechazar la operación con un error de dominio (422) y NO DEBE aplicar cambios.

## R19

SI el `id` de `PATCH /api/v1/products/:id` no existe en el tenant efectivo ENTONCES el
sistema DEBE responder 404.

## R20

SI un usuario sin permiso `products.update` invoca `PATCH /api/v1/products/:id` ENTONCES el
sistema DEBE responder 403 y NO DEBE aplicar cambios.

### Archivar producto

## R21

CUANDO un usuario con permiso `products.delete` invoca `DELETE /api/v1/products/:id`, el
sistema DEBE establecer `status = ARCHIVED`, marcar `deletedAt` (soft-delete) y responder 204.

## R22

CUANDO un producto se archiva correctamente, el sistema DEBE emitir el evento de dominio
`ProductArchived` y escribirlo al `domain_event_outbox` en la misma transacción.

## R23

SI se invoca `DELETE /api/v1/products/:id` sobre un producto ya archivado ENTONCES el sistema
DEBE rechazar la operación con un error de dominio (422).

## R24

SI el `id` de `DELETE /api/v1/products/:id` no existe en el tenant efectivo ENTONCES el
sistema DEBE responder 404.

## R25

SI un usuario sin permiso `products.delete` invoca `DELETE /api/v1/products/:id` ENTONCES el
sistema DEBE responder 403.

### Exposición cross-context

## R26

El sistema DEBE exportar el tipo branded `ProductId` desde `catalog-context.module.ts` para
que otros contextos referencien productos por id sin importar internals del módulo.

## R27

El sistema DEBE exportar `ProductQueryService` desde `catalog-context.module.ts`, ofreciendo
`findById(tenantId, productId)` que devuelve un read model ligero y NO DEBE filtrar productos
con `deletedAt != null`.

## R28

CUANDO `ProductQueryService.findById(tenantId, productId)` se invoca con un id inexistente o
soft-deleted en ese tenant, el sistema DEBE devolver `null` (no lanzar) y NO DEBE filtrar
fuera del `tenantId` indicado.

## Non-Functional Requirements

## R29

El sistema DEBE persistir `unitPrice` como un par `amount` (`Decimal(14,2)`) + `currency`
(`VarChar(3)`), rehidratado al value object `Money` del shared kernel en la capa de dominio.

## R30

El sistema DEBE registrar los permisos `products.create`, `products.read`, `products.update`
y `products.delete` en `prisma/seed.ts` y proteger cada ruta con `@Permissions(...)`.

## R31

El sistema DEBE cubrir con tests unitarios todos los command handlers (create, update,
archive) y query handlers (list, get-by-id) y `ProductQueryService`, alcanzando una cobertura
global >= 80%.

## R32

El sistema DEBE devolver toda respuesta envuelta en el envelope estándar `{success, data,
message}` vía `ResponseInterceptor`, sin envolver manualmente en los controllers.

## Out of Scope

- Inventario / stock / niveles de existencias.
- Precios avanzados o escalonados (tiered pricing), descuentos, listas de precios.
- Variantes de producto (tallas, colores) y bundles/kits.
- Hard-delete: prohibido; solo soft-delete vía `deletedAt`.
  </content>
  </invoke>
