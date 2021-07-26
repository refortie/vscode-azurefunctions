import * as path from 'path';
import * as vscode from 'vscode';
import { WorkspaceFolder } from 'vscode';
import { AzExtTreeItem, IActionContext } from 'vscode-azureextensionui';
import { selectWorkspaceFolder } from '../../utils/workspace';
import { tryGetFunctionProjectRoot } from '../createNewProject/verifyIsProject';

/**
 * Runs the opened App Function project in a dev container - dev container folder already exists
 * @param context - actions for function
 * @param node - App Function Project
 */
export async function updateContainer(context: IActionContext, node: AzExtTreeItem): Promise<void> {

    const projectFilePath: string = await getDevContainerFolder(context, node.label);
    vscode.commands.executeCommand('remote-containers.reopenInContainer', vscode.Uri.file(projectFilePath))
}

export async function getDevContainerFolder(context: IActionContext, message: string, workspacePath?: string): Promise<string> {

    return await selectWorkspaceFolder(context, message, async (f: WorkspaceFolder): Promise<string> => {
        workspacePath = f.uri.fsPath;
        const projectPath: string = await tryGetFunctionProjectRoot(context, workspacePath, true /* suppressPrompt */) || workspacePath;
        return path.relative(workspacePath, projectPath);
    });
}
