# Branching Strategy

## Overview

```
liquid (dev) → QA (test builds) → main (prod)
```

## Branches

| Branch | Purpose | Deploys To |
|--------|---------|------------|
| `liquid` | Active development | Nothing (local only) |
| `QA` | Testing builds | GitHub Pre-Release (automatic) |
| `main` | Production | Docker Hub + GitHub Release (via tags) |

## Workflow

### 1. Development (liquid)
```bash
git checkout liquid
# ... make changes ...
git commit -m "feat: new feature"
git push origin liquid
```

### 2. QA Testing
```bash
# When ready to test builds:
git checkout QA
git merge liquid
git push origin QA
# → Automatically triggers qa-build.yml
# → Creates pre-release with .dmg and .exe
# → Download and test the binaries
```

### 3. Production Release
```bash
# After testing passes:
git checkout main
git merge QA
git push origin main

# Create production release tag:
git tag v4.0.1
git push origin v4.0.1
# → Automatically triggers release.yml
# → Creates GitHub Release + Docker Hub push
```

## GitHub Actions Workflows

| Workflow | Trigger | Action |
|----------|---------|--------|
| `qa-build.yml` | Push to `QA` | Build .dmg/.exe → Pre-release |
| `release.yml` | Tag `v*` on main | Build all → Release + Docker Hub |
| `docker-build-push.yml` | Push to `main` | Build Docker images |
| `playwright.yml` | PR/Push | Run E2E tests |

## Quick Commands

```bash
# Start new feature
git checkout liquid
git pull origin liquid

# Ready to test binaries
git checkout QA && git merge liquid && git push origin QA

# QA passed, go to production
git checkout main && git merge QA && git push origin main
git tag v4.0.1 && git push origin v4.0.1

# Hotfix (skip QA if urgent)
git checkout main
# ... fix ...
git commit -m "fix: critical bug"
git push origin main
git tag v4.0.2 && git push origin v4.0.2
# Then backport to liquid
git checkout liquid && git merge main
```

## Pre-Release Artifacts

When you push to `QA`, find your test builds at:
- **GitHub**: Releases → Look for "🧪 QA Build" pre-releases
- **Artifacts**: Also available as workflow artifacts for 14 days

## Version Naming

| Type | Example | When |
|------|---------|------|
| QA auto | `4.0.0-qa.20241206.abc1234` | Automatic on QA push |
| QA manual | `4.0.1-rc1` | Manual workflow dispatch |
| Production | `4.0.1` | Tag on main |
