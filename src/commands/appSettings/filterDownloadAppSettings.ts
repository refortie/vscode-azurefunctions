/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { DialogResponses, IActionContext } from "vscode-azureextensionui";
import { ext } from "../../extensionVariables";
import { localize } from "../../localize";

export async function filterDownloadAppSettings(context: IActionContext, sourceSettings: { [key: string]: string }, destinationSettings: { [key: string]: string }, destinationSettingsToIgnore: { [key: string]: string }, destinationName: string): Promise<void> {
    let suppressPrompt: boolean = false;
    let overwriteSetting: boolean = false;
    let showPromptForSettingsToIgnore = false;
    let overwriteSettingsToIgnore: boolean = false;

    const addedKeys: string[] = [];
    const updatedKeys: string[] = [];
    const userIgnoredKeys: string[] = [];
    const matchingKeys: string[] = [];
    const securitySettingsIgnored: string[] = [];
    const listOfSettingsToIgnore: string[] = ["AzureWebJobsStorage", "WEBSITE_CONTENTAZUREFILECONNECTIONSTRING", "WEBSITE_CONTENTSHARE"];

    const yesToAll: vscode.MessageItem = { title: localize('yesToAll', 'Yes to all') };
    const noToAll: vscode.MessageItem = { title: localize('noToAll', 'No to all') };


    for (const key of Object.keys(sourceSettings)) {
        if (listOfSettingsToIgnore.includes(key)) {
            if (!showPromptForSettingsToIgnore) {
                const message: string = localize('overwriteSettingsToIgnore', 'Setting "{0}" has been identified as unsafe. Download?', key);
                const result: vscode.MessageItem = await context.ui.showWarningMessage(message, { modal: true }, DialogResponses.yes, yesToAll, DialogResponses.no, noToAll);
                overwriteSettingsToIgnore = result === DialogResponses.yes || result === yesToAll;
                showPromptForSettingsToIgnore = result === yesToAll || result === noToAll;
            }
            if (overwriteSettingsToIgnore) {
                updatedKeys.push(key);
                destinationSettings[key] = sourceSettings[key];
            } else {
                securitySettingsIgnored.push(key);
                destinationSettings[key] = "_REDACTED_";
                destinationSettingsToIgnore[key] = "";
            }
        }
        else {
            if (destinationSettings[key] === undefined) {
                addedKeys.push(key);
                destinationSettings[key] = sourceSettings[key];
            } else if (destinationSettings[key] === sourceSettings[key]) {
                matchingKeys.push(key);
            } else if (sourceSettings[key]) {
                if (!suppressPrompt) {
                    const message: string = localize('overwriteSetting', 'Setting "{0}" already exists in "{1}". Overwrite?', key, destinationName);
                    const result: vscode.MessageItem = await context.ui.showWarningMessage(message, { modal: true }, DialogResponses.yes, yesToAll, DialogResponses.no, noToAll);
                    overwriteSetting = result === DialogResponses.yes || result === yesToAll;
                    suppressPrompt = result === yesToAll || result === noToAll;
                }
                if (overwriteSetting) {
                    updatedKeys.push(key);
                    destinationSettings[key] = sourceSettings[key];
                } else {
                    userIgnoredKeys.push(key);
                }
            }
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
