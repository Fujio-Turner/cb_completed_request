/**
 * Settings Modal UI Module (Issue #231)
 * Handles the settings modal UI and user interactions
 */

import { Logger } from './base.js';
import { 
    loadConfig, 
    getClusterTypes,
    saveConfig, 
    testConnection,
    getCurrentCluster,
    saveUserPreferences,
    loadUserPreferences as loadUserPrefsFromCB
} from './couchbase-connector.js';

/**
 * AI Provider definitions with order
 * Order matters: first provider is the default
 * Logo images should be placed in: liquid_snake/img/ai-logos/
 */
const AI_PROVIDERS = [
    { 
        id: 'openai', 
        name: 'OpenAI', 
        logo: 'img/ai-logos/openai.png', 
        keyPlaceholder: 'sk-...', 
        defaultUrl: 'https://api.openai.com/v1',
        models: [
            // GPT-5.x Series (Latest Frontier)
            { id: 'gpt-5.1', name: 'GPT-5.1 (Best for Coding/Agents) - 1M ctx' },
            { id: 'gpt-5', name: 'GPT-5 (Intelligent Reasoning) - 256K ctx' },
            { id: 'gpt-5-mini', name: 'GPT-5 Mini (Fast) - 1M ctx' },
            { id: 'gpt-5-nano', name: 'GPT-5 Nano (Fastest) - 1M ctx' },
            { id: 'gpt-5-pro', name: 'GPT-5 Pro (Smarter Responses) - 256K ctx' },
            // GPT-4.x Series
            { id: 'gpt-4.1', name: 'GPT-4.1 (Smartest Non-Reasoning) - 1M ctx' },
            { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini (Faster) - 1M ctx' },
            { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano (Cost-Efficient) - 1M ctx' },
            { id: 'gpt-4o', name: 'GPT-4o (Fast & Flexible) - 128K ctx' },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Affordable) - 128K ctx' },
            { id: 'gpt-4-turbo', name: 'GPT-4 Turbo - 128K ctx' },
            // O-Series (Reasoning)
            { id: 'o4-mini', name: 'o4-mini (Fast Reasoning) - 200K ctx' },
            { id: 'o3', name: 'o3 (Complex Tasks) - 200K ctx' },
            { id: 'o3-mini', name: 'o3-mini (Small Reasoning) - 200K ctx' },
            { id: 'o1', name: 'o1 (Full Reasoning) - 200K ctx' },
            { id: 'o1-pro', name: 'o1-pro (More Compute) - 200K ctx' },
            // Legacy
            { id: 'gpt-4', name: 'GPT-4 (Legacy) - 8K ctx' },
            { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo (Legacy) - 16K ctx' }
        ]
    },
    { 
        id: 'claude', 
        name: 'Anthropic Claude', 
        logo: 'img/ai-logos/anthropic.png', 
        keyPlaceholder: 'sk-ant-...', 
        defaultUrl: 'https://api.anthropic.com',
        models: [
            // Claude 4.x Series (Latest)
            { id: 'claude-opus-4-20250514', name: 'Claude Opus 4 (Most Capable) - 200K ctx, 30K TPM' },
            { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4 (Balanced) - 200K ctx, 30K TPM' },
            // Claude 3.5 Series
            { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Oct 2024) - 200K ctx, 30K TPM' },
            { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Oct 2024) - 200K ctx, 50K TPM' },
            // Claude 3 Series
            { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus - 200K ctx, 30K TPM' },
            { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet - 200K ctx, 30K TPM' },
            { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku - 200K ctx, 50K TPM' }
        ]
    },
    { 
        id: 'grok', 
        name: 'xAI Grok', 
        logo: 'img/ai-logos/grok.png', 
        keyPlaceholder: 'xai-...', 
        defaultUrl: 'https://api.x.ai/v1',
        models: [
            // Grok 4.x Series (Latest - 2M context!)
            { id: 'grok-4-1-fast-reasoning', name: 'Grok 4.1 Fast Reasoning - 2M ctx, 4M TPM' },
            { id: 'grok-4-1-fast-non-reasoning', name: 'Grok 4.1 Fast Non-Reasoning - 2M ctx, 4M TPM' },
            { id: 'grok-4-fast-reasoning', name: 'Grok 4 Fast Reasoning - 2M ctx, 4M TPM' },
            { id: 'grok-4-fast-non-reasoning', name: 'Grok 4 Fast Non-Reasoning - 2M ctx, 4M TPM' },
            { id: 'grok-4-0709', name: 'Grok 4 (July 2025) - 256K ctx, 2M TPM' },
            // Grok 3 Series
            { id: 'grok-3', name: 'Grok 3 (Advanced) - 131K ctx' },
            { id: 'grok-3-mini', name: 'Grok 3 Mini (Fast) - 131K ctx' },
            // Grok Code
            { id: 'grok-code-fast-1', name: 'Grok Code Fast 1 - 256K ctx, 2M TPM' },
            // Legacy
            { id: 'grok-2-latest', name: 'Grok 2 Latest (Legacy)' },
            { id: 'grok-2-vision-latest', name: 'Grok 2 Vision (Multimodal)' }
        ]
    }
];

// Current order of AI providers (will be modified by user)
let currentAiOrder = [...AI_PROVIDERS];

// Custom AI APIs (user-defined)
let customAiApis = [];

// Currently editing custom API (null for new, id for editing)
let editingCustomAiId = null;

/**
 * Render AI providers in current order
 */
function renderAiProviders() {
    const container = document.getElementById('ai-providers-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    currentAiOrder.forEach((provider, index) => {
        const isDefault = index === 0;
        const providerDiv = document.createElement('div');
        providerDiv.className = 'ai-provider-section';
        if (isDefault) {
            providerDiv.classList.add('ai-provider-default');
        }
        
        // Generate model options
        const modelOptions = provider.models.map(model => 
            `<option value="${model.id}">${model.name}</option>`
        ).join('');
        
        providerDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${provider.logo}" alt="${provider.name} logo" class="ai-provider-logo" onerror="this.style.display='none'" />
                    <h4 style="margin: 0;">${provider.name}</h4>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    ${isDefault ? '<span class="default-badge">DEFAULT</span>' : `<button class="btn-make-default" onclick="makeDefaultProvider('${provider.id}')">Make Default</button>`}
                </div>
            </div>
            <div class="settings-row">
                <label>Model:</label>
                <select id="${provider.id}-model" class="ai-model-select" style="width: 300px;">
                    ${modelOptions}
                </select>
            </div>
            <div class="settings-row">
                <label>API Key:</label>
                <input type="password" id="${provider.id}-api-key" placeholder="${provider.keyPlaceholder}" style="width: 300px;" />
            </div>
            <div class="settings-row">
                <label>API URL ${provider.id !== 'custom' ? '(optional)' : ''}:</label>
                <input type="text" id="${provider.id}-api-url" placeholder="${provider.defaultUrl}" style="width: 300px;" />
            </div>
            <div class="settings-row" style="margin-top: 10px;">
                <button class="btn-standard" onclick="testBuiltInProvider('${provider.id}')" id="${provider.id}-test-btn" style="background: #17a2b8; color: white; font-size: 12px; padding: 6px 14px;">
                    🧪 Test API
                </button>
                <span id="${provider.id}-test-status" style="margin-left: 10px; font-size: 12px;"></span>
            </div>
        `;
        
        container.appendChild(providerDiv);
    });
}

/**
 * Make a provider the default (move to first position)
 */
window.makeDefaultProvider = function(providerId) {
    Logger.info(`Making ${providerId} the default AI provider`);
    
    // Find the provider and move it to first position
    const providerIndex = currentAiOrder.findIndex(p => p.id === providerId);
    if (providerIndex === -1 || providerIndex === 0) return;
    
    // Get current values before reordering
    const currentValues = {};
    currentAiOrder.forEach(p => {
        currentValues[p.id] = {
            model: document.getElementById(`${p.id}-model`)?.value || p.models[0].id,
            apiKey: document.getElementById(`${p.id}-api-key`)?.value || '',
            apiUrl: document.getElementById(`${p.id}-api-url`)?.value || ''
        };
    });
    
    // Move provider to first position
    const [provider] = currentAiOrder.splice(providerIndex, 1);
    currentAiOrder.unshift(provider);
    
    // Re-render
    renderAiProviders();
    
    // Restore values
    currentAiOrder.forEach(p => {
        const modelSelect = document.getElementById(`${p.id}-model`);
        const keyInput = document.getElementById(`${p.id}-api-key`);
        const urlInput = document.getElementById(`${p.id}-api-url`);
        if (modelSelect) modelSelect.value = currentValues[p.id].model;
        if (keyInput) keyInput.value = currentValues[p.id].apiKey;
        if (urlInput) urlInput.value = currentValues[p.id].apiUrl;
    });
    
    showToast(`${provider.name} is now the default AI provider`, 'success');
};

/**
 * Open settings modal
 */
export function openSettingsModal() {
    Logger.info('Opening settings modal');
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.style.display = 'block';
        renderClusterList();
        renderAiProviders();
    }
}

/**
 * Close settings modal
 */
export function closeSettingsModal() {
    Logger.info('Closing settings modal');
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Render cluster configuration in settings modal
 */
function renderClusterList() {
    const container = document.getElementById('cluster-list');
    if (!container) return;
    
    const cluster = getCurrentCluster();
    const clusterTypes = getClusterTypes();
    
    if (!cluster) {
        container.innerHTML = '<p>No cluster configured</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="cluster-item active">
            <div class="cluster-field">
                <label>Cluster Name:</label>
                <input type="text" 
                       id="cluster-name"
                       value="${cluster.name}" 
                       onchange="updateClusterField('name', this.value)">
            </div>
            
            <div class="cluster-field">
                <label>Type:</label>
                <select id="cluster-type" onchange="updateClusterType(this.value)">
                    ${clusterTypes.map(type => 
                        `<option value="${type}" ${cluster.type === type ? 'selected' : ''}>${type}</option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="cluster-field">
                <label>URL:</label>
                <input type="text" 
                       id="cluster-url"
                       value="${cluster.url}" 
                       placeholder="localhost or hostname"
                       onchange="updateClusterField('url', this.value)">
            </div>
            
            <div class="cluster-field">
                <label>Username:</label>
                <input type="text" 
                       id="cluster-username"
                       value="${cluster.username}" 
                       onchange="updateClusterField('username', this.value)">
            </div>
            
            <div class="cluster-field">
                <label>Password:</label>
                <input type="password" 
                       id="cluster-password"
                       value="${cluster.password}" 
                       placeholder="Enter password"
                       onchange="updateClusterField('password', this.value)">
            </div>
            
            <div class="cluster-actions">
                <button class="btn-standard" onclick="testClusterConnection()">
                    Test Connection
                </button>
            </div>
        </div>
    `;
}

/**
 * Update cluster type and auto-fill URL template
 */
window.updateClusterType = async function(type) {
    Logger.debug(`Updating cluster type to: ${type}`);
    const config = await loadConfig();
    
    if (config.cluster) {
        config.cluster.type = type;
        
        // Auto-fill URL based on cluster type
        if (type === 'Self-Hosted') {
            config.cluster.url = 'http://localhost:8091';
        } else if (type === 'Capella (DBaaS)') {
            config.cluster.url = 'couchbases://cb.your-cluster.cloud.couchbase.com';
        }
        
        await saveConfig(config);
        
        // Refresh the UI to show updated URL
        document.getElementById('cluster-url').value = config.cluster.url;
    }
};

/**
 * Update cluster field value
 */
window.updateClusterField = async function(field, value) {
    Logger.debug(`Updating cluster field ${field}:`, value);
    const config = await loadConfig();
    if (config.cluster) {
        config.cluster[field] = value;
        await saveConfig(config);
    }
};

/**
 * Test cluster connection
 */
window.testClusterConnection = async function() {
    Logger.info('Testing connection');
    const result = await testConnection();
    
    if (result.success) {
        showToast('Connection successful!', 'success');
    } else {
        showToast(`Connection failed: ${result.error}`, 'error');
    }
};

/**
 * Save settings
 */
window.saveSettings = async function() {
    Logger.info('Saving settings');
    
    // Save bucket configuration
    const bucketName = document.getElementById('bucket-name')?.value;
    if (bucketName) {
        const config = await loadConfig();
        config.bucketConfig.bucket = bucketName;
        await saveConfig(config);
    }
    
    // Save user preferences to Couchbase if checkboxes are enabled
    const saveTimezone = document.getElementById('save-timezone')?.checked;
    const saveReportSettings = document.getElementById('save-report-settings')?.checked;
    
    if (saveTimezone || saveReportSettings) {
        await saveCurrentPreferences();
    }
    
    showToast('Settings saved!', 'success');
    closeSettingsModal();
};

/**
 * Test connection (for current cluster)
 */
window.testConnection = async function() {
    Logger.info('Testing connection for current cluster');
    const result = await testConnection();
    
    if (result.success) {
        showToast('Connection successful!', 'success');
    } else {
        showToast(`Connection failed: ${result.error}`, 'error');
    }
};

/**
 * Helper: Show toast notification
 */
function showToast(message, type = 'info') {
    // Use existing toast system if available
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
    } else {
        alert(message);
    }
}

/**
 * Save current user preferences to Couchbase
 */
async function saveCurrentPreferences() {
    const saveTimezone = document.getElementById('save-timezone')?.checked;
    const saveReportSettings = document.getElementById('save-report-settings')?.checked;
    
    const preferences = {
        docType: 'config',
        connected: new Date().toISOString()  // ISO-8601 timestamp
    };
    
    // Save cluster configuration (excluding sensitive credentials)
    const cluster = getCurrentCluster();
    if (cluster) {
        preferences.clusterInfo = {
            name: cluster.name,
            url: cluster.url,
            type: cluster.type,
            note: "Credentials managed locally via config.json"
        };
    }
    
    // Save timezone if enabled
    if (saveTimezone && typeof window.currentTimezone !== 'undefined') {
        preferences.timezone = window.currentTimezone;
    }
    
    // Save report settings if enabled
    if (saveReportSettings) {
        // Get all report checkboxes
        const reportCheckboxes = document.querySelectorAll('#report-maker input[type="checkbox"]');
        preferences.reportSettings = {};
        reportCheckboxes.forEach(cb => {
            preferences.reportSettings[cb.id] = cb.checked;
        });
    }
    
    // Load existing preferences to preserve values not in the form
    const existingPrefs = await loadUserPrefsFromCB('user_config');
    const existingAiApis = existingPrefs?.aiApis || [];
    const existingCustomApis = existingPrefs?.customAiApis || [];
    
    // Save custom AI APIs
    preferences.customAiApis = customAiApis.map(api => {
        // Find existing to preserve credentials if not re-entered
        const existing = existingCustomApis.find(a => a.id === api.id);
        
        const savedApi = { ...api };
        
        // Preserve credentials if not updated
        if (api.authType === 'bearer' && !api.bearerToken && existing?.bearerToken) {
            savedApi.bearerToken = existing.bearerToken;
        }
        if (api.authType === 'api-key-header' && !api.apiKeyHeaderValue && existing?.apiKeyHeaderValue) {
            savedApi.apiKeyHeaderValue = existing.apiKeyHeaderValue;
        }
        if (api.authType === 'basic') {
            if (!api.basicUsername && existing?.basicUsername) savedApi.basicUsername = existing.basicUsername;
            if (!api.basicPassword && existing?.basicPassword) savedApi.basicPassword = existing.basicPassword;
        }
        
        return savedApi;
    });
    
    // Save AI API credentials in order (first is default)
    preferences.aiApis = currentAiOrder.map(provider => {
        // Find existing config for this provider
        const existing = existingAiApis.find(api => api.id === provider.id);
        
        const selectedModel = document.getElementById(`${provider.id}-model`)?.value || existing?.model || provider.models[0].id;
        const apiKeyField = document.getElementById(`${provider.id}-api-key`)?.value;
        const apiUrlField = document.getElementById(`${provider.id}-api-url`)?.value;
        
        // Only update if field has value, otherwise keep existing (skip redaction markers)
        const existingKey = (existing?.apiKey && !existing.apiKey.startsWith('[REDACTED:')) ? existing.apiKey : '';
        const apiKey = apiKeyField || existingKey || '';
        const apiUrl = apiUrlField || existing?.apiUrl || provider.defaultUrl;
        
        return {
            id: provider.id,
            name: provider.name,
            logo: provider.logo,
            model: selectedModel,
            apiKey: apiKey,
            apiUrl: apiUrl
        };
    });
    
    Logger.info('Saving preferences to Couchbase:', preferences);
    // Use fixed key "user_config" for simple K/V lookup
    const result = await saveUserPreferences('user_config', preferences);
    
    if (result.success) {
        Logger.info('Preferences saved successfully to user_config');
        showToast('Settings saved to Couchbase!', 'success');
        
        // Update connection status to show connected
        if (preferences.cluster) {
            updateConnectionStatus('connected', preferences.cluster.name);
        }
        
        // Refresh AI provider dropdown in AI Analyzer tab
        if (typeof window.populateAIProviderDropdown === 'function') {
            Logger.info('Refreshing AI provider dropdown after settings save');
            window.populateAIProviderDropdown();
        }
    } else {
        Logger.error('Failed to save preferences:', result.error);
        showToast(`Failed to save: ${result.error}`, 'error');
    }
}

/**
 * Load user preferences from Couchbase
 */
async function loadUserPreferences() {
    Logger.info('Loading preferences from user_config document');
    
    // Use fixed key "user_config" for simple K/V lookup
    const preferences = await loadUserPrefsFromCB('user_config');
    
    if (preferences) {
        Logger.info('Loaded preferences:', preferences);
        
        // Verify docType
        if (preferences.docType !== 'config') {
            Logger.warn('Invalid document type, expected "config"');
            return;
        }
        
        // Restore cluster connection info only (not credentials)
        if (preferences.clusterInfo) {
            Logger.info('Cluster info from user_config:', preferences.clusterInfo);
            // We do NOT overwrite the local config credentials here
            // Just update the UI connection status
            updateConnectionStatus('connected', preferences.clusterInfo.name);
        }
        
        // Apply timezone if available
        if (preferences.timezone) {
            Logger.info(`Applying saved timezone: ${preferences.timezone}`);
            
            // Set global timezone
            window.currentTimezone = preferences.timezone;
            
            // Set dropdown value (note: ID is 'timezone-selector' not 'timezone-select')
            const timezoneSelect = document.getElementById('timezone-selector');
            if (timezoneSelect) {
                timezoneSelect.value = preferences.timezone;
                Logger.debug('Timezone selector updated to:', preferences.timezone);
            }
            
            // Mark as user-picked so it's used in parsing
            window.timeZoneUserPicked = true;
        }
        
        // Apply report settings if available
        if (preferences.reportSettings) {
            Object.keys(preferences.reportSettings).forEach(checkboxId => {
                const checkbox = document.getElementById(checkboxId);
                if (checkbox) {
                    checkbox.checked = preferences.reportSettings[checkboxId];
                }
            });
        }
        
        // Restore AI API credentials and order
        if (preferences.aiApis && Array.isArray(preferences.aiApis)) {
            Logger.info('Restoring AI API credentials and order');
            
            // Rebuild currentAiOrder based on saved order
            const savedOrder = [];
            const usedIds = new Set();
            
            // First, add providers in saved order
            preferences.aiApis.forEach(savedProvider => {
                const providerDef = AI_PROVIDERS.find(p => p.id === savedProvider.id);
                if (providerDef) {
                    savedOrder.push(providerDef);
                    usedIds.add(savedProvider.id);
                }
            });
            
            // Add any missing providers at the end (in case new providers were added)
            AI_PROVIDERS.forEach(p => {
                if (!usedIds.has(p.id)) {
                    savedOrder.push(p);
                }
            });
            
            currentAiOrder = savedOrder;
            
            // Render with new order
            renderAiProviders();
            
            // Restore values
            preferences.aiApis.forEach(savedProvider => {
                const modelSelect = document.getElementById(`${savedProvider.id}-model`);
                const keyInput = document.getElementById(`${savedProvider.id}-api-key`);
                const urlInput = document.getElementById(`${savedProvider.id}-api-url`);
                
                // Restore model selection
                if (modelSelect && savedProvider.model) {
                    modelSelect.value = savedProvider.model;
                }
                
                // Only populate if value exists and not a redaction marker
                if (keyInput && savedProvider.apiKey && !savedProvider.apiKey.startsWith('[REDACTED:')) {
                    keyInput.value = savedProvider.apiKey;
                }
                if (urlInput && savedProvider.apiUrl) {
                    urlInput.value = savedProvider.apiUrl;
                }
            });
        }
        
        // Restore custom AI APIs
        if (preferences.customAiApis && Array.isArray(preferences.customAiApis)) {
            Logger.info(`Restoring ${preferences.customAiApis.length} custom AI APIs`);
            customAiApis = preferences.customAiApis;
            renderCustomAiList();
        }
        
        return true;
    } else {
        Logger.debug('No user_config document found, using defaults');
        return false;
    }
}

/**
 * Helper to update connection status in UI
 */
function updateConnectionStatus(status, text) {
    const statusEl = document.getElementById('connection-status');
    const dotEl = statusEl?.querySelector('.status-dot');
    const textEl = statusEl?.querySelector('.status-text');
    
    if (!statusEl || !dotEl || !textEl) return;
    
    dotEl.classList.remove('status-connected', 'status-disconnected', 'status-error');
    dotEl.classList.add(`status-${status}`);
    textEl.textContent = text;
}

// Setup modal close handlers and load preferences
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;
    
    // Initialize jQuery UI tabs for settings modal
    const settingsTabs = $('#settings-tabs');
    if (settingsTabs.length) {
        settingsTabs.tabs();
        Logger.info('Settings tabs initialized');
    }
    
    // Close on X button
    const closeBtn = modal.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeSettingsModal);
    }
    
    // Close on outside click
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeSettingsModal();
        }
    });
    
    // Auto-save timezone when changed
    const timezoneSelector = document.getElementById('timezone-selector');
    if (timezoneSelector) {
        timezoneSelector.addEventListener('change', () => {
            Logger.info('Timezone changed, auto-saving to Couchbase...');
            setTimeout(() => {
                saveCurrentPreferences().catch(err => {
                    Logger.error('Failed to auto-save timezone:', err);
                });
            }, 500); // Small delay to ensure currentTimezone is set
        });
    }
    
    // Load user preferences from Couchbase on page load
    setTimeout(async () => {
        const loaded = await loadUserPreferences().catch(err => {
            Logger.debug('No saved preferences found or error loading:', err);
            return false;
        });
        
        // If we loaded preferences with a timezone, trigger the timezone change
        if (loaded && window.currentTimezone) {
            Logger.info('Triggering timezone change handler for loaded timezone:', window.currentTimezone);
            // Set the flag as if user picked it
            window.timeZoneUserPicked = true;
            
            // Trigger the change event to ensure all handlers are called
            const tzSelector = document.getElementById('timezone-selector');
            if (tzSelector && typeof window.handleTimezoneChange === 'function') {
                window.handleTimezoneChange();
            }
        }
    }, 1000); // Wait 1 second for page to fully load
});

// ============================================
// Custom AI API Functions
// ============================================

/**
 * Open custom AI modal for adding a new API
 */
window.openCustomAIModal = function(customApiId = null) {
    editingCustomAiId = customApiId;
    const modal = document.getElementById('custom-ai-modal');
    const titleEl = document.getElementById('custom-ai-modal-title');
    
    if (!modal) return;
    
    // Clear form
    document.getElementById('custom-ai-name').value = '';
    document.getElementById('custom-ai-url').value = '';
    document.getElementById('custom-ai-model').value = '';
    document.getElementById('custom-ai-auth-type').value = 'none';
    document.getElementById('custom-ai-request-template').value = '';
    document.getElementById('custom-ai-response-path').value = 'choices[0].message.content';
    document.getElementById('custom-ai-headers-list').innerHTML = '';
    document.getElementById('custom-ai-auth-fields').innerHTML = '';
    
    if (customApiId) {
        // Editing existing
        titleEl.textContent = 'Edit Custom AI API';
        const existing = customAiApis.find(api => api.id === customApiId);
        if (existing) {
            document.getElementById('custom-ai-name').value = existing.name || '';
            document.getElementById('custom-ai-url').value = existing.url || '';
            document.getElementById('custom-ai-model').value = existing.model || '';
            document.getElementById('custom-ai-auth-type').value = existing.authType || 'none';
            document.getElementById('custom-ai-request-template').value = existing.requestTemplate || '';
            document.getElementById('custom-ai-response-path').value = existing.responsePath || 'choices[0].message.content';
            
            // Restore auth fields
            updateCustomAIAuthFields();
            if (existing.authType === 'bearer' && existing.bearerToken) {
                const tokenField = document.getElementById('custom-ai-bearer-token');
                if (tokenField) tokenField.value = existing.bearerToken;
            } else if (existing.authType === 'api-key-header') {
                const headerNameField = document.getElementById('custom-ai-api-key-header-name');
                const headerValueField = document.getElementById('custom-ai-api-key-header-value');
                if (headerNameField) headerNameField.value = existing.apiKeyHeaderName || 'X-API-Key';
                if (headerValueField) headerValueField.value = existing.apiKeyHeaderValue || '';
            } else if (existing.authType === 'basic') {
                const usernameField = document.getElementById('custom-ai-basic-username');
                const passwordField = document.getElementById('custom-ai-basic-password');
                if (usernameField) usernameField.value = existing.basicUsername || '';
                if (passwordField) passwordField.value = existing.basicPassword || '';
            } else if (existing.authType === 'digest') {
                const usernameField = document.getElementById('custom-ai-digest-username');
                const passwordField = document.getElementById('custom-ai-digest-password');
                if (usernameField) usernameField.value = existing.digestUsername || '';
                if (passwordField) passwordField.value = existing.digestPassword || '';
            }
            
            // Restore custom headers
            if (existing.customHeaders && Array.isArray(existing.customHeaders)) {
                existing.customHeaders.forEach(header => {
                    addCustomAIHeader(header.name, header.value);
                });
            }
        }
    } else {
        titleEl.textContent = 'Add Custom AI API';
        // Set default request template
        document.getElementById('custom-ai-request-template').value = `{
  "model": "{{MODEL}}",
  "messages": [
    {
      "role": "system",
      "content": "You are a Couchbase query performance analyst. Analyze the provided query data and return a JSON response with analysis_summary, critical_issues, and recommendations."
    },
    {
      "role": "user",
      "content": "{{PAYLOAD}}"
    }
  ],
  "max_tokens": 4096
}`;
    }
    
    modal.style.display = 'block';
};

/**
 * Close custom AI modal
 */
window.closeCustomAIModal = function() {
    const modal = document.getElementById('custom-ai-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    editingCustomAiId = null;
};

/**
 * Update auth fields based on selected auth type
 */
window.updateCustomAIAuthFields = function() {
    const authType = document.getElementById('custom-ai-auth-type').value;
    const container = document.getElementById('custom-ai-auth-fields');
    
    if (!container) return;
    
    switch (authType) {
        case 'bearer':
            container.innerHTML = `
                <div class="settings-row">
                    <label>Bearer Token:</label>
                    <input type="password" id="custom-ai-bearer-token" placeholder="Your API token" style="width: 350px;" />
                </div>
            `;
            break;
        case 'api-key-header':
            container.innerHTML = `
                <div class="settings-row">
                    <label>Header Name:</label>
                    <input type="text" id="custom-ai-api-key-header-name" value="X-API-Key" style="width: 200px;" />
                </div>
                <div class="settings-row">
                    <label>API Key Value:</label>
                    <input type="password" id="custom-ai-api-key-header-value" placeholder="Your API key" style="width: 350px;" />
                </div>
            `;
            break;
        case 'basic':
            container.innerHTML = `
                <div class="settings-row">
                    <label>Username:</label>
                    <input type="text" id="custom-ai-basic-username" style="width: 200px;" />
                </div>
                <div class="settings-row">
                    <label>Password:</label>
                    <input type="password" id="custom-ai-basic-password" style="width: 200px;" />
                </div>
            `;
            break;
        case 'digest':
            container.innerHTML = `
                <div class="settings-row">
                    <label>Username:</label>
                    <input type="text" id="custom-ai-digest-username" style="width: 200px;" />
                </div>
                <div class="settings-row">
                    <label>Password:</label>
                    <input type="password" id="custom-ai-digest-password" style="width: 200px;" />
                </div>
                <p style="color: #666; font-size: 0.85em; margin-top: 8px;">
                    Digest authentication is handled server-side via the Flask backend.
                </p>
            `;
            break;
        default:
            container.innerHTML = '<p style="color: #666; font-size: 0.85em;">No authentication required</p>';
    }
};

/**
 * Add a custom header row
 */
window.addCustomAIHeader = function(name = '', value = '') {
    const container = document.getElementById('custom-ai-headers-list');
    if (!container) return;
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'custom-header-row';
    headerDiv.style.cssText = 'display: flex; gap: 8px; margin-bottom: 8px; align-items: center;';
    
    headerDiv.innerHTML = `
        <input type="text" class="header-name" placeholder="Header Name" value="${name}" style="width: 150px; padding: 6px; border: 1px solid #ccc; border-radius: 4px;" />
        <input type="text" class="header-value" placeholder="Header Value" value="${value}" style="flex: 1; padding: 6px; border: 1px solid #ccc; border-radius: 4px;" />
        <button type="button" onclick="this.parentElement.remove()" style="background: #dc3545; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;">✕</button>
    `;
    
    container.appendChild(headerDiv);
};

/**
 * Get custom headers from form
 */
function getCustomHeaders() {
    const container = document.getElementById('custom-ai-headers-list');
    if (!container) return [];
    
    const headers = [];
    container.querySelectorAll('.custom-header-row').forEach(row => {
        const name = row.querySelector('.header-name')?.value?.trim();
        const value = row.querySelector('.header-value')?.value?.trim();
        if (name && value) {
            headers.push({ name, value });
        }
    });
    
    return headers;
}

/**
 * Save custom AI API
 */
window.saveCustomAI = async function() {
    const name = document.getElementById('custom-ai-name')?.value?.trim();
    const url = document.getElementById('custom-ai-url')?.value?.trim();
    const model = document.getElementById('custom-ai-model')?.value?.trim();
    const authType = document.getElementById('custom-ai-auth-type')?.value;
    const requestTemplate = document.getElementById('custom-ai-request-template')?.value?.trim();
    const responsePath = document.getElementById('custom-ai-response-path')?.value?.trim();
    
    // Validation
    if (!name) {
        showToast('API Name is required', 'error');
        return;
    }
    if (!url) {
        showToast('API URL is required', 'error');
        return;
    }
    
    // Validate URL format
    try {
        new URL(url);
    } catch (e) {
        showToast('Invalid URL format', 'error');
        return;
    }
    
    // Validate request template is valid JSON (with placeholders replaced)
    if (requestTemplate) {
        try {
            const testJson = requestTemplate
                .replace(/\{\{PAYLOAD\}\}/g, '"test"')
                .replace(/\{\{MODEL\}\}/g, '"test-model"');
            JSON.parse(testJson);
        } catch (e) {
            showToast('Invalid JSON in request template: ' + e.message, 'error');
            return;
        }
    }
    
    // Build custom API config
    const customApi = {
        id: editingCustomAiId || `custom_${Date.now()}`,
        name,
        url,
        model: model || 'default',
        authType,
        requestTemplate: requestTemplate || '',
        responsePath: responsePath || 'choices[0].message.content',
        customHeaders: getCustomHeaders(),
        isCustom: true
    };
    
    // Add auth-specific fields
    if (authType === 'bearer') {
        customApi.bearerToken = document.getElementById('custom-ai-bearer-token')?.value || '';
    } else if (authType === 'api-key-header') {
        customApi.apiKeyHeaderName = document.getElementById('custom-ai-api-key-header-name')?.value || 'X-API-Key';
        customApi.apiKeyHeaderValue = document.getElementById('custom-ai-api-key-header-value')?.value || '';
    } else if (authType === 'basic') {
        customApi.basicUsername = document.getElementById('custom-ai-basic-username')?.value || '';
        customApi.basicPassword = document.getElementById('custom-ai-basic-password')?.value || '';
    } else if (authType === 'digest') {
        customApi.digestUsername = document.getElementById('custom-ai-digest-username')?.value || '';
        customApi.digestPassword = document.getElementById('custom-ai-digest-password')?.value || '';
    }
    
    // Add or update in customAiApis array
    if (editingCustomAiId) {
        const index = customAiApis.findIndex(api => api.id === editingCustomAiId);
        if (index !== -1) {
            customAiApis[index] = customApi;
        } else {
            customAiApis.push(customApi);
        }
    } else {
        customAiApis.push(customApi);
    }
    
    // Render the list
    renderCustomAiList();
    
    // Close modal
    closeCustomAIModal();
    
    // Save to Couchbase
    await saveCurrentPreferences();
    
    showToast(`Custom API "${name}" saved successfully!`, 'success');
    
    // Refresh AI provider dropdown
    if (typeof window.populateAIProviderDropdown === 'function') {
        window.populateAIProviderDropdown();
    }
};

/**
 * Render the list of custom AI APIs
 */
function renderCustomAiList() {
    const container = document.getElementById('custom-ai-list');
    if (!container) return;
    
    if (customAiApis.length === 0) {
        container.innerHTML = '<p style="color: #999; font-style: italic;">No custom APIs configured</p>';
        return;
    }
    
    container.innerHTML = customAiApis.map(api => `
        <div class="custom-ai-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f8f9fa; border-radius: 6px; margin-bottom: 8px; border: 1px solid #e9ecef;">
            <div>
                <strong style="color: #333;">${api.name}</strong>
                <div style="font-size: 0.85em; color: #666; margin-top: 4px;">
                    ${api.url}
                    ${api.model ? `• Model: ${api.model}` : ''}
                </div>
            </div>
            <div style="display: flex; gap: 8px;">
                <button class="btn-standard" onclick="openCustomAIModal('${api.id}')" style="font-size: 12px; padding: 4px 10px;">
                    ✏️ Edit
                </button>
                <button class="btn-standard" onclick="deleteCustomAI('${api.id}')" style="font-size: 12px; padding: 4px 10px; background: #dc3545; color: white;">
                    🗑️ Delete
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Delete a custom AI API
 */
window.deleteCustomAI = async function(apiId) {
    const api = customAiApis.find(a => a.id === apiId);
    if (!api) return;
    
    if (!confirm(`Are you sure you want to delete "${api.name}"?`)) {
        return;
    }
    
    customAiApis = customAiApis.filter(a => a.id !== apiId);
    renderCustomAiList();
    
    // Save to Couchbase
    await saveCurrentPreferences();
    
    showToast(`Custom API "${api.name}" deleted`, 'success');
    
    // Refresh AI provider dropdown
    if (typeof window.populateAIProviderDropdown === 'function') {
        window.populateAIProviderDropdown();
    }
};

/**
 * Test a built-in AI provider (OpenAI, Claude, Grok)
 */
window.testBuiltInProvider = async function(providerId) {
    const modelSelect = document.getElementById(`${providerId}-model`);
    const apiKeyInput = document.getElementById(`${providerId}-api-key`);
    const apiUrlInput = document.getElementById(`${providerId}-api-url`);
    const testBtn = document.getElementById(`${providerId}-test-btn`);
    const statusSpan = document.getElementById(`${providerId}-test-status`);
    
    const model = modelSelect?.value || '';
    const apiKey = apiKeyInput?.value?.trim() || '';
    const apiUrl = apiUrlInput?.value?.trim() || '';
    
    if (!apiKey) {
        showToast(`Please enter an API key for ${providerId.toUpperCase()} first`, 'error');
        statusSpan.innerHTML = '<span style="color: #dc3545;">❌ Missing API key</span>';
        return;
    }
    
    // Update UI for loading state
    testBtn.disabled = true;
    testBtn.innerHTML = '⏳ Testing...';
    statusSpan.innerHTML = '<span style="color: #6c757d;">Testing connection...</span>';
    
    Logger.info(`Testing ${providerId} API with model: ${model}`);
    
    try {
        const response = await fetch('/api/ai/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                provider: providerId,
                model: model,
                apiKey: apiKey,
                apiUrl: apiUrl
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            Logger.info(`${providerId} API test successful:`, result);
            statusSpan.innerHTML = `<span style="color: #28a745;">✅ Success (${result.elapsed_ms}ms)</span>`;
            showToast(`${providerId.toUpperCase()} API test successful! Response in ${result.elapsed_ms}ms`, 'success');
        } else {
            Logger.error(`${providerId} API test failed:`, result);
            statusSpan.innerHTML = `<span style="color: #dc3545;">❌ Failed: ${result.error?.substring(0, 50) || 'Unknown error'}</span>`;
            showToast(`${providerId.toUpperCase()} API test failed: ${result.error}`, 'error');
        }
    } catch (error) {
        Logger.error(`${providerId} API test error:`, error);
        statusSpan.innerHTML = `<span style="color: #dc3545;">❌ Error: ${error.message}</span>`;
        showToast(`Test failed: ${error.message}`, 'error');
    } finally {
        testBtn.disabled = false;
        testBtn.innerHTML = '🧪 Test API';
    }
};

/**
 * Test custom AI configuration
 * Makes a real API call through the backend to verify configuration works
 */
window.testCustomAIConfig = async function() {
    const name = document.getElementById('custom-ai-name')?.value?.trim() || 'Custom API';
    const url = document.getElementById('custom-ai-url')?.value?.trim();
    const model = document.getElementById('custom-ai-model')?.value?.trim() || 'default';
    const authType = document.getElementById('custom-ai-auth-type')?.value;
    const requestTemplate = document.getElementById('custom-ai-request-template')?.value?.trim();
    const responsePath = document.getElementById('custom-ai-response-path')?.value?.trim();
    
    if (!url) {
        showToast('Please enter an API URL first', 'error');
        return;
    }
    
    // Build custom config object
    const customConfig = {
        name: name,
        url: url,
        model: model,
        authType: authType,
        requestTemplate: requestTemplate || '',
        responsePath: responsePath || 'choices[0].message.content',
        customHeaders: getCustomHeaders(),
        isCustom: true
    };
    
    // Add auth-specific fields
    if (authType === 'bearer') {
        customConfig.bearerToken = document.getElementById('custom-ai-bearer-token')?.value || '';
    } else if (authType === 'api-key-header') {
        customConfig.apiKeyHeaderName = document.getElementById('custom-ai-api-key-header-name')?.value || 'X-API-Key';
        customConfig.apiKeyHeaderValue = document.getElementById('custom-ai-api-key-header-value')?.value || '';
    } else if (authType === 'basic') {
        customConfig.basicUsername = document.getElementById('custom-ai-basic-username')?.value || '';
        customConfig.basicPassword = document.getElementById('custom-ai-basic-password')?.value || '';
    } else if (authType === 'digest') {
        customConfig.digestUsername = document.getElementById('custom-ai-digest-username')?.value || '';
        customConfig.digestPassword = document.getElementById('custom-ai-digest-password')?.value || '';
    }
    
    // Get UI elements
    const testBtn = document.getElementById('custom-ai-test-btn');
    const statusSpan = document.getElementById('custom-ai-test-status');
    
    if (testBtn) {
        testBtn.disabled = true;
        testBtn.innerHTML = '⏳ Testing...';
    }
    if (statusSpan) {
        statusSpan.innerHTML = '<span style="color: #6c757d;">Testing connection...</span>';
    }
    
    showToast('Testing custom API configuration...', 'info');
    Logger.info('Testing custom AI configuration:', { name, url, model, authType });
    
    try {
        const response = await fetch('/api/ai/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                provider: 'custom',
                customConfig: customConfig
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            Logger.info('Custom API test successful:', result);
            if (statusSpan) {
                statusSpan.innerHTML = `<span style="color: #28a745;">✅ Success (${result.elapsed_ms}ms)</span>`;
            }
            showToast(`✅ API test successful! Response in ${result.elapsed_ms}ms`, 'success');
            
            // Show response preview
            if (result.model_response) {
                const preview = result.model_response.substring(0, 200);
                Logger.debug('AI Response preview:', preview);
            }
        } else {
            Logger.error('Custom API test failed:', result);
            let errorMsg = result.error || 'Unknown error';
            if (result.status_code) {
                errorMsg = `HTTP ${result.status_code}: ${errorMsg}`;
            }
            if (statusSpan) {
                statusSpan.innerHTML = `<span style="color: #dc3545;">❌ ${errorMsg.substring(0, 50)}</span>`;
            }
            showToast(`❌ API test failed: ${errorMsg}`, 'error');
            
            // Show more details for debugging
            if (result.raw_response) {
                Logger.debug('Raw API response:', result.raw_response);
            }
        }
    } catch (error) {
        Logger.error('Custom API test error:', error);
        if (statusSpan) {
            statusSpan.innerHTML = `<span style="color: #dc3545;">❌ ${error.message}</span>`;
        }
        showToast(`Test failed: ${error.message}. Make sure the Flask server is running on port 5555.`, 'error');
    } finally {
        if (testBtn) {
            testBtn.disabled = false;
            testBtn.innerHTML = '🧪 Test Configuration';
        }
    }
};

/**
 * Get all custom AI APIs (for use by other modules)
 */
export function getCustomAiApis() {
    return [...customAiApis];
}

/**
 * Set custom AI APIs (for loading from preferences)
 */
export function setCustomAiApis(apis) {
    customAiApis = apis || [];
    renderCustomAiList();
}

/**
 * Generate cURL preview from current form values
 */
window.generateCurlPreview = function() {
    const url = document.getElementById('custom-ai-url')?.value?.trim() || 'https://api.example.com/v1/chat/completions';
    const model = document.getElementById('custom-ai-model')?.value?.trim() || 'model-name';
    const authType = document.getElementById('custom-ai-auth-type')?.value || 'none';
    const requestTemplate = document.getElementById('custom-ai-request-template')?.value?.trim();
    
    // Build cURL command
    let curl = 'curl -X POST \\\n';
    curl += `  "${url}" \\\n`;
    
    // Content-Type header
    curl += `  -H "Content-Type: application/json" \\\n`;
    
    // Auth headers
    if (authType === 'bearer') {
        const token = document.getElementById('custom-ai-bearer-token')?.value || 'YOUR_API_TOKEN';
        curl += `  -H "Authorization: Bearer ${token}" \\\n`;
    } else if (authType === 'api-key-header') {
        const headerName = document.getElementById('custom-ai-api-key-header-name')?.value || 'X-API-Key';
        const headerValue = document.getElementById('custom-ai-api-key-header-value')?.value || 'YOUR_API_KEY';
        curl += `  -H "${headerName}: ${headerValue}" \\\n`;
    } else if (authType === 'basic') {
        const username = document.getElementById('custom-ai-basic-username')?.value || 'username';
        const password = document.getElementById('custom-ai-basic-password')?.value || 'password';
        curl += `  -u "${username}:${password}" \\\n`;
    } else if (authType === 'digest') {
        const username = document.getElementById('custom-ai-digest-username')?.value || 'username';
        const password = document.getElementById('custom-ai-digest-password')?.value || 'password';
        curl += `  --digest -u "${username}:${password}" \\\n`;
    }
    
    // Custom headers
    getCustomHeaders().forEach(h => {
        curl += `  -H "${h.name}: ${h.value}" \\\n`;
    });
    
    // Request body
    let bodyJson;
    if (requestTemplate) {
        // Replace placeholders with example values
        let body = requestTemplate
            .replace(/\{\{MODEL\}\}/g, model)
            .replace(/\{\{PAYLOAD\}\}/g, 'Your analysis prompt and query data will be inserted here...');
        
        try {
            // Pretty-print the JSON
            bodyJson = JSON.stringify(JSON.parse(body), null, 2);
        } catch (e) {
            bodyJson = body;
        }
    } else {
        // Default request body
        bodyJson = JSON.stringify({
            model: model,
            messages: [
                { role: "system", content: "You are a Couchbase query performance analyst." },
                { role: "user", content: "Your analysis prompt and query data will be inserted here..." }
            ],
            max_tokens: 4096
        }, null, 2);
    }
    
    // Escape single quotes in JSON for shell and add to curl
    const escapedBody = bodyJson.replace(/'/g, "'\\''");
    curl += `  -d '${escapedBody}'`;
    
    // Set the textarea value
    const previewEl = document.getElementById('custom-ai-curl-preview');
    if (previewEl) {
        previewEl.value = curl;
    }
    
    showToast('cURL command generated', 'success');
};

/**
 * Copy cURL preview to clipboard
 */
window.copyCurlPreview = function() {
    const previewEl = document.getElementById('custom-ai-curl-preview');
    if (!previewEl || !previewEl.value) {
        showToast('Generate cURL first', 'warning');
        return;
    }
    
    navigator.clipboard.writeText(previewEl.value).then(() => {
        showToast('cURL copied to clipboard', 'success');
    }).catch(err => {
        showToast('Failed to copy: ' + err, 'error');
    });
};

// Export functions to window for onclick handlers
window.openSettingsModal = openSettingsModal;
window.closeSettingsModal = closeSettingsModal;

// ============================================
// AI Admin Functions
// ============================================

/**
 * Get current cluster config for API calls
 */
async function getClusterConfigForAPI() {
    const config = await loadConfig();
    return {
        config: {
            url: config.cluster?.url || 'http://localhost:8091',
            username: config.cluster?.username || '',
            password: config.cluster?.password || ''
        },
        bucketConfig: {
            bucket: config.bucketConfig?.bucket || 'cb_tools'
        }
    };
}

/**
 * Seed payload reference to Couchbase
 */
window.seedPayloadReference = async function(force = false) {
    const statusEl = document.getElementById('payload-ref-status');
    statusEl.innerHTML = '<span style="color: #666;">⏳ Seeding...</span>';
    
    try {
        const clusterConfig = await getClusterConfigForAPI();
        
        const response = await fetch('/api/ai/payload-reference/seed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...clusterConfig,
                force: force
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            const actionText = result.action === 'created' ? '✅ Created' : 
                              result.action === 'overwritten' ? '🔄 Refreshed' : 
                              'ℹ️ Already exists';
            statusEl.innerHTML = `<span style="color: #28a745;">${actionText} in cb_tools._default._default</span>`;
            showToast(`Payload reference ${result.action}`, 'success');
        } else {
            statusEl.innerHTML = `<span style="color: #dc3545;">❌ ${result.error}</span>`;
            showToast(result.error, 'error');
        }
    } catch (error) {
        statusEl.innerHTML = `<span style="color: #dc3545;">❌ ${error.message}</span>`;
        showToast('Failed to seed: ' + error.message, 'error');
    }
};

/**
 * View current payload reference
 */
window.viewPayloadReference = async function() {
    const statusEl = document.getElementById('payload-ref-status');
    statusEl.innerHTML = '<span style="color: #666;">⏳ Loading...</span>';
    
    try {
        const clusterConfig = await getClusterConfigForAPI();
        
        const response = await fetch('/api/ai/payload-reference/load', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clusterConfig)
        });
        
        const result = await response.json();
        
        if (result.success) {
            statusEl.innerHTML = `<span style="color: #28a745;">✅ Loaded from ${result.source}</span>`;
            
            // Show in a modal or alert
            const jsonStr = JSON.stringify(result.payload_reference, null, 2);
            showJsonViewerModal('Payload Reference', jsonStr, result.source);
        } else {
            statusEl.innerHTML = `<span style="color: #dc3545;">❌ ${result.error}</span>`;
        }
    } catch (error) {
        statusEl.innerHTML = `<span style="color: #dc3545;">❌ ${error.message}</span>`;
    }
};

/**
 * Seed AI models list to Couchbase
 */
window.seedAIModels = async function(force = false) {
    const statusEl = document.getElementById('ai-models-status');
    statusEl.innerHTML = '<span style="color: #666;">⏳ Seeding...</span>';
    
    try {
        const clusterConfig = await getClusterConfigForAPI();
        
        const response = await fetch('/api/ai/models/seed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...clusterConfig,
                force: force
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            const actionText = result.action === 'created' ? '✅ Created' : 
                              result.action === 'overwritten' ? '🔄 Refreshed' : 
                              'ℹ️ Already exists';
            const modelCount = Object.values(result.models?.providers || {})
                .reduce((sum, p) => sum + (p.models?.length || 0), 0);
            statusEl.innerHTML = `<span style="color: #28a745;">${actionText} (${modelCount} models)</span>`;
            showToast(`AI models list ${result.action}`, 'success');
        } else {
            statusEl.innerHTML = `<span style="color: #dc3545;">❌ ${result.error}</span>`;
            showToast(result.error, 'error');
        }
    } catch (error) {
        statusEl.innerHTML = `<span style="color: #dc3545;">❌ ${error.message}</span>`;
        showToast('Failed to seed: ' + error.message, 'error');
    }
};

/**
 * View current AI models list
 */
window.viewAIModels = async function() {
    const statusEl = document.getElementById('ai-models-status');
    statusEl.innerHTML = '<span style="color: #666;">⏳ Loading...</span>';
    
    try {
        const clusterConfig = await getClusterConfigForAPI();
        
        const response = await fetch('/api/ai/models/load', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clusterConfig)
        });
        
        const result = await response.json();
        
        if (result.success) {
            const modelCount = Object.values(result.models?.providers || {})
                .reduce((sum, p) => sum + (p.models?.length || 0), 0);
            statusEl.innerHTML = `<span style="color: #28a745;">✅ Loaded ${modelCount} models from ${result.source}</span>`;
            
            const jsonStr = JSON.stringify(result.models, null, 2);
            showJsonViewerModal('AI Models List', jsonStr, result.source);
        } else {
            statusEl.innerHTML = `<span style="color: #dc3545;">❌ ${result.error}</span>`;
        }
    } catch (error) {
        statusEl.innerHTML = `<span style="color: #dc3545;">❌ ${error.message}</span>`;
    }
};

/**
 * Open add model form
 */
window.openAddModelModal = function() {
    const section = document.getElementById('add-model-section');
    if (section) {
        section.style.display = 'block';
        document.getElementById('new-model-id').value = '';
        document.getElementById('new-model-name').value = '';
        document.getElementById('new-model-context').value = '';
        document.getElementById('new-model-output').value = '';
    }
};

/**
 * Close add model form
 */
window.closeAddModelModal = function() {
    const section = document.getElementById('add-model-section');
    if (section) {
        section.style.display = 'none';
    }
};

/**
 * Save new model to AI models list
 */
window.saveNewModel = async function() {
    const provider = document.getElementById('new-model-provider').value;
    const modelId = document.getElementById('new-model-id').value.trim();
    const modelName = document.getElementById('new-model-name').value.trim();
    const contextWindow = parseInt(document.getElementById('new-model-context').value) || 128000;
    const maxOutput = parseInt(document.getElementById('new-model-output').value) || 16384;
    
    if (!modelId || !modelName) {
        showToast('Model ID and Name are required', 'error');
        return;
    }
    
    try {
        const clusterConfig = await getClusterConfigForAPI();
        
        // Load current models
        const loadResponse = await fetch('/api/ai/models/load', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clusterConfig)
        });
        
        const loadResult = await loadResponse.json();
        if (!loadResult.success) {
            showToast('Failed to load current models: ' + loadResult.error, 'error');
            return;
        }
        
        const modelsList = loadResult.models;
        
        // Add new model to provider
        if (!modelsList.providers[provider]) {
            showToast('Provider not found', 'error');
            return;
        }
        
        const newModel = {
            id: modelId,
            name: modelName,
            contextWindow: contextWindow,
            maxOutputTokens: maxOutput,
            tokensPerMinute: null,
            inputPricePerMillion: null,
            outputPricePerMillion: null,
            supportsVision: false,
            supportsTools: true,
            supportsJson: true,
            status: 'active',
            releaseDate: new Date().toISOString().split('T')[0],
            notes: 'Added manually via UI'
        };
        
        // Check if model already exists
        const existingIndex = modelsList.providers[provider].models.findIndex(m => m.id === modelId);
        if (existingIndex >= 0) {
            modelsList.providers[provider].models[existingIndex] = newModel;
            showToast('Model updated', 'success');
        } else {
            // Add to beginning of list
            modelsList.providers[provider].models.unshift(newModel);
            showToast('Model added', 'success');
        }
        
        // Save updated list
        const saveResponse = await fetch('/api/ai/models/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...clusterConfig,
                models: modelsList
            })
        });
        
        const saveResult = await saveResponse.json();
        if (saveResult.success) {
            closeAddModelModal();
            document.getElementById('ai-models-status').innerHTML = 
                `<span style="color: #28a745;">✅ Added ${modelId} to ${provider}</span>`;
        } else {
            showToast('Failed to save: ' + saveResult.error, 'error');
        }
        
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
};

/**
 * Invalidate all caches
 */
window.invalidateAllCaches = async function() {
    try {
        // Invalidate payload reference cache
        await fetch('/api/ai/payload-reference/invalidate-cache', { method: 'POST' });
        
        // Invalidate AI models cache
        await fetch('/api/ai/models/invalidate-cache', { method: 'POST' });
        
        showToast('All caches invalidated', 'success');
        
        document.getElementById('payload-ref-status').innerHTML = 
            '<span style="color: #666;">Cache cleared</span>';
        document.getElementById('ai-models-status').innerHTML = 
            '<span style="color: #666;">Cache cleared</span>';
            
    } catch (error) {
        showToast('Failed to invalidate caches: ' + error.message, 'error');
    }
};

/**
 * Show JSON viewer modal
 */
function showJsonViewerModal(title, jsonStr, source) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('json-viewer-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'json-viewer-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 900px; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column;">
                <span class="close" onclick="document.getElementById('json-viewer-modal').style.display='none'">&times;</span>
                <h2 id="json-viewer-title">JSON Viewer</h2>
                <p id="json-viewer-source" style="color: #666; font-size: 0.9em; margin-bottom: 10px;"></p>
                <div style="flex: 1; overflow: auto; background: #f8f9fa; border-radius: 4px; padding: 15px;">
                    <pre id="json-viewer-content" style="margin: 0; white-space: pre-wrap; font-family: monospace; font-size: 12px;"></pre>
                </div>
                <div style="margin-top: 15px; display: flex; gap: 10px;">
                    <button class="btn-standard" onclick="copyJsonViewer()">📋 Copy JSON</button>
                    <button class="btn-standard" onclick="document.getElementById('json-viewer-modal').style.display='none'">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    document.getElementById('json-viewer-title').textContent = title;
    document.getElementById('json-viewer-source').textContent = `Source: ${source}`;
    document.getElementById('json-viewer-content').textContent = jsonStr;
    modal.style.display = 'block';
}

/**
 * Copy JSON from viewer
 */
window.copyJsonViewer = function() {
    const content = document.getElementById('json-viewer-content')?.textContent;
    if (content) {
        navigator.clipboard.writeText(content).then(() => {
            showToast('JSON copied to clipboard', 'success');
        });
    }
};
