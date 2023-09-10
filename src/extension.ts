import { statSync } from 'fs';
import * as vscode from 'vscode';

import { TPin } from './types';
import { PinProvider } from './PinProvider';

import path = require('path');

export function activate(context: vscode.ExtensionContext) {
	const pinProvider = new PinProvider(context);

	vscode.commands.executeCommand('setContext', 'pinit.showTreeView', true);
	vscode.window.registerTreeDataProvider('pins', pinProvider);

	const pinDisposable = vscode.commands.registerCommand(
		'pinit.pinItem',
		(selectedItem: { path: string; scheme: 'file' | 'folder' | string; _fsPath: string }) => {
			const existingState: TPin[] | undefined = context.workspaceState.get('pins');
			if (existingState && existingState.some(i => i.fileLocation === selectedItem.path)) {
				return vscode.window.showInformationMessage(
					`A pin for this ${selectedItem.scheme} already exists.`,
				);
			}
			const newPins: TPin[] = [
				...(existingState || []),
				{
					label: path.parse(selectedItem.path).base,
					type: statSync(selectedItem._fsPath).isDirectory() ? 'folder' : 'file',
					fileLocation: selectedItem.path,
				},
			];
			context.workspaceState.update('pins', newPins);
			pinProvider.refresh(newPins);
		},
	);

	const deleteDisposable = vscode.commands.registerCommand('pinit.deletePin', e => {
		const existingState: TPin[] | undefined = context.workspaceState.get('pins');
		const newPins = existingState?.filter(p => p.fileLocation !== e.fileLocation);
		if (!newPins) {
			return;
		}
		context.workspaceState.update('pins', newPins);
		pinProvider.refresh(newPins);
	});

	const deleteAllPins = vscode.commands.registerCommand('pinit.deleteAllPins', () => {
		context.workspaceState.update('pins', []);
		pinProvider.refresh([]);
	});

	const revealDisposable = vscode.commands.registerCommand('pinit.revealAndOpen', file => {
		vscode.commands.executeCommand('revealInExplorer', vscode.Uri.parse(file.path));
		vscode.commands.executeCommand('list.expand');
	});

	context.subscriptions.push(pinDisposable);
	context.subscriptions.push(deleteDisposable);
	context.subscriptions.push(revealDisposable);
	context.subscriptions.push(deleteAllPins);
}

export function deactivate() {}
