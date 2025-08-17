import { WebviewPanel } from '../views/webview/webviewPanel';
import { ResolvedData } from '../types';

export function showInPanelCommand(data: ResolvedData | any, webviewPanel: WebviewPanel): void {
    // If data is already a ResolvedData object, show it directly
    if (data && typeof data === 'object' && 'url' in data && 'data' in data) {
        webviewPanel.show(data as ResolvedData);
    } else {
        // Otherwise, wrap it in a ResolvedData object
        const resolvedData: ResolvedData = {
            url: 'Manual Display',
            data: data,
            timestamp: Date.now(),
            mode: 'local'
        };
        webviewPanel.show(resolvedData);
    }
}