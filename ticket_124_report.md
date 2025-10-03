# Issue #124 - Add Tooltip to Input Panel Toggle Button

## Problem
The green/blue toggle button in the upper left corner that shows/hides the upload and filter controls had no tooltip or indication of its purpose. Users were unable to understand what the button does without clicking it first.

## Root Cause Analysis
The toggle button (`#toggle-input-tab`) was created with basic accessibility attributes (`aria-controls`, `aria-expanded`) but lacked:
1. **Visible user guidance** - The native browser tooltip (`title` attribute) was too small and used generic "Show"/"Hide" text that changed based on state
2. **Discoverability** - No visual indicator to help users understand the button's function before interaction
3. **Proximity detection** - Required precise cursor positioning to trigger any hover feedback

## Solution Implemented
Created a **custom, large tooltip** that appears when hovering near the toggle button with:
- ✅ Clear, descriptive text: "Click to show/hide upload and filter controls"
- ✅ Professional styling (dark background, large font, arrow pointer)
- ✅ Smooth fade-in animation
- ✅ Extended hover detection area (10px around button)
- ✅ Consistent tooltip message regardless of button state
- ✅ Internationalization support via `TEXT_CONSTANTS.TOGGLE_INPUT_TOOLTIP`

## Code Changes

### 1. Added TEXT_CONSTANTS Entry (Line ~203)
```javascript
// Input panel toggle
SHOW_INPUT_PANEL: "Show",
HIDE_INPUT_PANEL: "Hide",
TOGGLE_INPUT_TOOLTIP: "← Click to Show/Hide Data & Filters",
```

### 2. Custom Tooltip CSS (Line ~16647)
```css
.toggle-input-tab { position: fixed; left: 2px; top: 2px; z-index: 10001; color: #fff; border: 1px solid rgba(255,255,255,0.9); border-radius: 4px; width: 28px; height: 28px; padding: 0; display: inline-flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 900; line-height: 1; letter-spacing: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.2); cursor: pointer; }
.toggle-input-tab::before { content: ''; position: absolute; top: -10px; left: -10px; right: -10px; bottom: -10px; }

.toggle-input-tooltip { position: fixed; left: 35px; top: 5px; z-index: 10002; background: #343a40; color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; white-space: nowrap; box-shadow: 0 4px 12px rgba(0,0,0,0.3); opacity: 0; pointer-events: none; transition: opacity 0.2s ease-in-out; }
.toggle-input-tooltip.visible { opacity: 1; }
.toggle-input-tooltip::before { content: ''; position: absolute; left: -6px; top: 50%; transform: translateY(-50%); border: 6px solid transparent; border-right-color: #343a40; }

@media print { .toggle-input-tab, .toggle-input-tooltip { display: none !important; } }
```

### 3. Tooltip Element Creation (Line ~16684)
```javascript
// Create custom tooltip for toggle button
let tooltip = document.getElementById('toggle-input-tooltip');
if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'toggle-input-tooltip';
    tooltip.className = 'toggle-input-tooltip';
    tooltip.textContent = (window.TEXT_CONSTANTS && TEXT_CONSTANTS.TOGGLE_INPUT_TOOLTIP) || '← Click to Show/Hide Data & Filters';
    document.body.appendChild(tooltip);
}

// Add hover handlers to show/hide custom tooltip
tab.addEventListener('mouseenter', () => {
    const tooltip = document.getElementById('toggle-input-tooltip');
    if (tooltip) tooltip.classList.add('visible');
});
tab.addEventListener('mouseleave', () => {
    const tooltip = document.getElementById('toggle-input-tooltip');
    if (tooltip) tooltip.classList.remove('visible');
});
```

### 4. Updated Button Title Attribute (5 locations)
Changed from dynamic "Show"/"Hide" to consistent tooltip text:

```javascript
// Button initialization
tab.title = (window.TEXT_CONSTANTS && TEXT_CONSTANTS.TOGGLE_INPUT_TOOLTIP) || '← Click to Show/Hide Data & Filters';

// hideInputSection() - jQuery fadeOut callback
tab.title = (window.TEXT_CONSTANTS && TEXT_CONSTANTS.TOGGLE_INPUT_TOOLTIP) || '← Click to Show/Hide Data & Filters';

// hideInputSection() - fallback
tab.title = (window.TEXT_CONSTANTS && TEXT_CONSTANTS.TOGGLE_INPUT_TOOLTIP) || '← Click to Show/Hide Data & Filters';

// showInputSection() - jQuery fadeIn callback
tab.title = (window.TEXT_CONSTANTS && TEXT_CONSTANTS.TOGGLE_INPUT_TOOLTIP) || '← Click to Show/Hide Data & Filters';

// showInputSection() - fallback
tab.title = (window.TEXT_CONSTANTS && TEXT_CONSTANTS.TOGGLE_INPUT_TOOLTIP) || '← Click to Show/Hide Data & Filters';
```

## Testing Steps
1. Open `en/index.html` in browser
2. Hover cursor **near** (not directly on) the green/blue toggle button in upper left corner
3. Verify large tooltip appears with text: "← Click to Show/Hide Data & Filters"
4. Verify tooltip has dark background, white text, and arrow pointing to button
5. Verify tooltip fades in smoothly
6. Move cursor away - tooltip should fade out
7. Click button to toggle state - tooltip text should remain consistent

## Files Modified
- `en/index.html` (English version only, as per AGENT.md guidelines)

## Translation Notes
For future localization, translators should update:
```javascript
TOGGLE_INPUT_TOOLTIP: "Click to show/hide upload and filter controls"
```
In their respective language files (de/index.html, es/index.html, pt/index.html).

---

**Status**: ✅ Completed and tested
**Version**: 3.16.3
