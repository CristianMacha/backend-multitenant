# design.md — current_user_identity

## Resumen

Nuevo endpoint read-only `GET /api/v1/me` que devuelve la identidad consolidada
del usuario autenticado. Es un caso de uso **query-path puro**: el `UserContext`
ya resuelto por request (cacheado en Redis 120s vía `UserContextService`) aporta
`userId`, `firebaseUid`, `email`, `tenantId`, `roles[]`, `permissions[]` e
`isPlatformAdmin`; el handler lo enriquece con `firstName`/`lastName`/`fullName`
del usuario consultando `PrismaService` directamente.

No hay agregado, ni command, ni domain event, ni cambios en `prisma/schema.prisma`,
ni permisos nuevos. La feature reutiliza por completo la infraestructura existente.

## Decisión de ubicación: nuevo módulo `iam/identity`

**Pregunta abierta:** ¿añadir el endpoint al módulo `auth` existente o crear un
módulo nuevo `iam/identity`?

**Decisión: crear un módulo nuevo `src/contexts/iam/identity/`** con su
`IdentityController` (`GET /me`), un query handler y un read model.

Justificación:

- El módulo `iam/auth` es **infraestructura de seguridad transversal**: guards,
  strategies Firebase, decoradores (`@CurrentUser`, `@Public`, `@Permissions`),
  y `UserContextService`. Es importado por casi todos los demás módulos. No
  expone controllers de negocio (no tiene capa `presentation/controllers/`).
  Añadirle un endpoint HTTP de cara al frontend mezclaría responsabilidades y
  haría que cualquier módulo que importa `AuthModule` arrastre un controller.
- Existe ya un precedente directo: `iam/navigation` es un módulo pequeño,
  read-only, sin dominio, que toma el `UserContext` vía `@CurrentUser()` y
  responde una vista para el frontend. `GET /me` es exactamente el mismo patrón
  arquitectónico y conceptualmente su gemelo ("quién soy" vs. "qué menú veo").
  Espejar esa estructura mantiene consistencia y bajo acoplamiento.
- Un módulo dedicado mantiene la regla de capas (`application/` + `presentation/`)
  limpia y deja sitio para futuros endpoints de identidad (p. ej. preferencias
  del usuario) sin tocar `auth`.

**Alternativa descartada — añadirlo a `iam/auth`:** rechazada porque convertiría
el módulo de seguridad transversal en titular de un controller de negocio,
incrementando su superficie y el acoplamiento de todos los módulos que ya
importan `AuthModule` solo por los guards/decoradores. No aporta cohesión: la
identidad consolidada es una vista de lectura, no parte del mecanismo de
autenticación.

**Segunda alternativa descartada — reutilizar `GET /users/:id` con el propio id:**
rechazada porque `UserResponseDto` no incluye `firebaseUid`, `permissions`,
`fullName` ni `isPlatformAdmin`, requiere conocer el `userId` de antemano y está
protegido con `@Permissions(users.read)`, lo que contradice R4 (cualquier usuario
debe poder leerse a sí mismo sin permisos). El read model de identidad es distinto
y se modela aparte.

## Archivos a crear

```
src/contexts/iam/identity/
├── identity.module.ts
├── application/
│   └── get-my-identity/
│       ├── get-my-identity.query.ts
│       ├── get-my-identity.handler.ts
│       └── get-my-identity.handler.spec.ts
└── presentation/
    ├── controllers/
    │   └── identity.controller.ts
    └── dto/
        └── identity-response.dto.ts
```

## Archivos a modificar

- `src/contexts/iam/iam-context.module.ts` — importar `IdentityModule` en el
  array `imports` (espejo de `NavigationModule`). No se exporta: el endpoint no
  es consumido por otros contextos.

## Query, read model y handler

### `get-my-identity.query.ts`

```ts
export interface MyIdentityReadModel {
  userId: string;
  firebaseUid: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
  isPlatformAdmin: boolean;
}

export class GetMyIdentityQuery extends Query<MyIdentityReadModel> {
  constructor(readonly user: UserContext) {
    super();
  }
}
```

- `GetMyIdentityQuery` recibe el `UserContext` completo (mismo patrón que
  `GetNavigationQuery`). Todo lo cacheado en Redis (`userId`, `firebaseUid`,
  `email`, `tenantId`, `roles`, `permissions`, `isPlatformAdmin`) viaja en el
  query sin tocar la base de datos para esos campos.
- El read model puede definirse en el propio `query.ts` (como `iam/navigation`)
  o, si se prefiere consistencia con `users`, en un `identity.read-model.ts`.
  Recomendación: mantenerlo en `query.ts` por simplicidad, espejando navigation.

### `get-my-identity.handler.ts`

`@QueryHandler(GetMyIdentityQuery)`, inyecta `PrismaService`. Lógica:

1. Castear el boundary con branded types: `UserId(query.user.userId)` y
   `TenantId(query.user.tenantId)` (de `@shared/domain/types`). (R6)
2. Consultar el usuario para obtener `firstName`/`lastName`:

   ```ts
   const user = await this.prisma.user.findFirst({
     where: {
       id: query.user.userId,
       tenantId: query.user.tenantId,
       deletedAt: null,
     },
     select: { firstName: true, lastName: true },
   });
   ```

   Filtra **siempre** por `tenantId` y `deletedAt: null` (R6).

3. SI `user` es `null` → lanzar `new EntityNotFoundException('User', query.user.userId)`
   (de `@shared/exceptions`), que mapea a 404 vía `GlobalExceptionFilter` (R9).
4. Componer y devolver el `MyIdentityReadModel`: campos de identidad del
   `UserContext` + `firstName`/`lastName` de Prisma + `fullName` derivado como
   `` `${firstName} ${lastName}`.trim() `` (R2, R3, R8).

No carga el agregado `User`, no usa el repository port, no emite eventos (R5).

### `identity.controller.ts`

Espejo de `NavigationController`:

```ts
@ApiTags('Identity')
@ApiBearerAuth()
@Controller({ path: 'me', version: '1' })
export class IdentityController {
  constructor(private readonly queryBus: QueryBus) {}

  // No @Permissions/@Roles by design: any authenticated user may read their own identity.
  @Get()
  @ApiOperation({ summary: 'Get the authenticated user consolidated identity' })
  @ApiStandardResponse({ type: IdentityResponseDto })
  getMyIdentity(@CurrentUser() user: UserContext) {
    return this.queryBus.execute(new GetMyIdentityQuery(user));
  }
}
```

- `@Controller({ path: 'me', version: '1' })` → ruta final `/api/v1/me` (R1).
- Sin `@Permissions`/`@Roles`: ruta autenticada por defecto (R4). Comentario
  explicativo igual que en `NavigationController`.
- `@CurrentUser()` (de `@contexts/iam/auth/presentation/decorators/current-user.decorator`)
  inyecta el `UserContext` (R6).
- `@ApiStandardResponse({ type: IdentityResponseDto })` documenta el envelope (R7).
- El controller devuelve datos planos; `ResponseInterceptor` los envuelve en
  `{ success, data, message }` (R7).

### `identity-response.dto.ts`

Clase `IdentityResponseDto` con `@ApiProperty` por cada campo del read model
(`userId` y `tenantId` como `format: 'uuid'`; `roles` y `permissions` como
`type: [String]`), espejando el estilo de `UserResponseDto`. Es solo
documentación Swagger; el handler devuelve el read model plano.

### `identity.module.ts`

Espejo de `navigation.module.ts`:

```ts
@Module({
  imports: [CqrsModule, AuthModule],
  controllers: [IdentityController],
  providers: [GetMyIdentityHandler],
})
export class IdentityModule {}
```

`AuthModule` se importa para que los guards globales y el decorador
`@CurrentUser` funcionen, igual que en `navigation`.

## Prisma / schema

Ningún cambio en `prisma/schema.prisma`. El modelo `User` ya expone `firstName`,
`lastName`, `tenantId`, `deletedAt`. No hay migración.

## Permisos / seed

Ningún permiso nuevo en `prisma/seed.ts`. R4 establece explícitamente que el
endpoint no requiere permiso; la ruta queda protegida solo por la autenticación
de los guards globales.

## UnitOfWork

No aplica. `UnitOfWork` envuelve mutaciones transaccionales (camino de escritura).
Este es un read model de una sola lectura, sin transacción ni escritura.

## Multi-tenancy y platform admin

- La query filtra por `tenantId` (del `UserContext`) y `deletedAt: null` (R6).
- Para un platform admin, el `tenantId` efectivo es el del `UserContext`
  (el resuelto por la cadena de guards, que ya considera `x-tenant-id` si aplica),
  por lo que el filtro sigue siendo correcto. No se usa `@EffectiveTenantId` en
  el controller porque el `UserContext` ya transporta el `tenantId` efectivo y la
  query lo toma de ahí; la forma del read model no cambia según `isPlatformAdmin`
  (R8).

## Tests

- `get-my-identity.handler.spec.ts` — unit test del handler con `PrismaService`
  mockeado (patrón de query handlers, ver `get-user-by-id.handler.spec.ts` y
  `get-navigation.handler.spec.ts`). Helper `makeUser()` para construir un
  `UserContext`. Casos: read model completo y correcto (R1, R2, R6, R8),
  `fullName` derivado con trim (R3), no se llama a ningún repositorio/eventbus
  (R5 — verificable porque el handler solo recibe `PrismaService`), 404 cuando
  Prisma devuelve `null` (R9). Cobertura >= 80%.
- R4 y R7 se cubren a nivel de configuración del controller (decoradores) y se
  verifican por inspección/anotación; la trazabilidad documental va en
  `progress/impl_current_user_identity.md`.
