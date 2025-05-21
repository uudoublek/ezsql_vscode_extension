import * as vscode from 'vscode';

export function helloWorld(context:vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('ezsql.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from ezsql!');
	}));
};