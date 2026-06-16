# impl_current_user_identity.md

Feature `id: 3` — `current_user_identity` — IAM · GET /api/v1/me authenticated
user identity endpoint.

## Resumen

Nuevo módulo `src/contexts/iam/identity/` (gemelo arquitectónico de
`iam/navigation`): `IdentityController` (`GET /api/v1/me`), query handler
`GetMyIdentityHandler` (query-path puro, `PrismaService` directo) y read
model `MyIdentityReadModel`. Importado en `iam-context.module.ts` sin
exportarlo. Sin cambios en `prisma/schema.prisma`, sin agregado, sin command,
sin domain events, sin permisos nuevos — exactamente como especifica el design.

## Archivos creados

- `src/contexts/iam/identity/identity.module.ts`
- `src/contexts/iam/identity/application/get-my-identity/get-my-identity.query.ts`
- `src/contexts/iam/identity/application/get-my-identity/get-my-identity.handler.ts`
- `src/contexts/iam/identity/application/get-my-identity/get-my-identity.handler.spec.ts`
- `src/contexts/iam/identity/presentation/controllers/identity.controller.ts`
- `src/contexts/iam/identity/presentation/dto/identity-response.dto.ts`

## Archivos modificados

- `src/contexts/iam/iam-context.module.ts` — importa `IdentityModule` en el
  array `imports` (no se exporta).
- `specs/current_user_identity/tasks.md` — T1-T9 marcadas `[x]`.

## Trazabilidad

- R1 (GET /api/v1/me responde 200 con read model) → `identity.controller.ts`
  (`@Controller({ path: 'me', version: '1' })`) + `get-my-identity.handler.spec.ts`
  → `returns the complete and correct identity read model`
- R2 (campos exactos del read model, sin extras) → `get-my-identity.handler.spec.ts`
  → `reflects isPlatformAdmin as boolean and keeps the same read model shape for platform admins`
  (verifica `Object.keys(result)` exacto)
- R3 (fullName = firstName + " " + lastName, trim) → `get-my-identity.handler.spec.ts`
  → `derives fullName trimming surrounding whitespace`
- R4 (ruta autenticada, sin permiso/rol extra) → `identity.controller.ts`
  (sin `@Permissions`/`@Roles`, comentario explicativo igual que `NavigationController`)
- R5 (query-path puro, sin agregado/repository/eventos) → `get-my-identity.handler.spec.ts`
  → `does not use any repository or eventbus — only PrismaService`
  (handler solo inyecta `PrismaService`, sin `EventBus` ni repository port)
- R6 (resolver por userId+tenantId del UserContext, deletedAt:null) →
  `get-my-identity.handler.spec.ts` → `queries Prisma filtering by id, tenantId and deletedAt: null`
- R7 (`@ApiStandardResponse` + envelope estándar) → `identity.controller.ts`
  (`@ApiStandardResponse({ type: IdentityResponseDto })`); el envelope lo aplica
  `ResponseInterceptor` global (verificado por inspección, no requiere test propio)
- R8 (isPlatformAdmin booleano, misma forma del read model siempre) →
  `get-my-identity.handler.spec.ts` →
  `reflects isPlatformAdmin as boolean and keeps the same read model shape for platform admins`
- R9 (404 EntityNotFoundException si no existe / soft-deleted) →
  `get-my-identity.handler.spec.ts` →
  `throws EntityNotFoundException when the user does not exist or is soft-deleted`

## Verificación

- `pnpm lint:check` → OK (sin errores tras corregir `unbound-method` en el
  spec y formateo prettier en el handler).
- `pnpm build` → OK, sin errores de TypeScript.
- `pnpm test` (vía `./init.sh`) → 90 suites / 383 tests, todos en verde
  (incluye los 6 tests nuevos de `get-my-identity.handler.spec.ts`).
- `pnpm test:cov` → sin fallos de threshold global; cobertura de
  `get-my-identity.handler.ts` y `get-my-identity.query.ts`: 100% statements /
  100% branch / 100% functions / 100% lines.
- `./init.sh` → entorno listo, todo verde.

## Notas

- No se modificó `prisma/schema.prisma` ni `prisma/seed.ts` (no aplica, según design).
- No se cambió el status de la feature en `feature_list.json` — queda en
  `in_progress` para el reviewer.
