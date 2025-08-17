import * as vscode from 'vscode';

export async function openInAtprotoCommand(atUrl: string): Promise<void> {
    try {
        // Remove the at:// prefix from the URL
        const urlWithoutPrefix = atUrl.replace(/^at:\/\//, '');
        
        // Construct the atproto.at URL
        const atprotoUrl = `https://atproto.at://${urlWithoutPrefix}`;
        
        // Open the URL in the default browser
        await vscode.env.openExternal(vscode.Uri.parse(atprotoUrl));
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to open in atproto.at: ${errorMessage}`);
    }
}