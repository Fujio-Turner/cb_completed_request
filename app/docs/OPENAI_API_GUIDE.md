# OpenAI API Integration Guide

## Overview

Complete integration with OpenAI's GPT models featuring GPT-4o, GPT-4, GPT-3.5 Turbo, and O1 reasoning models with robust error handling and automatic retry logic.

## Features

✅ **All Major GPT Models**
- GPT-4o - Latest flagship multimodal model
- GPT-4o Mini - Affordable and fast
- GPT-4 Turbo - High intelligence
- GPT-4 - Original
- GPT-3.5 Turbo - Fast and cheap
- O1 Preview - Advanced reasoning
- O1 Mini - Fast reasoning

✅ **Complete API Coverage**
- Chat completions
- System prompts
- Multi-turn conversations
- JSON mode responses
- Function/tool calling
- Specialized query analysis

✅ **Advanced Features**
- Cost calculation per request
- Token usage tracking
- Context window validation
- Response truncation detection
- Finish reason analysis

✅ **Robust Implementation**
- Automatic retry with exponential backoff
- Timeout handling (30s default)
- Comprehensive icecream logging
- Detailed error messages

## Quick Start

### Basic Chat

```javascript
import { chatWithOpenAI, extractOpenAIResponse } from './assets/js/ai-providers/openai.js';

const result = await chatWithOpenAI(
    'sk-your-api-key',
    'Explain Couchbase in simple terms',
    { model: 'gpt-4o' }
);

if (result.success) {
    const text = extractOpenAIResponse(result);
    console.log(text);
}
```

### With System Prompt

```javascript
import { chatWithOpenAISystem } from './assets/js/ai-providers/openai.js';

const result = await chatWithOpenAISystem(
    'sk-your-api-key',
    'You are a database expert specializing in Couchbase.',
    'How do I create a secondary index?',
    { 
        model: 'gpt-4o',
        temperature: 0.3,
        max_tokens: 2000 
    }
);
```

### JSON Response

```javascript
import { getJSONResponse } from './assets/js/ai-providers/openai.js';

const result = await getJSONResponse(
    'sk-your-api-key',
    'Extract name, age, and city from: "John Doe is 30 years old and lives in New York"'
);

// Response will be valid JSON
```

## API Reference

### callOpenAI(options)

Main function with full parameter control.

**Parameters:**
```javascript
{
    apiKey: string,              // Required: OpenAI API key (starts with 'sk-')
    model: string,               // Optional: Model name (default: 'gpt-4o')
    messages: Array,             // Required: [{role, content}]
    temperature: number,         // Optional: 0-2 (default: 1)
    max_tokens: number,          // Optional: Max output tokens
    top_p: number,               // Optional: Nucleus sampling (default: 1)
    frequency_penalty: number,   // Optional: -2 to 2 (default: 0)
    presence_penalty: number,    // Optional: -2 to 2 (default: 0)
    response_format: Object,     // Optional: {type: 'json_object'}
    tools: Array,                // Optional: Function definitions
    tool_choice: string,         // Optional: 'auto', 'none', or specific tool
    user: string,                // Optional: End-user identifier
    stream: boolean,             // Optional: Enable streaming (default: false)
    timeout: number,             // Optional: Timeout in seconds (default: 30)
    maxRetries: number           // Optional: Max retry attempts (default: 3)
}
```

**Returns:**
```javascript
{
    success: boolean,         // Whether the call succeeded
    data: Object,             // Response data (if success)
    error: string,            // Error message (if failed)
    elapsed_ms: number,       // Total time in milliseconds
    attempts: number,         // Number of attempts made
    status_code: number       // HTTP status code
}
```

**Example:**
```javascript
const result = await callOpenAI({
    apiKey: 'sk-...',
    model: 'gpt-4o',
    messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello!' }
    ],
    temperature: 0.7,
    max_tokens: 1000
});
```

### chatWithOpenAI(apiKey, userMessage, options)

Simple single-message chat.

```javascript
const result = await chatWithOpenAI(
    'sk-...',
    'What is Couchbase?',
    { model: 'gpt-4o-mini', temperature: 0.5 }
);
```

### chatWithOpenAISystem(apiKey, systemPrompt, userMessage, options)

Chat with custom system prompt.

```javascript
const result = await chatWithOpenAISystem(
    'sk-...',
    'You are an expert code reviewer.',
    'Review this function: def add(a, b): return a + b',
    { model: 'gpt-4o', temperature: 0.2 }
);
```

### getJSONResponse(apiKey, userMessage, options)

Get structured JSON output.

```javascript
const result = await getJSONResponse(
    'sk-...',
    'List 3 database types with their characteristics'
);

const json = JSON.parse(extractOpenAIResponse(result));
```

### analyzeQueryWithOpenAI(apiKey, query, queryPlan, options)

Specialized N1QL query analysis.

```javascript
const query = `
    SELECT h.name, COUNT(*) as count
    FROM \`travel-sample\` h
    WHERE h.type = 'hotel'
    GROUP BY h.name
`;

const result = await analyzeQueryWithOpenAI(
    'sk-...',
    query,
    null,  // Optional execution plan
    { model: 'gpt-4o', max_tokens: 2000 }
);
```

### continueConversation(apiKey, conversationHistory, options)

Multi-turn conversation.

```javascript
const conversation = [
    { role: 'user', content: 'What is N1QL?' },
    { role: 'assistant', content: 'N1QL is Couchbase query language...' },
    { role: 'user', content: 'Show me an example query' }
];

const result = await continueConversation('sk-...', conversation);
```

## Helper Functions

### extractOpenAIResponse(result)

Extract text from response (handles tool calls too).

```javascript
const text = extractOpenAIResponse(result);
```

### getOpenAIUsage(result)

Get detailed token usage.

```javascript
const usage = getOpenAIUsage(result);
// {
//   prompt_tokens: 50,
//   completion_tokens: 100,
//   total_tokens: 150,
//   reasoning_tokens: 0  // For O1 models
// }
```

### calculateCost(usage, model)

Calculate request cost.

```javascript
const usage = getOpenAIUsage(result);
const cost = calculateCost(usage, 'gpt-4o');
// {
//   input: 0.000125,
//   output: 0.001000,
//   total: 0.001125,
//   formatted: '$0.001125'
// }
```

### checkContextWindow(messages, model)

Validate messages fit in context.

```javascript
const check = checkContextWindow(messages, 'gpt-4o');
// {
//   fits: true,
//   estimatedTokens: 1500,
//   limit: 128000,
//   remaining: 126500
// }
```

### getFinishReason(result)

Get why generation stopped.

```javascript
const reason = getFinishReason(result);
// 'stop' | 'length' | 'tool_calls' | 'content_filter'
```

## Models Guide

### GPT-4o (Recommended) - `gpt-4o`

**Best for:** Most tasks requiring intelligence

- Context: 128K tokens
- Output: Up to 16K tokens
- Price: $2.50/M input, $10.00/M output
- Features: Multimodal (text + vision)

```javascript
await chatWithOpenAI(apiKey, message, { model: 'gpt-4o' });
```

### GPT-4o Mini - `gpt-4o-mini`

**Best for:** Fast, affordable tasks

- Context: 128K tokens
- Output: Up to 16K tokens
- Price: $0.15/M input, $0.60/M output
- **98% cheaper than GPT-4o**

```javascript
await chatWithOpenAI(apiKey, message, { model: 'gpt-4o-mini' });
```

### O1 Preview - `o1-preview`

**Best for:** Complex reasoning, math, science

- Context: 128K tokens
- Output: Up to 32K tokens
- Price: $15.00/M input, $60.00/M output
- Features: Advanced chain-of-thought reasoning

```javascript
await chatWithOpenAI(apiKey, complexProblem, { model: 'o1-preview' });
```

### GPT-3.5 Turbo - `gpt-3.5-turbo`

**Best for:** Simple, fast, cheap tasks

- Context: 16K tokens
- Output: Up to 4K tokens
- Price: $0.50/M input, $1.50/M output

```javascript
await chatWithOpenAI(apiKey, message, { model: 'gpt-3.5-turbo' });
```

## Parameters Guide

### Temperature (0-2)

Controls randomness.

- **0.0-0.3**: Focused, deterministic
- **0.4-0.7**: Balanced
- **0.8-1.5**: Creative
- **1.6-2.0**: Very creative

```javascript
// Code generation
await callOpenAI({ temperature: 0.2, ... });

// Creative writing
await callOpenAI({ temperature: 1.5, ... });
```

### Frequency Penalty (-2 to 2)

Reduces repetition of token sequences.

```javascript
// Reduce repetition
await callOpenAI({ frequency_penalty: 0.5, ... });
```

### Presence Penalty (-2 to 2)

Encourages talking about new topics.

```javascript
// Encourage topic diversity
await callOpenAI({ presence_penalty: 0.6, ... });
```

### Response Format

Get structured JSON output.

```javascript
await callOpenAI({
    messages: [...],
    response_format: { type: 'json_object' }
});
```

## Advanced Examples

### Function Calling

```javascript
import { callWithTools } from './assets/js/ai-providers/openai.js';

const tools = [
    {
        type: 'function',
        function: {
            name: 'get_weather',
            description: 'Get current weather',
            parameters: {
                type: 'object',
                properties: {
                    location: { type: 'string' }
                },
                required: ['location']
            }
        }
    }
];

const result = await callWithTools(
    'sk-...',
    [{ role: 'user', content: 'What is the weather in Paris?' }],
    tools
);
```

### Database Query Analysis

```javascript
import { analyzeQueryWithOpenAI, extractOpenAIResponse } from './assets/js/ai-providers/openai.js';

const query = `
SELECT h.name, AVG(r.rating) as avg_rating
FROM \`travel-sample\` h
UNNEST h.reviews r
WHERE h.type = 'hotel'
GROUP BY h.name
HAVING AVG(r.rating) > 4
`;

const result = await analyzeQueryWithOpenAI('sk-...', query);
const analysis = extractOpenAIResponse(result);
```

### Cost-Optimized Multi-Turn

```javascript
let conversation = [];

// Use cheaper model for simple turns
conversation.push({ role: 'user', content: 'Hello' });
let result = await continueConversation('sk-...', conversation, { model: 'gpt-4o-mini' });
conversation.push({ role: 'assistant', content: extractOpenAIResponse(result) });

// Switch to smarter model for complex turn
conversation.push({ role: 'user', content: 'Explain quantum entanglement' });
result = await continueConversation('sk-...', conversation, { model: 'gpt-4o' });
```

## Error Handling

```javascript
const result = await chatWithOpenAI('sk-...', 'Hello');

if (result.success) {
    const text = extractOpenAIResponse(result);
    const usage = getOpenAIUsage(result);
    const cost = calculateCost(usage, 'gpt-4o');
    
    console.log('Response:', text);
    console.log('Tokens:', usage.total_tokens);
    console.log('Cost:', cost.formatted);
    
    // Check if truncated
    if (getFinishReason(result) === 'length') {
        console.warn('Response was truncated - increase max_tokens');
    }
} else {
    console.error('Error:', result.error);
    
    // Handle specific errors
    if (result.status_code === 429) {
        console.log('Rate limited');
    } else if (result.status_code === 401) {
        console.log('Invalid API key');
    } else if (result.status_code === 400) {
        console.log('Bad request - check parameters');
    }
}
```

## Pricing (as of 2025)

| Model | Input | Output | Best For |
|-------|-------|--------|----------|
| GPT-4o | $2.50/M | $10.00/M | Most tasks |
| GPT-4o Mini | $0.15/M | $0.60/M | Fast & affordable |
| GPT-4 Turbo | $10.00/M | $30.00/M | High intelligence |
| GPT-4 | $30.00/M | $60.00/M | Original (legacy) |
| GPT-3.5 Turbo | $0.50/M | $1.50/M | Simple tasks |
| O1 Preview | $15.00/M | $60.00/M | Complex reasoning |
| O1 Mini | $3.00/M | $12.00/M | Fast reasoning |

## API Limits

- **Rate Limits**: Vary by tier (Free, Tier 1-5)
- **Context Window**: 8K to 128K depending on model
- **Max Output**: 4K to 16K depending on model
- **Timeout**: 30 seconds (configurable)

## Testing

### Test Page

```bash
# Start server
cd liquid_snake
./start.sh

# Open test page
open http://localhost:5555/test_openai.html
```

### Manual Test

```javascript
import { chatWithOpenAI, extractOpenAIResponse, getOpenAIUsage, calculateCost } from './assets/js/ai-providers/openai.js';

async function test() {
    const result = await chatWithOpenAI(
        'sk-your-api-key',
        'Tell me a fun fact about AI'
    );
    
    console.log('Success:', result.success);
    console.log('Response:', extractOpenAIResponse(result));
    
    const usage = getOpenAIUsage(result);
    const cost = calculateCost(usage, 'gpt-4o');
    
    console.log('Tokens:', usage.total_tokens);
    console.log('Cost:', cost.formatted);
}

test();
```

## Best Practices

### 1. Choose the Right Model

```javascript
// For complex tasks
await callOpenAI({ model: 'gpt-4o', ... });

// For simple tasks (save 90%+ cost)
await callOpenAI({ model: 'gpt-4o-mini', ... });

// For reasoning/math
await callOpenAI({ model: 'o1-preview', ... });
```

### 2. Optimize Temperature

```javascript
// Deterministic (code, analysis)
await callOpenAI({ temperature: 0, ... });

// Balanced (default)
await callOpenAI({ temperature: 1, ... });

// Creative (writing)
await callOpenAI({ temperature: 1.5, ... });
```

### 3. Monitor Costs

```javascript
const usage = getOpenAIUsage(result);
const cost = calculateCost(usage, 'gpt-4o');

console.log(`This request cost: ${cost.formatted}`);
console.log(`Input: $${cost.input.toFixed(6)}`);
console.log(`Output: $${cost.output.toFixed(6)}`);
```

### 4. Handle Truncation

```javascript
const result = await chatWithOpenAI(apiKey, message, { max_tokens: 100 });

if (getFinishReason(result) === 'length') {
    console.warn('Response was truncated!');
    // Retry with more tokens
    const retry = await chatWithOpenAI(apiKey, message, { max_tokens: 1000 });
}
```

### 5. Use JSON Mode

```javascript
const result = await callOpenAI({
    apiKey: 'sk-...',
    messages: [
        { 
            role: 'system', 
            content: 'Extract data as JSON with fields: name, age, city' 
        },
        { 
            role: 'user', 
            content: 'John is 30 and lives in NYC' 
        }
    ],
    response_format: { type: 'json_object' }
});

const json = JSON.parse(extractOpenAIResponse(result));
// { name: 'John', age: 30, city: 'NYC' }
```

## Integration Examples

### Query Analyzer Integration

```javascript
import { analyzeQueryWithOpenAI, extractOpenAIResponse } from './assets/js/ai-providers/openai.js';
import { getDefaultAIProvider } from './assets/js/ai-client.js';

async function analyzeSlowQuery(query, executionPlan) {
    const provider = await getDefaultAIProvider();
    
    if (provider && provider.id === 'openai') {
        const result = await analyzeQueryWithOpenAI(
            provider.apiKey,
            query,
            executionPlan,
            { 
                model: provider.model,
                temperature: 0.2,
                max_tokens: 3000
            }
        );
        
        return extractOpenAIResponse(result);
    }
}
```

### Batch Analysis with Cost Tracking

```javascript
const queries = [...];  // Array of queries to analyze
let totalCost = 0;

for (const query of queries) {
    const result = await analyzeQueryWithOpenAI(apiKey, query, null, { 
        model: 'gpt-4o-mini'  // Use cheap model for batch
    });
    
    const usage = getOpenAIUsage(result);
    const cost = calculateCost(usage, 'gpt-4o-mini');
    
    totalCost += cost.total;
    
    console.log(`Query analyzed: ${cost.formatted}`);
}

console.log(`Total cost: $${totalCost.toFixed(4)}`);
```

## Troubleshooting

### Invalid API Key (401)

```
Error: HTTP 401: Unauthorized
```

**Solution:** Check your API key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

### Rate Limited (429)

```
Error: HTTP 429: Rate limit exceeded
```

**Solution:** Automatic retry with backoff (handled by AIHttpClient). Upgrade tier if persistent.

### Context Length Exceeded (400)

```
Error: This model's maximum context length is 128000 tokens
```

**Solution:** Use `checkContextWindow()` before calling

```javascript
const check = checkContextWindow(messages, 'gpt-4o');
if (!check.fits) {
    // Truncate or summarize messages
}
```

### Content Policy Violation (400)

```
Error: HTTP 400: content_policy_violation
```

**Solution:** Check `getFinishReason(result) === 'content_filter'`

## Resources

- **Documentation**: https://platform.openai.com/docs
- **API Keys**: https://platform.openai.com/api-keys
- **Usage Dashboard**: https://platform.openai.com/usage
- **Rate Limits**: https://platform.openai.com/account/limits
- **Pricing**: https://openai.com/pricing
