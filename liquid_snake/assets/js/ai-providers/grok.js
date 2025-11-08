/**
 * Grok (xAI) API Client
 * API Documentation: https://docs.x.ai/
 * 
 * Grok uses OpenAI-compatible API format
 * Base URL: https://api.x.ai/v1
 * Authentication: Authorization: Bearer xai-...
 */

import { Logger } from '../base.js';

/**
 * Grok API configuration
 */
export const GROK_CONFIG = {
    baseUrl: 'https://api.x.ai/v1',
    models: {
        'grok-4-fast': {
            name: 'Grok 4 Fast',
            contextWindow: 128000,
            maxTokens: 32768,
            description: 'Latest cost-effective Grok model with frontier performance',
            inputPricePerMillion: 0.50,
            outputPricePerMillion: 1.50
        },
        'grok-4': {
            name: 'Grok 4',
            contextWindow: 128000,
            maxTokens: 32768,
            description: 'Most capable Grok model with advanced reasoning and coding',
            inputPricePerMillion: 5.00,
            outputPricePerMillion: 15.00
        },
        'grok-3': {
            name: 'Grok 3',
            contextWindow: 128000,
            maxTokens: 16384,
            description: 'Advanced reasoning with extensive pretraining knowledge',
            inputPricePerMillion: 3.00,
            outputPricePerMillion: 10.00
        },
        'grok-3-mini': {
            name: 'Grok 3 Mini',
            contextWindow: 128000,
            maxTokens: 8192,
            description: 'Fast and efficient Grok 3 variant',
            inputPricePerMillion: 1.00,
            outputPricePerMillion: 3.00
        },
        'grok-2-latest': {
            name: 'Grok 2 Latest',
            contextWindow: 128000,
            maxTokens: 4096,
            description: 'Latest Grok 2 model (updated monthly)',
            inputPricePerMillion: 2.00,
            outputPricePerMillion: 6.00
        },
        'grok-2-vision-latest': {
            name: 'Grok 2 Vision Latest',
            contextWindow: 128000,
            maxTokens: 4096,
            description: 'Latest Grok 2 with vision capabilities',
            supportsVision: true,
            inputPricePerMillion: 2.00,
            outputPricePerMillion: 6.00
        },
        'grok-2-1212': {
            name: 'Grok 2 (Dec 2024)',
            contextWindow: 128000,
            maxTokens: 4096,
            description: 'Grok 2 snapshot from December 2024',
            inputPricePerMillion: 2.00,
            outputPricePerMillion: 6.00
        },
        'grok-2-vision-1212': {
            name: 'Grok 2 Vision (Dec 2024)',
            contextWindow: 128000,
            maxTokens: 4096,
            description: 'Grok 2 Vision snapshot from December 2024',
            supportsVision: true,
            inputPricePerMillion: 2.00,
            outputPricePerMillion: 6.00
        },
        'grok-beta': {
            name: 'Grok Beta',
            contextWindow: 128000,
            maxTokens: 4096,
            description: 'Experimental Grok model with latest features',
            inputPricePerMillion: 2.00,
            outputPricePerMillion: 6.00
        },
        'grok-vision-beta': {
            name: 'Grok Vision Beta',
            contextWindow: 128000,
            maxTokens: 4096,
            description: 'Experimental Grok vision model',
            supportsVision: true,
            inputPricePerMillion: 2.00,
            outputPricePerMillion: 6.00
        }
    }
};

/**
 * Call Grok API
 * 
 * @param {Object} options - API call options
 * @param {string} options.apiKey - xAI API key (starts with 'xai-')
 * @param {string} options.model - Model name (default: 'grok-2-1212')
 * @param {Array} options.messages - Array of message objects [{role, content}]
 * @param {number} options.temperature - Sampling temperature 0-2 (default: 0.7)
 * @param {number} options.max_tokens - Maximum tokens to generate (default: 4096)
 * @param {number} options.top_p - Nucleus sampling parameter (default: 1)
 * @param {boolean} options.stream - Enable streaming (default: false)
 * @param {number} options.timeout - Request timeout in seconds (default: 30)
 * @param {number} options.maxRetries - Max retry attempts (default: 3)
 * 
 * @returns {Promise<Object>} API response with {success, data/error, elapsed_ms, attempts}
 */
export async function callGrok(options) {
    const {
        apiKey,
        model = 'grok-2-1212',
        messages,
        temperature = 0.7,
        max_tokens = 4096,
        top_p = 1,
        stream = false,
        timeout = 30,
        maxRetries = 3,
        ...additionalParams
    } = options;
    
    Logger.info('🤖 Calling Grok API', { model, messageCount: messages?.length });
    
    // Validation
    if (!apiKey) {
        Logger.error('Grok API key is required');
        return { success: false, error: 'API key is required' };
    }
    
    if (!apiKey.startsWith('xai-')) {
        Logger.warn('API key should start with "xai-"');
    }
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        Logger.error('Messages array is required and must not be empty');
        return { success: false, error: 'Messages array is required' };
    }
    
    // Build request payload
    const payload = {
        model,
        messages,
        temperature,
        max_tokens,
        top_p,
        stream,
        ...additionalParams
    };
    
    Logger.debug('Grok request payload:', payload);
    
    try {
        // Call through our proxy endpoint
        const response = await fetch('/api/ai/call', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                provider: 'grok',
                model,
                apiKey,
                apiUrl: GROK_CONFIG.baseUrl,
                endpoint: '/chat/completions',
                method: 'POST',
                headers: {},
                payload,
                timeout,
                maxRetries
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            Logger.info(`✅ Grok call success (${result.elapsed_ms}ms, ${result.attempts} attempts)`);
            Logger.debug('Grok response:', result.data);
        } else {
            Logger.error('❌ Grok call failed:', result.error);
        }
        
        return result;
        
    } catch (error) {
        Logger.error('Network error calling Grok:', error);
        return {
            success: false,
            error: `Network error: ${error.message}`
        };
    }
}

/**
 * Simple chat with Grok (single message)
 * 
 * @param {string} apiKey - xAI API key
 * @param {string} userMessage - User's message
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} API response
 */
export async function chatWithGrok(apiKey, userMessage, options = {}) {
    return callGrok({
        apiKey,
        messages: [
            { role: 'user', content: userMessage }
        ],
        ...options
    });
}

/**
 * Chat with Grok using system prompt
 * 
 * @param {string} apiKey - xAI API key
 * @param {string} systemPrompt - System instruction
 * @param {string} userMessage - User's message
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} API response
 */
export async function chatWithGrokSystem(apiKey, systemPrompt, userMessage, options = {}) {
    return callGrok({
        apiKey,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
        ],
        ...options
    });
}

/**
 * Multi-turn conversation with Grok
 * 
 * @param {string} apiKey - xAI API key
 * @param {Array} conversationHistory - Array of {role, content} messages
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} API response
 */
export async function continueConversation(apiKey, conversationHistory, options = {}) {
    return callGrok({
        apiKey,
        messages: conversationHistory,
        ...options
    });
}

/**
 * Analyze query with Grok (specialized for N1QL/database queries)
 * 
 * @param {string} apiKey - xAI API key
 * @param {string} query - SQL/N1QL query to analyze
 * @param {Object} queryPlan - Optional execution plan data
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} API response
 */
export async function analyzeQueryWithGrok(apiKey, query, queryPlan = null, options = {}) {
    const systemPrompt = `You are an expert database query analyzer specializing in Couchbase N1QL queries. 
Analyze queries for performance issues, optimization opportunities, and best practices.
Provide specific, actionable recommendations.`;
    
    let userMessage = `Analyze this N1QL query:\n\n${query}`;
    
    if (queryPlan) {
        userMessage += `\n\nExecution Plan:\n${JSON.stringify(queryPlan, null, 2)}`;
    }
    
    return chatWithGrokSystem(apiKey, systemPrompt, userMessage, {
        temperature: 0.3,  // Lower temperature for more focused analysis
        ...options
    });
}

/**
 * Extract text content from Grok response
 * 
 * @param {Object} result - Grok API result
 * @returns {string|null} Extracted text or null
 */
export function extractGrokResponse(result) {
    if (!result.success || !result.data) {
        return null;
    }
    
    try {
        // Grok uses OpenAI-compatible format
        return result.data.choices?.[0]?.message?.content || null;
    } catch (error) {
        Logger.error('Error extracting Grok response:', error);
        return null;
    }
}

/**
 * Get token usage from Grok response
 * 
 * @param {Object} result - Grok API result
 * @returns {Object|null} Usage info with {prompt_tokens, completion_tokens, total_tokens}
 */
export function getGrokUsage(result) {
    if (!result.success || !result.data) {
        return null;
    }
    
    const usage = result.data.usage;
    
    return {
        prompt_tokens: usage?.prompt_tokens || 0,
        completion_tokens: usage?.completion_tokens || 0,
        total_tokens: usage?.total_tokens || 0,
        // Grok-specific fields if available
        queue_time: usage?.queue_time,
        completion_time: usage?.completion_time
    };
}

/**
 * Calculate cost from usage
 * 
 * @param {Object} usage - Usage object from getGrokUsage()
 * @param {string} model - Model name
 * @returns {Object} Cost breakdown {input, output, total}
 */
export function calculateCost(usage, model) {
    const modelInfo = GROK_CONFIG.models[model];
    
    if (!modelInfo || !usage) {
        return { input: 0, output: 0, total: 0 };
    }
    
    const inputCost = (usage.prompt_tokens / 1000000) * modelInfo.inputPricePerMillion;
    const outputCost = (usage.completion_tokens / 1000000) * modelInfo.outputPricePerMillion;
    
    return {
        input: inputCost,
        output: outputCost,
        total: inputCost + outputCost,
        formatted: `$${(inputCost + outputCost).toFixed(6)}`
    };
}

/**
 * Estimate tokens in text (approximate)
 * Rule of thumb: ~4 characters per token
 * 
 * @param {string} text - Input text
 * @returns {number} Estimated token count
 */
export function estimateTokens(text) {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
}

/**
 * Check if message array fits within model context window
 * 
 * @param {Array} messages - Message array
 * @param {string} model - Model name
 * @returns {Object} {fits: boolean, estimatedTokens: number, limit: number}
 */
export function checkContextWindow(messages, model = 'grok-2-1212') {
    const modelInfo = GROK_CONFIG.models[model];
    
    if (!modelInfo) {
        Logger.warn(`Unknown model: ${model}`);
        return { fits: false, estimatedTokens: 0, limit: 0 };
    }
    
    // Estimate total tokens
    const estimatedTokens = messages.reduce((total, msg) => {
        return total + estimateTokens(msg.content || '');
    }, 0);
    
    const limit = modelInfo.contextWindow;
    const fits = estimatedTokens < limit;
    
    if (!fits) {
        Logger.warn(`Messages exceed context window: ${estimatedTokens} > ${limit}`);
    }
    
    return {
        fits,
        estimatedTokens,
        limit,
        remaining: limit - estimatedTokens
    };
}

/**
 * Get model information
 * 
 * @param {string} model - Model name
 * @returns {Object|null} Model configuration
 */
export function getModelInfo(model) {
    return GROK_CONFIG.models[model] || null;
}

/**
 * List available Grok models
 * 
 * @returns {Array} Array of {id, name, description}
 */
export function listGrokModels() {
    return Object.entries(GROK_CONFIG.models).map(([id, info]) => ({
        id,
        name: info.name,
        description: info.description,
        contextWindow: info.contextWindow,
        maxTokens: info.maxTokens,
        supportsVision: info.supportsVision || false
    }));
}
