import * as vscode from 'vscode';

export async function copyAsJsonCommand(data: any): Promise<void> {
    try {
        if (!data) {
            vscode.window.showErrorMessage('No data to copy');
            return;
        }

        // Format JSON with 2 space indentation
        const jsonString = JSON.stringify(data, null, 2);
        
        // Copy to clipboard
        await vscode.env.clipboard.writeText(jsonString);
        
        // Show confirmation
        vscode.window.showInformationMessage('JSON data copied to clipboard');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to copy';
        vscode.window.showErrorMessage(`Copy failed: ${errorMessage}`);
    }
}