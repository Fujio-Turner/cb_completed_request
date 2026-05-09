# 07 — Packaging: macOS `.app` / `.dmg`

**Status:** ✅ COMPLETE

This is the doc that answers the user's question:

> "I can understand how to have couchbase lite used and running in a docker container but for Mac and Windows .exe how would couchbase lite work there?"

The short answer:

**Couchbase Lite is just a C shared library (`libcblite.dylib` on macOS, `cblite.dll` on Windows). PyInstaller bundles it into the `.app` / `.exe` like any other native dependency. There is no server process. CBL runs in-process inside the Python interpreter PyInstaller already ships.**

The longer answer is below.

---

## 1. Mental model

```diagram
╭──────────────────────────────────────────────────────────╮
│  Couchbase Query Analyzer.app                            │
│                                                          │
│  Contents/                                               │
│  ├── MacOS/                                              │
│  │   └── Couchbase Query Analyzer   ← PyInstaller boot   │
│  │                                                       │
│  ├── Frameworks/                                         │
│  │   ├── libcblite.3.dylib          ← the C library      │
│  │   ├── libpython3.12.dylib                             │
│  │   └── ... all other .dylibs                           │
│  │                                                       │
│  └── Resources/                                          │
│      ├── app.py, ai_analyzer.py, cbl_store.py            │
│      ├── CouchbaseLite/              ← Python bindings   │
│      ├── assets/, index.html, etc.                       │
│      └── *.json.template                                 │
│                                                          │
│  At runtime:                                             │
│   1. macOS launches Contents/MacOS/<binary>              │
│   2. PyInstaller boot loader spins up Python             │
│   3. app.py imports CouchbaseLite, which dlopens         │
│      ../Frameworks/libcblite.3.dylib via @rpath          │
│   4. CBL opens cb_tools_db.cblite2/ at:                  │
│      ~/Library/Application Support/                      │
│         CouchbaseQueryAnalyzer/data/                     │
│   5. Flask listens on 127.0.0.1:5000                     │
│   6. The user's browser opens http://localhost:5000      │
╰──────────────────────────────────────────────────────────╯
```

There is **no Couchbase Server**, **no daemon**, **no extra installer**. The whole thing is one self-contained `.app` bundle.

---

## 2. Acquiring `libcblite.dylib`

Download from the Couchbase Lite C release artifacts:

```
https://packages.couchbase.com/releases/couchbase-lite-c/3.2.1/
    couchbase-lite-c-community-3.2.1-macos.zip      (universal: arm64 + x86_64)
```

The macOS download is shipped as a **universal binary** (single `.dylib` containing both `arm64` and `x86_64` slices), so we don't need separate Apple Silicon / Intel builds.

Extracted layout:

```
libcblite-community/
├── include/cbl/*.h
├── lib/libcblite.3.dylib
├── lib/libcblite.dylib       (symlink)
└── ... codesign metadata
```

Verify with `lipo -archs`:

```sh
$ lipo -archs libcblite.3.dylib
x86_64 arm64
```

---

## 3. Pre-build step — vendor the library

Add to `app/scripts/fetch_libcblite_macos.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

CBL_VERSION="${CBL_VERSION:-3.2.1}"
DEST="$(dirname "$0")/../vendor/macos"
mkdir -p "$DEST"

if [[ -f "$DEST/libcblite.3.dylib" ]]; then
    echo "✅ libcblite.3.dylib already present in $DEST"
    exit 0
fi

TMP="$(mktemp -d)"
URL="https://packages.couchbase.com/releases/couchbase-lite-c/${CBL_VERSION}/couchbase-lite-c-community-${CBL_VERSION}-macos.zip"

echo "↓ $URL"
curl -fsSL "$URL" -o "$TMP/cbl.zip"
unzip -q "$TMP/cbl.zip" -d "$TMP"

cp "$TMP/libcblite-community/lib/libcblite.3.dylib" "$DEST/"
cp -r "$TMP/libcblite-community/include/cbl" "$DEST/include/"

echo "✅ Installed to $DEST"
```

This runs in the GitHub Actions macOS workflow before PyInstaller.

---

## 4. Building the Python bindings (build host only)

The `couchbase-lite-python` CFFI bindings need to be **compiled** against the dylib once on the build host. We `pip install` the result so PyInstaller picks it up:

```sh
git clone --depth 1 https://github.com/couchbaselabs/couchbase-lite-python.git /tmp/cbl-py
cd /tmp/cbl-py/CouchbaseLite
python3 ../build.py \
    --include "$(pwd)/../../app/vendor/macos/include" \
    --library "$(pwd)/../../app/vendor/macos/libcblite.3.dylib"
pip install /tmp/cbl-py
```

The build emits `_PyCBL.abi3.so` next to the Python sources; PyInstaller bundles it automatically.

---

## 5. PyInstaller spec changes — `build_mac.spec`

```python
# build_mac.spec
import os
from PyInstaller.utils.hooks import collect_all

block_cipher = None

cbl_datas, cbl_binaries, cbl_hidden = collect_all('CouchbaseLite')

a = Analysis(
    ['app.py'],
    pathex=['.'],
    binaries=cbl_binaries + [
        # The dylib itself — bundled into the .app's Frameworks/
        ('vendor/macos/libcblite.3.dylib', '.'),
    ],
    datas=cbl_datas + [
        ('assets', 'assets'),
        ('config.default.json', '.'),
        ('index.html', '.'),
        ('ai_analyzer.py', '.'),
        ('blob_storage.py', '.'),
        ('cbl_store.py', '.'),
        ('payload_reference.json.template', '.'),
        ('ai_models_list.json.template', '.'),
    ],
    hiddenimports=cbl_hidden + [
        'flask_cors', 'couchbase', 'openai',
        'anthropic', 'icecream', 'platformdirs',
        'CouchbaseLite._PyCBL',
    ],
    hookspath=['hooks'],
    runtime_hooks=['hooks/rt_set_cbl_path.py'],
    excludes=['pytest', 'venv', 'tests'],
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz, a.scripts,
    [],
    exclude_binaries=True,
    name='Couchbase Query Analyzer',
    debug=False,
    console=False,                    # GUI app: hides Terminal window
    target_arch='universal2',         # arm64 + x86_64
    codesign_identity=os.environ.get('APPLE_DEV_ID'),
    entitlements_file='build/macos/entitlements.plist',
)

coll = COLLECT(
    exe, a.binaries, a.zipfiles, a.datas,
    name='Couchbase Query Analyzer',
)

app = BUNDLE(
    coll,
    name='Couchbase Query Analyzer.app',
    icon='assets/img/app_icon.icns',
    bundle_identifier='io.couchbase.queryanalyzer',
    version='5.0.0',
    info_plist={
        'CFBundleShortVersionString': '5.0.0',
        'NSHighResolutionCapable': True,
        'LSMinimumSystemVersion': '11.0',
    },
)
```

### 5.1 Runtime hook — `hooks/rt_set_cbl_path.py`

PyInstaller may flatten the dylib next to the binary instead of `Frameworks/`. We force the loader to find it via `DYLD_LIBRARY_PATH`:

```python
# hooks/rt_set_cbl_path.py
import os, sys
if hasattr(sys, '_MEIPASS'):
    base = sys._MEIPASS
    os.environ['DYLD_LIBRARY_PATH'] = base + os.pathsep + \
        os.environ.get('DYLD_LIBRARY_PATH', '')
```

### 5.2 Custom CBL store hook — `hooks/hook-CouchbaseLite.py`

```python
# Ensures the bindings package is collected even when imported lazily.
from PyInstaller.utils.hooks import collect_submodules, collect_data_files
hiddenimports = collect_submodules('CouchbaseLite')
datas         = collect_data_files('CouchbaseLite')
```

---

## 6. Code signing & notarization (required for distribution)

Without these, Gatekeeper rejects the app on first launch.

```sh
# Sign the dylib first
codesign --sign "$APPLE_DEV_ID" --options runtime \
    "dist/Couchbase Query Analyzer.app/Contents/Frameworks/libcblite.3.dylib"

# Then sign the bundle
codesign --deep --sign "$APPLE_DEV_ID" --options runtime \
    --entitlements build/macos/entitlements.plist \
    "dist/Couchbase Query Analyzer.app"

# Notarize
xcrun notarytool submit "dist/Couchbase Query Analyzer.app" \
    --apple-id "$APPLE_ID" --team-id "$APPLE_TEAM_ID" \
    --password "$APPLE_APP_PASSWORD" --wait

xcrun stapler staple "dist/Couchbase Query Analyzer.app"
```

`entitlements.plist` only needs:

```xml
<dict>
    <key>com.apple.security.cs.allow-jit</key><false/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key><true/>
    <key>com.apple.security.cs.disable-library-validation</key><true/>
    <key>com.apple.security.network.server</key><true/>
</dict>
```

`disable-library-validation` is needed because the dylib is from Couchbase, not Apple-signed.

---

## 7. DMG packaging

```sh
brew install create-dmg

create-dmg \
    --volname "Couchbase Query Analyzer 5.0.0" \
    --background "build/macos/dmg-bg.png" \
    --window-size 600 400 \
    --icon-size 96 \
    --icon "Couchbase Query Analyzer.app" 150 200 \
    --app-drop-link 450 200 \
    "dist/CouchbaseQueryAnalyzer-5.0.0.dmg" \
    "dist/Couchbase Query Analyzer.app"
```

---

## 8. Where the user's data lives

On first launch, CBL creates:

```
~/Library/Application Support/CouchbaseQueryAnalyzer/data/cb_tools_db.cblite2/
    db.sqlite3
    db.sqlite3-wal
    db.sqlite3-shm
```

This survives app upgrades and shows up in Spotlight backups. The app exposes an "Open Data Folder…" menu item via the existing `rumps` tray that calls `open <path>` on macOS.

---

## 9. GitHub Actions workflow — `.github/workflows/build-macos.yml`

```yaml
name: Build macOS app

on:
  push:
    tags: ['v*']
  workflow_dispatch:

jobs:
  build:
    runs-on: macos-14   # arm64 runner
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }

      - name: Fetch libcblite
        run: bash app/scripts/fetch_libcblite_macos.sh

      - name: Build Python CFFI bindings
        run: |
          git clone --depth 1 https://github.com/couchbaselabs/couchbase-lite-python.git /tmp/cbl-py
          cd /tmp/cbl-py/CouchbaseLite
          python3 ../build.py \
            --include "$GITHUB_WORKSPACE/app/vendor/macos/include" \
            --library "$GITHUB_WORKSPACE/app/vendor/macos/libcblite.3.dylib"
          pip install /tmp/cbl-py

      - name: Install Python deps
        run: pip install -r app/requirements.txt pyinstaller

      - name: Build .app
        working-directory: app
        run: pyinstaller --clean build_mac.spec

      - name: Codesign + notarize
        env:
          APPLE_DEV_ID: ${{ secrets.APPLE_DEV_ID }}
          APPLE_ID:     ${{ secrets.APPLE_ID }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
          APPLE_APP_PASSWORD: ${{ secrets.APPLE_APP_PASSWORD }}
        run: bash app/scripts/sign_and_notarize_macos.sh

      - name: Build DMG
        run: bash app/scripts/build_dmg.sh

      - uses: actions/upload-artifact@v4
        with:
          name: CouchbaseQueryAnalyzer-macos
          path: app/dist/CouchbaseQueryAnalyzer-*.dmg
```

---

## 10. Smoke test on a clean machine

A separate workflow boots a fresh macOS VM, downloads the released `.dmg`, mounts it, copies the `.app` into `/Applications`, launches it headlessly, and curls `http://127.0.0.1:5000/api/storage/info`. The response must include `"backend": "cbl"`.

---

## 11. Summary for the user's question

| Concern | Docker | macOS `.app` |
|---|---|---|
| What is CBL? | A `.so` library | A `.dylib` library |
| How does it run? | In-process inside Python | In-process inside Python |
| Where does it live? | `/usr/local/lib/libcblite.so` | `Contents/Frameworks/libcblite.3.dylib` |
| Where is the data? | `/app/data/` (volume) | `~/Library/Application Support/CouchbaseQueryAnalyzer/data/` |
| Extra processes? | None | None |
| Service to install? | None | None |

The only difference is **how the dylib gets into the bundle** (apt-installed in the image vs vendored at build time) and **where the data file ends up** (Docker volume vs user library directory).

---

## Post-review fix (2026-05-09)

The spec file lives at the **project root** as [`build_mac.spec`](../../../build_mac.spec) (was inside `/app/` in the first pass). Changes:

- `project_root = Path(__file__).parent` (was `parent.parent` when the spec was nested under `/app/`).
- `APP_VERSION = '5.0.0'` (was `4.0.0`).
- `CBL_MACOS_DYLIB` is overridable via the env var of the same name; default is `<project_root>/vendor/macos/libcblite.3.dylib`.
- Build invocation: `pyinstaller build_mac.spec --clean` from the project root.
