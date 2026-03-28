#!/usr/bin/env bash
# ============================================================
# QA Test Suite — Default Port Conflict Detection
# Spec: Technical_Specification.md (Paramètres configurables)
# Verifies:
#   - All default ports are declared in .env.template
#   - Default ports are not conflicting with each other
#   - Each port has a unique default value
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

ENV_TEMPLATE="${CODE_ROOT}/docker/.env.template"

pass() { echo "  [PASS] $1"; ((PASS++)); }
fail() { echo "  [FAIL] $1"; ((FAIL++)); }

# ────────────────────────────────────────────
echo ""
echo "=== [1] .env.template Existence ==="
if [ -f "$ENV_TEMPLATE" ]; then
  pass ".env.template exists at docker/.env.template"
else
  fail ".env.template missing at docker/.env.template"
  echo "  Subsequent port tests will be skipped."
  echo ""
  echo "Results: ${PASS} passed, ${FAIL} failed"
  [ "${FAIL}" -eq 0 ] && exit 0 || exit 1
fi

# ────────────────────────────────────────────
echo ""
echo "=== [2] Required Variables Declared ==="

declare -A EXPECTED_VARS
EXPECTED_VARS=(
  [PORT_WEB]="3000"
  [PORT_API]="3001"
  [PORT_STUDIO]="54323"
  [PORT_DB]="54322"
  [PORT_KONG]="54321"
  [PORT_INBUCKET]="54324"
  [POSTGRES_PASSWORD]=""
  [JWT_SECRET]=""
  [ANON_KEY]=""
  [SERVICE_ROLE_KEY]=""
)

for var in "${!EXPECTED_VARS[@]}"; do
  if grep -qE "^${var}=" "$ENV_TEMPLATE" 2>/dev/null || grep -qE "^#.*${var}=" "$ENV_TEMPLATE" 2>/dev/null || grep -q "${var}" "$ENV_TEMPLATE" 2>/dev/null; then
    pass ".env.template declares ${var}"
  else
    fail ".env.template missing ${var}"
  fi
done

# ────────────────────────────────────────────
echo ""
echo "=== [3] Default Port Uniqueness (No Internal Conflicts) ==="

# Extract port values from .env.template
# Matches lines like PORT_WEB=3000 or PORT_WEB="3000"
declare -A PORT_VALUES

while IFS='=' read -r key value; do
  # Skip comment lines and empty lines
  [[ "$key" =~ ^#.*$ ]] && continue
  [[ -z "$key" ]] && continue
  # Only process PORT_* variables
  [[ "$key" =~ ^PORT_ ]] || continue
  # Strip quotes and whitespace from value
  value="${value//\"/}"
  value="${value//\'/}"
  value="${value// /}"
  # Skip empty values (means user must provide)
  [[ -z "$value" ]] && continue
  PORT_VALUES["$key"]="$value"
done < "$ENV_TEMPLATE"

# Check that port values are unique
declare -A SEEN_PORTS
CONFLICT_FOUND=0

for var in "${!PORT_VALUES[@]}"; do
  port="${PORT_VALUES[$var]}"
  if [[ -v SEEN_PORTS["$port"] ]]; then
    fail "Port conflict: ${var}=${port} conflicts with ${SEEN_PORTS[$port]}=${port}"
    CONFLICT_FOUND=1
  else
    SEEN_PORTS["$port"]="$var"
    pass "Port ${var}=${port} — unique"
  fi
done

if [ "${CONFLICT_FOUND}" -eq 0 ] && [ "${#SEEN_PORTS[@]}" -gt 0 ]; then
  pass "All declared default ports are unique (${#SEEN_PORTS[@]} ports checked)"
fi

# ────────────────────────────────────────────
echo ""
echo "=== [4] Spec-Defined Default Values ==="

# Validate specific expected defaults from the spec
check_default() {
  local var="$1"
  local expected="$2"
  if [[ -v PORT_VALUES["$var"] ]]; then
    if [ "${PORT_VALUES[$var]}" = "$expected" ]; then
      pass "${var} default is ${expected} (matches spec)"
    else
      fail "${var} default is ${PORT_VALUES[$var]}, expected ${expected} per spec"
    fi
  else
    fail "${var} not found or has no default in .env.template"
  fi
}

check_default "PORT_WEB"      "3000"
check_default "PORT_API"      "3001"
check_default "PORT_STUDIO"   "54323"
check_default "PORT_DB"       "54322"
check_default "PORT_KONG"     "54321"
check_default "PORT_INBUCKET" "54324"

# ────────────────────────────────────────────
echo ""
echo "=== [5] Port Range Validity ==="

for var in "${!PORT_VALUES[@]}"; do
  port="${PORT_VALUES[$var]}"
  if [[ "$port" =~ ^[0-9]+$ ]]; then
    if [ "$port" -ge 1 ] && [ "$port" -le 65535 ]; then
      pass "${var}=${port} is in valid port range (1-65535)"
    else
      fail "${var}=${port} is out of valid port range"
    fi
  else
    fail "${var}=${port} is not a valid integer port number"
  fi
done

# ────────────────────────────────────────────
echo ""
echo "──────────────────────────────────────────"
echo "Results: ${PASS} passed, ${FAIL} failed"
echo "──────────────────────────────────────────"
[ "${FAIL}" -eq 0 ] && exit 0 || exit 1
