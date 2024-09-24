#!/bin/bash

# Usage: ./e2e_compose_test.sh <test>
# Optional environment variables:
#   COMPOSE_FILE (default: ./scripts/docker-compose.yml)
#   DEBUG (default: "aztec:*")
#   HARDWARE_CONCURRENCY (default: "")
#   ENABLE_GAS (default: "")
#   AZTEC_DOCKER_TAG (default: current git commit)

set -eu

# Note: We export variables to make them available to the docker compose file

# Main positional parameter
export TEST="$1"
# Variables with defaults
COMPOSE_FILE="${COMPOSE_FILE:-./scripts/docker-compose.yml}"
export DEBUG="${DEBUG:-aztec:*}"
export HARDWARE_CONCURRENCY="${HARDWARE_CONCURRENCY:-}"
export AZTEC_DOCKER_TAG="${AZTEC_DOCKER_TAG:-$(git rev-parse HEAD)}"
FORCE_BUILD="${FORCE_BUILD:-true}"

# Compute project_name
export JOB_NAME=$(echo "$TEST" | sed 's/\./_/g' | sed 's/\//_/g')

# Determine CMD
if docker compose > /dev/null 2>&1; then
  CMD="docker compose"
else
  CMD="docker-compose"
fi

# Optimize image building
if ! docker image ls --format '{{.Repository}}:{{.Tag}}' | grep -q "aztecprotocol/aztec:$AZTEC_DOCKER_TAG" || \
   ! docker image ls --format '{{.Repository}}:{{.Tag}}' | grep -q "aztecprotocol/end-to-end:$AZTEC_DOCKER_TAG"; then
  echo "Docker images not found. They need to be built with 'earthly ./yarn-project/+export-test-images' or otherwise tagged with aztecprotocol/aztec:$AZTEC_DOCKER_TAG and aztecprotocol/end-to-end:$AZTEC_DOCKER_TAG."
  exit 1
fi

# Run docker compose
$CMD -p "$JOB_NAME" -f "$COMPOSE_FILE" up --exit-code-from=end-to-end --force-recreate
