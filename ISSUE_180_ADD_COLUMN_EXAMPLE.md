# How to Add a New Column to Every Query Table

## ✨ **Now It's Easy!**

After the refactoring, adding a new column to the Every Query table requires **only ONE change** instead of 5+.

## Example: Adding a "Query Duration Rank" Column

### Step 1: Add Column Configuration

Find the `EVERY_QUERY_COLUMNS` array in [en/index.html](file:///Users/fujioturner/Documents/git_folders/fujio-turner/cb_completed_request/en/index.html) (around line 4444) and add a new object:

```javascript
const EVERY_QUERY_COLUMNS = [
    // ... existing columns ...
    {
        id: 'durationRank',
        header: 'Duration\nRank',
        dataField: null,
        sortable: true,
        sortType: 'numeric',
        getValue: (request, index) => {
            // Custom logic to calculate rank
            return index + 1; // Simple example
        },
        render: (value) => {
            // Custom rendering with a badge
            const color = value <= 10 ? '#dc3545' : value <= 50 ? '#ffc107' : '#28a745';
            return `<span style="color: ${color}; font-weight: bold;">#${value}</span>`;
        }
    }
];
```

### That's it! ✅

The column will automatically:
- ✅ Appear in the table header
- ✅ Display data in table rows
- ✅ Support sorting (click on header)
- ✅ Work with pagination
- ✅ Work with search/filtering
- ✅ Use custom rendering

## Column Configuration Options

| Property | Required | Description | Example |
|----------|----------|-------------|---------|
| `id` | ✅ Yes | Unique column identifier | `'elapsedTime'` |
| `header` | ✅ Yes | Display name (use `\n` for line breaks) | `'elapsed\nTime'` |
| `dataField` | No | Field name in data object | `'elapsedTime'` |
| `sortable` | No | Whether column can be sorted | `true` |
| `sortType` | No | How to sort: `numeric`, `time`, `date`, `percent`, `boolean`, `string`, `custom` | `'time'` |
| `sortFn` | No | Custom sort function (only if `sortType: 'custom'`) | `(value) => ...` |
| `width` | No | Column width | `'300px'` |
| `maxWidth` | No | Maximum column width | `'300px'` |
| `getValue` | No | Function to extract/calculate value from request data | `(request, index) => ...` |
| `render` | No | Custom rendering function for table cell | `(value, td, rowData, globalIndex) => ...` |

## Real-World Examples

### Simple Text Column
```javascript
{
    id: 'newField',
    header: 'New Field',
    dataField: 'newField',
    sortable: true,
    sortType: 'string',
    getValue: (request) => request.newField || 'N/A',
    render: (value) => value
}
```

### Numeric Column with Formatting
```javascript
{
    id: 'bytesProcessed',
    header: 'Bytes\nProcessed',
    dataField: 'bytesProcessed',
    sortable: true,
    sortType: 'numeric',
    getValue: (request) => request.bytesProcessed || 0,
    render: (value) => {
        const num = Number(value);
        return isNaN(num) ? 'N/A' : num.toLocaleString();
    }
}
```

### Column with Conditional Styling
```javascript
{
    id: 'errorCount',
    header: 'Error\nCount',
    dataField: 'errorCount',
    sortable: true,
    sortType: 'numeric',
    getValue: (request) => request.errorCount || 0,
    render: (value, td) => {
        if (value > 0) {
            td.style.backgroundColor = '#ffebee';
            td.style.color = '#c62828';
            td.style.fontWeight = 'bold';
        }
        return value;
    }
}
```

### Column with Complex HTML Rendering
```javascript
{
    id: 'optimizationScore',
    header: 'Optimization\nScore',
    dataField: null,
    sortable: true,
    sortType: 'numeric',
    getValue: (request) => {
        // Calculate score based on various metrics
        const score = calculateOptimizationScore(request);
        return score;
    },
    render: (value) => {
        const color = value >= 80 ? 'green' : value >= 50 ? 'orange' : 'red';
        const stars = '★'.repeat(Math.floor(value / 20));
        return `
            <div style="text-align: center;">
                <div style="color: ${color}; font-weight: bold;">${value}%</div>
                <div style="color: gold;">${stars}</div>
            </div>
        `;
    }
}
```

## Benefits

### Before Refactoring (Multiple Changes Required)
1. ❌ Add to columns array in `generateTable()` (line ~4452)
2. ❌ Add to columns array in `populateEveryQueryTable()` (line ~4629)
3. ❌ Add data extraction logic in `generateTable()` (line ~4532)
4. ❌ Add display mapping in `populateEveryQueryTable()` (line ~4666)
5. ❌ Add sorting logic in `getSortableValue()` (line ~3946)
6. ❌ Add special rendering if needed (line ~4687)

### After Refactoring (One Change)
1. ✅ Add one object to `EVERY_QUERY_COLUMNS` array

**Result:** 90% less code changes, 100% less chance of bugs! 🎉

## Testing

After adding a new column:

1. Open `en/index.html` in browser
2. Load sample data
3. Navigate to "Every Query" tab
4. Verify:
   - [ ] Column appears in header
   - [ ] Data displays correctly
   - [ ] Sorting works (click header)
   - [ ] Pagination works
   - [ ] Search/filter works
   - [ ] Custom rendering works (if applicable)

## Notes

- Column order in the table matches the order in the `EVERY_QUERY_COLUMNS` array
- Column `id` must be unique and should use camelCase
- Use `\n` in `header` for multi-line headers
- The `render` function can return HTML string or plain text
- The `getValue` function has access to `(request, index)` parameters
- The `render` function has access to `(value, td, rowData, globalIndex)` parameters
