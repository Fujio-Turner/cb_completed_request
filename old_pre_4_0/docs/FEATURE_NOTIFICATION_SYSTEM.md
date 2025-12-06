# Feature Notification System

## Overview
A centralized system for managing and displaying new feature tips and announcements to users. This system provides a consistent way to notify users about new features across different parts of the application.

---

## Architecture

### Components

1. **`FEATURE_NOTIFICATIONS`** - Configuration object storing all feature notifications
2. **`newFeatureNotification()`** - Core function to display a specific notification
3. **`showStartupFeatureNotifications()`** - Show all startup notifications
4. **`showTimelineFeatureNotifications()`** - Show timeline-specific notifications
5. **`sessionStorage`** - Tracks shown notifications per session

---

## How to Add a New Feature Notification

### Step 1: Add to FEATURE_NOTIFICATIONS Object

**Location:** `en/index.html` ~line 15324

```javascript
const FEATURE_NOTIFICATIONS = {
    'stake-line-tip': {
        message: "💡 Tip: Click on any chart to place a vertical stake line...",
        type: "info",
        duration: 15000,
        version: "3.20.0",
        trigger: "timeline-tab"
    },
    
    // Add your new feature here:
    'my-new-feature': {
        message: "🎉 New Feature: Description of what the feature does!",
        type: "success",
        duration: 12000,
        version: "3.21.0",
        trigger: "startup"  // or "timeline-tab", "onclick"
    }
};
```

### Configuration Properties

| Property | Type | Required | Description | Example Values |
|----------|------|----------|-------------|----------------|
| `message` | string | Yes | The notification text to display | `"🎉 New: Feature X is here!"` |
| `type` | string | Yes | Notification color scheme | `"info"`, `"success"`, `"warning"`, `"error"` |
| `duration` | number | Yes | Display time in milliseconds | `10000`, `15000` |
| `version` | string | Yes | Version when feature was added | `"3.20.0"`, `"3.21.0"` |
| `trigger` | string | Yes | When to show the notification | `"startup"`, `"timeline-tab"`, `"onclick"` |

### Notification Types and Colors

| Type | Background | Border | Text Color | Use Case |
|------|------------|--------|------------|----------|
| `info` | Light blue | Blue | Dark blue | Tips, general information |
| `success` | Light green | Green | Dark green | New features, achievements |
| `warning` | Light yellow | Yellow | Dark yellow/brown | Important notices, deprecations |
| `error` | Light red | Red | Dark red | Critical issues, breaking changes |

---

## Trigger Types

### 1. `"startup"` Trigger
Shows notification immediately after JSON data is parsed and app is ready.

**Use Cases:**
- Major new features
- App-wide changes
- Important announcements

**Implementation:**
Call `showStartupFeatureNotifications()` in your initialization code.

### 2. `"timeline-tab"` Trigger
Shows notification when user first accesses the Timeline tab.

**Use Cases:**
- Timeline-specific features
- Chart enhancements
- Timeline tab tips

**Implementation:**
Already integrated - automatically called when Timeline tab is activated.

### 3. `"onclick"` Trigger
Shows notification when explicitly triggered by a button/link click.

**Use Cases:**
- Feature demos
- Help buttons
- "What's New" link

**Implementation:**
```html
<button onclick="newFeatureNotification('my-feature-key', true)">
    Show Feature Tip
</button>
```

---

## API Reference

### `newFeatureNotification(featureKey, forceShow)`

Display a specific feature notification.

**Parameters:**
- `featureKey` (string, required) - Key from FEATURE_NOTIFICATIONS object
- `forceShow` (boolean, optional, default: false) - Force show even if already seen this session

**Returns:** void

**Example Usage:**

```javascript
// Show notification (respects session tracking)
newFeatureNotification('stake-line-tip');

// Force show notification (ignores session tracking - good for onclick events)
newFeatureNotification('stake-line-tip', true);
```

### `showStartupFeatureNotifications()`

Show all notifications with `trigger: "startup"`.

**Parameters:** None

**Returns:** void

**Example Usage:**

```javascript
// In your initialization code after parsing data
function finishProcessing(processedRequests) {
    // ... existing code ...
    
    // Show startup notifications
    showStartupFeatureNotifications();
}
```

### `showTimelineFeatureNotifications()`

Show all notifications with `trigger: "timeline-tab"`.

**Parameters:** None

**Returns:** void

**Example Usage:**

```javascript
// Already integrated in Timeline tab activation
case 'timeline':
    generateFilterChart(filteredRequests);
    generateTimelineChart(timelineSample);
    showTimelineFeatureNotifications(); // ✅ Already in place
    break;
```

---

## Session Tracking

### How It Works

- Uses `sessionStorage` to track which notifications have been shown
- Each notification creates a key: `feature-seen-{featureKey}`
- Tracking resets when:
  - Page is refreshed/reloaded
  - Browser tab is closed
  - Browser is closed

### Storage Keys

| Key Format | Example | Purpose |
|------------|---------|---------|
| `feature-seen-{featureKey}` | `feature-seen-stake-line-tip` | Tracks if notification was shown this session |

### Manual Control

```javascript
// Clear a specific feature (for testing)
sessionStorage.removeItem('feature-seen-stake-line-tip');

// Clear all feature notifications
Object.keys(sessionStorage).forEach(key => {
    if (key.startsWith('feature-seen-')) {
        sessionStorage.removeItem(key);
    }
});

// Force show a notification regardless of session tracking
newFeatureNotification('my-feature', true);
```

---

## Examples

### Example 1: Timeline Tab Tip (Current Implementation)

```javascript
const FEATURE_NOTIFICATIONS = {
    'stake-line-tip': {
        message: "💡 Tip: Click on any chart to place a vertical stake line that syncs across all timeline charts. Click 'Remove Stake' button to remove it.",
        type: "info",
        duration: 15000,
        version: "3.20.0",
        trigger: "timeline-tab"
    }
};

// Automatically shown when Timeline tab is first accessed
```

### Example 2: Startup Announcement

```javascript
const FEATURE_NOTIFICATIONS = {
    'new-collection-chart': {
        message: "🎉 New in v3.20.0: Collection queries chart now shows query distribution across bucket.scope.collection!",
        type: "success",
        duration: 12000,
        version: "3.20.0",
        trigger: "startup"
    }
};

// Call in finishProcessing() after data is parsed
showStartupFeatureNotifications();
```

### Example 3: Help Button (onclick)

```javascript
const FEATURE_NOTIFICATIONS = {
    'zoom-help': {
        message: "📊 How to Zoom: Drag a rectangle on any chart to zoom in. Double-click to reset. Shift+drag to pan.",
        type: "info",
        duration: 10000,
        version: "3.20.0",
        trigger: "onclick"
    }
};

// HTML button
<button onclick="newFeatureNotification('zoom-help', true)">
    How to Zoom?
</button>
```

### Example 4: Multiple Notifications

```javascript
const FEATURE_NOTIFICATIONS = {
    'stake-line-tip': {
        message: "💡 Tip: Click on any chart to place a vertical stake line...",
        type: "info",
        duration: 15000,
        version: "3.20.0",
        trigger: "timeline-tab"
    },
    'new-collection-chart': {
        message: "🎉 New: Collection queries chart available!",
        type: "success",
        duration: 12000,
        version: "3.20.0",
        trigger: "timeline-tab"
    },
    'breaking-change': {
        message: "⚠️ Important: Chart zoom behavior has changed. See docs.",
        type: "warning",
        duration: 20000,
        version: "3.20.0",
        trigger: "startup"
    }
};

// Timeline tab will show both timeline-tab notifications
// Startup will show the breaking-change notification
```

---

## Best Practices

### Message Writing

✅ **DO:**
- Keep messages concise (under 150 characters)
- Start with emoji for visual appeal
- Include actionable information
- Mention version number for major features
- Use clear, simple language

❌ **DON'T:**
- Write long paragraphs
- Use technical jargon
- Include multiple actions in one notification
- Overwhelm users with too many notifications at once

### Timing

- **Startup:** Use sparingly (max 1-2 critical notifications)
- **Timeline tab:** Perfect for chart-related tips
- **onclick:** Great for help buttons and feature demos
- **Duration:** 10-15 seconds for tips, 20+ for critical warnings

### Versioning

- Always include version number in config
- Update version when modifying existing notifications
- Use semantic versioning (major.minor.patch)
- Document changes in release notes

### Testing

```javascript
// Test notification in browser console
newFeatureNotification('stake-line-tip', true);

// Clear all and re-test
Object.keys(sessionStorage).forEach(k => {
    if (k.startsWith('feature-seen-')) sessionStorage.removeItem(k);
});

// Verify notification config
console.log(FEATURE_NOTIFICATIONS);
```

---

## Migration from Old System

### Before (Issue #151 Initial Implementation):

```javascript
let hasShownStakeTip = false;

function showStakeTipIfFirstTime() {
    if (hasShownStakeTip) return;
    hasShownStakeTip = true;
    
    setTimeout(() => {
        showToast("💡 Tip: ...", "info", 15000);
    }, 800);
}
```

### After (Current System):

```javascript
const FEATURE_NOTIFICATIONS = {
    'stake-line-tip': {
        message: "💡 Tip: ...",
        type: "info",
        duration: 15000,
        version: "3.20.0",
        trigger: "timeline-tab"
    }
};

// Just call the helper function
showTimelineFeatureNotifications();
```

### Benefits:
- ✅ Centralized configuration
- ✅ Easier to add new notifications
- ✅ Version tracking built-in
- ✅ Multiple trigger types
- ✅ Consistent API
- ✅ Better session management

---

## Troubleshooting

### Notification not showing?

1. **Check sessionStorage:** Is `feature-seen-{key}` already set?
   ```javascript
   console.log(sessionStorage.getItem('feature-seen-stake-line-tip'));
   ```

2. **Verify configuration:** Does the feature key exist?
   ```javascript
   console.log(FEATURE_NOTIFICATIONS['stake-line-tip']);
   ```

3. **Check trigger:** Is the trigger type correct for your use case?

4. **Force show:** Try with `forceShow = true`
   ```javascript
   newFeatureNotification('stake-line-tip', true);
   ```

### Notification showing too frequently?

- Check if trigger is `"startup"` when it should be `"timeline-tab"`
- Verify sessionStorage is working (not disabled in browser)

### Want to disable a notification temporarily?

```javascript
// Comment out the notification
const FEATURE_NOTIFICATIONS = {
    // 'old-feature': { ... },  // Disabled temporarily
    'new-feature': { ... }
};
```

---

## Files Modified

| File | Location | Purpose |
|------|----------|---------|
| `en/index.html` | ~15321 | FEATURE_NOTIFICATIONS configuration |
| `en/index.html` | ~15347 | newFeatureNotification() function |
| `en/index.html` | ~15371 | showStartupFeatureNotifications() function |
| `en/index.html` | ~15381 | showTimelineFeatureNotifications() function |
| `en/index.html` | ~15300 | Timeline tab integration |

---

## Related Issues

- Issue #151: Make stake creation more intuitive for first-time users

---

**Last Updated:** 2025-01-11  
**Version:** 3.20.0
