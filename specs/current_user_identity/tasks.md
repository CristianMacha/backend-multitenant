# tasks.md — current_user_identity

Orden natural de implementación. Esta feature es query-path puro: sin schema
Prisma, sin agregado, sin domain events, sin repository port, sin permisos nuevos.

- [x] T1 — Crear la carpeta del módulo `src/contexts/iam/identity/` con sus
      capas `application/get-my-identity/` y `presentation/{controllers,dto}/`.
      Cubre: (estructura base, sin R directo).

- [x] T2 — Definir `get-my-identity.query.ts`: interface `MyIdentityReadModel`
      (`userId`, `firebaseUid`, `email`, `firstName`, `lastName`, `fullName`,
      `tenantId`, `roles[]`, `permissions[]`, `isPlatformAdmin`) y clase
      `GetMyIdentityQuery extends Query<MyIdentityReadModel>` que recibe el
      `UserContext`. Cubre: R2.

- [x] T3 — Implementar `get-my-identity.handler.ts` (`@QueryHandler`): inyectar
      `PrismaService`; castear `userId`/`tenantId` con branded types; consultar
      `prisma.user.findFirst` filtrando por `id`, `tenantId` y `deletedAt: null`
      seleccionando `firstName`/`lastName`; lanzar `EntityNotFoundException` si
      no existe; componer el read model con los campos del `UserContext` +
      `firstName`/`lastName` de Prisma + `fullName` derivado con `trim()`.
      Cubre: R1, R2, R3, R5, R6, R8, R9.

- [x] T4 — Escribir `get-my-identity.handler.spec.ts` con `PrismaService`
      mockeado: read model completo y correcto, `fullName` con trim, no se usan
      repositorios ni eventbus, y 404 cuando Prisma devuelve `null`.
      Cubre: R1, R2, R3, R5, R6, R8, R9.

- [x] T5 — Crear `identity-response.dto.ts` (`IdentityResponseDto`) con
      `@ApiProperty` por cada campo del read model, para documentación Swagger.
      Cubre: R2, R7.

- [x] T6 — Crear `identity.controller.ts`: `@Controller({ path: 'me', version: '1' })`,
      `@ApiTags('Identity')`, `@ApiBearerAuth()`, método `@Get()` con
      `@ApiOperation`, `@ApiStandardResponse({ type: IdentityResponseDto })`,
      `@CurrentUser() user: UserContext`, sin `@Permissions`/`@Roles` (comentario
      explicativo). Despacha `new GetMyIdentityQuery(user)` por `queryBus`.
      Cubre: R1, R4, R7.

- [x] T7 — Crear `identity.module.ts`: `imports: [CqrsModule, AuthModule]`,
      `controllers: [IdentityController]`, `providers: [GetMyIdentityHandler]`.
      Cubre: R1, R4.

- [x] T8 — Modificar `src/contexts/iam/iam-context.module.ts` para importar
      `IdentityModule` (sin exportarlo). Cubre: R1.

- [x] T9 — Verificación: `pnpm lint:check`, `pnpm build`, `pnpm test` (cobertura >= 80%), y documentar la trazabilidad R↔test en
      `progress/impl_current_user_identity.md`. Cubre: R1–R9.
