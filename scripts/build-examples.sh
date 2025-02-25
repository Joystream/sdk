#!/bin/bash
SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
ROOT_DIR="$SCRIPT_PATH/.."

cd $ROOT_DIR

yarn workspaces foreach -Ap --exclude "./examples/__WIP__*" --include "./examples/*" run tsc -b
yarn prettier -w "./examples/**/*.js"