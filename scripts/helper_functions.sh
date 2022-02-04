#!/usr/bin/env bash

# Update version of all files
function updateVersion() {
  if [ $# -neq 3 ]; then
    echo "Wrong number of arguments!"
    exit 1
  fi

  updateTask $1 $2 $3

  VERSION="${1}.${2}.${3}"

  updateVSSExtension $VERSION
  updatePackage $VERSION

  return 0
}

function updateTask() {
  cd ../publishjgivenreport

  MAJOR_VERSION=$1
  MINOR_VERSION=$2
  PATCH_VERSION=$3

  sed -i 's/"Major":.*,/"Major": ${MAJOR_VERSION},/' task.json
  sed -i 's/"Minor":.*,/"Minor": ${MINOR_VERSION},/' task.json
  sed -i 's/"Patch":.*,/"Patch": ${PATCH_VERSION},/' task.json

  return 0
}

function updateVSSExtension() {
  cd ..

  VERSION=$1

  sed -i 's/"version":.*,/"version": ${VERSION},/' vss-extension.json

  return 0
}

function updatePackage() {
  VERSION=$1

  sed -i 's/"version":.*,/"version": ${VERSION},/' vss-extension.json

  return 0
}
