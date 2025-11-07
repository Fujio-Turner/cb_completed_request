// ============================================================
// MAIN.JS - Orchestrator for Couchbase Query Analyzer
// ============================================================
// This is the main entry point that:
// - Imports base utilities (Logger, TEXT_CONSTANTS, URL flags)
// - Imports data layer (caches, stores, parsing helpers)
// - Contains all UI/chart/table/flow logic
// - Wires up event handlers and orchestrates the app
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
    dataBus,
    notifyDataReady
} from './data-layer.js';

// ============================================================
// IMPORT ALL LEGACY CODE FROM main-legacy.js
// ============================================================
// For now, we'll import the entire legacy code as a module
// In future iterations, we'll split this into:
// - charts.js
// - tables.js
// - flow-diagram.js
// - ui-helpers.js
// ============================================================

// TODO: This is temporary - need to refactor main-legacy.js to export its functions
// For now, let's just load it as a script tag until we can properly modularize it

console.log('✅ Main.js loaded with modular architecture');
console.log('📦 Imported from base.js:', { TEXT_CONSTANTS: !!TEXT_CONSTANTS, Logger: !!Logger });
console.log('📦 Imported from data-layer.js:', { 
    caches: !!parseTimeCache,
    stores: !!originalRequests,
    helpers: !!parseTime 
});
