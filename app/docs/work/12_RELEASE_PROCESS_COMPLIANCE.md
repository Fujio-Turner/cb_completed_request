# 12 — Release-Process Compliance

This doc maps the CBL migration to the **existing project release machinery** documented in `/settings/*.md`. Anything in docs 00–11 that conflicted with those guides is reconciled here.

---

## 1. Version number — bumped to **v5.0.0** (was v4.1.0 in earlier drafts)

Per [`settings/VERSION_CALCULATION_GUIDE.md`](../../../settings/VERSION_CALCULATION_GUIDE.md), a MAJOR bump (X.0.0) is required when **any** of the following are true. The CBL migration triggers four of them:

- ☑ **Architecture overhaul** — embedded DB replaces external server
- ☑ **Removed major features** — external Couchbase Server connection for app data
- ☑ **Changed data formats** — `cb_tools` bucket layout → `.cblite2/` SQLite file
- ☑ **New technology stack** — `libcblite` + CFFI bindings added

**Decision:** target version is `5.0.0`. Every reference to `4.1.0` in docs 00–11 should be read as `5.0.0`. (Patches below correct the explicit mentions.)

The legacy-fallback / sunset trigger (was "v4.2.0") becomes **v5.1.0**.

---

## 2. Branching — follow [`settings/BRANCHING_STRATEGY.md`](../../../settings/BRANCHING_STRATEGY.md) + [`settings/WORKFLOW_GUIDE.md`](../../../settings/WORKFLOW_GUIDE.md)

The pipeline is fixed: **`liquid` (dev) → `QA` (test builds) → `main` (prod)** with release-prep on `release-{metal-gear-character}`.

For this migration:

| Stage | Branch | Notes |
|---|---|---|
| Active dev | `liquid` | All commits land here first |
| Release prep | `release-otacon` | "Otacon" — the tech/engineering character; fits a backend re-architecture |
| Pre-release builds | `QA` | Triggers `qa-build.yml` → produces `.dmg` + `.exe` pre-release on GitHub |
| Production | `main` | Tag `v5.0.0` triggers `release.yml` → Docker Hub + GitHub Release |

Per-issue branches **inside** `release-otacon`:

```
fix/issue-{N}      # bug fixes
feature/issue-{N}  # new features (most CBL work goes here)
```

Suggested issue breakdown (one branch per doc in this folder):

| Issue | Branch | Doc |
|---|---|---|
| #N+0 | `feature/issue-N+0-cbl-store-module` | [`02_CBL_STORE_MODULE.md`](./02_CBL_STORE_MODULE.md) |
| #N+1 | `feature/issue-N+1-cbl-app-py-cutover` | [`03_APP_PY_REFACTOR.md`](./03_APP_PY_REFACTOR.md) |
| #N+2 | `feature/issue-N+2-cbl-blob-storage` | [`04_BLOB_STORAGE_REFACTOR.md`](./04_BLOB_STORAGE_REFACTOR.md) |
| #N+3 | `feature/issue-N+3-cbl-ai-analyzer` | [`05_AI_ANALYZER_REFACTOR.md`](./05_AI_ANALYZER_REFACTOR.md) |
| #N+4 | `feature/issue-N+4-cbl-docker-build` | [`06_PACKAGING_DOCKER.md`](./06_PACKAGING_DOCKER.md) |
| #N+5 | `feature/issue-N+5-cbl-mac-build` | [`07_PACKAGING_MACOS.md`](./07_PACKAGING_MACOS.md) |
| #N+6 | `feature/issue-N+6-cbl-windows-build` | [`08_PACKAGING_WINDOWS.md`](./08_PACKAGING_WINDOWS.md) |
| #N+7 | `feature/issue-N+7-cbl-migration-script` | [`09_DATA_MIGRATION.md`](./09_DATA_MIGRATION.md) |

Each is merged into `release-otacon` after review; `release-otacon` is fast-forwarded into `liquid` continuously, then promoted to `QA` → `main` per the standard pipeline.

---

## 3. Release execution — follow [`settings/RELEASE_GUIDE.md`](../../../settings/RELEASE_GUIDE.md)

When v5.0.0 is ready, run the standard release workflow. The sequence (lifted from `RELEASE_GUIDE.md`):

```diagram
╭─ Step 0 ─────────────────────────────╮
│ npm run test:e2e          (REQUIRED) │  ← all tests must be green
╰──────────┬───────────────────────────╯
           ▼
╭─ Step 1 ─────────────────────────────╮
│ Strip <!-- DEV BUILD BANNER --> from │
│ index.html and en/index.html         │
╰──────────┬───────────────────────────╯
           ▼
╭─ Step 2 ─────────────────────────────╮
│ cp settings/release.template          │
│   settings/logs/release_<ts>.txt     │
╰──────────┬───────────────────────────╯
           ▼
╭─ Step 3 ─────────────────────────────╮
│ Run VERSION_UPDATE_GUIDE updates     │
│ (see §4 below)                       │
╰──────────┬───────────────────────────╯
           ▼
╭─ Step 4 ─────────────────────────────╮
│ Update README + AGENT.md release     │
│ notes for v5.0.0                     │
╰──────────┬───────────────────────────╯
           ▼
╭─ Step 5 ─────────────────────────────╮
│ Run RELEASE_WORK_CHECK.py to verify  │
╰──────────┬───────────────────────────╯
           ▼
╭─ Step 6 ─────────────────────────────╮
│ Merge release-otacon → QA            │
│   ↳ qa-build.yml builds .dmg + .exe  │
│   ↳ Smoke-test the artifacts         │
╰──────────┬───────────────────────────╯
           ▼
╭─ Step 7 ─────────────────────────────╮
│ Merge QA → main                      │
│ git tag v5.0.0 && git push --tags    │
│   ↳ release.yml publishes everything │
╰──────────┬───────────────────────────╯
           ▼
╭─ Step 8 (POST_RELEASE_GUIDE) ────────╮
│ On liquid branch: bump to 5.0.0-post │
│ + re-add DEV BUILD BANNER            │
╰──────────────────────────────────────╯
```

The pre-flight checklist in [`settings/PRE_RELEASE_GUIDE.md`](../../../settings/PRE_RELEASE_GUIDE.md) must pass before Step 0.

---

## 4. Version-string update locations — [`settings/VERSION_UPDATE_GUIDE.md`](../../../settings/VERSION_UPDATE_GUIDE.md)

For v5.0.0, the following strings change. The CBL migration must touch each one:

### 4.1 HTML files

`index.html`, `en/index.html`, `app/index.html`:

```html
<meta name="version" content="5.0.0" />
<meta name="last-updated" content="2026-MM-DD" />
<title>Query Analyzer v5.0.0</title>
<div class="version-info" title="Couchbase Query Analyzer Version">v5.0.0</div>
```

```javascript
const APP_VERSION  = "5.0.0";
const LAST_UPDATED = "2026-MM-DD";
```

> **Static Edition** (`/en/index.html`) is **not changed** by this migration — the v3.29.x line keeps its own version. The `5.0.0` bump applies to the Server Edition only (`/app/index.html` plus the root landing `index.html` if it carries a Server-Edition version reference).

### 4.2 Documentation

- `AGENT.md` — header "# Couchbase Query Analyzer v5.0.0" + "Current Version: 5.0.0 (Last Updated: …)"
- `README.md` — header
- `app/README_SERVER.md` — release notes section
- `app/QUICKSTART.md` — version reference

### 4.3 Build / packaging

- **Dockerfile** — add `LABEL version="5.0.0"` (verified by `RELEASE_WORK_CHECK.py`)
- `app/build_mac.spec` — `version='5.0.0'`, `CFBundleShortVersionString=5.0.0`
- `app/build_win.spec` — `version_info.txt` updated to `5.0.0.0`
- `app/app.py` — `User-Agent` header version string
- `.github/workflows/docker-build-push.yml` — `type=raw,value=5.0.0`
- `.github/workflows/release.yml` — version-derived tags

### 4.4 Verification

```sh
# Lifted from RELEASE_WORK_CHECK.md
grep -H 'name="version"' app/index.html en/index.html
grep -H "<title>" app/index.html
grep -H "version-info" app/index.html
grep -H "APP_VERSION" app/index.html
grep -A2 -B1 "Current Version" AGENT.md
grep "version=" Dockerfile
```

Expected: every match prints `5.0.0` (or `v5.0.0`).

---

## 5. Post-release — [`settings/POST_RELEASE_GUIDE.md`](../../../settings/POST_RELEASE_GUIDE.md)

After `v5.0.0` ships:

1. Switch off `main` to `liquid`.
2. Run the post-release script — bumps everywhere to `5.0.0-post`.
3. Re-insert the `<!-- DEV BUILD BANNER -->` block in `index.html` / `en/index.html` / `app/index.html`.
4. Open the next release branch (e.g. `release-raiden` for v5.0.1 hotfixes or v5.1.0).

`5.0.0-post` is what every developer sees in their browser between `v5.0.0` shipping and `v5.0.1` (or `v5.1.0`) tagging.

---

## 6. Testing — [`settings/TESTING_WORKFLOW.md`](../../../settings/TESTING_WORKFLOW.md)

The CBL migration touches **core functionality** (data layer, AI history, blob storage). Per `TESTING_WORKFLOW.md` the full E2E suite is **required**:

```sh
npm run test:e2e                        # all browsers, both editions
npm run test:e2e:server                 # Server Edition (the one we're changing)
npm run test:e2e:server:chromium        # fast iteration during dev
```

New Playwright specs added in [`10_TESTING_AND_ROLLOUT.md §4`](./10_TESTING_AND_ROLLOUT.md) live under `playwright/e2e/server/cbl/` and run as part of the standard `:server` suite (no new npm script needed).

The `qa-build.yml` workflow on the `QA` branch already runs Playwright; **don't** add a separate workflow.

---

## 7. Translations — [`settings/TRANSLATION_PROTECTION_RULES.md`](../../../settings/TRANSLATION_PROTECTION_RULES.md) + [`settings/LOCALIZATION_GUIDE_IMPROVED.md`](../../../settings/LOCALIZATION_GUIDE_IMPROVED.md)

The Server Edition UI is currently English-only. The CBL migration adds a small number of new user-facing strings (Storage tab, Migrate-from-Server dialog, status banners). Compliance:

- All new strings live in `app/assets/js/i18n/strings.js` under `TEXT_CONSTANTS` (or the equivalent existing dictionary). **Never** hard-code strings in HTML or JS.
- Per the rules — **never** translate:
  - HTML attributes (`id=`, `class=`, `aria-*`, `data-*`, `on*`)
  - JavaScript API names (`getElementById`, `.dataset`, `.options`, `.forEach`, …)
  - CSS classes / selectors
- New string keys to add (final names go into `translations.json` under `ui_strings`):
  - `STORAGE_TAB_TITLE` → "Storage"
  - `STORAGE_BACKEND_CBL` → "App data: embedded (Couchbase Lite)"
  - `STORAGE_BACKEND_SERVER` → "App data: external Couchbase Server"
  - `STORAGE_DB_PATH_LABEL` → "Database path"
  - `STORAGE_DB_SIZE_LABEL` → "Database size"
  - `STORAGE_COMPACT_BUTTON` → "Compact now"
  - `STORAGE_EXPORT_BUTTON` → "Export backup"
  - `STORAGE_IMPORT_BUTTON` → "Import backup"
  - `MIGRATE_FROM_SERVER_TITLE` → "Migrate from Couchbase Server"
  - `MIGRATE_RUNNING` → "Migration running…"
  - `MIGRATE_DONE` → "Migration complete"

If the Server Edition is later localized to es/de/pt, [`settings/NEW_CONTENT_GUIDE.md`](../../../settings/NEW_CONTENT_GUIDE.md) defines how to push these strings through `apply_new_translations.py`. **No localization work is in scope for the v5.0.0 release** — these keys are scaffolded so we don't ship hard-coded English.

After every commit that touches strings:

```sh
python3 settings/validate_js_syntax.py
python3 settings/find_hardcoded_strings.py
```

(Lifted from `PRE_RELEASE_GUIDE.md §1.2`.)

---

## 8. External-library check — [`settings/EXTERNAL_LIBRARY_EXCLUSION_GUIDE.md`](../../../settings/EXTERNAL_LIBRARY_EXCLUSION_GUIDE.md)

`libcblite` is a **runtime native dependency**, not a JS/CSS CDN library, so the existing exclusion regex (`cdnjs.cloudflare.com`, `integrity=`, etc.) does not cover it. Two implications:

- **Don't** add `libcblite`'s version (`3.2.1`) to any HTML file. It lives only in `Dockerfile` (`ENV CBL_VERSION=3.2.1`) and the `vendor/{macos,windows}/SOURCES.md` file. If the version ever leaks into `*.html` or `AGENT.md` it will trigger a false positive in `RELEASE_WORK_CHECK.py`.
- We add a new exclusion for `libcblite` references inside `app/vendor/*` and `app/Dockerfile` to the regex when the release-check script next ships. (Tracked as a follow-up to this migration; not required for v5.0.0 cutover because the version string only appears in non-checked locations today.)

---

## 9. Documentation deliverables (compliance must-haves before tagging v5.0.0)

| Doc | Owner | Status |
|---|---|---|
| `AGENT.md` updated to v5.0.0 + new architecture summary | Doc 12 | TODO |
| `README.md` v5.0.0 release notes block | Doc 12 | TODO |
| `app/README_SERVER.md` rewritten — drop CB-Server setup section | Doc 12 | TODO |
| `app/QUICKSTART.md` rewritten — `docker run` is now sufficient | Doc 12 | TODO |
| `docs/MIGRATION_4_0_to_5_0.md` end-user migration guide | Doc 09 | TODO |
| `app/setup_couchbase.sql` moved to `docs/legacy/` | Doc 03 | TODO |
| `settings/release.template` filled in for this release | RELEASE_GUIDE | TODO |

---

## 10. Compliance summary

| Guide | Where addressed |
|---|---|
| `BRANCHING_STRATEGY.md` | §2 (release-otacon, liquid → QA → main) |
| `WORKFLOW_GUIDE.md` | §2 (per-issue branch table) |
| `VERSION_CALCULATION_GUIDE.md` | §1 (MAJOR justification) |
| `VERSION_UPDATE_GUIDE.md` | §4 (every file location) |
| `RELEASE_GUIDE.md` | §3 (8-step sequence) |
| `PRE_RELEASE_GUIDE.md` | §3 (precondition to Step 0) |
| `POST_RELEASE_GUIDE.md` | §5 (5.0.0-post + dev banner) |
| `TESTING_WORKFLOW.md` | §6 (full E2E suite required) |
| `NEW_CONTENT_GUIDE.md` | §7 (TEXT_CONSTANTS keys) |
| `TRANSLATION_PROTECTION_RULES.md` | §7 (never translate API names) |
| `LOCALIZATION_GUIDE_IMPROVED.md` | §7 (out of scope for v5.0.0, keys scaffolded) |
| `EXTERNAL_LIBRARY_EXCLUSION_GUIDE.md` | §8 (libcblite kept out of HTML) |
| `RELEASE_WORK_CHECK.md` | §4.4 (verification commands) |
