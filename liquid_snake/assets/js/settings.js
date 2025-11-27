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
            { id: 'claude-opus-4', name: 'Claude Opus 4.5 (Most Capable) - 200K ctx, 30K TPM' },
            { id: 'claude-sonnet-4', name: 'Claude Sonnet 4.5 (Balanced) - 200K ctx, 30K TPM' },
            { id: 'claude-haiku-4', name: 'Claude Haiku 4.x (Fast) - 200K ctx, 50K TPM' },
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

// Export functions to window for onclick handlers
window.openSettingsModal = openSettingsModal;
window.closeSettingsModal = closeSettingsModal;
