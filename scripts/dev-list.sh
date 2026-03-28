#!/usr/bin/env bash
# =============================================================================
# dev-list.sh — List active Docker dev stack instances
#
# Usage:
#   bash scripts/dev-list.sh
#
# Requirements: Docker >= 24
# =============================================================================
set -euo pipefail

echo "Active et-shop dev stack instances:"
echo "-------------------------------------"

# Find all containers with the etshop label
INSTANCES=$(docker ps \
  --filter "label=dev.etshop.instance" \
  --format "{{.Label \"dev.etshop.instance\"}}" \
  2>/dev/null | sort -u)

if [[ -z "${INSTANCES}" ]]; then
  echo "  (none)"
  exit 0
fi

for INSTANCE in ${INSTANCES}; do
  echo ""
  echo "  Instance: ${INSTANCE}"

  # Extract port info from running containers
  CONTAINERS=$(docker ps \
    --filter "label=dev.etshop.instance=${INSTANCE}" \
    --format "{{.Names}}\t{{.Ports}}\t{{.Status}}")

  while IFS=$'\t' read -r name ports status; do
    printf "    %-40s  %-50s  %s\n" "${name}" "${ports}" "${status}"
  done <<< "${CONTAINERS}"

  # Show main access URLs based on port labels
  WEB_PORT=$(docker ps \
    --filter "label=dev.etshop.instance=${INSTANCE}" \
    --filter "label=dev.etshop.service=web" \
    --format "{{.Ports}}" 2>/dev/null | grep -oP '0\.0\.0\.0:\K\d+(?=->)' | head -1 || true)

  STUDIO_PORT=$(docker ps \
    --filter "label=dev.etshop.instance=${INSTANCE}" \
    --filter "label=dev.etshop.service=studio" \
    --format "{{.Ports}}" 2>/dev/null | grep -oP '0\.0\.0\.0:\K\d+(?=->)' | head -1 || true)

  KONG_PORT=$(docker ps \
    --filter "label=dev.etshop.instance=${INSTANCE}" \
    --filter "label=dev.etshop.service=kong" \
    --format "{{.Ports}}" 2>/dev/null | grep -oP '0\.0\.0\.0:\K\d+(?=->8000)' | head -1 || true)

  echo ""
  [[ -n "${WEB_PORT}" ]]    && echo "    Web     : http://localhost:${WEB_PORT}"
  [[ -n "${STUDIO_PORT}" ]] && echo "    Studio  : http://localhost:${STUDIO_PORT}"
  [[ -n "${KONG_PORT}" ]]   && echo "    Kong    : http://localhost:${KONG_PORT}"
  echo "    Stop    : bash scripts/dev-down.sh --port-web ${WEB_PORT:-?}"
done

echo ""
