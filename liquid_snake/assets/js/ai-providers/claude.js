/**
 * Claude (Anthropic) API Client
 * API Documentation: https://docs.anthropic.com/
 * 
 * Claude uses a different API format than OpenAI
 * Base URL: https://api.anthropic.com
 * Authentication: x-api-key header (NOT Bearer token)
 */

import { Logger } from '../base.js';

/**
 * Claude API configuration
 */
export const CLAUDE_CONFIG = {
    baseUrl: 'https://api.anthropic.com',
    apiVersion: '2023-06-01',
    models: {
        'claude-3-5-sonnet-20241022': {
            name: 'Claude 3.5 Sonnet (Latest)',
            contextWindow: 200000,
            maxTokens: 8192,
            description: 'Most intelligent Claude model with enhanced coding and analysis',
            inputPricePerMillion: 3.00,
            outputPricePerMillion: 15.00
        },
        'claude-3-5-haiku-20241022': {
            name: 'Claude 3.5 Haiku',
            contextWindow: 200000,
            maxTokens: 8192,
            description: 'Fastest and most affordable Claude 3.5 model',
            inputPricePerMillion: 0.80,
            outputPricePerMillion: 4.00
        },
        'claude-3-opus-20240229': {
            name: 'Claude 3 Opus',
            contextWindow: 200000,
            maxTokens: 4096,
            description: 'Most capable Claude 3 model for complex tasks',
            inputPricePerMillion: 15.00,
            outputPricePerMillion: 75.00
        },
        'claude-3-sonnet-20240229': {
            name: 'Claude 3 Sonnet',
            contextWindow: 200000,
            maxTokens: 4096,
            description: 'Balanced intelligence and speed',
            inputPricePerMillion: 3.00,
            outputPricePerMillion: 15.00
        },
        'claude-3-haiku-20240307': {
            name: 'Claude 3 Haiku',
            contextWindow: 200000,
            maxTokens: 4096,
            description: 'Fast and affordable for simple tasks',
            inputPricePerMillion: 0.25,
            outputPricePerMillion: 1.25
        }
    }
};

/**
 * Call Claude API
 * 
 * @param {Object} options - API call options
 * @param {string} options.apiKey - Anthropic API key (starts with 'sk-ant-')
 * @param {string} options.model - Model name (default: 'claude-3-5-sonnet-20241022')
 * @param {Array} options.messages - Array of message objects [{role, content}]
 * @param {string} options.system - System prompt (separate from messages)
 * @param {number} options.max_tokens - Maximum tokens to generate (REQUIRED for Claude)
 * @param {number} options.temperature - Sampling temperature 0-1 (default: 1)
 * @param {number} options.top_p - Nucleus sampling parameter (default: 1)
 * @param {number} options.top_k - Top-k sampling parameter
 * @param {Array} options.stop_sequences - Custom stop sequences
 * @param {boolean} options.stream - Enable streaming (default: false)
 * @param {Object} options.metadata - Request metadata
 * @param {number} options.timeout - Request timeout in seconds (default: 30)
 * @param {number} options.maxRetries - Max retry attempts (default: 3)
 * 
 * @returns {Promise<Object>} API response with {success, data/error, elapsed_ms, attempts}
 */
export async function callClaude(options) {
    const {
        apiKey,
        model = 'claude-3-5-sonnet-20241022',
        messages,
        system,
        max_tokens = 4096,  // Required for Claude!
        temperature = 1,
        top_p,
        top_k,
        stop_sequences,
        stream = false,
        metadata,
        timeout = 30,
        maxRetries = 3,
        ...additionalParams
    } = options;
    
    Logger.info('🧠 Calling Claude API', { model, messageCount: messages?.length });
    
    // Validation
    if (!apiKey) {
        Logger.error('Claude API key is required');
        return { success: false, error: 'API key is required' };
    }
    
    if (!apiKey.startsWith('sk-ant-')) {
        Logger.warn('Claude API key should start with "sk-ant-"');
    }
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        Logger.error('Messages array is required and must not be empty');
        return { success: false, error: 'Messages array is required' };
    }
    
    if (!max_tokens) {
        Logger.error('max_tokens is required for Claude API');
        return { success: false, error: 'max_tokens is required' };
    }
    
    // Build request payload (Claude format is different from OpenAI)
    const payload = {
        model,
        messages,
        max_tokens,
        temperature,
        stream,
        ...additionalParams
    };
    
    // Optional parameters
    if (system) payload.system = system;
    if (top_p !== undefined) payload.top_p = top_p;
    if (top_k !== undefined) payload.top_k = top_k;
    if (stop_sequences) payload.stop_sequences = stop_sequences;
    if (metadata) payload.metadata = metadata;
    
    Logger.debug('Claude request payload:', payload);
    
    try {
        // Call through our proxy endpoint
        // Note: Claude uses x-api-key header, not Authorization Bearer
        const response = await fetch('/api/ai/call', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                provider: 'anthropic',  // Special handling in app.py
                model,
                apiKey,
                apiUrl: CLAUDE_CONFIG.baseUrl,
                endpoint: '/v1/messages',
                method: 'POST',
                headers: {
                    'anthropic-version': CLAUDE_CONFIG.apiVersion
                },
                payload,
                timeout,
                maxRetries
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            Logger.info(`✅ Claude call success (${result.elapsed_ms}ms, ${result.attempts} attempts)`);
            Logger.debug('Claude response:', result.data);
        } else {
            Logger.error('❌ Claude call failed:', result.error);
        }
        
        return result;
        
    } catch (error) {
        Logger.error('Network error calling Claude:', error);
        return {
            success: false,
            error: `Network error: ${error.message}`
        };
    }
}

/**
 * Simple chat with Claude (single message)
 * 
 * @param {string} apiKey - Anthropic API key
 * @param {string} userMessage - User's message
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} API response
 */
export async function chatWithClaude(apiKey, userMessage, options = {}) {
    return callClaude({
        apiKey,
        messages: [
            { role: 'user', content: userMessage }
        ],
        max_tokens: options.max_tokens || 4096,
        ...options
    });
}

/**
 * Chat with Claude using system prompt
 * Note: Claude's system prompt is a separate parameter, not part of messages
 * 
 * @param {string} apiKey - Anthropic API key
 * @param {string} systemPrompt - System instruction
 * @param {string} userMessage - User's message
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} API response
 */
export async function chatWithClaudeSystem(apiKey, systemPrompt, userMessage, options = {}) {
    return callClaude({
        apiKey,
        system: systemPrompt,  // System is separate in Claude
        messages: [
            { role: 'user', content: userMessage }
        ],
        max_tokens: options.max_tokens || 4096,
        ...options
    });
}

/**
 * Multi-turn conversation with Claude
 * Note: Messages must alternate between user and assistant
 * 
 * @param {string} apiKey - Anthropic API key
 * @param {Array} conversationHistory - Array of {role, content} messages
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} API response
 */
export async function continueConversation(apiKey, conversationHistory, options = {}) {
    return callClaude({
        apiKey,
        messages: conversationHistory,
        max_tokens: options.max_tokens || 4096,
        ...options
    });
}

/**
 * Analyze query with Claude (specialized for N1QL/database queries)
 * 
 * @param {string} apiKey - Anthropic API key
 * @param {string} query - SQL/N1QL query to analyze
 * @param {Object} queryPlan - Optional execution plan data
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} API response
 */
export async function analyzeQueryWithClaude(apiKey, query, queryPlan = null, options = {}) {
    const systemPrompt = `You are an expert database query analyzer specializing in Couchbase N1QL queries. 
Analyze queries for performance issues, optimization opportunities, and best practices.
Provide specific, actionable recommendations with code examples.`;
    
    let userMessage = `Analyze this N1QL query:\n\n${query}`;
    
    if (queryPlan) {
        userMessage += `\n\nExecution Plan:\n${JSON.stringify(queryPlan, null, 2)}`;
    }
    
    return chatWithClaudeSystem(apiKey, systemPrompt, userMessage, {
        temperature: 0.3,  // Lower temperature for focused analysis
        max_tokens: options.max_tokens || 4096,
        ...options
    });
}

/**
 * Extract text content from Claude response
 * Claude returns content as array of text blocks
 * 
 * @param {Object} result - Claude API result
 * @returns {string|null} Extracted text or null
 */
export function extractClaudeResponse(result) {
    if (!result.success || !result.data) {
        return null;
    }
    
    try {
        // Claude format: data.content[0].text
        const content = result.data.content;
        
        if (Array.isArray(content) && content.length > 0) {
            // Concatenate all text blocks
            return content
                .filter(block => block.type === 'text')
                .map(block => block.text)
                .join('\n\n');
        }
        
        return null;
    } catch (error) {
        Logger.error('Error extracting Claude response:', error);
        return null;
    }
}

/**
 * Get token usage from Claude response
 * 
 * @param {Object} result - Claude API result
 * @returns {Object|null} Usage info with {input_tokens, output_tokens, total_tokens}
 */
export function getClaudeUsage(result) {
    if (!result.success || !result.data) {
        return null;
    }
    
    const usage = result.data.usage;
    
    return {
        prompt_tokens: usage?.input_tokens || 0,
        completion_tokens: usage?.output_tokens || 0,
        total_tokens: (usage?.input_tokens || 0) + (usage?.output_tokens || 0),
        // Claude-specific fields
        input_tokens: usage?.input_tokens || 0,
        output_tokens: usage?.output_tokens || 0
    };
}

/**
 * Calculate cost from usage
 * 
 * @param {Object} usage - Usage object from getClaudeUsage()
 * @param {string} model - Model name
 * @returns {Object} Cost breakdown {input, output, total}
 */
export function calculateCost(usage, model) {
    const modelInfo = CLAUDE_CONFIG.models[model];
    
    if (!modelInfo || !usage) {
        return { input: 0, output: 0, total: 0 };
    }
    
    const inputCost = (usage.input_tokens / 1000000) * modelInfo.inputPricePerMillion;
    const outputCost = (usage.output_tokens / 1000000) * modelInfo.outputPricePerMillion;
    
    return {
        input: inputCost,
        output: outputCost,
        total: inputCost + outputCost,
        formatted: `$${(inputCost + outputCost).toFixed(6)}`
    };
}

/**
 * Estimate tokens in text (approximate)
 * Claude uses ~4 characters per token similar to GPT
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
export function checkContextWindow(messages, model = 'claude-3-5-sonnet-20241022') {
    const modelInfo = CLAUDE_CONFIG.models[model];
    
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
    return CLAUDE_CONFIG.models[model] || null;
}

/**
 * List available Claude models
 * 
 * @returns {Array} Array of {id, name, description}
 */
export function listClaudeModels() {
    return Object.entries(CLAUDE_CONFIG.models).map(([id, info]) => ({
        id,
        name: info.name,
        description: info.description,
        contextWindow: info.contextWindow,
        maxTokens: info.maxTokens,
        inputPrice: info.inputPricePerMillion,
        outputPrice: info.outputPricePerMillion
    }));
}

/**
 * Get stop reason from Claude response
 * 
 * @param {Object} result - Claude API result
 * @returns {string|null} Stop reason (end_turn, max_tokens, stop_sequence)
 */
export function getStopReason(result) {
    if (!result.success || !result.data) {
        return null;
    }
    
    return result.data.stop_reason || null;
}

/**
 * Check if response was truncated due to max_tokens
 * 
 * @param {Object} result - Claude API result
 * @returns {boolean} True if truncated
 */
export function wasResponseTruncated(result) {
    return getStopReason(result) === 'max_tokens';
}

/**
 * Validate message format for Claude
 * Claude requires messages to alternate between user and assistant
 * 
 * @param {Array} messages - Message array
 * @returns {Object} {valid: boolean, error: string}
 */
export function validateMessages(messages) {
    if (!messages || messages.length === 0) {
        return { valid: false, error: 'Messages array is empty' };
    }
    
    // First message must be from user
    if (messages[0].role !== 'user') {
        return { valid: false, error: 'First message must be from user' };
    }
    
    // Messages must alternate
    for (let i = 1; i < messages.length; i++) {
        const prevRole = messages[i - 1].role;
        const currRole = messages[i].role;
        
        if (prevRole === currRole) {
            return { 
                valid: false, 
                error: `Messages must alternate. Found consecutive ${currRole} messages at index ${i}` 
            };
        }
    }
    
    // No system messages in messages array (use system parameter instead)
    const hasSystemMsg = messages.some(m => m.role === 'system');
    if (hasSystemMsg) {
        return { 
            valid: false, 
            error: 'System prompts should use the "system" parameter, not messages array' 
        };
    }
    
    return { valid: true };
}
