import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { AtpiHoverProvider } from './providers/hoverProvider';
import { AtpiCodeLensProvider } from './providers/codeLensProvider';
import { AtpiCompletionItemProvider } from './providers/completionProvider';
import { AtpiHistoryProvider } from './views/sidebar/historyProvider';
import { AtpiService } from './services/atpiService';
import { ConfigService } from './services/configService';
import { CacheService } from './services/cacheService';

let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
    console.log('ATPI extension is now active!');

    // Initialize services
    const configService = new ConfigService();
    const cacheService = new CacheService(context);
    const atpiService = new AtpiService(configService, cacheService);

    // Register commands
    registerCommands(context, atpiService, configService);

    // Register hover provider
    const hoverProvider = new AtpiHoverProvider(atpiService);
    context.subscriptions.push(
        vscode.languages.registerHoverProvider(
            ['javascript', 'typescript', 'json', 'markdown', 'plaintext'],
            hoverProvider
        )
    );

    // Register code lens provider
    const codeLensProvider = new AtpiCodeLensProvider(configService);
    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider(
            ['javascript', 'typescript', 'json', 'markdown', 'plaintext'],
            codeLensProvider
        )
    );

    // Register completion provider
    const completionProvider = new AtpiCompletionItemProvider(atpiService, configService);
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            ['javascript', 'typescript', 'json', 'markdown', 'plaintext'],
            completionProvider,
            '/', '.', ' ' // Trigger on slash, dot, and space for better completion
        )
    );

    // Create and register tree data provider for history
    const historyProvider = new AtpiHistoryProvider(context);
    vscode.window.registerTreeDataProvider('atpiHistory', historyProvider);

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'atpi.changeMode';
    updateStatusBar(configService.getResolutionMode());
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Watch for configuration changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('atpi.resolutionMode')) {
                updateStatusBar(configService.getResolutionMode());
            }
        })
    );
}

function updateStatusBar(mode: string) {
    const modeIcons: Record<string, string> = {
        'local': '$(server)',
        'remote': '$(cloud)',
        'auto': '$(sync)'
    };
    
    statusBarItem.text = `ATPI: ${modeIcons[mode] || ''} ${mode}`;
    statusBarItem.tooltip = `ATPI Resolution Mode: ${mode}\nClick to change`;
}

export function deactivate() {
    console.log('ATPI extension is now deactivated');
}