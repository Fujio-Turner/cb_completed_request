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
```

#### F. CSS and Styling Changes
Style changes in index.html must be synchronized across all localized versions:

**Inline Styles:**
- `style="margin-top: 30px;"` and other CSS property changes
- Background colors, padding, border modifications
- Font sizes, colors, and text styling changes

**CSS Classes and Styling:**
- New CSS rules added to `<style>` sections
- Modified existing CSS selectors and properties
- Responsive design changes and media queries

**Style-Related HTML Changes:**
- New `class` or `id` attributes
- Changes to element structure that affect styling
- Modifications to div containers and layout elements

**Sync Process for Style Changes:**
```bash
# Find inline style differences
grep -n "style=\"" index.html > /tmp/index_styles.txt
grep -n "style=\"" [lang]_index.html > /tmp/lang_styles.txt
diff /tmp/index_styles.txt /tmp/lang_styles.txt

# Find CSS rule changes in style blocks  
grep -A20 -B5 "<style>" index.html > /tmp/index_css.txt
grep -A20 -B5 "<style>" [lang]_index.html > /tmp/lang_css.txt
diff /tmp/index_css.txt /tmp/lang_css.txt
```

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

**Complete Text Audit:**
- [ ] Search for "English words" pattern in translated file
- [ ] Verify all tab content is translated
- [ ] Check all button labels and form fields
- [ ] Validate all JavaScript-generated content
- [ ] Test copy button functionality and text

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
