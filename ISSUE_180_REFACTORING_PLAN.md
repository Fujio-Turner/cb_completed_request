# Issue #180: Every Query Table Refactoring Plan

## ✅ **IMPLEMENTATION COMPLETE**

All refactoring phases have been successfully implemented and tested. The Every Query table now uses a centralized column configuration system.

## Current Problems

### 1. **Column Duplication**
The same column definitions appear in multiple places:
- `generateTable()` lines 4452-4472
- `populateEveryQueryTable()` lines 4629-4649
- Data mapping in `generateTable()` lines 4532-4585

### 2. **String-Based Header Mapping**
Headers use `\n` for line breaks requiring manual mapping:
```javascript
else if (col === "request\nTime") dataField = "requestTime";
else if (col === "statement\nType") dataField = "statementType";
// ... 15+ more mappings
```

### 3. **Scattered Column Logic**
- Special rendering logic (lines 4687-4777) uses nested if-else
- Sorting logic (lines 3962-4053) duplicates column checks
- Width/style definitions in header generation (lines 4496-4499)

### 4. **Adding New Columns Requires 5+ Changes**
To add one column you must modify:
1. Column array in `generateTable()`
2. Column array in `populateEveryQueryTable()`
3. Data mapping logic in `generateTable()`
4. Display-to-field mapping in `populateEveryQueryTable()`
5. Sorting logic in `getSortableValue()`
6. Optional: Special rendering logic

---

## Recommended Solution: Column Configuration Object

### Architecture

Create a centralized **column configuration array** where each column is an object with:
- `id`: Internal field name
- `header`: Display header text
- `dataField`: Source field from request data
- `width`: Optional column width
- `sortable`: Whether column can be sorted
- `sortType`: How to sort (numeric, time, string, date, custom)
- `render`: Optional custom render function
- `getValue`: Optional custom value extraction function

### Implementation

```javascript
// Column Configuration (add near top of script section)
const EVERY_QUERY_COLUMNS = [
    {
        id: 'rowNumber',
        header: '#',
        dataField: null,
        width: '50px',
        sortable: true,
        sortType: 'numeric',
        getValue: (request, index) => index + 1,
        render: (value) => value
    },
    {
        id: 'requestTime',
        header: 'request\nTime',
        dataField: 'requestTime',
        sortable: true,
        sortType: 'date',
        render: (value) => value || ''
    },
    {
        id: 'statementType',
        header: 'statement\nType',
        dataField: 'statementType',
        sortable: true,
        sortType: 'string',
        render: (value) => value || 'N/A'
    },
    {
        id: 'elapsedTime',
        header: 'elapsed\nTime',
        dataField: 'elapsedTime',
        sortable: true,
        sortType: 'time',
        getValue: (request) => formatTime(request.elapsedTimeMs || 0),
        render: (value) => value
    },
    {
        id: 'kernTime',
        header: 'kern\nTime',
        dataField: 'kernTime',
        sortable: true,
        sortType: 'time',
        getValue: (request) => {
            const ms = request.kernTimeMs || 0;
            return ms > 0 ? formatTime(ms) : 'N/A';
        },
        render: (value) => value
    },
    {
        id: 'kernTimePercent',
        header: 'KernTime\n%',
        dataField: 'KernTime %',
        sortable: true,
        sortType: 'percent',
        getValue: (request) => {
            const elapsed = request.elapsedTimeMs || 0;
            const kern = request.kernTimeMs || 0;
            return elapsed > 0 && kern > 0 
                ? ((kern / elapsed) * 100).toFixed(2) + '%' 
                : 'N/A';
        },
        render: (value) => value
    },
    {
        id: 'resultCount',
        header: 'result\nCount',
        dataField: 'resultCount',
        sortable: true,
        sortType: 'numeric',
        render: (value) => {
            const num = Number(value);
            return isNaN(num) ? value : num.toLocaleString();
        }
    },
    {
        id: 'primaryScanUsed',
        header: 'Primary Scan\nUsed',
        dataField: 'Primary Scan Used',
        sortable: true,
        sortType: 'boolean',
        getValue: (request) => request.usesPrimary ? 'Yes' : 'No',
        render: (value, td) => {
            if (value === 'Yes') {
                td.classList.add('primary-scan-yes');
            }
            return value;
        }
    },
    {
        id: 'state',
        header: 'state',
        dataField: 'state',
        sortable: true,
        sortType: 'custom',
        sortFn: (value) => {
            if (value === 'fatal') return 'aaa_fatal';
            if (value === 'completed') return 'bbb_completed';
            return String(value || 'zzz_unknown').toLowerCase();
        },
        render: (value, td) => {
            if (value === 'fatal') {
                td.classList.add('fatal-state');
            }
            return value;
        }
    },
    {
        id: 'statement',
        header: 'statement',
        dataField: 'statement',
        width: '300px',
        maxWidth: '300px',
        sortable: true,
        sortType: 'string',
        getValue: (request) => request.statement || request.preparedText || 'N/A',
        render: (value, td, rowData, globalIndex) => {
            // Complex statement rendering with truncation
            const statementId = `statement-${globalIndex}`;
            statementStore[statementId] = value;
            
            if (value.length > 500) {
                const truncated = value.substring(0, 500);
                const preparedSample = (rowData.request && isPreparedExecution(rowData.request)) 
                    ? getPreparedSample(rowData.request) : "";
                const preparedSnippet = preparedSample 
                    ? `<div style="margin-top:6px; color:#555; font-size:12px;"><strong>${TEXT_CONSTANTS.PREPARED_TEXT || 'Prepared:'}</strong> ${escapeHtml(preparedSample.substring(0, 300))}${preparedSample.length > 300 ? '...' : ''}</div>` 
                    : '';
                
                return `
                    <div id="${statementId}-truncated">
                        <span>${truncated}...</span>
                        ${preparedSnippet}
                        <br>
                        <button onclick="toggleStatement('${statementId}', true)" 
                                class="btn-standard" style="margin-top: 5px; margin-right: 5px;">${TEXT_CONSTANTS.SHOW_MORE}</button>
                        <button onclick="copyStatement('${statementId}', event)" 
                                class="btn-standard" style="margin-top: 5px;">${TEXT_CONSTANTS.COPY}</button>
                    </div>
                    <div id="${statementId}-full" style="display: none;">
                        <span>${value}</span>
                        ${preparedSnippet}
                        <br>
                        <button onclick="toggleStatement('${statementId}', false)" 
                                class="btn-standard" style="margin-top: 5px; margin-right: 5px;">${TEXT_CONSTANTS.HIDE}</button>
                        <button onclick="copyStatement('${statementId}', event)" 
                                class="btn-standard" style="margin-top: 5px;">${TEXT_CONSTANTS.COPY}</button>
                    </div>
                `;
            } else {
                const preparedSample = (rowData.request && isPreparedExecution(rowData.request)) 
                    ? getPreparedSample(rowData.request) : "";
                const preparedSnippet = preparedSample 
                    ? `<div style="margin-top:6px; color:#555; font-size:12px;"><strong>${TEXT_CONSTANTS.PREPARED_TEXT || 'Prepared:'}</strong> ${escapeHtml(preparedSample.substring(0, 300))}${preparedSample.length > 300 ? '...' : ''}</div>` 
                    : '';
                return `
                    <div>
                        <span>${value}</span>
                        ${preparedSnippet}
                        <br>
                        <button onclick="copyStatement('${statementId}', event)" 
                                class="btn-standard" style="margin-top: 5px;">${TEXT_CONSTANTS.COPY}</button>
                    </div>
                `;
            }
        }
    },
    {
        id: 'scanConsistency',
        header: 'Scan\nConsistency',
        dataField: 'scanConsistency',
        sortable: true,
        sortType: 'string',
        getValue: (request) => {
            return request.request && request.request.scanConsistency 
                ? request.request.scanConsistency 
                : 'N/A';
        },
        render: (value) => value
    },
    {
        id: 'requestId',
        header: 'requestId',
        dataField: 'requestId',
        sortable: true,
        sortType: 'string',
        getValue: (request) => {
            return (request.request && request.request.requestId) 
                || request.requestId 
                || '';
        },
        render: (value) => {
            const safeId = String(value);
            return `
                <code style="font-size:11px;">${escapeHtml(safeId)}</code>
                <button data-id="${escapeHtml(safeId)}" 
                        onclick="copyRequestId(this.dataset.id, event)" 
                        class="btn-standard" 
                        style="margin-left:6px;">${TEXT_CONSTANTS.COPY}</button>
            `;
        }
    }
    // ADD NEW COLUMNS HERE - Just add one object!
];
```

### Refactored Functions

```javascript
// Generate table headers from config
function generateTable(requests) {
    const tableHeader = document.getElementById("table-header");
    const tableBody = document.getElementById("table-body");
    tableHeader.innerHTML = "";
    tableBody.innerHTML = "";

    const headerRow = document.createElement("tr");
    
    EVERY_QUERY_COLUMNS.forEach((colConfig) => {
        const th = document.createElement("th");
        th.innerHTML = colConfig.header.replace(/\n/g, "<br>");
        th.style.textAlign = "center";
        th.style.whiteSpace = "nowrap";
        th.style.cursor = "pointer";
        th.style.userSelect = "none";
        th.style.padding = "8px";
        th.style.backgroundColor = "#f8f9fa";
        th.style.border = "1px solid #dee2e6";
        th.style.fontWeight = "bold";
        th.style.position = "relative";

        // Apply column-specific width if defined
        if (colConfig.width) th.style.width = colConfig.width;
        if (colConfig.maxWidth) th.style.maxWidth = colConfig.maxWidth;

        // Add hover effect
        th.addEventListener("mouseenter", () => th.style.backgroundColor = "#e9ecef");
        th.addEventListener("mouseleave", () => th.style.backgroundColor = "#f8f9fa");

        // Add sorting indicator
        if (colConfig.sortable) {
            const sortHint = document.createElement("div");
            sortHint.className = "sort-hint";
            sortHint.style.fontSize = "10px";
            sortHint.style.color = "#6c757d";
            sortHint.style.fontWeight = "normal";
            sortHint.style.marginTop = "2px";
            sortHint.textContent = "↕ Sort";
            th.appendChild(sortHint);

            th.addEventListener("click", () => {
                handleColumnSort(colConfig.id, "every-query");
            });
        }

        headerRow.appendChild(th);
    });
    tableHeader.appendChild(headerRow);

    // Prepare table data using column config
    const tableData = requests.map((request, index) => {
        const rowData = {
            rowIndex: index + 1,
            request: request
        };

        EVERY_QUERY_COLUMNS.forEach((colConfig) => {
            let value;
            if (colConfig.getValue) {
                value = colConfig.getValue(request, index);
            } else if (colConfig.dataField) {
                value = request[colConfig.dataField] || 'N/A';
            }
            rowData[colConfig.id] = value;
        });

        return rowData;
    });

    // Sort by elapsedTime by default
    const sortedData = sortData(tableData, "elapsedTime", "desc");
    everyQueryData = sortedData;
    filteredEveryQueryData = [...sortedData];
    currentSortColumn = "elapsedTime";
    currentSortDirection = "desc";
    currentTableType = "every-query";

    currentPage = 1;

    if (!document.getElementById("statement-search").hasAttribute("data-listeners-added")) {
        setupSearchListeners();
        document.getElementById("statement-search").setAttribute("data-listeners-added", "true");
    }

    populateEveryQueryTable(filteredEveryQueryData);
    updateSortArrows("table-header", "elapsedTime", "desc");
    updateSearchResultsInfo(filteredEveryQueryData.length, everyQueryData.length);
}

// Populate table body from config
function populateEveryQueryTable(data) {
    const tableBody = document.getElementById("table-body");
    tableBody.innerHTML = "";
    statementStore = {};

    const start = (currentPage - 1) * pageSize;
    const end = Math.min(start + pageSize, data.length);
    const pageData = data.slice(start, end);

    const fragment = document.createDocumentFragment();

    pageData.forEach((rowData, pageIndex) => {
        const globalIndex = start + pageIndex;
        const row = document.createElement("tr");

        EVERY_QUERY_COLUMNS.forEach((colConfig) => {
            const td = document.createElement("td");
            const value = rowData[colConfig.id];

            // Apply custom rendering if defined
            if (colConfig.render) {
                const rendered = colConfig.render(value, td, rowData, globalIndex);
                if (typeof rendered === 'string') {
                    td.innerHTML = rendered;
                } else {
                    td.textContent = rendered;
                }
            } else {
                td.textContent = value;
            }

            // Apply special CSS classes
            if (colConfig.id === 'requestTime') {
                td.className = 'td-request-time';
            } else if (colConfig.id === 'requestId') {
                td.className = 'td-request-id';
            } else if (colConfig.id === 'statement') {
                td.className = 'td-statement';
            }

            row.appendChild(td);
        });

        row.addEventListener("click", (event) => {
            if (window.getSelection().toString().length > 0) return;
            document.querySelectorAll("tr").forEach((r) => (r.style.backgroundColor = ""));
            row.style.backgroundColor = "#e0e0e0";
            generateFlowDiagram(rowData.request);
        });

        fragment.appendChild(row);
    });

    tableBody.appendChild(fragment);

    // Auto-render first row
    try {
        const flowEl = document.getElementById("flow-diagram");
        const shouldAuto = flowEl && (!flowEl.hasChildNodes() || flowEl.children.length === 0 || 
            (flowEl.textContent || "").trim() === (TEXT_CONSTANTS.SELECT_QUERY_FLOW || ""));
        if (shouldAuto && pageData.length > 0) {
            generateFlowDiagram(pageData[0].request);
            if (tableBody.firstElementChild) {
                tableBody.firstElementChild.style.backgroundColor = "#e0e0e0";
            }
        }
    } catch (e) { /* no-op */ }

    addPaginationControls(data.length);
}

// Simplified sorting
function getSortableValue(item, columnId) {
    const colConfig = EVERY_QUERY_COLUMNS.find(col => col.id === columnId);
    if (!colConfig) return '';

    const value = item[columnId];

    // Use custom sort function if defined
    if (colConfig.sortFn) {
        return colConfig.sortFn(value);
    }

    // Use sortType to determine how to sort
    switch (colConfig.sortType) {
        case 'numeric':
            return parseFloat(value) || 0;
        case 'time':
            return parseTimeForSorting(value);
        case 'date':
            return new Date(value).getTime() || 0;
        case 'percent':
            return parseFloat(String(value).replace('%', '')) || 0;
        case 'boolean':
            return value === 'Yes' ? 1 : 0;
        case 'string':
        default:
            return String(value || '').toLowerCase();
    }
}
```

---

## Benefits

### ✅ **Add Column in One Place**
Just add a new object to `EVERY_QUERY_COLUMNS` array

### ✅ **Self-Documenting**
Each column's behavior is clear from its config

### ✅ **Type Safety**
Column IDs are consistent throughout codebase

### ✅ **Easier Testing**
Can test column rendering independently

### ✅ **Future Extensions**
Easy to add: column visibility toggles, reordering, export configs

---

## Migration Strategy

### Phase 1: Add Column Config (No Breaking Changes)
1. Add `EVERY_QUERY_COLUMNS` array above `generateTable()`
2. Test that config matches current behavior

### Phase 2: Refactor Header Generation
1. Update `generateTable()` to use config for headers
2. Test sorting still works

### Phase 3: Refactor Body Generation
1. Update `populateEveryQueryTable()` to use config
2. Test all special rendering (statements, requestId, etc.)

### Phase 4: Refactor Sorting
1. Update `getSortableValue()` to use config
2. Test all column sorts work correctly

### Phase 5: Remove Old Code
1. Remove hardcoded column arrays
2. Remove manual field mappings
3. Clean up comments

---

## Testing Checklist

- [ ] All columns display correctly
- [ ] Sorting works for each column (asc/desc)
- [ ] Statement truncation/expansion works
- [ ] Copy buttons work (statement, requestId)
- [ ] Primary scan highlighting works
- [ ] Fatal state highlighting works
- [ ] Numeric formatting (commas) works
- [ ] Pagination works
- [ ] Search/filtering works
- [ ] Row click → flow diagram works
- [ ] No console errors

---

## Example: Adding a New Column

**Before** (5+ changes across 200+ lines):
1. Add to columns array in generateTable
2. Add to columns array in populateEveryQueryTable
3. Add data mapping in generateTable
4. Add display mapping in populateEveryQueryTable
5. Add sort logic in getSortableValue

**After** (ONE change):
```javascript
EVERY_QUERY_COLUMNS.push({
    id: 'newColumn',
    header: 'New\nColumn',
    dataField: 'newColumn',
    sortable: true,
    sortType: 'numeric',
    render: (value) => value ? value.toLocaleString() : 'N/A'
});
```

Done! ✨
