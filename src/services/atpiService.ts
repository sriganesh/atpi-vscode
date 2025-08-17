import * as vscode from 'vscode';
import atpi from 'atpi';
import { ResolvedData, ResolveOptions } from '../types';
import { ConfigService } from './configService';
import { CacheService } from './cacheService';

export class AtpiService {
    private collectionsCache: Map<string, { collections: string[], timestamp: number }> = new Map();
    private recordsCache: Map<string, { records: string[], timestamp: number }> = new Map();
    private readonly COLLECTIONS_CACHE_TTL = 300000; // 5 minutes
    private readonly RECORDS_CACHE_TTL = 60000; // 1 minute - much shorter for records

    constructor(
        private configService: ConfigService,
        private cacheService: CacheService
    ) {}

    async resolve(url: string, options?: ResolveOptions): Promise<ResolvedData> {
        const mode = options?.mode || this.configService.getResolutionMode();
        const timeout = options?.timeout || this.configService.getTimeout();
        const showProgress = options?.showProgress ?? true;

        // Check cache first if enabled
        if (this.configService.isCacheEnabled()) {
            const cached = this.cacheService.get(url);
            if (cached) {
                return {
                    url,
                    data: cached.data,
                    timestamp: cached.timestamp,
                    mode: cached.mode
                };
            }
        }

        try {
            let data: any;

            if (showProgress) {
                data = await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: `Resolving ${url}`,
                    cancellable: true
                }, async (progress, token) => {
                    progress.report({ increment: 0, message: `Using ${mode} mode...` });

                    const resolvePromise = atpi.resolve(url, {
                        mode,
                        timeout,
                        fallbackToRemote: mode === 'auto',
                        baseUrl: this.configService.getRemoteBaseUrl()
                    });

                    // Handle cancellation
                    token.onCancellationRequested(() => {
                        // Note: atpi doesn't support cancellation, so we just inform the user
                        vscode.window.showWarningMessage('Resolution request cannot be cancelled');
                    });

                    progress.report({ increment: 50 });
                    const result = await resolvePromise;
                    progress.report({ increment: 100 });

                    return result;
                });
            } else {
                data = await atpi.resolve(url, {
                    mode,
                    timeout,
                    fallbackToRemote: mode === 'auto',
                    baseUrl: this.configService.getRemoteBaseUrl()
                });
            }

            const result: ResolvedData = {
                url,
                data,
                timestamp: Date.now(),
                mode
            };

            // Cache the result if enabled
            if (this.configService.isCacheEnabled()) {
                this.cacheService.set(url, {
                    data,
                    timestamp: Date.now(),
                    mode
                });
            }

            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                url,
                data: null,
                timestamp: Date.now(),
                mode,
                error: errorMessage
            };
        }
    }

    async batchResolve(urls: string[], options?: ResolveOptions): Promise<ResolvedData[]> {
        const results = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Batch resolving AT URLs',
            cancellable: false
        }, async (progress) => {
            const total = urls.length;
            const resolvedData: ResolvedData[] = [];

            for (let i = 0; i < urls.length; i++) {
                progress.report({
                    increment: (100 / total),
                    message: `Resolving ${i + 1} of ${total}...`
                });

                const result = await this.resolve(urls[i] || '', {
                    ...options,
                    showProgress: false
                });
                resolvedData.push(result);
            }

            return resolvedData;
        });

        return results;
    }

    validateUrl(url: string): { isValid: boolean; error?: string } {
        if (!url.startsWith('at://')) {
            return { isValid: false, error: 'URL must start with at://' };
        }

        try {
            // Basic validation - the atpi package will do more thorough validation
            const parts = url.substring(5).split('/');
            if (parts.length < 1) {
                return { isValid: false, error: 'Invalid AT URL format' };
            }

            return { isValid: true };
        } catch (error) {
            return { isValid: false, error: 'Invalid AT URL format' };
        }
    }

    async getCollections(didOrHandle: string): Promise<string[]> {
        // Check if caching is enabled
        const config = this.configService.getConfig();
        const enableCache = config.enableCompletionCache ?? false;
        
        if (enableCache) {
            // Check cache first
            const cached = this.collectionsCache.get(didOrHandle);
            if (cached && Date.now() - cached.timestamp < this.COLLECTIONS_CACHE_TTL) {
                return cached.collections;
            }
        }

        try {
            // Use a special URL format to get repo info
            const repoInfoUrl = `at://${didOrHandle}`;
            const result = await this.resolve(repoInfoUrl, {
                showProgress: false,
                timeout: 5000
            });

            // Check if we got repo info with collections
            if (result.data && result.data.repoInfo && result.data.repoInfo.collections) {
                const collections = result.data.repoInfo.collections as string[];
                
                // Cache the result if caching is enabled
                if (enableCache) {
                    this.collectionsCache.set(didOrHandle, {
                        collections,
                        timestamp: Date.now()
                    });
                }
                
                return collections;
            }

            // No collections found
            return [];
        } catch (error) {
            console.error('Failed to fetch collections:', error);
            // Return empty array instead of fallback
            return [];
        }
    }

    async getRecords(didOrHandle: string, collection: string, limit: number = 50): Promise<string[]> {
        const cacheKey = `${didOrHandle}:${collection}`;
        
        // Check if caching is enabled
        const config = this.configService.getConfig();
        const enableCache = config.enableCompletionCache ?? false;
        
        if (enableCache) {
            // Check cache first
            const cached = this.recordsCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < this.RECORDS_CACHE_TTL) {
                return cached.records.slice(0, limit);
            }
        }

        try {
            // Fetch records from the collection
            const collectionUrl = `at://${didOrHandle}/${collection}`;
            const result = await this.resolve(collectionUrl, {
                showProgress: false,
                timeout: 5000
            });

            // Check if we got records
            if (result.data && result.data.records && Array.isArray(result.data.records)) {
                // Extract record keys from the URIs
                const records = result.data.records.map((record: any) => {
                    if (record.uri) {
                        const parts = record.uri.split('/');
                        return parts[parts.length - 1]; // Get the record key
                    }
                    return null;
                }).filter(Boolean) as string[];

                // Cache the result if caching is enabled
                if (enableCache) {
                    this.recordsCache.set(cacheKey, {
                        records,
                        timestamp: Date.now()
                    });
                }

                return records.slice(0, limit);
            }

            return [];
        } catch (error) {
            console.error('Failed to fetch records:', error);
            return [];
        }
    }

    clearCompletionCaches(): void {
        this.collectionsCache.clear();
        this.recordsCache.clear();
    }
}