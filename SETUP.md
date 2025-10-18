# Setup Guide for Developers

## Quick Start

After cloning this repository:

```bash
# 1. Install Node.js dependencies
npm install

# 2. Install Playwright browsers (for E2E testing)
npx playwright install

# 3. Open the application
open en/index.html
```

## What Gets Installed

### npm install
Creates `node_modules/` folder with:
- **@playwright/test** - E2E testing framework
- **http-server** - Local development server for tests
- Dependencies are tracked in `package-lock.json`

### npx playwright install
Downloads browser binaries to `~/.cache/ms-playwright/`:
- Chromium
- Firefox  
- WebKit (Safari)

## Running Tests

```bash
# Full test suite (all 3 browsers)
npm run test:e2e

# Single browser (faster)
npm run test:e2e -- --project=chromium

# Interactive UI mode
npm run test:e2e:ui

# View last test report
npm run test:e2e:report
```

See [PLAYWRIGHT_TESTING.md](./PLAYWRIGHT_TESTING.md) for details.

## Python Scripts

Most Python scripts in `/python/` use standard library only. If a script needs additional packages, it will show an import error - install with:

```bash
pip3 install <package-name>
```

## Files NOT in Git (Auto-generated)

These folders/files are in `.gitignore` and should NOT be committed:

- **node_modules/** - npm dependencies (reinstall with `npm install`)
- **playwright-report/** - Test reports (regenerated on test run)
- **test-results/** - Test artifacts (regenerated on test run)
- **__pycache__/** - Python cache files
- **.DS_Store** - macOS metadata

## Files TO Commit

These files SHOULD be in Git:

- **package.json** - npm dependencies list
- **package-lock.json** - Exact dependency versions (important!)
- **playwright.config.js** - Test configuration
- **e2e/*.spec.js** - Test files
- **.github/workflows/** - CI/CD automation

## Troubleshooting

### "Cannot find module '@playwright/test'"
```bash
npm install
```

### "browserType.launch: Executable doesn't exist"
```bash
npx playwright install
```

### Tests failing locally
```bash
# View detailed error report
npm run test:e2e:report

# Run in headed mode to see browser
npm run test:e2e:headed
```

## Next Steps

- Read [AGENT.md](./AGENT.md) for project architecture
- Read [PLAYWRIGHT_TESTING.md](./PLAYWRIGHT_TESTING.md) for testing guide
- Read [settings/TESTING_WORKFLOW.md](./settings/TESTING_WORKFLOW.md) for when to run tests
