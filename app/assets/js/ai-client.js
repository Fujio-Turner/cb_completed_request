/**
 * AI API Client Module
 * Wrapper for calling AI providers through the Flask proxy endpoint
 */

import { Logger } from './base.js';
import { loadUserPreferences as loadUserPrefsFromCB } from './couchbase-connector.js';

/**
 * Get the default AI provider configuration from user preferences
 */
export async function getDefaultAIProvider() {
    try {
        const preferences = await loadUserPrefsFromCB('user_config');
        
        if (preferences && preferences.aiApis && Array.isArray(preferences.aiApis)) {
            const defaultProvider = preferences.aiApis[0]; // First is default
            
            if (defaultProvider && defaultProvider.apiKey) {
                Logger.info('Using default AI provider:', defaultProvider.name);
                return defaultProvider;
            }
        }
        
        Logger.warn('No default AI provider configured');
        return null;
    } catch (error) {
        Logger.error('Error loading AI provider config:', error);
        return null;
    }
}

/**
 * Call AI API through Flask proxy
 * 
 * @param {Object} options - API call options
 * @param {string} options.provider - Provider ID (e.g., 'openai', 'claude')
 * @param {string} options.model - Model ID (e.g., 'gpt-4o')
 * @param {string} options.apiKey - API key
 * @param {string} options.apiUrl - Base API URL
 * @param {string} options.endpoint - API endpoint path (e.g., '/chat/completions')
 * @param {Object} options.payload - Request payload
 * @param {string} options.method - HTTP method (default: 'POST')
 * @param {Object} options.headers - Custom headers
 * @param {number} options.timeout - Request timeout in seconds (default: 30)
 * @param {number} options.maxRetries - Max retry attempts (default: 3)
 * 
 * @returns {Promise<Object>} API response with {success, data/error, elapsed_ms, attempts}
 */
export async function callAI(options) {
    const {
        provider,
        model,
        apiKey,
        apiUrl,
        endpoint = '/chat/completions',
        payload = {},
        method = 'POST',
        headers = {},
        timeout = 30,
        maxRetries = 3
    } = options;
    
    Logger.info('🤖 AI API Call:', { provider, model, endpoint });
    
    // Validation
    if (!apiKey) {
        Logger.error('API key is required');
        return { success: false, error: 'API key is required' };
    }
    
    if (!apiUrl) {
        Logger.error('API URL is required');
        return { success: false, error: 'API URL is required' };
    }
    
    try {
        const response = await fetch('/api/ai/call', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                provider,
                model,
                apiKey,
                apiUrl,
                endpoint,
                method,
                headers,
                payload,
                timeout,
                maxRetries
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            Logger.info(`✅ AI Call Success (${result.elapsed_ms}ms, ${result.attempts} attempts)`);
        } else {
            Logger.error('❌ AI Call Failed:', result.error);
        }
        
        return result;
        
    } catch (error) {
        Logger.error('Network error calling AI API:', error);
        return {
            success: false,
            error: `Network error: ${error.message}`
        };
    }
}

/**
 * Call the default AI provider with a simple message
 * 
 * @param {string} userMessage - User's message/prompt
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} AI response
 */
export async function callDefaultAI(userMessage, options = {}) {
    const provider = await getDefaultAIProvider();
    
    if (!provider) {
        return {
            success: false,
            error: 'No AI provider configured. Please configure one in Settings.'
        };
    }
    
    Logger.info('Using default provider:', provider.name, provider.model);
    
    // Build payload based on provider
    let payload = {};
    let endpoint = '';
    
    switch (provider.id) {
        case 'openai':
        case 'groq':
        case 'deepseek':
        case 'openrouter':
        case 'together':
            // OpenAI-compatible format
            endpoint = '/chat/completions';
            payload = {
                model: provider.model,
                messages: [
                    { role: 'user', content: userMessage }
                ],
                ...options
            };
            break;
            
        case 'claude':
            // Anthropic format
            endpoint = '/v1/messages';
            payload = {
                model: provider.model,
                max_tokens: options.max_tokens || 4096,
                messages: [
                    { role: 'user', content: userMessage }
                ],
                ...options
            };
            break;
            
        case 'gemini':
            // Google Gemini format
            endpoint = `/v1/models/${provider.model}:generateContent`;
            payload = {
                contents: [
                    {
                        parts: [{ text: userMessage }]
                    }
                ],
                ...options
            };
            break;
            
        case 'cohere':
            // Cohere format
            endpoint = '/v1/chat';
            payload = {
                model: provider.model,
                message: userMessage,
                ...options
            };
            break;
            
        default:
            // Generic format (try OpenAI-compatible)
            endpoint = options.endpoint || '/chat/completions';
            payload = {
                model: provider.model,
                messages: [
                    { role: 'user', content: userMessage }
                ],
                ...options
            };
    }
    
    return callAI({
        provider: provider.id,
        model: provider.model,
        apiKey: provider.apiKey,
        apiUrl: provider.apiUrl,
        endpoint,
        payload
    });
}

/**
 * Extract text response from AI API result
 * Handles different response formats from different providers
 * 
 * @param {Object} result - AI API call result
 * @param {string} provider - Provider ID
 * @returns {string|null} Extracted text or null
 */
export function extractAIResponse(result, provider) {
    if (!result.success || !result.data) {
        return null;
    }
    
    const data = result.data;
    
    try {
        switch (provider) {
            case 'openai':
            case 'groq':
            case 'deepseek':
            case 'openrouter':
            case 'together':
                // OpenAI format: data.choices[0].message.content
                return data.choices?.[0]?.message?.content || null;
                
            case 'claude':
                // Anthropic format: data.content[0].text
                return data.content?.[0]?.text || null;
                
            case 'gemini':
                // Gemini format: data.candidates[0].content.parts[0].text
                return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
                
            case 'cohere':
                // Cohere format: data.text
                return data.text || null;
                
            default:
                // Try common formats
                return data.choices?.[0]?.message?.content ||
                       data.content?.[0]?.text ||
                       data.text ||
                       data.response ||
                       null;
        }
    } catch (error) {
        Logger.error('Error extracting AI response:', error);
        return null;
    }
}

/**
 * Get usage/token information from AI API result
 * 
 * @param {Object} result - AI API call result
 * @returns {Object|null} Usage info with {prompt_tokens, completion_tokens, total_tokens}
 */
export function getAIUsage(result) {
    if (!result.success || !result.data) {
        return null;
    }
    
    const data = result.data;
    
    // Most providers use similar usage format
    return {
        prompt_tokens: data.usage?.prompt_tokens || 0,
        completion_tokens: data.usage?.completion_tokens || 0,
        total_tokens: data.usage?.total_tokens || 0
    };
}
