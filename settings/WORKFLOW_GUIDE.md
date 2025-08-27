# Development Workflow Guide - Release Branch Strategy

This guide documents the complete development workflow from issue creation to production deployment, integrating with the VERSION_CALCULATION_GUIDE.md, VERSION_UPDATE_GUIDE.md, LOCALIZATION_GUIDE.md, and RELEASE_GUIDE.md.

## 🎯 Workflow Overview

**Deployment Pipeline:**
- **Main branch** → Automatic deployment to Cloudflare Pages + DockerHub
- **Release branches** → Staging/preparation branches
- **Feature/Fix branches** → Individual issue development

**Branch Naming Convention:**
- `main` - Production deployment branch
- `release-{metal-gear-character}` - Release preparation branches (e.g., `release-snake`, `release-raiden`)
- `fix/issue-{number}` - Bug fix branches (e.g., `fix/issue-17`)
- `feature/issue-{number}` - New feature branches (e.g., `feature/issue-19`)

## 🔄 Complete Workflow Process

### Phase 1: Release Planning & Branch Creation

#### Step 1: Create Release Branch
```bash
# Start from latest main
git checkout main
git pull origin main

# Create release branch with Metal Gear character name
git checkout -b release-snake
git push -u origin release-snake
```

**Document in Release Log:**
```
Release Branch: release-snake
Base Commit: {commit hash from main}
Issues Planned: #17, #19, #23
Release Character: Snake (Metal Gear Solid)
```

#### Step 2: Identify Issues for Release
Review GitHub issues and select which ones to include:
- [ ] **Bug fixes:** Critical and important bugs
- [ ] **New features:** Planned enhancements  
- [ ] **Documentation:** Updates and improvements
- [ ] **Localization:** Translation updates

**Record in Release Planning:**
```
ISSUES SELECTED FOR THIS RELEASE:
- Issue #17: [Bug] Chart rendering issue in German version
- Issue #19: [Feature] Add Portuguese language support
- Issue #23: [Bug] Fix copy button in timeline tab
- Issue #25: [Documentation] Update README with new features
```

### Phase 2: Development & Issue Resolution

#### Step 3: Work on Individual Issues

**For each issue, repeat this process:**

```bash
# Create feature/fix branch from release branch
git checkout release-snake
git pull origin release-snake
git checkout -b fix/issue-17

# Make your changes for issue #17
# ... coding, testing, documentation ...

# Commit the fix
git add .
git commit -m "fix: resolve chart rendering issue in German version

- Fixed chart title translation bug
- Updated German language file
- Added test for German chart rendering

Closes #17"

# Push the branch
git push -u origin fix/issue-17

# Switch back to release branch and merge
git checkout release-snake
git merge fix/issue-17
git push origin release-snake

# Clean up feature branch (optional)
git branch -d fix/issue-17
git push origin --delete fix/issue-17
```

**Repeat for each issue:**
- `feature/issue-19` (Portuguese language support)
- `fix/issue-23` (Copy button fix)
- `docs/issue-25` (README updates)

### Phase 3: Release Preparation

#### Step 4: Final Preparation on Release Branch
```bash
# Stay on release branch for final changes
git checkout release-snake

# Fix any typos, documentation issues, final touches
# Update /en/index.html if needed
# Update documentation files
# Run tests, verify functionality

# Commit final preparation changes
git add .
git commit -m "prep: final preparation for release

- Fixed typos in documentation
- Updated help text in index.html  
- Verified all language versions
- Updated sample data files"
```

#### Step 5: Determine Version Number (DRY RUN)
Now use the VERSION_CALCULATION_GUIDE.md to determine version:

1. **Open:** [VERSION_CALCULATION_GUIDE.md](VERSION_CALCULATION_GUIDE.md)
2. **Analyze changes made:** Review all commits in release-snake branch
3. **Determine version type:** Based on issues resolved (bugs = PATCH, new features = MINOR, breaking changes = MAJOR)
4. **Calculate version:** Use the guide's formulas
5. **Document decision:** Complete the Version Decision Record

**Example Analysis:**
```
=== VERSION CALCULATION RESULTS ===

Analysis Date: 2025-01-26
Analyzed By: Developer Name
Branch: release-snake
Issues Resolved: #17, #19, #23, #25

Current Version: 3.7.1
New Version: 3.8.0
Version Type: MINOR

Primary Reason for Version Change:
Added Portuguese language support (new feature)

Key Changes Made:
- Added Portuguese localization (MINOR - new feature)
- Fixed German chart rendering bug (PATCH)  
- Fixed copy button functionality (PATCH)
- Updated documentation (PATCH)

New Features (driving MINOR decision):
- Portuguese language support
- Enhanced language selection UI

Bug Fixes:
- German chart title translation
- Copy button functionality in timeline

Risk Assessment: Medium Risk - New language support requires thorough testing

Next Steps:
[x] Proceed with VERSION_UPDATE_GUIDE.md using version: 3.8.0
```

### Phase 4: Version Updates & Release

#### Step 6: Apply Version Updates
**Still on release-snake branch:**

1. **Use VERSION_UPDATE_GUIDE.md:** Apply all version updates using your calculated version
2. **Use LOCALIZATION_GUIDE.md:** Ensure all translations are current  
3. **Use release.template:** Create release log to track all changes

```bash
# Create release log from template
cp settings/release.template settings/release_snake_$(date +%Y%m%d_%H%M%S).txt

# Apply all version updates following VERSION_UPDATE_GUIDE.md
# Apply all localization updates following LOCALIZATION_GUIDE.md
# Update release log throughout the process
```

#### Step 7: Final Release Commit
```bash
# Final commit on release branch with version and issue closures
git add .
git commit -m "release: version 3.8.0

- Added Portuguese language support  
- Fixed German chart rendering
- Fixed copy button functionality
- Updated all documentation
- Applied version updates to all files

Closes #17, Closes #19, Closes #23, Closes #25"

git push origin release-snake
```

#### Step 8: Merge to Main & Deploy
```bash
# Switch to main and merge release branch
git checkout main
git pull origin main
git merge release-snake

# Push to main (triggers automatic deployment)
git push origin main

# Tag the release
git tag -a v3.8.0 -m "Release version 3.8.0

Portuguese language support, bug fixes, and documentation updates.

Issues resolved:
- #17: Fixed German chart rendering  
- #19: Added Portuguese localization
- #23: Fixed copy button functionality
- #25: Updated documentation"

git push origin v3.8.0

# Clean up release branch (optional)
git branch -d release-snake
git push origin --delete release-snake
```

### Phase 5: Post-Release

#### Step 9: Verify Deployment
- [ ] **Cloudflare Pages:** Verify new version deployed successfully
- [ ] **DockerHub:** Verify new image tags created
- [ ] **GitHub:** Verify issues are closed and release tag exists
- [ ] **Functionality:** Test all language versions work correctly

#### Step 10: Prepare for Next Release
```bash
# Plan next release
# Review remaining GitHub issues
# Select next Metal Gear character name
# Start planning next release cycle
```

## 🏷️ Metal Gear Character Names for Release Branches

**Suggested character rotation:**
- `release-snake` - Solid Snake
- `release-raiden` - Raiden  
- `release-otacon` - Hal "Otacon" Emmerich
- `release-gray-fox` - Gray Fox
- `release-ocelot` - Revolver Ocelot
- `release-big-boss` - Big Boss
- `release-quiet` - Quiet
- `release-paz` - Paz Ortega Andrade
- `release-kaz` - Kazuhira Miller
- `release-huey` - Huey Emmerich

## 📋 Release Branch Checklist Template

For each release branch, track progress:

```
=== RELEASE BRANCH: release-{character} ===

📝 Planning Phase:
- [ ] Release branch created from main
- [ ] Issues selected and documented
- [ ] Character name chosen: ________________

🔧 Development Phase:  
- [ ] Issue #__: _________________________ [COMPLETED]
- [ ] Issue #__: _________________________ [COMPLETED]  
- [ ] Issue #__: _________________________ [COMPLETED]
- [ ] All feature/fix branches merged to release branch

🎯 Preparation Phase:
- [ ] Final cleanup and typo fixes completed
- [ ] VERSION_CALCULATION_GUIDE.md completed - Version: _______
- [ ] VERSION_UPDATE_GUIDE.md applied  
- [ ] LOCALIZATION_GUIDE.md applied
- [ ] Release log created and maintained
- [ ] All functionality tested

🚀 Release Phase:
- [ ] Final release commit created
- [ ] Merged to main branch
- [ ] Git tag created: v________
- [ ] Cloudflare deployment verified
- [ ] DockerHub image verified
- [ ] All issues closed

📊 Release Summary:
Version: ________________
Issues Resolved: _________
Release Date: ___________
Deployment Status: ______
```

## 🔄 Integration with Existing Guides

**This workflow uses:**
- **VERSION_CALCULATION_GUIDE.md** - In Step 5 (dry run to determine version)
- **VERSION_UPDATE_GUIDE.md** - In Step 6 (apply version updates)  
- **LOCALIZATION_GUIDE.md** - In Step 6 (ensure translations current)
- **RELEASE_GUIDE.md** - Alternative: Use for complete coordinated releases
- **release.template** - In Step 6 (track all changes made)

**Workflow Context:**
- **Small releases:** Use individual guides as needed
- **Major releases:** Consider using RELEASE_GUIDE.md to coordinate everything
- **Bug-fix only releases:** May only need VERSION_CALCULATION + VERSION_UPDATE
- **Localization updates:** May need VERSION_CALCULATION + LOCALIZATION guides

## 🚨 Best Practices

### Branch Management
- Always create release branches from latest main
- Keep release branches focused on specific sets of issues
- Merge individual fixes/features to release branch before final merge to main
- Clean up branches after successful release

### Issue Management  
- Link commits to issues with "Closes #XX" in commit messages
- Group related issues into single release branches
- Document issue resolution in commit messages
- Verify all planned issues are resolved before release

### Version Management
- Always use VERSION_CALCULATION_GUIDE.md before applying updates
- Document version decision reasoning
- Be consistent with semantic versioning principles
- Tag releases immediately after merging to main

### Quality Assurance
- Test all functionality on release branch before merging to main
- Verify all language versions work correctly
- Check deployment automation after merge
- Monitor for issues after release

---

**This workflow ensures systematic development, proper version management, and reliable deployments while maintaining code quality and proper issue tracking.**
