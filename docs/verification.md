# Verificación de trabajo

> Usa este doc antes de declarar cualquier tarea como `done`.
> El criterio mínimo: `./init.sh` termina con exit 0.

## 1. Verificación rápida (siempre)

```bash
./init.sh
```

Verifica en orden: entorno → archivos base → feature_list.json → lint → build → tests.
Si cualquier bloque falla, **para y resuelve antes de continuar**.

## 2. Tests unitarios

```bash
pnpm test                              # todos
pnpm test -- path/to/file.spec.ts      # archivo concreto
pnpm test -- -t "nombre del test"      # por nombre
pnpm test:cov                          # con cobertura (umbral 80% global)
```

- Los specs viven junto a sus handlers: `create-x.handler.spec.ts` en `application/create-x/`.
- Cada `R<n>` del spec debe tener al menos un test que lo verifique.
- La cobertura cae de 80%? → añadir tests antes de cerrar la feature.

## 3. Type-check

```bash
pnpm build
```

Compila el proyecto completo. Si hay errores de TypeScript, el build falla.
Es el type-check más fiable del proyecto (más rápido que `tsc --noEmit` solo).

## 4. Lint

```bash
pnpm lint          # fix automático
pnpm lint:check    # solo verificación (el que usa init.sh y CI)
```

## 5. Trazabilidad de requirements

Antes de marcar una feature `done`, confirmar en `progress/impl_<name>.md`:

```markdown
## Trazabilidad

- R1 → nombre-del-test
- R2 → nombre-del-test
  ...
```

Cada `R<n>` de `specs/<name>/requirements.md` debe aparecer mapeado a un test real.

## 6. Verificación del reviewer (arch-guardian)

Para features complejas, lanzar el agente `arch-guardian` antes del cierre:

```
Agent(subagent_type: "arch-guardian", ...)
```

Verifica: importaciones cross-context, tenant isolation, soft-delete, domain events,
endpoints protegidos, caché de auth. Ver `.claude/agents/arch-guardian.md`.

## 7. Tests e2e (opcional, requiere infraestructura)

```bash
docker compose up -d postgres redis   # infraestructura local
pnpm prisma:migrate
pnpm prisma:seed
pnpm test:e2e
```

Los e2e requieren un `.env` válido con credenciales Firebase reales.
Solo necesarios si la feature toca la capa de presentación de forma no trivial.

## 8. Lista de verificación final pre-cierre

- [ ] `./init.sh` verde.
- [ ] Todos los `R<n>` tienen test.
- [ ] Todas las tasks en `tasks.md` marcadas `[x]`.
- [ ] `progress/impl_<name>.md` con mapa de trazabilidad completo.
- [ ] Reviewer aprobó (`APPROVED -> progress/review_<name>.md`).
- [ ] Feature marcada `done` en `feature_list.json`.
- [ ] Resumen movido de `progress/current.md` a `progress/history.md`.
