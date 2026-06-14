# Spec Driven Development (SDD)

> Este proyecto sigue un flujo Kiro-style: requirements → design → tasks → code.
> El código no se escribe hasta que el spec está aprobado por un humano.

## Estructura

Cada feature nueva (`"sdd": true` en `feature_list.json`) tiene una carpeta
dedicada en cuanto deja `pending`:

```
specs/<feature-name>/
├── requirements.md   # QUÉ se necesita (EARS notation)
├── design.md         # CÓMO se construirá (decisiones técnicas)
└── tasks.md          # PASOS concretos a implementar
```

El `feature-name` coincide con el campo `name` de `feature_list.json`.

## Estados de una feature

| Estado        | Significado                                                     |
| ------------- | --------------------------------------------------------------- |
| `pending`     | Sin spec. El `spec_author` actúa primero.                       |
| `spec_ready`  | Spec redactado. Esperando aprobación humana. NO se toca código. |
| `in_progress` | Spec aprobado. `implementer` trabajando.                        |
| `done`        | Código verde, `reviewer` aprobó, sesión cerrada.                |
| `blocked`     | Atascado. Razón en `progress/current.md`.                       |

## La puerta de aprobación humana

El flujo automático se detiene **una vez**: cuando el `spec_author` termina
sus tres archivos, marca la feature como `spec_ready` y para. El humano
lee `specs/<feature>/` y dice "aprobado" (o pide cambios).

Solo entonces el `leader` transiciona `spec_ready → in_progress` y lanza
el `implementer`.

```
pending → [spec_author] → spec_ready → ⏸ HUMANO → in_progress → [implementer → reviewer] → done
```

## requirements.md — EARS estricto

Las requirements se redactan en **EARS** (Easy Approach to Requirements Syntax).
Cada requirement es un párrafo numerado con uno de estos cinco patrones:

| Patrón         | Plantilla                                                   |
| -------------- | ----------------------------------------------------------- |
| **Ubicuo**     | `El sistema DEBE <acción>.`                                 |
| **Evento**     | `CUANDO <disparador>, el sistema DEBE <acción>.`            |
| **Estado**     | `MIENTRAS <estado>, el sistema DEBE <acción>.`              |
| **Opcional**   | `DONDE <feature opcional>, el sistema DEBE <acción>.`       |
| **No deseado** | `SI <evento no deseado> ENTONCES el sistema DEBE <acción>.` |

Reglas duras:

- Cada requirement tiene un id estable: `R1`, `R2`, ...
- Cada requirement DEBE ser verificable por al menos un test concreto.
- No mezcles varios `DEBE` en un mismo requirement. Si hay más de uno, parte.
- No uses verbos blandos ("podría", "puede", "soporta"). Solo `DEBE` / `NO DEBE`.

Ejemplo para NestJS:

```markdown
## R1

CUANDO un usuario con permiso `hr.employees.create` envía `POST /api/v1/hr/employees`,
el sistema DEBE crear el empleado en la base de datos y devolver su id con status 201.

## R2

El sistema DEBE filtrar por `tenantId` y `deletedAt: null` en toda query de empleados.

## R3

SI el `userId` proporcionado no existe en el contexto IAM ENTONCES el sistema DEBE
responder con 404 y un mensaje descriptivo en `message`.
```

## design.md — decisiones técnicas

Captura **antes** de tocar código:

- Qué archivos se crean / modifican (rutas completas).
- Qué agregados, commands, queries y events se definen.
- Qué tabla(s) se añaden al schema de Prisma (campos, relaciones).
- Qué permisos se registran en `prisma/seed.ts`.
- Qué alternativa se descartó y por qué (mínimo una).
- Si se usa `UnitOfWork` y por qué.

Apóyate en `docs/architecture.md` y `docs/conventions.md`. El `design.md` documenta
los puntos donde la feature roza las fronteras de esas reglas.

## tasks.md — checklist ejecutable

Pasos discretos en orden, cada uno con checkbox. Cada task referencia al
menos un `R<n>` que cubre.

Ejemplo:

```markdown
- [ ] T1 — Añadir entidad `Employee` a `prisma/schema.prisma`. Cubre: R2.
- [ ] T2 — `pnpm prisma:migrate` + `pnpm prisma:generate`. Cubre: R1, R2.
- [ ] T3 — Crear agregado `Employee` extendiendo `AggregateRoot`. Cubre: R1.
- [ ] T4 — Definir `EmployeeRepository` port (interface + Symbol). Cubre: R1.
- [ ] T5 — Implementar `CreateEmployeeHandler` + `CreateEmployeeCommand`. Cubre: R1, R3.
- [ ] T6 — Tests de `CreateEmployeeHandler`. Cubre: R1, R3.
- [ ] T7 — Implementar `PrismaEmployeeRepository` con `writeToOutbox`. Cubre: R1, R2.
- [ ] T8 — Registrar permisos en `prisma/seed.ts`. Cubre: R4.
- [ ] T9 — Controller `EmployeesController` con `POST /api/v1/hr/employees`. Cubre: R1, R4.
```

El `implementer` marca `[x]` cada task al completarla. El `reviewer`
rechaza si queda alguna `[ ]` sin justificación documentada.

## Trazabilidad (regla dura)

- Cada test debe poder mapearse a un `R<n>` de su spec.
- Cada `R<n>` debe tener al menos un test concreto.
- El `reviewer` comprueba esta correspondencia y rechaza si falta.

El `implementer` documenta el mapa en `progress/impl_<name>.md`:

```markdown
## Trazabilidad

- R1 → `create-employee.handler.spec.ts::should create employee`
- R2 → `create-employee.handler.spec.ts::should filter by tenantId`
- R3 → `create-employee.handler.spec.ts::should throw 404 if userId not found`
```

## Cuándo NO aplica SDD

Las features sin el campo `"sdd": true` en `feature_list.json` no tienen spec.
SDD solo se aplica a features explícitamente marcadas.
