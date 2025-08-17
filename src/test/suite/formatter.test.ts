import * as assert from 'assert';
import { formatJsonForHover, formatBytes, formatTimestamp, summarizeData } from '../../utils/formatter';

suite('Formatter Test Suite', () => {
    test('formatJsonForHover should truncate long JSON', () => {
        const largeData = {
            items: Array(100).fill({ id: 1, name: 'test', value: 'long string here' })
        };
        
        const result = formatJsonForHover(largeData, 'at://test');
        
        assert.ok(result.length <= 600); // Some buffer for closing brackets
        assert.ok(result.includes('...'));
    });

    test('formatJsonForHover should not truncate short JSON', () => {
        const smallData = { id: 1, name: 'test' };
        
        const result = formatJsonForHover(smallData, 'at://test');
        
        assert.strictEqual(result, JSON.stringify(smallData, null, 2));
        assert.ok(!result.includes('...'));
    });

    test('formatBytes should format bytes correctly', () => {
        assert.strictEqual(formatBytes(0), '0 Bytes');
        assert.strictEqual(formatBytes(1024), '1 KB');
        assert.strictEqual(formatBytes(1048576), '1 MB');
        assert.strictEqual(formatBytes(1536), '1.5 KB');
    });

    test('formatTimestamp should format date correctly', () => {
        const timestamp = new Date('2024-01-01T12:00:00Z').getTime();
        const result = formatTimestamp(timestamp);
        
        assert.ok(result.includes('2024'));
        assert.ok(result.includes('12:00'));
    });

    test('summarizeData should extract AT Protocol fields', () => {
        const data = {
            $type: 'app.bsky.feed.post',
            uri: 'at://did:plc:example/app.bsky.feed.post/123',
            cid: 'bafyreigmh6z5ye6jmx',
            text: 'Hello world',
            createdAt: new Date().toISOString(),
            handle: 'user.bsky.social',
            displayName: 'Test User',
            did: 'did:plc:example'
        };
        
        const { summary, details } = summarizeData(data);
        
        assert.ok(summary.includes('8 keys'));
        assert.strictEqual(details['type'], 'app.bsky.feed.post');
        assert.strictEqual(details['uri'], 'at://did:plc:example/app.bsky.feed.post/123');
        assert.strictEqual(details['text'], 'Hello world');
        assert.strictEqual(details['handle'], 'user.bsky.social');
        assert.strictEqual(details['displayName'], 'Test User');
    });

    test('summarizeData should truncate long text', () => {
        const longText = 'a'.repeat(150);
        const data = { text: longText };
        
        const { details } = summarizeData(data);
        
        assert.strictEqual(details['text']?.length, 103); // 100 + '...'
        assert.ok(details['text']?.endsWith('...'));
    });

    test('summarizeData should count arrays and objects', () => {
        const data = {
            array1: [1, 2, 3],
            array2: ['a', 'b'],
            obj1: { nested: true },
            obj2: { another: 'object' },
            simple: 'value'
        };
        
        const { summary, details } = summarizeData(data);
        
        assert.ok(summary.includes('2 arrays'));
        assert.ok(summary.includes('2 nested objects'));
        assert.strictEqual(details['array1_count'], 3);
        assert.strictEqual(details['array2_count'], 2);
    });

    test('summarizeData should handle non-object data', () => {
        const { summary, details } = summarizeData('simple string');
        
        assert.strictEqual(summary, 'simple string');
        assert.strictEqual(details['value'], 'simple string');
    });
});