#!/bin/bash
SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"

EXAMPLE_ROOT_DIR="$SCRIPT_PATH/../examples/$1"
RUNNER=$2
RUNNER=${RUNNER:="tsx"}

if [[ "$RUNNER" = "tsx" || "$RUNNER" == "ts" ]]; then
    tsx --tsconfig=$EXAMPLE_ROOT_DIR/tsconfig.json $EXAMPLE_ROOT_DIR/ts/main.ts
elif [[ "$RUNNER" == "node" || "$RUNNER" == "js" ]]; then
    node $EXAMPLE_ROOT_DIR/js/main.js
else
    echo "Unknown runner: ${RUNNER}"
fi