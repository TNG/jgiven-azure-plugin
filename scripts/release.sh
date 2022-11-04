#!/bin/bash

echo "Starting Release"

SCRIPT_LOCATION=$(dirname -- "$(readlink -f -- "${BASH_SOURCE[0]}")")
source "${SCRIPT_LOCATION}/helper_functions.sh"

set -e

echo "Checking prerequisites..."

if [$# -neq 2]; then
  echo "Wrong number of arguments!"
  return 2
fi

TOKEN=$1

VERSION=$2

updateVersion $VERSION

echo "Building extension..."
npm run-script build

echo "Building successful!"

export NODE_TLS_REJECT_UNAUTHORIZED=0

echo "Publishing extension to marketplace..."
tfx extension publish --manifest-globs vss-extension --token $TOKEN

echo "Publishing successful!"
