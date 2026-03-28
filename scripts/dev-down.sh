#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# dev-down.sh — Stop a specific et-shop dev stack instance
#
# Usage:
#   bash scripts/dev-down.sh --port-web 3000
#   bash scripts/dev-down.sh --port-web 3000 --clean   # also removes volumes
#
# Requirements: Docker >= 24, Docker Compose v2
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DOCKER_DIR="${REPO_ROOT}/docker"

# ── Argument parsing ──────────────────────────────────────────────────────────
PORT_WEB=""
CLEAN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --port-web) PORT_WEB="$2"; shift 2 ;;
    --clean)    CLEAN=true;    shift   ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "$PORT_WEB" ]]; then
  echo "Error: --port-web is required." >&2
  echo "Usage: bash scripts/dev-down.sh --port-web <PORT>" >&2
  exit 1
fi

PROJECT_NAME="etshop_${PORT_WEB}"
ENV_FILE="${DOCKER_DIR}/.env.${PORT_WEB}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Warning: env file ${ENV_FILE} not found. Trying to stop anyway..." >&2
fi

echo "Stopping instance: ${PROJECT_NAME}"

DOWN_ARGS="-p ${PROJECT_NAME} -f ${DOCKER_DIR}/compose.yml"
if [[ -f "$ENV_FILE" ]]; then
  DOWN_ARGS="${DOWN_ARGS} --env-file ${ENV_FILE}"
fi

if [[ "$CLEAN" == "true" ]]; then
  echo "  --clean: volumes will also be removed."
  # shellcheck disable=SC2086
  docker compose ${DOWN_ARGS} down --volumes --remove-orphans
else
  # shellcheck disable=SC2086
  docker compose ${DOWN_ARGS} down --remove-orphans
fi

# ── Cleanup instance .env ─────────────────────────────────────────────────────
if [[ -f "$ENV_FILE" ]]; then
  rm -f "${ENV_FILE}"
  echo "Removed env file: ${ENV_FILE}"
fi

echo "Instance ${PROJECT_NAME} stopped."
