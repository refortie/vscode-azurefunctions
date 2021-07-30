import * as vscode from 'vscode';
import { AzExtTreeItem, IActionContext } from 'vscode-azureextensionui';
import { localize } from '../../localize';
import { getProjectFolder } from './getProjectFolder';

/**
 * Rebuilds and reopens the opened function app project in a dev container
*/
export async function updateContainer(context: IActionContext, node: AzExtTreeItem): Promise<void> {

    try {
        const projectFilePath: string = await getProjectFolder(context, node.label);
        vscode.commands.executeCommand('remote-containers.rebuildAndReopenInContainer', vscode.Uri.file(projectFilePath))
    } catch (error) {
        const message: string = localize('cannotRebuildandReopen', 'Failed to update and reopen project in a dev container.');
        throw new Error(message);
    }
}
