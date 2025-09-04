# Localization Guide for Couchbase Query Analyzer

## Architecture Overview

This project now uses **separate files** for different aspects:

### File Structure
```
├── README.md                    # English documentation
├── README.de.md                 # German documentation  
├── README.es.md                 # Spanish documentation
├── README.pt.md                 # Portuguese documentation
├── index.html                   # English HTML tool
├── de_index.html               # German HTML tool
├── es_index.html               # Spanish HTML tool
├── pt_index.html               # Portuguese HTML tool
└── settings/
    ├── LOCALIZATION_GUIDE.md   # This guide
    └── translations.json       # Translation mappings
```

## Documentation Updates (README Files)

### **Step 1: Quick Update Process for README Files**

When making changes to `README.md`, use this process to update the localized versions:

**📝 RELEASE LOG REMINDER**: If this is part of a release process, update your settings/release_YYYYMMDD_HHMMSS.txt file with the changes made.

```text
I've made changes to README.md. Please update README.de.md, README.es.md, and README.pt.md using the settings/translations.json file.

Changes made:
[Describe the specific changes you made]

Please ensure:
1. **Navigation Links**: Update language navigation links at the top
2. **Download Instructions**: Keep language-specific HTML file references
3. **Content Organization**: Keep Quick Start section high up, move all version info to Release Notes section near bottom
4. **Spell Checking**: Perform spell checking on all README files before finalizing
5. **Content Consistency**: Maintain same structure across all README files
6. **Cross-references**: Update any references to sql_queries.md or other files
7. **Version Numbers**: Keep version numbers synchronized
8. **Release Notes Order**: Maintain reverse chronological order (newest first)

Check the settings/translations.json file for consistent terminology.
```

### **Step 2: README File Maintenance**

#### Language Navigation Links
Each README file should have navigation links at the top:
```markdown
**🌍 Languages:** **🇺🇸 English** | [🇩🇪 Deutsch](README.de.md) | [🇪🇸 Español](README.es.md) | [🇵🇹 Português](README.pt.md)
```

#### Download Instructions  
Each README should specify the correct HTML file:
- **README.md**: Use `index.html`
- **README.de.md**: Use `de_index.html`
- **README.es.md**: Use `es_index.html`
- **README.pt.md**: Use `pt_index.html`

#### Content Organization Requirements
**CRITICAL**: All README files must follow this structure:
1. **Quick Start Section**: Must be positioned high up in the document for immediate visibility
2. **No "What's New" sections in middle**: Avoid adding version-specific content that interrupts the main flow
3. **Release Notes Section**: All version information, changes, and new features go in "Release Notes" section near the bottom
4. **Spell Checking Required**: All README files must be spell-checked before finalizing updates
5. **Release Notes Order**: Version information in reverse chronological order (newest first)

## HTML Tool Updates (Index Files)

### **Step 3: COMPREHENSIVE Translation Approach (UPDATED v3.12.0+)**

**🚀 COMPLETE INTERNATIONALIZATION SYSTEM**: Use this systematic 3-phase approach to achieve 100% translation coverage:

#### **Phase 1: TEXT_CONSTANTS (JavaScript Strings)**
```javascript
// SAFE: Only translate the TEXT_CONSTANTS object (lines ~1518-1580)
const TEXT_CONSTANTS = {
  PARSE_PERFORMANCE: "Parse performance:",           // English
  PARSE_PERFORMANCE: "Rendimiento de análisis:",    // Spanish
  PARSE_PERFORMANCE: "Parse-Leistung:",             // German
  PASTE_JSON_FIRST: "Please paste your JSON data first",
  ERROR_PARSING_JSON: "Error parsing JSON:"
};

// PROTECTED: JavaScript logic stays identical across languages
console.log(`${TEXT_CONSTANTS.PARSE_PERFORMANCE} ${timing}ms`);
showToast(TEXT_CONSTANTS.PASTE_JSON_FIRST, "warning");
```

#### **Phase 2: HTML Content (Static UI Elements)**
Translate text between HTML tags and in specific attributes:
```html
<!-- TRANSLATE: Text between tags -->
<h3 class="chart-title">Users by Query Count</h3>  <!-- English -->
<h3 class="chart-title">Usuarios por Conteo de Consultas</h3>  <!-- Spanish -->

<!-- TRANSLATE: Specific attributes -->
<label for="search">Search Statement:</label>  <!-- English -->
<label for="search">Buscar Declaración:</label>  <!-- Spanish -->

placeholder="Search usernames..."  <!-- English -->
placeholder="Buscar usuarios..."   <!-- Spanish -->
```

#### **Phase 3: Complete Translation from JSON**
Apply ALL translations from `settings/translations.json` systematically:

**🚨 CRITICAL DISCOVERY**: Manual translation misses 150+ strings. You need systematic application of the 900+ translations in your translations.json file.

#### 🚨 **MANDATORY: JavaScript Syntax Validation**
**AFTER EVERY TRANSLATION, you MUST run:**
```bash
python3 settings/validate_js_syntax.py
```

**If validation fails:**
1. **NEVER manually edit JavaScript** - this breaks translations
2. **Run the string fixer:** `python3 fix_js_strings.py`
3. **Re-validate:** `python3 settings/validate_js_syntax.py`
4. **If still broken:** Start over with clean English files:
   ```bash
   cp en/index.html de/index.html es/index.html pt/index.html
   python3 apply_safe_translations.py
   ```

#### **NEW SYSTEMATIC TRANSLATION PROCESS:**

**🔧 COMPLETE WORKFLOW:**
```bash
# 1. Start with clean English files
cp en/index.html de/index.html
cp en/index.html es/index.html  
cp en/index.html pt/index.html

# 2. Apply comprehensive translations from JSON
python3 python/apply_comprehensive_translations.py es
python3 python/apply_comprehensive_translations.py de  
python3 python/apply_comprehensive_translations.py pt

# 3. Validate (MANDATORY)
python3 python/validate_js_syntax.py
python3 python/validate_html_attributes.py
```

**🎯 TRANSLATION COVERAGE:**
- **Current Manual Approach:** ~25 strings translated (10% coverage)
- **Required Full Coverage:** 900+ strings from translations.json (100% coverage)
- **Missing:** Form labels, placeholders, chart titles, help text, instructions

#### **Benefits:**
- ✅ **Zero JavaScript breakage** - syntax stays intact
- ✅ **100% translation coverage** - all strings from translations.json applied
- ✅ **Consistent terminology** - same translations across all contexts
- ✅ **Systematic approach** - no manual hunting for missed strings

#### **Managing TEXT_CONSTANTS:**

**Finding the Constants Section:**
```bash
# Locate TEXT_CONSTANTS in any file
grep -n "const TEXT_CONSTANTS" */index.html

# Extract just the constants for translation
sed -n '/const TEXT_CONSTANTS/,/};/p' en/index.html > /tmp/text_constants.js
```

**Translation Template for TEXT_CONSTANTS:**
```javascript
// ENGLISH (en/index.html)
const TEXT_CONSTANTS = {
  PARSE_PERFORMANCE: "Parse performance:",
  CACHE_STATS: "Cache stats - parseTime:",
  PASTE_JSON_FIRST: "Please paste your JSON data first",
  INPUT_TOO_LARGE: "Input too large. Please use smaller datasets.",
  SHOWING_TOP: "Showing top",
  OF_TOTAL: "of",
  USERS: "users",
  INDEXES: "indexes"
};

// SPANISH (es/index.html) 
const TEXT_CONSTANTS = {
  PARSE_PERFORMANCE: "Rendimiento de análisis:",
  CACHE_STATS: "Estadísticas de caché - parseTime:",
  PASTE_JSON_FIRST: "Por favor, pegue sus datos JSON primero",
  INPUT_TOO_LARGE: "Entrada demasiado grande. Use conjuntos de datos más pequeños.",
  SHOWING_TOP: "Mostrando los primeros",
  OF_TOTAL: "de",
  USERS: "usuarios", 
  INDEXES: "índices"
};

// GERMAN (de/index.html)
const TEXT_CONSTANTS = {
  PARSE_PERFORMANCE: "Parse-Leistung:",
  CACHE_STATS: "Cache-Statistiken - parseTime:",
  PASTE_JSON_FIRST: "Bitte fügen Sie zuerst Ihre JSON-Daten ein",
  INPUT_TOO_LARGE: "Eingabe zu groß. Verwenden Sie kleinere Datensätze.",
  SHOWING_TOP: "Zeige die ersten",
  OF_TOTAL: "von",
  USERS: "Benutzer",
  INDEXES: "Indizes"
};
```

**Validation Commands for Global Constants:**
```bash
# Verify TEXT_CONSTANTS exists and is translated
grep -A 20 "const TEXT_CONSTANTS" */index.html | grep -E "(English|Spanish|German|Portuguese)"

# Check that constants are being used (not hardcoded strings)
grep -n "TEXT_CONSTANTS\." */index.html | wc -l  # Should be >20 

# Find remaining hardcoded strings that should use constants
grep -n "console\.log.*['\"]" */index.html | grep -v "TEXT_CONSTANTS"
```

#### **When to Add New Constants:**

**🔴 ALWAYS add constants for:**
- User-facing error messages: `showToast()` calls
- Performance/debug logging that users might see
- Table notices: "Showing top X of Y items"
- Chart sampling messages
- Progress and status updates

**🟡 CONSIDER adding constants for:**
- Developer console logs (if users might see them)
- Chart titles and axis labels (if not in HTML already)
- Modal dialog text
- Tooltip content

**🟢 KEEP as-is:**
- Technical variable names and CSS classes
- HTML IDs and data attributes
- JavaScript function/property names
- Internal debugging (not user-visible)

#### **Adding New Constants Workflow:**
1. **Identify hardcoded strings** during development
2. **Add to English TEXT_CONSTANTS** with descriptive key name
3. **Replace hardcoded string** with `TEXT_CONSTANTS.KEY_NAME`
4. **Update translation template** in this guide
5. **Apply to all language files** during next release

**Example Pattern:**
```javascript
// BEFORE (risky for translation)
console.log("Timeline charts: Using " + count + " of " + total + " requests for performance");

// AFTER (translation-safe)  
console.log(`${TEXT_CONSTANTS.TIMELINE_CHARTS_USING} ${count} ${TEXT_CONSTANTS.OF_TOTAL} ${total} ${TEXT_CONSTANTS.REQUESTS_FOR_PERFORMANCE}`);
```

### **Step 4: RECOMMENDED Complete Translation Process**

**🚀 SYSTEMATIC APPROACH**: Use this proven method to apply all 900+ translations from translations.json:

**📝 RELEASE LOG REMINDER**: If this is part of a release process, update your settings/release_YYYYMMDD_HHMMSS.txt file with each HTML file updated.

```text
COMPLETE LOCALIZATION PROCESS - Use this to achieve 100% translation coverage:

1. **Start Clean:**
   cp en/index.html de/index.html
   cp en/index.html es/index.html  
   cp en/index.html pt/index.html

2. **Apply ALL Translations Systematically:**
   python3 python/apply_comprehensive_translations.py es
   python3 python/apply_comprehensive_translations.py de
   python3 python/apply_comprehensive_translations.py pt

3. **MANDATORY Validation:**
   python3 python/validate_js_syntax.py
   python3 python/validate_html_attributes.py

4. **Verification:**
   - Check that no English UI text remains
   - Test all functionality (charts, buttons, search)
   - Validate translations are contextually correct

RESULT: 900+ translations from translations.json applied systematically instead of manual hunt-and-peck approach that misses 80% of strings.
```

**🚨 CRITICAL REALIZATION**: Manual translation approach identified in testing:
- **Manual approach covers:** ~25 strings (10% of total)
- **translations.json contains:** 900+ strings requiring translation
- **Missing areas:** Form labels, chart titles, help text, placeholders, instructions

**LESSON LEARNED**: Manual editing cannot scale to 900+ translation strings. Systematic application of the complete translations.json is required for proper localization.

### ⚠️ **CRITICAL: JavaScript Syntax Requirements**

**BEFORE ANY TRANSLATION WORK**: Be aware that JavaScript string literals CANNOT span multiple lines. When applying translations:

**❌ WRONG** (causes syntax errors):
```javascript
if (col === "tiempo de
solicitud") return "requestTime";
```

**✅ CORRECT** (proper JavaScript syntax):
```javascript
if (col === "tiempo de " +
"solicitud") return "requestTime";
```

**🚨 MANDATORY VALIDATION**: After any translation work, run:
```bash
# Check for JavaScript syntax errors in language files
grep -n '"[^"]*$' */index.html | grep -v "style=\|href=\|src=\|class=\|id="
```
If this finds any results in JavaScript code sections, they need string concatenation fixes.

### **Step 4: Alternative Individual Function Sync Process**

If you prefer to sync individual changes, use this chat prompt template:

**📝 RELEASE LOG REMINDER**: If this is part of a release process, document each HTML file change in your settings/release_YYYYMMDD_HHMMSS.txt file.

```text
I've made changes to index.html. Please update es/index.html, pt/index.html, and de/index.html using the settings/translations.json file and settings/LOCALIZATION_GUIDE.md process.

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
   - Use grep commands from settings/LOCALIZATION_GUIDE.md to find missed content
   - Test chart functionality with translated variables
   - Verify all dynamic content displays correctly

Update settings/translations.json if new translatable strings were added.

⚠️ **CRITICAL**: Use the JavaScript detection commands to find missed content:
- `grep -n "textContent.*=" [lang]/index.html`
- `grep -n "Copy\|Reset\|Show\|Hide" [lang]/index.html`  
- `grep -n "button\.textContent" [lang]/index.html`
```

## 🎯 **EXPLICIT TRANSLATION BOUNDARIES**

### ✅ **WHAT MUST BE TRANSLATED:**

#### **HTML Content (User-Facing Text):**
- `<button>Copy Query</button>` → `<button>Kopieren Abfrage</button>`
- `<label>Search Statement:</label>` → `<label>Anweisung Suchen:</label>`
- `<h3>Users by Query Count</h3>` → `<h3>Benutzer nach Abfrageanzahl</h3>`
- `placeholder="Search..."` → `placeholder="Suchen..."`
- `title="Tooltip text"` → `title="Tooltip-Text"`

#### **JavaScript String Literals (In Quotes):**
- `button.textContent = "Copy";` → `button.textContent = "Kopieren";`
- `"Reset Zoom"` → `"Zoom Zurücksetzen"`
- `innerHTML = "No data available";` → `innerHTML = "Keine Daten verfügbar";`
- Template literals: `` `Showing ${count} records` `` → `` `Zeige ${count} Datensätze` ``

#### **Chart.js Configuration Strings:**
- `title: { text: "Database Operations Timeline" }` → `title: { text: "Datenbank-Operationen Timeline" }`
- `labels: ["Yes", "No"]` → `labels: ["Ja", "Nein"]`
- `datasets: [{ label: "Query Count" }]` → `datasets: [{ label: "Abfrageanzahl" }]`

#### **Dynamic Text Generation:**
- `"Showing all " + count + " records"` → `"Zeige alle " + count + " Datensätze"`
- Status messages, error messages, success messages
- Button text that changes dynamically

### ❌ **WHAT MUST NEVER BE TRANSLATED:**

#### **JavaScript Technical Elements:**
- Function names: `function syncTimelineCharts()` (NEVER `function syncZeitverlaufDiagramme()`)
- Variable names: `const allIndexes` (NEVER `const alleIndizes`)
- Object properties: `itemsScanned:` (NEVER `itemsGescannt:`)
- CSS classes: `class="btn-primary"` (NEVER `class="schaltfläche-primär"`)
- HTML IDs: `id="search-input"` (NEVER `id="suche-eingabe"`)

#### **Code Structure:**
- HTML tag names: `<div>` stays `<div>`
- CSS selectors: `.container` stays `.container`
- JavaScript keywords: `if`, `else`, `function`, `const`, `let`
- JSON keys in data structures (unless they're user-facing labels)

### 🚨 **CRITICAL DETECTION PATTERNS:**

#### **🚨 MANDATORY: JavaScript Syntax Validation**
**ALWAYS RUN AFTER TRANSLATION WORK**:
```bash
# 1. Check for broken JavaScript string literals (CRITICAL)
grep -n -A1 '"[^"]*$' */index.html | grep -v "style=\|href=\|src=\|class=\|id=\|content=\|placeholder="

# 2. If found, fix with string concatenation:
#    "broken text" becomes "broken " + "text"

# 3. Verify fix by checking for syntax errors:
#    Open each language file in browser and check JavaScript console for errors
```

**❌ IMMEDIATE FIX REQUIRED** if you find patterns like:
- `"text\ntext"` in JavaScript code sections
- Multi-line strings in column arrays or conditional statements  
- Broken string literals in JavaScript functions

#### **Find Untranslated User-Facing Content:**
```bash
# Find HTML labels and text that need translation
grep -n ">Search.*:</label>" [lang]/index.html
grep -n ">Sort.*:</label>" [lang]/index.html  
grep -n ">Filter.*:</label>" [lang]/index.html
grep -n "<button.*>.*[A-Z].*</button>" [lang]/index.html

# Find JavaScript strings that need translation
grep -n "textContent.*=.*['\"].*[A-Z]" [lang]/index.html
grep -n "innerHTML.*=.*['\"].*[A-Z]" [lang]/index.html
grep -n "title.*:.*['\"].*[A-Z].*['\"]" [lang]/index.html

# Find chart configuration strings
grep -n "text.*:.*['\"].*[A-Z].*['\"]" [lang]/index.html
grep -n "label.*:.*['\"].*[A-Z].*['\"]" [lang]/index.html
```

#### **Verify No JavaScript Was Broken:**
```bash
# These should return ZERO results (if found, JavaScript is broken)
grep -n "function.*[áéíóúâêîôûäöüß]" [lang]/index.html
grep -n "const.*[áéíóúâêîôûäöüß]" [lang]/index.html  
grep -n "let.*[áéíóúâêîôûäöüß]" [lang]/index.html
```

## ⚠️ **DUAL VALIDATION SYSTEM (CRITICAL)**

**🚨 MANDATORY STEPS:** Run both validations after translation to prevent runtime errors:

### Step 9A: JavaScript Syntax Validation
```bash
# Validate JavaScript syntax in all HTML files  
python3 settings/validate_js_syntax.py
```

### Step 9B: HTML Attribute Validation  
```bash
# Validate HTML attributes weren't translated (prevents DOM errors)
python3 settings/validate_html_attributes.py
```

**Expected Output:**
```
🔍 JavaScript Syntax Validation
========================================
index.html           ✅ PASS
en/index.html        ✅ PASS  
de/index.html        ✅ PASS
es/index.html        ✅ PASS
pt/index.html        ✅ PASS
========================================
🎉 All files passed JavaScript syntax validation!
```

**If any files FAIL:**
1. **STOP the release process immediately**
2. **Fix JavaScript syntax errors** before proceeding
3. **Re-run validation** until all files pass

**Common JavaScript Issues After Translation:**
- String literals with actual line breaks instead of `\n` escape sequences
- Column names in arrays that span multiple lines incorrectly
- Conditional statements with broken string comparisons

## 🔍 **POST-TRANSLATION AUDIT SYSTEM**

After completing localization, run this comprehensive audit to detect the remaining untranslated content and categorize it for improvement.

### **Audit Script Usage:**
```bash
# Run comprehensive translation audit for a specific language
./settings/translation_audit.sh [lang]

# Example:
./settings/translation_audit.sh de
./settings/translation_audit.sh es  
./settings/translation_audit.sh pt

# Results will be written to:
# settings/translation_audit_[lang]_[date].log
```

### **Manual Audit Commands:**

#### **0. MANDATORY: JavaScript Syntax Validation (RUN FIRST)**
```bash
LANG="de"  # Change to es, pt as needed

echo "=== JAVASCRIPT SYNTAX VALIDATION FOR ${LANG^^} ===" 
echo "Checking for broken string literals..."

# Find broken JavaScript strings (CRITICAL CHECK)
BROKEN_JS=$(grep -n '"[^"]*$' ${LANG}/index.html | grep -v "style=\|href=\|src=\|class=\|id=\|content=\|placeholder=" | head -10)

if [ -n "$BROKEN_JS" ]; then
  echo "❌ CRITICAL: Found broken JavaScript string literals:"
  echo "$BROKEN_JS"
  echo ""
  echo "🔧 FIX REQUIRED: Add string concatenation with + operators"
  echo "   Example: \"text\" becomes \"text \" + \"continuation\""
else
  echo "✅ No broken JavaScript string literals found"
fi
echo ""
```

#### **1. Find Remaining English UI Text:**
```bash
LANG="de"  # Change to es, pt as needed
OUTPUT_FILE="settings/translation_audit_${LANG}_$(date +%Y%m%d).log"

echo "=== TRANSLATION AUDIT FOR ${LANG^^} ===" > $OUTPUT_FILE
echo "Generated: $(date)" >> $OUTPUT_FILE
echo "File: ${LANG}/index.html" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Category 1: HTML Labels and Buttons
echo "=== 1. UNTRANSLATED HTML LABELS & BUTTONS ===" >> $OUTPUT_FILE
grep -n ">Search.*:</label>\|>Sort.*:</label>\|>Filter.*:</label>" ${LANG}/index.html >> $OUTPUT_FILE
grep -n "<button[^>]*>[^<]*[A-Z][^<]*</button>" ${LANG}/index.html >> $OUTPUT_FILE
grep -n "placeholder=\"[^\"]*[A-Z][^\"]*\"" ${LANG}/index.html >> $OUTPUT_FILE
grep -n "title=\"[^\"]*[A-Z][^\"]*\"" ${LANG}/index.html >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Category 2: JavaScript String Literals  
echo "=== 2. UNTRANSLATED JAVASCRIPT STRINGS ===" >> $OUTPUT_FILE
grep -n "textContent.*=.*['\"][^'\"]*[A-Z][^'\"]*['\"]" ${LANG}/index.html >> $OUTPUT_FILE
grep -n "innerHTML.*=.*['\"][^'\"]*[A-Z][^'\"]*['\"]" ${LANG}/index.html >> $OUTPUT_FILE
grep -n "\.text.*=.*['\"][^'\"]*[A-Z][^'\"]*['\"]" ${LANG}/index.html >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Category 3: Chart Configuration Text
echo "=== 3. UNTRANSLATED CHART CONFIGURATIONS ===" >> $OUTPUT_FILE
grep -n "title.*:.*{.*text.*:.*['\"][^'\"]*[A-Z][^'\"]*['\"]" ${LANG}/index.html >> $OUTPUT_FILE
grep -n "label.*:.*['\"][^'\"]*[A-Z][^'\"]*['\"]" ${LANG}/index.html >> $OUTPUT_FILE
grep -n "labels.*:.*\[.*['\"][^'\"]*[A-Z][^'\"]*['\"]" ${LANG}/index.html >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Category 4: Template Literals and Concatenation
echo "=== 4. UNTRANSLATED TEMPLATE LITERALS ===" >> $OUTPUT_FILE
grep -n "\`[^\`]*[A-Z][^\`]*\${[^}]*}[^\`]*\`" ${LANG}/index.html >> $OUTPUT_FILE
grep -n "\"[^\"]*[A-Z][^\"]*\"\s*\+.*\+\s*\"[^\"]*[A-Z][^\"]*\"" ${LANG}/index.html >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Category 5: Hard-to-Find Content
echo "=== 5. POTENTIAL MISSED CONTENT ===" >> $OUTPUT_FILE
grep -n "console\.log.*['\"][^'\"]*[A-Z][^'\"]*['\"]" ${LANG}/index.html >> $OUTPUT_FILE
grep -n "alert.*['\"][^'\"]*[A-Z][^'\"]*['\"]" ${LANG}/index.html >> $OUTPUT_FILE
grep -n "confirm.*['\"][^'\"]*[A-Z][^'\"]*['\"]" ${LANG}/index.html >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Category 6: Comments That Should Be Translated (User-Facing)
echo "=== 6. USER-FACING COMMENTS ===" >> $OUTPUT_FILE
grep -n "<!--[^>]*[A-Z][^>]*-->" ${LANG}/index.html >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

echo "=== AUDIT COMPLETE ===" >> $OUTPUT_FILE
echo "Review $OUTPUT_FILE to identify remaining translation needs" >> $OUTPUT_FILE
```

### **Automated Audit Script:**
Create `/settings/translation_audit.sh`:

```bash
#!/bin/bash
# Translation Audit Script
# Usage: ./translation_audit.sh [lang]

if [ $# -eq 0 ]; then
    echo "Usage: $0 <language_code>"
    echo "Example: $0 de"
    exit 1
fi

LANG="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
OUTPUT_FILE="${SCRIPT_DIR}/translation_audit_${LANG}_$(date +%Y%m%d_%H%M%S).log"
HTML_FILE="${PROJECT_ROOT}/${LANG}/index.html"

if [ ! -f "$HTML_FILE" ]; then
    echo "Error: $HTML_FILE not found"
    exit 1
fi

echo "Running translation audit for ${LANG^^}..."
echo "=== TRANSLATION AUDIT FOR ${LANG^^} ===" > "$OUTPUT_FILE"
echo "Generated: $(date)" >> "$OUTPUT_FILE"
echo "File: ${LANG}/index.html" >> "$OUTPUT_FILE"
echo "Total Lines: $(wc -l < "$HTML_FILE")" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Function to count matches and add category
audit_category() {
    local category="$1"
    local pattern="$2"
    echo "=== $category ===" >> "$OUTPUT_FILE"
    local matches=$(grep -n "$pattern" "$HTML_FILE" 2>/dev/null || true)
    if [ -z "$matches" ]; then
        echo "✅ No untranslated content found in this category" >> "$OUTPUT_FILE"
    else
        echo "$matches" >> "$OUTPUT_FILE"
        local count=$(echo "$matches" | wc -l)
        echo "📊 Found $count items needing attention" >> "$OUTPUT_FILE"
    fi
    echo "" >> "$OUTPUT_FILE"
}

# Run audit categories
audit_category "1. HTML LABELS & BUTTONS" ">Search.*:</label>\|>Sort.*:</label>\|>Filter.*:</label>\|<button[^>]*>[^<]*[A-Z][^<]*</button>\|placeholder=\"[^\"]*[A-Z][^\"]*\""

audit_category "2. JAVASCRIPT STRING LITERALS" "textContent.*=.*['\"][^'\"]*[A-Z][^'\"]*['\"]\|innerHTML.*=.*['\"][^'\"]*[A-Z][^'\"]*['\"]\|\.text.*=.*['\"][^'\"]*[A-Z][^'\"]*['\"]"

audit_category "3. CHART CONFIGURATIONS" "title.*:.*text.*:.*['\"][^'\"]*[A-Z][^'\"]*['\"]\|label.*:.*['\"][^'\"]*[A-Z][^'\"]*['\"]\|labels.*:.*\[.*['\"][^'\"]*[A-Z]"

audit_category "4. TEMPLATE LITERALS" "\`[^\`]*[A-Z][^\`]*\\\${[^}]*}[^\`]*\`"

audit_category "5. CONSOLE/ALERT MESSAGES" "console\.log.*['\"][^'\"]*[A-Z][^'\"]*['\"]\|alert.*['\"][^'\"]*[A-Z][^'\"]*['\"]\|confirm.*['\"][^'\"]*[A-Z]"

audit_category "6. USER-FACING COMMENTS" "<!--[^>]*[A-Z][^>]*-->"

# Summary
echo "=== AUDIT SUMMARY ===" >> "$OUTPUT_FILE"
total_issues=$(grep -c "📊 Found" "$OUTPUT_FILE" 2>/dev/null || echo "0")
echo "Total categories with issues: $total_issues" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Recommendations
echo "=== RECOMMENDATIONS ===" >> "$OUTPUT_FILE"
echo "1. Review each category above" >> "$OUTPUT_FILE"
echo "2. Add missing translations to settings/translations.json" >> "$OUTPUT_FILE"  
echo "3. Create bespoke regex rules for complex patterns" >> "$OUTPUT_FILE"
echo "4. Update translation functions for systematic patterns" >> "$OUTPUT_FILE"
echo "5. Re-run audit after fixes to verify improvements" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "Audit complete! Results saved to: $OUTPUT_FILE" >> "$OUTPUT_FILE"

echo "✅ Audit complete! Results saved to: $OUTPUT_FILE"
echo "📊 Found issues in $total_issues categories"
echo "📝 Review the log file to identify specific translation needs"
```

### **Analysis Categories:**

After running the audit, categorize findings for action:

#### **🔧 Quick Fixes (Add to translations.json):**
- Simple string replacements
- Button text, labels, placeholders
- Common UI messages

#### **🛠 Function Modifications:**
- Dynamic text generation functions
- String concatenation patterns
- Template literal content

#### **⚙️ Bespoke Regex Rules:**
- Complex HTML patterns
- Multi-line content
- Context-dependent translations

#### **🎯 Special Cases:**
- Chart configuration objects
- Conditional display text
- Generated HTML content

### **Continuous Improvement Workflow:**
1. Run audit after each translation update
2. Track improvement over time with dated logs
3. Update translation rules based on findings
4. Maintain target of 95%+ translation coverage

## Complete Localization Process for New Languages

### Step 1: Add Translations to settings/translations.json

1. Add the new language code to every entry in `ui_strings` section
2. Add the language code to `javascript_variables` section 
3. Update the `languages` array in `notes` section
4. Update the `instructions` field to include the new language file
5. Add the new language to README file references

### Step 2: Create New Language Files

#### A. Create HTML Tool File
1. **Copy base file**: `cp index.html [lang]_index.html` (e.g., `fr_index.html`)
2. **Update language attribute**: Change `<html lang="en">` to `<html lang="[lang]">`
3. **Update localization note**: Add language-specific note in HTML comment

#### B. Create README Documentation File
1. **Copy base README**: `cp README.md README.[lang].md` (e.g., `README.fr.md`)
2. **Update navigation links**: Update language links to include new language
3. **Update download instructions**: Change HTML file reference to `[lang]_index.html`
4. **Add to all README files**: Update navigation in all existing README files

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

## 🚨 Common Translation Issues

### Chart Titles in JavaScript Configurations
**Problem**: Chart titles defined in Chart.js configuration objects are often missed during translation because they're embedded deep in JavaScript.

**Example locations:**
- Timeline tab charts: "Database Operations Timeline", "Filter Operations Timeline"
- Dashboard charts: Chart title configurations in Chart.js options
- Analysis charts: Dynamic chart titles based on data

**How to find:**
```bash
# Find ALL chart title configurations
grep -n "title:.*text:" *.html
grep -n "text:.*Timeline" *.html
grep -n "text:.*Operations" *.html
grep -n "text:.*Performance" *.html
grep -n "text:.*Memory" *.html
grep -n "text:.*Query" *.html

# Comprehensive search for all Chart.js titles
grep -n "title: {" -A 3 *.html | grep "text:"
```

**Solution**: Always update `settings/translations.json` first, then apply to all files:
```json
"Database Operations Timeline: Index Scans vs Document Fetches": {
  "de": "Datenbank-Operationen Timeline: Index-Scans vs Dokument-Abrufe"
}
```

### Tab Navigation Names  
**Problem**: Tab names in the navigation header are often missed because they're in simple `<a>` tags.

**Example locations:**
- Dashboard tab: `>Dashboard</a>`
- Timeline tab: `>Timeline</a>`
- Analysis tab: `>Analysis</a>`

**How to find:**
```bash
# Find tab navigation links
grep -n ">Dashboard<\|>Timeline<\|>Analysis<" *.html
grep -n "aria-controls.*>.*</a>" *.html

# Check if translations exist
grep -n "Instrumententafel\|Zeitverlauf\|Analysieren" de_index.html
```

**Solution**: Update the actual tab link text, not just the translation mapping:
```html
<!-- Before -->
<a href="#dashboard">Dashboard</a>

<!-- After (German) -->
<a href="#dashboard">Instrumententafel</a>
```

### Dashboard Table Headers
**Problem**: Table titles and headers in the Dashboard tab that are defined in HTML `<h3>` tags are easily missed.

**Example locations:**
- "Users by Query Count" 
- "Index Usage Count"
- Table headers like "Count", "User", "Index Name"

**How to find:**
```bash
# Find dashboard table titles
grep -n "<h3.*>.*</h3>" de_index.html | grep -v German_text
```

### Hidden/Conditional UI Elements
**Problem**: Content that only appears under certain conditions (modals, warnings, tooltips) can be overlooked.

**Common missed elements:**
- Modal dialog titles and content
- Warning messages that appear conditionally
- Tooltip text and help text
- Empty state messages ("No data available", "Select a query...")

### Version-Specific Issues
When updating to new versions, new untranslated content can be introduced if:
1. New features add English text that wasn't in translations.json
2. Chart configurations are copied from index.html without translation
3. New UI elements are added without considering localization

**Prevention:**
1. Always update translations.json FIRST when adding new text
2. Use consistent translation keys across all features
3. Test each language version after major updates
4. Search for common English words as a final check

## 🔍 Complete Translation Verification Checklist

Use this comprehensive checklist to ensure NO English text remains in localized files:

### 1. Navigation & Tab Elements
```bash
# Check tab names in navigation
grep -n ">Dashboard<\|>Timeline<\|>Analysis<\|>Every Query<\|>Index/Query Flow<\|>Indexes<" de_index.html

# Should find German translations, not English
```

### 2. All Chart Titles
```bash
# Find ALL chart configurations with titles
grep -n "title: {" -A 3 de_index.html | grep "text:"

# Common chart title patterns
grep -n "text:.*Timeline\|text:.*Performance\|text:.*Memory\|text:.*Query\|text:.*Operations\|text:.*Analysis" de_index.html
```

### 3. Table Headers and Titles
```bash
# Find all table headers and section titles
grep -n "<h3.*>.*</h3>\|<th.*>.*</th>" de_index.html

# Common missed table elements
grep -n "Users by\|Index Usage\|Count\|User\|Index Name" de_index.html
```

### 4. Button Text and UI Elements
```bash
# Find button text
grep -n ">Copy<\|>Reset<\|>Show<\|>Hide<\|>Parse<\|>Clear<" de_index.html

# Find form labels and input placeholders
grep -n "placeholder=\|Search.*:" de_index.html
```

### 5. Chart Data Labels and Dynamic Content
```bash
# Find hardcoded labels in chart data
grep -n "label:.*\"\|labels: \[" de_index.html

# Check for Yes/No values in chart data
grep -n "Yes\|No" de_index.html | grep -v "Ja\|Nein"
```

### 6. Final Comprehensive English Check
```bash
# Find ANY remaining English words (adjust pattern as needed)
grep -n "\(Click\|Run\|Copy\|Paste\|Select\|User\|Count\|Index\|Query\|Total\|Average\|Show\|Hide\|Search\|Filter\|Analysis\|Timeline\|Operations\|Performance\|Memory\)" de_index.html

# This should return minimal results - investigate any matches
```

**✅ Success Criteria**: All grep commands should return either:
- German translations (expected)
- CSS/JavaScript keywords (acceptable)
- No results (perfect)

**❌ Failed Check**: Any results showing English UI text need translation

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

### **Step 5: Language-Specific Considerations**

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

### **Step 6: Comprehensive Translation Verification**

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

### Documentation Files (README)
- **README.md**: English documentation (source)
- **README.de.md**: German documentation
- **README.es.md**: Spanish documentation  
- **README.pt.md**: Portuguese documentation

### HTML Tool Files
- **index.html**: English HTML tool (source)
- **de_index.html**: German HTML tool
- **es_index.html**: Spanish HTML tool
- **pt_index.html**: Portuguese HTML tool

### Configuration Files
- **settings/translations.json**: Master translation mapping
- **settings/LOCALIZATION_GUIDE.md**: This guide

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

### Complete Process for New Language Support

1. **Add to settings/translations.json**: Include new language code in all translation entries
2. **Create HTML tool**: Copy `index.html` to `[lang]_index.html` (e.g., `fr_index.html`)
3. **Create README**: Copy `README.md` to `README.[lang].md` (e.g., `README.fr.md`)
4. **Update HTML `lang` attribute**: Change `<html lang="en">` to `<html lang="[lang]">`
5. **Apply all translations**: Use settings/translations.json for consistent terminology
6. **Update navigation links**: Add new language to all README files' navigation
7. **Update this guide**: Add language-specific considerations and file references

### Maintenance Workflow

When updating content:

1. **Change source files first**: Update `README.md` and `index.html`
2. **Use this guide**: Follow the quick update processes above
3. **Validate thoroughly**: Use the testing checklists and grep commands
4. **Update settings/translations.json**: Add any new translatable strings

## 📚 Related Files

- **[RELEASE_GUIDE.md](RELEASE_GUIDE.md)** - Master guide for complete releases (combines this guide with others)
- **[VERSION_UPDATE_GUIDE.md](VERSION_UPDATE_GUIDE.md)** - For version number updates
- **[settings/translations.json](translations.json)** - Master translation mappings
- **[settings/release.template](release.template)** - Template for tracking release changes

## 🔄 Usage Context

- **Use this guide independently:** When testing localization updates without version changes
- **Use via RELEASE_GUIDE.md:** When performing a complete release with version + localization updates
