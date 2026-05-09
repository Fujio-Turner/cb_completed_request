# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec file for Couchbase Query Analyzer - macOS Edition (v5.0.0)

Builds a self-contained macOS application bundle with:
- Flask web server backend
- Couchbase Lite integration
- Code signing and notarization support
- Universal binary (Intel + Apple Silicon)

Usage:
    pyinstaller build_mac.spec --clean
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
BUNDLE_ID = 'io.fuj.queryanalyzer'

# CouchbaseLite binary paths — bundled libcblite.dylib for the .app
# Set CBL_MACOS_DYLIB env var if your dylib lives elsewhere.
CBL_MACOS_DYLIB = os.environ.get(
    'CBL_MACOS_DYLIB',
    str(project_root / 'vendor' / 'macos' / 'libcblite.3.dylib')
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
        (CBL_MACOS_DYLIB, '.') if os.path.exists(CBL_MACOS_DYLIB) else None
    ] if os.path.exists(CBL_MACOS_DYLIB) else cbl_binaries,
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
    [],
    exclude_binaries=True,
    name=APP_NAME,
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,  # GUI app, no console window
    disable_windowed_traceback=False,
    target_arch='universal2',  # Intel + Apple Silicon
    codesign_identity=os.environ.get('APPLE_DEV_ID'),
    entitlements_file=os.path.join(project_root, 'build', 'macos', 'entitlements.plist'),
    icon=None,
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
    name=f'{APP_NAME}.app',
    icon=None,
    bundle_identifier=BUNDLE_ID,
    info_plist={
        'NSPrincipalClass': 'NSApplication',
        'NSHighResolutionCapable': 'True',
        'CFBundleVersion': APP_VERSION,
        'CFBundleShortVersionString': APP_VERSION,
        'NSRequiresIPhoneOS': False,
        'LSMinimumSystemVersion': '11.0',  # macOS Big Sur minimum
    },
)
