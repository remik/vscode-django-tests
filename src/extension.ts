'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

let testsPath: string;
let terminal: vscode.Terminal;
const TEST_FUNC_RE = /(\s*)def\s+(test_\w+)\s?\(/i;
const TEST_CLASS_RE = /(\s*)class\s+(\w+)/i;

function runTests(): void {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const currentDocument = editor.document;
        const configuration = vscode.workspace.getConfiguration('', currentDocument.uri);
        const python = configuration.get('python.pythonPath');
        const prefix_command = configuration.get('python.djangoTests.prefix_command');

        if (!terminal) {
            terminal = vscode.window.createTerminal('DjangoTests');
        }
        terminal.show();
        const cmds = [
            prefix_command,
            python,
            "./manage.py",
            "test",
            testsPath
        ];
        terminal.sendText(cmds.join(" "));
    }
}

function onRunCurrentTests(): void {
    const editor = vscode.window.activeTextEditor;

    if (editor && editor.document.languageId === 'python') {
        const currentDocument = editor.document;
        const currentWorkspacePath = vscode.workspace.getWorkspaceFolder(currentDocument.uri);

        if (currentWorkspacePath) {
            const position = editor.selection.active;

            const lines = currentDocument
                .getText(new vscode.Range(0, 0, position.line + 1, 0))
                .split("\n")
                .reverse();

            let functionName:string = "";
            let className:string = "";
            let matched;
            for (let line of lines) {
                if (line.trim()) {
                    matched = line.match(TEST_FUNC_RE);
                    if (matched) {
                        functionName = matched[2];
                        continue;
                    }

                    matched = line.match(TEST_CLASS_RE);
                    if (matched) {
                        className = matched[2];
                        break;
                    }
                }
            }

            const folderSeparator = "/"; // TODO: add windows too
            testsPath = currentDocument.fileName
                .replace(currentWorkspacePath.uri.fsPath, "")
                .replace(".py", "")
                .replace(new RegExp(folderSeparator, "g"), ".")
                .substring(1);

            if (className) {
                testsPath += "." + className;
            }

            if (functionName) {
                testsPath += "." + functionName;
            }

            runTests();
        }
    }
}

function onRunPreviousTests(): void {
    if (!testsPath) {
        vscode.window.showErrorMessage('No previous tests!');
        return;
    }
    runTests();
}

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.runCurrentTests', onRunCurrentTests),
        vscode.commands.registerCommand('extension.runPreviousTests', onRunPreviousTests)
    );
}

export function deactivate() {
}
