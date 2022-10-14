import * as tl from 'azure-pipelines-task-lib/task'
import * as fs from 'fs'
import * as path from 'path'
import * as pako from 'pako'
import * as glob from 'glob'
import { jsonToTagMap } from "../utils";

type TagMap = Map<string, Map<string, Map<string, string | Array<string>>>>

class MetadataProcessor {
    private isMetadataUploaded: boolean = false

    public extractDataAndUpload(dataPath: string): void {
        let metadataObject = getJSONFromDataFileAndWrite(path.join(dataPath, 'metaData.js'),
            path.join(dataPath, '/parsed/metaData.js'));
        if (!this.isMetadataUploaded) {
            this.uploadMetadata(path.join(dataPath, '/parsed/metaData.js'))
        }

        metadataObject.data.forEach((dataFile: string) => {
            writeJSONFromZippedFile(path.join(dataPath, dataFile), path.join(dataPath, `/parsed/${dataFile}`))
            attachmentUploader.addAttachmentWithNameAndType(path.join(dataPath, `/parsed/${dataFile}`), 'data')
        });

        let tagJSON: string = getJSONFromDataFileAndWrite(path.join(dataPath, 'tags.js'),
            path.join(dataPath, '/parsed/tags.js'))
        addTags(tagJSON)
    }

    private uploadMetadata(location: string) {
        attachmentUploader.addAttachmentWithNameAndType(location, 'metadata')
        this.isMetadataUploaded = true
    }
}

class IndexProcessor {
    private isIndexUploaded: boolean = false
    private metadataProcessor: MetadataProcessor = new MetadataProcessor()

    public uploadJGivenReportForLocation(jgivenReportLocation: string) {
        const dataPath: string = path.join(jgivenReportLocation, 'data')
        const attachmentsPath: string = path.join(dataPath, 'attachments')
        try {
            fs.mkdirSync(path.join(dataPath, 'parsed'))
        } catch (e) {
            console.error(e)
            tl.setResult(tl.TaskResult.Failed, "The custom parsed folder already exists.")
        }


        if (!this.isIndexUploaded) {
            this.uploadIndex(path.join(jgivenReportLocation, 'index.html'))
        }
        recursivelyUploadAttachmentsUnder(attachmentsPath)
        uploadAllTheThumbnails()
        this.metadataProcessor.extractDataAndUpload(dataPath)
    }

    private uploadIndex(location: string) {
        attachmentUploader.addAttachmentWithNameAndType(location, 'html')
        this.isIndexUploaded = true
    }
}

class AttachmentUploader {
    private fileCounter: number = 0

    public addAttachmentWithNameAndType(location: string, type: string): void {
        let extension: string = path.extname(location)
        verifyLocationAndUpload(location, type, `jgivenFile_${this.fileCounter}${extension}`)
        if (type === "attachmentFile") {
            if (location.includes(`-thumb${extension}`)) {
                thumbLocations.push(location)
                return
            } else {
                let locationPath: string = location.slice(location.indexOf("attachments"))
                locationPath = transformWindowsPathToPosix(locationPath)
                locationMappings.set(`jgivenFile_${this.fileCounter}${extension}`, locationPath)
            }
        }
        this.fileCounter++
    }
}

const locationMappings: Map<string, string> = new Map()
const tagMap: TagMap = new Map([
    ["tagTypeMap", new Map()],
    ["tags", new Map()]
])
const thumbLocations: Array<string> = []
const indexProcessor: IndexProcessor = new IndexProcessor()
const attachmentUploader: AttachmentUploader = new AttachmentUploader()
let centralPath: string = ''
const jobId = tl.getVariable('System.JobId')

function uploadAllJGivenReports() {
    let patterns: Array<string> = getReportPatterns()
    let uploadedLocations: Set<string> = new Set()
    let hasAtLeastOneValidLocation: boolean = false
    let lastValidLocation: string = ''
    patterns.forEach(currentPattern => {
        let matchingLocations = glob.sync(currentPattern, { cwd: centralPath })
        matchingLocations.forEach(location => {
            try {
                let validLocation: boolean = isJGivenReportLocation(path.join(centralPath, location))
                if (!uploadedLocations.has(location) && validLocation) {
                    lastValidLocation = path.join(centralPath, location)
                    indexProcessor.uploadJGivenReportForLocation(path.join(centralPath, location))
                    hasAtLeastOneValidLocation = true
                    uploadedLocations.add(location)
                }
            } catch (e) {
                console.error(`Skipping location ${path.join(centralPath, location)} due to an error.`)
                console.error(e)
            }
        })
    })

    if (!hasAtLeastOneValidLocation) {
        tl.setResult(tl.TaskResult.Failed, "The pattern(s) didn't match any path.")
        return
    }
    uploadTags(lastValidLocation)
    uploadTheLocationMappings(path.join(lastValidLocation, 'data/mappings.js'))
}

function isJGivenReportLocation(location: string): boolean {
    return fs.existsSync(path.join(location, 'app.bundle.js')) && fs.existsSync(path.join(location, 'data/metaData.js'))
}

function uploadTags(location: string) {
    let tagJSON: string = JSON.stringify(mapToJSONObject(tagMap))
    writeContentToFile(path.join(location, 'data/parsed/tags.js'), tagJSON)
    attachmentUploader.addAttachmentWithNameAndType(path.join(location, 'data/parsed/tags.js'), 'tags')
}

function mapToJSONObject(givenMap: Map<any, any>) {
    const object = Object.create(null)
    givenMap.forEach((value, key) => {
        if (value instanceof Map) {
            object[key] = mapToJSONObject(value)
        }
        else {
            object[key] = value
        }
    })
    return object
}

function uploadAllTheThumbnails() {
    for (let thumbnailLocation of thumbLocations) {
        let imageExtension: string = thumbnailLocation.slice(thumbnailLocation.lastIndexOf('.'))
        let imageLocation: string = removeThumbFromFileName(thumbnailLocation)
        let croppedLocation: string = imageLocation.slice(imageLocation.indexOf("attachments"), imageLocation.length)
        croppedLocation = transformWindowsPathToPosix(croppedLocation)

        locationMappings.forEach((value, key) => {
            if (value === croppedLocation) {
                let fileNameOfImage: string = key.slice(key.lastIndexOf(`jgivenFile_`), key.lastIndexOf(`.`))
                verifyLocationAndUpload(thumbnailLocation, 'attachmentFile', `${fileNameOfImage}-thumb${imageExtension}`)
            }
        })
    }
}

function uploadTheLocationMappings(path: string): void {
    let jsonContent: string = locationMappingsToJSON()
    fs.writeFileSync(path, jsonContent)
    attachmentUploader.addAttachmentWithNameAndType(path, "locationMappings")
}

function addTags(jsonContent: string) {
    let newTagMap: TagMap = jsonToTagMap(JSON.stringify(jsonContent))
    newTagMap.forEach((_, primaryKey) => {
        if (newTagMap.get(primaryKey)!.size) {
            newTagMap.get(primaryKey)!.forEach((value, key) => {
                tagMap.get(primaryKey)!.set(key, value)
            })
        }
    })
}

function writeContentToFile(filePath: string, fileContent: string): void {
    fs.writeFileSync(filePath, fileContent)
}

function writeJSONFromZippedFile(dataFilePath: string, dataWritePath: string) {
    let fileContent: string = getFileContent(dataFilePath)
    let zippedContent: string = fileContent.slice(fileContent.indexOf("'") + 1, fileContent.lastIndexOf("'"))
    let unzippedContent: string = pako.ungzip(Buffer.from(zippedContent, 'base64'), { to: 'string' })
    let scenariosString: string = unzippedContent.slice(unzippedContent.indexOf("["), unzippedContent.lastIndexOf("]") + 1)

    writeContentToFile(dataWritePath, scenariosString)
}

function getJSONFromDataFileAndWrite(dataFilePath: string, dataWritePath: string) {
    let fileContent: string = getFileContent(dataFilePath)
    let jsonContent: string = fileContent.slice(fileContent.indexOf('{'), fileContent.lastIndexOf('}') + 1)
    writeContentToFile(dataWritePath, jsonContent)

    return JSON.parse(jsonContent)
}

function getFileContent(filePath: string): string {
    return fs.readFileSync(filePath).toString()
}

function recursivelyUploadAttachmentsUnder(currentPath: string): void {
    if (!fs.existsSync(currentPath)) {
        return
    }
    if (fs.lstatSync(currentPath).isFile()) {
        attachmentUploader.addAttachmentWithNameAndType(currentPath, 'attachmentFile')
    } else {
        for (let directoryElement of
            fs.readdirSync(currentPath)) {
            recursivelyUploadAttachmentsUnder(path.join(currentPath, directoryElement))
        }
    }
}

function transformWindowsPathToPosix(location: string) {
    if (path.sep === `\\`) {
        location = location.split('\\').join('/');
        location = path.posix.normalize(location);
    }

    return location
}

function verifyLocationAndUpload(location: string, type: string, name: string): void {
    if (!fs.existsSync(location)) {
        tl.setResult(tl.TaskResult.Failed, `The given location ${location} does not exist.`)
        return
    }
    console.log(`##vso[task.addattachment type=${type};name=${jobId}-${name};]` + location)
}

function getReportPatterns(): Array<string> {
    let sourcesDirectory: string = tl.getInput("workingDir") || tl.getVariable("build.sourcesdirectory")!
    let jgivenReportPatterns: Array<string> = tl.getDelimitedInput("jgivenReportPatterns", '#')
    if (!jgivenReportPatterns.length) {
        jgivenReportPatterns = ['*/build/reports/jgiven/html5/']
    }

    centralPath = sourcesDirectory

    return jgivenReportPatterns
}

function locationMappingsToJSON(): string {
    return JSON.stringify(Array.from(locationMappings.entries()))
}

function removeThumbFromFileName(fileName: string) {
    return fileName.slice(0, fileName.lastIndexOf('-thumb')) +
        fileName.slice(fileName.lastIndexOf('-thumb') + 6)
}

uploadAllJGivenReports()
