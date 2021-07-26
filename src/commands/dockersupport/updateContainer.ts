import * as vscode from 'vscode';
import { AzExtTreeItem, IActionContext } from 'vscode-azureextensionui';
import { getDevContainerFolder } from './getDevContainerFolder';

/**
 * Runs the opened App Function project in a dev container - dev container folder already exists
 * @param context - actions for function
 * @param node - App Function Project
 */
export async function updateContainer(context: IActionContext, node: AzExtTreeItem): Promise<void> {

    const projectFilePath: string = await getDevContainerFolder(context, node.label);
    vscode.commands.executeCommand('remote-containers.rebuildAndReopenInContainer', vscode.Uri.file(projectFilePath))
}
