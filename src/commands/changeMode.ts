import * as vscode from 'vscode';
import { ConfigService } from '../services/configService';
import { ResolutionMode } from '../types';

export async function changeModeCommand(configService: ConfigService): Promise<void> {
    const modes: { label: string; description: string; mode: ResolutionMode }[] = [
        {
            label: '$(server) Local',
            description: 'Connect directly to PDS',
            mode: 'local'
        },
        {
            label: '$(cloud) Remote',
            description: 'Use atpi.at service',
            mode: 'remote'
        },
        {
            label: '$(sync) Auto',
            description: 'Try local first, fallback to remote',
            mode: 'auto'
        }
    ];

    const currentMode = configService.getResolutionMode();
    const selected = await vscode.window.showQuickPick(modes, {
        placeHolder: 'Select ATPI resolution mode',
        title: 'ATPI Resolution Mode',
        matchOnDescription: true
    });

    if (selected && selected.mode !== currentMode) {
        await configService.setResolutionMode(selected.mode);
        vscode.window.showInformationMessage(`ATPI resolution mode changed to: ${selected.mode}`);
    }
}