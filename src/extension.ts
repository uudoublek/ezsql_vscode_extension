import * as vscode from 'vscode';
import { completionProvider } from './completion';
import { helloWorld } from './helloworld';
import { definitionProvider } from './definetion';

export function activate(context: vscode.ExtensionContext) {

	helloWorld(context);
	completionProvider(context);
	definitionProvider(context);
	console.log('Congratulations, your extension "ezsql" is now active!');
	
}

// This method is called when your extension is deactivated
export function deactivate() {}
