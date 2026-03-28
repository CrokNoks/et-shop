#!/usr/bin/env bash
# =============================================================================
# dev-up.sh — Start a Docker dev stack instance
#
# Usage:
#   bash scripts/dev-up.sh
#   bash scripts/dev-up.sh --port-web 3000 --port-studio 54323
#
# Requirements: Docker >= 24, Docker Compose v2
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
COMPOSE_FILE="${PROJECT_ROOT}/docker/compose.yml"
ENV_TEMPLATE="${PROJECT_ROOT}/docker/.env.template"

# --- Defaults ----------------------------------------------------------------
PORT_WEB=""
PORT_STUDIO=""
FEATURE_NAME="dev"

# --- Parse args --------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --port-web)    PORT_WEB="$2";    shift 2 ;;
    --port-studio) PORT_STUDIO="$2"; shift 2 ;;
    --feature)     FEATURE_NAME="$2"; shift 2 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

# --- Port detection ----------------------------------------------------------
is_port_free() {
  local port="$1"
  # Try lsof first (macOS/Linux), fall back to ss (Linux only)
  if command -v lsof &>/dev/null; then
    ! lsof -iTCP:"${port}" -sTCP:LISTEN -t &>/dev/null
  elif command -v ss &>/dev/null; then
    ! ss -tlnp | grep -q ":${port} "
  else
    # Fallback: try to connect
    ! (echo >/dev/tcp/localhost/"${port}") 2>/dev/null
  fi
}

find_free_port() {
  local start="$1"
  local port="${start}"
  while ! is_port_free "${port}"; do
    port=$((port + 1))
  done
  echo "${port}"
}

if [[ -z "${PORT_WEB}" ]]; then
  PORT_WEB="$(find_free_port 3000)"
  echo "[dev-up] Auto-detected free PORT_WEB: ${PORT_WEB}"
fi

if [[ -z "${PORT_STUDIO}" ]]; then
  PORT_STUDIO="$(find_free_port 54323)"
  echo "[dev-up] Auto-detected free PORT_STUDIO: ${PORT_STUDIO}"
fi

# --- Derived values ----------------------------------------------------------
PORT_API=$((PORT_WEB + 1))
PORT_DB=$((PORT_STUDIO - 1))
PORT_KONG=$((PORT_STUDIO - 2))
PORT_INBUCKET=$((PORT_STUDIO + 1))
PROJECT_NAME="etshop_${PORT_WEB}"
ENV_FILE="/tmp/.env.${PROJECT_NAME}"

# --- Generate instance .env --------------------------------------------------
echo "[dev-up] Generating env file: ${ENV_FILE}"
cp "${ENV_TEMPLATE}" "${ENV_FILE}"

sed -i.bak \
  -e "s/^PROJECT_NAME=.*/PROJECT_NAME=${PROJECT_NAME}/" \
  -e "s/^PORT_WEB=.*/PORT_WEB=${PORT_WEB}/" \
  -e "s/^PORT_API=.*/PORT_API=${PORT_API}/" \
  -e "s/^PORT_STUDIO=.*/PORT_STUDIO=${PORT_STUDIO}/" \
  -e "s/^PORT_DB=.*/PORT_DB=${PORT_DB}/" \
  -e "s/^PORT_KONG=.*/PORT_KONG=${PORT_KONG}/" \
  -e "s/^PORT_INBUCKET=.*/PORT_INBUCKET=${PORT_INBUCKET}/" \
  "${ENV_FILE}"
rm -f "${ENV_FILE}.bak"

# --- Add FEATURE_NAME --------------------------------------------------------
echo "FEATURE_NAME=${FEATURE_NAME}" >> "${ENV_FILE}"

# --- Start stack -------------------------------------------------------------
echo "[dev-up] Starting stack: ${PROJECT_NAME}"
docker compose \
  -p "${PROJECT_NAME}" \
  -f "${COMPOSE_FILE}" \
  --env-file "${ENV_FILE}" \
  up -d --build

# --- Health check on Kong ----------------------------------------------------
echo "[dev-up] Waiting for Kong to be ready on port ${PORT_KONG}..."
MAX_WAIT=120
ELAPSED=0
until curl -sf "http://localhost:${PORT_KONG}" -o /dev/null 2>&1; do
  sleep 2
  ELAPSED=$((ELAPSED + 2))
  if [[ ${ELAPSED} -ge ${MAX_WAIT} ]]; then
    echo "[dev-up] ERROR: Kong did not become healthy after ${MAX_WAIT}s" >&2
    exit 1
  fi
  echo "[dev-up]   ... waiting (${ELAPSED}s)"
done
echo "[dev-up] Kong is ready."

# --- Run migrations ----------------------------------------------------------
echo "[dev-up] Running Supabase migrations..."
MIGRATION_DIR="${PROJECT_ROOT}/supabase/migrations"
if [[ -d "${MIGRATION_DIR}" ]]; then
  for sql_file in "${MIGRATION_DIR}"/*.sql; do
    [[ -f "${sql_file}" ]] || continue
    echo "[dev-up]   Applying: $(basename "${sql_file}")"
    docker compose \
      -p "${PROJECT_NAME}" \
      -f "${COMPOSE_FILE}" \
      --env-file "${ENV_FILE}" \
      exec -T db \
      psql -U postgres -d postgres -f - < "${sql_file}" || true
  done
else
  echo "[dev-up]   No migrations directory found at ${MIGRATION_DIR}, skipping."
fi

# --- Done --------------------------------------------------------------------
echo ""
echo "========================================="
echo " Stack started: ${PROJECT_NAME}"
echo "========================================="
echo " Web (frontend) : http://localhost:${PORT_WEB}"
echo " API (backend)  : http://localhost:${PORT_API}"
echo " Supabase Kong  : http://localhost:${PORT_KONG}"
echo " Studio         : http://localhost:${PORT_STUDIO}"
echo " PostgreSQL     : localhost:${PORT_DB}"
echo " Inbucket       : http://localhost:${PORT_INBUCKET}"
echo "========================================="
echo ""
echo "To stop: bash scripts/dev-down.sh --port-web ${PORT_WEB}"
