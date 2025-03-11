#!/bin/bash
GIT_STATUS="$(git status -s)"
if [[ -z "$GIT_STATUS" ]]; then
  echo "OK"
  exit 0
else
  echo "Changes detected!"
  exit 1
fi