# Python Utility Scripts

## Translation Scripts

### ✅ simple_html_translator.py
**The ONLY translation script you need.**
- Translates basic HTML content (titles, tabs, labels)
- Protects JavaScript, CSS, and technical elements
- Usage: `python simple_html_translator.py de`

### ✅ validate_js_syntax.py
**Validate JavaScript syntax in HTML files**
- Checks for broken JavaScript after translations
- Usage: `python validate_js_syntax.py`

### ✅ validate_html_attributes.py
**Validate HTML attributes weren't translated**
- Prevents DOM errors from translated IDs/classes
- Usage: `python validate_html_attributes.py`

## Analysis Scripts

### ✅ find_hardcoded_strings.py
**Find English strings that need TEXT_CONSTANTS**
- Identifies hardcoded text in JavaScript
- Usage: `python find_hardcoded_strings.py`

### ✅ analyze_dead_code.py
**Find unused functions and variables**
- Code optimization tool
- Usage: `python analyze_dead_code.py`

### ✅ quick_dead_code_cleanup.py
**Remove confirmed dead code**
- Use after analyze_dead_code.py
- Usage: `python quick_dead_code_cleanup.py`

### ✅ optimize_css.py
**Optimize and deduplicate CSS**
- Minification and cleanup
- Usage: `python optimize_css.py`

## Release Scripts

### ✅ add_release_notes.py
**Add release notes to README files**
- Updates all language README files
- Usage: `python add_release_notes.py`

### ✅ release_notes_v3_12_0.py
**Version-specific release notes**
- Generated release notes for v3.12.0

### ✅ RELEASE_WORK_CHECK.py
**Release checklist validation**
- Ensures all release steps completed
- Usage: `python RELEASE_WORK_CHECK.py`

## Legacy Scripts (for reference)

### safe_translate.py
**Basic safe translation (legacy)**
- Older version of simple_html_translator.py

### analyze_translation_patterns.py
**Translation pattern analysis (legacy)**
- Used to develop current approach

### find_translatable_text.py
**Find translatable content (legacy)**
- Used to identify translation needs

### validate_translations.py
**Comprehensive validation (legacy)**
- More complex version of validators

## Best Practices

1. **For new translations:** Use `simple_html_translator.py` + manual TEXT_CONSTANTS editing
2. **For validation:** Always run `validate_js_syntax.py` and `validate_html_attributes.py`
3. **For optimization:** Use `analyze_dead_code.py` and `optimize_css.py`
4. **For releases:** Use `add_release_notes.py` and `RELEASE_WORK_CHECK.py`

## What NOT to do

❌ Don't create complex Python scripts that parse and modify JavaScript  
❌ Don't translate JavaScript function names, variables, or API properties  
❌ Don't translate HTML IDs, CSS classes, or technical attributes  

✅ DO use the TEXT_CONSTANTS approach for user-facing JavaScript strings  
✅ DO use simple find-and-replace for HTML content between tags  
✅ DO validate syntax after any translation work  
