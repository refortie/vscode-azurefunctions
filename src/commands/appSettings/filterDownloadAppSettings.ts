/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { IActionContext } from "vscode-azureextensionui";
import { ext } from "../../extensionVariables";
import { localize } from "../../localize";

export async function filterDownloadAppSettings(context: IActionContext, sourceSettings: { [key: string]: string }, destinationSettings: { [key: string]: string }, destinationSettingsToIgnore: string[], destinationName: string): Promise<void> {

    const addedKeys: string[] = [];
    const updatedKeys: string[] = [];
    const userIgnoredKeys: string[] = [];
    const matchingKeys: string[] = [];

    const listOfSettingsToIgnore: string[] = ["AzureWebJobsStorage", "WEBSITE_CONTENTAZUREFILECONNECTIONSTRING", "WEBSITE_CONTENTSHARE"];
    const userChosenSettings: string[] = [];
    const options: vscode.QuickPickItem[] = [];
    destinationSettingsToIgnore.length = 0;

    for (const element of Object.keys(sourceSettings)) {
        if (listOfSettingsToIgnore.includes(element)) {
            options.push({
                label: element
            });
        }
        else {
            options.push({
                label: element,
                picked: true
            });
        }
    }

    const result = await context.ui.showQuickPick(options, { placeHolder: 'Please select the app settings you would like to download:', canPickMany: true });

    while (result.length != 0) {
        const temp = result.pop();
        if (temp === undefined) break;
        userChosenSettings.push(temp?.label);
    }

    for (const key of Object.keys(sourceSettings)) {
        if (userChosenSettings.includes(key)) {
            if (destinationSettings[key] === undefined) { // when app setting does not exist locally
                addedKeys.push(key);
                destinationSettings[key] = sourceSettings[key];
            } else if (destinationSettings[key] === sourceSettings[key]) {
                matchingKeys.push(key);
            } else if (sourceSettings[key]) {
                updatedKeys.push(key);
                destinationSettings[key] = sourceSettings[key];
            }
        }
        else {
            userIgnoredKeys.push(key);
            destinationSettings[key] = "_REDACTED_";
            destinationSettingsToIgnore.push(key);
        }
    }

    if (addedKeys.length > 0) {
        ext.outputChannel.appendLog(localize('addedKeys', 'Added the following settings:'));
        addedKeys.forEach(logKey);
    }

    if (updatedKeys.length > 0) {
        ext.outputChannel.appendLog(localize('updatedKeys', 'Updated the following settings:'));
        updatedKeys.forEach(logKey);
    }

    if (matchingKeys.length > 0) {
        ext.outputChannel.appendLog(localize('matchingKeys', 'Ignored the following settings that were already the same:'));
        matchingKeys.forEach(logKey);
    }

    if (userIgnoredKeys.length > 0) {
        ext.outputChannel.appendLog(localize('userIgnoredKeys', 'Ignored the following settings based on user input:'));
        userIgnoredKeys.forEach(logKey);
    }

    if (Object.keys(destinationSettings).length > Object.keys(sourceSettings).length) {
        ext.outputChannel.appendLog(localize('noDeleteKey', 'WARNING: This operation will not delete any settings in "{0}". You must manually delete settings if desired.', destinationName));
    }
}

function logKey(key: string): void {
    ext.outputChannel.appendLine(`- ${key}`);
}
