import * as vscode from 'vscode';
import { AtpiService } from '../services/atpiService';
import { WebviewPanel } from '../views/webview/webviewPanel';
import { extractAllAtUrls } from '../utils/urlExtractor';

export async function batchResolveCommand(
    atpiService: AtpiService,
    webviewPanel: WebviewPanel
): Promise<void> {
    try {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        // Extract all AT URLs from the current document
        const urls = extractAllAtUrls(editor.document);

        if (urls.length === 0) {
            vscode.window.showInformationMessage('No AT Protocol URLs found in the current document');
            return;
        }

        // Ask user to confirm
        const selection = await vscode.window.showQuickPick(
            urls.map(url => ({
                label: url,
                picked: true
            })),
            {
                canPickMany: true,
                placeHolder: 'Select URLs to resolve',
                title: `Found ${urls.length} AT Protocol URLs`
            }
        );

        if (!selection || selection.length === 0) {
            return; // User cancelled
        }

        const selectedUrls = selection.map(item => item.label);

        // Batch resolve
        const results = await atpiService.batchResolve(selectedUrls);

        // Count successes and failures
        const successful = results.filter(r => !r.error).length;
        const failed = results.filter(r => r.error).length;

        // Show results in webview
        webviewPanel.showBatchResults(results);

        // Show summary
        let message = `Resolved ${successful} URL${successful !== 1 ? 's' : ''}`;
        if (failed > 0) {
            message += `, ${failed} failed`;
        }

        const actions = failed > 0 ? ['View Results', 'Show Errors'] : ['View Results'];
        const action = await vscode.window.showInformationMessage(message, ...actions);

        if (action === 'Show Errors') {
            const errorMessages = results
                .filter(r => r.error)
                .map(r => `${r.url}: ${r.error}`)
                .join('\n');
            
            const doc = await vscode.workspace.openTextDocument({
                content: errorMessages,
                language: 'plaintext'
            });
            await vscode.window.showTextDocument(doc);
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        vscode.window.showErrorMessage(`Batch resolve failed: ${errorMessage}`);
    }
}