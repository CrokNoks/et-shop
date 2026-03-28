#!/usr/bin/env bash
# =============================================================================
# dev-down.sh — Stop and remove a Docker dev stack instance
#
# Usage:
#   bash scripts/dev-down.sh --port-web 3000
#   bash scripts/dev-down.sh --port-web 3000 --clean   # also removes volumes
#
# Requirements: Docker >= 24, Docker Compose v2
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
COMPOSE_FILE="${PROJECT_ROOT}/docker/compose.yml"

# --- Parse args --------------------------------------------------------------
PORT_WEB=""
CLEAN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --port-web) PORT_WEB="$2"; shift 2 ;;
    --clean)    CLEAN=true;    shift   ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "${PORT_WEB}" ]]; then
  echo "ERROR: --port-web is required." >&2
  echo "Usage: bash scripts/dev-down.sh --port-web <PORT>" >&2
  exit 1
fi

PROJECT_NAME="etshop_${PORT_WEB}"
ENV_FILE="/tmp/.env.${PROJECT_NAME}"

# --- Stop stack --------------------------------------------------------------
DOWN_ARGS=()
if [[ "${CLEAN}" == "true" ]]; then
  DOWN_ARGS+=("--volumes")
  echo "[dev-down] Removing containers, networks AND volumes for ${PROJECT_NAME}"
else
  echo "[dev-down] Stopping containers for ${PROJECT_NAME} (volumes preserved)"
fi

if [[ -f "${ENV_FILE}" ]]; then
  docker compose \
    -p "${PROJECT_NAME}" \
    -f "${COMPOSE_FILE}" \
    --env-file "${ENV_FILE}" \
    down "${DOWN_ARGS[@]}"
else
  # No env file, use -p only (Docker Compose will find the running project)
  docker compose \
    -p "${PROJECT_NAME}" \
    -f "${COMPOSE_FILE}" \
    down "${DOWN_ARGS[@]}"
fi

# --- Clean up temp env file --------------------------------------------------
if [[ -f "${ENV_FILE}" ]]; then
  rm -f "${ENV_FILE}"
  echo "[dev-down] Removed temp env file: ${ENV_FILE}"
fi

# --- Clean up isolated bridge network ----------------------------------------
FEATURE_NAME="${FEATURE_NAME:-dev}"
NETWORK_NAME="etshop_${FEATURE_NAME}"
if docker network ls --format '{{.Name}}' | grep -q "^${NETWORK_NAME}$"; then
  # Only remove if no containers use it
  if [[ -z "$(docker network inspect "${NETWORK_NAME}" --format '{{range .Containers}}{{.Name}} {{end}}' 2>/dev/null)" ]]; then
    docker network rm "${NETWORK_NAME}" 2>/dev/null && \
      echo "[dev-down] Removed network: ${NETWORK_NAME}" || true
  else
    echo "[dev-down] Network ${NETWORK_NAME} still in use, skipping removal."
  fi
fi

echo "[dev-down] Done. Instance ${PROJECT_NAME} stopped."
