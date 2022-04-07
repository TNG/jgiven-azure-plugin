#!/usr/bin/env bash
SCRIPT_LOCATION=$(dirname -- "$(readlink -f -- "${BASH_SOURCE[0]}")")
export TOPLEVEL="${SCRIPT_LOCATION}/.."
export REPORT_APP_LOCATION="${TOPLEVEL}/node_modules/jgiven-html-app"

function inject_azure_code(){
  local injection_target="$1"
  directives="$(<"${TOPLEVEL}/src/reportAppAzureDirective.js")"
  scope="$(<"${TOPLEVEL}/src/reportAppAzureScopeRedirection.js")"
  sed -i "/^\s*jgivenReportApp.controller/i ${directives}/" "${injection_target}"
  sed -i "/^\s*jgivenReportApp.controller/i ${scope}/" "${injection_target}"
}

function copy_to_toplevel(){
  cp ${REPORT_APP_LOCATION}/dist/index.html "${TOPLEVEL}"
  cp ${REPORT_APP_LOCATION}/dist/app.bundle.js "${TOPLEVEL}"
  cp ${REPORT_APP_LOCATION}/dist/c8ddf1e5e5bf3682bc7bebf30f394148.woff "${TOPLEVEL}/font.woff"
  cp ${REPORT_APP_LOCATION}/dist/styles.css "${TOPLEVEL}"
}

function rebuild_report_app(){
  pushd "${REPORT_APP_LOCATION}"
  rm -r "./-p"  "dist" #safeguard against npm peculiarities on windows
  yarn install
  yarn build
  popd
}

injection_target="${REPORT_APP_LOCATION}/src/js/controller/reportCrtl.js"
backup="${injection_target}.bak"
dist_backup="${REPORT_APP_LOCATION}/dist_bak"
cp "${injection_target}" "${backup}"
mv dist "${dist_backup}"
inject_azure_code "${injection_target}"
rebuild_report_app
copy_to_toplevel
mv "${backup}" "${injection_target}"
mv "${dist_backup}" "dist"

