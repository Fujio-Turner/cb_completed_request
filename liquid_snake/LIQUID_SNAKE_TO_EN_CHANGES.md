# Changes Applied to /liquid_snake/index.html

This document tracks changes made to `/liquid_snake/index.html` that need to be applied to `/en/index.html` later.

## Date: 2025-11-17

### Feature: Raw Record Fullscreen Viewer + Remove Raw Record Tab

**Description**: 
1. Modified the requestId button in the "Every Query" tab to open a fullscreen overlay for viewing the complete JSON record
2. Moved the View button below the requestId to keep the table column narrow
3. Removed the "Raw Record" tab entirely since the fullscreen viewer provides the same functionality with better UX

---

### Change 1: Add Raw Record Fullscreen Overlay HTML

**File**: `/liquid_snake/index.html`

**Location**: After the AI Preview overlay (around line 2150, before the AI Analysis View Overlay)

**Action**: Add the following HTML code:

```html
    <!-- Raw Record Fullscreen Overlay -->
    <div id="raw-record-overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10001; overflow: hidden;">
        <div style="position: relative; width: 95%; height: 95%; margin: 2.5%; background: white; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); display: flex; flex-direction: column;">
            <!-- Header -->
            <div style="background: #f5f5f5; padding: 15px 20px; border-bottom: 1px solid #ddd; border-radius: 8px 8px 0 0; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h2 style="margin: 0; font-size: 18px; color: #333;">📋 Raw Record - Complete JSON</h2>
                    <span id="raw-record-overlay-info" style="color: #666; font-size: 12px; margin-top: 4px; display: inline-block;"></span>
                </div>
                <button onclick="closeRawRecordOverlay()" style="background: #dc3545; color: white; border: none; padding: 8px 16px; font-size: 14px; font-weight: bold; cursor: pointer; border-radius: 4px;">
                    ✕ Close
                </button>
            </div>
            
            <!-- JSON Content Container -->
            <div style="flex: 1; padding: 15px; overflow-y: auto; position: relative; background: white;">
                <button id="copy-raw-record-overlay-btn" 
                        class="btn-standard" 
                        onclick="copyRawRecordOverlayJSON()"
                        style="position: absolute; top: 8px; right: 8px; padding: 6px 12px; font-size: 12px; z-index: 10;"
                        title="Copy entire JSON record to clipboard">
                    📋 Copy JSON
                </button>
                <pre id="raw-record-overlay-json" style="white-space: pre-wrap; word-break: break-word; margin: 0; font-family: 'Courier New', monospace; font-size: 13px; line-height: 1.6; color: #333;"></pre>
            </div>
        </div>
    </div>
```

**Notes**:
- The z-index is 10001 to appear above other overlays
- Uses a light theme matching the "Raw Record" tab (white background, not dark)
- The overlay is 95% width/height with 2.5% margin for better visibility
- Copy button is positioned in the top-right corner, matching the "Raw Record" tab layout
- Request ID and size info moved to the header (below title)

---

### Change 2: Modify requestId Button in Table Column

**File**: `/liquid_snake/assets/js/main-legacy.js`

**Location**: Around line 3365 in the `EVERY_QUERY_COLUMNS` array, requestId column render function

**Before**:
```javascript
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
```

**After**:
```javascript
                render: (value) => {
                    const safeId = String(value);
                    return `
                        <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 4px;">
                            <code style="font-size:11px; word-break: break-all;">${escapeHtml(safeId)}</code>
                            <button data-id="${escapeHtml(safeId)}" 
                                    onclick="openRawRecordFullscreen(this.dataset.id, event)" 
                                    class="btn-standard" 
                                    style="padding: 4px 8px; font-size: 11px;">👁️ View</button>
                        </div>
                    `;
                }
```

**Changes**:
- Wrapped content in a flex column container to stack the requestId and button vertically
- Added `word-break: break-all` to the code element to handle long requestIds
- Changed `onclick` from `copyRequestId()` to `openRawRecordFullscreen()`
- Changed button text from `${TEXT_CONSTANTS.COPY}` to `👁️ View`
- Made button smaller (`padding: 4px 8px; font-size: 11px`) to fit better below the ID

---

### Change 3: Add JavaScript Functions for Fullscreen Overlay

**File**: `/liquid_snake/assets/js/main-legacy.js`

**Location**: After the `copyRequestId()` function (around line 20140)

**Action**: Add the following three functions:

```javascript
        /**
         * Open Raw Record in fullscreen overlay
         * @param {string} reqId - Request ID to display
         * @param {Event} event - Click event to stop propagation
         */
        function openRawRecordFullscreen(reqId, event) {
            Logger.debug(`[Raw Record] 👁️ Opening fullscreen for requestId: ${reqId}`);
            
            if (event && event.stopPropagation) {
                event.stopPropagation();
            }
            
            if (!reqId) {
                Logger.error('[Raw Record] ❌ No requestId provided');
                return;
            }
            
            // Find the request record
            const record = findRequestById(reqId);
            if (!record) {
                Logger.error(`[Raw Record] ❌ Request not found: ${reqId}`);
                showToast('Request ID not found', 'error');
                return;
            }
            
            // Get overlay elements
            const overlay = document.getElementById('raw-record-overlay');
            const jsonPre = document.getElementById('raw-record-overlay-json');
            const info = document.getElementById('raw-record-overlay-info');
            
            if (!overlay || !jsonPre) {
                Logger.error('[Raw Record] ❌ Overlay elements not found');
                return;
            }
            
            // Format and display JSON
            const jsonString = JSON.stringify(record, null, 2);
            jsonPre.textContent = jsonString;
            
            // Update info display
            if (info) {
                const sizeBytes = new Blob([jsonString]).size;
                const sizeKB = (sizeBytes / 1024).toFixed(2);
                info.textContent = `Request ID: ${reqId} | Size: ${sizeKB} KB (${sizeBytes.toLocaleString()} bytes)`;
            }
            
            // Show overlay
            overlay.style.display = 'block';
            
            // Add ESC key handler
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    closeRawRecordOverlay();
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);
            
            // Close on overlay click (outside content area)
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    closeRawRecordOverlay();
                }
            });
            
            Logger.info(`[Raw Record] ✅ Fullscreen opened for requestId: ${reqId}`);
        }

        /**
         * Close Raw Record fullscreen overlay
         */
        function closeRawRecordOverlay() {
            Logger.debug('[Raw Record] ✕ Closing fullscreen overlay');
            
            const overlay = document.getElementById('raw-record-overlay');
            if (overlay) {
                overlay.style.display = 'none';
            }
        }

        /**
         * Copy Raw Record JSON from overlay to clipboard
         */
        function copyRawRecordOverlayJSON() {
            Logger.debug('[Raw Record] 📋 Copying JSON to clipboard');
            
            const jsonPre = document.getElementById('raw-record-overlay-json');
            if (!jsonPre || !jsonPre.textContent) {
                Logger.error('[Raw Record] ❌ No JSON content to copy');
                showToast('No content to copy', 'error');
                return;
            }
            
            navigator.clipboard.writeText(jsonPre.textContent).then(() => {
                Logger.info('[Raw Record] ✅ JSON copied to clipboard');
                showToast('JSON copied to clipboard!', 'success');
            }).catch((err) => {
                Logger.error('[Raw Record] ❌ Failed to copy:', err);
                showToast('Failed to copy to clipboard', 'error');
            });
        }
```

**Notes**:
- `openRawRecordFullscreen()`: Opens the fullscreen overlay with the request data
- Includes ESC key support to close the overlay
- Includes click-outside-to-close functionality
- `closeRawRecordOverlay()`: Closes the overlay
- `copyRawRecordOverlayJSON()`: Copies the JSON to clipboard from the overlay

---

### Change 4: Remove Raw Record Tab

**File**: `/liquid_snake/index.html`

**Location**: Tab navigation (around line 384) and tab content section (around line 1782)

**Action**: Remove the Raw Record tab from both the navigation and content sections

**Remove from navigation**:
```html
<!-- REMOVE THIS -->
<li role="tab">
    <a href="#whole-record" aria-controls="whole-record" tabindex="0">Raw Record</a>
</li>
```

**Remove from content**:
```html
<!-- REMOVE THIS ENTIRE SECTION -->
<!-- Whole Record Tab Content -->
<div id="whole-record" data-report-section="whole-record" style="padding: 15px;">
    <div class="background-f5 padding-15 margin-bottom-10 border-radius-5 border-1-ddd">
        <label for="whole-record-request-id-input" class="font-bold-margin-right" style="margin-right:8px;">Request ID</label>
        <input type="text" id="whole-record-request-id-input" placeholder="" class="form-input" style="width:320px;" />
        <button id="whole-record-load-btn" class="btn-standard" onclick="loadWholeRecordFromInput()">Load</button>
        <span class="color-666 font-size-12 margin-left-10">Tip: To get a requestId, go to the "Every Query" tab and look at the far-right column. Copy the requestId and paste it here. You can also open with #requestId=... in the URL.</span>
    </div>
    <div class="background-white padding-15 border-1-ddd" style="min-height:200px; overflow-x:auto; overflow-y:auto; position: relative;">
        <button id="copy-whole-record-btn" 
                class="btn-standard" 
                onclick="copyWholeRecordJson()"
                style="position: absolute; top: 8px; right: 8px; padding: 6px 12px; font-size: 12px; z-index: 10;"
                title="Copy entire JSON record to clipboard">
            📋 Copy JSON
        </button>
        <pre id="whole-record-json" style="white-space: pre-wrap; word-break: break-word; margin:0; overflow-x:auto; overflow-y:auto;"></pre>
    </div>
</div>
```

**Notes**:
- The Raw Record tab is now redundant since the fullscreen viewer provides the same functionality
- Users can click the "👁️ View" button in the Every Query table to view raw records
- The old JavaScript functions (`loadWholeRecordFromInput`, `copyWholeRecordJson`, etc.) can remain for backward compatibility if needed

---

## Testing Checklist

When applying these changes to `/en/index.html`, verify:

- [ ] The "Raw Record" tab has been removed from the navigation
- [ ] The "Raw Record" tab content section has been removed
- [ ] The requestId column in "Every Query" tab shows the View button BELOW the ID (not beside it)
- [ ] The requestId column is narrower due to vertical layout
- [ ] Long requestIds wrap properly with `word-break: break-all`
- [ ] Clicking the "👁️ View" button opens the fullscreen overlay
- [ ] The fullscreen overlay displays the complete JSON record with light theme (white background)
- [ ] The overlay header shows the request ID and size information
- [ ] The "📋 Copy JSON" button is positioned in the top-right corner of the content area
- [ ] The "📋 Copy JSON" button copies the JSON to clipboard
- [ ] Pressing ESC key closes the overlay
- [ ] Clicking outside the content area (on the semi-transparent background) closes the overlay
- [ ] The "✕ Close" button in the header closes the overlay

---

## Summary

This feature enhances the user experience by:
1. **Fullscreen Viewer**: Providing a fullscreen overlay to view complete raw JSON records with a clean, light theme
2. **Improved Table Layout**: Moving the View button below the requestId keeps the table column narrow and handles long IDs better
3. **Simplified Navigation**: Removing the redundant "Raw Record" tab reduces clutter since the fullscreen viewer provides better functionality
4. **Consistent UX**: The light theme overlay matches the "Raw Record" tab style users are familiar with
5. **Easy Access**: Users can view any record directly from the "Every Query" table with one click

**Migration Notes**:
- The `copyRequestId()` function remains in the codebase for backward compatibility
- Old JavaScript functions for the Raw Record tab (`loadWholeRecordFromInput`, `copyWholeRecordJson`) can be removed or kept for backward compatibility
- Any URL hash navigation to `#whole-record` will no longer work (consider adding a redirect to `#every-query` if needed)

## Date: 2025-11-19

### Change 5: Rename "Parse JSON" to "Analyze"

**Description**: 
Changed the primary action button text from "Parse JSON" to "Analyze" to better reflect the tool's functionality. Also updated related notification messages.

**File**: `/liquid_snake/index.html`

**Action**: Update button text (around line 180) and instruction text (around line 1780)

```html
<!-- Button -->
<button id="parse-json-btn" onclick="parseJSON()" aria-label="Parse and analyze JSON data" tabindex="0" role="button">
    Analyze
</button>

<!-- Instructions -->
5. Click "Analyze" again
```

**File**: `/liquid_snake/assets/js/main-legacy.js`

**Action**: Update `FILTERS_CHANGED_REMINDER` constant

```javascript
FILTERS_CHANGED_REMINDER: "⚠️ Filters changed. Click \"Analyze\" to apply changes.",
```
