import * as vscode from 'vscode';
import { AzExtTreeItem, IActionContext } from 'vscode-azureextensionui';

// dev container does NOT exist - need to download files and then reopen
export async function runInContainer(context: IActionContext, node: AzExtTreeItem): Promise<void> {

    const projectFilePath: string;
    vscode.commands.executeCommand('remote-containers.reopenInContainer', vscode.Uri.file(projectFilePath))
}
