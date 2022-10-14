export type TagMap = Map<string, Map<string, Map<string, string | Array<string>>>>

export function jsonToTagMap(givenJSON: string): TagMap {
    let tagMap: TagMap = new Map(Object.entries(JSON.parse(givenJSON)))
    for (let primaryLevel of tagMap.keys()) {
        tagMap.set(primaryLevel, new Map(Object.entries(tagMap.get(primaryLevel)!)))
        for (let secondaryLevel of tagMap.get(primaryLevel)!.keys()) {
            tagMap.get(primaryLevel)!.set(secondaryLevel, new Map(Object.entries(tagMap.get(primaryLevel)!.get(secondaryLevel)!)))
        }
    }
    return tagMap
}