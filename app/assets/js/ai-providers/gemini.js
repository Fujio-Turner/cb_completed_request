/**
 * Google Gemini API Client
 * API Documentation: https://ai.google.dev/gemini-api/docs
 *
 * Gemini uses a Google-native request/response shape (NOT OpenAI-compatible):
 *   Base URL: https://generativelanguage.googleapis.com/v1beta
 *   Endpoint: /models/{model}:generateContent
 *   Auth:     header  x-goog-api-key: AIza...
 *             (query  ?key=AIza... also works but headers are preferred)
 *
 * Request payload shape:
 *   {
 *     "systemInstruction": { "parts": [{ "text": "..." }] },
 *     "contents": [
 *       { "role": "user", "parts": [{ "text": "..." }] }
 *     ],
 *     "generationConfig": {
 *       "temperature": 0.5,
 *       "maxOutputTokens": 8192,
 *       "responseMimeType": "application/json"
 *     }
 *   }
 *
 * Response shape:
 *   {
 *     "candidates": [
 *       { "content": { "parts": [{ "text": "..." }], "role": "model" } }
 *     ],
 *     "usageMetadata": {
 *       "promptTokenCount": N,
 *       "candidatesTokenCount": N,
 *       "totalTokenCount": N
 *     }
 *   }
 */

import { Logger } from '../base.js';

/**
 * Gemini API configuration
 */
export const GEMINI_CONFIG = {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: {
        'gemini-2.5-pro': {
            name: 'Gemini 2.5 Pro',
            contextWindow: 2000000,
            maxTokens: 65536,
            description: 'Most capable Gemini model, 2M context',
            supportsVision: true,
            inputPricePerMillion: 1.25,
            outputPricePerMillion: 10.00
        },
        'gemini-2.5-flash': {
            name: 'Gemini 2.5 Flash',
            contextWindow: 1000000,
            maxTokens: 65536,
            description: 'Fast and smart, 1M context',
            supportsVision: true,
            inputPricePerMillion: 0.30,
            outputPricePerMillion: 2.50
        },
        'gemini-2.5-flash-lite': {
            name: 'Gemini 2.5 Flash Lite',
            contextWindow: 1000000,
            maxTokens: 65536,
            description: 'Cheapest Gemini 2.5 variant',
            supportsVision: true,
            inputPricePerMillion: 0.10,
            outputPricePerMillion: 0.40
        },
        'gemini-2.0-flash': {
            name: 'Gemini 2.0 Flash',
            contextWindow: 1000000,
            maxTokens: 8192,
            description: 'Next-gen multimodal',
            supportsVision: true,
            inputPricePerMillion: 0.10,
            outputPricePerMillion: 0.40
        },
        'gemini-2.0-flash-lite': {
            name: 'Gemini 2.0 Flash Lite',
            contextWindow: 1000000,
            maxTokens: 8192,
            description: 'Cost-efficient 2.0 variant',
            supportsVision: true,
            inputPricePerMillion: 0.075,
            outputPricePerMillion: 0.30
        },
        'gemini-1.5-pro': {
            name: 'Gemini 1.5 Pro',
            contextWindow: 2000000,
            maxTokens: 8192,
            description: 'Previous flagship, 2M context',
            supportsVision: true,
            inputPricePerMillion: 1.25,
            outputPricePerMillion: 5.00
        },
        'gemini-1.5-flash': {
            name: 'Gemini 1.5 Flash',
            contextWindow: 1000000,
            maxTokens: 8192,
            description: 'Fast, affordable',
            supportsVision: true,
            inputPricePerMillion: 0.075,
            outputPricePerMillion: 0.30
        },
        'gemini-1.5-flash-8b': {
            name: 'Gemini 1.5 Flash 8B',
            contextWindow: 1000000,
            maxTokens: 8192,
            description: 'Smallest, fastest 1.5 variant',
            supportsVision: true,
            inputPricePerMillion: 0.0375,
            outputPricePerMillion: 0.15
        }
    }
};

/**
 * Convert OpenAI-style messages [{role, content}] into Gemini's payload shape
 *
 * @param {Array<{role:string,content:string}>} messages
 * @returns {{systemInstruction?:object, contents:Array}}
 */
function buildGeminiBody(messages) {
    const contents = [];
    let systemInstruction = null;

    for (const m of messages) {
        if (!m || typeof m.content !== 'string') continue;
        if (m.role === 'system') {
            // Concatenate multiple system messages into one instruction
            if (!systemInstruction) {
                systemInstruction = { parts: [{ text: m.content }] };
            } else {
                systemInstruction.parts.push({ text: m.content });
            }
        } else {
            // Gemini expects 'user' or 'model' for assistant turns
            const role = m.role === 'assistant' ? 'model' : 'user';
            contents.push({ role, parts: [{ text: m.content }] });
        }
    }

    const body = { contents };
    if (systemInstruction) body.systemInstruction = systemInstruction;
    return body;
}

/**
 * Call Google Gemini API (through the /api/ai/call proxy)
 *
 * @param {Object} options
 * @param {string} options.apiKey   - Google AI API key (starts with 'AIza')
 * @param {string} options.model    - Model name (default: 'gemini-2.5-flash')
 * @param {Array}  options.messages - OpenAI-style messages [{role, content}]
 * @param {number} options.temperature
 * @param {number} options.max_tokens
 * @param {string} options.responseMimeType - e.g. 'application/json' for JSON-only output
 * @param {number} options.timeout
 * @param {number} options.maxRetries
 * @returns {Promise<Object>} { success, data/error, elapsed_ms, attempts }
 */
export async function callGemini(options) {
    const {
        apiKey,
        model = 'gemini-2.5-flash',
        messages,
        temperature = 0.7,
        max_tokens = 8192,
        responseMimeType,
        timeout = 60,
        maxRetries = 3,
        ...additionalParams
    } = options;

    Logger.info('🤖 Calling Gemini API', { model, messageCount: messages?.length });

    if (!apiKey) {
        Logger.error('Gemini API key is required');
        return { success: false, error: 'API key is required' };
    }
    if (!apiKey.startsWith('AIza')) {
        Logger.warn('Gemini API key usually starts with "AIza"');
    }
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        Logger.error('Messages array is required and must not be empty');
        return { success: false, error: 'Messages array is required' };
    }

    const body = buildGeminiBody(messages);
    body.generationConfig = {
        temperature,
        maxOutputTokens: max_tokens,
        ...(responseMimeType ? { responseMimeType } : {}),
        ...additionalParams
    };

    Logger.debug('Gemini request payload:', body);

    try {
        const response = await fetch('/api/ai/call', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                provider: 'gemini',
                model,
                apiKey,
                apiUrl: GEMINI_CONFIG.baseUrl,
                // /api/ai/call will rewrite the endpoint to
                // /models/{model}:generateContent when provider==='gemini'
                endpoint: `/models/${model}:generateContent`,
                method: 'POST',
                headers: {},
                payload: body,
                timeout,
                maxRetries
            })
        });

        const result = await response.json();

        if (result.success) {
            Logger.info(`✅ Gemini call success (${result.elapsed_ms}ms, ${result.attempts} attempts)`);
        } else {
            Logger.error('❌ Gemini call failed:', result.error);
        }
        return result;
    } catch (error) {
        Logger.error('Network error calling Gemini:', error);
        return { success: false, error: `Network error: ${error.message}` };
    }
}

/**
 * Extract text content from a Gemini response
 *
 * @param {Object} result - Gemini API result returned by callGemini
 * @returns {string|null}
 */
export function extractGeminiResponse(result) {
    if (!result?.success || !result.data) return null;
    try {
        return result.data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (error) {
        Logger.error('Error extracting Gemini response:', error);
        return null;
    }
}

/**
 * Get token usage from a Gemini response (normalized to OpenAI-style keys)
 *
 * @param {Object} result
 * @returns {Object|null} { prompt_tokens, completion_tokens, total_tokens }
 */
export function getGeminiUsage(result) {
    if (!result?.success || !result.data) return null;
    const u = result.data.usageMetadata;
    if (!u) return null;
    return {
        prompt_tokens: u.promptTokenCount || 0,
        completion_tokens: u.candidatesTokenCount || 0,
        total_tokens: u.totalTokenCount || 0
    };
}

/**
 * Calculate cost from usage
 */
export function calculateCost(usage, model) {
    const info = GEMINI_CONFIG.models[model];
    if (!info || !usage) return { input: 0, output: 0, total: 0 };
    const inputCost = (usage.prompt_tokens / 1000000) * info.inputPricePerMillion;
    const outputCost = (usage.completion_tokens / 1000000) * info.outputPricePerMillion;
    return {
        input: inputCost,
        output: outputCost,
        total: inputCost + outputCost,
        formatted: `$${(inputCost + outputCost).toFixed(6)}`
    };
}

/**
 * List available Gemini models
 */
export function listGeminiModels() {
    return Object.entries(GEMINI_CONFIG.models).map(([id, info]) => ({
        id,
        name: info.name,
        description: info.description,
        contextWindow: info.contextWindow,
        maxTokens: info.maxTokens,
        supportsVision: info.supportsVision || false
    }));
}

export function getModelInfo(model) {
    return GEMINI_CONFIG.models[model] || null;
}
