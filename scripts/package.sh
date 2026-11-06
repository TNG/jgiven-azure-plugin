#!/bin/sh

# Packages the extension with only the task's production dependencies.
# The task's devDependencies (typescript, mocha, ...) must not be shipped
# inside the extension, so they are pruned before packaging and restored
# afterwards.

SCRIPT_LOCATION=$(dirname -- "$0")

echo "Pruning devDependencies of the task..."
(cd "${SCRIPT_LOCATION}/../publishjgivenreport" && npm prune --omit=dev)

echo "Creating extension package..."
tfx extension create
STATUS=$?

echo "Restoring devDependencies of the task..."
(cd "${SCRIPT_LOCATION}/../publishjgivenreport" && npm install --no-audit --no-fund)

exit $STATUS
