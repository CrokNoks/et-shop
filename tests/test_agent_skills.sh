#!/usr/bin/env bash
# ============================================================
# QA Test Suite — Agent Skills & Roles Validation
# Spec: Technical_Specification.md (F6, F7, Skills DevOps projet)
# Verifies:
#   - start_dev_stack.md exists at correct path
#   - stop_dev_stack.md exists at correct path
#   - devops.md agent role exists at correct path
#   - Skills contain required steps as per spec
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

pass() { echo "  [PASS] $1"; ((PASS++)); }
fail() { echo "  [FAIL] $1"; ((FAIL++)); }

assert_file_exists() {
  local file="$1"
  local label="$2"
  if [ -f "$file" ]; then
    pass "$label — file exists"
    return 0
  else
    fail "$label — file missing: $file"
    return 1
  fi
}

assert_file_contains() {
  local file="$1"
  local pattern="$2"
  local label="$3"
  if [ ! -f "$file" ]; then
    fail "$label — file missing"
    return
  fi
  if grep -qiE "$pattern" "$file"; then
    pass "$label"
  else
    fail "$label — pattern not found: $pattern"
  fi
}

# Resolve the FEAT directory inside engineer worktree
# Spec says: app_build/FEAT/.agents/skills/start_dev_stack.md
# FEAT = dev_env_docker (the feature_id from active.json)
FEAT_DIR="${CODE_ROOT}"
AGENTS_DIR="${FEAT_DIR}/.agents"

START_SKILL="${AGENTS_DIR}/skills/start_dev_stack.md"
STOP_SKILL="${AGENTS_DIR}/skills/stop_dev_stack.md"
DEVOPS_ROLE="${AGENTS_DIR}/agents/devops.md"

# ────────────────────────────────────────────
echo ""
echo "=== [1] Skill Files Existence (F6, F7) ==="
assert_file_exists "$START_SKILL" "start_dev_stack.md skill (F6)"
assert_file_exists "$STOP_SKILL"  "stop_dev_stack.md skill"
assert_file_exists "$DEVOPS_ROLE" "devops.md agent role (F7)"

# ────────────────────────────────────────────
echo ""
echo "=== [2] start_dev_stack.md — Required Steps ==="
# Spec step 1: port detection
assert_file_contains "$START_SKILL" "port.*libre|free.*port|ss -tlnp|lsof.*-i|detect" \
  "start_dev_stack.md covers step 1: detect free ports"
# Spec step 2: env generation
assert_file_contains "$START_SKILL" "\.env|env.*instance|génér" \
  "start_dev_stack.md covers step 2: generate .env for instance"
# Spec step 3: docker compose up
assert_file_contains "$START_SKILL" "docker compose.*up|compose.*-p" \
  "start_dev_stack.md covers step 3: docker compose up"
# Spec step 4: health check
assert_file_contains "$START_SKILL" "health.*check|curl|health|kong|200" \
  "start_dev_stack.md covers step 4: health check"
# Spec step 5: migrations
assert_file_contains "$START_SKILL" "migrat" \
  "start_dev_stack.md covers step 5: migrations"
# Spec step 6: report to active.json
assert_file_contains "$START_SKILL" "active\.json|dev_stack|port_web|port_studio" \
  "start_dev_stack.md covers step 6: write result to active.json"

# ────────────────────────────────────────────
echo ""
echo "=== [3] stop_dev_stack.md — Required Steps ==="
# Spec step 1: read project name from active.json or --all flag
assert_file_contains "$STOP_SKILL" "active\.json|PROJECT_NAME|--all" \
  "stop_dev_stack.md covers step 1: read target from active.json"
# Spec step 2: docker compose down
assert_file_contains "$STOP_SKILL" "docker compose.*down|compose.*down" \
  "stop_dev_stack.md covers step 2: docker compose down"
# Spec step 3: network cleanup
assert_file_contains "$STOP_SKILL" "network|réseau|nettoyage" \
  "stop_dev_stack.md covers step 3: network cleanup"
# Spec step 4: update active.json
assert_file_contains "$STOP_SKILL" "active\.json|dev_stack.*null|null" \
  "stop_dev_stack.md covers step 4: update active.json dev_stack to null"

# ────────────────────────────────────────────
echo ""
echo "=== [4] devops.md Agent Role — Required Behavior (F7) ==="
assert_file_contains "$DEVOPS_ROLE" "start_dev_stack|démarrer|start" \
  "devops.md references start_dev_stack for starting"
assert_file_contains "$DEVOPS_ROLE" "stop_dev_stack|arrêter|stop" \
  "devops.md references stop_dev_stack for stopping"
assert_file_contains "$DEVOPS_ROLE" "active\.json|résultat|rapport" \
  "devops.md mentions reporting result to active.json"

# ────────────────────────────────────────────
echo ""
echo "=== [5] Port Detection Logic in start_dev_stack.md ==="
# Must detect 2 ports: one from 3000 (web) and one from 54323 (studio)
assert_file_contains "$START_SKILL" "3000" \
  "start_dev_stack.md references default web port 3000 for detection"
assert_file_contains "$START_SKILL" "54323" \
  "start_dev_stack.md references default studio port 54323 for detection"

# ────────────────────────────────────────────
echo ""
echo "──────────────────────────────────────────"
echo "Results: ${PASS} passed, ${FAIL} failed"
echo "──────────────────────────────────────────"
[ "${FAIL}" -eq 0 ] && exit 0 || exit 1
