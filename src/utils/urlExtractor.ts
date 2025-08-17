import * as vscode from 'vscode';

// Regex pattern for AT Protocol URLs
// Updated to properly match AT Protocol URL structure: at://identifier/collection/rkey
// The pattern now correctly handles record keys that contain colons (like DIDs)
const AT_URL_PATTERN = /at:\/\/[a-zA-Z0-9._:%-]+(?:\/[a-zA-Z0-9._-]+)?(?:\/[a-zA-Z0-9._~:@!$&'()*+,;=-]+)?/g;

export function extractAtUrlFromSelection(editor: vscode.TextEditor): string | undefined {
    const selection = editor.selection;
    
    // First, check if there's selected text
    if (!selection.isEmpty) {
        const selectedText = editor.document.getText(selection);
        const matches = selectedText.match(AT_URL_PATTERN);
        if (matches && matches.length > 0) {
            return matches[0];
        }
    }
    
    // If no selection or no URL in selection, check the current line
    const line = editor.document.lineAt(selection.active.line);
    const lineText = line.text;
    
    // Find all AT URLs in the line
    const matches = lineText.match(AT_URL_PATTERN);
    if (!matches || matches.length === 0) {
        return undefined;
    }
    
    // If there's only one URL, return it
    if (matches.length === 1) {
        return matches[0];
    }
    
    // If multiple URLs, find the one closest to the cursor
    const cursorPosition = selection.active.character;
    let closestUrl: string | undefined;
    let closestDistance = Infinity;
    
    for (const match of matches) {
        const index = lineText.indexOf(match);
        const distance = Math.abs(index + match.length / 2 - cursorPosition);
        if (distance < closestDistance) {
            closestDistance = distance;
            closestUrl = match;
        }
    }
    
    return closestUrl;
}

export function extractAllAtUrls(document: vscode.TextDocument): string[] {
    const text = document.getText();
    const matches = text.match(AT_URL_PATTERN);
    
    if (!matches) {
        return [];
    }
    
    // Remove duplicates
    const uniqueUrls = [...new Set(matches)];
    return uniqueUrls;
}

export function findAtUrlsInRange(
    document: vscode.TextDocument,
    range: vscode.Range
): Array<{ url: string; range: vscode.Range }> {
    const text = document.getText(range);
    const urls: Array<{ url: string; range: vscode.Range }> = [];
    
    let match;
    const regex = new RegExp(AT_URL_PATTERN);
    
    while ((match = regex.exec(text)) !== null) {
        const startPos = document.positionAt(document.offsetAt(range.start) + match.index);
        const endPos = document.positionAt(document.offsetAt(range.start) + match.index + match[0].length);
        
        urls.push({
            url: match[0],
            range: new vscode.Range(startPos, endPos)
        });
    }
    
    return urls;
}