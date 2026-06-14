# Sesión actual

## Feature en curso

`products_catalog` (id 2) — Catalog · Products & Services catalog module.

## Plan

Nuevo bounded context `src/contexts/catalog/` con un único módulo `products`:
CRUD (create/list/get-by-id/update/archive) multi-tenant con soft-delete, `Money` VO para
`unitPrice`, enums `type` (PRODUCT|SERVICE) y `status` (ACTIVE|ARCHIVED), eventos de dominio
al outbox, y exposición cross-context de `ProductId` + `ProductQueryService`.

Spec redactado en `specs/products_catalog/`:

- `requirements.md` — R1..R32 (EARS estricto).
- `design.md` — 4 capas, schema Prisma, handlers, exports, eventos, permisos, secuencia.
- `tasks.md` — T0..T31 con trazabilidad a R<n>.

## Estado

`done` — implementado y aprobado por reviewer. Listo para merge.

## Notas / Bloqueantes

- Ninguno. Acceptance criteria suficientes; no hubo necesidad de `blocked`.
- Decisión registrada en design §12: `unitPrice` como `Decimal(14,2)` + `currency VarChar(3)`
  (consistente con el modelo `Opportunity`), no JSON.
  </content>
