import * as vscode from 'vscode';
import { AzExtTreeItem, IActionContext } from 'vscode-azureextensionui';
import { getDevContainerFolder } from './getDevContainerFolder';
import { downloadLocalDevFiles } from './localDockerSupport';

// dev container does NOT exist - need to download files and then reopen
export async function runInContainer(context: IActionContext, node: AzExtTreeItem): Promise<void> {

    await downloadLocalDevFiles(devContainerFolderPathUri, devContainerName);
    const projectFilePath: string = await getDevContainerFolder(context, node.label);
    vscode.commands.executeCommand('remote-containers.reopenInContainer', vscode.Uri.file(projectFilePath))
}
