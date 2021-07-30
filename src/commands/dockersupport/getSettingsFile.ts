/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fse from 'fs-extra';
import * as path from 'path';
import { workspace, WorkspaceFolder } from "vscode";
import { IActionContext } from "vscode-azureextensionui";
import { settingsFileName } from "../../constants";
import { localize } from "../../localize";
import { selectWorkspaceFile } from "../../utils/workspace";
import { tryGetFunctionProjectRoot } from "../createNewProject/verifyIsProject";

/**
 * Returns the settings.json file path from an opened functions app project
 */
export async function getSettingsFile(context: IActionContext, workspacePath?: string): Promise<string> {
    const folders: readonly WorkspaceFolder[] = workspace.workspaceFolders || [];
    if (workspacePath || folders.length === 1) {
        workspacePath = workspacePath || folders[0].uri.fsPath;
        const projectPath: string | undefined = await tryGetFunctionProjectRoot(context, workspacePath, true /* suppressPrompt */);
        if (projectPath) {
            const localSettingsFile: string = path.join(projectPath, settingsFileName);
            if (await fse.pathExists(localSettingsFile)) {
                return localSettingsFile;
            }
        }
    }

    const message: string = localize('selectSettingsFile', 'Select your settings.json file');
    return await selectWorkspaceFile(context, message, async (f: WorkspaceFolder): Promise<string> => {
        workspacePath = f.uri.fsPath;
        const projectPath: string = await tryGetFunctionProjectRoot(context, workspacePath, true /* suppressPrompt */) || workspacePath;
        return path.relative(workspacePath, path.join(projectPath, '.vscode', settingsFileName));
    });
}
