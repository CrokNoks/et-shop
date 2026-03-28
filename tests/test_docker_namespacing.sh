#!/usr/bin/env bash
# ============================================================
# QA Test Suite — Docker Namespacing Consistency
# Spec: Technical_Specification.md (Namespacing des instances + NF2/NF3/NF4)
# Verifies:
#   - compose.yml uses correct project/network/volume naming patterns
#   - PROJECT_NAME follows etshop_<PORT_WEB> convention
#   - Labels are applied on services
#   - Networks are bridge and not shared
#   - Volumes use PROJECT_NAME prefix
# ============================================================

set -euo pipefail

PASS=0
FAIL=0
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if [ -d "${REPO_ROOT}/dev_env_docker/engineer" ]; then
  CODE_ROOT="${REPO_ROOT}/dev_env_docker/engineer"
else
  CODE_ROOT="${REPO_ROOT}"
fi

COMPOSE_FILE="${CODE_ROOT}/docker/compose.yml"

pass() { echo "  [PASS] $1"; ((PASS++)); }
fail() { echo "  [FAIL] $1"; ((FAIL++)); }

assert_compose_contains() {
  local pattern="$1"
  local label="$2"
  if [ ! -f "$COMPOSE_FILE" ]; then
    fail "$label — compose.yml missing"
    return
  fi
  if grep -qE "$pattern" "$COMPOSE_FILE"; then
    pass "$label"
  else
    fail "$label — pattern not found: $pattern"
  fi
}

# ────────────────────────────────────────────
echo ""
echo "=== [1] compose.yml Existence ==="
if [ -f "$COMPOSE_FILE" ]; then
  pass "docker/compose.yml exists"
else
  fail "docker/compose.yml missing"
  echo ""
  echo "Results: ${PASS} passed, ${FAIL} failed"
  [ "${FAIL}" -eq 0 ] && exit 0 || exit 1
fi

# ────────────────────────────────────────────
echo ""
echo "=== [2] Required Services Defined (F1) ==="
assert_compose_contains "^\s+web:" "Service 'web' defined"
assert_compose_contains "^\s+api:" "Service 'api' defined"
# Supabase stack — at minimum db/postgres service must exist
assert_compose_contains "^\s+(db|postgres|supabase-db):" "Supabase DB service defined"

# ────────────────────────────────────────────
echo ""
echo "=== [3] Port Parameterization (F2) ==="
# Ports must use env variable substitution, not hard-coded values
assert_compose_contains '\$\{?PORT_WEB'   "PORT_WEB variable used for web port mapping"
assert_compose_contains '\$\{?PORT_STUDIO|\$\{?PORT_KONG' "PORT_STUDIO or PORT_KONG variable used for Supabase Studio/Kong"

# ────────────────────────────────────────────
echo ""
echo "=== [4] Docker Compose Namespacing (NF2) ==="
# compose.yml itself doesn't include -p flag (that's the CLI call)
# But compose.yml should reference PROJECT_NAME for volume/network names
# OR rely on docker compose -p which prefixes everything automatically
# The spec says: docker compose -p etshop_<PORT_WEB>
# We verify the scripts use -p, not the compose.yml itself
DEV_UP="${CODE_ROOT}/scripts/dev-up.sh"
if [ -f "$DEV_UP" ]; then
  if grep -qE "docker compose.*-p.*etshop_|\-p.*\$\{?PROJECT_NAME" "$DEV_UP"; then
    pass "dev-up.sh uses 'docker compose -p <PROJECT_NAME>' for namespacing (NF2)"
  elif grep -qE "\-p.*etshop_|\bPROJECT_NAME\b" "$DEV_UP"; then
    pass "dev-up.sh references PROJECT_NAME for namespacing (NF2)"
  else
    fail "dev-up.sh does not appear to use -p PROJECT_NAME for docker compose namespacing (NF2)"
  fi
else
  fail "dev-up.sh missing — cannot verify NF2 namespacing"
fi

# ────────────────────────────────────────────
echo ""
echo "=== [5] Project Name Convention (etshop_<PORT_WEB>) ==="
if [ -f "$DEV_UP" ]; then
  if grep -qE 'PROJECT_NAME.*etshop_|etshop_.*PORT_WEB|PROJECT_NAME.*=.*etshop' "$DEV_UP"; then
    pass "dev-up.sh sets PROJECT_NAME=etshop_<PORT_WEB>"
  elif grep -qE 'etshop_\$' "$DEV_UP"; then
    pass "dev-up.sh uses etshop_ prefix in project name"
  else
    fail "dev-up.sh may not follow PROJECT_NAME=etshop_<PORT_WEB> convention from spec"
  fi
fi

# ────────────────────────────────────────────
echo ""
echo "=== [6] Instance Labels on Services (NF4 / dev-list.sh dependency) ==="
# Spec: label dev.etshop.instance=etshop_<PORT_WEB> on each container
assert_compose_contains "dev\.etshop\.instance" "Services have label dev.etshop.instance"

# ────────────────────────────────────────────
echo ""
echo "=== [7] Isolated Bridge Network Per Instance (NF4) ==="
# compose.yml must declare a network with driver: bridge
assert_compose_contains "driver:\s*bridge" "Network uses driver: bridge (NF4)"
# There should be NO external: true networks (shared networks would be external)
if grep -qE "external:\s*true" "$COMPOSE_FILE"; then
  fail "compose.yml has external network (shared across instances) — violates NF4"
else
  pass "compose.yml has no external network (instance-isolated) — NF4 OK"
fi

# ────────────────────────────────────────────
echo ""
echo "=== [8] Volume Declarations (NF3) ==="
# compose.yml must declare named volumes that will be prefixed by docker compose -p
assert_compose_contains "^volumes:" "Top-level volumes section declared (NF3)"
# At minimum a db data volume must exist
assert_compose_contains "db_data|postgres_data|supabase_db" "DB data volume declared (NF3)"

# ────────────────────────────────────────────
echo ""
echo "=== [9] YAML Validity (basic check) ==="
if command -v python3 &>/dev/null; then
  if python3 -c "import yaml; yaml.safe_load(open('${COMPOSE_FILE}'))" 2>/dev/null; then
    pass "docker/compose.yml is valid YAML (python3 yaml)"
  else
    fail "docker/compose.yml failed YAML validation"
    python3 -c "import yaml; yaml.safe_load(open('${COMPOSE_FILE}'))" 2>&1 || true
  fi
elif command -v yq &>/dev/null; then
  if yq eval '.' "$COMPOSE_FILE" > /dev/null 2>&1; then
    pass "docker/compose.yml is valid YAML (yq)"
  else
    fail "docker/compose.yml failed YAML validation (yq)"
  fi
else
  # Fallback: check for tabs (YAML doesn't allow tabs for indentation)
  if grep -P '^\t' "$COMPOSE_FILE" > /dev/null 2>&1; then
    fail "docker/compose.yml contains tab indentation (invalid YAML)"
  else
    pass "docker/compose.yml has no tab indentation (basic YAML check passed)"
  fi
fi

# ────────────────────────────────────────────
echo ""
echo "=== [10] .env.template Completeness ==="
ENV_TEMPLATE="${CODE_ROOT}/docker/.env.template"
if [ -f "$ENV_TEMPLATE" ]; then
  pass ".env.template exists alongside compose.yml"
else
  fail ".env.template missing from docker/ directory"
fi

# ────────────────────────────────────────────
echo ""
echo "──────────────────────────────────────────"
echo "Results: ${PASS} passed, ${FAIL} failed"
echo "──────────────────────────────────────────"
[ "${FAIL}" -eq 0 ] && exit 0 || exit 1
