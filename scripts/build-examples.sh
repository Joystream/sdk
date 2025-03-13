#!/bin/bash
SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
ROOT_DIR="$SCRIPT_PATH/.."

cd $ROOT_DIR

set -e

yarn workspaces foreach -Ap --include "./examples/*" run tsc -b
yarn prettier -w "./examples/**/*.js"