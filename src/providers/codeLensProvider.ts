import * as vscode from 'vscode';
import { ConfigService } from '../services/configService';
import { findAtUrlsInRange } from '../utils/urlExtractor';

export class AtpiCodeLensProvider implements vscode.CodeLensProvider {
    private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

    constructor(private configService: ConfigService) {
        // Listen for configuration changes
        this.configService.onDidChangeConfiguration(() => {
            this._onDidChangeCodeLenses.fire();
        });
    }

    async provideCodeLenses(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): Promise<vscode.CodeLens[]> {
        // Check if code lens is enabled
        if (!this.configService.isCodeLensEnabled()) {
            return [];
        }

        const codeLenses: vscode.CodeLens[] = [];

        // Find all AT URLs in the document
        const urls = findAtUrlsInRange(document, new vscode.Range(
            new vscode.Position(0, 0),
            new vscode.Position(document.lineCount - 1, 0)
        ));

        for (const urlInfo of urls) {
            if (token.isCancellationRequested) {
                break;
            }

            // Create code lens for resolve command
            const resolveCommand: vscode.Command = {
                title: '$(play) Resolve',
                command: 'atpi.resolveUrl',
                arguments: [urlInfo.url],
                tooltip: 'Resolve this AT Protocol URL'
            };

            const resolveLens = new vscode.CodeLens(urlInfo.range, resolveCommand);
            codeLenses.push(resolveLens);

            // Create code lens for copy command
            const copyCommand: vscode.Command = {
                title: '$(copy) Copy URL',
                command: 'editor.action.clipboardCopyAction',
                arguments: [urlInfo.url],
                tooltip: 'Copy this AT Protocol URL'
            };

            const copyLens = new vscode.CodeLens(urlInfo.range, copyCommand);
            codeLenses.push(copyLens);
        }

        return codeLenses;
    }

    async resolveCodeLens(
        codeLens: vscode.CodeLens,
        _token: vscode.CancellationToken
    ): Promise<vscode.CodeLens> {
        // Code lens is already resolved in provideCodeLenses
        return codeLens;
    }
}