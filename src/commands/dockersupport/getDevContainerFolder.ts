import * as path from 'path';
import { WorkspaceFolder } from "vscode";
import { IActionContext } from "vscode-azureextensionui";
import { selectWorkspaceFolder } from '../../utils/workspace';
import { tryGetFunctionProjectRoot } from '../createNewProject/verifyIsProject';

export async function getDevContainerFolder(context: IActionContext, message: string, workspacePath?: string): Promise<string> {

    return await selectWorkspaceFolder(context, message, async (f: WorkspaceFolder): Promise<string> => {
        workspacePath = f.uri.fsPath;
        const projectPath: string = await tryGetFunctionProjectRoot(context, workspacePath, true /* suppressPrompt */) || workspacePath;
        return path.relative(workspacePath, projectPath);
    });
}
