#!/bin/bash

SCRIPT_LOCATION=$(dirname -- "$(readlink -f -- "${BASH_SOURCE[0]}")")
source "${SCRIPT_LOCATION}/helper_functions.sh"

if [$# -neq 4]; then
  echo "Wrong number of arguments!"
  return 2
fi

TOKEN=$1

MAJOR_VERSION=$2
MINOR_VERSION=$3
PATCH_VERSION=$4

updateVersion $MAJOR_VERSION $MINOR_VERSION $PATCH_VERSION

echo "Building extension..."
npm run-script build

echo "Building successful!"

export NODE_TLS_REJECT_UNAUTHORIZED=0

echo "Publishing extension to marketplace..."
tfx extension publish --manifest-globs vss-extension --token $TOKEN

echo "Publishing successful!"
