# Translation Protection Rules

## 🚨 **NEVER TRANSLATE THESE PATTERNS**

### HTML Attributes (Critical for JavaScript)
```html
❌ NEVER translate:
id="statement-search"     → id="estadoment-search" 
class="btn-primary"       → class="btn-primario"
aria-controls="insights"  → aria-controls="perspectivas"
data-field="requestTime"  → data-field="tiempoSolicitud"
onclick="parseJSON()"     → onclick="analizarJSON()"

✅ DO translate:
<label>Statement Search:</label>  → <label>Buscar Declaración:</label>
<h3>Dashboard</h3>             → <h3>Panel de Control</h3>
<button>Parse JSON</button>    → <button>Analizar JSON</button>
```

### JavaScript Code (Critical for Functionality)
```javascript
❌ NEVER translate:
function parseJSON()              → function analizarJSON()
getElementById("statement-search") → getElementById("estadoment-search")
"request\nTime"                   → "tiempo de\nsolicitud" (breaks \n escaping)

✅ DO translate (with care):
console.log("Initializing...")    → console.log("Inicializando...")
// Comments are safe to translate
```

### CSS Classes and Selectors
```css
❌ NEVER translate:
.btn-primary     → .btn-primario
#dashboard       → #panel-control
.chart-container → .contenedor-grafico
```

## 🛡️ **PROTECTION STRATEGIES**

### Strategy 1: Use Protected Translation Script
```bash
# Use the attribute-protected translation script
python3 settings/translate_protected.py
```

### Strategy 2: Exclude Patterns in Translation JSON
Add exclusion patterns to `settings/translations.json`:
```json
{
  "translation_exclusions": {
    "patterns": [
      "^id=",
      "^class=", 
      "^aria-",
      "^data-",
      "^on[A-Z]",
      "function [a-zA-Z]",
      "getElementById",
      "querySelector"
    ]
  }
}
```

### Strategy 3: Validation Gates
Always run both validators after translation:
```bash
python3 settings/validate_js_syntax.py
python3 settings/validate_html_attributes.py
```

## 📋 **CHECKLIST: What Can Be Safely Translated**

### ✅ SAFE TO TRANSLATE
- Text content inside HTML tags: `<h1>Title</h1>`
- Button labels: `<button>Click Me</button>`
- Placeholder text: `placeholder="Enter text"`
- Title attributes: `title="Tooltip text"`
- Alt text: `alt="Image description"`
- Label text: `<label>Field Name:</label>`
- Option text: `<option>Option Name</option>`
- Comments in HTML: `<!-- This is a comment -->`
- Comments in JavaScript: `// This comment is safe`

### ❌ NEVER TRANSLATE  
- Element IDs: `id="element-name"`
- CSS classes: `class="css-class"`
- ARIA attributes: `aria-controls="section"`
- Data attributes: `data-field="fieldName"`
- Event handlers: `onclick="functionName()"`
- JavaScript function names: `function myFunction()`
- JavaScript variable names: `const myVariable`
- CSS selectors: `.my-class`, `#my-id`
- URL fragments: `href="#section"`
- JavaScript string literals with escape sequences: `"text\nmore"`

## 🔧 **FIXING TRANSLATION DAMAGE**

### Common Issues and Fixes

#### Issue 1: Translated IDs
```html
❌ Broken: id="estadoment-search"
✅ Fixed:  id="statement-search"
```

#### Issue 2: Translated JavaScript Function Names
```javascript
❌ Broken: function analizarJSON()
✅ Fixed:  function parseJSON()
```

#### Issue 3: Broken JavaScript String Escapes
```javascript
❌ Broken: "tiempo de\nsolicitud" (actual line break)
✅ Fixed:  "tiempo de\\nsolicitud" (escaped)
```

### Automated Fix Commands
```bash
# Reset to working English files
cp en/index.html de/index.html es/index.html pt/index.html

# Apply protected translation
python3 settings/translate_protected.py

# Validate results
python3 settings/validate_js_syntax.py
python3 settings/validate_html_attributes.py
```

## 🎯 **INTEGRATION WITH EXISTING GUIDES**

### Update LOCALIZATION_GUIDE.md Step 4:
Replace current translation scripts with:
```bash
# Use protected translation instead of legacy scripts
python3 settings/translate_protected.py
```

### Update RELEASE_GUIDE.md Step 4:
Add HTML attribute validation:
```bash
4. 🚨 CRITICAL: Dual Validation System
   - python3 settings/validate_js_syntax.py
   - python3 settings/validate_html_attributes.py
```

---

**Remember:** When in doubt, DON'T translate code-related content. Only translate what users see and read.
