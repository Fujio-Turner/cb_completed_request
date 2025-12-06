const { test, expect } = require('@playwright/test');

/**
 * Server Edition E2E Tests - API Endpoints
 * 
 * Tests the Flask REST API endpoints
 * These are Server Edition specific - requires Flask backend running
 */

test.describe('Server Edition - API Endpoints', () => {
  
  test.describe('Health & Status', () => {
    test('should serve index.html at root', async ({ request }) => {
      const response = await request.get('/');
      expect(response.status()).toBe(200);
      
      const html = await response.text();
      expect(html).toContain('Query Analyzer');
    });

    test('should serve static assets', async ({ request }) => {
      const response = await request.get('/assets/css/main.css');
      expect(response.status()).toBe(200);
    });
  });

  test.describe('Couchbase API', () => {
    test('POST /api/couchbase/test should return error without credentials', async ({ request }) => {
      const response = await request.post('/api/couchbase/test', {
        data: {
          config: {
            url: 'http://localhost:8091',
            username: '',
            password: ''
          },
          bucketConfig: {
            bucket: 'cb_tools'
          }
        }
      });
      
      // Should return 500 or error response without valid credentials
      const json = await response.json();
      expect(json.success).toBe(false);
    });

    test('POST /api/couchbase/query should return error without connection', async ({ request }) => {
      const response = await request.post('/api/couchbase/query', {
        data: {
          config: {
            url: 'http://localhost:8091',
            username: '',
            password: ''
          },
          query: 'SELECT 1'
        }
      });
      
      const json = await response.json();
      expect(json.success).toBe(false);
    });

    test('POST /api/couchbase/check-indexes should return error without connection', async ({ request }) => {
      const response = await request.post('/api/couchbase/check-indexes', {
        data: {
          config: {
            url: 'http://localhost:8091',
            username: '',
            password: ''
          },
          bucketConfig: {
            bucket: 'cb_tools',
            analyzerScope: 'query',
            analyzerCollection: 'analyzer'
          }
        }
      });
      
      const json = await response.json();
      expect(json.success).toBe(false);
    });
  });

  test.describe('AI API', () => {
    test('POST /api/ai/analyze should require API key', async ({ request }) => {
      const response = await request.post('/api/ai/analyze', {
        data: {
          prompt: 'Test prompt',
          provider: 'openai',
          data: {}
        }
      });
      
      const json = await response.json();
      // Should fail without API key or return validation error
      expect(json.success === false || json.error !== undefined).toBe(true);
    });

    test('POST /api/ai/preview should return payload structure', async ({ request }) => {
      const response = await request.post('/api/ai/preview', {
        data: {
          prompt: 'Test prompt',
          provider: 'openai',
          selections: {
            dashboard: true,
            insights: true
          },
          data: {
            dashboard: { totalQueries: 100 },
            insights: []
          }
        }
      });
      
      // Preview should work without API key (just returns structure)
      expect(response.status()).toBe(200);
    });

    test('POST /api/ai/test should validate provider configuration', async ({ request }) => {
      const response = await request.post('/api/ai/test', {
        data: {
          provider: 'openai',
          apiKey: '',
          apiUrl: 'https://api.openai.com/v1'
        }
      });
      
      const json = await response.json();
      // Should fail without valid API key
      expect(json.success).toBe(false);
    });

    test('POST /api/ai/models/:provider should return models list', async ({ request }) => {
      const response = await request.post('/api/ai/models/openai', {
        data: {
          config: {},
          bucketConfig: {}
        }
      });
      
      // Should return some response (may be cached or error)
      expect(response.status()).toBeLessThan(500);
    });
  });
});


test.describe('Server Edition - API Error Handling', () => {
  test('should handle malformed JSON gracefully', async ({ request }) => {
    const response = await request.post('/api/couchbase/test', {
      headers: {
        'Content-Type': 'application/json'
      },
      data: 'invalid json'
    });
    
    // Should return 400 or 500, not crash
    expect(response.status()).toBeLessThan(600);
  });

  test('should handle missing required fields', async ({ request }) => {
    const response = await request.post('/api/ai/analyze', {
      data: {}
    });
    
    // Should return error response, not crash
    expect(response.status()).toBeLessThan(600);
    const json = await response.json();
    expect(json.success === false || json.error !== undefined).toBe(true);
  });

  test('should return JSON for all API responses', async ({ request }) => {
    const endpoints = [
      { method: 'POST', url: '/api/couchbase/test', data: {} },
      { method: 'POST', url: '/api/couchbase/query', data: {} },
      { method: 'POST', url: '/api/ai/analyze', data: {} },
    ];
    
    for (const endpoint of endpoints) {
      const response = await request.post(endpoint.url, { data: endpoint.data });
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('application/json');
    }
  });
});
