# Claude (Anthropic) API Integration Guide

## Overview

Complete integration with Anthropic's Claude models featuring thoughtful, detailed responses with enhanced safety and helpfulness. Claude 3.5 Sonnet is particularly strong at coding and analysis tasks.

## Key Differences from OpenAI

⚠️ **Important Claude-Specific Features:**

1. **max_tokens is REQUIRED** (OpenAI makes it optional)
2. **System prompt is separate parameter** (not in messages array)
3. **Messages must alternate** between user and assistant
4. **Authentication uses `x-api-key` header** (not `Authorization: Bearer`)
5. **Temperature range is 0-1** (not 0-2 like OpenAI)
6. **Response format uses `content` array** (not single `message.content`)

## Features

✅ **All Claude 3 & 3.5 Models**
- Claude 3.5 Sonnet - Latest, best for coding
- Claude 3.5 Haiku - Fast and affordable
- Claude 3 Opus - Most capable
- Claude 3 Sonnet - Balanced
- Claude 3 Haiku - Fastest

✅ **Advanced Features**
- Cost calculation per request
- Token usage tracking
- Context window validation (200K tokens!)
- Response truncation detection
- Message format validation
- Stop reason analysis

✅ **Robust Implementation**
- Automatic retry with exponential backoff
- Timeout handling
- Comprehensive icecream logging
- Provider-specific error handling

## Quick Start

### Basic Chat

```javascript
import { chatWithClaude, extractClaudeResponse } from './assets/js/ai-providers/claude.js';

const result = await chatWithClaude(
    'sk-ant-your-api-key',
    'Explain Couchbase N1QL in simple terms',
    { 
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096  // REQUIRED
    }
);

if (result.success) {
    const text = extractClaudeResponse(result);
    console.log(text);
}
```

### With System Prompt

```javascript
import { chatWithClaudeSystem } from './assets/js/ai-providers/claude.js';

const result = await chatWithClaudeSystem(
    'sk-ant-...',
    'You are a database expert specializing in query optimization.',
    'How do I optimize a slow N1QL query?',
    { 
        model: 'claude-3-5-sonnet-20241022',
        temperature: 0.3,
        max_tokens: 4096
    }
);
```

## API Reference

### callClaude(options)

Main function with full parameter control.

**Parameters:**
```javascript
{
    apiKey: string,           // Required: Anthropic API key (starts with 'sk-ant-')
    model: string,            // Optional: Model name (default: 'claude-3-5-sonnet-20241022')
    messages: Array,          // Required: [{role, content}] - MUST alternate user/assistant
    system: string,           // Optional: System prompt (separate from messages!)
    max_tokens: number,       // REQUIRED: Maximum tokens to generate (1-8192)
    temperature: number,      // Optional: 0-1 (default: 1) - NOTE: Not 0-2!
    top_p: number,            // Optional: Nucleus sampling (default: 1)
    top_k: number,            // Optional: Top-k sampling
    stop_sequences: Array,    // Optional: Custom stop sequences
    stream: boolean,          // Optional: Enable streaming (default: false)
    metadata: Object,         // Optional: Request metadata
    timeout: number,          // Optional: Timeout in seconds (default: 30)
    maxRetries: number        // Optional: Max retry attempts (default: 3)
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
const result = await callClaude({
    apiKey: 'sk-ant-...',
    model: 'claude-3-5-sonnet-20241022',
    system: 'You are a helpful coding assistant.',
    messages: [
        { role: 'user', content: 'Write a Python fibonacci function' }
    ],
    max_tokens: 2000,
    temperature: 0.7
});
```

### chatWithClaude(apiKey, userMessage, options)

Simple single-message chat.

```javascript
const result = await chatWithClaude(
    'sk-ant-...',
    'What is Couchbase?',
    { 
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1000 
    }
);
```

### chatWithClaudeSystem(apiKey, systemPrompt, userMessage, options)

Chat with system prompt (proper Claude format).

```javascript
const result = await chatWithClaudeSystem(
    'sk-ant-...',
    'You are an expert code reviewer.',
    'Review this function: def add(a, b): return a + b',
    { 
        model: 'claude-3-5-sonnet-20241022',
        temperature: 0.2,
        max_tokens: 2000
    }
);
```

### analyzeQueryWithClaude(apiKey, query, queryPlan, options)

Specialized N1QL query analysis.

```javascript
const query = `
SELECT h.*, COUNT(r.*) as review_count
FROM \`travel-sample\` h
UNNEST h.reviews r
WHERE h.type = 'hotel'
GROUP BY h.id
`;

const result = await analyzeQueryWithClaude(
    'sk-ant-...',
    query,
    null,  // Optional execution plan
    { 
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096 
    }
);
```

### continueConversation(apiKey, conversationHistory, options)

Multi-turn conversation (messages MUST alternate).

```javascript
const conversation = [
    { role: 'user', content: 'What is N1QL?' },
    { role: 'assistant', content: 'N1QL is Couchbase query language...' },
    { role: 'user', content: 'Show me an example query' }
];

// Validate before calling
const validation = validateMessages(conversation);
if (!validation.valid) {
    console.error(validation.error);
    return;
}

const result = await continueConversation('sk-ant-...', conversation, {
    max_tokens: 4096
});
```

## Helper Functions

### extractClaudeResponse(result)

Extract text from Claude's content array.

```javascript
const text = extractClaudeResponse(result);
// Handles multiple text blocks if present
```

### getClaudeUsage(result)

Get token usage (Claude uses different field names).

```javascript
const usage = getClaudeUsage(result);
// {
//   prompt_tokens: 50,      // For compatibility
//   completion_tokens: 100, // For compatibility
//   total_tokens: 150,
//   input_tokens: 50,       // Claude's field name
//   output_tokens: 100      // Claude's field name
// }
```

### calculateCost(usage, model)

Calculate request cost.

```javascript
const usage = getClaudeUsage(result);
const cost = calculateCost(usage, 'claude-3-5-sonnet-20241022');
// {
//   input: 0.000150,
//   output: 0.001500,
//   total: 0.001650,
//   formatted: '$0.001650'
// }
```

### validateMessages(messages)

Validate message format before calling Claude.

```javascript
const validation = validateMessages(messages);

if (!validation.valid) {
    console.error(validation.error);
    // Fix: "Messages must alternate. Found consecutive user messages at index 2"
}
```

### getStopReason(result)

Get why generation stopped.

```javascript
const reason = getStopReason(result);
// 'end_turn' | 'max_tokens' | 'stop_sequence'
```

## Models Guide

### Claude 3.5 Sonnet (Recommended) - `claude-3-5-sonnet-20241022`

**Best for:** Coding, analysis, complex reasoning

- Context: 200K tokens
- Output: Up to 8K tokens
- Price: $3.00/M input, $15.00/M output
- **Strongest at:** Code generation, debugging, technical writing

```javascript
await chatWithClaude(apiKey, message, { 
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096 
});
```

### Claude 3.5 Haiku - `claude-3-5-haiku-20241022`

**Best for:** Fast, affordable tasks

- Context: 200K tokens
- Output: Up to 8K tokens
- Price: $0.80/M input, $4.00/M output
- **80% cheaper than Sonnet**

```javascript
await chatWithClaude(apiKey, message, { 
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 2000
});
```

### Claude 3 Opus - `claude-3-opus-20240229`

**Best for:** Highly complex tasks requiring maximum intelligence

- Context: 200K tokens
- Output: Up to 4K tokens
- Price: $15.00/M input, $75.00/M output

```javascript
await chatWithClaude(apiKey, complexTask, { 
    model: 'claude-3-opus-20240229',
    max_tokens: 4096
});
```

## Common Pitfalls

### ❌ Forgetting max_tokens

```javascript
// WRONG - Will fail
await callClaude({
    apiKey: 'sk-ant-...',
    messages: [...]
});

// CORRECT
await callClaude({
    apiKey: 'sk-ant-...',
    messages: [...],
    max_tokens: 4096  // Required!
});
```

### ❌ System in Messages Array

```javascript
// WRONG - Claude doesn't accept this
await callClaude({
    messages: [
        { role: 'system', content: 'You are helpful' },
        { role: 'user', content: 'Hello' }
    ]
});

// CORRECT - System is separate
await callClaude({
    system: 'You are helpful',
    messages: [
        { role: 'user', content: 'Hello' }
    ]
});
```

### ❌ Non-Alternating Messages

```javascript
// WRONG - Two user messages in a row
await callClaude({
    messages: [
        { role: 'user', content: 'Hello' },
        { role: 'user', content: 'Are you there?' }  // ERROR!
    ]
});

// CORRECT - Must alternate
await callClaude({
    messages: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi!' },
        { role: 'user', content: 'Are you there?' }
    ]
});
```

## Advanced Examples

### Query Analysis with Detailed Explanation

```javascript
import { analyzeQueryWithClaude, extractClaudeResponse } from './assets/js/ai-providers/claude.js';

const query = `
SELECT META(h).id, h.name, h.rating
FROM \`travel-sample\` h
WHERE h.type = 'hotel' 
  AND h.city IN ['Paris', 'London', 'New York']
  AND h.rating >= 4
ORDER BY h.rating DESC
LIMIT 20
`;

const result = await analyzeQueryWithClaude(
    'sk-ant-...',
    query,
    null,
    { 
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        temperature: 0.2  // Low temp for analytical tasks
    }
);

const analysis = extractClaudeResponse(result);
console.log(analysis);
// Claude will provide detailed, well-structured analysis
```

### Cost-Optimized Batch Processing

```javascript
const simpleQueries = [...];  // Array of simple queries
const complexQueries = [...]; // Array of complex queries

// Use Haiku for simple queries (cheap)
for (const query of simpleQueries) {
    const result = await analyzeQueryWithClaude('sk-ant-...', query, null, {
        model: 'claude-3-5-haiku-20241022',  // 5x cheaper
        max_tokens: 1000
    });
    
    const usage = getClaudeUsage(result);
    const cost = calculateCost(usage, 'claude-3-5-haiku-20241022');
    console.log(`Simple analysis: ${cost.formatted}`);
}

// Use Sonnet for complex queries (better quality)
for (const query of complexQueries) {
    const result = await analyzeQueryWithClaude('sk-ant-...', query, null, {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096
    });
}
```

### Multi-Turn with Validation

```javascript
import { continueConversation, validateMessages } from './assets/js/ai-providers/claude.js';

let conversation = [];

// Turn 1
conversation.push({ role: 'user', content: 'Explain indexes' });
let result = await continueConversation('sk-ant-...', conversation, { max_tokens: 2000 });
conversation.push({ 
    role: 'assistant', 
    content: extractClaudeResponse(result) 
});

// Turn 2
conversation.push({ role: 'user', content: 'Show an example' });

// Validate before calling
const validation = validateMessages(conversation);
if (!validation.valid) {
    console.error('Invalid message format:', validation.error);
    return;
}

result = await continueConversation('sk-ant-...', conversation, { max_tokens: 2000 });
```

## Error Handling

```javascript
const result = await chatWithClaude('sk-ant-...', 'Hello', { max_tokens: 1000 });

if (result.success) {
    const text = extractClaudeResponse(result);
    const usage = getClaudeUsage(result);
    const cost = calculateCost(usage, 'claude-3-5-sonnet-20241022');
    
    console.log('Response:', text);
    console.log('Tokens:', usage.total_tokens);
    console.log('Cost:', cost.formatted);
    
    // Check if truncated
    if (getStopReason(result) === 'max_tokens') {
        console.warn('Response truncated - increase max_tokens');
    }
} else {
    console.error('Error:', result.error);
    
    // Handle specific errors
    if (result.status_code === 429) {
        console.log('Rate limited');
    } else if (result.status_code === 401) {
        console.log('Invalid API key');
    } else if (result.status_code === 400) {
        console.log('Bad request:', result.error);
        // Often due to missing max_tokens or invalid message format
    }
}
```

## Pricing (as of 2025)

| Model | Input | Output | Best For |
|-------|-------|--------|----------|
| Claude 3.5 Sonnet | $3.00/M | $15.00/M | Coding, analysis |
| Claude 3.5 Haiku | $0.80/M | $4.00/M | Fast & affordable |
| Claude 3 Opus | $15.00/M | $75.00/M | Maximum intelligence |
| Claude 3 Sonnet | $3.00/M | $15.00/M | Balanced (legacy) |
| Claude 3 Haiku | $0.25/M | $1.25/M | Fastest (legacy) |

## API Limits

- **Rate Limits**: Vary by tier
- **Context Window**: 200,000 tokens (much larger than GPT!)
- **Max Output**: 4K-8K depending on model
- **Timeout**: 30 seconds (configurable)

## Parameters Guide

### max_tokens (REQUIRED)

Claude requires this parameter.

```javascript
// WRONG - Will fail
await callClaude({ messages: [...] });

// CORRECT
await callClaude({ messages: [...], max_tokens: 4096 });
```

### system (Separate from messages)

```javascript
// Use system parameter, not in messages array
await callClaude({
    system: 'You are a helpful assistant.',
    messages: [
        { role: 'user', content: 'Hello' }
    ],
    max_tokens: 1000
});
```

### Temperature (0-1, not 0-2)

```javascript
// Deterministic
await callClaude({ temperature: 0, ... });

// Balanced (default)
await callClaude({ temperature: 1, ... });

// NOTE: Max is 1, not 2 like OpenAI
```

## Testing

### Test Page

```bash
# Start server
cd liquid_snake
./start.sh

# Open test page
open http://localhost:5555/test_claude.html
```

### Manual Test

```javascript
import { 
    chatWithClaude, 
    extractClaudeResponse, 
    getClaudeUsage, 
    calculateCost 
} from './assets/js/ai-providers/claude.js';

async function test() {
    const result = await chatWithClaude(
        'sk-ant-your-api-key',
        'Explain how Claude differs from GPT',
        { 
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 2000 
        }
    );
    
    console.log('Success:', result.success);
    console.log('Response:', extractClaudeResponse(result));
    
    const usage = getClaudeUsage(result);
    const cost = calculateCost(usage, 'claude-3-5-sonnet-20241022');
    
    console.log('Tokens:', usage.total_tokens);
    console.log('Cost:', cost.formatted);
}

test();
```

## Best Practices

### 1. Choose the Right Model

```javascript
// For coding and analysis (Claude excels here)
await callClaude({ 
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096
});

// For simple tasks (save 75% cost)
await callClaude({ 
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 1000
});

// For maximum intelligence
await callClaude({ 
    model: 'claude-3-opus-20240229',
    max_tokens: 4096
});
```

### 2. Use System Prompts Properly

```javascript
// CORRECT - System separate from messages
await chatWithClaudeSystem(
    apiKey,
    'You are a database expert.',  // System
    'How do I create indexes?',     // User message
    { max_tokens: 2000 }
);

// NOT like OpenAI where system is in messages array
```

### 3. Validate Message Format

```javascript
import { validateMessages } from './assets/js/ai-providers/claude.js';

const messages = [...];  // Your messages
const validation = validateMessages(messages);

if (!validation.valid) {
    console.error('Invalid format:', validation.error);
    // Fix the messages before calling
}
```

### 4. Monitor Truncation

```javascript
const result = await chatWithClaude(apiKey, longPrompt, { max_tokens: 100 });

if (getStopReason(result) === 'max_tokens') {
    console.warn('Response was truncated!');
    // Retry with more tokens
    const retry = await chatWithClaude(apiKey, longPrompt, { max_tokens: 4096 });
}
```

## Integration Example

```javascript
import { analyzeQueryWithClaude, extractClaudeResponse } from './assets/js/ai-providers/claude.js';
import { getDefaultAIProvider } from './assets/js/ai-client.js';

async function analyzeSlowQuery(query, executionPlan) {
    const provider = await getDefaultAIProvider();
    
    if (provider && provider.id === 'claude') {
        const result = await analyzeQueryWithClaude(
            provider.apiKey,
            query,
            executionPlan,
            { 
                model: provider.model,
                temperature: 0.2,
                max_tokens: 4096
            }
        );
        
        return extractClaudeResponse(result);
    }
}
```

## Why Use Claude?

**Claude 3.5 Sonnet Advantages:**
- 🏆 **Best at coding**: Superior code generation and debugging
- 📊 **Best at analysis**: Thoughtful, structured analysis
- 📝 **Best at writing**: More natural, nuanced text
- 🔒 **Strong safety**: Enhanced content filtering
- 📖 **200K context**: Massive context window
- 💰 **Cost-effective**: Competitive pricing

**When to Use Claude vs GPT:**
- **Code reviews** → Claude 3.5 Sonnet
- **Query analysis** → Claude 3.5 Sonnet
- **Technical docs** → Claude 3.5 Sonnet
- **Simple queries** → GPT-4o Mini (cheaper)
- **JSON extraction** → GPT-4o (native JSON mode)
- **Function calling** → GPT-4o (better tool support)

## Troubleshooting

### Missing max_tokens (400)

```
Error: HTTP 400: max_tokens is required
```

**Solution:** Always include max_tokens

```javascript
await callClaude({ messages: [...], max_tokens: 4096 });
```

### Invalid Message Format (400)

```
Error: messages: roles must alternate between "user" and "assistant"
```

**Solution:** Use `validateMessages()` first

```javascript
const validation = validateMessages(messages);
if (!validation.valid) {
    console.error(validation.error);
}
```

### System in Messages (400)

```
Error: system messages not allowed in messages array
```

**Solution:** Use `system` parameter

```javascript
// WRONG
messages: [{ role: 'system', content: '...' }]

// CORRECT
system: '...',
messages: [{ role: 'user', content: '...' }]
```

## Resources

- **Documentation**: https://docs.anthropic.com/
- **API Console**: https://console.anthropic.com/
- **API Keys**: https://console.anthropic.com/settings/keys
- **Pricing**: https://www.anthropic.com/pricing
- **Discord**: https://discord.gg/anthropic
