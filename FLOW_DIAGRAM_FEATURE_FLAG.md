# Flow Diagram Feature Flag Documentation

## Overview
The query flow diagram in the "Every Query" tab now has **two versions**:
- **Original (Stable)** - Default, linear flow diagram 
- **New (Hierarchical)** - Feature-flagged version with improved visualization

## How to Use

### Default Behavior (Original Version)
Simply open the application normally:
```
http://localhost:8000/en/index.html
```

### Enable New Hierarchical Version
Add `?dev=true` to the URL:
```
http://localhost:8000/en/index.html?dev=true
```

## Feature Comparison

### Original Version (Default)
- ✅ **Stable and tested**
- ✅ Simple linear flow
- ✅ Shows all operators in sequence
- ✅ Works with pan/zoom controls
- ❌ Doesn't separate subqueries visually
- ❌ Doesn't show nested operator relationships

### New Hierarchical Version (`?dev=true`)
- 🔬 **Experimental**
- ✅ **Separates WITH subqueries** - Shows them in a blue container at the top
- ✅ **NestedLoopJoin visualization** - Shows join operators with their child scans in a dashed container
- ✅ **Better hierarchy** - Respects the actual operator tree structure
- ✅ Pan/zoom/flip controls
- ⚠️ May need additional refinement based on testing

## New Features in Hierarchical Version

### 1. WITH Subquery Separation
```
📦 WITH Subquery 1 (executed first)
[Blue bordered container with subquery operators]

↓ Main Query ↓

[Main query operators]
```

### 2. NestedLoopJoin Container
```
╔══ NestedLoopJoin ══╗
║    ↓ Joins with ↓   ║
║   [ExpressionScan]   ║
╚═════════════════════╝
```

### 3. Hierarchical Tree Traversal
- Respects `~child` and `~children` relationships
- Skips `Sequence` operators (orchestration only)
- Preserves operator nesting

## Implementation Details

### Code Structure
```javascript
// Feature flag detection
function isDevMode() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('dev') === 'true';
}

// Dispatcher - switches between versions
function generateFlowDiagram(request) {
    if (isDevMode()) {
        generateFlowDiagram_New(request);  // Hierarchical version
    } else {
        generateFlowDiagram_Original(request);  // Stable version
    }
}
```

### Functions in New Version
- `createOperatorBubble()` - Creates styled operator bubbles
- `renderOperatorTree()` - Recursive tree traversal with special handling for:
  - `Sequence` - Skipped
  - `NestedLoopJoin`, `HashJoin`, `HashNest` - Rendered in dashed container
  - `With` - Triggers subquery separation
- `generateFlowDiagram_New()` - Main entry point for new version

## Testing Checklist

When testing the new version with `?dev=true`:

- [ ] Subqueries appear at the top in blue containers
- [ ] Main query separator appears between subquery and main query
- [ ] NestedLoopJoin shows child operators inside dashed container
- [ ] Pan/zoom controls work
- [ ] Flip button works
- [ ] Click on operators opens modal with stats
- [ ] "View Detailed Execution Plan" button works
- [ ] Complex queries with multiple subqueries render correctly
- [ ] No JavaScript errors in console

## Known Issues

The new version is experimental and may need refinement for:
- Very deep operator nesting
- Multiple join operators in sequence
- Edge cases with unusual operator combinations

## Rollout Strategy

1. **Phase 1 (Current)**: Feature flag in URL (`?dev=true`)
2. **Phase 2**: After testing, add UI toggle button
3. **Phase 3**: Make new version default, keep old version as fallback
4. **Phase 4**: Remove old version if new version is stable

## Example Query Plans to Test

### Test Case 1: WITH Clause
Use the provided query plan with:
- WITH clause creating `bigTable`
- NestedLoopJoin with ExpressionScan
- Multiple index scans

### Test Case 2: Simple Query
Test with a basic SELECT to ensure backwards compatibility

### Test Case 3: Complex Nested Joins
Queries with multiple join levels

## Feedback

When testing, please note:
1. Does the hierarchy make sense?
2. Are the visual containers helpful or distracting?
3. Is the separation of subqueries clear?
4. Any performance issues with large plans?
