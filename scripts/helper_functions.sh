#!/usr/bin/env bash

# Update version of all files

SCRIPT_LOCATION=$(dirname -- "$(readlink -f -- "${BASH_SOURCE[0]}")")

set -e

function update_version() {
  if [ $# -ne 1 ]; then
    echo "Wrong number of arguments!"
    return 2
  fi

  VERSION=$1

  echo "Updating task.json..."
  update_task $VERSION

  echo "Updating vss-extension.json..."
  update_vss_extension "${VERSION}"

  echo "Updating package.json..."
  update_package "${SCRIPT_LOCATION}/../package.json" "${VERSION}"

  echo "Updating publishjgivenreport/package.json..."
  update_package "${SCRIPT_LOCATION}/../publishjgivenreport/package.json" "${VERSION}"

  echo "Versions are up to date!"

  return 0
}

function update_task() {
  TASK_FILE="${SCRIPT_LOCATION}/../publishjgivenreport/task.json"

  VERSION=$1

  IFS='.'
  read -ra ARRAY <<< "$VERSION"
  IFS=$' \t\n'

  MAJOR_VERSION=${ARRAY[0]}
  MINOR_VERSION=${ARRAY[1]}
  PATCH_VERSION=${ARRAY[2]}

  sed -i.bak 's/"Major":.*/"Major": '"${MAJOR_VERSION}"',/' "${TASK_FILE}"
  sed -i.bak 's/"Minor":.*/"Minor": '"${MINOR_VERSION}"',/' "${TASK_FILE}"
  sed -i.bak 's/"Patch":.*/"Patch": '"${PATCH_VERSION}"'/' "${TASK_FILE}"
  rm -f "${TASK_FILE}.bak"

  return 0
}

function update_vss_extension() {
  VSS_FILE="${SCRIPT_LOCATION}/../vss-extension.json"

  VERSION="\"${1}\""

  sed -i.bak 's/"version":.*/"version": '"${VERSION}"',/' "${VSS_FILE}"
  rm -f "${VSS_FILE}.bak"

  return 0
}

function update_package() {
  PACKAGE_FILE=$1

  VERSION="${2}"

  sed -i.bak 's/"version":.*/"version": '"${VERSION}"',/' "${PACKAGE_FILE}"
  rm -f "${PACKAGE_FILE}.bak"

  return 0
}
