#!/usr/bin/env bash

SCRIPT_LOCATION=$(dirname -- "$(readlink -f -- "${BASH_SOURCE[0]}")")
source "${SCRIPT_LOCATION}/helper_functions.sh"

set -e

if [ $# -ne 1 ]; then
  echo "Wrong number of arguments!"
  return 2
fi

VERSION=$1
update_version "${VERSION}"

if [ -n "$(git status --porcelain)" ]; then
    echo Commiting version change
    git commit -a -m "Update version to $VERSION"
fi

echo Pushing version and tag to GitHub repository...
git push
git push "$(git config --get remote.origin.url)" "${VERSION}" || return 25

