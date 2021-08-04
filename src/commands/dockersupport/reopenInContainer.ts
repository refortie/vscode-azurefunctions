/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { AzExtTreeItem } from 'vscode-azureextensionui';
import { localize } from '../../localize';
import { IProjectWizardContext } from '../createNewProject/IProjectWizardContext';
import { getProjectFolder } from './getProjectFolder';

/**
 * Explorer menu item which reopens the local app functions project in a dev container
 */
export async function reopenInContainer(context: IProjectWizardContext, node?: AzExtTreeItem): Promise<void> {

    try {
        if (node) {
            const message: string = localize('selectFunctionProject', 'Select your App Functions Project');
            const projectFilePath: string = await getProjectFolder(context, message, context.workspacePath);
            vscode.commands.executeCommand('remote-containers.reopenInContainer', vscode.Uri.file(projectFilePath));
        } else {
            void vscode.window.showInformationMessage(localize('noProjectOpened', 'Conditions not met. Cannot use Docker with this project'));
        }
    } catch (error) {
        void vscode.window.showInformationMessage(localize('failReopenInContainer', 'Failed to reopen project in a dev container.'));
    }
}
