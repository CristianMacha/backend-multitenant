---
description: Valida (lint+test), commitea con Conventional Commits leyendo el diff real, hace push y abre el PR ligado al issue.
allowed-tools: Bash(git:*), Bash(pnpm lint:check), Bash(pnpm test), Bash(gh pr create:*), Bash(gh pr view:*), Bash(gh issue develop:*)
---

El usuario terminó de trabajar en la rama actual y quiere "enviarla": validar, commitear, subir y abrir el PR. Tú NO mergeas — ese paso lo hace él manualmente.

Ejecuta este flujo en orden y **detente en el primer paso que falle**, reportando el error en español:

1. **Comprueba que NO estás en `main`** (`git rev-parse --abbrev-ref HEAD`). Si estás en `main`, detente y avisa: el flujo es `/feature` primero. La rama `main` está protegida y rechazará el push.

2. **Entiende los cambios**: corre `git status` y `git diff HEAD` (incluye staged y unstaged). Lee el diff de verdad para redactar un commit preciso — no adivines.

3. **Valida localmente ANTES de commitear** (esto es lo que el usuario pidió):
   - `pnpm format`
   - `pnpm lint:check`
   - `pnpm test`
     Si algo falla, detente y reporta qué falló. NO commitees código que no pasa.

4. **Stagea y commitea** con un mensaje **Conventional Commits** derivado del diff, que pase commitlint (`@commitlint/config-conventional`):
   - Formato: `tipo(scope): subject` — tipo ∈ {feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert}.
   - `subject` en inglés, imperativo, minúscula inicial, sin punto final, header ≤ 100 chars.
   - El `scope` debe reflejar el módulo/contexto tocado (ej. `iam`, `tenancy`, `audit`, `outbox`, `core`).
   - Si hay varios cambios lógicamente distintos, haz **varios commits** coherentes (con el squash-merge del repo igual se colapsan, pero el historial de la rama queda limpio).
   - Usa `git add` de los archivos relevantes y luego `git commit`. Husky correrá `lint-staged` y `commitlint` automáticamente; si commitlint rechaza el mensaje, **corrígelo y reintenta** sin preguntar.
   - Termina los mensajes de commit con:
     ```
     Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
     ```

5. **Push**: `git push -u origin <rama-actual>`.

6. **Abre el PR**:
   - Detecta el número del issue ligado a la rama. Intenta `gh issue develop --list <rama>` o, si no, dedúcelo del nombre/historial; si no encuentras ninguno, abre el PR sin `Closes` y avísalo.
   - `gh pr create --fill` y asegúrate de que el body incluya `Closes #N` para que el merge cierre el issue.
   - El título del PR en inglés siguiendo Conventional Commits.

7. **Reporta al usuario** en español: URL del PR, que CI ya está corriendo, y que cuando esté verde haga el merge con:
   `gh pr merge --squash --delete-branch`

Reglas:

- Nunca hagas `git push origin main` ni intentes mergear: el merge es decisión del usuario.
- No uses `--no-verify` ni saltes Husky bajo ninguna circunstancia.
- Si no hay cambios que commitear y la rama ya está pusheada, salta directo a abrir/actualizar el PR.
