/**
 * Storage connector for the embedded Couchbase Lite store (Liquid edition).
 *
 * Historically this module wrapped HTTP calls to an external Couchbase
 * Server cluster. The cluster connection has been removed; all persistence
 * now flows through the Flask /api/couchbase/* endpoints which talk to the
 * embedded CBL database. The exported function names and shapes are kept
 * stable so existing UI modules (ai-client.js, settings.js, ...) keep
 * working unchanged.
 *
 * Endpoints used (all CBL-backed):
 *   - POST /api/couchbase/save-analyzer
 *   - POST /api/couchbase/load-analyzer/<id>
 *   - POST /api/couchbase/delete-analyzer
 *   - POST /api/couchbase/save-preferences
 *   - POST /api/couchbase/load-preferences/<id>
 */

import { Logger } from './base.js';

// Frontend-side config (no cluster URL/credentials anymore — kept only as a
// shape compatible with previously-saved config.json files).
let clusterConfig = null;

/**
 * Load static config (config.json) for things like default UI prefs. The
 * `cluster` block is no longer used to talk to a server.
 */
export async function loadConfig() {
    try {
        const response = await fetch('config.json');
        if (!response.ok) {
            throw new Error(`Failed to load config: ${response.statusText}`);
        }
        clusterConfig = await response.json();
        Logger.info('Loaded analyzer configuration', clusterConfig);
    } catch (error) {
        Logger.warn('config.json load failed; using defaults', error);
        clusterConfig = getDefaultConfig();
    }

    window.clusterConfig = clusterConfig;
    window.dispatchEvent(
        new CustomEvent('clusterConfigLoaded', { detail: clusterConfig })
    );
    return clusterConfig;
}

function getDefaultConfig() {
    return {
        cluster: { name: 'Embedded CBL', type: 'CBL' },
        clusterTypes: ['CBL'],
        bucketConfig: {
            bucket: 'cb_tools',
            analyzerScope: 'query',
            analyzerCollection: 'analyzer',
            preferencesScope: '_default',
            preferencesCollection: '_default',
        },
    };
}

export function getCurrentCluster() {
    return clusterConfig?.cluster || { name: 'Embedded CBL', type: 'CBL' };
}

export function getClusterTypes() {
    return ['CBL'];
}

export async function saveConfig(newConfig) {
    clusterConfig = newConfig;
    Logger.info('Config updated (in-memory only)');
    return true;
}

/**
 * Connection test — there's no remote cluster anymore. We just confirm the
 * embedded CBL store is reachable via the storage info endpoint.
 */
export async function testConnection() {
    try {
        const response = await fetch('/api/storage/info');
        const data = await response.json();
        if (data.success) {
            return { success: true, data };
        }
        return { success: false, error: data.error || 'Storage unavailable' };
    } catch (error) {
        Logger.error('Storage info error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * N1QL queries against an external cluster are no longer supported.
 * Source data is provided via JSON upload through the analyzer UI.
 */
export async function executeQuery() {
    return {
        success: false,
        error: 'Live N1QL queries are no longer supported. Upload a JSON file instead.',
    };
}

export async function saveAnalyzerData(requestId, analysisData) {
    try {
        const response = await fetch('/api/couchbase/save-analyzer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requestId,
                data: {
                    ...analysisData,
                    savedAt: new Date().toISOString(),
                    version: '5.0.0',
                },
            }),
        });
        return await response.json();
    } catch (error) {
        Logger.error('Error saving analyzer data:', error);
        return { success: false, error: error.message };
    }
}

export async function loadAnalyzerData(requestId) {
    try {
        const response = await fetch(`/api/couchbase/load-analyzer/${requestId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });
        const data = await response.json();
        return data.success ? data.data : null;
    } catch (error) {
        Logger.error('Error loading analyzer data:', error);
        return null;
    }
}

export async function deleteAnalyzerData(requestId) {
    try {
        const response = await fetch('/api/couchbase/delete-analyzer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestId }),
        });
        return await response.json();
    } catch (error) {
        Logger.error('Error deleting analyzer data:', error);
        return { success: false, error: error.message };
    }
}

export async function saveUserPreferences(userId, preferences) {
    try {
        const response = await fetch('/api/couchbase/save-preferences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                preferences: {
                    ...preferences,
                    updatedAt: new Date().toISOString(),
                },
            }),
        });
        return await response.json();
    } catch (error) {
        Logger.error('Error saving preferences:', error);
        return { success: false, error: error.message };
    }
}

export async function loadUserPreferences(userId) {
    try {
        const response = await fetch(`/api/couchbase/load-preferences/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });
        const data = await response.json();
        return data.success ? data.data : null;
    } catch (error) {
        Logger.error('Error loading preferences:', error);
        return null;
    }
}

// Initialize on module load
loadConfig();
