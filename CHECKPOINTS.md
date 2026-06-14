# CHECKPOINTS — Evaluación del estado final

> En sistemas multi-agente no se evalúa el camino, se evalúa el destino.
> Estos son los checkpoints objetivos que un revisor (humano o IA) puede usar
> para decidir si el repositorio está sano.

## C1 — El arnés está completo

- [ ] Existen los archivos base: `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md`.
- [ ] Existen los docs: `docs/architecture.md`, `docs/conventions.md`, `docs/verification.md`.
- [ ] `./init.sh` termina con exit code 0.

## C2 — El estado es coherente

- [ ] Como mucho una feature en `in_progress` en `feature_list.json`.
- [ ] Toda feature `done` tiene tests asociados que pasan.
- [ ] `progress/current.md` está vacío o describe solo la sesión activa.

## C3 — El código respeta la arquitectura DDD

- [ ] Cada módulo nuevo sigue las 4 capas: `domain/`, `application/`, `infrastructure/`, `presentation/`.
- [ ] Los handlers de comando van a través del repositorio y el agregado.
- [ ] Los handlers de query usan `PrismaService` directamente (no el repositorio).
- [ ] No hay importaciones cruzadas entre contextos (un contexto no importa internals de otro).
- [ ] `platform/` y `shared/` no dependen de `contexts/`.

## C4 — La verificación es real

- [ ] `pnpm test` verde (cobertura ≥ 80% global).
- [ ] `pnpm build` sin errores de TypeScript.
- [ ] `pnpm lint:check` sin errores de ESLint.
- [ ] Cada handler de comando tiene su `.spec.ts` junto al handler.

## C5 — Seguridad y multi-tenancy

- [ ] Toda query filtra por `tenantId` y `deletedAt: null` — nunca omitidos.
- [ ] Todo endpoint nuevo está protegido con `@Permissions(...)`, `@Roles(...)` o `@PlatformAdmin()`.
- [ ] Rutas de solo plataforma usan `@PlatformAdmin()` + `PlatformAdminGuard`.
- [ ] No hay hard-delete: todo usa soft-delete (`deletedAt`).
- [ ] Módulos que asignan roles o permisos llaman `assertCanGrantPermissions()`.

## C6 — Eventos de dominio y trazabilidad de auditoría

- [ ] Toda mutación del agregado emite un domain event.
- [ ] Los handlers llaman `pullDomainEvents()` y pasan los eventos a `repository.save(aggregate, events)`.
- [ ] `save()` en la implementación del repositorio llama `writeToOutbox(tx, events)`.
- [ ] En-proceso `EventBus.publishAll(events)` se llama después del save para handlers de baja latencia.

## C7 — Sesión cerrada correctamente

- [ ] No hay archivos sin trackear sospechosos (`.tmp`, `dist/` fuera del `.gitignore`).
- [ ] `progress/history.md` tiene una entrada por la última sesión trabajada.
- [ ] La feature trabajada refleja su estado correcto en `feature_list.json`.

## C8 — Spec Driven Development

- [ ] Toda feature con `"sdd": true` en estado `spec_ready`, `in_progress` o `done` tiene
      su carpeta `specs/<name>/` con `requirements.md`, `design.md` y `tasks.md`.
- [ ] `requirements.md` usa EARS estricto (ver `docs/specs.md`).
- [ ] Toda feature `done` con `"sdd": true` tiene todas sus tasks marcadas `[x]`.
- [ ] Cada `R<n>` de `requirements.md` está cubierto por al menos un test concreto.

---

**Uso:** el agente `reviewer` recorre cada checkbox, marca `[x]` o `[ ]`, y rechaza
el cierre si quedan items vacíos en C1-C8.
