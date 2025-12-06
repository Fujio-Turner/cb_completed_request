# AI Client Implementation Guide

## Overview

Robust HTTP client for making API calls to AI providers with automatic retry logic, timeout handling, and comprehensive icecream logging.

## Architecture

```
JavaScript (Frontend)
    ↓ callDefaultAI()
ai-client.js
    ↓ fetch('/api/ai/call')
Flask Proxy Server (app.py)
    ↓ http_client.call_api()
AIHttpClient
    ↓ requests.post()
AI Provider API (OpenAI, Claude, etc.)
```

## Features

### 🔄 **Automatic Retry Logic**
- **Configurable retries**: Default 3 attempts
- **Exponential backoff**: `delay = 0.5 * (2 ** retry_count)`
- **Retry on specific status codes**: 429 (Rate Limit), 500, 502, 503, 504
- **Timeout handling**: Automatic retry on timeout

### ⏱️ **Timeout Configuration**
- **Default**: 30 seconds
- **Configurable per request**: Pass `timeout` parameter
- **Connection timeout**: Separate handling for connection errors

### 📋 **Custom Headers**
- **Provider-specific auth**: Automatic handling for different providers
  - OpenAI: `Authorization: Bearer sk-...`
  - Claude: `x-api-key: sk-ant-...`
  - Cohere: `Authorization: Bearer co-...`
- **Custom headers**: Pass any additional headers

### 🧊 **Icecream Logging**
Every request logs:
- 🚀 API call start (method, URL)
- 📤 Request headers and payload
- 🔄 Each retry attempt
- ⏳ Backoff delays
- 📥 Response status and timing
- ✅ Success with data
- ❌ Errors with details

## Python Backend (app.py)

### AIHttpClient Class

```python
from liquid_snake.app import AIHttpClient

# Create client instance
client = AIHttpClient(
    max_retries=3,          # Number of retry attempts
    backoff_factor=0.5,     # Exponential backoff multiplier
    timeout=30,             # Request timeout in seconds
    retry_on_status=[429, 500, 502, 503, 504]  # Status codes to retry
)

# Make API call
result = client.call_api(
    method='POST',
    url='https://api.openai.com/v1/chat/completions',
    headers={'Authorization': 'Bearer sk-...'},
    json_data={
        'model': 'gpt-4o',
        'messages': [{'role': 'user', 'content': 'Hello'}]
    }
)

# Response structure
{
    'success': True,           # Boolean success flag
    'status_code': 200,        # HTTP status code
    'data': {...},             # Response data (JSON)
    'elapsed_ms': 1234,        # Total elapsed time in milliseconds
    'attempts': 1              # Number of attempts made
}
```

### Flask Endpoint

#### POST `/api/ai/call`

**Request:**
```json
{
  "provider": "openai",
  "model": "gpt-4o",
  "apiKey": "sk-...",
  "apiUrl": "https://api.openai.com/v1",
  "endpoint": "/chat/completions",
  "method": "POST",
  "headers": {},
  "payload": {
    "messages": [{"role": "user", "content": "Hello"}]
  },
  "timeout": 30,
  "maxRetries": 3
}
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "choices": [
      {
        "message": {
          "content": "Hello! How can I help you?"
        }
      }
    ]
  },
  "elapsed_ms": 1234,
  "attempts": 1
}
```

## JavaScript Frontend (ai-client.js)

### Simple Usage

```javascript
import { callDefaultAI, extractAIResponse } from './assets/js/ai-client.js';

// Use default provider from user preferences
const result = await callDefaultAI('What is Couchbase?');

if (result.success) {
    const text = extractAIResponse(result, 'openai');
    console.log(text);  // "Couchbase is a NoSQL database..."
}
```

### Advanced Usage

```javascript
import { callAI } from './assets/js/ai-client.js';

const result = await callAI({
    provider: 'openai',
    model: 'gpt-4o',
    apiKey: 'sk-...',
    apiUrl: 'https://api.openai.com/v1',
    endpoint: '/chat/completions',
    payload: {
        messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: 'Explain N1QL' }
        ],
        temperature: 0.7,
        max_tokens: 500
    },
    timeout: 60,
    maxRetries: 5
});
```

### Get Default Provider

```javascript
import { getDefaultAIProvider } from './assets/js/ai-client.js';

const provider = await getDefaultAIProvider();

console.log(provider);
// {
//   id: 'openai',
//   name: 'OpenAI',
//   model: 'gpt-4o',
//   apiKey: 'sk-...',
//   apiUrl: 'https://api.openai.com/v1'
// }
```

### Extract Response

```javascript
import { extractAIResponse, getAIUsage } from './assets/js/ai-client.js';

const result = await callDefaultAI('Hello');

// Extract text
const text = extractAIResponse(result, 'openai');
console.log(text);  // "Hello! How can I help you?"

// Get token usage
const usage = getAIUsage(result);
console.log(usage);
// {
//   prompt_tokens: 10,
//   completion_tokens: 8,
//   total_tokens: 18
// }
```

## Provider-Specific Formats

### OpenAI (GPT-4o, GPT-4, GPT-3.5)

```javascript
await callAI({
    provider: 'openai',
    model: 'gpt-4o',
    apiKey: 'sk-...',
    apiUrl: 'https://api.openai.com/v1',
    endpoint: '/chat/completions',
    payload: {
        messages: [{ role: 'user', content: 'Hello' }]
    }
});
```

### Claude (Anthropic)

```javascript
await callAI({
    provider: 'claude',
    model: 'claude-3-5-sonnet-20241022',
    apiKey: 'sk-ant-...',
    apiUrl: 'https://api.anthropic.com',
    endpoint: '/v1/messages',
    payload: {
        max_tokens: 4096,
        messages: [{ role: 'user', content: 'Hello' }]
    }
});
```

### Gemini (Google)

```javascript
await callAI({
    provider: 'gemini',
    model: 'gemini-1.5-pro',
    apiKey: 'AIza...',
    apiUrl: 'https://generativelanguage.googleapis.com',
    endpoint: '/v1/models/gemini-1.5-pro:generateContent',
    payload: {
        contents: [
            {
                parts: [{ text: 'Hello' }]
            }
        ]
    }
});
```

### Groq (Fast Inference)

```javascript
await callAI({
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    apiKey: 'gsk_...',
    apiUrl: 'https://api.groq.com/openai/v1',
    endpoint: '/chat/completions',
    payload: {
        messages: [{ role: 'user', content: 'Hello' }]
    }
});
```

## Error Handling

```javascript
const result = await callDefaultAI('Hello');

if (result.success) {
    console.log('Success:', result.data);
} else {
    console.error('Error:', result.error);
    console.log('Attempts:', result.attempts);
    console.log('Time taken:', result.elapsed_ms);
}
```

## Testing

### Test Page

Open `test_ai_client.html` in your browser:

```bash
# Start Flask server
cd liquid_snake
python3 app.py

# Open in browser
open http://localhost:5555/test_ai_client.html
```

### Manual Testing

```bash
# Test OpenAI endpoint
curl -X POST http://localhost:5555/api/ai/call \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "openai",
    "model": "gpt-4o",
    "apiKey": "sk-...",
    "apiUrl": "https://api.openai.com/v1",
    "endpoint": "/chat/completions",
    "payload": {
      "messages": [{"role": "user", "content": "Hello"}]
    }
  }'
```

## Logging Examples

### Successful Call

```
ic| '🚀 API Call Starting': 'POST', 'https://api.openai.com/v1/chat/completions'
ic| '📤 Headers': {'Authorization': 'Bearer sk-...', 'Content-Type': 'application/json'}
ic| '📤 Payload': {'model': 'gpt-4o', 'messages': [{'role': 'user', 'content': 'Hello'}]}
ic| '🔄 Attempt 1/3'
ic| '📥 Response Status': 200, '1234ms'
ic| '✅ Success': {'choices': [{'message': {'content': 'Hello! How can I help you?'}}]}
```

### Retry with Backoff

```
ic| '🚀 API Call Starting': 'POST', 'https://api.openai.com/v1/chat/completions'
ic| '🔄 Attempt 1/3'
ic| '📥 Response Status': 429, '250ms'
ic| '⚠️ Retryable error 429, will retry...'
ic| '⏳ Waiting 0.5s before retry'
ic| '🔄 Attempt 2/3'
ic| '📥 Response Status': 200, '1100ms'
ic| '✅ Success'
```

### Timeout and Retry

```
ic| '🚀 API Call Starting': 'POST', 'https://api.openai.com/v1/chat/completions'
ic| '🔄 Attempt 1/3'
ic| '⏰ Timeout on attempt 1'
ic| '⏳ Waiting 0.5s before retry'
ic| '🔄 Attempt 2/3'
ic| '📥 Response Status': 200, '2100ms'
ic| '✅ Success'
```

## Configuration Best Practices

### For Production
```python
client = AIHttpClient(
    max_retries=5,           # More retries for reliability
    backoff_factor=1.0,      # Longer backoff delays
    timeout=60,              # Longer timeout for complex requests
    retry_on_status=[429, 500, 502, 503, 504]
)
```

### For Development/Testing
```python
client = AIHttpClient(
    max_retries=1,           # Faster failure
    backoff_factor=0.1,      # Shorter delays
    timeout=10,              # Quicker timeout
    retry_on_status=[500, 502, 503]  # Only retry server errors
)
```

### For Rate-Limited APIs
```python
client = AIHttpClient(
    max_retries=10,          # Many retries for rate limits
    backoff_factor=2.0,      # Long exponential backoff
    timeout=30,
    retry_on_status=[429]    # Only retry rate limits
)
```

## Security Notes

⚠️ **API Keys**: Never log API keys in full. The client automatically truncates them in logs.

⚠️ **Proxy Benefits**: Using the Flask proxy keeps API keys server-side and never exposes them to browser JavaScript.

⚠️ **CORS**: The Flask app has CORS enabled for development. In production, restrict CORS to specific domains.

## Dependencies

Add to `requirements.txt`:
```
requests>=2.31.0
urllib3>=2.0.0
```

Install with:
```bash
pip install -r requirements.txt
```
