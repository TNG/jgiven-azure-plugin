type TagMap = Map<string, Map<string, Map<string, string | Array<string>>>>

export function updateHtml(allHtml: Map<any, any>, toBeIncludedInHTML: Array<any>) {
    let jgivenHtml: string = allHtml.get(Array.from(allHtml.keys())[0])![0];
    jgivenHtml = getNewLocations(jgivenHtml);
    let jgivenHtmlElement = new DOMParser().parseFromString(jgivenHtml, "text/html");
    for (let script of toBeIncludedInHTML) {
        jgivenHtmlElement.body.append(script);
    }
    document.documentElement.remove()
    let iframe = document.createElement("iframe")
    iframe.srcdoc = jgivenHtmlElement.documentElement.outerHTML
    iframe.style.height = "100%"
    iframe.style.width = "100%"
    iframe.style.border = "0"
    document.write(iframe.outerHTML)
}

function getNewLocations(content: string): string {
    let index: number = content.indexOf('data/');
    while (index != -1) {
        content = content.slice(0, index) + content.slice(index + 5);
        index = content.indexOf('data/');
    }

    return content
}

export function getAllUserAttachmentLocations(attachmentLinks: Map<any, any>, jgivenFileToLocalPath: Map<any, any>, locationTranslation: Map<any, any>) {
    for (let jobId of attachmentLinks.keys()) {
        $.each(attachmentLinks.get(jobId), (index, attachmentLink) => {
            let jgivenFileName: string = attachmentLink.slice(attachmentLink.indexOf("jgivenFile_"));
            let localPath: string = jgivenFileToLocalPath.get(jobId).get(jgivenFileName)
            if (!locationTranslation.has(jobId)) {
                locationTranslation.set(jobId, new Map())
            }
            locationTranslation.get(jobId).set(localPath, attachmentLink)
        })
    }
}

export function getScriptDefinitions(metadataContents: Map<any, any>, toBeIncludedInHTML, tagsContents, dataContents,
    locationTranslation) {
    let allJobIds = Array.from(metadataContents.keys())
    let metadataJSON: string = metadataContents.get(allJobIds[0])!
    let tagsJson = mergeAllTags(tagsContents)
    toBeIncludedInHTML.push(createScriptWithContent(`jgivenReport.metaData = ${metadataJSON}`))
    toBeIncludedInHTML.push(createScriptWithContent(`jgivenReport.setTags(${tagsJson})`))

    for (let jobId of allJobIds) {
        $.each(dataContents.get(jobId)!, (index, dataJSONContent) => {
            for (let localPath of locationTranslation.get(jobId)!.keys()) {
                let from: number = 0
                let startingIndex: number = dataJSONContent.indexOf(localPath, from)
                while (startingIndex != -1) {
                    let localPathLength: number = localPath.length
                    let newLink: string = locationTranslation.get(jobId)!.get(localPath)
                    dataJSONContent = dataJSONContent.slice(0, startingIndex) + newLink + dataJSONContent.slice(startingIndex + localPathLength, dataJSONContent.length)
                    from = startingIndex + newLink.length
                    startingIndex = dataJSONContent.indexOf(localPath, from)
                }
            }
            toBeIncludedInHTML.push(createScriptWithContent(`jgivenReport.addScenarios(${dataJSONContent});`))
        })
    }
}

export function createScriptWithContent(content: string) {
    let domElement = document.createElement("script");
    domElement.innerHTML = content;
    return domElement;
}

export function getJobIdFromName(name: string): string {
    return name.slice(0, name.indexOf('-jgivenFile'));
}

function mergeAllTags(tagsForId: Map<string, Array<string>>) {
    var tagMap: TagMap = new Map([
        ["tagTypeMap", new Map()],
        ["tags", new Map()]
    ])
    for (let jobId of tagsForId.keys()) {
        let tagsForThisJob: string = tagsForId.get(jobId)![0]
        addTags(tagsForThisJob, tagMap)
    }

    return JSON.stringify(mapToJSONObject(tagMap))
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

function jsonToTagMap(givenJSON: string): TagMap {
    let tagMap: TagMap = new Map(Object.entries(JSON.parse(givenJSON)))
    for (let primaryLevel of tagMap.keys()) {
        tagMap.set(primaryLevel, new Map(Object.entries(tagMap.get(primaryLevel)!)))
        for (let secondaryLevel of tagMap.get(primaryLevel)!.keys()) {
            tagMap.get(primaryLevel)!.set(secondaryLevel, new Map(Object.entries(tagMap.get(primaryLevel)!.get(secondaryLevel)!)))
        }
    }
    return tagMap
}

function addTags(jsonContent: string, tagMap: TagMap) {
    let newTagMap: TagMap = jsonToTagMap(jsonContent)
    newTagMap.forEach((_, primaryKey) => {
        if (newTagMap.get(primaryKey)!.size) {
            newTagMap.get(primaryKey)!.forEach((value, key) => {
                tagMap.get(primaryKey)!.set(key, value)
            })
        }
    })
}
