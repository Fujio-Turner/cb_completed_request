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

**📝 README Content Organization:**
- Keep **Quick Start** section visible and high up in the document
- Move **What's New** and **Changes** content into **Release Notes** section near the bottom
- Perform spell checking on all README files before finalizing updates
- Ensure Release Notes follow reverse chronological order (newest first)

#### C. Docker Files

##### Dockerfile
Update the version label in the Dockerfile:
```dockerfile
LABEL version="X.X.X"
```

**Location**: `/Dockerfile` (root directory)
**Example**: `LABEL version="3.6.0"`

##### GitHub Actions Workflow (.github/workflows/docker-build-push.yml)
Update the version tags in the workflow:
```yaml
tags: |
  type=ref,event=pr
  type=sha,prefix=dev-,enable={{is_default_branch!=true}}
  type=raw,value=latest,enable={{is_default_branch}}
  type=raw,value=X.X.X,enable={{is_default_branch}}
  type=raw,value=vX.X.X,enable={{is_default_branch}}
```

**Location**: `/.github/workflows/docker-build-push.yml`
**Example**: 
```yaml
type=raw,value=3.6.0,enable={{is_default_branch}}
type=raw,value=v3.6.0,enable={{is_default_branch}}
```

**Tag Strategy**:
- **Production releases**: `latest`, `3.6.0`, `v3.6.0` (only on main branch)
- **Pull requests**: `pr-123` tags
- **Development**: `dev-<sha>` tags (only on non-main branches)

#### Docker Image Cleanup

**Problem**: Multiple tags create duplicate images in Docker Hub

**Current Cleanup Process**:
1. **Manual Cleanup**: Delete old version tags from Docker Hub UI
2. **Keep Strategy**: Only keep latest 2-3 versions for production use
3. **Development Tags**: Clean up `main-<sha>` and `dev-<sha>` tags regularly

**Automated Cleanup Script** (Future Enhancement):
```bash
# Delete old development tags (run manually when needed)
docker rmi fujioturner/couchbase-query-analyzer:main-<old-sha>
docker rmi fujioturner/couchbase-query-analyzer:dev-<old-sha>
```

**Docker Hub Manual Cleanup**:
1. Go to [Docker Hub Repository](https://hub.docker.com/r/fujioturner/couchbase-query-analyzer/tags)
2. Delete tags for old versions (keep latest 2-3 releases)
3. Delete development SHA-based tags: `main-<sha>`, `dev-<sha>`
4. Keep these tags: `latest`, `<current-version>`, `v<current-version>`

## 🔄 Step-by-Step Update Process

### **Step 1: Create Release Log**
Before starting any updates, create a copy of the release template to track all changes:
```bash
# Copy template with current datetime
cp settings/release.template settings/release_$(date +%Y%m%d_%H%M%S).txt

# Open the copied file and update it throughout the release process
```

**📝 IMPORTANT**: Update the release log file after each step to document what changes were made and to which files.

### **Step 2: Determine Version Type**
**FIRST:** Use [VERSION_CALCULATION_GUIDE.md](VERSION_CALCULATION_GUIDE.md) Step 1 through Step 4 to analyze your changes and determine the appropriate version number.

The VERSION_CALCULATION_GUIDE.md provides:
- Current version detection commands
- Change analysis framework (MAJOR/MINOR/PATCH)
- Version calculation formulas
- Decision documentation template
- **No files are modified** - it's a "dry run" planning tool

**After completing VERSION_CALCULATION_GUIDE.md, you should have:**
- Current version: `_____________`
- New version: `_____________`
- Version type: `[MAJOR/MINOR/PATCH]`
- Documented reasoning for the version choice

**Proceed with the steps below only after you have completed VERSION_CALCULATION_GUIDE.md Step 1 through Step 4.**

### **Step 3: Update HTML Files**
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

### **Step 4: Update Documentation**

1. **Add Release Notes to All README Files:** 
   ```bash
   # Use the release notes automation script
   python3 python/add_release_notes.py
   # OR manually add release notes to:
   # - README.md
   # - de/README.de.md  
   # - es/README.es.md
   # - pt/README.pt.md
   ```

2. **Update AGENT.md:**
   - Main heading
   - Version Management section
   - Example version references

2. **Update README files:**
   - Main heading in all language versions
   - Reorganize content: Keep Quick Start section high up, move What's New/Changes to Release Notes section near bottom
   - Perform spell checking on all README files
   - Update Release Notes section with new version information (reverse chronological order)

### **Step 5: Update Release Log**
After completing all version updates, update your release log file with:
- Final version numbers
- List of all files modified
- Date of completion
- Any special notes or issues encountered

### **Step 6: Mandatory Verification**

🚨 **REQUIRED**: Run the automated verification script:
```bash
python3 python/RELEASE_WORK_CHECK.py [YOUR_VERSION]
```

**If the script reports any issues, you MUST fix them before proceeding.**

#### **Manual Verification Commands** (for debugging)
If you need to debug specific issues, use these commands:

```bash
# Check HTML meta tags (should ALL show same version)
grep -r "name=\"version\"" *.html */index.html

# Check HTML titles (should ALL show same version)
grep -r "<title>" *.html */index.html

# Check version info display divs (should ALL show same version)
grep -r "version-info" *.html */index.html

# Check JavaScript constants (should ALL show same version)
grep -r "APP_VERSION" *.html */index.html

# Check README headings (should ALL show same version)
grep -r "# Couchbase Slow Query Analysis Tool" README*.md */README*.md AGENT.md

# Check Docker files
grep "version=" Dockerfile
grep "type=raw,value=" .github/workflows/docker-build-push.yml
```

#### **Expected Results**
- **All meta tags show:** `content="X.X.X"`
- **All JavaScript constants show:** `APP_VERSION = "X.X.X"`  
- **All README files show:** `Tool vX.X.X`
- **All language files have consistent versions**
- **Docker files show:** `version="X.X.X"`

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
- [ ] Reorganize README content: Keep Quick Start high up, move What's New/Changes to Release Notes
- [ ] Perform spell checking pass on all README files
- [ ] Update Release Notes sections with new version information

### Docker Files
- [ ] `Dockerfile` - LABEL version="X.X.X" in root directory
- [ ] `.github/workflows/docker-build-push.yml` - version tags

### Verification
- [ ] All HTML files show same version
- [ ] All README files show same version
- [ ] AGENT.md references correct version
- [ ] JavaScript constants match meta tags
- [ ] Last-updated date is current
- [ ] Docker files use same version number
- [ ] Docker Hub shows correct version tags

## 🚨 Common Issues

1. **Inconsistent Versions**: Ensure all files use the exact same version string
2. **Date Format**: Use YYYY-MM-DD format consistently
3. **Language-Specific Titles**: Maintain correct translations in titles
4. **JavaScript Quotes**: Some files use single quotes, others double quotes - maintain consistency within each file
5. **Case Sensitivity**: Ensure proper capitalization in titles and headings

## 📚 Related Files

- **[VERSION_CALCULATION_GUIDE.md](VERSION_CALCULATION_GUIDE.md)** - Determine version number before using this guide (REQUIRED FIRST STEP)
- **[RELEASE_GUIDE.md](RELEASE_GUIDE.md)** - Master guide for complete releases (combines this guide with others)  
- **[LOCALIZATION_GUIDE.md](LOCALIZATION_GUIDE.md)** - For language-specific updates
- **[settings/release.template](release.template)** - Template for tracking release changes
- **[AGENT.md](../AGENT.md)** - Main project documentation

## 🔄 Usage Context

- **Use this guide independently:** When testing version updates without localization changes
- **Use via RELEASE_GUIDE.md:** When performing a complete release with version + localization updates
