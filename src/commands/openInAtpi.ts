import * as vscode from 'vscode';

export async function openInAtpiCommand(atUrl: string): Promise<void> {
    try {
        // Remove the at:// prefix from the URL
        const urlWithoutPrefix = atUrl.replace(/^at:\/\//, '');
        
        // Construct the atpi.at URL
        const atpiUrl = `https://atpi.at//${urlWithoutPrefix}`;
        
        // Open the URL in the default browser
        await vscode.env.openExternal(vscode.Uri.parse(atpiUrl));
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to open in atpi.at: ${errorMessage}`);
    }
}