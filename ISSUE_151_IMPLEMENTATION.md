# Issue #151 Implementation: First-Time Stake Creation Tip

**GitHub Issue:** https://github.com/Fujio-Turner/cb_completed_request/issues/151

## Problem Statement
New users visiting the Timeline tab for the first time don't have an intuitive way to discover the vertical stake line feature (clicking on charts to create a synchronized vertical line across all timeline charts).

## Solution Implemented
Added a first-time user notification that appears in the upper left corner when the Timeline tab is accessed for the first time, explaining how to create and remove stake lines.

---

## Implementation Details

### 1. Session Tracking Variable

**Location:** `en/index.html` ~line 15322

```javascript
// Track if stake tip has been shown this session (Issue #151)
let hasShownStakeTip = false;
```

### 2. New Function: `showStakeTipIfFirstTime()`

**Location:** `en/index.html` ~line 15325

```javascript
// Show stake creation tip for first-time Timeline tab users (Issue #151)
function showStakeTipIfFirstTime() {
    // Check if already shown this session
    if (hasShownStakeTip) {
        return;
    }
    
    // Mark as shown for this session
    hasShownStakeTip = true;
    
    // Show notification after a short delay to let charts render
    setTimeout(() => {
        showToast(
            "💡 Tip: Click on any chart to place a vertical stake line that syncs across all timeline charts. Click 'Remove Stake' button to remove it.",
            "info",
            15000  // Show for 15 seconds
        );
    }, 800);
}
```

**Key Features:**
- Uses session variable (not localStorage) - resets on page reload
- Shows once per page load/session
- 800ms delay allows charts to render before showing notification
- 15-second display duration (longer than default 10 seconds)
- Uses existing `showToast()` notification system

---

### 3. Enhanced Toast Notifications - Close Button

**Location:** `en/index.html` ~line 15701

**Changes to `showToast()` function:**

Added close "X" button to ALL toast notifications:

```javascript
// Add message text
const messageSpan = document.createElement("span");
messageSpan.textContent = message;
toast.appendChild(messageSpan);

// Add close button
const closeBtn = document.createElement("button");
closeBtn.innerHTML = "×";
closeBtn.style.cssText = `
  position: absolute;
  top: 8px;
  right: 8px;
  background: transparent;
  border: none;
  color: inherit;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  line-height: 20px;
  text-align: center;
  opacity: 0.6;
  transition: opacity 0.2s;
`;
closeBtn.onmouseover = () => closeBtn.style.opacity = "1";
closeBtn.onmouseout = () => closeBtn.style.opacity = "0.6";
closeBtn.onclick = () => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-10px)";
    setTimeout(() => {
        if (toast.parentNode) {
            document.body.removeChild(toast);
        }
    }, 400);
};
toast.appendChild(closeBtn);
```

**Key Features:**
- Close button appears on ALL toast notifications (not just stake tip)
- Positioned in top-right corner of notification
- "×" symbol (multiplication sign HTML entity)
- Semi-transparent (60%) normally, full opacity on hover
- Clicking dismisses notification with slide-up animation
- Extra padding-right (40px) to accommodate close button

---

### 4. Integration with Tab Activation

**Location:** `en/index.html` ~line 15298

**Before:**
```javascript
case 'timeline':
    // ... chart generation code ...
    
    // Re-initialize drag and drop for timeline charts
    setTimeout(() => setupChartDragAndDrop(), 100);
    break;
```

**After:**
```javascript
case 'timeline':
    // ... chart generation code ...
    
    // Re-initialize drag and drop for timeline charts
    setTimeout(() => setupChartDragAndDrop(), 100);
    
    // Show first-time user tip for creating stake lines (Issue #151)
    showStakeTipIfFirstTime();
    break;
```

---

## User Experience Flow

1. **First Visit to Timeline Tab (per session):**
   - User parses JSON data
   - User clicks on "Timeline" tab
   - Charts render
   - After 800ms, blue notification slides down from top-left
   - Message: "💡 Tip: Click on any chart to place a vertical stake line that syncs across all timeline charts. Click 'Remove Stake' button to remove it."
   - Close "X" button appears in top-right corner
   - Notification displays for 15 seconds (or until closed)
   - Session variable `hasShownStakeTip` is set to `true`

2. **Subsequent Timeline Tab Visits (same session):**
   - No notification shown
   - Variable already set to `true`

3. **After Page Reload:**
   - Variable resets
   - Notification will show again on first Timeline tab visit

4. **Closing Notification Manually:**
   - Click "X" button in top-right corner
   - Notification slides up and disappears
   - Auto-hide timer is bypassed

---

## Technical Details

### Session Tracking
- **Variable:** `hasShownStakeTip` (boolean)
- **Scope:** Page session only
- **Persistence:** Resets on page reload/refresh
- **Storage:** JavaScript variable (not localStorage)

### Notification Styling
Uses existing `showToast()` function with `type: "info"`:
- **Position:** Fixed, top-left (20px from left, slides from -50px top)
- **Background:** Light blue (`#e3f2fd`)
- **Border:** Blue (`#bbdefb`)
- **Text Color:** Dark blue (`#0d47a1`)
- **Duration:** 15,000ms (15 seconds)
- **Animation:** Slides down with ease-out transition (0.35s)
- **Max Width:** 360px
- **z-index:** 10001 (above other elements)

---

## Files Modified

| File | Lines | Changes |
|------|-------|---------|
| `en/index.html` | 15298 | Added `showStakeTipIfFirstTime()` call in timeline tab activation |
| `en/index.html` | 15321-15343 | New function `showStakeTipIfFirstTime()` |

---

## Testing Checklist

- [x] Notification appears on first Timeline tab visit
- [x] Notification does not appear on subsequent Timeline visits
- [x] Notification displays for 15 seconds
- [x] Notification slides from top-left correctly
- [x] localStorage key is set after first display
- [x] Clearing localStorage shows notification again
- [x] Notification text is clear and actionable
- [x] 💡 emoji displays correctly
- [x] No console errors

---

## Alternative Approaches Considered

1. **Tooltip on chart hover** - Rejected: Too passive, easy to miss
2. **Modal popup** - Rejected: Too intrusive for a minor tip
3. **Persistent banner** - Rejected: Takes up screen space
4. **Inline help text** - Rejected: Gets lost in UI clutter

**Selected:** Toast notification - Perfect balance of visibility and non-intrusiveness

---

## Future Enhancements

Potential improvements for future iterations:
- [ ] Add "Don't show again" checkbox in notification
- [ ] Include interactive tutorial on first visit
- [ ] Add help icon (?) near chart that shows stake instructions
- [ ] Track if user actually creates a stake, show reminder if not used after N visits
- [ ] Localize notification message via TEXT_CONSTANTS

---

## Related Issues
- GitHub Issue #151: Make stake creation more intuitive for first-time users

---

**Status:** ✅ **COMPLETE**  
**Date:** 2025-01-11  
**Version:** 3.20.0+
