import * as vscode from 'vscode';
import { AtpiService } from '../services/atpiService';
import { WebviewPanel } from '../views/webview/webviewPanel';
import { extractAtUrlFromSelection } from '../utils/urlExtractor';

export async function resolveUrlCommand(
    atpiService: AtpiService,
    webviewPanel: WebviewPanel
): Promise<void> {
    try {
        // Get the current editor
        const editor = vscode.window.activeTextEditor;
        let urlToResolve: string | undefined;

        if (editor) {
            // Try to get URL from selection or current line
            urlToResolve = extractAtUrlFromSelection(editor);
        }

        // If no URL found in editor, prompt user
        if (!urlToResolve) {
            urlToResolve = await vscode.window.showInputBox({
                prompt: 'Enter AT Protocol URL to resolve',
                placeHolder: 'at://did:plc:example/app.bsky.feed.post/123',
                validateInput: (value) => {
                    const validation = atpiService.validateUrl(value);
                    return validation.isValid ? null : validation.error;
                }
            });

            if (!urlToResolve) {
                return; // User cancelled
            }
        }

        // Validate the URL
        const validation = atpiService.validateUrl(urlToResolve);
        if (!validation.isValid) {
            vscode.window.showErrorMessage(`Invalid AT URL: ${validation.error}`);
            return;
        }

        // Resolve the URL
        const result = await atpiService.resolve(urlToResolve);

        if (result.error) {
            vscode.window.showErrorMessage(`Failed to resolve: ${result.error}`);
            return;
        }

        // Show result in webview panel
        webviewPanel.show(result);

        // Add to history
        await vscode.commands.executeCommand('atpi.addToHistory', result);

        // Also show a success message
        const actions = ['Copy JSON', 'View Raw'];
        const selected = await vscode.window.showInformationMessage(
            `Successfully resolved ${urlToResolve}`,
            ...actions
        );

        if (selected === 'Copy JSON') {
            await vscode.commands.executeCommand('atpi.copyAsJson', result.data);
        } else if (selected === 'View Raw') {
            // Create a new untitled document with the JSON
            const doc = await vscode.workspace.openTextDocument({
                content: JSON.stringify(result.data, null, 2),
                language: 'json'
            });
            await vscode.window.showTextDocument(doc);
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        vscode.window.showErrorMessage(`ATPI Error: ${errorMessage}`);
    }
}