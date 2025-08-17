import * as assert from 'assert';
import * as vscode from 'vscode';
import { extractAllAtUrls } from '../utils/urlExtractor';

suite('URL Extractor Test Suite', () => {
    test('Should extract AT URLs with DIDs as record keys', () => {
        const testCases = [
            {
                text: 'at://did:plc:7gm5ejhut7kia2kzglqfew5b/at.atproto.profile/did:plc:7gm5ejhut7kia2kzglqfew5b',
                expected: 'at://did:plc:7gm5ejhut7kia2kzglqfew5b/at.atproto.profile/did:plc:7gm5ejhut7kia2kzglqfew5b'
            },
            {
                text: 'Check out at://did:plc:7gm5ejhut7kia2kzglqfew5b/app.bsky.feed.post/3lszcx7zf622q here',
                expected: 'at://did:plc:7gm5ejhut7kia2kzglqfew5b/app.bsky.feed.post/3lszcx7zf622q'
            },
            {
                text: 'Profile: at://sri.xyz/app.bsky.actor.profile/self',
                expected: 'at://sri.xyz/app.bsky.actor.profile/self'
            },
            {
                text: 'at://did:web:example.com',
                expected: 'at://did:web:example.com'
            }
        ];

        testCases.forEach(({ text, expected }) => {
            const doc = {
                getText: () => text,
                lineAt: (_line: number) => ({ text }),
                offsetAt: (_pos: vscode.Position) => 0,
                positionAt: (offset: number) => new vscode.Position(0, offset)
            } as any;

            const urls = extractAllAtUrls(doc);
            assert.strictEqual(urls.length, 1, `Should find exactly one URL in: ${text}`);
            assert.strictEqual(urls[0], expected, `Extracted URL should match expected`);
        });
    });

    test('Should extract multiple AT URLs from document', () => {
        const text = `
            Here are some AT Protocol URLs:
            - at://did:plc:abc123/app.bsky.feed.post/xyz789
            - at://example.com/collection/record
            - at://did:plc:7gm5ejhut7kia2kzglqfew5b/at.atproto.profile/did:plc:7gm5ejhut7kia2kzglqfew5b
        `;

        const doc = {
            getText: () => text,
            lineAt: (line: number) => ({ text: text.split('\n')[line] }),
            offsetAt: (_pos: vscode.Position) => 0,
            positionAt: (offset: number) => new vscode.Position(0, offset)
        } as any;

        const urls = extractAllAtUrls(doc);
        assert.strictEqual(urls.length, 3, 'Should find all three URLs');
        assert.ok(urls.includes('at://did:plc:abc123/app.bsky.feed.post/xyz789'));
        assert.ok(urls.includes('at://example.com/collection/record'));
        assert.ok(urls.includes('at://did:plc:7gm5ejhut7kia2kzglqfew5b/at.atproto.profile/did:plc:7gm5ejhut7kia2kzglqfew5b'));
    });
});