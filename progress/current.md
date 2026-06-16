# Sesión actual

## Feature en curso

`current_user_identity` (id 3) — IAM · GET /me authenticated user identity endpoint.

## Plan

Tasks T1..T9 de `specs/current_user_identity/tasks.md`. Nuevo módulo
`src/contexts/iam/identity/` (gemelo arquitectónico de `iam/navigation`):
`IdentityController` (`GET /api/v1/me`), query handler `get-my-identity`
(query-path puro, `PrismaService` directo), read model
`MyIdentityReadModel`. Se importa `IdentityModule` en
`iam-context.module.ts` (sin exportarlo).

## Estado

Implementación completa (T1-T9 marcadas `[x]`). `./init.sh` en verde:
90 suites / 383 tests. Cobertura de `get-my-identity.handler.ts` y
`get-my-identity.query.ts`: 100%. Trazabilidad R1-R9 documentada en
`progress/impl_current_user_identity.md`. Pendiente de revisión por el
reviewer antes de marcar `done` en `feature_list.json`.

## Notas / Bloqueantes

- Ninguno.
  </content>
