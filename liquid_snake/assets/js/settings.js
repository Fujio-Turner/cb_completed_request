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
 * Open settings modal
 */
export function openSettingsModal() {
    Logger.info('Opening settings modal');
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.style.display = 'block';
        renderClusterList();
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
                <select id="cluster-type" onchange="updateClusterField('type', this.value)">
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
    
    // Save cluster configuration
    const cluster = getCurrentCluster();
    if (cluster) {
        preferences.cluster = {
            name: cluster.name,
            url: cluster.url,
            username: cluster.username,
            password: cluster.password,  // TODO: Consider encryption
            type: cluster.type
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
    
    Logger.info('Saving preferences to Couchbase:', preferences);
    // Use fixed key "user_config" for simple K/V lookup
    const result = await saveUserPreferences('user_config', preferences);
    
    if (result.success) {
        Logger.info('Preferences saved successfully to user_config');
        showToast('Settings saved to Couchbase!', 'success');
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
        
        // Restore cluster configuration
        if (preferences.cluster) {
            Logger.info('Restoring cluster config from user_config');
            const config = await loadConfig();
            config.cluster = preferences.cluster;
            await saveConfig(config);
            
            // Update connection status
            const connectedDate = new Date(preferences.connected);
            updateConnectionStatus('connected', `Last saved: ${connectedDate.toLocaleString()}`);
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
