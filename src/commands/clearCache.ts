import * as vscode from 'vscode';
import { AtpiService } from '../services/atpiService';

export async function clearCacheCommand(
    atpiService: AtpiService,
    workspaceState: vscode.Memento
): Promise<void> {
    // Clear all caches
    atpiService.clearCompletionCaches();
    
    // Clear workspace state cache if any
    await workspaceState.update('atpi.cache', undefined);
    
    vscode.window.showInformationMessage('ATPI: All caches cleared');
}