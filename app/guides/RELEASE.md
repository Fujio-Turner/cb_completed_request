# Release Checklist — `release-x.x.x`

Use this checklist every time you cut a new release of the **Couchbase Query
Analyzer Server Edition** (the `/app/` Flask app, Docker image, and
PyInstaller bundles for macOS / Windows). Replace `x.x.x` with the actual
version number (e.g. `4.0.0-Beta`, `4.0.1`, `4.1.0`).

For broader branching / promotion rules see
[`settings/BRANCHING_STRATEGY.md`](../../settings/BRANCHING_STRATEGY.md) and
[`settings/RELEASE_GUIDE.md`](../../settings/RELEASE_GUIDE.md).

---

## 1. Create the release branch

```bash
git checkout main && git pull
git checkout -b release-x.x.x
```

Per the project's branching strategy, feature work flows
`feature/* → liquid → QA → main`. Cut release branches from `main` only after
the feature is fully merged.

---

## 2. Bump version strings

The Server Edition has **one source of truth in Python and several mirrors in
HTML/JS**. Update every one of them.

### Python (Server Edition)

| File | Location | What to change |
|---|---|---|
| [`app/app.py`](../app.py) | near the top imports | `__version__ = "x.x.x"` |
| [`app/build_mac.spec`](../build_mac.spec) | top of file | `APP_VERSION = 'x.x.x'` |
| [`app/build_win.spec`](../build_win.spec) | top of file | `APP_VERSION = 'x.x.x'` |

The startup banner (`ic(f"🚀 Starting Couchbase Query Analyzer v{__version__}")`
in [`app/app.py`](../app.py)) reads from `__version__` automatically — no
extra change needed there.

### HTML / Web UI

| File | Location | What to change |
|---|---|---|
| [`app/index.html`](../index.html) | line ~5 | `Version: x.x.x` (HTML comment) |
| [`app/index.html`](../index.html) | line ~22 | `<meta name="version" content="x.x.x" />` |
| [`app/index.html`](../index.html) | line ~24 | `<title>Query Analyzer vx.x.x</title>` |
| [`app/index.html`](../index.html) | version badge (~line 158) | `vx.x.x` |
| [`app/index.html`](../index.html) | any inline notes / comments | mention of `vx.x.x` |
| [`index.html`](../../index.html) (repo root) | meta version, title, badges | `vx.x.x` |
| [`getting_started.html`](../../getting_started.html) | meta + footer version | `vx.x.x` |
| [`getting_started.md`](../../getting_started.md) | install snippets | `vx.x.x` |

Grep for the **old** version string across the repo to catch every footer,
title, badge, install-snippet, and easter-egg reference:

```bash
grep -rn --include='*.html' --include='*.md' --include='*.py' \
  --include='*.spec' --include='Dockerfile*' \
  "OLD_VERSION" .
```

The Static Edition (`/en/index.html` v3.29.x) has its **own** version that
moves on its own cadence. Don't bump it unless you intend to ship a Static
Edition release at the same time.

### Documentation

| File | What to change |
|---|---|
| [`README.md`](../../README.md) | Title line: `# Couchbase Query Analyzer vx.x.x` (and the editions table) |
| [`README.md`](../../README.md) | Any prose that mentions the version |
| [`AGENT.md`](../../AGENT.md) | "Current Versions" table — update Server row |

---

## 3. Update `release_notes.md`

Add a new section **at the top** of [`release_notes.md`](../../release_notes.md)
following the existing format:

```markdown
### Version x.x.x (Month D, YYYY)
- **New: <feature>** – <one-line summary> (closes #NNN)
- **Enhancement: <area>** – <one-line summary> (closes #NNN)
- **Fix: <area>** – <one-line summary> (closes #NNN)
- **Changes: Version bump** – All footers and version references updated from vOLD to vx.x.x.
```

The Static Edition has its own entries above (3.x.x). Don't merge the two
streams — Server Edition entries live alongside but are clearly tagged.

---

## 4. Update README.md

- Update the version in the editions table.
- Add / revise sections that describe new features, changed behaviour, or
  removed functionality shipped in this release.
- If the architecture changed (e.g. another module removed, new endpoint
  family added), update the diagrams in
  [`app/docs/work/00_OVERVIEW.md §4`](../docs/work/00_OVERVIEW.md) and the
  README accordingly.

---

## 5. Run & verify Python unit tests

```bash
cd app && source venv/bin/activate
pytest ../tests/python/ -v --tb=short
```

- **All tests must pass** (or be cleanly `skipped` for missing CBL bindings
  on a dev box).
- Review coverage — make sure new code paths added in this release have tests.

---

## 6. Run JS unit + E2E tests

```bash
# Jest unit tests (40 tests)
npm test

# Playwright Server Edition E2E (Chromium-only, fast)
npm run test:e2e:server:chromium

# Playwright Static Edition E2E (only if /en/ changed)
npm run test:e2e:static:chromium
```

Fix any failures before continuing. Full cross-browser run
(`npm run test:e2e`) is required before tagging.

---

## 7. Verify Docker build

```bash
cd app
docker compose build
docker compose up -d
# Smoke-test: confirm the worker starts and logs the new version
docker compose logs query-analyzer | head -20
docker compose down
```

The startup log must include the line:

```
🚀 Starting Couchbase Query Analyzer vx.x.x
```

If it doesn't, `__version__` was not updated in [`app/app.py`](../app.py).

---

## 8. Verify PyInstaller bundles (macOS + Windows)

PyInstaller is invoked from inside `/app/`:

```bash
# macOS (run on a Mac)
cd app
pyinstaller build_mac.spec
open dist/QueryAnalyzer.app
# Confirm the menu-bar / window title shows vx.x.x and the Flask log
# prints the new __version__ line.

# Windows (run on Windows)
cd app
pyinstaller build_win.spec
.\dist\QueryAnalyzer.exe
```

The CI workflows in `.github/workflows/build-macos.yml` and
`.github/workflows/build-windows.yml` will repeat this on tag — local
verification just catches obvious breakage early.

---

## 9. Final review

- [ ] `__version__` in [`app/app.py`](../app.py) matches `x.x.x`
- [ ] [`app/index.html`](../index.html) `<meta>`, `<title>`, footer badge all
      show `vx.x.x`
- [ ] [`README.md`](../../README.md) editions table shows `vx.x.x`
- [ ] [`release_notes.md`](../../release_notes.md) has the new section at the
      top
- [ ] [`app/build_mac.spec`](../build_mac.spec) and
      [`app/build_win.spec`](../build_win.spec) `APP_VERSION` updated
- [ ] All HTML / Markdown / Python files grepped for stale version strings
- [ ] `pytest ../tests/python/` passes (all green or skipped-for-CBL)
- [ ] `npm test` and `npm run test:e2e:server:chromium` pass
- [ ] Docker image builds and starts cleanly, logs `v{__version__}`
- [ ] Startup banner prints the new version (Docker + PyInstaller bundles)
- [ ] No unrelated / uncommitted changes in the worktree

---

## 10. Merge & tag

```bash
# Commit release changes
git add app/app.py app/index.html app/build_*.spec \
        README.md release_notes.md index.html getting_started.* AGENT.md
git commit -m "release: vx.x.x"

# Merge into main per BRANCHING_STRATEGY.md
git checkout main && git merge release-x.x.x

# Tag (annotated)
git tag -a vx.x.x -m "vx.x.x"
git push origin main --tags
```

CI will pick up the tag and build:
- Docker image → Docker Hub
- macOS `.dmg`
- Windows `.exe`

---

## 11. Post-release

- Create a GitHub Release from the tag, paste the
  [`release_notes.md`](../../release_notes.md) section verbatim into the body.
- Attach the artifacts (`QueryAnalyzer-x.x.x-macos.dmg`,
  `QueryAnalyzer-x.x.x-windows.zip`).
- Delete the `release-x.x.x` branch if no longer needed.
- Update the [`AGENT.md`](../../AGENT.md) "Current Versions" table.
- See [`settings/POST_RELEASE_GUIDE.md`](../../settings/POST_RELEASE_GUIDE.md)
  for any project-wide post-release housekeeping (Cloudflare cache purge,
  social posts, etc.).

---
---

# Best Practices

## Semantic Versioning

Follow [semver](https://semver.org/) strictly. The Server Edition follows its
own number track; the Static Edition (`/en/`) is independent.

| Bump | When |
|---|---|
| **MAJOR** (`5.0.0`) | Breaking changes — config schema changes that aren't backward-compatible, removed CLI flags, renamed API endpoints, **CBL on-disk schema changes that prevent rollback**, removal of an entire integration (e.g. v4 dropped the Couchbase Server SDK). |
| **MINOR** (`4.1.0`) | New features that are backward-compatible — new config keys (with defaults), new `/api/*` endpoints, new AI providers, new UI tabs. |
| **PATCH** (`4.0.1`) | Bug fixes, doc corrections, dependency patches — no new behaviour. |
| **Pre-release** (`4.0.0-Beta`, `4.0.0-rc1`) | Use during the release-candidate window. The first `4.0.0` *without* a suffix is the GA release. |

## Config compatibility

- **New config keys must have sensible defaults** so existing
  [`app/config.json`](../config.json) files continue to work after an upgrade.
- If a config key is renamed or restructured, add migration logic in
  [`app/cbl_store.py`](../cbl_store.py) (schema migration pattern) and
  document it in `release_notes.md` under a **Migration** heading.
- Ship an updated [`app/config.default.json`](../config.default.json) /
  [`app/config.sample.json`](../config.sample.json) with all new keys and
  comments.

## CBL schema compatibility

The embedded Couchbase Lite database is the user's data. Treat its schema
like a public API:

- **New collections** can be added freely; older app versions ignore them.
- **New fields** on existing documents are safe; older versions ignore unknown
  fields.
- **Renaming or removing a field** is a MAJOR change. Add a migration step
  in [`app/cbl_store.py`](../cbl_store.py) that runs once on startup against
  the existing `cb_tools_db.cblite2/` directory.
- **Indexes** are recreated idempotently at startup; dropping an index is
  fine, but document it in `release_notes.md`.

## Dependency Audit

Before every release:

```bash
# Check for outdated Python packages
cd app && source venv/bin/activate
pip list --outdated

# Review requirements.txt — pin ranges, not exact versions
cat requirements.txt

# Check Node deps
npm outdated
```

- Update dependency pins in [`app/requirements.txt`](../requirements.txt) if
  there are security patches.
- Run the full test suite after any dependency bump.
- The `couchbase` Python SDK is **no longer a dependency** — do not re-add it
  (see [`app/docs/work/00_OVERVIEW.md §8`](../docs/work/00_OVERVIEW.md)).

## Security Review

- [ ] No secrets, API keys, or tokens committed anywhere (grep for
      `api_key`, `password`, `token`, `secret`, `bearer`).
- [ ] [`app/config.json`](../config.json) in the repo uses only placeholder
      values; the real one is `.gitignore`d.
- [ ] AI provider keys are stored encrypted client-side before being persisted
      to CBL.
- [ ] Logging redaction (`?redact=true` URL flag, default) is **on** in any
      logs attached to the GitHub Release.

```bash
# Quick secrets scan
grep -rn --include='*.py' --include='*.json' --include='*.yml' \
  --include='*.html' --include='*.js' \
  -iE '(api_key|secret_key|bearer|password)\s*[:=]\s*"[^"]{8,}"' .
```

## Backward-Compatible Rollback

- **CBL database compatibility** — if the on-disk schema changes, the new
  code should still read old-format docs. Document whether rolling back to
  the previous Server Edition version is safe.
- **Config compatibility** — new config keys should be ignored gracefully by
  older versions.
- Note any rollback caveats in `release_notes.md` under a **⚠️ Rollback
  Notes** heading when applicable.

## Branch & PR Hygiene

- Keep the release branch short-lived — open and merge the PR within a day.
- The release PR should contain **only** version bumps, release notes, and doc
  updates. Feature work belongs on `liquid → QA → main` before the branch is
  cut.
- PR title: `release: vx.x.x`.
- Require at least one approval before merging.

## Testing Beyond Unit Tests

- **Smoke test with real data** — paste a real `system:completed_requests`
  JSON dump into the running app and exercise every tab.
- **Test each AI provider you changed** — OpenAI, Anthropic Claude, xAI Grok,
  Custom. Hit `/api/ai/test` for each one with a real key.
- **Test Docker** — CI runs Python tests natively; always verify the Docker
  image separately since the environment differs (especially `libcblite`
  paths on Linux vs macOS vs Windows).
- **Test the PyInstaller bundles** — open them on a fresh machine without a
  Python install. CBL bindings must load from the bundled `vendor/`
  directory, not a system location.
- **Test the new "Storage" tab in Settings** — confirm `/api/storage/info`,
  `/api/storage/maintenance`, `/api/storage/export`, `/api/storage/import`
  all work end-to-end.

## Documentation Completeness

- Every new config key should be documented in
  [`README.md`](../../README.md) and in
  [`app/README_SERVER.md`](../README_SERVER.md).
- Every new UI feature should have or update a doc in `app/docs/`.
- Architecture diagrams in
  [`app/docs/work/00_OVERVIEW.md`](../docs/work/00_OVERVIEW.md) should reflect
  the current pipeline.
- If you added or changed `/api/*` endpoints, update the table in
  [`app/docs/work/03_APP_PY_REFACTOR.md`](../docs/work/03_APP_PY_REFACTOR.md).

## Git Tags & GitHub Releases

- **Always use annotated tags** (`git tag -a`), not lightweight tags.
- Tag message should match the version: `vx.x.x`.
- The GitHub Release body should be a copy of the `release_notes.md` section
  for that version — this makes it easy to browse changes per release.
- Attach binary artifacts: macOS `.dmg`, Windows `.zip`/`.exe`, optionally a
  Docker image tarball for air-gapped users.

## Hotfix Process

For critical bugs discovered after release:

```bash
git checkout vx.x.x          # start from the release tag
git checkout -b hotfix-x.x.1
# fix, test, bump __version__ to x.x.1
git tag -a vx.x.1 -m "vx.x.1"
git checkout main && git merge hotfix-x.x.1
git push origin main --tags
```

- Hotfix releases are always **PATCH** bumps.
- Include a `release_notes.md` entry even for hotfixes.

## CI / GitHub Actions

The CI pipelines under `.github/workflows/` run lint + tests + builds on
every push and PR. Before releasing:

- Verify all CI checks are green on the release branch (Python tests, Jest,
  Playwright, Docker build, mac build, win build).
- CI tests against Python 3.11+ — make sure all supported versions pass.
- If you've added new test files under `tests/python/` or `playwright/e2e/`,
  confirm CI picks them up.

## Communication

- Post a summary in the team channel when the release is published.
- If there are breaking changes (e.g. CBL schema migration, removed
  endpoint), call them out explicitly so users know what to do before
  upgrading.
- For pre-releases (`-Beta`, `-rc1`), tag the announcement clearly so users
  don't accidentally pin a non-GA build in production.
