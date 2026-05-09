# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec file for Couchbase Query Analyzer - Windows Edition (v5.0.0)

Builds a self-contained Windows executable with:
- Flask web server backend
- Couchbase Lite integration
- Code signing support (Authenticode)
- System tray integration (pystray)

Usage:
    pyinstaller build_win.spec --clean
"""

import os
import sys
from pathlib import Path

# PyInstaller build helpers
from PyInstaller.utils.hooks import collect_all

# Spec lives at project root (post v5.0.0 migration)
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# ============================================================================
# CONFIGURATION
# ============================================================================

APP_NAME = 'QueryAnalyzer'
APP_VERSION = '5.0.0'

# CouchbaseLite binary paths — bundled cblite.dll for the .exe.
# Set CBL_WINDOWS_DLL env var if your DLL lives elsewhere.
CBL_WINDOWS_DLL = os.environ.get(
    'CBL_WINDOWS_DLL',
    str(project_root / 'vendor' / 'windows' / 'cblite.dll')
)

# ============================================================================
# COLLECT COUCHBASELITE RESOURCES
# ============================================================================

try:
    cbl_all = collect_all('CouchbaseLite')
    cbl_binaries = cbl_all[0]  # binaries
    cbl_datas = cbl_all[1]      # datas
    cbl_hidden = cbl_all[2]     # hiddenimports
except Exception as e:
    print(f"Warning: Could not collect CouchbaseLite resources: {e}")
    cbl_binaries = []
    cbl_datas = []
    cbl_hidden = []

# ============================================================================
# BLOCK ANALYSIS
# ============================================================================

block_cipher = None

# ============================================================================
# SPEC CONFIGURATION
# ============================================================================

a = Analysis(
    ['app.py'],
    pathex=[],
    binaries=cbl_binaries + [
        (CBL_WINDOWS_DLL, '.') if os.path.exists(CBL_WINDOWS_DLL) else None
    ] if os.path.exists(CBL_WINDOWS_DLL) else cbl_binaries,
    datas=cbl_datas + [
        ('ai_analyzer.py', '.'),
        ('blob_storage.py', '.'),
        ('payload_reference.json.template', '.'),
        ('ai_models_list.json.template', '.'),
        ('index.html', '.'),
        ('assets', 'assets'),
        ('docs', 'docs'),
    ],
    hiddenimports=cbl_hidden + [
        'platformdirs',
        'CouchbaseLite._PyCBL',
        'flask',
        'flask_cors',
        'pystray',
        'PIL.Image',
        'PIL.ImageDraw',
    ],
    hookspath=[os.path.join(project_root, 'build', 'hooks')],
    hooksconfig={},
    runtime_hooks=[os.path.join(project_root, 'build', 'hooks', 'rt_set_cbl_path.py')],
    excludedimports=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name=APP_NAME,
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,  # GUI app, no console window
    disable_windowed_traceback=False,
    icon=os.path.join(project_root, 'build', 'windows', 'app_icon.ico') 
         if os.path.exists(os.path.join(project_root, 'build', 'windows', 'app_icon.ico'))
         else None,
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
