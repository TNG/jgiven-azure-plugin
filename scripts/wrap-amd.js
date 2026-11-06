const fs = require('fs')

const inputFile = 'dist/tab.js'
const code = fs.readFileSync(inputFile, 'utf8')

const amdDependencies = [
    'require',
    'exports'
]

const factoryParams = ['require', 'exports']

const wrapped = `define(${JSON.stringify(amdDependencies)}, function (${factoryParams.join(', ')}) {\n${code}\n});\n`
fs.writeFileSync(inputFile, wrapped)
