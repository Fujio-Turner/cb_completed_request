# Copy JSON Button - Visual Reference

## Button Placement

The copy button appears in the top-right corner of both JSON textareas:

```
┌──────────────────────────────────────────────┐
│ Completed Requests                           │
├──────────────────────────────────────────────┤
│ ┌─ Upload JSON File ─┐                       │
│ │  [Upload Button]   │                       │
│ └────────────────────┘                       │
│                                               │
│          OR                                   │
│                                               │
│ ┌────────────────────────────────────────┐   │
│ │ Paste your JSON output...     [📋 Copy]│   │
│ │                                        │   │
│ │                                        │   │
│ │ {                                      │   │
│ │   "clientContextID": "abc123",        │   │
│ │   "statement": "SELECT...",           │   │
│ │   ...                                  │   │
│ │ }                                      │   │
│ │                                        │   │
│ └────────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

## Button States

### 1. Default State
```
┌──────────┐
│ 📋 Copy  │
└──────────┘
```
- Gray background (btn-standard style)
- Cursor: pointer
- Tooltip: "Copy raw JSON to clipboard"

### 2. On Click (Success)
```
┌────────────┐
│ ✅ Copied! │ (green background)
└────────────┘
```
- Green background (#4CAF50)
- Text changes for 2 seconds
- Toast notification appears

### 3. Empty Textarea (Warning)
```
┌──────────┐
│ 📋 Copy  │ (stays same)
└──────────┘

⚠️ No JSON content to copy
```
- Button doesn't change
- Warning toast appears

## Toast Notification

When copy succeeds:

```
┌────────────────────────────┐
│ ✅ Copied to clipboard!    │
└────────────────────────────┘
```

Appears in the top-right corner for 3 seconds.

## Responsive Behavior

The button stays in the top-right corner even as the textarea scrolls:

```
┌────────────────────────────────────────┐
│ Large JSON content...         [📋 Copy]│
│                                        │
│ {                                      │
│   "statement": "very long...",         │
│   "plan": {                            │
│     "#operator": "Authorize",          │
│     "~child": {                        │
│       "#operator": "Sequence",         │
│       "~children": [                   │
│         ...                            │ ← User scrolls here
│       ]                                │
│     }                                  │
│   }                                    │
│ }                                      │
└────────────────────────────────────────┘
```

Button remains visible at top-right (z-index: 10).

## Integration with Existing UI

Both JSON input areas now have copy buttons:

1. **Left Box**: Completed Requests JSON
   - Button ID: `copy-json-input-btn`
   - Textarea ID: `json-input`

2. **Right Box**: Indexes JSON
   - Button ID: `copy-index-json-btn`
   - Textarea ID: `indexJsonInput`

## CSS Styling

```css
button {
    position: absolute;
    top: 8px;
    right: 8px;
    padding: 6px 12px;
    font-size: 12px;
    z-index: 10;
}
```

## Keyboard Accessibility

- Button is focusable via Tab key
- Can be activated with Enter or Space
- Has descriptive tooltip for screen readers

## Example Usage Flow

1. User pastes large JSON (2000+ queries)
2. User clicks "📋 Copy" button
3. Button changes to "✅ Copied!" with green background
4. Toast shows: "✅ Copied to clipboard!"
5. User can paste JSON elsewhere (e.g., text editor, Slack)
6. After 2 seconds, button returns to "📋 Copy"
