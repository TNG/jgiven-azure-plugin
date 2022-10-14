import path from "path";
import * as ttm from 'azure-pipelines-task-lib/mock-test';
import * as assert from 'assert'
import { jsonToTagMap } from "../../utils";

let fs = require('fs')

type TagMap = Map<string, Map<string, Map<string, string | Array<string>>>>
const startingPointWithAttachments = path.join(__dirname, 'static/with_attachments')
const startingPointWithoutIndex = path.join(__dirname, 'static/without_index')
const dataPath = path.join(startingPointWithAttachments, 'data')
const attachmentPath = path.join(dataPath, 'attachments')
const parsedPath = path.join(dataPath, 'parsed')

const allAttachments = [
    path.join(attachmentPath, 'attachment1.png'),
    path.join(attachmentPath, 'folder1/folder3/attachment2.txt'),
    path.join(attachmentPath, 'folder1/folder3/attachment3.plain')
]

const dataFiles = [
    path.join(parsedPath, 'data0.js'),
    path.join(parsedPath, 'data1.js')
]

const tagFile = path.join(parsedPath, 'tags.js')
const metaDataFile = path.join(parsedPath, 'metaData.js')

const allFiles = allAttachments.concat(dataFiles, [
    metaDataFile,
    tagFile,
    path.join(dataPath, 'mappings.js'),
    path.join(startingPointWithAttachments, 'index.html')
])

describe('Attachment creation and upload', function () {
    let tp: string
    let tr: ttm.MockTestRunner

    before(() => {
        tp = path.join(__dirname, 'withAttachmentsTest.js')
        tr = new ttm.MockTestRunner(tp)
        tr.run()
    })

    after(() => {
        fs.rmSync(path.join(dataPath, 'parsed'), { recursive: true, force: true })
        fs.rmSync(path.join(dataPath, 'mappings.js'))
    })

    it('Should find and upload all the generated attachments', (done) => {
        assert.equal(tr.succeeded, true)
        allAttachments.forEach((attachment) => containsUploadedFileWithType(tr.stdout, attachment, 'attachmentFile'))
        done()
    })

    it('Should find and upload the index file', (done) => {
        containsUploadedFileWithType(tr.stdout, path.join(startingPointWithAttachments, 'index.html'), 'html')
        done()
    })

    it('Should find and upload all the data files', (done) => {
        dataFiles.forEach((dataFile) => { containsUploadedFileWithType(tr.stdout, dataFile, 'data') })
        containsUploadedFileWithType(tr.stdout, metaDataFile, 'metadata')
        containsUploadedFileWithType(tr.stdout, tagFile, 'tags')
        done()
    })

    it('The mappings file is created and uploaded', (done) => {
        containsUploadedFileWithType(tr.stdout, path.join(dataPath, 'mappings.js'), 'locationMappings')
        done()
    })

    it('The generated files should have the same extension as the local ones', (done) => {
        allFiles.forEach((file) => verifyGenerateFileExtensionForLocation(tr.stdout, file))
        done()
    })
})

describe('Mappings Consistency', function () {
    let tp: string
    let tr: ttm.MockTestRunner

    before(() => {
        tp = path.join(__dirname, 'withAttachmentsTest.js')
        tr = new ttm.MockTestRunner(tp)
        tr.run()
    })

    after(() => {
        fs.rmSync(path.join(dataPath, 'parsed'), { recursive: true, force: true })
        fs.rmSync(path.join(dataPath, 'mappings.js'))
    })

    it('The mappings should be consistent', (done) => {
        let mappings: Map<string, string> = new Map(JSON.parse(readFileContent(path.join(dataPath, 'mappings.js'))))
        allAttachments.forEach((file) => verifyLocationMappingForFile(tr.stdout, file.slice(file.indexOf('attachments')), mappings))
        done()
    })
})

function transformWindowsPathToPosix(location: string) {
    if (path.sep === `\\`) {
        location = location.split('\\').join('/');
        location = path.posix.normalize(location);
    }

    return location
}

describe('Multiple locations', function () {
    let tp: string
    let tr: ttm.MockTestRunner

    before(() => {
        tp = path.join(__dirname, 'multipleLocationsTest.js')
        tr = new ttm.MockTestRunner(tp)
        tr.run()
    })

    after(() => {
        fs.rmSync(parsedPath, { recursive: true, force: true })
        fs.rmSync(path.join(__dirname, 'static/with_attachments2/data/parsed'), { recursive: true, force: true })
        fs.rmSync(path.join(__dirname, 'static/with_attachments2/data/mappings.js'))
    })

    it('Should upload files from both locations', (done) => {
        assert.equal(tr.succeeded, true)
        assert.equal(tr.stdout.includes('with_attachments'), true)
        assert.equal(tr.stdout.includes('with_attachments2'), true)
        done()
    })

    it('Should upload the mappings only once', (done) => {
        assert.equal(tr.stdout.includes(`type=locationMappings;`), true)
        assert.equal(tr.stdout.indexOf(`type=locationMappings;`), tr.stdout.lastIndexOf(`type=locationMappings;`))
        done()
    })

    it('Should upload the index only once', (done) => {
        assert.equal(tr.stdout.includes(`type=html;`), true)
        assert.equal(tr.stdout.indexOf(`type=html;`), tr.stdout.lastIndexOf(`type=html;`))
        done()
    })

    it('Should upload the tags only once', (done) => {
        assert.equal(tr.stdout.includes(`type=tags;`), true)
        assert.equal(tr.stdout.indexOf(`type=tags;`), tr.stdout.lastIndexOf(`type=tags;`))
        done()
    })

    it('Should upload the metadata only once', (done) => {
        assert.equal(tr.stdout.includes(`type=metadata;`), true)
        assert.equal(tr.stdout.indexOf(`type=metadata;`), tr.stdout.lastIndexOf(`type=metadata;`))
        done()
    })

    it('The tag file should be consistent', (done) => {
        let tagJSON: string = fs.readFileSync(path.join(__dirname, 'static/with_attachments2/data/parsed/tags.js')).toString()
        let tagMap: TagMap = jsonToTagMap(tagJSON)
        assert.equal(tagMap.has('tagTypeMap'), true)
        assert.equal(tagMap.has('tags'), true)
        assert.equal(tagMap.get('tagTypeMap')!.size, 27)
        assert.equal(tagMap.get('tags')!.size, 31)
        assert.equal(tagMap.get('tagTypeMap')!.get('com.tngtech.jgiven.junit.test.GivenTaggedTestStep$StageTag')!
            .get('type'), 'StageTag')
        assert.equal(tagMap.get('tagTypeMap')!.get('com.tngtech.jgiven.examples.tags.ExampleSubCategory')!
            .get('tags')!.length, 2)
        assert.equal(tagMap.get('tags')!.get('com.tngtech.jgiven.junit.StepsAreReportedTest$TestTag-foo, bar, baz')!
            .get('value')!, "foo, bar, baz")
        assert.equal(tagMap.get('tags')!.get('com.tngtech.jgiven.examples.tags.DynamicTags$CarOrder-BMW')!
            .get('value')!, "BMW")
        done()
    })
})

describe('JSON Handler', function () {
    let tp: string
    let tr: ttm.MockTestRunner

    before(() => {
        tp = path.join(__dirname, 'withAttachmentsTest.js')
        tr = new ttm.MockTestRunner(tp)
        tr.run()
    })

    after(() => {
        fs.rmSync(path.join(dataPath, 'parsed'), { recursive: true, force: true })
        fs.rmSync(path.join(dataPath, 'mappings.js'))
    })

    it('The tags parsed file should only contain JSON', (done) => {
        let fileContent = readFileContent(tagFile)
        assert.equal(isJSON(fileContent), true);
        done();
    })

    it('The metaData parsed file should only contain JSON', (done) => {
        let fileContent = readFileContent(metaDataFile)
        assert.equal(isJSON(fileContent), true);
        done();
    })

    it('The data files should contain only base64 contents converted from JSON strings', (done) => {
        dataFiles.forEach((file) => isJSON(readFileContent(file)))
        done();
    })
})

describe(`Failure tests`, function () {

    afterEach(() => {
        if (fs.existsSync(path.join(startingPointWithoutIndex, 'data/parsed'))) {
            fs.rmSync(path.join(startingPointWithoutIndex, 'data/parsed'), { recursive: true, force: true })
        }
        if (fs.existsSync(path.join(startingPointWithoutIndex, 'data/mappings.js'))) {
            fs.rmSync(path.join(startingPointWithoutIndex, 'data/mappings.js'))
        }
    })

    it("Should fail when the location to the html folder is not set properly", (done) => {
        let tp: string
        let tr: ttm.MockTestRunner
        tp = path.join(__dirname, 'withoutLocationTest.js')
        tr = new ttm.MockTestRunner(tp)
        tr.run()
        assert.equal(tr.failed, true)
        assert.equal(tr.errorIssues.includes("The pattern(s) didn't match any path."), true)
        done()
    })

    it("Should fail when it doesn't find an index file", (done) => {
        let tp: string
        let tr: ttm.MockTestRunner
        tp = path.join(__dirname, 'withoutIndexTest.js')
        tr = new ttm.MockTestRunner(tp)
        tr.run()
        assert.equal(tr.failed, true)
        assert.equal(tr.errorIssues.includes(`The given location ${path.join(startingPointWithoutIndex, 'index.html')} does not exist.`), true)
        done()
    })
})

function readFileContent(location: string) {
    return fs.readFileSync(location).toString();
}

function verifyLocationMappingForFile(allOutput: string, file: string, mappings: Map<string, string>) {
    let position: number = allOutput.indexOf(file);
    let uploadCommandStartingPosition: number = allOutput.lastIndexOf('task.addattachment', position)
    let nameStart: number = allOutput.indexOf('name=', uploadCommandStartingPosition) + 15
    let name: string = allOutput.slice(nameStart, allOutput.indexOf(';', nameStart))
    assert.equal(mappings.has(name), true, 'The JGiven generated file is not set inside the mappings')
    assert.equal(mappings.get(name), transformWindowsPathToPosix(file), 'The JGiven generated file is pointing to another file')
}

function verifyGenerateFileExtensionForLocation(allOutput: string, location: string) {
    let position: number = allOutput.indexOf(location);
    let uploadCommandStartingPosition: number = allOutput.lastIndexOf('task.addattachment', position)
    let nameStart: number = allOutput.indexOf('name=', uploadCommandStartingPosition) + 5
    let name: string = allOutput.slice(nameStart, allOutput.indexOf(';', nameStart))

    assert.equal(getExtensionFromName(name), getExtensionFromName(location))
}

function getExtensionFromName(name: string) {
    return name.slice(name.lastIndexOf('.'));
}

function isJSON(content: string) {
    return (content[0] == '[' && content[content.length - 1] == ']')
        || (content[0] == '{' && content[content.length - 1] == '}')
}

function containsUploadedFileWithType(allOutput: string, location: string, type: string) {
    let position: number = allOutput.indexOf(location);
    assert.equal(position != -1, true, `The file ${location} is not uploaded`)
    assert.equal(allOutput.lastIndexOf(location), position, "The file should be uploaded only once")
    let uploadCommandStartingPosition: number = allOutput.lastIndexOf('task.addattachment', position)
    let attachmentType: string = allOutput.slice(allOutput.indexOf('type=', uploadCommandStartingPosition) + 5, allOutput.indexOf(';', allOutput.indexOf('type=', uploadCommandStartingPosition) + 5));
    assert.equal(attachmentType, type, `The attachment was found, but with another type`)
}
