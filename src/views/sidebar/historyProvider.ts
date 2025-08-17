import * as vscode from 'vscode';
import { HistoryItem, ResolvedData } from '../../types';
import { formatTimestamp } from '../../utils/formatter';

export class AtpiHistoryProvider implements vscode.TreeDataProvider<HistoryItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<HistoryItem | undefined | null | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private history: ResolvedData[] = [];
    private readonly maxHistoryItems = 50;
    private readonly storageKey = 'atpi.history';

    constructor(private context: vscode.ExtensionContext) {
        this.loadHistory();
        
        // Listen for resolve commands to update history
        vscode.commands.registerCommand('atpi.addToHistory', (data: ResolvedData) => {
            this.addToHistory(data);
        });

        vscode.commands.registerCommand('atpi.clearHistory', () => {
            this.clearHistory();
        });

        vscode.commands.registerCommand('atpi.refreshHistory', () => {
            this.refresh();
        });
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: HistoryItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: HistoryItem): Thenable<HistoryItem[]> {
        if (!element) {
            // Return root level items
            return Promise.resolve(
                this.history.map(item => this.createHistoryItem(item))
            );
        }
        return Promise.resolve([]);
    }

    private createHistoryItem(data: ResolvedData): HistoryItem {
        const label = this.extractLabel(data);
        const item = new vscode.TreeItem(
            label,
            vscode.TreeItemCollapsibleState.None
        ) as HistoryItem;

        item.url = data.url;
        item.timestamp = data.timestamp;
        item.data = data.data;
        item.error = data.error;

        // Set description
        item.description = formatTimestamp(data.timestamp);

        // Set tooltip
        item.tooltip = new vscode.MarkdownString();
        item.tooltip.appendMarkdown(`**URL:** \`${data.url}\`\n\n`);
        item.tooltip.appendMarkdown(`**Mode:** ${data.mode}\n\n`);
        item.tooltip.appendMarkdown(`**Time:** ${formatTimestamp(data.timestamp)}\n\n`);
        
        if (data.error) {
            item.tooltip.appendMarkdown(`**Error:** ${data.error}`);
        } else {
            item.tooltip.appendMarkdown(`**Status:** Success`);
        }

        // Set icon
        item.iconPath = data.error 
            ? new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconFailed'))
            : new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed'));

        // Set context value for context menu
        item.contextValue = data.error ? 'historyItemError' : 'historyItemSuccess';

        // Set command to view the item
        item.command = {
            command: 'atpi.showInPanel',
            title: 'View',
            arguments: [data]
        };

        return item;
    }

    private extractLabel(data: ResolvedData): string {
        // Extract a meaningful label from the URL
        const url = data.url;
        
        // Try to extract the collection and rkey
        const match = url.match(/at:\/\/([^\/]+)(?:\/([^\/]+))?(?:\/([^\/]+))?/);
        if (match) {
            const [, identifier, collection, rkey] = match;
            
            if (rkey) {
                // Shorten long rkeys
                const shortRkey = rkey.length > 20 ? rkey.substring(0, 20) + '...' : rkey;
                return `${collection}/${shortRkey}`;
            } else if (collection) {
                return collection;
            } else {
                // Shorten long identifiers
                const shortId = identifier && identifier.length > 30 ? identifier.substring(0, 30) + '...' : identifier || '';
                return shortId;
            }
        }
        
        return url;
    }

    private addToHistory(data: ResolvedData): void {
        // Add to beginning of array
        this.history.unshift(data);
        
        // Limit history size
        if (this.history.length > this.maxHistoryItems) {
            this.history = this.history.slice(0, this.maxHistoryItems);
        }
        
        // Save and refresh
        this.saveHistory();
        this.refresh();
    }

    private clearHistory(): void {
        this.history = [];
        this.saveHistory();
        this.refresh();
        vscode.window.showInformationMessage('ATPI: History cleared');
    }

    private loadHistory(): void {
        try {
            const stored = this.context.globalState.get<ResolvedData[]>(this.storageKey);
            if (stored && Array.isArray(stored)) {
                this.history = stored;
            }
        } catch (error) {
            console.error('Failed to load history:', error);
            this.history = [];
        }
    }

    private saveHistory(): void {
        try {
            this.context.globalState.update(this.storageKey, this.history);
        } catch (error) {
            console.error('Failed to save history:', error);
        }
    }
}