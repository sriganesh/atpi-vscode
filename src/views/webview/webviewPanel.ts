import * as vscode from 'vscode';
import { ResolvedData, WebviewMessage } from '../../types';
import { formatTimestamp, summarizeData } from '../../utils/formatter';

export class WebviewPanel {
    private panel: vscode.WebviewPanel | undefined;

    constructor(_extensionUri: vscode.Uri) {
    }

    public show(data: ResolvedData): void {
        if (!this.panel) {
            this.createPanel();
        }

        if (this.panel) {
            this.panel.reveal();
            this.updateContent(data);
        }
    }

    public showBatchResults(results: ResolvedData[]): void {
        if (!this.panel) {
            this.createPanel();
        }

        if (this.panel) {
            this.panel.reveal();
            this.updateBatchContent(results);
        }
    }

    private createPanel(): void {
        this.panel = vscode.window.createWebviewPanel(
            'atpiResults',
            'ATPI Results',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });

        this.panel.webview.onDidReceiveMessage(
            (message: WebviewMessage) => {
                this.handleMessage(message);
            }
        );
    }

    private updateContent(data: ResolvedData): void {
        if (!this.panel) return;

        const summary = data.data ? summarizeData(data.data) : { summary: 'No data', details: {} };
        
        this.panel.webview.html = this.getHtmlContent({
            url: data.url,
            mode: data.mode,
            timestamp: formatTimestamp(data.timestamp),
            error: data.error,
            data: data.data,
            summary: summary
        });
    }

    private updateBatchContent(results: ResolvedData[]): void {
        if (!this.panel) return;

        const successCount = results.filter(r => !r.error).length;
        const failureCount = results.filter(r => r.error).length;

        this.panel.webview.html = this.getBatchHtmlContent({
            results,
            successCount,
            failureCount
        });
    }

    private handleMessage(message: WebviewMessage): void {
        switch (message.command) {
            case 'copy':
                vscode.env.clipboard.writeText(JSON.stringify(message.data, null, 2));
                vscode.window.showInformationMessage('JSON copied to clipboard');
                break;
            case 'save':
                this.saveToFile(message.data);
                break;
            case 'resolve':
                vscode.commands.executeCommand('atpi.resolveUrl', message.data);
                break;
            case 'openInAtproto':
                vscode.commands.executeCommand('atpi.openInAtproto', message.url);
                break;
            case 'openInAtpi':
                vscode.commands.executeCommand('atpi.openInAtpi', message.url);
                break;
        }
    }

    private async saveToFile(data: any): Promise<void> {
        const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file('atpi-result.json'),
            filters: {
                'JSON': ['json']
            }
        });

        if (uri) {
            const content = JSON.stringify(data, null, 2);
            await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
            vscode.window.showInformationMessage(`Saved to ${uri.fsPath}`);
        }
    }

    private getHtmlContent(content: {
        url: string;
        mode: string;
        timestamp: string;
        error?: string;
        data: any;
        summary: { summary: string; details: Record<string, any> };
    }): string {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ATPI Results</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                    padding: 20px;
                    margin: 0;
                }
                .header {
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }
                .metadata {
                    display: flex;
                    gap: 20px;
                    flex-wrap: wrap;
                    color: var(--vscode-descriptionForeground);
                    font-size: 0.9em;
                }
                .metadata-item {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .error {
                    background-color: var(--vscode-inputValidation-errorBackground);
                    border: 1px solid var(--vscode-inputValidation-errorBorder);
                    padding: 10px;
                    margin: 10px 0;
                    border-radius: 4px;
                }
                .summary {
                    background-color: var(--vscode-editor-inactiveSelectionBackground);
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 4px;
                }
                .summary h2 {
                    margin: 0 0 10px 0;
                    font-size: 1.2em;
                }
                .summary-details {
                    display: grid;
                    grid-template-columns: auto 1fr;
                    gap: 10px 20px;
                }
                .summary-key {
                    font-weight: bold;
                    color: var(--vscode-symbolIcon-variableForeground);
                }
                .json-container {
                    background-color: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                    padding: 15px;
                    margin: 0 0 20px 0;
                    overflow: auto;
                    max-height: none;
                }
                pre {
                    margin: 0;
                    font-family: var(--vscode-editor-font-family);
                    font-size: var(--vscode-editor-font-size);
                    line-height: 1.5;
                }
                .actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 20px;
                }
                button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 16px;
                    font-size: var(--vscode-font-size);
                    cursor: pointer;
                    border-radius: 2px;
                }
                button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                .url {
                    font-family: var(--vscode-editor-font-family);
                    word-break: break-all;
                    color: var(--vscode-textLink-foreground);
                    font-size: 0.9em;
                }
                .json-key { color: var(--vscode-symbolIcon-propertyForeground); }
                .json-string { color: var(--vscode-symbolIcon-stringForeground); }
                .json-number { color: var(--vscode-symbolIcon-numberForeground); }
                .json-boolean { color: var(--vscode-symbolIcon-booleanForeground); }
                .json-null { color: var(--vscode-symbolIcon-nullForeground); }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="url">${content.url}</div>
            </div>

            ${content.error ? `
                <div class="error">
                    <strong>Error:</strong> ${content.error}
                </div>
            ` : `
                <div class="json-container">
                    <pre>${this.syntaxHighlightJson(content.data)}</pre>
                </div>

                <div class="actions">
                    <button onclick="copyJson()">Copy JSON</button>
                    <button onclick="saveJson()">Save to File</button>
                    <button onclick="openInAtproto()">Open in atproto.at</button>
                    <button onclick="openInAtpi()">Open in atpi.at</button>
                </div>
            `}

            <script>
                const vscode = acquireVsCodeApi();
                const jsonData = ${JSON.stringify(content.data)};
                const atUrl = '${content.url}';

                function copyJson() {
                    vscode.postMessage({
                        command: 'copy',
                        data: jsonData
                    });
                }

                function saveJson() {
                    vscode.postMessage({
                        command: 'save',
                        data: jsonData
                    });
                }

                function openInAtproto() {
                    vscode.postMessage({
                        command: 'openInAtproto',
                        url: atUrl
                    });
                }

                function openInAtpi() {
                    vscode.postMessage({
                        command: 'openInAtpi',
                        url: atUrl
                    });
                }
            </script>
        </body>
        </html>`;
    }

    private getBatchHtmlContent(content: {
        results: ResolvedData[];
        successCount: number;
        failureCount: number;
    }): string {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ATPI Batch Results</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                    padding: 20px;
                    margin: 0;
                }
                .header {
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }
                .stats {
                    display: flex;
                    gap: 20px;
                    margin: 10px 0;
                }
                .stat {
                    padding: 10px 20px;
                    border-radius: 4px;
                    background-color: var(--vscode-editor-inactiveSelectionBackground);
                }
                .stat.success {
                    color: var(--vscode-testing-iconPassed);
                }
                .stat.failure {
                    color: var(--vscode-testing-iconFailed);
                }
                .results {
                    margin-top: 20px;
                }
                .result-item {
                    margin: 10px 0;
                    padding: 15px;
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                    background-color: var(--vscode-editor-inactiveSelectionBackground);
                }
                .result-item.error {
                    border-color: var(--vscode-inputValidation-errorBorder);
                }
                .result-url {
                    font-family: var(--vscode-editor-font-family);
                    margin-bottom: 10px;
                    word-break: break-all;
                }
                .result-preview {
                    font-size: 0.9em;
                    color: var(--vscode-descriptionForeground);
                    max-height: 100px;
                    overflow: hidden;
                }
                .result-actions {
                    margin-top: 10px;
                }
                button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 6px 12px;
                    font-size: 0.9em;
                    cursor: pointer;
                    border-radius: 2px;
                    margin-right: 5px;
                }
                button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>ATPI Batch Resolution Results</h1>
                <div class="stats">
                    <div class="stat success">
                        ✓ ${content.successCount} Successful
                    </div>
                    <div class="stat failure">
                        ✗ ${content.failureCount} Failed
                    </div>
                </div>
            </div>

            <div class="results">
                ${content.results.map((result, index) => `
                    <div class="result-item ${result.error ? 'error' : ''}">
                        <div class="result-url">${result.url}</div>
                        ${result.error ? `
                            <div class="error-message">Error: ${result.error}</div>
                        ` : `
                            <div class="result-preview">
                                <pre>${this.getPreview(result.data)}</pre>
                            </div>
                            <div class="result-actions">
                                <button onclick="viewResult(${index})">View Full</button>
                                <button onclick="copyResult(${index})">Copy JSON</button>
                            </div>
                        `}
                    </div>
                `).join('')}
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                const results = ${JSON.stringify(content.results)};

                function viewResult(index) {
                    vscode.postMessage({
                        command: 'resolve',
                        data: results[index].url
                    });
                }

                function copyResult(index) {
                    vscode.postMessage({
                        command: 'copy',
                        data: results[index].data
                    });
                }
            </script>
        </body>
        </html>`;
    }

    private syntaxHighlightJson(obj: any): string {
        const json = JSON.stringify(obj, null, 2);
        return json
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?/g, (match) => {
                const cls = match.endsWith(':') ? 'key' : 'string';
                return `<span class="json-${cls}">${match}</span>`;
            })
            .replace(/\b(true|false)\b/g, '<span class="json-boolean">$1</span>')
            .replace(/\bnull\b/g, '<span class="json-null">null</span>')
            .replace(/\b(-?\d+(\.\d+)?)\b/g, '<span class="json-number">$1</span>');
    }

    private getPreview(data: any): string {
        const preview = JSON.stringify(data, null, 2);
        if (preview.length > 200) {
            return preview.substring(0, 200) + '...';
        }
        return preview;
    }
}