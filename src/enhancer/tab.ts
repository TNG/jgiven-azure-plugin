import Controls = require("VSS/Controls");
import TFS_Build_Contracts = require("TFS/Build/Contracts");
import TFS_Build_Extension_Contracts = require("TFS/Build/ExtensionContracts");
import DT_Client = require("TFS/DistributedTask/TaskRestClient");
import { TaskAttachment } from "TFS/DistributedTask/Contracts";
import { updateHtml, getAllUserAttachmentLocations, getScriptDefinitions, getJobIdFromName } from './helper'

let _currentInfoTab: InfoTab;

export class InfoTab extends Controls.BaseControl {
	private locationTranslation: Map<string, Map<string, string>> = new Map()
	private jgivenFileToLocalPath: Map<string, Map<string, string>> = new Map()
	private toBeIncludedInHTML: Array<any> = []
	private vsoContext: WebContext
	private build: TFS_Build_Contracts.Build
	private taskClient: DT_Client.TaskHttpClient4_1

	constructor() {
		super();
	}

	public initialize(): void {
		super.initialize();
		let sharedConfig: TFS_Build_Extension_Contracts.IBuildResultsViewExtensionConfig = VSS.getConfiguration();
		this.vsoContext = VSS.getWebContext();

		if (sharedConfig) {
			sharedConfig.onBuildChanged((_build: TFS_Build_Contracts.Build) => {
				_currentInfoTab = this
				this.build = _build
				this._initBuildInfo(_build);
				this.taskClient = DT_Client.getClient();
				this.getJGivenFileToLocalPathTranslations()
					.then(async function () {
						let attachmentLinks = await _currentInfoTab.getAttachmentLinks('attachmentFile')
						getAllUserAttachmentLocations(attachmentLinks, _currentInfoTab.jgivenFileToLocalPath, _currentInfoTab.locationTranslation)
					})
					.then(async function () {
						let metadataContents = await _currentInfoTab.getAttachmentContents('metadata')
						let tagsContents = await _currentInfoTab.getAttachmentContents('tags')
						let dataContents = await _currentInfoTab.getAttachmentContents('data')
						getScriptDefinitions(metadataContents, _currentInfoTab.toBeIncludedInHTML, tagsContents, dataContents,
							_currentInfoTab.locationTranslation)
					})
					.then(async function () {
						let allHtml = await _currentInfoTab.getAttachmentContents("html");
						updateHtml(allHtml, _currentInfoTab.toBeIncludedInHTML)
					})
			});
		}
	}

	private async getJGivenFileToLocalPathTranslations() {
		let attachmentContents = await _currentInfoTab.getAttachmentContents("locationMappings")
		for (let jobId of attachmentContents.keys()) {
			let jsonString: string = attachmentContents.get(jobId)![0]
			_currentInfoTab.jgivenFileToLocalPath.set(jobId, new Map(JSON.parse(jsonString)));
			_currentInfoTab.locationTranslation.set(jobId, new Map())
		}
	}

	private async getAttachmentsWithType(type: string) {
		let taskAttachments: TaskAttachment[] = []
		await _currentInfoTab.taskClient.getPlanAttachments(_currentInfoTab.vsoContext.project.id, "build", _currentInfoTab.build.orchestrationPlan.planId, type).then((attachments) => {
			taskAttachments = attachments;
		});

		return taskAttachments;
	}

	private async getAttachmentContents(type: string) {
		let attachmentContents: Map<string, Array<string>> = new Map()
		let allAttachments: TaskAttachment[] = await _currentInfoTab.getAttachmentsWithType(type)
		for (let attachment of allAttachments) {
			if (attachment._links && attachment._links.self && attachment._links.self.href) {
				let recordId = attachment.recordId;
				let timelineId = attachment.timelineId;
				let attachmentName = attachment.name;
				let jobIdOfAttachment = getJobIdFromName(attachmentName)

				await _currentInfoTab.taskClient.getAttachmentContent(_currentInfoTab.vsoContext.project.id, "build", _currentInfoTab.build.orchestrationPlan.planId,
					timelineId, recordId, type, attachmentName).then(attachmentContent => {
						if (!attachmentContents.has(jobIdOfAttachment)) {
							attachmentContents.set(jobIdOfAttachment, [])
						}
						attachmentContents.get(jobIdOfAttachment).push(_currentInfoTab.getPlainTextFromArrayBuffer(attachmentContent))
					});
			}
		}

		return attachmentContents
	}

	private async getAttachmentLinks(type: string) {
		let attachmentLinks: Map<string, Array<string>> = new Map()
		let attachmentWithTypes = await _currentInfoTab.getAttachmentsWithType(type)
		$.each(attachmentWithTypes, (index, attachment) => {
			if (attachment._links && attachment._links.self && attachment._links.self.href) {
				let jobId = getJobIdFromName(attachment.name)
				if (!attachmentLinks.has(jobId)) {
					attachmentLinks.set(jobId, []);
				}
				attachmentLinks.get(jobId).push(attachment._links.self.href)
			}
		});

		return attachmentLinks
	}

	private getPlainTextFromArrayBuffer(arrayBuffer: ArrayBuffer): string {
		const decoder = new TextDecoder("utf-8");
		return decoder.decode(arrayBuffer);
	}

	private _initBuildInfo(build: TFS_Build_Contracts.Build) {

	}
}

InfoTab.enhance(InfoTab, $(".jgiven-report"), {});

VSS.notifyLoadSucceeded();
