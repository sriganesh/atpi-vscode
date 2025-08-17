import * as vscode from 'vscode';
import { AtpiConfig, ResolutionMode } from '../types';

export class ConfigService {
    private readonly configSection = 'atpi';

    getConfig(): AtpiConfig {
        const config = vscode.workspace.getConfiguration(this.configSection);
        
        return {
            resolutionMode: config.get<ResolutionMode>('resolutionMode', 'local'),
            timeout: config.get<number>('timeout', 30000),
            remoteBaseUrl: config.get<string>('remoteBaseUrl', 'https://atpi.'),
            enableCache: config.get<boolean>('enableCache', true),
            cacheDuration: config.get<number>('cacheDuration', 3600000), // 1 hour
            showCodeLens: config.get<boolean>('showCodeLens', true),
            enableCompletionCache: config.get<boolean>('enableCompletionCache', false)
        };
    }

    getResolutionMode(): ResolutionMode {
        return this.getConfig().resolutionMode;
    }

    async setResolutionMode(mode: ResolutionMode): Promise<void> {
        const config = vscode.workspace.getConfiguration(this.configSection);
        await config.update('resolutionMode', mode, vscode.ConfigurationTarget.Global);
    }

    getTimeout(): number {
        return this.getConfig().timeout;
    }

    getRemoteBaseUrl(): string {
        return this.getConfig().remoteBaseUrl;
    }

    isCacheEnabled(): boolean {
        return this.getConfig().enableCache;
    }

    getCacheDuration(): number {
        return this.getConfig().cacheDuration;
    }

    isCodeLensEnabled(): boolean {
        return this.getConfig().showCodeLens;
    }

    isRecordPreviewEnabled(): boolean {
        const config = vscode.workspace.getConfiguration(this.configSection);
        return config.get<boolean>('showRecordPreviewOnCompletion', false);
    }

    onDidChangeConfiguration(callback: (e: vscode.ConfigurationChangeEvent) => void): vscode.Disposable {
        return vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration(this.configSection)) {
                callback(e);
            }
        });
    }
}