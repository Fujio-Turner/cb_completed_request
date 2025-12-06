# Timestamp Formatting Standardization (Issue #228)

## Overview
Standardized all timestamp formatting functions across `/liquid_snake/assets/js/*.js` into a single centralized function in `base.js`.

## Changes Made

### 1. New Centralized Function: `formatTimestamp()`
**Location**: `liquid_snake/assets/js/base.js`

**Signature**:
```javascript
formatTimestamp(dateInput, format = "YYYY-MM-DD HH:MM:SS.sssZ")
```

**Supported Formats**:
- `"YYYY-MM-DD HH:MM:SS.sssZ"` → "2024-11-07 12:30:45.123Z" (default)
- `"YYYY-MM-DD HH:MM:SS"` → "2024-11-07 12:30:45"
- `"HH:MM:SS.sss"` → "12:30:45.123"
- `"HH:MM:SS"` → "12:30:45"
- `"locale"` → Browser's toLocaleString()
- `"iso"` → ISO 8601 format with T separator

**Features**:
- Accepts both `Date` objects and string inputs
- Handles Couchbase datetime format (space-separated) automatically
- Returns original input on parse failure (graceful fallback)
- Logs warnings for invalid dates
- Validates date before formatting

### 2. Files Updated

#### `base.js`
- ✅ Added `formatTimestamp()` function (lines 389-458)
- ✅ Exported function for ES6 modules
- ✅ Exposed globally via `window.formatTimestamp` for legacy compatibility

#### `main-legacy.js`
- ✅ Replaced: `convertedDate.toISOString().replace('T', ' ').substring(0, 23) + 'Z'`
- ✅ With: `formatTimestamp(convertedDate, "YYYY-MM-DD HH:MM:SS.sssZ")`
- ✅ Location: Line 3051 (requestTime column getValue function)

#### `report.js`
- ✅ Replaced: `new Date().toLocaleString()` (2 occurrences)
- ✅ With: `formatTimestamp(new Date(), "locale")`
- ✅ Locations: Lines 94, 110
- ✅ Added import: `formatTimestamp` from base.js

### 3. Duplicate Patterns Eliminated

**Before**:
```javascript
// Pattern 1 (main-legacy.js)
date.toISOString().replace('T', ' ').substring(0, 23) + 'Z'

// Pattern 2 (report.js)
new Date().toLocaleString()

// Pattern 3 (charts.js, data-layer.js - still used for parsing)
dateTimeStr.replace(" ", "T")
```

**After**:
```javascript
// Unified approach
formatTimestamp(date, "YYYY-MM-DD HH:MM:SS.sssZ")
formatTimestamp(date, "locale")
```

### 4. Preserved Functions
These functions remain unchanged as they serve different purposes:

- **`charts.js`**: 
  - `getChartDate()` - Handles timezone conversion (different purpose)
  - `convertToTimezone()` - Timezone-specific date manipulation
  
- **`data-layer.js`**:
  - `parseCouchbaseDateTime()` - Parses Couchbase format → Date object (parsing, not formatting)

## Usage Examples

```javascript
// ES6 module import
import { formatTimestamp } from './base.js';

// Basic usage
formatTimestamp("2024-11-07 12:30:45.123Z");  // "2024-11-07 12:30:45.123Z"

// Custom format
formatTimestamp(new Date(), "HH:MM:SS");      // "12:30:45"

// Locale format
formatTimestamp(new Date(), "locale");        // "11/7/2024, 12:30:45 PM"

// Date object
const d = new Date();
formatTimestamp(d, "YYYY-MM-DD HH:MM:SS");    // "2024-11-07 12:30:45"

// Legacy (non-module) usage
window.formatTimestamp(date, "iso");          // "2024-11-07T12:30:45.123Z"
```

## Future Enhancements

To further standardize in the future, consider:
1. Adding more custom format patterns as needed
2. Consolidating `parseCouchbaseDateTime()` if parsing logic becomes duplicated
3. Adding timezone-aware formatting (integration with `getChartDate()`)

## Real Data Format Analysis

Analyzed actual Couchbase data from `sample/` directory:

### Timestamp Formats Found:
1. **`requestTime`** - ISO 8601 with timezone offset:
   - `"2025-08-26T14:06:02.129-05:00"` ✅ Handled
   - `"2025-08-15T00:01:00.000Z"` ✅ Handled

2. **`#planPreparedTime`** (in plan JSON) - ISO 8601 UTC:
   - `"2025-07-13T10:15:22.124Z"` ✅ Handled

3. **`phaseTimes`** - Duration strings (NOT timestamps):
   - `"15.110ms"`, `"8.901µs"`, `"32.222ms"` ⚠️ NOT converted (these are durations, not dates)
   - These should use separate duration parsing (already exists in codebase)

### Compatibility Verification:
```javascript
// Test with real data samples
formatTimestamp("2025-08-26T14:06:02.129-05:00", "YYYY-MM-DD HH:MM:SS.sssZ");
// ✅ Output: "2025-08-26 19:06:02.129Z" (converted to UTC)

formatTimestamp("2025-08-15T00:01:00.000Z", "locale");
// ✅ Output: "8/15/2025, 12:01:00 AM" (browser locale)

formatTimestamp("2025-07-13T10:15:22.124Z", "HH:MM:SS.sss");
// ✅ Output: "10:15:22.124"
```

### Edge Cases Handled:
- ✅ Timezone offsets (`-05:00`, `+00:00`)
- ✅ UTC timestamps with `Z`
- ✅ Millisecond precision
- ✅ Date objects
- ✅ Invalid dates return original input (graceful fallback)
- ⚠️ Duration strings (ms, µs) are NOT timestamps - handled by separate parseTime() function

## Testing

All existing functionality preserved:
- ✅ No diagnostics errors
- ✅ Backward compatibility maintained
- ✅ Global exposure for legacy code
- ✅ ES6 module exports for modern code
- ✅ Real Couchbase timestamp formats tested
- ✅ Interactive test page: `test_timestamp_formats.html`

## Related Files

- `liquid_snake/assets/js/base.js` - Core utility
- `liquid_snake/assets/js/main-legacy.js` - Updated usage
- `liquid_snake/assets/js/report.js` - Updated usage
- `liquid_snake/assets/js/charts.js` - Parsing functions preserved
- `liquid_snake/assets/js/data-layer.js` - Parsing functions preserved
