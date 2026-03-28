#!/usr/bin/env bash
# ============================================================
# QA Test Suite — Bash Script Syntax Validation
# Spec: Technical_Specification.md
# Coverage: scripts/dev-up.sh, scripts/dev-down.sh, scripts/dev-list.sh
# ============================================================

set -euo pipefail

PASS=0
FAIL=0
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Resolve the actual codebase root (engineer worktree or merged branch)
# Try engineer worktree first, then fall back to repo root
if [ -d "${REPO_ROOT}/dev_env_docker/engineer" ]; then
  CODE_ROOT="${REPO_ROOT}/dev_env_docker/engineer"
else
  CODE_ROOT="${REPO_ROOT}"
fi

pass() { echo "  [PASS] $1"; ((PASS++)); }
fail() { echo "  [FAIL] $1"; ((FAIL++)); }

assert_file_exists() {
  local file="$1"
  local label="$2"
  if [ -f "$file" ]; then
    pass "$label — file exists"
  else
    fail "$label — file missing: $file"
  fi
}

assert_bash_syntax() {
  local file="$1"
  local label="$2"
  if [ ! -f "$file" ]; then
    fail "$label — file missing, cannot check syntax"
    return
  fi
  if bash -n "$file" 2>/dev/null; then
    pass "$label — bash syntax OK"
  else
    fail "$label — bash syntax errors found"
    bash -n "$file" || true
  fi
}

assert_executable_or_has_shebang() {
  local file="$1"
  local label="$2"
  if [ ! -f "$file" ]; then
    fail "$label — file missing"
    return
  fi
  local first_line
  first_line=$(head -1 "$file")
  if [[ "$first_line" == "#!/"* ]]; then
    pass "$label — has shebang"
  else
    fail "$label — missing shebang on line 1 (got: $first_line)"
  fi
}

assert_script_contains() {
  local file="$1"
  local pattern="$2"
  local label="$3"
  if [ ! -f "$file" ]; then
    fail "$label — file missing"
    return
  fi
  if grep -qE "$pattern" "$file"; then
    pass "$label — pattern found: $pattern"
  else
    fail "$label — pattern not found: $pattern"
  fi
}

# ────────────────────────────────────────────
echo ""
echo "=== [1] File Existence Checks ==="
assert_file_exists "${CODE_ROOT}/scripts/dev-up.sh"   "scripts/dev-up.sh"
assert_file_exists "${CODE_ROOT}/scripts/dev-down.sh" "scripts/dev-down.sh"
assert_file_exists "${CODE_ROOT}/scripts/dev-list.sh" "scripts/dev-list.sh"

# ────────────────────────────────────────────
echo ""
echo "=== [2] Bash Syntax Validation ==="
assert_bash_syntax "${CODE_ROOT}/scripts/dev-up.sh"   "dev-up.sh syntax"
assert_bash_syntax "${CODE_ROOT}/scripts/dev-down.sh" "dev-down.sh syntax"
assert_bash_syntax "${CODE_ROOT}/scripts/dev-list.sh" "dev-list.sh syntax"

# ────────────────────────────────────────────
echo ""
echo "=== [3] Shebang Checks ==="
assert_executable_or_has_shebang "${CODE_ROOT}/scripts/dev-up.sh"   "dev-up.sh shebang"
assert_executable_or_has_shebang "${CODE_ROOT}/scripts/dev-down.sh" "dev-down.sh shebang"
assert_executable_or_has_shebang "${CODE_ROOT}/scripts/dev-list.sh" "dev-list.sh shebang"

# ────────────────────────────────────────────
echo ""
echo "=== [4] dev-up.sh — Required Logic Patterns ==="
DEV_UP="${CODE_ROOT}/scripts/dev-up.sh"
# F2: ports must be configurable
assert_script_contains "$DEV_UP" "port[-_]?web|PORT_WEB"           "dev-up.sh accepts --port-web or PORT_WEB"
assert_script_contains "$DEV_UP" "port[-_]?studio|PORT_STUDIO"     "dev-up.sh accepts --port-studio or PORT_STUDIO"
# F3: project name namespacing
assert_script_contains "$DEV_UP" "docker compose.*-p|PROJECT_NAME" "dev-up.sh uses docker compose -p (namespacing)"
# NF2: project name pattern
assert_script_contains "$DEV_UP" "etshop_"                         "dev-up.sh uses etshop_ prefix for PROJECT_NAME"
# F1: must run docker compose up
assert_script_contains "$DEV_UP" "docker compose.*up"              "dev-up.sh runs docker compose up"

# ────────────────────────────────────────────
echo ""
echo "=== [5] dev-down.sh — Required Logic Patterns ==="
DEV_DOWN="${CODE_ROOT}/scripts/dev-down.sh"
# F4: must accept --port-web
assert_script_contains "$DEV_DOWN" "port[-_]?web|PORT_WEB"         "dev-down.sh accepts --port-web or PORT_WEB"
# Must run docker compose down
assert_script_contains "$DEV_DOWN" "docker compose.*down"          "dev-down.sh runs docker compose down"
# Namespacing
assert_script_contains "$DEV_DOWN" "etshop_|-p"                    "dev-down.sh uses project namespacing"

# ────────────────────────────────────────────
echo ""
echo "=== [6] dev-list.sh — Required Logic Patterns ==="
DEV_LIST="${CODE_ROOT}/scripts/dev-list.sh"
# F5: must list active instances
assert_script_contains "$DEV_LIST" "docker ps"                     "dev-list.sh uses docker ps"
# Must filter by label per spec
assert_script_contains "$DEV_LIST" "dev\.etshop\.instance|label"   "dev-list.sh filters by label dev.etshop.instance"

# ────────────────────────────────────────────
echo ""
echo "=== [7] No Hard-coded Conflicting Ports ==="
# Verify scripts don't hard-code specific ports without making them configurable
# All port references should use variables
for script in "$DEV_UP" "$DEV_DOWN" "$DEV_LIST"; do
  if [ ! -f "$script" ]; then continue; fi
  script_name=$(basename "$script")
  # Hard-coded bare port numbers that bypass the variable mechanism are suspicious
  # We allow default values, but raw docker -p HOST:CONTAINER with literals only is a smell
  if grep -qE '^\s*-p [0-9]+:[0-9]+' "$script" 2>/dev/null; then
    fail "$script_name — has hard-coded port mapping without variable (potential conflict risk)"
  else
    pass "$script_name — no bare hard-coded port mappings found"
  fi
done

# ────────────────────────────────────────────
echo ""
echo "──────────────────────────────────────────"
echo "Results: ${PASS} passed, ${FAIL} failed"
echo "──────────────────────────────────────────"
[ "${FAIL}" -eq 0 ] && exit 0 || exit 1
