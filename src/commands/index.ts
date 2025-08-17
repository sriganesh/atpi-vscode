import * as vscode from 'vscode';
import { AtpiService } from '../services/atpiService';
import { ConfigService } from '../services/configService';
import { CacheService } from '../services/cacheService';
import { resolveUrlCommand } from './resolveUrl';
import { changeModeCommand } from './changeMode';
import { batchResolveCommand } from './batchResolve';
import { copyAsJsonCommand } from './copyAsJson';
import { showInPanelCommand } from './showInPanel';
import { clearCacheCommand } from './clearCache';
import { openInAtprotoCommand } from './openInAtproto';
import { openInAtpiCommand } from './openInAtpi';
import { WebviewPanel } from '../views/webview/webviewPanel';

export function registerCommands(
    context: vscode.ExtensionContext,
    atpiService: AtpiService,
    configService: ConfigService
): void {
    // Create webview panel instance
    const webviewPanel = new WebviewPanel(context.extensionUri);

    // Register resolve URL command
    context.subscriptions.push(
        vscode.commands.registerCommand('atpi.resolveUrl', () => 
            resolveUrlCommand(atpiService, webviewPanel)
        )
    );

    // Register change mode command
    context.subscriptions.push(
        vscode.commands.registerCommand('atpi.changeMode', () => 
            changeModeCommand(configService)
        )
    );

    // Register batch resolve command
    context.subscriptions.push(
        vscode.commands.registerCommand('atpi.batchResolve', () => 
            batchResolveCommand(atpiService, webviewPanel)
        )
    );

    // Register copy as JSON command
    context.subscriptions.push(
        vscode.commands.registerCommand('atpi.copyAsJson', (data: any) => 
            copyAsJsonCommand(data)
        )
    );

    // Register show in panel command
    context.subscriptions.push(
        vscode.commands.registerCommand('atpi.showInPanel', (data: any) => 
            showInPanelCommand(data, webviewPanel)
        )
    );
    
    // Register preview record command (triggered from completion items)
    context.subscriptions.push(
        vscode.commands.registerCommand('atpi.previewRecord', async (url: string) => {
            if (!url) return;
            
            try {
                const result = await atpiService.resolve(url);
                if (!result.error) {
                    webviewPanel.show(result);
                }
            } catch (error) {
                console.error('Error previewing record:', error);
            }
        })
    );

    // Register clear cache command
    context.subscriptions.push(
        vscode.commands.registerCommand('atpi.clearCache', () => {
            clearCacheCommand(atpiService, context.workspaceState);
            // Also clear the main cache service
            const cacheService = new CacheService(context);
            cacheService.clear();
        }
        )
    );

    // Register open in atproto.at command
    context.subscriptions.push(
        vscode.commands.registerCommand('atpi.openInAtproto', (atUrl: string) => 
            openInAtprotoCommand(atUrl)
        )
    );

    // Register open in atpi.at command
    context.subscriptions.push(
        vscode.commands.registerCommand('atpi.openInAtpi', (atUrl: string) => 
            openInAtpiCommand(atUrl)
        )
    );
}