import * as vscode from 'vscode';

import { TPin } from './types';

import path = require('path');

export class PinProvider implements vscode.TreeDataProvider<Pin> {
	private pins?: TPin[];
	private _onDidChangeTreeData: vscode.EventEmitter<Pin | undefined | null | void> =
		new vscode.EventEmitter<Pin | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<Pin | undefined | null | void> =
		this._onDidChangeTreeData.event;

	constructor(private context: vscode.ExtensionContext) {
		this.pins = context.workspaceState.get('pins');
	}

	getTreeItem(pin: Pin): vscode.TreeItem {
		return pin;
	}

	getChildren(element?: Pin | undefined): vscode.ProviderResult<Pin[]> {
		return this.pins?.map(p => new Pin(p.label, p.fileLocation, p.type, 0));
	}

	refresh(pins: TPin[]) {
		this.pins = pins;
		this._onDidChangeTreeData.fire();
	}
}

export class Pin extends vscode.TreeItem {
	public readonly resourceUri: vscode.Uri;
	constructor(
		public readonly label: string,
		public readonly fileLocation: string,
		public readonly type: 'file' | 'folder',
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
	) {
		super(label, collapsibleState);
		this.resourceUri = vscode.Uri.file(this.fileLocation);
		this.tooltip = `${this.fileLocation}`;
		this.iconPath = this.type === 'folder' ? vscode.ThemeIcon.Folder : undefined;
		this.command =
			this.type === 'file'
				? {
						title: 'Open File',
						command: 'vscode.open',
						arguments: [this.fileLocation],
				  }
				: {
						title: 'Show Folder',
						command: 'pinit.revealAndOpen',
						arguments: [vscode.Uri.parse(this.fileLocation)],
				  };
	}
}
