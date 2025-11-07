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
