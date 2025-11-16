/**
 * Couchbase Connector Module (Issue #231)
 * Handles connection to Couchbase clusters via Python server API
 * 
 * All requests go through Python server endpoints:
 * - POST /api/couchbase/test
 * - POST /api/couchbase/query
 * - POST /api/couchbase/save-analyzer
 * - POST /api/couchbase/save-preferences
 * - GET /api/couchbase/load-analyzer/<id>
 * - GET /api/couchbase/load-preferences/<id>
 */

import { Logger } from './base.js';

// Global config object
let clusterConfig = null;

/**
 * Load cluster configuration from config.json
 */
export async function loadConfig() {
    try {
        const response = await fetch('config.json');
        if (!response.ok) {
            throw new Error(`Failed to load config: ${response.statusText}`);
        }
        clusterConfig = await response.json();
        Logger.info('Loaded cluster configuration', clusterConfig);
        return clusterConfig;
    } catch (error) {
        Logger.error('Error loading config.json:', error);
        clusterConfig = getDefaultConfig();
        return clusterConfig;
    }
}

/**
 * Get default configuration if config.json fails to load
 */
function getDefaultConfig() {
    return {
        cluster: {
            name: 'Localhost Cluster',
            url: 'http://localhost:8091',
            username: 'Administrator',
            password: 'password',
            type: 'Self-Hosted'
        },
        clusterTypes: [
            'Self-Hosted',
            'Capella (DBaaS)'
        ],
        bucketConfig: {
            bucket: 'cb_tools',
            analyzerScope: 'query',
            analyzerCollection: 'analyzer',
            preferencesScope: '_default',
            preferencesCollection: '_default'
        }
    };
}

/**
 * Get current cluster configuration
 */
export function getCurrentCluster() {
    return clusterConfig?.cluster || null;
}

/**
 * Test connection to Couchbase cluster via Python server
 */
export async function testConnection() {
    const cluster = getCurrentCluster();
    
    if (!cluster) {
        Logger.error('No cluster configuration found');
        return { success: false, error: 'No cluster configured' };
    }

    Logger.info(`Testing connection to ${cluster.name} (${cluster.url}) [${cluster.type}]`);
    
    try {
        const response = await fetch('/api/couchbase/test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                config: cluster,
                bucketConfig: clusterConfig.bucketConfig
            })
        });

        const data = await response.json();
        
        if (data.success) {
            Logger.info('Connection successful:', data);
            updateConnectionStatus('connected', cluster.name);
            return { success: true, data };
        } else {
            Logger.error('Connection failed:', data.error);
            updateConnectionStatus('error', `Error: ${data.error}`);
            return { success: false, error: data.error };
        }
    } catch (error) {
        Logger.error('Connection error:', error);
        updateConnectionStatus('error', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Execute N1QL query against Couchbase via Python server
 */
export async function executeQuery(query, params = {}) {
    const cluster = getCurrentCluster();
    if (!cluster) {
        Logger.error('No cluster configured');
        return { success: false, error: 'No cluster configured' };
    }

    try {
        const response = await fetch('/api/couchbase/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                config: cluster,
                query,
                params
            })
        });

        const data = await response.json();
        
        if (data.success) {
            Logger.debug('Query executed successfully', data);
            return { success: true, results: data.results };
        } else {
            Logger.error('Query failed:', data.error);
            return { success: false, error: data.error };
        }
    } catch (error) {
        Logger.error('Query error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Save query analysis data to cb_tools.query.analyzer via Python server
 */
export async function saveAnalyzerData(requestId, analysisData) {
    const cluster = getCurrentCluster();
    if (!cluster) {
        return { success: false, error: 'No cluster configured' };
    }
    
    try {
        const response = await fetch('/api/couchbase/save-analyzer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                config: cluster,
                bucketConfig: clusterConfig.bucketConfig,
                requestId,
                data: {
                    ...analysisData,
                    savedAt: new Date().toISOString(),
                    version: '3.28.2'
                }
            })
        });

        return await response.json();
    } catch (error) {
        Logger.error('Error saving analyzer data:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Load query analysis data from cb_tools.query.analyzer via Python server
 */
export async function loadAnalyzerData(requestId) {
    const cluster = getCurrentCluster();
    if (!cluster) {
        return null;
    }
    
    try {
        const response = await fetch(`/api/couchbase/load-analyzer/${requestId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                config: cluster,
                bucketConfig: clusterConfig.bucketConfig
            })
        });

        const data = await response.json();
        if (data.success) {
            return data.data;
        }
        return null;
    } catch (error) {
        Logger.error('Error loading analyzer data:', error);
        return null;
    }
}

/**
 * Save user preferences to cb_tools._default._default via Python server
 */
export async function saveUserPreferences(userId, preferences) {
    const cluster = getCurrentCluster();
    if (!cluster) {
        return { success: false, error: 'No cluster configured' };
    }
    
    try {
        const response = await fetch('/api/couchbase/save-preferences', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                config: cluster,
                bucketConfig: clusterConfig.bucketConfig,
                userId,
                preferences: {
                    ...preferences,
                    updatedAt: new Date().toISOString()
                }
            })
        });

        return await response.json();
    } catch (error) {
        Logger.error('Error saving preferences:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Load user preferences from cb_tools._default._default via Python server
 */
export async function loadUserPreferences(userId) {
    const cluster = getCurrentCluster();
    if (!cluster) {
        return null;
    }
    
    try {
        const response = await fetch(`/api/couchbase/load-preferences/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                config: cluster,
                bucketConfig: clusterConfig.bucketConfig
            })
        });

        const data = await response.json();
        if (data.success) {
            return data.data;
        }
        return null;
    } catch (error) {
        Logger.error('Error loading preferences:', error);
        return null;
    }
}

/**
 * Update connection status indicator in UI
 */
function updateConnectionStatus(status, text) {
    const statusEl = document.getElementById('connection-status');
    const dotEl = statusEl?.querySelector('.status-dot');
    const textEl = statusEl?.querySelector('.status-text');
    
    if (!statusEl || !dotEl || !textEl) return;
    
    // Remove all status classes
    dotEl.classList.remove('status-connected', 'status-disconnected', 'status-error');
    
    // Add appropriate class
    dotEl.classList.add(`status-${status}`);
    textEl.textContent = text;
}

/**
 * Get cluster types
 */
export function getClusterTypes() {
    return clusterConfig?.clusterTypes || ['Localhost', 'Self-Hosted', 'Capella (DBaaS)'];
}

/**
 * Save updated cluster configuration
 */
export async function saveConfig(newConfig) {
    clusterConfig = newConfig;
    Logger.info('Config updated (in-memory only)');
    return true;
}

// Initialize on module load
loadConfig();
