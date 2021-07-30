/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fse from 'fs-extra';
import * as vscode from 'vscode';
import { AzExtTreeItem } from 'vscode-azureextensionui';
import { localize } from '../../localize';
import { IProjectWizardContext } from '../createNewProject/IProjectWizardContext';
import { getProjectFolder } from './getProjectFolder';
import { getSettingsFile } from './getSettingsFile';

/**
 * Explorer menu item which reopens the local app functions project in a dev container
 */
export async function reopenInContainer(context: IProjectWizardContext, node?: AzExtTreeItem): Promise<void> {

    try {
        const localSettingsPath: string | undefined = await getSettingsFile(context, context.workspacePath);
        const settings: { [key: string]: string } = <{ [key: string]: string }>await fse.readJSON(localSettingsPath);
        const language: string | undefined = context.language || settings["azureFunctions.projectLanguage"];

        if (language && node) {
            const message: string = localize('selectFunctionProject', 'Select your App Functions Project');
            const projectFilePath: string = await getProjectFolder(context, message, context.workspacePath);
            vscode.commands.executeCommand('remote-containers.reopenInContainer', vscode.Uri.file(projectFilePath));
        } else {
            void vscode.window.showInformationMessage(localize('noDownload', 'Conditions not met. Cannot use Docker with this project'));
        }
    } catch (error) {
        const message: string = localize('cannotFindSettingsFile', 'Failed to find settings.json file. Cannot reopen project in a dev container.');
        throw new Error(message);
    }
}
