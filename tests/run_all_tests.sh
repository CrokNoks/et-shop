#!/usr/bin/env bash
# ============================================================
# QA Test Runner — dev_env_docker feature
# Runs all test suites and aggregates results.
# Usage: bash tests/run_all_tests.sh [--verbose]
# ============================================================

set -euo pipefail

TESTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERBOSE="${1:-}"
TOTAL_PASS=0
TOTAL_FAIL=0
SUITE_RESULTS=()

run_suite() {
  local script="$1"
  local suite_name
  suite_name=$(basename "$script" .sh)

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Suite: ${suite_name}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  local output
  local exit_code=0
  output=$(bash "$script" 2>&1) || exit_code=$?

  echo "$output"

  # Parse pass/fail counts from output
  local pass fail
  pass=$(echo "$output" | grep -oP '\d+(?= passed)' | tail -1 || echo "0")
  fail=$(echo "$output" | grep -oP '\d+(?= failed)' | tail -1 || echo "0")

  TOTAL_PASS=$((TOTAL_PASS + pass))
  TOTAL_FAIL=$((TOTAL_FAIL + fail))

  if [ "$exit_code" -eq 0 ]; then
    SUITE_RESULTS+=("  [PASS] ${suite_name} (${pass} tests)")
  else
    SUITE_RESULTS+=("  [FAIL] ${suite_name} (${pass} passed, ${fail} failed)")
  fi
}

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║  QA Test Runner — dev_env_docker               ║"
echo "╚════════════════════════════════════════════════╝"

# Run all test scripts (excluding this runner)
for test_file in "${TESTS_DIR}"/test_*.sh; do
  run_suite "$test_file"
done

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║  SUMMARY                                       ║"
echo "╚════════════════════════════════════════════════╝"
for result in "${SUITE_RESULTS[@]}"; do
  echo "$result"
done
echo ""
echo "  Total: ${TOTAL_PASS} passed, ${TOTAL_FAIL} failed"
echo ""

if [ "${TOTAL_FAIL}" -eq 0 ]; then
  echo "  ALL TESTS PASSED"
  exit 0
else
  echo "  SOME TESTS FAILED — review output above"
  exit 1
fi
