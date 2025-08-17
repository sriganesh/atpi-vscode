import * as vscode from 'vscode';

export type ResolutionMode = 'local' | 'remote' | 'auto';

export interface AtpiConfig {
    resolutionMode: ResolutionMode;
    timeout: number;
    remoteBaseUrl: string;
    enableCache: boolean;
    cacheDuration: number;
    showCodeLens: boolean;
    enableCompletionCache?: boolean;
}

export interface ResolvedData {
    url: string;
    data: any;
    timestamp: number;
    mode: ResolutionMode;
    error?: string;
}

export interface CacheEntry {
    data: any;
    timestamp: number;
    mode: ResolutionMode;
}

export interface HistoryItem extends vscode.TreeItem {
    url: string;
    timestamp: number;
    data?: any;
    error?: string;
}

export interface AtUriParts {
    did?: string;
    handle?: string;
    collection?: string;
    rkey?: string;
    isValid: boolean;
    error?: string;
}

export interface CollectionInfo {
    nsid: string;
    description?: string;
    example?: string;
}

export interface AtProtocolCollection {
    [key: string]: CollectionInfo;
}

export interface WebviewMessage {
    command: string;
    data?: any;
    url?: string;
}

export interface ResolveOptions {
    mode?: ResolutionMode;
    timeout?: number;
    showProgress?: boolean;
}