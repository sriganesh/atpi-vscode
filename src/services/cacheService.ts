import * as vscode from 'vscode';
import { CacheEntry } from '../types';

export class CacheService {
    private cache: Map<string, CacheEntry> = new Map();
    private readonly storageKey = 'atpi.cache';

    constructor(private context: vscode.ExtensionContext) {
        // Load cache from storage
        this.loadCache();
    }

    get(key: string): CacheEntry | undefined {
        const entry = this.cache.get(key);
        if (!entry) {
            return undefined;
        }

        // Check if cache entry is expired (default: 1 hour)
        const config = vscode.workspace.getConfiguration('atpi');
        const cacheDuration = config.get<number>('cacheDuration', 3600000);
        
        if (Date.now() - entry.timestamp > cacheDuration) {
            this.cache.delete(key);
            this.saveCache();
            return undefined;
        }

        return entry;
    }

    set(key: string, entry: CacheEntry): void {
        this.cache.set(key, entry);
        this.saveCache();
    }

    clear(): void {
        this.cache.clear();
        this.saveCache();
    }

    remove(key: string): boolean {
        const result = this.cache.delete(key);
        if (result) {
            this.saveCache();
        }
        return result;
    }

    getAll(): Map<string, CacheEntry> {
        // Clean expired entries first
        this.cleanExpiredEntries();
        return new Map(this.cache);
    }

    private cleanExpiredEntries(): void {
        const config = vscode.workspace.getConfiguration('atpi');
        const cacheDuration = config.get<number>('cacheDuration', 3600000);
        const now = Date.now();
        let hasChanges = false;

        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > cacheDuration) {
                this.cache.delete(key);
                hasChanges = true;
            }
        }

        if (hasChanges) {
            this.saveCache();
        }
    }

    private loadCache(): void {
        try {
            const storedCache = this.context.globalState.get<[string, CacheEntry][]>(this.storageKey);
            if (storedCache) {
                this.cache = new Map(storedCache);
                this.cleanExpiredEntries();
            }
        } catch (error) {
            console.error('Failed to load cache:', error);
            this.cache = new Map();
        }
    }

    private saveCache(): void {
        try {
            // Convert Map to array for storage
            const cacheArray = Array.from(this.cache.entries());
            this.context.globalState.update(this.storageKey, cacheArray);
        } catch (error) {
            console.error('Failed to save cache:', error);
        }
    }
}