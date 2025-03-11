#!/bin/bash
SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"

MODULE=$1
EXECUTABLE=$2
MODULE_ROOT_DIR="$SCRIPT_PATH/../packages/$MODULE"

yarn tsx --tsconfig=$MODULE_ROOT_DIR/tsconfig.json $MODULE_ROOT_DIR/$EXECUTABLE