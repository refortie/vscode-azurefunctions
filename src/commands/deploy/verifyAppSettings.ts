/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WebSiteManagementModels } from '@azure/arm-appservice';
import * as vscode from 'vscode';
import { SiteClient } from 'vscode-azureappservice';
import { DialogResponses, IActionContext } from 'vscode-azureextensionui';
import { contentConnectionStringKey, contentShareKey, extensionVersionKey, ProjectLanguage, runFromPackageKey, workerRuntimeKey } from '../../constants';
import { ext } from '../../extensionVariables';
import { FuncVersion, tryParseFuncVersion } from '../../FuncVersion';
import { localize } from '../../localize';
import { SlotTreeItemBase } from '../../tree/SlotTreeItemBase';
import { getFunctionsWorkerRuntime, isKnownWorkerRuntime } from '../../vsCodeConfig/settings';

/**
 * Just putting a few booleans in an object to avoid ordering mistakes if we passed them as individual params
 */
type VerifyAppSettingBooleans = { doRemoteBuild: boolean | undefined; isConsumption: boolean };

export async function verifyAppSettings(context: IActionContext, node: SlotTreeItemBase, version: FuncVersion, language: ProjectLanguage, bools: VerifyAppSettingBooleans): Promise<void> {
    const appSettings: WebSiteManagementModels.StringDictionary = await node.root.client.listApplicationSettings();
    if (appSettings.properties) {
        await verifyVersionAndLanguage(context, node.root.client.fullName, version, language, appSettings.properties);

        let updateAppSettings: boolean = false;
        if (node.root.client.isLinux) {
            if (bools.isConsumption) {
                updateAppSettings = await verifyWebContentSettings(context, appSettings.properties);
            }

            const remoteBuildSettingsChanged = verifyLinuxRemoteBuildSettings(context, appSettings.properties, bools);
            updateAppSettings = updateAppSettings || remoteBuildSettingsChanged;
        } else {
            updateAppSettings = verifyRunFromPackage(context, node.root.client, appSettings.properties);
        }

        if (updateAppSettings) {
            await node.root.client.updateApplicationSettings(appSettings);
            // if the user cancels the deployment, the app settings node doesn't reflect the updated settings
            await node.appSettingsTreeItem.refresh(context);
        }
    }
}

export async function verifyVersionAndLanguage(context: IActionContext, siteName: string, localVersion: FuncVersion, localLanguage: ProjectLanguage, remoteProperties: { [propertyName: string]: string }): Promise<void> {
    const rawAzureVersion: string = remoteProperties[extensionVersionKey];
    context.telemetry.properties.remoteVersion = rawAzureVersion;
    const azureVersion: FuncVersion | undefined = tryParseFuncVersion(rawAzureVersion);

    const azureWorkerRuntime: string | undefined = remoteProperties[workerRuntimeKey];
    context.telemetry.properties.remoteRuntime = azureWorkerRuntime;
    const localWorkerRuntime: string | undefined = getFunctionsWorkerRuntime(localLanguage);
    if (localVersion !== FuncVersion.v1 && isKnownWorkerRuntime(azureWorkerRuntime) && isKnownWorkerRuntime(localWorkerRuntime) && azureWorkerRuntime !== localWorkerRuntime) {
        throw new Error(localize('incompatibleRuntime', 'The remote runtime "{0}" for function app "{1}" does not match your local runtime "{2}".', azureWorkerRuntime, siteName, localWorkerRuntime));
    }

    if (!!rawAzureVersion && azureVersion !== localVersion) {
        const message: string = localize('incompatibleVersion', 'The remote version "{0}" for function app "{1}" does not match your local version "{2}".', rawAzureVersion, siteName, localVersion);
        const deployAnyway: vscode.MessageItem = { title: localize('deployAnyway', 'Deploy Anyway') };
        const learnMoreLink: string = 'https://aka.ms/azFuncRuntime';
        context.telemetry.properties.cancelStep = 'incompatibleVersion';
        // No need to check result - cancel will throw a UserCancelledError
        await context.ui.showWarningMessage(message, { modal: true, learnMoreLink }, deployAnyway);
        context.telemetry.properties.cancelStep = undefined;
    }
}

/**
 * Automatically set to 1 on windows plans because it has significant perf improvements
 * https://github.com/microsoft/vscode-azurefunctions/issues/1465
 */
function verifyRunFromPackage(context: IActionContext, client: SiteClient, remoteProperties: { [propertyName: string]: string }): boolean {
    const shouldAddSetting: boolean = !remoteProperties[runFromPackageKey];
    if (shouldAddSetting) {
        remoteProperties[runFromPackageKey] = '1';
        ext.outputChannel.appendLog(localize('addedRunFromPackage', 'Added app setting "{0}" to improve performance of function app. Learn more here: https://aka.ms/AA8vxc0', runFromPackageKey), { resourceName: client.fullName });
    }

    context.telemetry.properties.addedRunFromPackage = String(shouldAddSetting);
    return shouldAddSetting;
}

/**
 * We need this check due to this issue: https://github.com/Microsoft/vscode-azurefunctions/issues/625
 * Only applies to Linux Consumption apps
 */
async function verifyWebContentSettings(context: IActionContext, remoteProperties: { [propertyName: string]: string }): Promise<boolean> {
    const shouldRemoveSettings: boolean = !!(remoteProperties[contentConnectionStringKey] || remoteProperties[contentShareKey]);
    if (shouldRemoveSettings) {
        const message: string = localize('notConfiguredForDeploy', 'The selected app is not configured for deployment through VS Code. Remove app settings "{0}" and "{1}"?', contentConnectionStringKey, contentShareKey);
        await context.ui.showWarningMessage(message, { modal: true }, DialogResponses.yes);
        delete remoteProperties[contentConnectionStringKey];
        delete remoteProperties[contentShareKey];
    }

    context.telemetry.properties.webContentSettingsRemoved = String(shouldRemoveSettings);
    return shouldRemoveSettings;
}

function verifyLinuxRemoteBuildSettings(context: IActionContext, remoteProperties: { [propertyName: string]: string }, bools: VerifyAppSettingBooleans): boolean {
    let hasChanged: boolean = false;

    const keysToRemove: string[] = [];

    if (bools.doRemoteBuild) {
        keysToRemove.push(
            'WEBSITE_RUN_FROM_ZIP',
            'WEBSITE_RUN_FROM_PACKAGE'
        );
    }

    if (!bools.isConsumption) {
        const dedicatedBuildSettings: [string, string][] = [
            ['ENABLE_ORYX_BUILD', 'true'],
            ['SCM_DO_BUILD_DURING_DEPLOYMENT', '1'],
            ['BUILD_FLAGS', 'UseExpressBuild'],
            ['XDG_CACHE_HOME', '/tmp/.cache']
        ];

        for (const [key, value] of dedicatedBuildSettings) {
            if (!bools.doRemoteBuild) {
                keysToRemove.push(key);
            } else if (remoteProperties[key] !== value) {
                remoteProperties[key] = value;
                hasChanged = true;
            }
        }
    }

    for (const key of keysToRemove) {
        if (remoteProperties[key]) {
            delete remoteProperties[key];
            hasChanged = true;
        }
    }

    context.telemetry.properties.linuxBuildSettingsChanged = String(hasChanged);
    return hasChanged;
}

