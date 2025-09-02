# Release Troubleshooting Guide

This guide provides solutions for common issues encountered during the release process, based on real-world release failures and their fixes.

## 🚨 Critical Issues and Fixes

### Issue 1: Version Inconsistencies Across Files

**Symptoms:**
- Different version numbers in different files
- Some files show old version, others show new version
- Meta tags don't match JavaScript constants

**Root Cause:**
- VERSION_UPDATE_GUIDE.md process incomplete
- Language files not properly updated
- Manual version updates missed some files

**Fix:**
```bash
# Replace OLD_VERSION and NEW_VERSION with actual versions
OLD_VERSION="3.10.0"
NEW_VERSION="3.11.0"
NEW_DATE="2025-09-01"

# Fix HTML meta version tags
sed -i '' "s/content=\"$OLD_VERSION\"/content=\"$NEW_VERSION\"/g" *.html */index.html

# Fix JavaScript constants  
sed -i '' "s/APP_VERSION = \"$OLD_VERSION\"/APP_VERSION = \"$NEW_VERSION\"/g" *.html */index.html

# Fix last-updated dates
sed -i '' "s/LAST_UPDATED = \".*\"/LAST_UPDATED = \"$NEW_DATE\"/g" *.html */index.html

# Fix version info divs
sed -i '' "s/v$OLD_VERSION/v$NEW_VERSION/g" *.html */index.html

# Fix titles in language files
sed -i '' "s/v$OLD_VERSION</v$NEW_VERSION</g" */index.html
```

**Verification:**
```bash
python3 settings/RELEASE_WORK_CHECK.py $NEW_VERSION
```

### Issue 2: Missing Version Meta Tags in Main index.html

**Symptoms:**
- Main `index.html` (landing page) missing version metadata
- Verification script reports missing version tags

**Root Cause:**
- Main `index.html` is a landing page, not included in standard version update process

**Fix:**
Add version meta tags to the `<head>` section of main `index.html`:
```html
<meta name="version" content="3.11.0" />
<meta name="last-updated" content="2025-09-01" />
```

**Manual Edit Location:**
After the `<meta name="viewport"...>` tag in `index.html`

### Issue 3: JavaScript Syntax Errors After Translation

**Symptoms:**
- `validate_js_syntax.py` reports syntax errors
- "Unexpected identifier" errors in translated files
- String concatenation issues in TEXT_CONSTANTS

**Root Cause:**
- Translation scripts break JavaScript string concatenation
- Malformed string literals in TEXT_CONSTANTS object
- Quote escaping issues in translated text

**Fix Method 1: Use String Fixer (Quick)**
```bash
python3 fix_js_strings.py
python3 settings/validate_js_syntax.py
```

**Fix Method 2: Clean Slate (Recommended)**
```bash
# Start fresh with clean English files
cp en/index.html de/index.html
cp en/index.html es/index.html  
cp en/index.html pt/index.html

# Apply safe translations
python3 apply_safe_translations.py

# Verify syntax
python3 settings/validate_js_syntax.py
```

**Prevention:**
- Always run `validate_js_syntax.py` after any translation
- Use `apply_safe_translations.py` instead of comprehensive translation scripts
- Never manually edit JavaScript in translated files

### Issue 4: English Text Remaining in Non-English Files

**Symptoms:**
- Buttons still show "Copy", "Show More", "Hide" in German/Spanish/Portuguese files
- Tab headers show "Dashboard", "Timeline", "Analysis" instead of translations
- UI constants not translated

**Root Cause:**
- Incomplete translation coverage
- New features added to English files not translated
- Translation scripts missing new text patterns

**Fix Method 1: Comprehensive Re-translation**
```bash
# Apply comprehensive translations (may cause syntax issues)
python3 apply_comprehensive_insights_translations.py

# Fix any syntax issues
python3 fix_js_strings.py
python3 settings/validate_js_syntax.py
```

**Fix Method 2: Safe Re-translation (Recommended)**
```bash
# Start with fresh English files
cp en/index.html de/index.html es/index.html pt/index.html

# Apply safe translations only
python3 apply_safe_translations.py

# Verify results
python3 settings/RELEASE_WORK_CHECK.py
```

### Issue 5: HTML Structure Inconsistencies

**Symptoms:**
- Script tag count mismatches (e.g., 2 open, 10 close)
- Missing DOCTYPE, html, head, or body tags
- HTML validation errors

**Root Cause:**
- Translation scripts corrupting HTML structure
- File copy operations incomplete
- Malformed HTML from translation process

**Fix:**
```bash
# Verify current structure
for file in *.html */index.html; do
  if [ -f "$file" ]; then
    echo "=== $file ==="
    echo "DOCTYPE: $(grep -c DOCTYPE "$file")"
    echo "HTML tags: $(grep -c "<html" "$file")"
    echo "Head tags: $(grep -c "<head>" "$file")"  
    echo "Body tags: $(grep -c "<body" "$file")"
    echo "Script open: $(grep -c "<script" "$file")"
    echo "Script close: $(grep -c "</script>" "$file")"
    echo
  fi
done

# If major issues found, recreate files from English version
cp en/index.html de/index.html es/index.html pt/index.html
python3 apply_safe_translations.py
```

### Issue 6: Missing Critical Files

**Symptoms:**
- Verification script reports missing files
- Language-specific README files missing
- HTML application files missing

**Root Cause:**
- Incomplete git checkout
- Files accidentally deleted during process
- Directory structure changes

**Fix:**
```bash
# Check what's missing
ls -la *.html */index.html README*.md */README*.md

# Recreate missing language files if needed
[ ! -f de/index.html ] && cp en/index.html de/index.html
[ ! -f es/index.html ] && cp en/index.html es/index.html  
[ ! -f pt/index.html ] && cp en/index.html pt/index.html

# Apply translations to recreated files
python3 apply_safe_translations.py

# Verify all files exist
python3 settings/RELEASE_WORK_CHECK.py
```

## 🔧 Diagnostic Commands

### Quick Version Check
```bash
# Check version consistency across all files
echo "=== VERSION SUMMARY ==="
echo "AGENT.md: $(grep 'Current Version' AGENT.md | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+')"
echo "README.md: $(grep '# Couchbase.*v' README.md | grep -o 'v[0-9]\+\.[0-9]\+\.[0-9]\+')"
echo "Main index.html: $(grep 'name="version"' index.html | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+')"
echo "Docker: $(grep 'LABEL version=' Dockerfile | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+')"
echo "Language files:"
for lang in en de es pt; do
  if [ -f "$lang/index.html" ]; then
    version=$(grep 'APP_VERSION' "$lang/index.html" | head -1 | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+')
    echo "  $lang/index.html: $version"
  fi
done
```

### JavaScript Syntax Quick Check
```bash
# Quick JavaScript validation
for file in *.html */index.html; do
  if [ -f "$file" ]; then
    echo -n "$file: "
    if python3 settings/validate_js_syntax.py 2>&1 | grep -q "$file.*PASS"; then
      echo "✅"
    else 
      echo "❌"
    fi
  fi
done
```

### Localization Coverage Check
```bash
# Check translation coverage
echo "=== LOCALIZATION COVERAGE ==="
echo "German (de/index.html):"
echo "  Dashboard → Instrumententafel: $(grep -c 'Instrumententafel' de/index.html)"
echo "  Timeline → Zeitverlauf: $(grep -c 'Zeitverlauf' de/index.html)"
echo "  Copy → Kopieren: $(grep -c '>Kopieren<' de/index.html)"

echo "Spanish (es/index.html):"  
echo "  Dashboard → Panel de Control: $(grep -c 'Panel de Control' es/index.html)"
echo "  Timeline → Línea de Tiempo: $(grep -c 'Línea de Tiempo' es/index.html)"
echo "  Copy → Copiar: $(grep -c '>Copiar<' es/index.html)"

echo "Portuguese (pt/index.html):"
echo "  Dashboard → Painel de Controle: $(grep -c 'Painel de Controle' pt/index.html)"
echo "  Timeline → Linha do Tempo: $(grep -c 'Linha do Tempo' pt/index.html)" 
echo "  Copy → Copiar: $(grep -c '>Copiar<' pt/index.html)"
```

## 🚨 Emergency Recovery

If the release process is severely broken:

### Nuclear Option: Start Fresh
```bash
# 1. Save any custom changes
cp settings/release_*.txt /tmp/
cp AGENT.md /tmp/AGENT.md.backup

# 2. Reset language files to working English version
cp en/index.html de/index.html
cp en/index.html es/index.html
cp en/index.html pt/index.html

# 3. Apply only safe translations
python3 apply_safe_translations.py

# 4. Manually update version numbers
NEW_VERSION="3.11.0"  # Change as needed
NEW_DATE="2025-09-01"  # Change as needed

sed -i '' "s/content=\"[0-9]\+\.[0-9]\+\.[0-9]\+\"/content=\"$NEW_VERSION\"/g" *.html */index.html
sed -i '' "s/APP_VERSION = \"[0-9]\+\.[0-9]\+\.[0-9]\+\"/APP_VERSION = \"$NEW_VERSION\"/g" */index.html
sed -i '' "s/v[0-9]\+\.[0-9]\+\.[0-9]\+/v$NEW_VERSION/g" *.html */index.html

# 5. Verify everything works
python3 settings/validate_js_syntax.py
python3 settings/RELEASE_WORK_CHECK.py $NEW_VERSION

# 6. If checks pass, continue with release process
```

## 📚 Prevention Best Practices

1. **Always use RELEASE_WORK_CHECK.py** before marking a release complete
2. **Run JavaScript validation after every translation step**
3. **Use safe translation scripts** (`apply_safe_translations.py`) instead of comprehensive ones when possible
4. **Keep backups** of working files before major translation operations
5. **Test the release process on a branch** before applying to main
6. **Document any new issues** encountered and their solutions

## 🔗 Related Files

- **[RELEASE_GUIDE.md](RELEASE_GUIDE.md)** - Main release process
- **[VERSION_UPDATE_GUIDE.md](VERSION_UPDATE_GUIDE.md)** - Version number updates
- **[LOCALIZATION_GUIDE.md](LOCALIZATION_GUIDE.md)** - Translation process
- **[RELEASE_WORK_CHECK.py](RELEASE_WORK_CHECK.py)** - Automated verification tool
- **[validate_js_syntax.py](validate_js_syntax.py)** - JavaScript validation tool
- **[fix_js_strings.py](../fix_js_strings.py)** - JavaScript syntax repair tool
