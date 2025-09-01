import * as vscode from 'vscode';
import { AtpiService } from '../services/atpiService';
import { ConfigService } from '../services/configService';

export class AtpiCompletionItemProvider implements vscode.CompletionItemProvider {
    constructor(
        private atpiService: AtpiService,
        private configService: ConfigService
    ) {}

    async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken,
        _context: vscode.CompletionContext
    ): Promise<vscode.CompletionItem[] | vscode.CompletionList | null | undefined> {
        // Get the current line text
        const line = document.lineAt(position);
        const lineText = line.text.substring(0, position.character);

        // Check if we're in an AT URL context
        // First check for partial collection completion (more specific)
        const partialCollectionMatch = lineText.match(/at:\/\/([a-zA-Z0-9._:%-]+)\/([a-zA-Z0-9._-]+)$/);
        
        // Then check for full URL with trailing slash (for complete collections)
        const fullUrlMatch = lineText.match(/at:\/\/([a-zA-Z0-9._:%-]+)(?:\/([a-zA-Z0-9._-]+(?:\.[a-zA-Z0-9._-]+)+))?(?:\/([a-zA-Z0-9._~:@!$&'()*+,;=-]+))?(\/)?$/);
        
        // Handle partial collection completion first (higher priority)
        if (partialCollectionMatch) {
            const identifier = partialCollectionMatch[1];
            const partialCollection = partialCollectionMatch[2] || '';
            
            if (!identifier) {
                return undefined;
            }
            
            try {
                // Get all available collections
                const collections = await this.atpiService.getCollections(identifier);
                
                // Filter collections that start with the partial input
                const filteredCollections = collections.filter(col => 
                    col.toLowerCase().startsWith(partialCollection.toLowerCase())
                );
                
                if (filteredCollections.length === 0) {
                    return undefined;
                }
                
                const completionItems: vscode.CompletionItem[] = filteredCollections.map((collection, index) => {
                    const item = new vscode.CompletionItem(
                        collection,
                        vscode.CompletionItemKind.Value
                    );
                    
                    // Only replace the partial text
                    const range = new vscode.Range(
                        position.line,
                        position.character - partialCollection.length,
                        position.line,
                        position.character
                    );
                    
                    item.range = range;
                    item.documentation = new vscode.MarkdownString(
                        `AT Protocol collection: ${collection}`
                    );
                    item.detail = 'AT Protocol Collection';
                    item.sortText = `0_${String(index).padStart(4, '0')}_${collection}`;
                    
                    return item;
                });
                
                return completionItems;
            } catch (error) {
                console.error('Error providing partial completions:', error);
                return undefined;
            }
        }

        const identifier = fullUrlMatch![1];
        const collection = fullUrlMatch![2];
        const rkey = fullUrlMatch![3];
        const hasTrailingSlash = fullUrlMatch![4] === '/';

        // Don't provide completions if:
        // 1. No trailing slash
        // 2. Already have both collection and rkey (can't go deeper)
        if (!hasTrailingSlash || (collection && rkey)) {
            return undefined;
        }

        // If we have a collection, provide record key suggestions
        if (collection && identifier) {
            try {
                const records = await this.atpiService.getRecords(identifier, collection, 50);
                
                if (records.length === 0) {
                    return undefined;
                }
                
                const showPreview = this.configService.isRecordPreviewEnabled();
                
                const recordItems: vscode.CompletionItem[] = records.map((recordKey, index) => {
                    const item = new vscode.CompletionItem(
                        recordKey,
                        vscode.CompletionItemKind.Reference
                    );
                    
                    item.detail = `AT Protocol Record (${index + 1} of ${records.length})`;
                    item.insertText = recordKey;
                    item.sortText = `1_${String(index).padStart(4, '0')}_${recordKey}`;
                    
                    // Store the full URL in the item for later use
                    const recordUrl = `at://${identifier}/${collection}/${recordKey}`;
                    
                    // Add command to trigger preview when item is selected
                    if (showPreview) {
                        item.command = {
                            command: 'atpi.previewRecord',
                            title: 'Preview Record',
                            arguments: [recordUrl]
                        };
                        
                        item.documentation = new vscode.MarkdownString(
                            `**Record**: \`${recordKey}\`\n\n` +
                            `_Full URL_: \`${recordUrl}\`\n\n` +
                            `💡 **Tip**: Press **Enter** to see full JSON preview in panel`
                        );
                    } else {
                        item.documentation = new vscode.MarkdownString(
                            `**Record**: \`${recordKey}\`\n\n` +
                            `_Full URL_: \`${recordUrl}\``
                        );
                    }
                    
                    return item;
                });
                
                return recordItems;
            } catch (error) {
                console.error('Error fetching records:', error);
                return undefined;
            }
        }

        try {
            // Get available collections for this identifier
            const collections = await this.atpiService.getCollections(identifier || '');
            
            // If no collections found, return empty
            if (collections.length === 0) {
                return undefined;
            }
            
            const completionItems: vscode.CompletionItem[] = collections.map(collection => {
                const item = new vscode.CompletionItem(
                    collection,
                    vscode.CompletionItemKind.Value
                );

                // Add documentation
                item.documentation = new vscode.MarkdownString(
                    `AT Protocol collection: ${collection}`
                );

                // Set detail
                item.detail = 'AT Protocol Collection';

                // Set insert text
                item.insertText = collection;

                // Set sort text to group AT Protocol completions
                item.sortText = `0_${collection}`;

                return item;
            });

            return completionItems;
        } catch (error) {
            console.error('Error providing completions:', error);
            return undefined;
        }
    }
}