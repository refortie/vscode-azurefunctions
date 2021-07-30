/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { commands } from 'vscode';
import { AppSettingsTreeItem, AppSettingTreeItem, registerSiteCommand } from 'vscode-azureappservice';
import { AzExtParentTreeItem, AzExtTreeItem, AzureTreeItem, IActionContext, registerCommand } from 'vscode-azureextensionui';
import { cloneLocally } from '../downloadAzureProject/cloneProjectLocally';
import { ext } from '../extensionVariables';
import { installOrUpdateFuncCoreTools } from '../funcCoreTools/installOrUpdateFuncCoreTools';
import { uninstallFuncCoreTools } from '../funcCoreTools/uninstallFuncCoreTools';
import { ProductionSlotTreeItem } from '../tree/ProductionSlotTreeItem';
import { ProxyTreeItem } from '../tree/ProxyTreeItem';
import { SlotTreeItem } from '../tree/SlotTreeItem';
import { addBinding } from './addBinding/addBinding';
import { decryptLocalSettings } from './appSettings/decryptLocalSettings';
import { downloadAppSettings } from './appSettings/downloadAppSettings';
import { encryptLocalSettings } from './appSettings/encryptLocalSettings';
import { setAzureWebJobsStorage } from './appSettings/setAzureWebJobsStorage';
import { toggleSlotSetting } from './appSettings/toggleSlotSetting';
import { uploadAppSettings } from './appSettings/uploadAppSettings';
import { browseWebsite } from './browseWebsite';
import { configureDeploymentSource } from './configureDeploymentSource';
import { copyFunctionUrl } from './copyFunctionUrl';
import { createChildNode } from './createChildNode';
import { createFunctionFromCommand } from './createFunction/createFunction';
import { createFunctionApp, createFunctionAppAdvanced } from './createFunctionApp/createFunctionApp';
import { createNewProjectFromCommand } from './createNewProject/createNewProject';
import { createSlot } from './createSlot';
import { deleteFunction } from './deleteFunction';
import { deleteNode } from './deleteNode';
import { deployProductionSlot, deploySlot } from './deploy/deploy';
import { connectToGitHub } from './deployments/connectToGitHub';
import { disconnectRepo } from './deployments/disconnectRepo';
import { redeployDeployment } from './deployments/redeployDeployment';
import { viewCommitInGitHub } from './deployments/viewCommitInGitHub';
import { viewDeploymentLogs } from './deployments/viewDeploymentLogs';
import { reopenInContainer } from './dockersupport/reopenInContainer';
import { updateContainer } from './dockersupport/updateContainer';
import { editAppSetting } from './editAppSetting';
import { executeFunction } from './executeFunction';
import { initProjectForVSCode } from './initProjectForVSCode/initProjectForVSCode';
import { startStreamingLogs } from './logstream/startStreamingLogs';
import { stopStreamingLogs } from './logstream/stopStreamingLogs';
import { openFile } from './openFile';
import { openInPortal } from './openInPortal';
import { pickFuncProcess } from './pickFuncProcess';
import { startRemoteDebug } from './remoteDebug/startRemoteDebug';
import { remoteDebugJavaFunctionApp } from './remoteDebugJava/remoteDebugJavaFunctionApp';
import { renameAppSetting } from './renameAppSetting';
import { restartFunctionApp } from './restartFunctionApp';
import { startFunctionApp } from './startFunctionApp';
import { stopFunctionApp } from './stopFunctionApp';
import { swapSlot } from './swapSlot';
import { disableFunction, enableFunction } from './updateDisabledState';
import { viewProperties } from './viewProperties';


export function registerCommands(): void {
    registerCommand('azureFunctions.addBinding', addBinding);
    registerCommand('azureFunctions.appSettings.add', async (context: IActionContext, node?: AzExtParentTreeItem) => await createChildNode(context, AppSettingsTreeItem.contextValue, node));
    registerCommand('azureFunctions.appSettings.decrypt', decryptLocalSettings);
    registerCommand('azureFunctions.appSettings.delete', async (context: IActionContext, node?: AzExtTreeItem) => await deleteNode(context, AppSettingTreeItem.contextValue, node));
    registerCommand('azureFunctions.appSettings.download', downloadAppSettings);
    registerCommand('azureFunctions.appSettings.edit', editAppSetting);
    registerCommand('azureFunctions.appSettings.encrypt', encryptLocalSettings);
    registerCommand('azureFunctions.appSettings.rename', renameAppSetting);
    registerCommand('azureFunctions.appSettings.toggleSlotSetting', toggleSlotSetting);
    registerCommand('azureFunctions.appSettings.upload', uploadAppSettings);
    registerCommand('azureFunctions.browseWebsite', browseWebsite);
    registerCommand('azureFunctions.configureDeploymentSource', configureDeploymentSource);
    registerCommand('azureFunctions.connectToGitHub', connectToGitHub);
    registerCommand('azureFunctions.copyFunctionUrl', copyFunctionUrl);
    registerCommand('azureFunctions.createFunction', createFunctionFromCommand);
    registerCommand('azureFunctions.createFunctionApp', createFunctionApp);
    registerCommand('azureFunctions.createFunctionAppAdvanced', createFunctionAppAdvanced);
    registerCommand('azureFunctions.createNewProject', createNewProjectFromCommand);
    registerCommand('azureFunctions.createSlot', createSlot);
    registerCommand('azureFunctions.deleteFunction', deleteFunction);
    registerCommand('azureFunctions.deleteFunctionApp', async (context: IActionContext, node?: AzExtTreeItem) => await deleteNode(context, ProductionSlotTreeItem.contextValue, node)); // menu item 3
    registerCommand('azureFunctions.deleteProxy', async (context: IActionContext, node?: AzExtTreeItem) => await deleteNode(context, ProxyTreeItem.contextValue, node));
    registerCommand('azureFunctions.deleteSlot', async (context: IActionContext, node?: AzExtTreeItem) => await deleteNode(context, SlotTreeItem.contextValue, node));
    registerCommand('azureFunctions.disableFunction', disableFunction);
    registerSiteCommand('azureFunctions.deploy', deployProductionSlot);
    registerSiteCommand('azureFunctions.deploySlot', deploySlot);
    registerCommand('azureFunctions.disconnectRepo', disconnectRepo);
    registerCommand('azureFunctions.enableFunction', enableFunction);
    registerCommand('azureFunctions.executeFunction', executeFunction);
    registerCommand('azureFunctions.initProjectForVSCode', initProjectForVSCode);
    registerCommand('azureFunctions.installOrUpdateFuncCoreTools', installOrUpdateFuncCoreTools);
    registerCommand('azureFunctions.loadMore', async (context: IActionContext, node: AzureTreeItem) => await ext.tree.loadMore(node, context));
    registerCommand('azureFunctions.openFile', openFile);
    registerCommand('azureFunctions.openInPortal', openInPortal);
    registerCommand('azureFunctions.pickProcess', pickFuncProcess);
    registerSiteCommand('azureFunctions.redeploy', redeployDeployment);
    registerCommand('azureFunctions.refresh', async (context: IActionContext, node?: AzureTreeItem) => await ext.tree.refresh(context, node));
    registerCommand('azureFunctions.restartFunctionApp', restartFunctionApp);
    registerCommand('azureFunctions.selectSubscriptions', () => commands.executeCommand('azure-account.selectSubscriptions'));
    registerCommand('azureFunctions.setAzureWebJobsStorage', setAzureWebJobsStorage);
    registerCommand('azureFunctions.startFunctionApp', startFunctionApp);
    registerCommand('azureFunctions.startJavaRemoteDebug', remoteDebugJavaFunctionApp);
    registerCommand('azureFunctions.startRemoteDebug', startRemoteDebug);
    registerCommand('azureFunctions.startStreamingLogs', startStreamingLogs);
    registerCommand('azureFunctions.stopFunctionApp', stopFunctionApp);
    registerCommand('azureFunctions.stopStreamingLogs', stopStreamingLogs);
    registerCommand('azureFunctions.swapSlot', swapSlot);
    registerCommand('azureFunctions.toggleAppSettingVisibility', async (context: IActionContext, node: AppSettingTreeItem) => { await node.toggleValueVisibility(context); }, 250);
    registerCommand('azureFunctions.uninstallFuncCoreTools', uninstallFuncCoreTools);
    registerCommand('azureFunctions.viewCommitInGitHub', viewCommitInGitHub);
    registerSiteCommand('azureFunctions.viewDeploymentLogs', viewDeploymentLogs);
    registerCommand('azureFunctions.viewProperties', viewProperties);
    registerCommand('azureFunctions.showOutputChannel', () => { ext.outputChannel.show(); });
    registerCommand('azureFunctions.cloneLocally', cloneLocally);
    registerCommand('azureFunctions.reopenInContainer', reopenInContainer);
    registerCommand('azureFunctions.updateContainer', updateContainer);

}
