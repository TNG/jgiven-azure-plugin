#!/usr/bin/env bash

cp node_modules/jgiven-html-app/dist/index.html index.html
cat node_modules/jgiven-html-app/dist/app.bundle.js src/reportAppAzureDirective.js > app.bundle.js
cp node_modules/jgiven-html-app/dist/c8ddf1e5e5bf3682bc7bebf30f394148.woff font.woff
cp node_modules/jgiven-html-app/dist/styles.css styles.css
