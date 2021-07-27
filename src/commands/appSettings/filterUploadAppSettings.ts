/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { IActionContext } from "vscode-azureextensionui";
import { ext } from "../../extensionVariables";
import { localize } from "../../localize";

export async function filterUploadAppSettings(context: IActionContext, sourceSettings: { [key: string]: string }, destinationSettings: { [key: string]: string }, ignoredSettings: string[], destinationName: string): Promise<void> {
    const addedKeys: string[] = [];
    const updatedKeys: string[] = [];
    const userIgnoredKeys: string[] = [];
    const matchingKeys: string[] = [];
    const securitySettingsIgnored: string[] = [];

    const options: vscode.QuickPickItem[] = [];
    for (const element of Object.keys(sourceSettings)) {
        if (!ignoredSettings.includes(element) && (destinationSettings[element] != sourceSettings[element] || destinationSettings[element] === undefined)) {
            options.push({
                label: element
            });
        }
    }

    let userChosenSettings: string[] = [];
    if (options.length != 0) {
        const result = await context.ui.showQuickPick(options, { placeHolder: 'Select the modified app settings you would like to upload:', canPickMany: true });
        userChosenSettings = result ? result.map(item => item.label) : [];
    }

    for (const key of Object.keys(sourceSettings)) {
        if (destinationSettings[key] === sourceSettings[key]) {
            matchingKeys.push(key);
        }
        else if (userChosenSettings.includes(key)) {
            // Explicit check for undefined as destinationSettings[key] could be empty but valid
            if (destinationSettings[key] === undefined) {
                addedKeys.push(key);
            }
            else {
                updatedKeys.push(key);
            }
            destinationSettings[key] = sourceSettings[key];
        }
        else if (ignoredSettings.includes(key)) {
            securitySettingsIgnored.push(key);
        }
        else {
            userIgnoredKeys.push(key);
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

    if (securitySettingsIgnored.length > 0) {
        ext.outputChannel.appendLog(localize('securitySettingsIgnored', 'Ignored the following settings based on security and privacy:'));
        securitySettingsIgnored.forEach(logKey);
    }

    if (Object.keys(destinationSettings).length > Object.keys(sourceSettings).length) {
        ext.outputChannel.appendLog(localize('noDeleteKey', 'WARNING: This operation will not delete any settings in "{0}". You must manually delete settings if desired.', destinationName));
    }
}

function logKey(key: string): void {
    ext.outputChannel.appendLine(`- ${key}`);
}
