---
description: Crea un GitHub issue detallado (en inglés) a partir de tu intención y abre una rama ligada a él.
argument-hint: <qué vas a implementar, en español o inglés>
allowed-tools: Bash(gh issue create:*), Bash(gh issue develop:*), Bash(gh issue view:*), Bash(git branch:*), Bash(git rev-parse:*), Bash(git status:*)
---

El usuario quiere arrancar una nueva unidad de trabajo. Su intención (puede venir en español):

> $ARGUMENTS

Tu tarea, end-to-end:

1. **Redacta un GitHub issue claro y detallado, SIEMPRE en inglés**, aunque la intención venga en español. Estructura el body en Markdown con estas secciones:
   - **Context** — por qué se necesita, en 1-2 frases.
   - **Scope** — qué entra (y, si aplica, qué NO entra).
   - **Acceptance criteria** — checklist `- [ ]` de condiciones verificables.
   - Si toca un módulo de negocio, menciona el bounded context / módulo afectado siguiendo la arquitectura del repo (ver CLAUDE.md: contexts/iam, tenancy, audit, etc.).
   - El título debe ser conciso, imperativo y en inglés (sin punto final).

2. **Determina el tipo de cambio** (`feat`, `fix`, `chore`, `refactor`, `docs`, `perf`, `test`) y un **slug kebab-case** corto para la rama. El nombre de rama será `<tipo>/<slug>`.

3. **Crea el issue**: `gh issue create -t "<título>" -b "<body>"`. Captura el número del issue de la URL devuelta.

4. **Crea y haz checkout de la rama ligada al issue**:
   `gh issue develop <N> -c -b main -n <tipo>/<slug>`
   (`-c` hace checkout, `-b main` la basa en main, queda enlazada al issue para que el PR lo cierre luego).

5. **Confirma al usuario** en español, breve: número y URL del issue, nombre de la rama creada, y recuérdale que cuando termine ejecute `/ship`.

Reglas:

- No empieces a escribir código ni a modificar archivos del proyecto: este comando SOLO crea el issue y la rama.
- Si `$ARGUMENTS` viene vacío, pídele al usuario que describa qué va a implementar y detente.
- Si la intención es ambigua, haz como mucho una pregunta de aclaración antes de crear el issue; si es razonablemente clara, procede con tu mejor interpretación.
