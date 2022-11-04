#!/usr/bin/env bash

# Update version of all files

SCRIPT_LOCATION=$(dirname -- "$(readlink -f -- "${BASH_SOURCE[0]}")")

function update_version() {
  if [ $# -ne 1 ]; then
    echo "Wrong number of arguments!"
    return 2
  fi

  VERSION=$1

  echo "Updating task.json..."
  update_task VERSION

  echo "Updating vss-extension.json..."
  update_vss_extension $VERSION

  echo "Updating package.json..."
  update_package $VERSION

  echo "Versions are up to date!"

  return 0
}

function update_task() {
  TASK_FILE="${SCRIPT_LOCATION}/../publishjgivenreport/task.json"
  TASK_PATH=$(get_absolute_filename ${TASK_FILE})

  VERSION=$1

  IFS='.'

  read -ra ARRAY <<< "$VERSION"

  MAJOR_VERSION=${ARRAY[0]}
  MINOR_VERSION=${ARRAY[1]}
  PATCH_VERSION=${ARRAY[2]}

  sed -i 's/"Major":.*,/"Major": '${MAJOR_VERSION}',/' "${TASK_PATH}"
  sed -i 's/"Minor":.*,/"Minor": '${MINOR_VERSION}',/' "${TASK_PATH}"
  sed -i 's/"Patch":.*,/"Patch": '${PATCH_VERSION}',/' "${TASK_PATH}"

  return 0
}

function update_vss_extension() {
  VSS_FILE="${SCRIPT_LOCATION}/../vss-extension.json"
  VSS_PATH=$(get_absolute_filename ${VSS_FILE})

  VERSION=$1
  sed -i 's/"version":.*,/"version": '${VERSION}',/' "${VSS_FILE}"

  return 0
}

function update_package() {
  PACKAGE_FILE="${SCRIPT_LOCATION}/../package.json"
  PACKAGE_PATH=$(get_absolute_filename ${PACKAGE_FILE})
  echo $PACKAGE_PATH

  VERSION=$1
  sed -i 's/"version":.*,/"version": '${VERSION}',/' "${PACKAGE_PATH}"

  return 0
}

function get_absolute_filename() {
  echo "$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
}