import * as assert from 'assert';
import * as vscode from 'vscode';
import { extractAllAtUrls } from '../../utils/urlExtractor';

suite('URL Extractor Test Suite', () => {
    test('Should extract single AT URL from text', () => {
        const content = 'Check out this post: at://did:plc:example/app.bsky.feed.post/123';
        const document = createMockDocument(content);
        
        const urls = extractAllAtUrls(document);
        
        assert.strictEqual(urls.length, 1);
        assert.strictEqual(urls[0], 'at://did:plc:example/app.bsky.feed.post/123');
    });

    test('Should extract multiple AT URLs from text', () => {
        const content = `
            Profile: at://alice.bsky.social/app.bsky.actor.profile/self
            Post: at://did:plc:example/app.bsky.feed.post/123
            Follow: at://bob.bsky.social/app.bsky.graph.follow/456
        `;
        const document = createMockDocument(content);
        
        const urls = extractAllAtUrls(document);
        
        assert.strictEqual(urls.length, 3);
        assert.ok(urls.includes('at://alice.bsky.social/app.bsky.actor.profile/self'));
        assert.ok(urls.includes('at://did:plc:example/app.bsky.feed.post/123'));
        assert.ok(urls.includes('at://bob.bsky.social/app.bsky.graph.follow/456'));
    });

    test('Should handle URLs with handles', () => {
        const content = 'at://user.bsky.social/app.bsky.feed.post/abc123';
        const document = createMockDocument(content);
        
        const urls = extractAllAtUrls(document);
        
        assert.strictEqual(urls.length, 1);
        assert.strictEqual(urls[0], 'at://user.bsky.social/app.bsky.feed.post/abc123');
    });

    test('Should handle URLs without collection', () => {
        const content = 'at://did:plc:example';
        const document = createMockDocument(content);
        
        const urls = extractAllAtUrls(document);
        
        assert.strictEqual(urls.length, 1);
        assert.strictEqual(urls[0], 'at://did:plc:example');
    });

    test('Should deduplicate URLs', () => {
        const content = `
            at://did:plc:example/app.bsky.feed.post/123
            at://did:plc:example/app.bsky.feed.post/123
            at://did:plc:example/app.bsky.feed.post/123
        `;
        const document = createMockDocument(content);
        
        const urls = extractAllAtUrls(document);
        
        assert.strictEqual(urls.length, 1);
        assert.strictEqual(urls[0], 'at://did:plc:example/app.bsky.feed.post/123');
    });

    test('Should return empty array when no URLs found', () => {
        const content = 'This text has no AT Protocol URLs';
        const document = createMockDocument(content);
        
        const urls = extractAllAtUrls(document);
        
        assert.strictEqual(urls.length, 0);
    });
});

// Helper function to create a mock document
function createMockDocument(content: string): vscode.TextDocument {
    return {
        getText: () => content,
        lineAt: (line: number) => ({ text: content.split('\n')[line] }),
        lineCount: content.split('\n').length,
        positionAt: (offset: number) => new vscode.Position(0, offset),
        offsetAt: (position: vscode.Position) => position.character
    } as any;
}