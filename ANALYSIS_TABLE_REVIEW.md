# Analysis Table (Query Groups) Review

## Current Problems - Same as Every Query Tab!

### ❌ **Column Duplication**
The same column array appears in **TWO places**:
- Line 5109: `generateAnalysisTable()` 
- Line 5246: `populateAnalysisTable()`

```javascript
// Duplicated in both functions!
const analysisColumns = [
    "total_count",
    "min_duration_in_seconds",
    "max_duration_in_seconds",
    "avg_duration_in_seconds",
    "median_duration_in_seconds",
    "avg_resultCount",
    "avg_resultSize",
    "avg_fetch",
    "avg_primaryScan",
    "avg_indexScan",
    "status_counts",
    "normalized_statement",
    "user_query_counts",
];
```

### ❌ **Scattered Column Logic**

**Header Generation** (lines 5127-5152):
- Manual display name transformations with `replace(/_/g, " ")`
- Individual if-statements for special names
- No centralized configuration

**Data Mapping** (lines 5155-5187):
- Large if-else chain for value extraction
- Duplicated logic for formatting
- Hard to add new columns

**Cell Rendering** (lines 5274-5368):
- Another large if-else chain
- Special rendering scattered throughout
- Duplicate logic from header generation

### ❌ **Adding Column = Multiple Changes**

To add one column you must modify:
1. Column array in `generateAnalysisTable()` (line 5109)
2. Column array in `populateAnalysisTable()` (line 5246)
3. Display name logic in `generateAnalysisTable()` (lines 5129-5147)
4. Data extraction logic in `generateAnalysisTable()` (lines 5158-5186)
5. Cell rendering logic in `populateAnalysisTable()` (lines 5274-5368)

## Comparison with Every Query Tab

| Issue | Every Query | Analysis (Query Groups) |
|-------|-------------|-------------------------|
| Duplicate column arrays | ✅ Fixed | ❌ Still exists |
| Manual header mapping | ✅ Fixed | ❌ Still exists |
| Scattered rendering | ✅ Fixed | ❌ Still exists |
| Hard to add columns | ✅ Fixed | ❌ Still exists |

## Recommended Solution

Apply the **exact same pattern** as Every Query tab:

### Create `ANALYSIS_COLUMNS` Configuration

```javascript
const ANALYSIS_COLUMNS = [
    {
        id: 'total_count',
        header: 'total count',
        dataField: 'total_count',
        sortable: true,
        sortType: 'numeric',
        getValue: (group) => group.total_count,
        render: (value) => {
            const numValue = Number(value);
            if (!isNaN(numValue)) {
                if (numValue > 999999) {
                    return "999K+";
                } else {
                    return numValue.toLocaleString();
                }
            }
            return value;
        }
    },
    {
        id: 'min_duration_in_seconds',
        header: 'min duration (mm:ss.sss)',
        dataField: 'min_duration_in_seconds',
        sortable: true,
        sortType: 'time',
        getValue: (group) => {
            return isNaN(group.min_duration_in_seconds)
                ? "N/A"
                : formatTime(Number(group.min_duration_in_seconds) * 1000);
        },
        render: (value) => value
    },
    {
        id: 'max_duration_in_seconds',
        header: 'max duration (mm:ss.sss)',
        dataField: 'max_duration_in_seconds',
        sortable: true,
        sortType: 'time',
        getValue: (group) => {
            return isNaN(group.max_duration_in_seconds)
                ? "N/A"
                : formatTime(Number(group.max_duration_in_seconds) * 1000);
        },
        render: (value) => value
    },
    {
        id: 'avg_duration_in_seconds',
        header: 'avg duration (mm:ss.sss)',
        dataField: 'avg_duration_in_seconds',
        sortable: true,
        sortType: 'time',
        getValue: (group) => {
            return isNaN(group.avg_duration_in_seconds)
                ? "N/A"
                : formatTime(Number(group.avg_duration_in_seconds) * 1000);
        },
        render: (value) => value
    },
    {
        id: 'median_duration_in_seconds',
        header: 'median duration (mm:ss.sss)',
        dataField: 'median_duration_in_seconds',
        sortable: true,
        sortType: 'time',
        getValue: (group) => {
            return isNaN(group.median_duration_in_seconds)
                ? "N/A"
                : formatTime(Number(group.median_duration_in_seconds) * 1000);
        },
        render: (value) => value
    },
    {
        id: 'avg_resultCount',
        header: 'avg resultCount',
        dataField: 'avg_resultCount',
        sortable: true,
        sortType: 'numeric',
        getValue: (group) => {
            return isNaN(group.avg_resultCount) ? "N/A" : Number(group.avg_resultCount).toLocaleString();
        },
        render: (value) => value
    },
    {
        id: 'avg_resultSize',
        header: 'avg resultSize',
        dataField: 'avg_resultSize',
        sortable: true,
        sortType: 'numeric',
        getValue: (group) => {
            return isNaN(group.avg_resultSize) ? "N/A" : Number(group.avg_resultSize).toLocaleString();
        },
        render: (value) => value
    },
    {
        id: 'avg_fetch',
        header: 'avg docsFetch',
        dataField: 'avg_fetch',
        sortable: true,
        sortType: 'numeric',
        getValue: (group) => {
            return isNaN(group.avg_fetch) ? "N/A" : Number(group.avg_fetch).toLocaleString();
        },
        render: (value) => value
    },
    {
        id: 'avg_primaryScan',
        header: 'avg primaryScan',
        dataField: 'avg_primaryScan',
        sortable: true,
        sortType: 'numeric',
        getValue: (group) => {
            return isNaN(group.avg_primaryScan) ? "N/A" : Number(group.avg_primaryScan).toLocaleString();
        },
        render: (value, td) => {
            const cleanValue = String(value).replace(/,/g, '');
            const originalValue = Number(cleanValue);
            if (!isNaN(originalValue) && originalValue > 0) {
                td.classList.add("primary-scan-yes");
            }
            return value;
        }
    },
    {
        id: 'avg_indexScan',
        header: 'avg indexScan',
        dataField: 'avg_indexScan',
        sortable: true,
        sortType: 'numeric',
        getValue: (group) => {
            return isNaN(group.avg_indexScan) ? "N/A" : Number(group.avg_indexScan).toLocaleString();
        },
        render: (value) => value
    },
    {
        id: 'status_counts',
        header: null, // Will use TEXT_CONSTANTS.STATE_FATAL
        dataField: 'status_counts',
        sortable: true,
        sortType: 'numeric',
        getValue: (group) => {
            const counts = group.status_counts;
            return counts.fatal;
        },
        render: (value) => {
            if (value > 0) {
                return `<span class="fatal-count">${value}</span>`;
            }
            return value;
        }
    },
    {
        id: 'normalized_statement',
        header: 'normalized statement',
        dataField: 'normalized_statement',
        width: '300px',
        sortable: true,
        sortType: 'string',
        getValue: (group) => group.normalized_statement || "N/A",
        render: (value, td, rowData, index) => {
            const statement = value || "";
            const statementId = `analysis-statement-${index}`;
            const preparedSample = (rowData && rowData.preparedSample) ? String(rowData.preparedSample) : "";
            const preparedSnippet = preparedSample 
                ? `<div style="margin-top:6px; color:#555; font-size:12px;"><strong>${TEXT_CONSTANTS.PREPARED_TEXT || 'Prepared:'}</strong> ${escapeHtml(preparedSample.substring(0, 300))}${preparedSample.length > 300 ? '...' : ''}</div>` 
                : '';

            analysisStatementStore[statementId] = statement;

            if (statement.length > 500) {
                const truncated = statement.substring(0, 500);
                return `
                    <div id="${statementId}-truncated">
                        <span>${truncated}...</span>
                        ${preparedSnippet}
                        <br>
                        <button onclick="toggleAnalysisStatement('${statementId}', true)" 
                                class="btn-standard" style="margin-top: 5px; margin-right: 5px;">${TEXT_CONSTANTS.SHOW_MORE}</button>
                        <button onclick="copyAnalysisStatement('${statementId}', event)" 
                                class="btn-standard" style="margin-top: 5px;">${TEXT_CONSTANTS.COPY}</button>
                    </div>
                    <div id="${statementId}-full" style="display: none;">
                        <span>${statement}</span>
                        ${preparedSnippet}
                        <br>
                        <button onclick="toggleAnalysisStatement('${statementId}', false)" 
                                class="btn-standard" style="margin-top: 5px; margin-right: 5px;">${TEXT_CONSTANTS.HIDE}</button>
                        <button onclick="copyAnalysisStatement('${statementId}', event)" 
                                class="btn-standard" style="margin-top: 5px;">${TEXT_CONSTANTS.COPY}</button>
                    </div>
                `;
            } else {
                return `
                    <div>
                        <span>${statement}</span>
                        ${preparedSnippet}
                        <br>
                        <button onclick="copyAnalysisStatement('${statementId}', event)" 
                                class="btn-standard" style="margin-top: 5px;">${TEXT_CONSTANTS.COPY}</button>
                    </div>
                `;
            }
        }
    },
    {
        id: 'user_query_counts',
        header: null, // Will use TEXT_CONSTANTS.USER_COUNT
        dataField: 'user_query_counts',
        sortable: true,
        sortType: 'string',
        getValue: (group) => {
            return Object.entries(group.user_query_counts)
                .map(([user, count]) => `${user}: (${count})`)
                .join(", ");
        },
        render: (value) => {
            // Bold the counts in parentheses
            return value.replace(/\((\d+)\)/g, "<b>($1)</b>");
        }
    }
];
```

## Benefits of Refactoring

### ✅ **Single Source of Truth**
All column configuration in one place

### ✅ **Easy to Add Columns**
Just add one object to the array

### ✅ **Consistent with Every Query Tab**
Same pattern, same benefits

### ✅ **Maintainable**
Clear, self-documenting code

## Effort Estimate

- **Time:** ~30 minutes (already have the pattern from Every Query)
- **Risk:** Low (same approach that already works)
- **Lines Changed:** ~150 lines simplified
- **Testing:** Use existing Playwright tests

## Recommendation

✅ **Apply the same refactoring to Analysis table**

The code will be:
- More maintainable
- Easier to extend
- Consistent with Every Query tab
- Following best practices
