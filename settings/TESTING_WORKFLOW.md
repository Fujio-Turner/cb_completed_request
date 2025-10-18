# Testing Workflow Guide

## When to Run Playwright Tests

### 🔴 ALWAYS Run (Required)
1. **Before Release** - Part of pre-release checklist (see PRE_RELEASE_GUIDE.md)
2. **After Major UI Changes** - Changes to tabs, input fields, buttons, navigation
3. **After Core Functionality Changes** - JSON parsing, chart generation, data processing
4. **Before Merging to Main** - Validate PR changes don't break existing functionality

### 🟡 SHOULD Run (Recommended)
1. **After Fixing Critical Bugs** - Ensure fix works across all browsers
2. **After Adding New Features** - Verify existing features still work
3. **Weekly Development Checkpoint** - Catch regressions early

### 🟢 CAN Run (Optional)
1. **After Minor CSS/Style Changes** - If you want to be thorough
2. **After Documentation Updates** - Usually not necessary
3. **During Active Development** - For peace of mind

## Quick Test Commands

```bash
# Full test suite (all browsers)
npm run test:e2e

# Single browser (faster feedback)
npm run test:e2e -- --project=chromium

# Interactive mode (best for debugging)
npm run test:e2e:ui

# Specific test only
npm run test:e2e -- --grep "should load and parse"
```

## Test Types

### Smoke Tests (Current - 10 tests)
Basic functionality that must always work:
- ✅ Page loads
- ✅ Tabs visible and switchable
- ✅ Input textareas present
- ✅ JSON parsing works
- ✅ Version info correct
- ✅ Responsive layout

**When to run**: Before every release, after major changes

### Future: Integration Tests (Not yet implemented)
More detailed workflow testing:
- Multi-step workflows
- Complex data scenarios
- Edge cases and error handling

### Future: Visual Regression Tests (Not yet implemented)
Screenshot comparison for UI consistency

## CI/CD Automation

Tests run **automatically** on:
- Every push to main branch
- Every pull request to main branch

Check GitHub Actions tab for results: https://github.com/Fujio-Turner/cb_completed_request/actions

## Adding to Pre-Release Checklist

See `settings/PRE_RELEASE_GUIDE.md` - tests are included in Step 3.

## Test Failure Response

If tests fail:

1. **Check the HTML Report**: `npm run test:e2e:report`
2. **Run in Headed Mode**: `npm run test:e2e:headed` to see what's happening
3. **Check Screenshots**: Look in `test-results/` for failure screenshots
4. **Debug Mode**: `npm run test:e2e:debug` for step-by-step debugging

## Time Estimates

- **Full test suite**: ~50 seconds (3 browsers × 10 tests)
- **Single browser**: ~15 seconds
- **Specific test**: ~5 seconds

## Best Practice Recommendation

**For your workflow:**
1. ✅ Run before every release (REQUIRED)
2. ✅ Run after fixing issues that touch UI/parsing (RECOMMENDED)
3. ✅ Let GitHub Actions handle automatic testing on commits
4. ✅ Run locally when you want confidence before pushing

**Don't:**
- ❌ Run after every tiny change (wastes time)
- ❌ Run for documentation-only updates
- ❌ Skip before releases (tests exist for a reason!)

## Integration with Existing Guides

1. **AGENT.md** - References this guide for test commands
2. **PRE_RELEASE_GUIDE.md** - Step 3: Run full test suite
3. **RELEASE_GUIDE.md** - Assumes tests passed in pre-release
4. **VERSION_UPDATE_GUIDE.md** - Run tests after version bump

## Next Steps

Consider adding:
- [ ] More comprehensive tests (error handling, edge cases)
- [ ] Visual regression tests for chart rendering
- [ ] Performance benchmarks
- [ ] Tests for other language versions (de/, es/, pt/)
