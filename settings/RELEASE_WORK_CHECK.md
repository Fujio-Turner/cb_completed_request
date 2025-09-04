# Release Work Verification Tool

## Purpose
This guide provides independent verification commands to double-check that release work claimed in `release_*.txt` files was actually completed. Run these checks after any release to ensure all changes were properly applied.

## How to Use
1. **Find your release log:** `ls settings/release_*.txt` and pick the most recent one
2. **Extract claimed version:** Look for "New Version:" in the release log 
3. **Replace `{VERSION}` below** with the actual version number from your release log
4. **Run verification commands** to check if the work was really done

---

## 🔍 Version Consistency Verification

### Check All HTML Files Have Correct Version
```bash
# Expected: All should show the same new version number
grep -r "name=\"version\"" *.html */index.html 2>/dev/null | grep -v old_

# Expected: All titles should show v{VERSION}
grep -r "<title>" *.html */index.html 2>/dev/null | grep -v old_

# Expected: All version-info divs should show v{VERSION}
grep -r "version-info" *.html */index.html 2>/dev/null | grep -v old_

# Expected: All APP_VERSION constants should show "{VERSION}"
grep -r "APP_VERSION" *.html */index.html 2>/dev/null | grep -v old_
```

### Check Documentation Files
```bash
# Expected: All should show v{VERSION} in headers
grep -r "# Couchbase Slow Query Analysis Tool" README*.md */README*.md AGENT.md 2>/dev/null

# Check AGENT.md version section specifically
grep -A2 -B1 "Current Version" AGENT.md
```

### Check Docker Files
```bash
# Expected: Should show LABEL version="{VERSION}"
grep "version=" Dockerfile

# Expected: Should show version tags matching new version
grep -A10 -B5 "type=raw,value=" .github/workflows/docker-build-push.yml
```

---

## 🌐 Localization Verification

### Check for Untranslated Critical Elements
```bash
# These should return ZERO results (no English in non-English files)
echo "=== Checking for English 'Copy' buttons in non-English files ==="
grep -n "Copy</button>" de/index.html es/index.html pt/index.html 2>/dev/null || echo "✅ No English Copy buttons found"

echo "=== Checking for English button text in non-English files ==="
grep -n ">Copy<\|>Show<\|>Hide<\|>Reset<" de/index.html es/index.html pt/index.html 2>/dev/null || echo "✅ No English button text found"
```

### Check Tab Headers Are Translated
```bash
# Should show translated versions, not English
echo "=== German tab headers ==="
grep -n ">Dashboard<\|>Timeline<\|>Analysis<" de/index.html 2>/dev/null || echo "❌ German tabs might not be translated"

echo "=== Spanish tab headers ==="
grep -n ">Dashboard<\|>Timeline<\|>Analysis<" es/index.html 2>/dev/null || echo "❌ Spanish tabs might not be translated"

echo "=== Portuguese tab headers ==="
grep -n ">Dashboard<\|>Timeline<\|>Analysis<" pt/index.html 2>/dev/null || echo "❌ Portuguese tabs might not be translated"
```

### Check Language File Structure
```bash
# Expected: Should list index.html in each language directory
echo "=== Verifying language file structure ==="
ls -la de/index.html es/index.html pt/index.html 2>/dev/null && echo "✅ All language files exist" || echo "❌ Missing language files"

# Check main index.html exists
ls -la index.html 2>/dev/null && echo "✅ Main index.html exists" || echo "❌ Missing main index.html"
```

---

## 📚 Documentation Verification

### Check README Files Structure
```bash
# Expected: All README files should exist
echo "=== Verifying README files exist ==="
ls -la README.md */README*.md 2>/dev/null

# Check for Quick Start sections (should be positioned early)
echo "=== Checking Quick Start positioning ==="
for readme in README.md */README*.md; do
  if [ -f "$readme" ]; then
    echo "--- $readme ---"
    grep -n -A2 -B2 "Quick Start\|Início Rápido\|Inicio Rápido\|Schnellstart" "$readme" 2>/dev/null || echo "No Quick Start found"
  fi
done
```

### Check Release Notes Were Added
```bash
# Expected: Should find version entries with today's date pattern
echo "=== Checking for release notes entries ==="
for readme in README.md */README*.md; do
  if [ -f "$readme" ]; then
    echo "--- $readme ---"
    grep -n -A3 -B1 "v[0-9]\+\.[0-9]\+\.[0-9]\+" "$readme" | head -10
  fi
done
```

---

## 🧪 Functional Verification

### Check All HTML Files Load Without Obvious Errors
```bash
# Basic syntax check - look for common HTML structure
echo "=== Basic HTML structure verification ==="
for htmlfile in index.html de/index.html es/index.html pt/index.html; do
  if [ -f "$htmlfile" ]; then
    echo "--- $htmlfile ---"
    echo "Has DOCTYPE: $(grep -c DOCTYPE "$htmlfile")"
    echo "Has html tag: $(grep -c "<html" "$htmlfile")"
    echo "Has head tag: $(grep -c "<head>" "$htmlfile")"
    echo "Has body tag: $(grep -c "<body>" "$htmlfile")"
    echo "Has script tags: $(grep -c "<script>" "$htmlfile")"
    echo ""
  fi
done
```

### Check JavaScript Constants Are Properly Set
```bash
# Expected: All should have matching APP_VERSION and LAST_UPDATED
echo "=== JavaScript constants verification ==="
for htmlfile in index.html de/index.html es/index.html pt/index.html; do
  if [ -f "$htmlfile" ]; then
    echo "--- $htmlfile ---"
    grep "const APP_VERSION" "$htmlfile" 2>/dev/null
    grep "const LAST_UPDATED" "$htmlfile" 2>/dev/null
    echo ""
  fi
done
```

---

## 🔄 Cross-Reference Verification

### Version Consistency Cross-Check
```bash
echo "=== Cross-referencing all version mentions ==="

# Get version from AGENT.md
AGENT_VERSION=$(grep "Current Version.*v" AGENT.md | grep -o "v[0-9]\+\.[0-9]\+\.[0-9]\+" | head -1)
echo "AGENT.md version: $AGENT_VERSION"

# Get version from main README
README_VERSION=$(grep "# Couchbase.*v[0-9]" README.md | grep -o "v[0-9]\+\.[0-9]\+\.[0-9]\+" | head -1)
echo "README.md version: $README_VERSION"

# Get version from main HTML meta tag
HTML_VERSION=$(grep "name=\"version\"" index.html | grep -o "[0-9]\+\.[0-9]\+\.[0-9]\+" | head -1)
echo "index.html meta version: v$HTML_VERSION"

# Get version from JavaScript constant
JS_VERSION=$(grep "APP_VERSION.*=" index.html | grep -o "[0-9]\+\.[0-9]\+\.[0-9]\+" | head -1)
echo "JavaScript APP_VERSION: v$JS_VERSION"

# Get Docker version
DOCKER_VERSION=$(grep "LABEL version=" Dockerfile | grep -o "[0-9]\+\.[0-9]\+\.[0-9]\+" | head -1)
echo "Dockerfile version: v$DOCKER_VERSION"

echo ""
echo "✅ All versions should match. If they don't, the release was incomplete."
```

### File Modification Date Check
```bash
echo "=== Checking recent modification dates ==="
echo "Files modified in the last 24 hours:"
find . -name "*.html" -o -name "*.md" -o -name "Dockerfile" -o -name "*.yml" | \
  grep -v ".git" | xargs ls -lt | head -20
```

---

## 🚨 Red Flags to Look For

Run this comprehensive check to spot common release problems:

```bash
echo "🚨 RED FLAG DETECTOR 🚨"
echo "=========================="

# Check for version mismatches
echo "1. Checking for old version remnants..."
OLD_VERSIONS=$(grep -r "3\.7\.[0-1]" *.html */index.html *.md AGENT.md Dockerfile 2>/dev/null | grep -v release_ | grep -v "cdnjs.cloudflare.com" | grep -v "integrity=" | grep -v "crossorigin=" || true)
if [ -n "$OLD_VERSIONS" ]; then
  echo "❌ Found old version numbers:"
  echo "$OLD_VERSIONS"
else
  echo "✅ No old version remnants found"
fi

echo ""
echo "2. Checking for English text in non-English files..."
ENGLISH_IN_LANGS=$(grep -n "Dashboard\|Timeline\|Analysis\|Copy\|Show\|Hide\|Reset" de/index.html es/index.html pt/index.html 2>/dev/null || true)
if [ -n "$ENGLISH_IN_LANGS" ]; then
  echo "❌ Found English text in non-English files:"
  echo "$ENGLISH_IN_LANGS"
else
  echo "✅ No obvious English text in language files"
fi

echo ""
echo "3. Checking for missing critical files..."
MISSING_FILES=""
for file in index.html de/index.html es/index.html pt/index.html AGENT.md README.md Dockerfile; do
  if [ ! -f "$file" ]; then
    MISSING_FILES="$MISSING_FILES $file"
  fi
done

if [ -n "$MISSING_FILES" ]; then
  echo "❌ Missing critical files:$MISSING_FILES"
else
  echo "✅ All critical files present"
fi

echo ""
echo "4. Checking for syntax errors in HTML..."
for htmlfile in index.html de/index.html es/index.html pt/index.html; do
  if [ -f "$htmlfile" ]; then
    UNCLOSED_TAGS=$(grep -c "<script>" "$htmlfile" 2>/dev/null) || 0
    CLOSE_TAGS=$(grep -c "</script>" "$htmlfile" 2>/dev/null) || 0
    if [ "$UNCLOSED_TAGS" != "$CLOSE_TAGS" ]; then
      echo "❌ Script tag mismatch in $htmlfile: $UNCLOSED_TAGS open, $CLOSE_TAGS close"
    fi
  fi
done

echo ""
echo "=========================="
echo "🔍 VERIFICATION COMPLETE"
```

---

## 📋 Verification Report Template

After running the checks above, fill out this summary:

```
RELEASE VERIFICATION REPORT
===========================
Release Log Checked: settings/release_{DATE}.txt
Version Verified: {VERSION}
Verification Date: {TODAY}
Verified By: {YOUR_NAME}

VERSION CONSISTENCY:
[ ] All HTML files show v{VERSION}
[ ] All README files show v{VERSION}
[ ] AGENT.md shows v{VERSION}
[ ] Docker files show v{VERSION}
[ ] All versions match exactly

LOCALIZATION:
[ ] No English "Copy" buttons in language files
[ ] No English "Show/Hide/Reset" in language files
[ ] Tab headers translated in all languages
[ ] All language files (de/, es/, pt/) exist

DOCUMENTATION:
[ ] All README files exist and updated
[ ] Release notes added to README files
[ ] Quick Start sections properly positioned
[ ] AGENT.md version section updated

FUNCTIONAL:
[ ] All HTML files have proper structure
[ ] JavaScript constants set correctly
[ ] No obvious syntax errors found
[ ] File modification dates look recent

RED FLAGS:
[ ] No old version numbers found anywhere
[ ] No English text in non-English files
[ ] No missing critical files
[ ] No HTML syntax errors detected

OVERALL RESULT:
[ ] PASS - Release work verified successfully
[ ] FAIL - Issues found, see details above

NOTES:
{Any additional observations or issues found}
```

---

## 💡 Usage Tips

1. **Run immediately after release:** Don't wait - verify while the work is fresh
2. **Replace {VERSION} with actual version:** The version number from your release log
3. **Check specific language files:** If you know which languages were updated
4. **Save verification results:** Keep a record of what you found
5. **Fix issues before deployment:** Don't deploy if verification fails

This tool is independent of the release process and only checks final results, not what the release guides claim was done.
