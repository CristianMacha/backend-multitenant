# requirements.md — current_user_identity

Feature `id: 3`, `name: current_user_identity`, context `iam`.

Endpoint read-only `GET /api/v1/me` que devuelve la identidad consolidada del
usuario autenticado (quién es, a qué tenant pertenece, sus roles y permisos),
para que el frontend la consuma al loguearse. Complementa el endpoint existente
`GET /api/v1/navigation`. Camino de lectura puro (query-path): sin mutación de
dominio, sin eventos.

## Mapa de cobertura de acceptance criteria

| Acceptance criterion (feature_list.json id 3)                                                                                   | Requirements  |
| ------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| GET /api/v1/me — returns the authenticated user's identity read model                                                           | R1            |
| Response includes: userId, firebaseUid, email, firstName, lastName, fullName, tenantId, roles[], permissions[], isPlatformAdmin | R2, R3, R8    |
| Authenticated route (default guards); no extra permission required                                                              | R4            |
| Query path only: read model built via PrismaService directly, no domain mutation, no domain events                              | R5            |
| Multi-tenant safe: resolves the user by the authenticated firebaseUid/userId, filtered by tenantId and deletedAt:null           | R6, R9        |
| Returns the same data shape regardless of platform admin; isPlatformAdmin reflected as boolean                                  | R8            |
| Documented with @ApiStandardResponse and returned through the standard response envelope                                        | R7            |
| Unit tests for the query handler; coverage >= 80%                                                                               | R1–R9 (todos) |

---

## R1

CUANDO un usuario autenticado envía `GET /api/v1/me`, el sistema DEBE responder
con status `200` y un read model de identidad del propio usuario en `data`.

## R2

CUANDO el sistema construye el read model de identidad, DEBE incluir los campos
`userId`, `firebaseUid`, `email`, `firstName`, `lastName`, `fullName`,
`tenantId`, `roles`, `permissions` e `isPlatformAdmin`, sin campos adicionales.

## R3

CUANDO el sistema calcula el campo `fullName`, DEBE derivarlo como
`firstName` + " " + `lastName` con espacios sobrantes recortados (`trim`),
coherente con el getter `fullName` de la entidad `User`.

## R4

El sistema DEBE exponer `GET /api/v1/me` como ruta autenticada bajo los guards
globales por defecto, sin exigir ningún permiso (`@Permissions`) ni rol
(`@Roles`) adicional: cualquier usuario autenticado DEBE poder leer su propia
identidad.

## R5

El sistema DEBE construir el read model exclusivamente por el camino de lectura
(query handler con `PrismaService` directo), sin cargar el agregado de dominio,
sin invocar el repository port y sin emitir domain events ni escribir al outbox.

## R6

El sistema DEBE resolver al usuario por el `userId` del contexto autenticado
(`UserContext`) filtrando la consulta por `tenantId` del mismo contexto y por
`deletedAt: null`.

## R7

El sistema DEBE documentar la respuesta con `@ApiStandardResponse` y devolverla
a través del envelope estándar `{ success, data, message }` producido por
`ResponseInterceptor`.

## R8

CUANDO el sistema construye el read model, DEBE reflejar `isPlatformAdmin` como
booleano tomado del `UserContext`, y la forma del read model (sus campos) DEBE
ser idéntica tanto si el usuario es platform admin como si no lo es.

## R9

SI el usuario del contexto autenticado no existe en la base de datos para el
`tenantId` resuelto, o está soft-deleted (`deletedAt != null`), ENTONCES el
sistema DEBE responder con `404` y un mensaje descriptivo en `message`
(`EntityNotFoundException`).
