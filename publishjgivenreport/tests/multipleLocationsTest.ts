import tmrm = require('azure-pipelines-task-lib/mock-run')
import path = require('path')

let taskPath = path.join(__dirname, '..', 'index.js')
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath)

tmr.setInput('jgivenReportPatterns', 'static/with_attachments/#*/with_attachments2/')
tmr.setInput('workingDir', __dirname)

tmr.run()
