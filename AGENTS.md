# AGENTS.md — Mapa de navegación para agentes de IA

> Este archivo es el **punto de entrada** para cualquier agente que trabaje en este
> repositorio. NO es una biblia de reglas: es un **mapa**. Lee solo lo que
> necesites cuando lo necesites (divulgación progresiva).

---

## 1. Antes de empezar (obligatorio)

1. Ejecuta `./init.sh` y verifica que termina sin errores. Si falla, **para**
   y resuelve el entorno antes de tocar código.
2. Lee `progress/current.md` para entender en qué estado quedó la última sesión.
3. Lee `feature_list.json`. Toda feature nueva (`"sdd": true`) pasa por
   **Spec Driven Development** — ver `docs/specs.md` y §4 de este archivo.
4. Lee `docs/specs.md` antes de tocar cualquier spec o feature `sdd: true`.

## 2. Mapa del repositorio

| Archivo / carpeta      | Qué contiene                                                                                     | Cuándo leerlo                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| `feature_list.json`    | Lista de tareas con estado (`pending` / `spec_ready` / `in_progress` / `done` / `blocked`)       | Siempre, al empezar                                      |
| `progress/current.md`  | Estado de la sesión actual                                                                       | Siempre, al empezar                                      |
| `progress/history.md`  | Bitácora append-only de sesiones anteriores                                                      | Si necesitas contexto histórico                          |
| `specs/<feature>/`     | `requirements.md` + `design.md` + `tasks.md`                                                     | Antes de implementar cualquier feature con `"sdd": true` |
| `docs/architecture.md` | Arquitectura DDD/CQRS del proyecto — qué significa "hacer un buen trabajo" aquí                  | Antes de implementar                                     |
| `docs/conventions.md`  | Reglas de estilo, nombres, estructura, imports                                                   | Antes de escribir código                                 |
| `docs/specs.md`        | Proceso SDD: EARS notation, los 3 archivos, puerta de aprobación humana                          | Antes de redactar o leer un spec                         |
| `docs/verification.md` | Cómo verificar que tu trabajo funciona (trazabilidad, coverage, e2e)                             | Antes de declarar una tarea `done`                       |
| `CLAUDE.md`            | Instrucciones globales del proyecto + detalles de arquitectura                                   | Referencia completa                                      |
| `CHECKPOINTS.md`       | Criterios objetivos de "estado final correcto"                                                   | Para auto-evaluarte                                      |
| `.claude/agents/`      | Definiciones de subagentes (`leader`, `spec_author`, `implementer`, `reviewer`, `arch-guardian`) | Si orquestas trabajo                                     |
| `src/`                 | Código de la aplicación (NestJS, TypeScript)                                                     | Para implementar                                         |
| `test/`                | Tests e2e                                                                                        | Para verificar e2e                                       |

## 3. Reglas duras (no negociables)

- **Una sola feature a la vez.** No mezcles cambios de varias tareas en la misma sesión.
- **No declares una tarea `done` sin pruebas verdes.** Ejecuta `./init.sh` y
  asegúrate de que el bloque de tests pasa al 100%.
- **No saltes la fase de spec.** Toda feature con `"sdd": true` debe pasar
  por `spec_author` y obtener aprobación humana antes de tocar código.
- **No saltes la puerta de aprobación humana.** El leader detiene el flujo
  en `spec_ready` y espera.
- **Documenta lo que haces** en `progress/current.md` mientras trabajas, no al final.
- **Deja el repositorio limpio** antes de cerrar la sesión (ver §5).
- **Si no sabes algo, busca en `docs/`** antes de inventarlo.
- **Siempre filtra por `tenantId` y `deletedAt: null`** en queries — nunca omitir.

## 4. Flujo de trabajo (SDD)

```
/feature  →  spec_author  →  spec_ready  →  ⏸ HUMANO  →  in_progress
         →  implementer (/new-module si aplica)  →  reviewer  →  done  →  /ship
```

| Paso              | Quién      | Qué hace                                                                  |
| ----------------- | ---------- | ------------------------------------------------------------------------- |
| `/feature <desc>` | humano     | Crea GitHub issue + rama ligada                                           |
| `spec_author`     | agente     | Redacta `specs/<name>/{requirements,design,tasks}.md`, marca `spec_ready` |
| ⏸ aprobación      | **humano** | Lee el spec y dice "aprobado" o pide cambios                              |
| `implementer`     | agente     | Ejecuta `tasks.md`; usa `/new-module` si la feature es un módulo nuevo    |
| `reviewer`        | agente     | Valida trazabilidad R↔test y checkpoints; APPROVED o CHANGES_REQUESTED    |
| `/ship`           | agente     | Lint+test, commit Conventional Commits, push, abre PR                     |

1. El leader detecta la primera feature `pending` con `"sdd": true`.
2. Si no hay rama activa, el leader indica usar `/feature` primero.
3. El leader lanza `spec_author`, que crea los tres archivos de spec y marca `spec_ready`.
4. **Pausa.** El humano lee el spec y aprueba (o pide cambios).
5. Una vez aprobado, el leader cambia el status a `in_progress` y lanza `implementer`.
6. El implementer ejecuta `tasks.md` una a una (usa `/new-module` si aplica), marcándolas `[x]`.
7. El reviewer verifica trazabilidad `R<n>` ↔ test y tasks completas; aprueba o rechaza.
8. Si aprueba: el leader marca `done` en `feature_list.json`, el humano ejecuta `/ship`.

## 5. Cierre de sesión (lifecycle)

Antes de terminar:

1. Ejecuta `./init.sh` — todo verde.
2. Si la tarea está acabada: marca `status: "done"` en `feature_list.json`.
3. Mueve el resumen de `progress/current.md` al final de `progress/history.md`.
4. Vacía `progress/current.md` dejando solo la plantilla.
5. No dejes archivos temporales, `console.log` de debug, ni TODOs sin contexto.

## 6. Si te bloqueas

- Relee la sección relevante de `docs/`.
- Si la herramienta no hace lo que esperas, **no inventes un workaround**:
  documenta el bloqueo en `progress/current.md` y para la sesión.
