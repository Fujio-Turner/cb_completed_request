// ============================================================
// MAIN.JS - Orchestrator for Couchbase Query Analyzer
// ============================================================
// This is the main entry point that:
// - Imports base utilities (Logger, TEXT_CONSTANTS, URL flags)
// - Imports data layer (caches, stores, parsing helpers)
// - Imports UI helpers (DOM utils, toast, clipboard, formatters)
// - Exposes everything globally for backward compatibility
// - Future: Will orchestrate app initialization
// ============================================================

import { TEXT_CONSTANTS, Logger, isDevMode, getLogLevel, isDebugMode } from './base.js';
import {
    CACHE_LIMITS,
    parseTimeCache,
    normalizeStatementCache,
    operatorsCache,
    planStatsCache,
    timeUnitCache,
    timestampRoundingCache,
    clearCaches,
    logCacheStats,
    originalRequests,
    statementStore,
    analysisStatementStore,
    parseTime,
    normalizeStatement,
    parseCouchbaseDateTime,
    detectTimezoneFromData,
    getOperators,
    dataBus,
    notifyDataReady
} from './data-layer.js';
import {
    $,
    $$,
    on,
    off,
    showToast,
    ClipboardUtils,
    copyToClipboard,
    debounce,
    throttle,
    formatNumber,
    formatBytes,
    formatDuration,
    escapeHtml,
    openModal,
    closeModal,
    setupModalClose
} from './ui-helpers.js';

// ============================================================
// EXPOSE GLOBALS FOR BACKWARD COMPATIBILITY
// ============================================================

// UI Helpers
window.showToast = showToast;
window.ClipboardUtils = ClipboardUtils;
window.copyToClipboard = copyToClipboard;
window.debounce = debounce;
window.throttle = throttle;
window.formatNumber = formatNumber;
window.formatBytes = formatBytes;
window.formatDuration = formatDuration;

// Data Layer Helpers
window.detectTimezoneFromData = detectTimezoneFromData;
window.getOperators = getOperators;

// ============================================================
// INITIALIZATION LOG
// ============================================================

console.log('✅ Main.js loaded with modular architecture');
console.log('📦 Imported from base.js:', { TEXT_CONSTANTS: !!TEXT_CONSTANTS, Logger: !!Logger });
console.log('📦 Imported from data-layer.js:', { 
    caches: !!parseTimeCache,
    stores: !!originalRequests,
    helpers: !!parseTime 
});
console.log('📦 Imported from ui-helpers.js:', {
    dom: !!$,
    toast: !!showToast,
    clipboard: !!ClipboardUtils,
    formatters: !!formatNumber
});
