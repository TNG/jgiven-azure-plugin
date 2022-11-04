#!/usr/bin/env bash

# Update version of all files

SCRIPT_LOCATION=$(dirname -- "$(readlink -f -- "${BASH_SOURCE[0]}")")

function updateVersion() {
  if [ $# -ne 1 ]; then
    echo "Wrong number of arguments!"
    return 2
  fi

  VERSION=$1

  echo "Updating task.json to version ${VERSION}..."
  updateTask VERSION

  echo "Updating vss-extension.json..."
  updateVSSExtension $VERSION

  echo "Updating package.json..."
  updatePackage $VERSION

  echo "Versions are up to date!"

  return 0
}

function updateTask() {
  TASK_FILE=$SCRIPT_LOCATION/../publishjgivenreport/task.json

  VERSION=$1

  IFS='.'

  read -ra ARRAY <<< "$VERSION"

  MAJOR_VERSION=${ARRAY[0]}
  MINOR_VERSION=${ARRAY[1]}
  PATCH_VERSION=${ARRAY[2]}

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
