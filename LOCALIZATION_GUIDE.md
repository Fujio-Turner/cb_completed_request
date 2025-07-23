# Localization Guide for Couchbase Query Analyzer

## Quick Update Process

When making changes to `index.html`, use this chat prompt template to update the localized versions:

```text
I've made changes to index.html. Please update es_index.html, pt_index.html, and de_index.html using the translations.json file and LOCALIZATION_GUIDE.md process.

Changes made:
[Describe the specific changes you made]

Please follow the complete localization process:

1. **Metadata & HTML Structure:**
   - HTML title tag translations
   - Language attributes and localization comments
   - All static HTML text content

2. **JavaScript Content:**
   - Chart titles and configurations
   - Dynamic text in textContent/innerHTML assignments  
   - Template literals and string concatenation
   - Button text changes and UI messages

3. **CSS & Styling:**
   - Synchronize any inline style changes
   - Copy any new CSS rules or modifications
   - Maintain consistent styling across versions

4. **Hidden/Conditional Content:**
   - Search for hidden divs and modal content
   - Check for JavaScript-generated text
   - Verify empty states and error messages

5. **Validation:**
   - Use grep commands from LOCALIZATION_GUIDE.md to find missed content
   - Test chart functionality with translated variables
   - Verify all dynamic content displays correctly

Update translations.json if new translatable strings were added.

⚠️ **CRITICAL**: Use the JavaScript detection commands to find missed content:
- `grep -n "textContent.*=" [lang]_index.html`
- `grep -n "Copy\|Reset\|Show\|Hide" [lang]_index.html`  
- `grep -n "button\.textContent" [lang]_index.html`
```

## Complete Localization Process for New Languages

### Step 1: Add Translations to translations.json

1. Add the new language code to every entry in `ui_strings` section
2. Add the language code to `javascript_variables` section 
3. Update the `languages` array in `notes` section
4. Update the `instructions` field to include the new language file

### Step 2: Create New Language File

1. **Copy base file**: `cp index.html [lang]_index.html` (e.g., `fr_index.html`)
2. **Update language attribute**: Change `<html lang="en">` to `<html lang="[lang]">`
3. **Update localization note**: Add language-specific note in HTML comment

### Step 3: Systematic Translation

#### A. HTML Elements & Metadata
- **Language attribute**: `<html lang="en">` → `<html lang="[code]">`
- **HTML title tag**: `<title>Query Analyzer v3.1.1</title>`
- **HTML comments**: Update localization notes with language flag
- **Tab names**: All `<a href="#tab">Name</a>` elements  
- **Button labels**: All `<button>`, `<input type="submit">` elements
- **Form labels**: All `<label>` text content
- **Headings**: All `<h1>`, `<h2>`, `<h3>` etc.
- **Static text**: All visible text content in divs, spans, p tags
- **Checkbox/radio labels**: Text next to form controls
- **Option values**: `<option>` text in dropdowns (e.g., "1 Day" → "1 Día")
- **Attributes**: `title`, `placeholder`, `alt`, `aria-label` attributes

#### B. JavaScript Variables (CRITICAL)
- **Chart data keys**: Must match object property names
  ```javascript
  // Wrong:
  scanCounts = { Sí: 5, No: 10 }; // Spanish keys
  data: [scanCounts.Yes, scanCounts.No] // English access
  
  // Correct:
  scanCounts = { Sí: 5, No: 10 }; // Spanish keys  
  data: [scanCounts.Sí, scanCounts.No] // Spanish access
  ```
- **Chart labels**: Array values in Chart.js configurations
- **Dynamic text functions**: All text generation in JavaScript

#### C. Chart Configurations
- **Chart titles**: `title.text` properties in Chart.js configs
- **Axis labels**: `scales.x.title.text` and `scales.y.title.text`
- **Legend labels**: `plugins.legend` configurations
- **Tooltip content**: Custom tooltip functions

#### D. Dynamic Content Functions
Key functions that generate text dynamically:
- `updateSearchResultsInfo()` - "Showing all X records" / "Showing X of Y records"
- `updateAnalysisSearchResultsInfo()` - "Showing all X groups" / "Showing X of Y groups"  
- `updateFilterInfo()` - Filter status messages
- `generatePrimaryScanChart()` - Chart data and labels
- Pagination text generation
- Table row generation with "Copy" buttons
- Button text changes: `button.textContent = 'Show More'` → `'Mostrar Más'`
- Dynamic content in `textContent` and `innerHTML` assignments

**Critical JavaScript Text Patterns to Search:**
```bash
# Find dynamic text assignments
grep -n "textContent.*=" [lang]_index.html
grep -n "innerHTML.*=" [lang]_index.html

# Find template literals and string concatenation
grep -n "\`.*\${.*}\`" [lang]_index.html
grep -n "\" + .* + \"" [lang]_index.html
```

#### E. Hidden and Hard-to-Find Content
These elements are easily missed during translation:

**Hidden Divs and Conditional Content:**
- Search for `style="display: none"` or `hidden` attributes
- Look for divs that appear only under certain conditions
- Check for content in modal dialogs that only show on user actions

**JavaScript String Literals:**
- Search for patterns like `"No Index Data Loaded"`
- Look for multi-line strings with `\n` or template literals with backticks
- Check for hardcoded messages in error handling and validation functions
- Find instruction text that appears in empty states or help sections

**🚨 CRITICAL: JavaScript-Generated Content**
The most commonly missed translations come from JavaScript functions that generate HTML:

**Button Text Generation:**
```javascript
button.textContent = "Copy";           // Must be translated
button.textContent = "Copied!";        // Must be translated  
button.textContent = "Reset Zoom";     // Must be translated
```

**Dynamic HTML Injection:**
```javascript
element.innerHTML = "No execution plan available.";
flowDiagram.textContent = "No operators found...";
sortHint.textContent = "↕ Sort";
```

**Common Patterns to Search:**
- Table row generation with hardcoded "Copy" buttons
- Modal content generation with English text
- Error message generation in JavaScript
- Chart control buttons ("Reset Zoom", "Show More", etc.)
- Status messages ("Copied!", "Loading...", etc.)
- Tooltip and help text generation

**🎯 SNEAKY PATTERN - Template Literals with HTML:**
```javascript
// This pattern is easily missed:
html += `<button onclick="copyFunction()">Copy</button>`;
element.innerHTML = `<div><button>Copy</button></div>`;
return `<button class="btn">Copy</button>`;
```

**Detection Commands for This Pattern:**
```bash
# Find buttons with English text in template literals
grep -n "Copy</button>" [lang]_index.html
grep -n "Show</button>\|Hide</button>" [lang]_index.html  
grep -n ">Copy<\|>Show<\|>Hide<\|>Reset<" [lang]_index.html

# Should return ZERO results in localized files
# If found, these need manual translation
```

**Dynamic HTML Generation:**
- Functions that use `innerHTML` or `createElement` with text content
- Template strings that build HTML with embedded text
- Functions that generate table rows, list items, or form elements
- Copy button generation functions

**Search Techniques:**
```bash
# Find hardcoded English text in JavaScript
grep -n "No Index Data Loaded" *.html
grep -n "Steps:" *.html
grep -n "Copy the query" *.html

# Find common English words that might be missed
grep -n "\(Click\|Run\|Copy\|Paste\|Select\)" *.html
grep -n "\(Instructions\|Note\|Warning\|Error\)" *.html

# Find JavaScript-generated text (CRITICAL)
grep -n "textContent.*=" *.html
grep -n "innerHTML.*=" *.html
grep -n "\.textContent = ['\"]" *.html
grep -n "\.innerHTML = ['\"]" *.html

# Find button text in JavaScript
grep -n "button\.textContent" *.html
grep -n "Copy\|Reset\|Show\|Hide" *.html

# Find template literals with text
grep -n "\`.*[A-Za-z].*\`" *.html
grep -n "\" + .* + \"" *.html

# 🚨 CRITICAL: Find hardcoded English in HTML generation
grep -n "Copy</button>" *.html
grep -n "Show</button>\|Hide</button>" *.html
grep -n ">Copy<\|>Show<\|>Hide<\|>Reset<" *.html
grep -n "\`.*>.*Copy.*<.*\`" *.html
```

#### F. CSS and Styling Changes (UPDATED ARCHITECTURE)
**🔥 ARCHITECTURAL IMPROVEMENT**: index.html is being refactored to move inline styles to CSS classes for easier maintenance.

**CSS-First Approach:**
- Most styling now uses CSS classes instead of inline styles
- Centralized CSS in main `<style>` section for easier maintenance
- Reduced inline styles make localization much simpler

**New CSS Classes to Sync:**
- `.dashboard-grid` - Main dashboard layout
- `.chart-container` - Chart wrapper divs
- `.table-container` - Table wrapper divs  
- `.chart-title` - Chart heading styles
- `.button-row` - Button container layout
- `.input-grid` - Input section layout

**Sync Process for Style Changes:**
```bash
# 1. Compare main CSS sections (most important now)
grep -A100 "<style>" index.html > /tmp/index_css.txt
grep -A100 "<style>" [lang]_index.html > /tmp/lang_css.txt
diff /tmp/index_css.txt /tmp/lang_css.txt

# 2. Check for remaining inline styles (should be minimal)
grep -n "style=\"" index.html | wc -l
grep -n "style=\"" [lang]_index.html | wc -l

# 3. Find class attribute differences
grep -n "class=\"" index.html > /tmp/index_classes.txt
grep -n "class=\"" [lang]_index.html > /tmp/lang_classes.txt
diff /tmp/index_classes.txt /tmp/lang_classes.txt
```

**Benefits of New Architecture:**
- 🎯 **Easier Localization**: Most style changes now in central CSS
- 🔧 **Better Maintenance**: No scattered inline styles
- 🚀 **Improved Performance**: CSS reusability and caching

### Step 4: Language-Specific Considerations

#### German (de)
- Compound words: "Abfragemuster-Eigenschaften" 
- Capitalization: All nouns capitalized
- Word order: Different from English

#### Spanish (es)  
- Accented characters: "Análisis", "Índices"
- Gender agreement: "Cada Consulta" vs "Todos los registros"
- Question marks: Inverted at start ¿

#### Portuguese (pt-BR)
- Accented characters: "Análise", "Índices" 
- Brazilian vs European differences
- Nasal sounds: "Não", "Índices"

### Step 5: Comprehensive Translation Verification

#### A. Pre-Translation Search
Before marking translation as complete, search for these patterns:

```bash
# Search for common English instruction words
grep -n "Click\|Run\|Copy\|Paste\|Select\|Steps:" [lang]_index.html

# Search for untranslated messages
grep -n "No.*Data.*Loaded\|Instructions\|Note:" [lang]_index.html

# Search for hardcoded strings in JavaScript
grep -n "innerHTML.*=.*['\"].*[A-Za-z]" [lang]_index.html
```

#### B. Testing Checklist

**Visual & Functional Testing:**
- [ ] **Visual verification**: All text displays in target language
- [ ] **Chart functionality**: All charts display with correct colors and labels
- [ ] **Interactive elements**: All buttons, tabs, and controls work
- [ ] **Dynamic content**: Search results, pagination, and filters work
- [ ] **JavaScript console**: No errors related to undefined variables
- [ ] **Time filtering**: Date range selection works properly
- [ ] **Copy functionality**: All "Copy" and "Copy All" buttons work
- [ ] **Modal dialogs**: All popup content is translated
- [ ] **Search placeholders**: Input field hints are translated

**Hidden Content Testing:**
- [ ] **Empty states**: Check content shown when no data is loaded
- [ ] **Error messages**: Trigger validation errors to see error text
- [ ] **Help sections**: Open all help dialogs and tooltips
- [ ] **Index tab empty state**: Clear index data to see placeholder content
- [ ] **Chart hover tooltips**: Hover over charts to see tooltip text
- [ ] **Table sorting**: Click headers to verify sort direction indicators
- [ ] **Flow diagram instructions**: Check text shown before selecting queries

**🚨 JavaScript Content Testing:**
- [ ] **Copy buttons**: Click all "Copy" buttons to verify translated text
- [ ] **Chart controls**: Test "Reset Zoom" and other chart buttons
- [ ] **Dynamic status**: Check "Copied!", "Loading...", success messages
- [ ] **Table generation**: Verify dynamically generated table rows
- [ ] **Modal content**: Open all modals to check generated content
- [ ] **Sorting indicators**: Test "↕ Sort", "▲ ASC", "▼ DESC" text
- [ ] **Button state changes**: Verify text changes during interactions

**Complete Text Audit:**
- [ ] Search for "English words" pattern in translated file
- [ ] Verify all tab content is translated
- [ ] Check all button labels and form fields
- [ ] Validate all JavaScript-generated content
- [ ] Test copy button functionality and text

**🎯 Template Literal Validation (CRITICAL):**
- [ ] Run: `grep -n "Copy</button>" [lang]_index.html` → Should return ZERO results
- [ ] Run: `grep -n ">Copy<\|>Show<\|>Hide<\|>Reset<" [lang]_index.html` → Should return ZERO results
- [ ] Run: `grep -n "Show</button>\|Hide</button>" [lang]_index.html` → Should return ZERO results
- [ ] If any found: Manual translation required in JavaScript template literals

## Translation Files

- **translations.json**: Master translation mapping
- **index.html**: English (source)
- **es_index.html**: Spanish 
- **pt_index.html**: Portuguese (Brazil)
- **de_index.html**: German

## Common Pitfalls

1. **Chart Data Keys**: Ensure JavaScript object keys match translated labels
   ```javascript
   // Wrong:
   scanCounts = { Sí: 5, No: 10 }; // Spanish keys
   data: [scanCounts.Yes, scanCounts.No] // English access
   
   // Correct:
   scanCounts = { Sí: 5, No: 10 }; // Spanish keys  
   data: [scanCounts.Sí, scanCounts.No] // Spanish access
   ```

2. **Dynamic Text**: Functions like `updateSearchResultsInfo()` need translated strings

3. **HTML Attributes**: Don't forget `title`, `placeholder`, and `alt` attributes

## Validation Checklist

After updating localized files:
- [ ] All charts display correctly with proper colors
- [ ] Dynamic text shows in the correct language
- [ ] Search functionality works
- [ ] No JavaScript console errors
- [ ] All buttons and interactions work
- [ ] Time filtering works properly

## Adding New Languages

1. Add language code to translations.json
2. Copy index.html to new file (e.g., `fr_index.html`)
3. Update `lang` attribute in `<html>` tag
4. Apply all translations from translations.json
5. Update this guide with the new language
