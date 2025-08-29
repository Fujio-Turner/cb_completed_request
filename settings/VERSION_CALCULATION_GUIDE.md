# Version Calculation Guide - Determine Next Version Number

This guide helps you analyze your code changes and determine what version number to use for your next release. This is a **"dry run"** process that doesn't modify any files - it only helps you decide on the appropriate version number.

## 🎯 Purpose

**Use this guide to:**
- Analyze recent code changes and determine appropriate version increment
- Get the exact version numbers BEFORE running VERSION_UPDATE_GUIDE.md
- Document the reasoning for version choice
- Prepare version information for release planning

**This guide does NOT:**
- Modify any files
- Update version numbers anywhere
- Make any code changes

## 📊 Current Version Detection

### Step 1: Find Current Version
Run these commands to detect your current version:

```bash
# Check current version in HTML files
grep -r "name=\"version\"" *.html | head -1

# Check current version in AGENT.md  
grep "Current Version" AGENT.md

# Check current version in README files
grep "# Couchbase Slow Query Analysis Tool v" README.md

# Check current version in JavaScript
grep "APP_VERSION" index.html
```

**Record your findings:**
```
Current Version Found: _______________
Source File: _________________________
Date Last Updated: ___________________
```

## 🔍 Change Analysis Framework

### Step 2: Analyze Your Changes
Review what has changed since the last version using these categories:

**💡 TIP**: Check git history for issue-related merges:
```bash
# Find recent commits with issue numbers
git log --oneline --since="1 week ago" | grep -E "issue-[0-9]+|fix/issue|feature/issue"

# Check merged branches
git branch -a | grep -E "issue|fix|feature"

# Get commit details for specific issues
git show --name-only <commit-hash>
```
Then check GitHub issues at https://github.com/Fujio-Turner/cb_completed_request/issues for context.

#### 🚨 **MAJOR Version Changes (X.0.0)**
Check if you have made any of these changes:
- [ ] **Breaking API changes**: Changed how users interact with the tool
- [ ] **Complete UI redesign**: Fundamentally different interface
- [ ] **Architecture overhaul**: Complete rewrite of core functionality  
- [ ] **Removed major features**: Features that users rely on are gone
- [ ] **Changed data formats**: Input/output formats incompatible with previous version
- [ ] **New technology stack**: Different frameworks, libraries, or core technologies

**Breaking Changes Found:**
```
- ________________________________________________
- ________________________________________________  
- ________________________________________________
```

#### 🚀 **MINOR Version Changes (X.Y.0)**
Check if you have made any of these changes:
- [ ] **New major features**: Added new tabs, charts, or analysis capabilities
- [ ] **New language support**: Added new localization (German, Spanish, etc.)
- [ ] **Enhanced functionality**: Significant improvements to existing features
- [ ] **New chart types**: Added new visualization capabilities
- [ ] **Database compatibility**: Added support for new Couchbase versions
- [ ] **Performance improvements**: Major speed or memory optimizations
- [ ] **New export formats**: Added new ways to export or save data
- [ ] **Enhanced user experience**: Major UI improvements (but not breaking)

**New Features Added:**
```
- ________________________________________________
- ________________________________________________
- ________________________________________________
```

#### 🔧 **PATCH Version Changes (X.Y.Z)**
Check if you have made any of these changes:
- [ ] **Bug fixes**: Fixed existing functionality that wasn't working
- [ ] **Small UI improvements**: Minor styling or layout improvements
- [ ] **Translation updates**: Updated existing language files
- [ ] **Documentation updates**: Updated README files, guides, or help text
- [ ] **Code cleanup**: Refactored code without changing functionality
- [ ] **Dependency updates**: Updated libraries or frameworks (no functional change)
- [ ] **Performance tweaks**: Minor optimizations
- [ ] **Compatibility fixes**: Fixed issues with specific browsers or environments

**Bug Fixes and Small Improvements:**
```
- ________________________________________________
- ________________________________________________
- ________________________________________________
```

## 📈 Version Decision Matrix

### Step 3: Determine Version Type

Based on your analysis above, determine version type:

```
IF any MAJOR changes = YES
    → MAJOR version increment (e.g., 3.7.1 → 4.0.0)

ELSE IF any MINOR changes = YES  
    → MINOR version increment (e.g., 3.7.1 → 3.8.0)

ELSE IF any PATCH changes = YES
    → PATCH version increment (e.g., 3.7.1 → 3.7.2)

ELSE
    → No version change needed
```

### Step 4: Calculate New Version Number

**Current Version:** `_______________` (from Step 1)

**Version Type:** `[MAJOR/MINOR/PATCH]` (from Step 3)

**New Version Calculation:**

For **MAJOR** increment:
```
Current: X.Y.Z  
New:     (X+1).0.0

Example: 3.7.1 → 4.0.0
Your calculation: _________________ → _________________
```

For **MINOR** increment:
```
Current: X.Y.Z  
New:     X.(Y+1).0

Example: 3.7.1 → 3.8.0
Your calculation: _________________ → _________________
```

For **PATCH** increment:
```
Current: X.Y.Z  
New:     X.Y.(Z+1)

Example: 3.7.1 → 3.7.2  
Your calculation: _________________ → _________________
```

## 📋 Version Decision Record

Fill out this section to document your version decision:

```
=== VERSION CALCULATION RESULTS ===

Analysis Date: ___________________
Analyzed By: _____________________

Current Version: _________________
New Version: ____________________
Version Type: [MAJOR/MINOR/PATCH]

Primary Reason for Version Change:
_____________________________________
_____________________________________

Key Changes Made (with GitHub Issue References):
- ________________________________ (issue #___)
- ________________________________ (issue #___)  
- ________________________________ (issue #___)

Breaking Changes (if MAJOR):
_____________________________________

New Features (if MINOR):
_____________________________________

Bug Fixes (if PATCH):  
_____________________________________

Risk Assessment:
[ ] Low Risk - Minor changes, well tested
[ ] Medium Risk - Significant changes, needs thorough testing  
[ ] High Risk - Major changes, requires extensive validation

Next Steps:
[ ] Proceed with VERSION_UPDATE_GUIDE.md using version: ____________
[ ] Need more testing before version update
[ ] Need to reconsider version increment level

=== END CALCULATION RESULTS ===
```

## 🔄 Common Version Scenarios

### Scenario 1: Bug Fixes Only
```
Changes: Fixed chart rendering bug, corrected German translations
Analysis: Only fixes, no new features
Decision: PATCH increment (3.7.1 → 3.7.2)
```

### Scenario 2: New Language Added
```
Changes: Added Portuguese localization, updated UI for language selection
Analysis: New functionality but no breaking changes  
Decision: MINOR increment (3.7.1 → 3.8.0)
```

### Scenario 3: UI Redesign
```
Changes: Completely redesigned dashboard layout, new navigation system
Analysis: Major changes to user interface, might confuse existing users
Decision: MAJOR increment (3.7.1 → 4.0.0)
```

### Scenario 4: Mixed Changes
```
Changes: Fixed bugs, added new chart type, updated documentation
Analysis: New feature (chart) is most significant change
Decision: MINOR increment (3.7.1 → 3.8.0) - new feature drives decision
```

## 🎯 Validation Checklist

Before finalizing your version decision:

- [ ] **Change analysis complete**: Reviewed all modifications since last version
- [ ] **Version type justified**: Clear reasoning for MAJOR/MINOR/PATCH choice  
- [ ] **New version calculated**: Used correct increment formula
- [ ] **Risk assessment done**: Understand impact of changes
- [ ] **Decision documented**: Completed Version Decision Record above
- [ ] **Ready for implementation**: Prepared to run VERSION_UPDATE_GUIDE.md

## 📚 Next Steps

Once you've completed this calculation:

1. **For actual version updates**: Use [VERSION_UPDATE_GUIDE.md](VERSION_UPDATE_GUIDE.md) with your calculated version
2. **For complete releases**: Use [RELEASE_GUIDE.md](RELEASE_GUIDE.md) and reference this calculation
3. **Save this analysis**: Keep your Version Decision Record for release documentation

## 🚨 Common Mistakes to Avoid

- **Don't increment multiple levels**: If you have MAJOR changes, don't also increment MINOR/PATCH
- **Don't underestimate impact**: UI changes might be more significant than they appear
- **Don't forget localization impact**: Adding languages is typically a MINOR change
- **Consider user perspective**: What would users expect based on the changes?
- **Document your reasoning**: Future you will thank you for clear explanations

---

**Remember:** This is a planning tool. No files are modified until you run VERSION_UPDATE_GUIDE.md or RELEASE_GUIDE.md.
