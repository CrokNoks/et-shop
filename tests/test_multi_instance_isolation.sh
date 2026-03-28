#!/usr/bin/env bash
# ============================================================
# QA Test Suite — Multi-Instance Isolation Verification
# Spec: Technical_Specification.md (F3, NF2, NF3, NF4)
# Verifies that the infrastructure guarantees no conflict between
# two simultaneous instances by analyzing configuration structure.
# NOTE: These are static analysis tests (no Docker daemon required).
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
ENV_TEMPLATE="${CODE_ROOT}/docker/.env.template"
DEV_UP="${CODE_ROOT}/scripts/dev-up.sh"

pass() { echo "  [PASS] $1"; ((PASS++)); }
fail() { echo "  [FAIL] $1"; ((FAIL++)); }

# ────────────────────────────────────────────
echo ""
echo "=== [1] Project Naming — Instance Uniqueness (F3, NF2) ==="
# Each instance has a unique PROJECT_NAME = etshop_<PORT_WEB>
# Verify dev-up.sh constructs unique PROJECT_NAME per port
if [ -f "$DEV_UP" ]; then
  # Check that PROJECT_NAME or the compose -p argument includes PORT_WEB
  if grep -qE '(PROJECT_NAME|compose.*-p).*PORT_WEB|(etshop_"\$\{?PORT_WEB|\$PORT_WEB)' "$DEV_UP"; then
    pass "dev-up.sh builds PROJECT_NAME from PORT_WEB — guarantees uniqueness per instance"
  elif grep -qE 'etshop_' "$DEV_UP" && grep -qE 'PORT_WEB' "$DEV_UP"; then
    pass "dev-up.sh references both etshop_ prefix and PORT_WEB — likely correct namespacing"
  else
    fail "dev-up.sh may not guarantee unique PROJECT_NAME per PORT_WEB (F3 risk)"
  fi
else
  fail "dev-up.sh missing — cannot verify F3 multi-instance support"
fi

# ────────────────────────────────────────────
echo ""
echo "=== [2] Volume Isolation Per Instance (NF3) ==="
if [ -f "$COMPOSE_FILE" ]; then
  # Volumes must not use hard-coded names without PROJECT_NAME prefix
  # Docker compose -p automatically prefixes volumes, so just verifying
  # volumes are declared (not external/named with hard-coded global names)
  if grep -qE "external:\s*true" "$COMPOSE_FILE"; then
    # Check if any volumes are external (could be shared across instances)
    if grep -B2 "external:\s*true" "$COMPOSE_FILE" | grep -qE "db_data|storage_data|postgres"; then
      fail "NF3: DB or storage volume is marked external — would be shared across instances"
    else
      pass "NF3: external volumes exist but not for DB/storage data"
    fi
  else
    pass "NF3: No external volumes — all volumes will be namespaced per instance by docker compose -p"
  fi
else
  fail "compose.yml missing — cannot verify NF3 volume isolation"
fi

# ────────────────────────────────────────────
echo ""
echo "=== [3] Network Isolation Per Instance (NF4) ==="
if [ -f "$COMPOSE_FILE" ]; then
  # Verify network is not marked external (which would share it)
  if grep -A3 "^networks:" "$COMPOSE_FILE" | grep -qE "external:\s*true"; then
    fail "NF4: Default network is external — instances would share the network"
  else
    pass "NF4: Network is not external — docker compose -p will isolate it per instance"
  fi

  # Verify bridge driver
  if grep -qE "driver:\s*bridge" "$COMPOSE_FILE"; then
    pass "NF4: Network uses bridge driver"
  else
    # docker compose default is bridge, so not declaring it is also OK
    pass "NF4: Network driver not explicitly set (defaults to bridge in Docker Compose)"
  fi
else
  fail "compose.yml missing — cannot verify NF4 network isolation"
fi

# ────────────────────────────────────────────
echo ""
echo "=== [4] Container Labels for Instance Identification (F5 dependency) ==="
# dev-list.sh uses 'docker ps --filter label=dev.etshop.instance'
# So compose.yml must apply that label to all services
if [ -f "$COMPOSE_FILE" ]; then
  label_count=$(grep -c "dev\.etshop\.instance" "$COMPOSE_FILE" 2>/dev/null || echo "0")
  if [ "$label_count" -ge 1 ]; then
    pass "compose.yml applies dev.etshop.instance label ($label_count occurrence(s))"
  else
    fail "compose.yml missing dev.etshop.instance label — dev-list.sh filtering will fail (F5)"
  fi
fi

# ────────────────────────────────────────────
echo ""
echo "=== [5] Parameterized Port Bindings — No Static Conflicts (F3) ==="
if [ -f "$COMPOSE_FILE" ]; then
  # Check that all published ports use variables (not hard-coded)
  # A hard-coded "3000:3000" would prevent running two instances
  hard_coded_port_count=$(grep -cE '^\s+-\s+"[0-9]+:[0-9]+"' "$COMPOSE_FILE" 2>/dev/null || echo "0")
  var_port_count=$(grep -cE '\$\{?PORT_' "$COMPOSE_FILE" 2>/dev/null || echo "0")

  if [ "$hard_coded_port_count" -gt 0 ] && [ "$var_port_count" -eq 0 ]; then
    fail "compose.yml has $hard_coded_port_count hard-coded port binding(s) and no PORT_* variables — multiple instances will conflict (F3)"
  elif [ "$var_port_count" -gt 0 ]; then
    pass "compose.yml uses PORT_* variables for $var_port_count port binding(s) — supports multiple instances (F3)"
  else
    fail "compose.yml has no explicit port bindings found — cannot verify F3 multi-instance safety"
  fi
fi

# ────────────────────────────────────────────
echo ""
echo "=== [6] dev-down.sh — Scoped to One Instance Only (F4) ==="
if [ -f "${CODE_ROOT}/scripts/dev-down.sh" ]; then
  DEV_DOWN="${CODE_ROOT}/scripts/dev-down.sh"
  # Must use -p PROJECT_NAME so it only stops one project, not all
  if grep -qE "docker compose.*-p|compose.*-p" "$DEV_DOWN"; then
    pass "dev-down.sh uses -p flag — stops only the targeted instance (F4)"
  elif grep -qE "PROJECT_NAME|etshop_" "$DEV_DOWN"; then
    pass "dev-down.sh references PROJECT_NAME — likely scoped to one instance (F4)"
  else
    fail "dev-down.sh may stop all containers or lack project scoping (F4 risk)"
  fi
else
  fail "dev-down.sh missing — cannot verify F4 (stop specific instance)"
fi

# ────────────────────────────────────────────
echo ""
echo "──────────────────────────────────────────"
echo "Results: ${PASS} passed, ${FAIL} failed"
echo "──────────────────────────────────────────"
[ "${FAIL}" -eq 0 ] && exit 0 || exit 1
