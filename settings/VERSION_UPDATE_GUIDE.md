# Version Update Guide

This guide provides detailed instructions for updating version numbers across all files in the Couchbase Query Analyzer project.

## 🎯 When to Update Versions

Use semantic versioning: **MAJOR.MINOR.PATCH**

- **MAJOR**: Breaking changes or complete rewrites (e.g., 3.0.0 → 4.0.0)
- **MINOR**: New features, significant enhancements (e.g., 3.2.0 → 3.3.0)  
- **PATCH**: Bug fixes, small improvements (e.g., 3.2.0 → 3.2.1)

## 📝 Files to Update

### 1. HTML Files (All Language Versions)

#### A. Meta Tags in `<head>` Section
```html
<meta name="version" content="X.X.X" />
<meta name="last-updated" content="YYYY-MM-DD" />
```

#### B. Title Tag
```html
<!-- English (index.html) -->
<title>Query Analyzer vX.X.X</title>

<!-- German (de_index.html) -->
<title>Query Analyzer vX.X.X</title>

<!-- Spanish (es_index.html) -->
<title>Analizador de Consultas vX.X.X</title>

<!-- Portuguese (pt_index.html) -->
<title>Analisador de Consultas vX.X.X</title>
```

#### C. Version Info Display (UI Element)
Find and update the version display div in the HTML body:
```html
<!-- Version info -->
<div class="version-info" title="Couchbase Query Analyzer Version">
  vX.X.X
</div>
```

#### D. JavaScript Constants
Find and update these variables in each HTML file:
```javascript
const APP_VERSION = "X.X.X";
const LAST_UPDATED = "YYYY-MM-DD";
```

### 2. Documentation Files

#### A. AGENT.md
```markdown
# Couchbase Slow Query Analysis Tool vX.X.X

## Version Management
- **Current Version**: X.X.X (Last Updated: YYYY-MM-DD)
- **Title Updates**: When updating versions, remember to update:
  - `<title>Query Analyzer vX.X.X</title>` in index.html header
  - `<meta name="version" content="X.X.X" />` in index.html meta tags
  - `APP_VERSION = 'X.X.X';` in JavaScript constants
```

#### B. README Files
Update the main heading in all README files:
- `README.md` (English)
- `README.de.md` (German)  
- `README.es.md` (Spanish)
- `README.pt.md` (Portuguese)

```markdown
# Couchbase Slow Query Analysis Tool vX.X.X
```

## 🔄 Step-by-Step Update Process

### Step 1: Determine Version Type
- Assess the changes made since last version
- Choose appropriate version increment (MAJOR/MINOR/PATCH)

### Step 2: Update HTML Files
For each HTML file (`index.html`, `de_index.html`, `es_index.html`, `pt_index.html`):

1. **Update meta version tag:**
   ```html
   <meta name="version" content="X.X.X" />
   ```

2. **Update meta last-updated tag:**
   ```html
   <meta name="last-updated" content="YYYY-MM-DD" />
   ```

3. **Update title tag** (with appropriate language):
   ```html
   <title>Query Analyzer vX.X.X</title>
   ```

4. **Update version info display div:**
   ```html
   <div class="version-info" title="Couchbase Query Analyzer Version">
     vX.X.X
   </div>
   ```

5. **Update JavaScript constants:**
   ```javascript
   const APP_VERSION = "X.X.X";
   const LAST_UPDATED = "YYYY-MM-DD";
   ```

### Step 3: Update Documentation

1. **Update AGENT.md:**
   - Main heading
   - Version Management section
   - Example version references

2. **Update README files:**
   - Main heading in all language versions
   - Add "What's New" section for MINOR/MAJOR updates

### Step 4: Verification

Run these checks to ensure all versions are updated:

```bash
# Check HTML meta tags
grep -r "name=\"version\"" *.html

# Check HTML titles  
grep -r "<title>" *.html

# Check version info display divs
grep -r "version-info" *.html

# Check JavaScript constants
grep -r "APP_VERSION" *.html

# Check README headings
grep -r "# Couchbase Slow Query Analysis Tool" README*.md

# Check AGENT.md
grep -r "# Couchbase Slow Query Analysis Tool" AGENT.md
```

## 📋 Version Update Checklist

When updating to version X.X.X:

### HTML Files
- [ ] `index.html` - meta version tag
- [ ] `index.html` - meta last-updated tag  
- [ ] `index.html` - title tag
- [ ] `index.html` - version-info div
- [ ] `index.html` - APP_VERSION constant
- [ ] `index.html` - LAST_UPDATED constant
- [ ] `de_index.html` - all above elements
- [ ] `es_index.html` - all above elements  
- [ ] `pt_index.html` - all above elements

### Documentation Files
- [ ] `AGENT.md` - main heading
- [ ] `AGENT.md` - version management section
- [ ] `README.md` - main heading
- [ ] `README.de.md` - main heading
- [ ] `README.es.md` - main heading
- [ ] `README.pt.md` - main heading
- [ ] Add "What's New" sections (for MINOR/MAJOR updates)

### Verification
- [ ] All HTML files show same version
- [ ] All README files show same version
- [ ] AGENT.md references correct version
- [ ] JavaScript constants match meta tags
- [ ] Last-updated date is current

## 🚨 Common Issues

1. **Inconsistent Versions**: Ensure all files use the exact same version string
2. **Date Format**: Use YYYY-MM-DD format consistently
3. **Language-Specific Titles**: Maintain correct translations in titles
4. **JavaScript Quotes**: Some files use single quotes, others double quotes - maintain consistency within each file
5. **Case Sensitivity**: Ensure proper capitalization in titles and headings

## 📚 Related Files

- [LOCALIZATION_GUIDE.md](LOCALIZATION_GUIDE.md) - For language-specific updates
- [AGENT.md](../AGENT.md) - Main project documentation
