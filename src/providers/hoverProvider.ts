import * as vscode from 'vscode';
import { AtpiService } from '../services/atpiService';
import { findAtUrlsInRange } from '../utils/urlExtractor';
import { formatJsonForHover } from '../utils/formatter';

export class AtpiHoverProvider implements vscode.HoverProvider {
    constructor(private atpiService: AtpiService) {}

    async provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.Hover | undefined> {
        // Get the word range at the position
        const wordRange = document.getWordRangeAtPosition(position, /at:\/\/[a-zA-Z0-9._:%-]+(?:\/[a-zA-Z0-9._-]+)*(?:\/[a-zA-Z0-9._~:@!$&'()*+,;=-]+)?/);
        
        if (!wordRange) {
            return undefined;
        }

        // Find AT URLs in the line
        const line = document.lineAt(position.line);
        const urls = findAtUrlsInRange(document, line.range);
        
        // Find the URL that contains our position
        const matchingUrl = urls.find(u => u.range.contains(position));
        
        if (!matchingUrl) {
            return undefined;
        }

        // Validate the URL
        const validation = this.atpiService.validateUrl(matchingUrl.url);
        if (!validation.isValid) {
            return new vscode.Hover(
                new vscode.MarkdownString(`❌ **Invalid AT URL**\n\n${validation.error}`),
                matchingUrl.range
            );
        }

        try {

            // Resolve the URL (with shorter timeout for hover)
            const result = await this.atpiService.resolve(matchingUrl.url, {
                timeout: 5000, // 5 second timeout for hover
                showProgress: false
            });

            if (token.isCancellationRequested) {
                return undefined;
            }

            if (result.error) {
                return new vscode.Hover(
                    new vscode.MarkdownString(`❌ **Failed to resolve**\n\n${result.error}`),
                    matchingUrl.range
                );
            }

            // Format the data for hover display
            const formatted = formatJsonForHover(result.data, matchingUrl.url);
            const markdown = new vscode.MarkdownString();
            markdown.supportHtml = true;
            markdown.isTrusted = true;

            // Add header
            markdown.appendMarkdown(`✅ **ATPI** *(${result.mode} mode)*\n\n`);
            markdown.appendMarkdown(`\`${matchingUrl.url}\`\n\n`);
            
            // Add formatted data
            markdown.appendCodeblock(formatted, 'json');
            
            // Add actions
            markdown.appendMarkdown('\n\n---\n\n');
            markdown.appendMarkdown(`[Copy JSON](command:atpi.copyAsJson?${encodeURIComponent(JSON.stringify(result.data))}) • `);
            markdown.appendMarkdown(`[View in Panel](command:atpi.showInPanel?${encodeURIComponent(JSON.stringify(result))}) • `);
            markdown.appendMarkdown(`[Open in atproto.at](command:atpi.openInAtproto?${encodeURIComponent(JSON.stringify(matchingUrl.url))}) • `);
            markdown.appendMarkdown(`[Open in atpi.at](command:atpi.openInAtpi?${encodeURIComponent(JSON.stringify(matchingUrl.url))})`);

            return new vscode.Hover(markdown, matchingUrl.range);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return new vscode.Hover(
                new vscode.MarkdownString(`❌ **Error**\n\n${errorMessage}`),
                matchingUrl.range
            );
        }
    }
}