import * as path from 'path';
import * as vscode from 'vscode';
import { WorkspaceFolder } from "vscode";
import { IActionContext } from "vscode-azureextensionui";
import { getDevContainerName } from '../downloadAzureProject/setupProjectFolder';
import { ext } from '../extensionVariables';
import { localize } from "../localize";
import { ProductionSlotTreeItem } from '../tree/ProductionSlotTreeItem';
import { SlotTreeItemBase } from '../tree/SlotTreeItemBase';
import { requestUtils } from '../utils/requestUtils';
import { selectWorkspaceFolder } from '../utils/workspace';
import { tryGetFunctionProjectRoot } from './createNewProject/verifyIsProject';


export async function downloadDevContainer(context: IActionContext, node?: SlotTreeItemBase): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<SlotTreeItemBase>(ProductionSlotTreeItem.contextValue, context);
    }

    const language: string = await node.getApplicationLanguage();
    const devContainerName = getDevContainerName(language);
    if (devContainerName && node.site.reserved) {
        const message: string = localize('selectDevContainer', 'Select the destination file for the dev container folder.');
        let devContainerFolderPath: string = await getDevContainerFolder(context, message);

        if (devContainerFolderPath.substring(devContainerFolderPath.length - 13) != '.devcontainer') {
            devContainerFolderPath = path.join(devContainerFolderPath, '.devcontainer');
        }
        await requestUtils.downloadFile(
            `https://raw.githubusercontent.com/microsoft/vscode-dev-containers/master/containers/${devContainerName}/.devcontainer/devcontainer.json`,
            path.join(devContainerFolderPath, 'devcontainer.json')

        );
        await requestUtils.downloadFile(
            `https://raw.githubusercontent.com/microsoft/vscode-dev-containers/master/containers/${devContainerName}/.devcontainer/Dockerfile`,
            path.join(devContainerFolderPath, 'Dockerfile')

        );

        const reloadVSCode: string = localize('reload', 'Reload Current Folder');
        const newWindow: string = localize('reload', 'Open New Folder');
        void vscode.window.showInformationMessage(localize('downloaded', 'Successfully downloaded dev container files'), reloadVSCode, newWindow).then(async result => {
            if (result === reloadVSCode) {
                await vscode.commands.executeCommand('workbench.action.reloadWindow');
            } else if (result === newWindow) {
                const projectFilePath: string = devContainerFolderPath.substring(0, devContainerFolderPath.length - 13);
                await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(projectFilePath), true); // open the project in VS Code

            }
        });
    } else {
        void vscode.window.showInformationMessage(localize('noDownload', 'Conditions not met. Cant use Docker with this project'));
    }
}

export async function getDevContainerFolder(context: IActionContext, message: string, workspacePath?: string): Promise<string> {

    return await selectWorkspaceFolder(context, message, async (f: WorkspaceFolder): Promise<string> => {
        workspacePath = f.uri.fsPath;
        const projectPath: string = await tryGetFunctionProjectRoot(context, workspacePath, true /* suppressPrompt */) || workspacePath;
        return path.relative(workspacePath, projectPath);
    });
}
