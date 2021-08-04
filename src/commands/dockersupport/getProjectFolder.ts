/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { WorkspaceFolder } from "vscode";
import { IActionContext } from "vscode-azureextensionui";
import { selectWorkspaceFolder } from '../../utils/workspace';
import { tryGetFunctionProjectRoot } from '../createNewProject/verifyIsProject';

/**
 * Returns the path of an opened function app project
 */
export async function getProjectFolder(context: IActionContext, message: string, workspacePath?: string): Promise<string> {

    return await selectWorkspaceFolder(context, message, async (f: WorkspaceFolder): Promise<string> => {
        workspacePath = f.uri.fsPath;
        const projectPath: string = await tryGetFunctionProjectRoot(context, workspacePath) || workspacePath;
        return path.relative(workspacePath, projectPath);
    });
}
