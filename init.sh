#!/usr/bin/env bash
# init.sh — Verificación del entorno para backend-bear
# Ejecuta al COMENZAR cada sesión y antes de declarar cualquier feature done.
# Si falla, no avanzar.

set -u
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

ok()   { printf "${GREEN}[OK]${NC}    %s\n" "$1"; }
warn() { printf "${YELLOW}[WARN]${NC}  %s\n" "$1"; }
fail() { printf "${RED}[FAIL]${NC}  %s\n" "$1"; }

EXIT_CODE=0

echo "── 1. Verificando entorno ─────────────────────────────"

if ! command -v node >/dev/null 2>&1; then
  fail "node no está instalado"
  exit 1
fi
ok "node -> $(node --version)"

if ! command -v pnpm >/dev/null 2>&1; then
  fail "pnpm no está instalado"
  exit 1
fi
ok "pnpm -> $(pnpm --version)"

echo ""
echo "── 2. Verificando archivos base del arnés ──────────────"

for f in AGENTS.md feature_list.json progress/current.md docs/architecture.md docs/conventions.md docs/verification.md CHECKPOINTS.md; do
  if [ ! -f "$f" ]; then
    fail "Falta archivo base: $f"
    EXIT_CODE=1
  else
    ok "Existe $f"
  fi
done

echo ""
echo "── 3. Validando feature_list.json y specs ─────────────"

node <<'JS'
const fs = require('fs');
try {
  const data = JSON.parse(fs.readFileSync('feature_list.json', 'utf-8'));
  const valid = new Set(['pending', 'spec_ready', 'in_progress', 'done', 'blocked']);
  const inProgress = data.features.filter(f => f.status === 'in_progress');
  if (inProgress.length > 1) {
    console.log(`[FAIL]  Hay ${inProgress.length} features en in_progress (máximo 1)`);
    process.exit(1);
  }
  const requiresSpec = new Set(['spec_ready', 'in_progress', 'done']);
  const errors = [];
  for (const f of data.features) {
    if (!valid.has(f.status)) {
      console.log(`[FAIL]  Estado inválido en feature ${f.id}: ${f.status}`);
      process.exit(1);
    }
    if (f.sdd && requiresSpec.has(f.status)) {
      const specDir = `specs/${f.name}`;
      for (const fname of ['requirements.md', 'design.md', 'tasks.md']) {
        if (!fs.existsSync(`${specDir}/${fname}`)) {
          errors.push(`feature ${f.id} (${f.name}) en ${f.status} sin ${specDir}/${fname}`);
        }
      }
    }
  }
  if (errors.length) {
    errors.forEach(e => console.log(`[FAIL]  ${e}`));
    process.exit(1);
  }
  console.log(`[OK]    feature_list.json válido (${data.features.length} features)`);
  console.log('[OK]    Specs presentes para features sdd con estado no-pending');
} catch (e) {
  console.log(`[FAIL]  feature_list.json o specs inválidos: ${e.message}`);
  process.exit(1);
}
JS

if [ $? -ne 0 ]; then EXIT_CODE=1; fi

echo ""
echo "── 4. Lint ─────────────────────────────────────────────"

if pnpm lint:check 2>&1; then
  ok "Lint limpio"
else
  fail "Errores de lint — ejecuta 'pnpm lint' para detalles"
  EXIT_CODE=1
fi

echo ""
echo "── 5. Build / type-check ───────────────────────────────"

if pnpm build 2>&1; then
  ok "Build exitoso (TypeScript sin errores)"
else
  fail "Build fallido — ejecuta 'pnpm build' para detalles"
  EXIT_CODE=1
fi

echo ""
echo "── 6. Tests unitarios ──────────────────────────────────"

if pnpm test 2>&1; then
  ok "Todos los tests pasan"
else
  fail "Hay tests rotos"
  EXIT_CODE=1
fi

echo ""
echo "── 7. Resumen ──────────────────────────────────────────"

if [ $EXIT_CODE -eq 0 ]; then
  ok "Entorno listo. Puedes empezar a trabajar."
else
  fail "Entorno NO está listo. Resuelve los errores antes de avanzar."
fi

exit $EXIT_CODE
