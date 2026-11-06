#!/bin/bash

echo "Starting Release"

SCRIPT_LOCATION=$(dirname -- "$(readlink -f -- "${BASH_SOURCE[0]}")")
source "${SCRIPT_LOCATION}/helper_functions.sh"

set -e

echo "Checking prerequisites..."

if [ $# -ne 2 ]; then
  echo "Wrong number of arguments!"
  return 2
fi

TOKEN=$1

VERSION=$2
update_version "${VERSION}"

echo "Preparing NPM..."
npm install
(cd "${SCRIPT_LOCATION}/../publishjgivenreport/" && npm install)

npm install -g tfx-cli

echo "Building extension..."
npm run clean
npm run build

echo "Building successful!"

export NODE_TLS_REJECT_UNAUTHORIZED=0

VSIX_FILE=$(ls TNGTechnologyConsultingGmbH.*.vsix)

echo "Publishing extension to marketplace..."
tfx extension publish --vsix "$VSIX_FILE" --token $TOKEN

echo "Publishing successful!"
