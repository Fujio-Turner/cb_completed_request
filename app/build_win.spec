# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec for Couchbase Query Analyzer — Windows (onedir).

onedir (not onefile) so cblite.dll sits next to the exe. cwd must be app/.
Native DLL is fetched by scripts/fetch_libcblite_windows.ps1.
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

CBL_WINDOWS_DLL = os.environ.get(
    "CBL_WINDOWS_DLL",
    str(project_root / "vendor" / "windows" / "cblite.dll"),
)
if not os.path.isfile(CBL_WINDOWS_DLL):
    raise SystemExit(
        f"missing CBL dll: {CBL_WINDOWS_DLL}\n"
        "Run: .\\scripts\\fetch_libcblite_windows.ps1"
    )

try:
    cbl_all = collect_all("CouchbaseLite")
    cbl_binaries, cbl_datas, cbl_hidden = cbl_all[0], cbl_all[1], cbl_all[2]
except Exception as exc:  # noqa: BLE001
    print(f"Warning: Could not collect CouchbaseLite resources: {exc}")
    cbl_binaries, cbl_datas, cbl_hidden = [], [], []

ico = project_root / "assets" / "img" / "app_icon.ico"
runtime_hook = project_root / "build" / "hooks" / "rt_set_cbl_path.py"

block_cipher = None

a = Analysis(
    ["app.py"],
    pathex=[str(project_root)],
    binaries=cbl_binaries + [(CBL_WINDOWS_DLL, ".")],
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
        "pystray",
        "PIL.Image",
        "PIL.ImageDraw",
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
    console=True,  # unsigned beta: console shows the bind URL / tracebacks
    disable_windowed_traceback=False,
    icon=str(ico) if ico.is_file() else None,
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
