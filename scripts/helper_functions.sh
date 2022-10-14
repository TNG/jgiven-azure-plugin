#!/usr/bin/env bash

# Update version of all files

let SCRIPT_LOCATION=$(dirname -- "$(readlink -f -- "${BASH_SOURCE[0]}")")

function updateVersion() {
  if [ $# -neq 3 ]; then
    echo "Wrong number of arguments!"
    return 2
  fi

  MAJOR_VERSION=$1
  MINOR_VERSION=$2
  PATCH_VERSION=$3

  echo "Updating task.json..."
  updateTask MAJOR_VERSION MINOR_VERSION PATCH_VERSION

  VERSION="${MAJOR_VERSION}.${MINOR_VERSION}.${PATCH_VERSION}"

  echo "Updating vss-extension.json..."
  updateVSSExtension $VERSION

  echo "Updating package.json..."
  updatePackage $VERSION

  echo "Versions are up to date!"

  return 0
}

function updateTask() {
  TASK_FILE=$SCRIPT_LOCATION/../publishjgivenreport/task.json

  MAJOR_VERSION=$1
  MINOR_VERSION=$2
  PATCH_VERSION=$3

  sed -i 's/"Major":.*,/"Major": ${MAJOR_VERSION},/' $TASK_FILE
  sed -i 's/"Minor":.*,/"Minor": ${MINOR_VERSION},/' $TASK_FILE
  sed -i 's/"Patch":.*,/"Patch": ${PATCH_VERSION},/' $TASK_FILE

  return 0
}

function updateVSSExtension() {
  VSS_FILE=$SCRIPT_LOCATION/../vss-extension.json
  cd $SCRIPT_LOCATION/..

  VERSION=$1
  sed -i 's/"version":.*,/"version": ${VERSION},/' VSS_FILE

  return 0
}

function updatePackage() {
  PACKAGE_FILE=$SCRIPT_LOCATION/../package.json

  VERSION=$1
  sed -i 's/"version":.*,/"version": ${VERSION},/' PACKAGE_FILE

  return 0
}
