// ============================================================
// DATA-LAYER.JS - Data Buffet for Couchbase Query Analyzer
// ============================================================
// This module provides:
// - Caches for parsed data (parseTime, normalizeStatement, etc.)
// - Global data stores (originalRequests, statementStore, allIndexes)
// - Pure parsing functions (no UI dependencies)
// - Event bus for data ready notifications
// ============================================================

import { TEXT_CONSTANTS, Logger, isDevMode } from './base.js';

// ============================================================
// CACHES
// ============================================================

export const CACHE_LIMITS = {
    parseTime: 10000,           // Time string parsing results
    normalizeStatement: 5000,   // Normalized SQL statements
    timestampRounding: 5000,    // Rounded timestamp calculations
};

export const operatorsCache = new WeakMap();       // Auto-cleaned by GC
export const parseTimeCache = new Map();
export const normalizeStatementCache = new Map();
export const planStatsCache = new WeakMap();       // Auto-cleaned by GC
export const timeUnitCache = new WeakMap();        // Auto-cleaned by GC
export const timestampRoundingCache = new Map();

// ============================================================
// GLOBAL DATA STORES
// ============================================================

export let originalRequests = [];
export let originalStartDate = null;
export let originalEndDate = null;
export let statementStore = {};
export let analysisStatementStore = {};

// ============================================================
// CACHE MANAGEMENT
// ============================================================

export function clearCaches() {
    // Clear data caches
    parseTimeCache.clear();
    normalizeStatementCache.clear();
    timestampRoundingCache.clear();
    
    // WeakMaps (operatorsCache, planStatsCache, timeUnitCache) clean themselves automatically
    Logger.debug(TEXT_CONSTANTS.ALL_CACHES_CLEARED);
}

export function logCacheStats() {
    const parsePercent = ((parseTimeCache.size / CACHE_LIMITS.parseTime) * 100).toFixed(1);
    const normalizePercent = ((normalizeStatementCache.size / CACHE_LIMITS.normalizeStatement) * 100).toFixed(1);
    const timestampPercent = ((timestampRoundingCache.size / CACHE_LIMITS.timestampRounding) * 100).toFixed(1);
    
    Logger.debug(`Cache stats - parseTime: ${parseTimeCache.size}/${CACHE_LIMITS.parseTime} (${parsePercent}%), normalizeStatement: ${normalizeStatementCache.size}/${CACHE_LIMITS.normalizeStatement} (${normalizePercent}%), timestampRounding: ${timestampRoundingCache.size}/${CACHE_LIMITS.timestampRounding} (${timestampPercent}%)`);
}

// ============================================================
// HELPER: parseTime
// ============================================================

export function parseTime(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    
    // Check cache first
    if (parseTimeCache.has(timeStr)) {
        return parseTimeCache.get(timeStr);
    }
    
    let result = 0;
    const match = timeStr.match(/^([\d.]+)([a-zµ]+)$/i);
    
    if (match) {
        const value = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        
        switch (unit) {
            case 's':
                result = value * 1000;
                break;
            case 'ms':
                result = value;
                break;
            case 'µs':
            case 'us':
                result = value / 1000;
                break;
            case 'ns':
                result = value / 1000000;
                break;
            default:
                result = 0;
        }
    }
    
    // Cache the result with LRU eviction
    if (parseTimeCache.size >= CACHE_LIMITS.parseTime) {
        const firstKey = parseTimeCache.keys().next().value;
        parseTimeCache.delete(firstKey);
    }
    parseTimeCache.set(timeStr, result);
    
    return result;
}

// ============================================================
// HELPER: normalizeStatement
// ============================================================

export function normalizeStatement(statement) {
    if (!statement) return '';
    
    // Check cache first
    if (normalizeStatementCache.has(statement)) {
        return normalizeStatementCache.get(statement);
    }
    
    let normalized = statement
        .replace(/\b\d+\b/g, '?')              // Numbers
        .replace(/'[^']*'/g, '?')              // Single-quoted strings
        .replace(/"[^"]*"/g, '?')              // Double-quoted strings
        .replace(/\[\s*\d+(?:\s*,\s*\d+)*\s*\]/g, '[?]')  // Array of numbers
        .replace(/\[\s*'[^']*'(?:\s*,\s*'[^']*')*\s*\]/g, '[?]')  // Array of strings
        .replace(/IN\s*\([^)]+\)/gi, 'IN (?)')  // IN clauses
        .trim();
    
    // Cache the result with LRU eviction
    if (normalizeStatementCache.size >= CACHE_LIMITS.normalizeStatement) {
        const firstKey = normalizeStatementCache.keys().next().value;
        normalizeStatementCache.delete(firstKey);
    }
    normalizeStatementCache.set(statement, normalized);
    
    return normalized;
}

// ============================================================
// HELPER: parseCouchbaseDateTime
// ============================================================

export function parseCouchbaseDateTime(dateTimeStr) {
    if (!dateTimeStr) return null;
    // Handle various Couchbase datetime formats
    const isoString = dateTimeStr.replace(" ", "T");
    return new Date(isoString);
}

// ============================================================
// EVENT BUS
// ============================================================

export const dataBus = new EventTarget();

// Helper to dispatch data ready event
export function notifyDataReady(details) {
    dataBus.dispatchEvent(new CustomEvent('dataReady', { detail: details }));
}

// ============================================================
// HELPER: detectTimezoneFromData
// ============================================================

export function detectTimezoneFromData(processData) {
    if (!processData || processData.length === 0) return "UTC";
    
    // Get first requestTime that exists
    for (let i = 0; i < Math.min(processData.length, 10); i++) {
        const item = processData[i];
        const request = item.completed_requests || item;
        if (request.requestTime) {
            const requestTime = request.requestTime;
            // Check for timezone offset (e.g., "2025-01-15T10:30:00-05:00")
            const offsetMatch = requestTime.match(/([+-]\d{2}:\d{2})$/);
            if (offsetMatch) {
                const offset = offsetMatch[1];
                if (offset === "+00:00" || offset === "-00:00") {
                    return "UTC";
                }
                // Map common offsets to timezone names
                const offsetToTimezone = {
                    "-10:00": "America/Honolulu",
                    "-09:00": "America/Anchorage",
                    "-08:00": "America/Los_Angeles",
                    "-07:00": "America/Denver",
                    "-06:00": "America/Chicago",
                    "-05:00": "America/New_York",
                    "-03:00": "America/Sao_Paulo",
                    "+00:00": "UTC",
                    "+01:00": "Europe/Paris",
                    "+02:00": "Europe/Athens",
                    "+03:00": "Europe/Moscow",
                    "+04:00": "Asia/Dubai",
                    "+05:30": "Asia/Kolkata",
                    "+06:00": "Asia/Dhaka",
                    "+07:00": "Asia/Bangkok",
                    "+08:00": "Asia/Shanghai",
                    "+09:00": "Asia/Tokyo",
                    "+09:30": "Australia/Adelaide",
                    "+10:00": "Australia/Sydney",
                    "+11:00": "Pacific/Guam",
                    "+12:00": "Pacific/Auckland"
                };
                return offsetToTimezone[offset] || "UTC";
            }
            return "UTC";
        }
    }
    return "UTC";
}

// ============================================================
// HELPER: getOperators (with cache)
// ============================================================

export function getOperators(
    operator,
    operators = [],
    visited = new WeakSet(),
    depth = 0
) {
    if (!operator) return operators;

    // Check cache first for the root operator
    if (depth === 0 && operatorsCache.has(operator)) {
        return operatorsCache.get(operator);
    }

    // Prevent infinite recursion
    if (visited.has(operator)) return operators;
    visited.add(operator);

    // Depth limit
    if (depth > 50) return operators;

    if (operator["#operator"]) {
        operators.push(operator);
    }
    if (operator["~child"]) {
        getOperators(operator["~child"], operators, visited, depth + 1);
    } else if (operator["~children"]) {
        operator["~children"].forEach((child) => {
            getOperators(child, operators, visited, depth + 1);
        });
    }
    if (operator.input) {
        getOperators(operator.input, operators, visited, depth + 1);
    }
    if (operator.inputs && Array.isArray(operator.inputs)) {
        operator.inputs.forEach((input) => {
            getOperators(input, operators, visited, depth + 1);
        });
    }
    if (operator.left) {
        getOperators(operator.left, operators, visited, depth + 1);
    }
    if (operator.right) {
        getOperators(operator.right, operators, visited, depth + 1);
    }
    if (operator.first) {
        getOperators(operator.first, operators, visited, depth + 1);
    }
    if (operator.second) {
        getOperators(operator.second, operators, visited, depth + 1);
    }
    if (operator.scans && Array.isArray(operator.scans)) {
        operator.scans.forEach((scan) => {
            getOperators(scan, operators, visited, depth + 1);
        });
    }
    if (operator.scan) {
        getOperators(operator.scan, operators, visited, depth + 1);
    }

    // Cache the result at root level
    if (depth === 0) {
        operatorsCache.set(operator, operators);
    }

    return operators;
}
