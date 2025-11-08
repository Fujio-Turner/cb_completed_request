/**
 * OpenAI API Client
 * API Documentation: https://platform.openai.com/docs/api-reference
 * 
 * OpenAI provides GPT models for chat, completions, embeddings, and more
 * Base URL: https://api.openai.com/v1
 * Authentication: Authorization: Bearer sk-...
 */

import { Logger } from '../base.js';

/**
 * OpenAI API configuration
 */
export const OPENAI_CONFIG = {
    baseUrl: 'https://api.openai.com/v1',
    models: {
        'gpt-4o': {
            name: 'GPT-4o (Latest)',
            contextWindow: 128000,
            maxTokens: 16384,
            description: 'Most capable multimodal flagship model, cheaper and faster than GPT-4 Turbo',
            inputPricePerMillion: 2.50,
            outputPricePerMillion: 10.00
        },
        'gpt-4o-mini': {
            name: 'GPT-4o Mini',
            contextWindow: 128000,
            maxTokens: 16384,
            description: 'Affordable small model for fast, lightweight tasks',
            inputPricePerMillion: 0.150,
            outputPricePerMillion: 0.600
        },
        'gpt-4-turbo': {
            name: 'GPT-4 Turbo',
            contextWindow: 128000,
            maxTokens: 4096,
            description: 'Previous high-intelligence model',
            inputPricePerMillion: 10.00,
            outputPricePerMillion: 30.00
        },
        'gpt-4': {
            name: 'GPT-4',
            contextWindow: 8192,
            maxTokens: 4096,
            description: 'Original GPT-4 model',
            inputPricePerMillion: 30.00,
            outputPricePerMillion: 60.00
        },
        'gpt-3.5-turbo': {
            name: 'GPT-3.5 Turbo',
            contextWindow: 16385,
            maxTokens: 4096,
            description: 'Fast, inexpensive model for simple tasks',
            inputPricePerMillion: 0.50,
            outputPricePerMillion: 1.50
        },
        'o1-preview': {
            name: 'O1 Preview',
            contextWindow: 128000,
            maxTokens: 32768,
            description: 'Advanced reasoning model for complex problems',
            inputPricePerMillion: 15.00,
            outputPricePerMillion: 60.00,
            reasoningModel: true
        },
        'o1-mini': {
            name: 'O1 Mini',
            contextWindow: 128000,
            maxTokens: 65536,
            description: 'Faster reasoning model for coding, math, and science',
            inputPricePerMillion: 3.00,
            outputPricePerMillion: 12.00,
            reasoningModel: true
        }
    }
};

/**
 * Call OpenAI API
 * 
 * @param {Object} options - API call options
 * @param {string} options.apiKey - OpenAI API key (starts with 'sk-')
 * @param {string} options.model - Model name (default: 'gpt-4o')
 * @param {Array} options.messages - Array of message objects [{role, content}]
 * @param {number} options.temperature - Sampling temperature 0-2 (default: 1)
 * @param {number} options.max_tokens - Maximum tokens to generate
 * @param {number} options.top_p - Nucleus sampling parameter (default: 1)
 * @param {number} options.frequency_penalty - Penalty for token frequency -2 to 2 (default: 0)
 * @param {number} options.presence_penalty - Penalty for token presence -2 to 2 (default: 0)
 * @param {boolean} options.stream - Enable streaming (default: false)
 * @param {Object} options.response_format - Response format {type: 'json_object'}
 * @param {Array} options.tools - Function calling tools
 * @param {string} options.user - Unique end-user identifier
 * @param {number} options.timeout - Request timeout in seconds (default: 30)
 * @param {number} options.maxRetries - Max retry attempts (default: 3)
 * 
 * @returns {Promise<Object>} API response with {success, data/error, elapsed_ms, attempts}
 */
export async function callOpenAI(options) {
    const {
        apiKey,
        model = 'gpt-4o',
        messages,
        temperature = 1,
        max_tokens,
        top_p = 1,
        frequency_penalty = 0,
        presence_penalty = 0,
        stream = false,
        response_format,
        tools,
        tool_choice,
        user,
        timeout = 30,
        maxRetries = 3,
        ...additionalParams
    } = options;
    
    Logger.info('🤖 Calling OpenAI API', { model, messageCount: messages?.length });
    
    // Validation
    if (!apiKey) {
        Logger.error('OpenAI API key is required');
        return { success: false, error: 'API key is required' };
    }
    
    if (!apiKey.startsWith('sk-') && !apiKey.startsWith('org-')) {
        Logger.warn('API key should typically start with "sk-"');
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
        top_p,
        frequency_penalty,
        presence_penalty,
        stream,
        ...additionalParams
    };
    
    // Optional parameters
    if (max_tokens) payload.max_tokens = max_tokens;
    if (response_format) payload.response_format = response_format;
    if (tools) payload.tools = tools;
    if (tool_choice) payload.tool_choice = tool_choice;
    if (user) payload.user = user;
    
    Logger.debug('OpenAI request payload:', payload);
    
    try {
        // Call through our proxy endpoint
        const response = await fetch('/api/ai/call', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                provider: 'openai',
                model,
                apiKey,
                apiUrl: OPENAI_CONFIG.baseUrl,
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
            Logger.info(`✅ OpenAI call success (${result.elapsed_ms}ms, ${result.attempts} attempts)`);
            Logger.debug('OpenAI response:', result.data);
        } else {
            Logger.error('❌ OpenAI call failed:', result.error);
        }
        
        return result;
        
    } catch (error) {
        Logger.error('Network error calling OpenAI:', error);
        return {
            success: false,
            error: `Network error: ${error.message}`
        };
    }
}

/**
 * Simple chat with OpenAI (single message)
 * 
 * @param {string} apiKey - OpenAI API key
 * @param {string} userMessage - User's message
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} API response
 */
export async function chatWithOpenAI(apiKey, userMessage, options = {}) {
    return callOpenAI({
        apiKey,
        messages: [
            { role: 'user', content: userMessage }
        ],
        ...options
    });
}

/**
 * Chat with OpenAI using system prompt
 * 
 * @param {string} apiKey - OpenAI API key
 * @param {string} systemPrompt - System instruction
 * @param {string} userMessage - User's message
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} API response
 */
export async function chatWithOpenAISystem(apiKey, systemPrompt, userMessage, options = {}) {
    return callOpenAI({
        apiKey,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
        ],
        ...options
    });
}

/**
 * Multi-turn conversation with OpenAI
 * 
 * @param {string} apiKey - OpenAI API key
 * @param {Array} conversationHistory - Array of {role, content} messages
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} API response
 */
export async function continueConversation(apiKey, conversationHistory, options = {}) {
    return callOpenAI({
        apiKey,
        messages: conversationHistory,
        ...options
    });
}

/**
 * Get JSON response from OpenAI
 * 
 * @param {string} apiKey - OpenAI API key
 * @param {string} userMessage - User's message
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} API response with JSON
 */
export async function getJSONResponse(apiKey, userMessage, options = {}) {
    return callOpenAI({
        apiKey,
        messages: [
            { role: 'user', content: userMessage }
        ],
        response_format: { type: 'json_object' },
        ...options
    });
}

/**
 * Analyze query with OpenAI (specialized for N1QL/database queries)
 * 
 * @param {string} apiKey - OpenAI API key
 * @param {string} query - SQL/N1QL query to analyze
 * @param {Object} queryPlan - Optional execution plan data
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} API response
 */
export async function analyzeQueryWithOpenAI(apiKey, query, queryPlan = null, options = {}) {
    const systemPrompt = `You are an expert database query analyzer specializing in Couchbase N1QL queries. 
Analyze queries for performance issues, optimization opportunities, and best practices.
Provide specific, actionable recommendations.`;
    
    let userMessage = `Analyze this N1QL query:\n\n${query}`;
    
    if (queryPlan) {
        userMessage += `\n\nExecution Plan:\n${JSON.stringify(queryPlan, null, 2)}`;
    }
    
    return chatWithOpenAISystem(apiKey, systemPrompt, userMessage, {
        temperature: 0.3,  // Lower temperature for focused analysis
        ...options
    });
}

/**
 * Call OpenAI with function/tool calling
 * 
 * @param {string} apiKey - OpenAI API key
 * @param {Array} messages - Conversation messages
 * @param {Array} tools - Function definitions
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} API response
 */
export async function callWithTools(apiKey, messages, tools, options = {}) {
    return callOpenAI({
        apiKey,
        messages,
        tools,
        ...options
    });
}

/**
 * Extract text content from OpenAI response
 * 
 * @param {Object} result - OpenAI API result
 * @returns {string|null} Extracted text or null
 */
export function extractOpenAIResponse(result) {
    if (!result.success || !result.data) {
        return null;
    }
    
    try {
        const choice = result.data.choices?.[0];
        
        // Check for function call
        if (choice?.message?.tool_calls) {
            return JSON.stringify(choice.message.tool_calls, null, 2);
        }
        
        // Regular text response
        return choice?.message?.content || null;
    } catch (error) {
        Logger.error('Error extracting OpenAI response:', error);
        return null;
    }
}

/**
 * Get token usage from OpenAI response
 * 
 * @param {Object} result - OpenAI API result
 * @returns {Object|null} Usage info with {prompt_tokens, completion_tokens, total_tokens}
 */
export function getOpenAIUsage(result) {
    if (!result.success || !result.data) {
        return null;
    }
    
    const usage = result.data.usage;
    
    return {
        prompt_tokens: usage?.prompt_tokens || 0,
        completion_tokens: usage?.completion_tokens || 0,
        total_tokens: usage?.total_tokens || 0,
        // O1 models have reasoning tokens
        reasoning_tokens: usage?.completion_tokens_details?.reasoning_tokens || 0
    };
}

/**
 * Calculate cost from usage
 * 
 * @param {Object} usage - Usage object from getOpenAIUsage()
 * @param {string} model - Model name
 * @returns {Object} Cost breakdown {input, output, total}
 */
export function calculateCost(usage, model) {
    const modelInfo = OPENAI_CONFIG.models[model];
    
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
 * Rule of thumb: ~4 characters per token for English
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
export function checkContextWindow(messages, model = 'gpt-4o') {
    const modelInfo = OPENAI_CONFIG.models[model];
    
    if (!modelInfo) {
        Logger.warn(`Unknown model: ${model}`);
        return { fits: false, estimatedTokens: 0, limit: 0 };
    }
    
    // Estimate total tokens
    const estimatedTokens = messages.reduce((total, msg) => {
        return total + estimateTokens(JSON.stringify(msg));
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
    return OPENAI_CONFIG.models[model] || null;
}

/**
 * List available OpenAI models
 * 
 * @returns {Array} Array of {id, name, description}
 */
export function listOpenAIModels() {
    return Object.entries(OPENAI_CONFIG.models).map(([id, info]) => ({
        id,
        name: info.name,
        description: info.description,
        contextWindow: info.contextWindow,
        maxTokens: info.maxTokens,
        inputPrice: info.inputPricePerMillion,
        outputPrice: info.outputPricePerMillion,
        reasoningModel: info.reasoningModel || false
    }));
}

/**
 * Check if finish reason indicates truncation
 * 
 * @param {Object} result - OpenAI API result
 * @returns {boolean} True if response was truncated
 */
export function wasResponseTruncated(result) {
    if (!result.success || !result.data) {
        return false;
    }
    
    const finishReason = result.data.choices?.[0]?.finish_reason;
    return finishReason === 'length';
}

/**
 * Get finish reason from response
 * 
 * @param {Object} result - OpenAI API result
 * @returns {string|null} Finish reason (stop, length, tool_calls, content_filter)
 */
export function getFinishReason(result) {
    if (!result.success || !result.data) {
        return null;
    }
    
    return result.data.choices?.[0]?.finish_reason || null;
}
