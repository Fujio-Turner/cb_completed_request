# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec for Couchbase Query Analyzer — macOS (onedir .app).

cwd must be app/. Native libcblite is fetched by scripts/fetch_libcblite_macos.sh.
"""

import os
import sys
from pathlib import Path

from PyInstaller.utils.hooks import collect_all

project_root = Path(SPECPATH)
sys.path.insert(0, str(project_root))

from packaging_manifest import desktop_hiddenimports  # noqa: E402
from version import __version__ as APP_VERSION  # noqa: E402

APP_NAME = "QueryAnalyzer"
BUNDLE_ID = "io.fuj.queryanalyzer"

CBL_MACOS_DYLIB = os.environ.get(
    "CBL_MACOS_DYLIB",
    str(project_root / "vendor" / "macos" / "libcblite.3.dylib"),
)
if not os.path.isfile(CBL_MACOS_DYLIB):
    raise SystemExit(
        f"missing CBL dylib: {CBL_MACOS_DYLIB}\n"
        "Run: ./scripts/fetch_libcblite_macos.sh"
    )

try:
    cbl_all = collect_all("CouchbaseLite")
    cbl_binaries, cbl_datas, cbl_hidden = cbl_all[0], cbl_all[1], cbl_all[2]
except Exception as exc:  # noqa: BLE001
    print(f"Warning: Could not collect CouchbaseLite resources: {exc}")
    cbl_binaries, cbl_datas, cbl_hidden = [], [], []

icns = project_root / "assets" / "img" / "QueryAnalyzer.icns"
entitlements = project_root / "build" / "macos" / "entitlements.plist"
runtime_hook = project_root / "build" / "hooks" / "rt_set_cbl_path.py"

block_cipher = None

a = Analysis(
    ["app.py"],
    pathex=[str(project_root)],
    binaries=cbl_binaries + [(CBL_MACOS_DYLIB, ".")],
    datas=cbl_datas + [
        ("config.default.json", "."),
        ("ai_analyzer.py", "."),
        ("blob_storage.py", "."),
        ("cbl_store.py", "."),
        ("app_base.py", "."),
        ("logging_config.py", "."),
        ("tray.py", "."),
        ("ports.py", "."),
        ("version.py", "."),
        ("toon_python.py", "."),
        ("payload_reference.json.template", "."),
        ("ai_models_list.json.template", "."),
        ("index.html", "."),
        ("assets", "assets"),
        ("docs", "docs"),
    ],
    hiddenimports=cbl_hidden + desktop_hiddenimports() + [
        "CouchbaseLite._PyCBL",
        "rumps",
        "tray",
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[str(runtime_hook)],
    excludedimports=[],
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name=APP_NAME,
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    console=True,  # unsigned beta: Terminal shows the bind URL / tracebacks
    disable_windowed_traceback=False,
    target_arch=None,  # native arch of the build Python (arm64 on macos-latest)
    codesign_identity=os.environ.get("APPLE_DEV_ID") or None,
    entitlements_file=str(entitlements) if entitlements.is_file() else None,
    icon=str(icns) if icns.is_file() else None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name=APP_NAME,
)

app = BUNDLE(
    coll,
    name=f"{APP_NAME}.app",
    icon=str(icns) if icns.is_file() else None,
    bundle_identifier=BUNDLE_ID,
    info_plist={
        "NSPrincipalClass": "NSApplication",
        "NSHighResolutionCapable": True,
        "CFBundleName": "CB Query Analyzer (Beta)",
        "CFBundleDisplayName": "CB Query Analyzer (Beta)",
        "CFBundleVersion": APP_VERSION,
        "CFBundleShortVersionString": APP_VERSION,
        "LSMinimumSystemVersion": "11.0",
        "LSBackgroundOnly": False,
        "LSUIElement": False,
    },
)
