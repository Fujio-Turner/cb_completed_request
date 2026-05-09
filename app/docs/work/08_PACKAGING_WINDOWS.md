# 08 — Packaging: Windows `.exe` / `.msi`

**Status:** ✅ COMPLETE

The Windows story is almost identical to macOS — the only differences are:

- The C library is `cblite.dll` (plus its dependencies) instead of `libcblite.dylib`.
- DLLs must be **next to** `app.exe` (Windows DLL loader rules — there's no `@rpath`).
- Code signing uses Authenticode + an EV/OV certificate (or the user gets SmartScreen warnings).

---

## 1. Mental model

```diagram
╭─────────────────────────────────────────────────────╮
│  Couchbase Query Analyzer\                          │
│  ├── Couchbase Query Analyzer.exe   ← PyInstaller   │
│  ├── cblite.dll                     ← CBL library   │
│  ├── python312.dll                                  │
│  ├── _PyCBL.cp312-win_amd64.pyd     ← CFFI bindings │
│  ├── CouchbaseLite\__init__.py …                    │
│  ├── app.py, ai_analyzer.py, cbl_store.py           │
│  ├── assets\                                        │
│  └── *.json.template                                │
│                                                     │
│  At runtime:                                        │
│   1. user double-clicks the .exe                    │
│   2. Windows loads cblite.dll from the same dir     │
│   3. Python boots in-process                        │
│   4. CBL opens cb_tools_db.cblite2 at:              │
│      %LOCALAPPDATA%\Couchbase\                      │
│         CouchbaseQueryAnalyzer\data\                │
│   5. Flask listens on 127.0.0.1:5000                │
│   6. The systray icon (pystray) opens browser       │
╰─────────────────────────────────────────────────────╯
```

Same single-process, single-DLL story as macOS.

---

## 2. Acquiring `cblite.dll`

The Windows release of Couchbase Lite for C is **not** on the public packages server — it's on the Couchbase downloads portal:

```
https://www.couchbase.com/downloads/?family=couchbase-lite
   →  Couchbase Lite Community  →  C  →  Windows x86_64
   →  couchbase-lite-c-community-3.2.1-windows-x86_64.zip
```

Extracted layout:

```
libcblite-community/
├── bin\cblite.dll          ← put NEXT TO app.exe
├── lib\cblite.lib          ← only needed at build time
├── include\cbl\*.h
└── ... debug symbols
```

> `cblite.dll` has no transitive runtime dependencies on Microsoft Visual C++ Redistributable beyond what `python312.dll` already requires. Confirmed via `dumpbin /dependents cblite.dll`.

There's no public direct-download URL we can `curl` in CI without authentication. The build script either:

- Mirrors the zip into our private GitHub Releases of a `vendor` repo, **or**
- Uses `gh release download` from a private mirror, **or**
- Downloads via the manual portal once and commits the zip's SHA256 + URL to `app/vendor/windows/SOURCES.md` for traceability (not the zip itself — too big).

The CI workflow uses option 1 (private mirror).

### ARM64 Windows

CBL 3.2.1 ships an ARM64 Windows build too. We **do not** target it for v5.0.0 (current users are overwhelmingly x64). Tracked in [`11_RISKS_AND_OPEN_QUESTIONS.md`](./11_RISKS_AND_OPEN_QUESTIONS.md).

---

## 3. Pre-build step — vendor the DLL

`app/scripts/fetch_libcblite_windows.ps1`:

```powershell
$ErrorActionPreference = 'Stop'
$CblVersion = $env:CBL_VERSION ?? '3.2.1'
$Dest       = "$PSScriptRoot\..\vendor\windows"
New-Item -ItemType Directory -Force $Dest | Out-Null

if (Test-Path "$Dest\cblite.dll") {
    Write-Host "✅ cblite.dll already present"
    exit 0
}

$Url = "https://<our-mirror>/couchbase-lite-c-community-$CblVersion-windows-x86_64.zip"
$Tmp = New-Item -ItemType Directory -Path ([IO.Path]::GetTempPath() + [Guid]::NewGuid())

Invoke-WebRequest $Url -OutFile "$Tmp\cbl.zip"
Expand-Archive  "$Tmp\cbl.zip" -DestinationPath "$Tmp"

Copy-Item "$Tmp\libcblite-community\bin\cblite.dll" $Dest
Copy-Item "$Tmp\libcblite-community\lib\cblite.lib" $Dest
Copy-Item -Recurse "$Tmp\libcblite-community\include\cbl" "$Dest\include\"

Write-Host "✅ Installed to $Dest"
```

---

## 4. Building the CFFI bindings (Windows)

Slight differences from macOS:

- Visual Studio 2019/2022 Build Tools must be installed (PyInstaller image already has them on the `windows-2022` runner).
- Use forward-slash paths in args (the build script is Python).

```powershell
git clone --depth 1 https://github.com/couchbaselabs/couchbase-lite-python.git $env:TEMP\cbl-py
cd $env:TEMP\cbl-py\CouchbaseLite
python ..\build.py `
    --include "$env:GITHUB_WORKSPACE\app\vendor\windows\include" `
    --library "$env:GITHUB_WORKSPACE\app\vendor\windows\cblite.lib"
pip install $env:TEMP\cbl-py
```

The output is `_PyCBL.cp312-win_amd64.pyd` next to the bindings — PyInstaller bundles it automatically.

---

## 5. PyInstaller spec — `build_win.spec`

```python
# build_win.spec
import os
from PyInstaller.utils.hooks import collect_all

block_cipher = None

cbl_datas, cbl_binaries, cbl_hidden = collect_all('CouchbaseLite')

a = Analysis(
    ['app.py'],
    pathex=['.'],
    binaries=cbl_binaries + [
        # Place cblite.dll AT THE ROOT of the dist directory,
        # NOT inside a subfolder — Windows resolves DLLs relative
        # to the EXE's directory by default.
        ('vendor/windows/cblite.dll', '.'),
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
        'pystray', 'PIL.Image', 'PIL.ImageDraw',
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
    console=False,                    # No console window
    icon='assets/img/app_icon.ico',
    version='build/windows/version_info.txt',
)

coll = COLLECT(
    exe, a.binaries, a.zipfiles, a.datas,
    name='Couchbase Query Analyzer',
)
```

### 5.1 Runtime hook — `hooks/rt_set_cbl_path.py`

```python
# Cross-platform: prepend _MEIPASS to the DLL/dylib search path
import os, sys
if hasattr(sys, '_MEIPASS'):
    base = sys._MEIPASS
    if sys.platform == 'win32':
        # Python 3.8+ requires explicit DLL directory whitelisting
        try:
            os.add_dll_directory(base)
        except (OSError, AttributeError):
            pass
        os.environ['PATH'] = base + os.pathsep + os.environ.get('PATH', '')
    elif sys.platform == 'darwin':
        os.environ['DYLD_LIBRARY_PATH'] = base + os.pathsep + \
            os.environ.get('DYLD_LIBRARY_PATH', '')
```

The `os.add_dll_directory` call is the **critical line** for Windows — without it, Python 3.8+ refuses to dlopen DLLs outside the system search path even when they're sitting next to the `.exe`.

### 5.2 `version_info.txt`

A standard Win32 `VS_VERSION_INFO` resource block so right-click → Properties shows `5.0.0.0`, vendor, copyright, etc.

---

## 6. Code signing (Authenticode)

```powershell
$cert = "C:\codesign\cert.pfx"
$pw   = $env:CERT_PASSWORD
$ts   = "http://timestamp.digicert.com"

# Sign the DLL first
& signtool.exe sign /f $cert /p $pw /tr $ts /td SHA256 /fd SHA256 `
    "dist\Couchbase Query Analyzer\cblite.dll"

# Then the EXE
& signtool.exe sign /f $cert /p $pw /tr $ts /td SHA256 /fd SHA256 `
    "dist\Couchbase Query Analyzer\Couchbase Query Analyzer.exe"
```

Without an EV cert, SmartScreen warns "publisher unverified" until enough users have run the binary. With an OV cert it's the same but reputation builds faster.

---

## 7. MSI installer (optional but recommended)

WiX Toolset v4:

```xml
<Wix xmlns="http://wixtoolset.org/schemas/v4/wxs">
  <Package Name="Couchbase Query Analyzer" Manufacturer="Couchbase"
           Version="5.0.0.0" UpgradeCode="...">
    <MediaTemplate EmbedCab="yes"/>
    <StandardDirectory Id="ProgramFiles64Folder">
      <Directory Id="INSTALLDIR" Name="Couchbase Query Analyzer">
        <Files Include="dist\Couchbase Query Analyzer\**"/>
      </Directory>
    </StandardDirectory>
    <Shortcut Id="StartMenu"
              Directory="ProgramMenuFolder"
              Name="Couchbase Query Analyzer"
              Target="[INSTALLDIR]Couchbase Query Analyzer.exe"/>
  </Package>
</Wix>
```

The MSI bundles the entire PyInstaller output directory (EXE + DLL + all support files) into `C:\Program Files\Couchbase Query Analyzer\`.

---

## 8. Where the user's data lives

```
%LOCALAPPDATA%\Couchbase\CouchbaseQueryAnalyzer\data\cb_tools_db.cblite2\
    db.sqlite3
    db.sqlite3-wal
    db.sqlite3-shm
```

The systray menu (existing `pystray` integration) gets a new **"Open Data Folder"** item that runs `start <path>`.

---

## 9. GitHub Actions workflow — `.github/workflows/build-windows.yml`

```yaml
name: Build Windows EXE

on:
  push:
    tags: ['v*']
  workflow_dispatch:

jobs:
  build:
    runs-on: windows-2022
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12', architecture: 'x64' }

      - name: Fetch cblite.dll from private mirror
        env: { GITHUB_TOKEN: ${{ secrets.MIRROR_TOKEN }} }
        run: powershell -File app\scripts\fetch_libcblite_windows.ps1

      - name: Build CFFI bindings
        run: |
          git clone --depth 1 https://github.com/couchbaselabs/couchbase-lite-python.git $env:TEMP\cbl-py
          cd $env:TEMP\cbl-py\CouchbaseLite
          python ..\build.py `
            --include "$env:GITHUB_WORKSPACE\app\vendor\windows\include" `
            --library "$env:GITHUB_WORKSPACE\app\vendor\windows\cblite.lib"
          pip install $env:TEMP\cbl-py

      - name: Install Python deps
        run: pip install -r app\requirements.txt pyinstaller

      - name: Build EXE
        working-directory: app
        run: pyinstaller --clean build_win.spec

      - name: Sign EXE + DLL
        env:
          CERT_PASSWORD: ${{ secrets.WIN_CERT_PASSWORD }}
        run: powershell -File app\scripts\sign_windows.ps1

      - name: Build MSI (WiX)
        run: powershell -File app\scripts\build_msi.ps1

      - uses: actions/upload-artifact@v4
        with:
          name: CouchbaseQueryAnalyzer-windows
          path: |
            app\dist\CouchbaseQueryAnalyzer-*.msi
            app\dist\Couchbase Query Analyzer\
```

---

## 10. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `OSError: [WinError 126] The specified module could not be found` on `import CouchbaseLite` | Python 3.8+ DLL search policy | Confirm `os.add_dll_directory(_MEIPASS)` runs in the PyInstaller runtime hook |
| App opens then disappears | `console=False` hides crash output | Rebuild with `console=True` once to see traceback |
| SmartScreen "Windows protected your PC" | Unsigned EXE | Sign with Authenticode + Timestamp; consider EV cert |
| `cblite.dll` not found at runtime | DLL placed in subfolder | Spec must use `('.', 'cblite.dll')` not `('lib', 'cblite.dll')` |
| Antivirus quarantines the EXE | Unsigned PyInstaller bootloader | Sign with EV cert; submit to AV vendors |

---

## 11. Summary for the user's question (Windows specific)

`cblite.dll` is a normal Windows DLL. PyInstaller drops it next to `Couchbase Query Analyzer.exe` and Python `dlopen`s it via the CFFI bindings. There is no service, no Couchbase Server install, no broker process — the running `.exe` *is* the database engine. The user clicks the Start menu shortcut, the systray icon appears, the browser opens, done.

---

## Post-review fix (2026-05-09)

The spec file lives at the **project root** as [`build_win.spec`](../../../build_win.spec) (was inside `/app/` in the first pass). Changes:

- `project_root = Path(__file__).parent` (was `parent.parent` when the spec was nested under `/app/`).
- `APP_VERSION = '5.0.0'` (was `4.0.0`).
- `CBL_WINDOWS_DLL` is overridable via the env var of the same name; default is `<project_root>\vendor\windows\cblite.dll`.
- Build invocation: `pyinstaller build_win.spec --clean` from the project root.
