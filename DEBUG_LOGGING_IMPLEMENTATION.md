# Debug Logging Implementation - Issue #189

## Overview
Implemented a debug logging system with URL parameter control to reduce console noise during normal usage while enabling verbose logging for debugging.

## Implementation

### Feature Flag
```
?debug=true
```

### Usage Examples
```
# Normal mode (minimal logging)
http://localhost:8000/en/index.html

# Debug mode (verbose logging)
http://localhost:8000/en/index.html?debug=true

# Combined with dev mode
http://localhost:8000/en/index.html?dev=true&debug=true
```

## Log Levels

### `[info]` - Always Visible
These logs are shown in both normal and debug modes (important user-facing information):

- 🚀 Application initialization
- 📦 Version information
- 🔧 Feature list
- Parse performance summary
- Chart sampling information ("Using X of Y requests")
- Index extraction results
- ✅ Initialization complete messages
- 💡 Tips and guidance

**Example:**
```
[info] 🚀 Initializing Couchbase Query Analyzer...
[info] 📦 Version: 3.25.0 (Updated: 2025-10-20)
[info] Parse performance: 375ms for 2000 requests
[info] Chart sampling: Using 1000 of 2000 requests for performance
[info] ✅ Index extraction complete: 9 unique indexes, 2562 total references
[info] ✅ Query Analyzer initialized successfully
[info] 💡 Tip: Type QueryAnalyzer.about() for full app info
```

### `[debug]` - Debug Mode Only
These logs only appear when `?debug=true` is in the URL (detailed technical information):

- 🧹 Chart instance destruction count
- Cache clearing notifications
- Cache statistics (hit rates, sizes)
- 📊 Individual chart creation timing
- 🔄 Chart queue resets
- ✅ Chart queue completion
- Date filtering results
- Index data collection details
- No data availability messages

**Example:**
```
[debug] 🧹 Destroyed 20 chart instances
[debug] All caches cleared for new JSON parse
[debug] Cache stats - parseTime: 5535/10000 (55.4%), normalizeStatement: 0/5000 (0.0%)
[debug] Date filtering: 2000 requests -> 2000 after date range filter
[debug] 🔄 Chart queue reset
[debug] 📊 Chart created [1/4]: Query Types (6.00ms)
[debug] 📊 Chart created [2/4]: Duration Buckets (7.00ms)
[debug] ✅ Chart queue complete: 4/4 charts created
[debug] Collected index data for timing analysis: {...}
```

### `[trace]` - Debug Mode Only
The most verbose level for execution flow tracking:

- Lazy tab loading timing

**Example:**
```
[trace] Lazy loaded insights tab in 0ms
[trace] Lazy loaded timeline tab in 29ms
```

### `[warn]` - Always Visible
Warnings about potential issues:

```
[warn] Failed to destroy chart: operationsChart
```

### `[error]` - Always Visible
Errors that need attention:

```
[error] Failed to copy: [error details]
[error] Statement not found in store: abc123
```

## Code Structure

### Logger Utility
```javascript
// Check if debug mode is enabled via URL parameter ?debug=true
function isDebugMode() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('debug') === 'true';
}

// Logging utility with levels
const Logger = {
    // [info] - Always shown (important user-facing information)
    info: function(...args) {
        console.log('[info]', ...args);
    },
    
    // [debug] - Only shown when ?debug=true (detailed technical information)
    debug: function(...args) {
        if (isDebugMode()) {
            console.log('[debug]', ...args);
        }
    },
    
    // [trace] - Only shown when ?debug=true (verbose execution tracking)
    trace: function(...args) {
        if (isDebugMode()) {
            console.log('[trace]', ...args);
        }
    },
    
    // [warn] - Always shown (warnings)
    warn: function(...args) {
        console.warn('[warn]', ...args);
    },
    
    // [error] - Always shown (errors)
    error: function(...args) {
        console.error('[error]', ...args);
    }
};
```

### Usage in Code
```javascript
// Info - always visible
Logger.info('🚀 Initializing Couchbase Query Analyzer...');
Logger.info(`Parse performance: ${timing}ms for ${count} requests`);

// Debug - only with ?debug=true
Logger.debug(`🧹 Destroyed ${count} chart instances`);
Logger.debug(`Cache stats - parseTime: ${size}/${limit} (${percent}%)`);
Logger.debug(`📊 Chart created [${n}/${total}]: ${name} (${ms}ms)`);

// Trace - only with ?debug=true
Logger.trace(`Lazy loaded ${tab} tab in ${ms}ms`);

// Warn/Error - always visible
Logger.warn(`Failed to destroy chart: ${name}`, error);
Logger.error(`Failed to copy:`, error);
```

## Changes Made

### Console Statement Replacements

1. **Info Level (Always Visible):**
   - Initialization messages
   - Version info
   - Parse performance
   - Chart sampling
   - Index extraction
   - Tips

2. **Debug Level (Debug Mode Only):**
   - Chart destruction
   - Cache operations
   - Chart queue operations
   - Data filtering
   - Chart creation timing
   - Index data collection

3. **Trace Level (Debug Mode Only):**
   - Lazy loading timing

4. **Error/Warn (Always Visible):**
   - All existing error and warning messages

### Files Modified
- `en/index.html` - Added Logger utility and updated ~139 console statements

## Benefits

1. ✅ **Cleaner default console** - Only essential information shown
2. ✅ **Easy debugging** - Just add `?debug=true` to URL
3. ✅ **Categorized logs** - Clear prefixes (`[info]`, `[debug]`, `[trace]`)
4. ✅ **No code changes needed** - Enable/disable via URL
5. ✅ **Performance** - No overhead when debug mode is off

## Testing

### Test Normal Mode
```
1. Open http://localhost:8000/en/index.html
2. Open browser console
3. Load JSON data
4. Verify only [info] logs appear
5. Should see: initialization, version, parse performance, chart sampling
6. Should NOT see: chart creation details, cache stats, lazy loading
```

### Test Debug Mode
```
1. Open http://localhost:8000/en/index.html?debug=true
2. Open browser console  
3. Load JSON data
4. Verify [info], [debug], and [trace] logs appear
5. Should see all logs with clear prefixes
```

## Related Documentation
- See [FLOW_DIAGRAM_FEATURE_FLAG.md](./FLOW_DIAGRAM_FEATURE_FLAG.md) for complete feature flag documentation
- GitHub Issue: #189
