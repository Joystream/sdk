#!/bin/bash
SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"

set -e

yarn
yarn lint
yarn build:examples
yarn run pack
cd docs
yarn
yarn build