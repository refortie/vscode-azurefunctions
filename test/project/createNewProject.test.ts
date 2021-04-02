/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TestInput } from 'vscode-azureextensiondev';
import { FuncVersion, ProjectLanguage } from '../../extension.bundle';
import { addParallelSuite, IParallelTest } from '../addParallelSuite';
import { allTemplateSources, createTestActionContext, longRunningTestsEnabled, runForTemplateSource } from '../global.test';
import { createAndValidateProject, ICreateProjectTestOptions } from './createAndValidateProject';
import { getCSharpValidateOptions, getCustomValidateOptions, getDotnetScriptValidateOptions, getFSharpValidateOptions, getJavaScriptValidateOptions, getJavaValidateOptions, getPowerShellValidateOptions, getPythonValidateOptions, getTypeScriptValidateOptions } from './validateProject';

interface ICreateProjectTestCase extends ICreateProjectTestOptions {
    timeout?: number;
    description?: string;
}

const testCases: ICreateProjectTestCase[] = [
    { ...getCSharpValidateOptions('netcoreapp2.1', FuncVersion.v2) },
    { ...getCSharpValidateOptions('netcoreapp3.1', FuncVersion.v3), inputs: [/3/], description: 'netcoreapp3.1' },
    { ...getCSharpValidateOptions('net5.0', FuncVersion.v3), inputs: [/5/], description: 'net5.0 isolated' },
    { ...getFSharpValidateOptions('netcoreapp2.1', FuncVersion.v2), isHiddenLanguage: true },
    { ...getFSharpValidateOptions('netcoreapp3.1', FuncVersion.v3), inputs: [/3/], isHiddenLanguage: true },
];

// Test cases that are the same for both v2 and v3
for (const version of [FuncVersion.v2, FuncVersion.v3]) {
    testCases.push(
        { ...getJavaScriptValidateOptions(true /* hasPackageJson */, version) },
        { ...getTypeScriptValidateOptions(version) },
        { ...getPowerShellValidateOptions(version) },
        { ...getDotnetScriptValidateOptions(ProjectLanguage.CSharpScript, version), isHiddenLanguage: true },
        { ...getDotnetScriptValidateOptions(ProjectLanguage.FSharpScript, version), isHiddenLanguage: true },
    );

    testCases.push({
        ...getPythonValidateOptions('.venv', version),
        inputs: [/3\.6/]
    });

    const appName: string = 'javaApp';
    const javaInputs: (TestInput | string | RegExp)[] = [TestInput.UseDefaultValue, TestInput.UseDefaultValue, TestInput.UseDefaultValue, TestInput.UseDefaultValue, appName];
    if (version !== FuncVersion.v2) { // v2 doesn't support picking a java version
        javaInputs.unshift(/11/);
    }
    testCases.push({
        ...getJavaValidateOptions(appName, version),
        inputs: javaInputs
    });
}

testCases.push({ ...getCustomValidateOptions(FuncVersion.v3) });

const parallelTests: IParallelTest[] = [];
for (const testCase of testCases) {
    for (const source of allTemplateSources) {
        let title = `${testCase.language} ${testCase.version}`;
        if (testCase.description) {
            title += ` ${testCase.description}`;
        }
        title += ` (${source})`;

        if (testCase.timeout === undefined || longRunningTestsEnabled) {
            parallelTests.push({
                title,
                // lots of errors like "The process cannot access the file because it is being used by another process" 😢
                suppressParallel: [ProjectLanguage.FSharp, ProjectLanguage.CSharp, ProjectLanguage.Java].includes(testCase.language),
                callback: async () => {
                    const context = createTestActionContext();
                    await runForTemplateSource(context, source, async () => {
                        await createAndValidateProject(context, testCase);
                    });
                }
            })
        }
    }
}

addParallelSuite(parallelTests, {
    title: 'Create New Project',
    timeoutMS: 2 * 60 * 1000
});
