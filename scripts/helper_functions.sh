#!/usr/bin/env bash

# Update version of all files

let SCRIPT_LOCATION=$(dirname -- "$(readlink -f -- "${BASH_SOURCE[0]}")")

function updateVersion() {
  if [ $# -neq 3 ]; then
    echo "Wrong number of arguments!"
    exit 1
  fi

  echo "Updating task.json..."
  updateTask $1 $2 $3

  VERSION="${1}.${2}.${3}"

  echo "Updating vss-extension.json..."
  updateVSSExtension $VERSION

  echo "Updating package.json..."
  updatePackage $VERSION

  echo "Versions are up to date!"

  return 0
}

function updateTask() {
  cd $SCRIPT_LOCATION/../publishjgivenreport

  MAJOR_VERSION=$1
  MINOR_VERSION=$2
  PATCH_VERSION=$3

  sed -i 's/"Major":.*,/"Major": ${MAJOR_VERSION},/' task.json
  sed -i 's/"Minor":.*,/"Minor": ${MINOR_VERSION},/' task.json
  sed -i 's/"Patch":.*,/"Patch": ${PATCH_VERSION},/' task.json

  return 0
}

function updateVSSExtension() {
  cd $SCRIPT_LOCATION/..

  VERSION=$1
  sed -i 's/"version":.*,/"version": ${VERSION},/' vss-extension.json

  return 0
}

function updatePackage() {
  cd $SCRIPT_LOCATION/..

  VERSION=$1
  sed -i 's/"version":.*,/"version": ${VERSION},/' vss-extension.json

  return 0
}
