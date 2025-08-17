import * as assert from 'assert';
import { AtpiService } from '../../services/atpiService';
import { ConfigService } from '../../services/configService';
import { CacheService } from '../../services/cacheService';

suite('ATPI Service Test Suite', () => {
    let atpiService: AtpiService;
    let configService: ConfigService;
    let cacheService: CacheService;

    setup(() => {
        // Create mock services
        configService = new ConfigService();
        const mockContext = {
            globalState: {
                get: () => undefined,
                update: () => Promise.resolve()
            }
        } as any;
        cacheService = new CacheService(mockContext);
        atpiService = new AtpiService(configService, cacheService);
    });

    test('validateUrl should accept valid AT URLs', () => {
        const validUrls = [
            'at://did:plc:example',
            'at://did:plc:example/app.bsky.feed.post',
            'at://did:plc:example/app.bsky.feed.post/123',
            'at://user.bsky.social',
            'at://user.bsky.social/app.bsky.actor.profile/self',
            'at://sub.domain.example.com/collection/rkey'
        ];

        for (const url of validUrls) {
            const result = atpiService.validateUrl(url);
            assert.strictEqual(result.isValid, true, `URL should be valid: ${url}`);
            assert.strictEqual(result.error, undefined);
        }
    });

    test('validateUrl should reject invalid AT URLs', () => {
        const invalidUrls = [
            'https://example.com',
            'http://example.com',
            'at:/',
            'at://',
            'atprotocol://example',
            'did:plc:example',
            'user.bsky.social'
        ];

        for (const url of invalidUrls) {
            const result = atpiService.validateUrl(url);
            assert.strictEqual(result.isValid, false, `URL should be invalid: ${url}`);
            assert.ok(result.error);
        }
    });

    test('validateUrl should reject non-AT URLs', () => {
        const result = atpiService.validateUrl('https://example.com');
        assert.strictEqual(result.isValid, false);
        assert.strictEqual(result.error, 'URL must start with at://');
    });

    test('getCollections should return common collections', async () => {
        const collections = await atpiService.getCollections('did:plc:example');
        
        assert.ok(Array.isArray(collections));
        assert.ok(collections.length > 0);
        assert.ok(collections.includes('app.bsky.feed.post'));
        assert.ok(collections.includes('app.bsky.actor.profile'));
        assert.ok(collections.includes('app.bsky.graph.follow'));
    });

    test('getCollections should return same collections for any identifier', async () => {
        const collections1 = await atpiService.getCollections('did:plc:example');
        const collections2 = await atpiService.getCollections('user.bsky.social');
        
        assert.deepStrictEqual(collections1, collections2);
    });
});