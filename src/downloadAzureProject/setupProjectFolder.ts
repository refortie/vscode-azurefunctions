/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WebSiteManagementModels } from '@azure/arm-appservice';
import { RequestPrepareOptions } from '@azure/ms-rest-js';
import * as extract from 'extract-zip';
import * as querystring from 'querystring';
import * as vscode from 'vscode';
import { IActionContext, parseError } from 'vscode-azureextensionui';
import { localDockerPrompt } from '../commands/dockersupport/localDockerSupport';
import { initProjectForVSCode } from '../commands/initProjectForVSCode/initProjectForVSCode';
import { ProjectLanguage } from '../constants';
import { ext } from '../extensionVariables';
import { localize } from '../localize';
import { ProductionSlotTreeItem } from '../tree/ProductionSlotTreeItem';
import { SlotTreeItemBase } from "../tree/SlotTreeItemBase";
import { getNameFromId } from '../utils/azure';
import { requestUtils } from '../utils/requestUtils';
import { getRequiredQueryParameter } from './handleUri';

// call this if starting from portal side (unchanged definition)
export async function setupProjectFolder(uri: vscode.Uri, vsCodeFilePathUri: vscode.Uri, context: IActionContext): Promise<void> {
    // this function parses through the Uri to get all the variables and then it calls setupProjectFolderParsed()
    const parsedQuery: querystring.ParsedUrlQuery = querystring.parse(uri.query);
    const resourceId: string = getRequiredQueryParameter(parsedQuery, 'resourceId');
    const devContainerName: string = getRequiredQueryParameter(parsedQuery, 'devcontainer');
    const language: string = getRequiredQueryParameter(parsedQuery, 'language');

    // for this call it will prompt user to choose subscription and function app again
    const node: SlotTreeItemBase = await ext.tree.showTreeItemPicker<SlotTreeItemBase>(ProductionSlotTreeItem.contextValue, context);

    await setupProjectFolderParsed(resourceId, language, vsCodeFilePathUri, context, node, devContainerName);
}

//call this directly if you are staring from VSCode extension
export async function setupProjectFolderParsed(resourceId: string, language: string,
    vsCodeFilePathUri: vscode.Uri, context: IActionContext, node?: SlotTreeItemBase, devContainerName?: string,): Promise<void> {

    if (!devContainerName) {
        devContainerName = getDevContainerName(language);
    }

    const toBeDeletedFolderPathUri: vscode.Uri = vscode.Uri.joinPath(vsCodeFilePathUri, 'temp');

    try {
        const functionAppName: string = getNameFromId(resourceId);
        const downloadFilePath: string = vscode.Uri.joinPath(toBeDeletedFolderPathUri, `${functionAppName}.zip`).fsPath;

        await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: localize('settingUpFunctionAppLocalProjInfoMessage', `Setting up project for function app '${functionAppName}' with language '${language}'.`) }, async () => {
            const slotTreeItem: SlotTreeItemBase | undefined = await ext.tree.findTreeItem(resourceId, { ...context, loadAll: true });
            const hostKeys: WebSiteManagementModels.HostKeys | undefined = await slotTreeItem?.client.listHostKeys();
            const defaultHostName: string | undefined = slotTreeItem?.client.defaultHostName;

            if (!!hostKeys && hostKeys.masterKey && defaultHostName) {
                const requestOptions: RequestPrepareOptions = {
                    method: 'GET',
                    url: `https://${defaultHostName}/admin/functions/download?includeCsproj=true&includeAppSettings=true`,
                    headers: { 'x-functions-key': hostKeys.masterKey }
                };
                await requestUtils.downloadFile(requestOptions, downloadFilePath);
            } else {
                throw new Error(localize('hostInformationNotFound', 'Failed to get host information for the functionApp.'));
            }

            const projectFilePathUri: vscode.Uri = vscode.Uri.joinPath(vsCodeFilePathUri, `${functionAppName}`);
            const projectFilePath: string = projectFilePathUri.fsPath;
            const devContainerFolderPathUri: vscode.Uri = vscode.Uri.joinPath(projectFilePathUri, '.devcontainer');
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            await extract(downloadFilePath, { dir: projectFilePath });
            await localDockerPrompt(context, devContainerFolderPathUri, node, devContainerName);
            await initProjectForVSCode(context, projectFilePath, getProjectLanguageForLanguage(language));
            void vscode.window.showInformationMessage(localize('restartingVsCodeInfoMessage', 'Restarting VS Code with your function app project'));
            await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(projectFilePath), true); // open the project in VS Code
        });
    } catch (err) {
        throw new Error(localize('failedLocalProjSetupErrorMessage', 'Failed to set up your local project: "{0}".', parseError(err).message));
    } finally {
        await vscode.workspace.fs.delete(
            vscode.Uri.file(toBeDeletedFolderPathUri.fsPath),
            {
                recursive: true,
                useTrash: true
            }
        );
    }
}

// Q: do we need to add any other languages here?
// referenced: getFunctionsWorkerRuntime(language);
function getProjectLanguageForLanguage(language: string): ProjectLanguage {
    // setup the language of the project
    switch (language) {
        case 'node':
            return ProjectLanguage.JavaScript;
        case 'python':
            return ProjectLanguage.Python;
        case 'powershell':
            return ProjectLanguage.PowerShell;
        case 'dotnetcore2.1':
        case 'dotnetcore3.1':
            return ProjectLanguage.CSharpScript;
        case 'dotnet':
            return ProjectLanguage.CSharp
        case 'java':
            return ProjectLanguage.Java;
        default:
            throw new Error(`Language not supported: ${language}`);
    }
}

// gets the devContainer name based on the language
// here we define which functions will have docker support
function getDevContainerName(language: string): string | undefined {
    switch (language) {
        case 'node':
            return 'azure-functions-node';
        case 'python':
            return 'azure-functions-python-3';
        /*
        case 'powershell':
            return 'azure-functions-pwsh';
        case 'dotnetcore2.1':
            return 'azure-functions-dotnetcore-2.1'
        case 'dotnetcore3.1':
            return 'azure-functions-dotnetcore-3.1'
        case 'dotnet':
            return 'azure-functions-dotnetcore-3.1';
        case 'java':
            return 'azure-functions-java-11';
        */
        default:
            return undefined;
    }
}
