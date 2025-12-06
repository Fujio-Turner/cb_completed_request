# Grok (xAI) API Integration Guide

## Overview

Complete integration with xAI's Grok models featuring advanced reasoning capabilities, OpenAI-compatible API, and robust error handling.

## Features

✅ **All Grok Models Supported**
- Grok 2 (Latest) - Most capable model
- Grok 2 Vision - Image understanding
- Grok Beta - Experimental features

✅ **Complete API Coverage**
- Simple chat
- System prompts
- Multi-turn conversations
- Specialized query analysis
- Custom parameters

✅ **Robust Implementation**
- Automatic retry with exponential backoff
- Timeout handling
- Comprehensive error messages
- Token usage tracking
- Context window validation

✅ **Developer-Friendly**
- Icecream logging throughout
- Token estimation
- Model information lookup
- Usage statistics

## Quick Start

### Basic Usage

```javascript
import { chatWithGrok, extractGrokResponse } from './assets/js/ai-providers/grok.js';

// Simple chat
const result = await chatWithGrok(
    'xai-your-api-key',
    'Explain quantum computing in simple terms'
);

if (result.success) {
    const text = extractGrokResponse(result);
    console.log(text);
}
```

### With System Prompt

```javascript
import { chatWithGrokSystem } from './assets/js/ai-providers/grok.js';

const result = await chatWithGrokSystem(
    'xai-your-api-key',
    'You are an expert database administrator specializing in Couchbase.',
    'How do I optimize N1QL queries?',
    { temperature: 0.3, max_tokens: 2000 }
);
```

## API Reference

### callGrok(options)

Main function for calling Grok API with full control.

**Parameters:**
```javascript
{
    apiKey: string,           // Required: xAI API key (starts with 'xai-')
    model: string,            // Optional: Model name (default: 'grok-2-1212')
    messages: Array,          // Required: [{role: 'user', content: '...'}]
    temperature: number,      // Optional: 0-2 (default: 0.7)
    max_tokens: number,       // Optional: Max output tokens (default: 4096)
    top_p: number,            // Optional: Nucleus sampling (default: 1)
    stream: boolean,          // Optional: Enable streaming (default: false)
    timeout: number,          // Optional: Request timeout in seconds (default: 30)
    maxRetries: number        // Optional: Max retry attempts (default: 3)
}
```

**Returns:**
```javascript
{
    success: boolean,         // Whether the call succeeded
    data: Object,             // Response data (if success)
    error: string,            // Error message (if failed)
    elapsed_ms: number,       // Total time taken in milliseconds
    attempts: number,         // Number of attempts made
    status_code: number       // HTTP status code
}
```

**Example:**
```javascript
const result = await callGrok({
    apiKey: 'xai-...',
    model: 'grok-2-1212',
    messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello, Grok!' }
    ],
    temperature: 0.7,
    max_tokens: 1000
});
```

### chatWithGrok(apiKey, userMessage, options)

Simple single-message chat.

**Example:**
```javascript
const result = await chatWithGrok(
    'xai-...',
    'What is Couchbase?',
    { model: 'grok-2-1212', temperature: 0.5 }
);
```

### chatWithGrokSystem(apiKey, systemPrompt, userMessage, options)

Chat with custom system prompt.

**Example:**
```javascript
const result = await chatWithGrokSystem(
    'xai-...',
    'You are a code review expert.',
    'Review this Python function: def add(a, b): return a + b',
    { temperature: 0.3 }
);
```

### continueConversation(apiKey, conversationHistory, options)

Multi-turn conversation with context.

**Example:**
```javascript
const conversation = [
    { role: 'user', content: 'What is N1QL?' },
    { role: 'assistant', content: 'N1QL is Couchbase\'s query language...' },
    { role: 'user', content: 'Can you show me an example?' }
];

const result = await continueConversation('xai-...', conversation);
```

### analyzeQueryWithGrok(apiKey, query, queryPlan, options)

Specialized function for analyzing database queries.

**Example:**
```javascript
const query = `
    SELECT * FROM \`travel-sample\`
    WHERE type = 'hotel' AND city = 'Paris'
    LIMIT 10
`;

const result = await analyzeQueryWithGrok(
    'xai-...',
    query,
    null,  // Optional: pass execution plan
    { max_tokens: 2000 }
);
```

### Helper Functions

#### extractGrokResponse(result)

Extract text content from API response.

```javascript
const result = await chatWithGrok('xai-...', 'Hello');
const text = extractGrokResponse(result);
// Returns: "Hello! How can I help you today?"
```

#### getGrokUsage(result)

Get token usage statistics.

```javascript
const usage = getGrokUsage(result);
// Returns: {
//   prompt_tokens: 10,
//   completion_tokens: 25,
//   total_tokens: 35,
//   queue_time: 0.1,
//   completion_time: 1.2
// }
```

#### checkContextWindow(messages, model)

Validate messages fit within model's context window.

```javascript
const check = checkContextWindow(messages, 'grok-2-1212');
// Returns: {
//   fits: true,
//   estimatedTokens: 1500,
//   limit: 128000,
//   remaining: 126500
// }
```

#### getModelInfo(model)

Get model configuration details.

```javascript
const info = getModelInfo('grok-2-1212');
// Returns: {
//   name: 'Grok 2 (Latest)',
//   contextWindow: 128000,
//   maxTokens: 4096,
//   description: '...',
//   supportsVision: false
// }
```

#### listGrokModels()

List all available Grok models.

```javascript
const models = listGrokModels();
// Returns array of model info objects
```

## Available Models

### Grok 2 (Latest) - `grok-2-1212`

**Best for:** Most tasks requiring advanced reasoning

```javascript
{
    name: 'Grok 2 (Latest)',
    contextWindow: 128000,
    maxTokens: 4096,
    description: 'Most capable Grok model with advanced reasoning'
}
```

### Grok 2 Vision - `grok-2-vision-1212`

**Best for:** Tasks involving image understanding

```javascript
{
    name: 'Grok 2 Vision',
    contextWindow: 128000,
    maxTokens: 4096,
    description: 'Grok with vision capabilities',
    supportsVision: true
}
```

### Grok Beta - `grok-beta`

**Best for:** Testing experimental features

```javascript
{
    name: 'Grok Beta',
    contextWindow: 128000,
    maxTokens: 4096,
    description: 'Experimental Grok model'
}
```

## Parameters Guide

### Temperature (0-2)

Controls randomness in responses.

- **0.0-0.3**: Focused, deterministic (good for code, analysis)
- **0.4-0.7**: Balanced (default: 0.7)
- **0.8-1.5**: Creative, varied
- **1.6-2.0**: Very creative, unpredictable

```javascript
// Precise code generation
await callGrok({ temperature: 0.2, ... });

// Creative writing
await callGrok({ temperature: 1.2, ... });
```

### Max Tokens

Maximum tokens in completion.

```javascript
// Short responses
await callGrok({ max_tokens: 500, ... });

// Long-form content
await callGrok({ max_tokens: 4096, ... });
```

### Top P (0-1)

Nucleus sampling - considers tokens with top_p cumulative probability.

```javascript
// More focused
await callGrok({ top_p: 0.5, ... });

// More diverse (default)
await callGrok({ top_p: 1.0, ... });
```

## Error Handling

```javascript
const result = await chatWithGrok('xai-...', 'Hello');

if (result.success) {
    const text = extractGrokResponse(result);
    const usage = getGrokUsage(result);
    
    console.log('Response:', text);
    console.log('Tokens used:', usage.total_tokens);
    console.log('Time:', result.elapsed_ms, 'ms');
} else {
    console.error('Error:', result.error);
    console.log('Attempts:', result.attempts);
    
    // Handle specific errors
    if (result.status_code === 429) {
        console.log('Rate limited - retry after delay');
    } else if (result.status_code === 401) {
        console.log('Invalid API key');
    }
}
```

## Advanced Examples

### Database Query Analysis

```javascript
import { analyzeQueryWithGrok, extractGrokResponse } from './assets/js/ai-providers/grok.js';

const query = `
SELECT h.name, h.address, COUNT(*) as review_count
FROM \`travel-sample\` h
WHERE h.type = 'hotel'
GROUP BY h.name, h.address
HAVING COUNT(*) > 10
ORDER BY review_count DESC
`;

const result = await analyzeQueryWithGrok(
    'xai-...',
    query,
    null,
    { 
        model: 'grok-2-1212',
        temperature: 0.3,
        max_tokens: 2000
    }
);

const analysis = extractGrokResponse(result);
console.log('Query Analysis:', analysis);
```

### Multi-Turn Conversation

```javascript
let conversation = [];

// Turn 1
conversation.push({ role: 'user', content: 'Explain indexes in Couchbase' });
let result = await continueConversation('xai-...', conversation);
conversation.push({ 
    role: 'assistant', 
    content: extractGrokResponse(result) 
});

// Turn 2
conversation.push({ role: 'user', content: 'How do I create a composite index?' });
result = await continueConversation('xai-...', conversation);
conversation.push({ 
    role: 'assistant', 
    content: extractGrokResponse(result) 
});

// Turn 3
conversation.push({ role: 'user', content: 'Show me an example' });
result = await continueConversation('xai-...', conversation);
```

### Streaming Responses

```javascript
const result = await callGrok({
    apiKey: 'xai-...',
    messages: [{ role: 'user', content: 'Write a story' }],
    stream: true,
    max_tokens: 2000
});

// Note: Streaming requires special handling
// Server will return SSE (Server-Sent Events)
```

## Testing

### Test Page

Open the test page in your browser:

```bash
# Start server
cd liquid_snake
./start.sh

# Open test page
open http://localhost:5555/test_grok.html
```

### Manual Testing

```javascript
import { chatWithGrok, extractGrokResponse, getGrokUsage } from './assets/js/ai-providers/grok.js';

async function test() {
    const result = await chatWithGrok(
        'xai-your-api-key',
        'Hello, Grok! Tell me a fun fact about AI.'
    );
    
    console.log('Success:', result.success);
    console.log('Response:', extractGrokResponse(result));
    console.log('Usage:', getGrokUsage(result));
    console.log('Time:', result.elapsed_ms, 'ms');
}

test();
```

## Best Practices

### 1. Use Appropriate Temperature

```javascript
// For factual/analytical tasks
await analyzeQueryWithGrok(apiKey, query, null, { temperature: 0.2 });

// For creative tasks
await chatWithGrok(apiKey, 'Write a poem', { temperature: 1.0 });
```

### 2. Validate Context Window

```javascript
import { checkContextWindow } from './assets/js/ai-providers/grok.js';

const check = checkContextWindow(messages, 'grok-2-1212');

if (!check.fits) {
    console.warn(`Messages too long: ${check.estimatedTokens} > ${check.limit}`);
    // Truncate or summarize messages
}
```

### 3. Handle Rate Limits

```javascript
let result = await chatWithGrok(apiKey, message);

if (!result.success && result.status_code === 429) {
    // Wait and retry (handled automatically by AIHttpClient)
    console.log('Rate limited, retrying...');
}
```

### 4. Monitor Token Usage

```javascript
const usage = getGrokUsage(result);

console.log(`Cost: ~$${(usage.total_tokens / 1000000 * 5).toFixed(4)}`);
// Estimate based on Grok pricing
```

## Pricing (Estimated)

Check current pricing at [x.ai/api](https://x.ai/api)

- **Grok 2**: ~$5 per million tokens
- **Grok 2 Vision**: ~$5 per million tokens
- **Grok Beta**: Varies

## API Limits

- **Rate Limit**: Varies by account tier
- **Context Window**: 128,000 tokens
- **Max Output**: 4,096 tokens
- **Timeout**: 30 seconds (configurable)

## Troubleshooting

### Invalid API Key

```
Error: HTTP 401: Unauthorized
```

Solution: Check your API key starts with `xai-`

### Rate Limited

```
Error: HTTP 429: Rate limit exceeded
```

Solution: Automatic retry with backoff (handled by AIHttpClient)

### Timeout

```
Error: Request timeout after 30s
```

Solution: Increase timeout or reduce max_tokens

```javascript
await callGrok({ timeout: 60, max_tokens: 2000, ... });
```

## Integration with Query Analyzer

Use Grok to analyze Couchbase queries:

```javascript
import { analyzeQueryWithGrok } from './assets/js/ai-providers/grok.js';
import { getDefaultAIProvider } from './assets/js/ai-client.js';

async function analyzeQuery(query, executionPlan) {
    const provider = await getDefaultAIProvider();
    
    if (provider && provider.id === 'grok') {
        const result = await analyzeQueryWithGrok(
            provider.apiKey,
            query,
            executionPlan,
            { model: provider.model }
        );
        
        return extractGrokResponse(result);
    }
}
```

## Resources

- **Documentation**: https://docs.x.ai/
- **API Console**: https://console.x.ai/
- **Pricing**: https://x.ai/api
- **Discord**: https://discord.gg/xai
