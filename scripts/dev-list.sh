#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# dev-list.sh — List active et-shop dev stack instances
#
# Usage: bash scripts/dev-list.sh
#
# Requirements: Docker >= 24
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

echo "Active et-shop dev stack instances:"
echo "────────────────────────────────────────────────────────────"

# Find all unique instance names from the label
INSTANCES=$(docker ps \
  --filter "label=dev.etshop.instance" \
  --format "{{.Label \"dev.etshop.instance\"}}" \
  | sort -u)

if [[ -z "$INSTANCES" ]]; then
  echo "  (none)"
  exit 0
fi

printf "%-25s %-12s %-12s %-12s\n" "PROJECT" "PORT_WEB" "PORT_STUDIO" "PORT_KONG"
echo "────────────────────────────────────────────────────────────"

for INSTANCE in $INSTANCES; do
  # Extract port_web from project name (etshop_<PORT_WEB>)
  PORT_WEB="${INSTANCE#etshop_}"

  # Find PORT_STUDIO and PORT_KONG from running containers
  PORT_STUDIO=$(docker ps \
    --filter "label=dev.etshop.instance=${INSTANCE}" \
    --filter "label=dev.etshop.service=studio" \
    --format "{{.Ports}}" \
    | grep -oE '0\.0\.0\.0:[0-9]+->' | grep -oE '[0-9]+' | head -1 || echo "?")

  PORT_KONG=$(docker ps \
    --filter "label=dev.etshop.instance=${INSTANCE}" \
    --filter "label=dev.etshop.service=kong" \
    --format "{{.Ports}}" \
    | grep -oE '0\.0\.0\.0:[0-9]+->' | grep -oE '[0-9]+' | head -1 || echo "?")

  printf "%-25s %-12s %-12s %-12s\n" "$INSTANCE" "$PORT_WEB" "${PORT_STUDIO:-?}" "${PORT_KONG:-?}"
done

echo "────────────────────────────────────────────────────────────"

# Show container details
echo ""
echo "Container details:"
docker ps \
  --filter "label=dev.etshop.instance" \
  --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" \
  | head -50
