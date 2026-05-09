# PyInstaller Build Infrastructure (v4.0.0)

Complete build system for macOS and Windows distributions.

## Directory Structure

```
/build/
├── hooks/                          # PyInstaller runtime hooks
│   ├── rt_set_cbl_path.py         # CouchbaseLite library path setup
│   └── hook-CouchbaseLite.py       # CouchbaseLite module imports
├── macos/                          # macOS-specific files
│   ├── entitlements.plist          # Code signing entitlements
│   └── dmg-bg.png                  # DMG background image
└── windows/                        # Windows-specific files
    ├── app_icon.ico                # Windows application icon
    └── version_info.txt            # Windows version resource

/app/
├── build_mac.spec                  # PyInstaller spec for macOS
├── build_win.spec                  # PyInstaller spec for Windows
└── scripts/
    ├── fetch_libcblite_macos.sh    # Download macOS dylib
    ├── fetch_libcblite_windows.ps1 # Download Windows DLL
    ├── sign_and_notarize_macos.sh  # Code sign & notarize macOS app
    ├── sign_windows.ps1             # Code sign Windows EXE/DLL
    ├── build_dmg.sh                # Create DMG installer
    └── build_msi.ps1               # Create MSI installer (WiX)
```

## Quick Start

### macOS Build

```bash
cd /app

# 1. Download CouchbaseLite dylib
./scripts/fetch_libcblite_macos.sh

# 2. Build application
pyinstaller build_mac.spec --clean

# 3. Sign and notarize (requires Apple Developer ID)
export APPLE_DEV_ID="your-developer-id@apple.com"
./scripts/sign_and_notarize_macos.sh dist/QueryAnalyzer.app

# 4. Create DMG installer
./scripts/build_dmg.sh dist/QueryAnalyzer.app
```

### Windows Build

```powershell
cd C:\path\to\app

# 1. Download CouchbaseLite DLL
.\scripts\fetch_libcblite_windows.ps1

# 2. Build application
pyinstaller build_win.spec --clean

# 3. Sign executable (requires code signing certificate)
$env:SIGNTOOL_PATH = "C:\Program Files (x86)\Windows Kits\10\bin\10.0.22621.0\x64\signtool.exe"
$env:CERT_THUMBPRINT = "your-cert-thumbprint"
.\scripts\sign_windows.ps1 -ExePath "dist\QueryAnalyzer\QueryAnalyzer.exe"

# 4. Create MSI installer (requires WiX Toolset)
.\scripts\build_msi.ps1 -ExePath "dist\QueryAnalyzer\QueryAnalyzer.exe"
```

## Runtime Hooks

### rt_set_cbl_path.py

Sets up native library paths for CouchbaseLite binaries:
- **macOS**: Sets `DYLD_LIBRARY_PATH` and `DYLD_FALLBACK_LIBRARY_PATH`
- **Windows**: Calls `os.add_dll_directory()` and updates `PATH`

Automatically executed when application starts.

### hook-CouchbaseLite.py

Ensures CouchbaseLite module and data files are included in build:
- Collects all CouchbaseLite submodules
- Includes package data files
- Handles platform-specific imports

## PyInstaller Specs

### build_mac.spec

macOS application bundle configuration:
- **Binary**: Universal 2 (Intel + Apple Silicon)
- **Code signing**: Uses `APPLE_DEV_ID` environment variable
- **Entitlements**: Includes CouchbaseLite-specific permissions
- **Bundle ID**: `io.fuj.queryanalyzer`
- **Minimum OS**: macOS 11.0 (Big Sur)

### build_win.spec

Windows executable configuration:
- **Architecture**: x64
- **Console**: Disabled (GUI app)
- **Icon**: Supports `.ico` file
- **Hidden imports**: Includes pystray for system tray

## Signing & Notarization

### macOS Code Signing

Requires Apple Developer certificate:

```bash
# Set environment variable
export APPLE_DEV_ID="Developer ID Application: Your Name (XXXXX)"

# Run signing script
./scripts/sign_and_notarize_macos.sh dist/QueryAnalyzer.app
```

Process includes:
1. Sign dylib with developer ID
2. Sign nested frameworks/libraries
3. Sign application bundle
4. Verify signature
5. Create DMG for notarization
6. Submit to Apple notarization service
7. Staple notarization ticket

### Windows Code Signing

Requires Authenticode certificate:

```powershell
# Option 1: Using certificate file
$env:CERT_PATH = "C:\path\to\certificate.pfx"
$env:CERT_PASS = "certificate-password"

# Option 2: Using certificate thumbprint
$env:CERT_THUMBPRINT = "certificate-thumbprint"

# Run signing script
.\scripts\sign_windows.ps1 -ExePath "dist\QueryAnalyzer\QueryAnalyzer.exe"
```

Process includes:
1. Sign EXE with Authenticode
2. Sign DLL with Authenticode
3. Add RFC3161 timestamp
4. Verify signatures

## Installers

### macOS DMG

Professional drag-and-drop installer created by `build_dmg.sh`:
- Application icon with custom sizing
- Drag-to-Applications shortcut
- Optional background image
- HFS+ format, UDZO compression

### Windows MSI

WiX-based installer created by `build_msi.ps1`:
- Standard installation directory (`Program Files\QueryAnalyzer`)
- Desktop and Start Menu shortcuts
- Uninstall support
- Registry entries for upgrade detection

## Configuration Files

### entitlements.plist

macOS code signing entitlements:
- Network client/server (localhost communication)
- Unsigned executable memory (CouchbaseLite dylib)
- JIT compilation support
- File system access for database storage

### version_info.txt

Windows version resource metadata:
- File version: 4.0.0.0
- Product version: 4.0.0.0
- Company: Fujio Turner
- File description: Couchbase Query Analyzer

### app_icon.ico

Windows application icon (placeholder). Replace with actual icon using:
```bash
# ImageMagick
convert app_icon.png -define icon:auto-resize=256,128,96,64,48,32,16 app_icon.ico

# Python PIL
from PIL import Image
Image.new('RGB', (256, 256), color='blue').save('app_icon.ico')
```

## Environment Variables

### Required for Signing

| Variable | Description | Example |
|----------|-------------|---------|
| `APPLE_DEV_ID` | Apple Developer ID for code signing | `Developer ID Application: Name (XXXXX)` |
| `APPLE_DEV_PASS` | App-specific password for notarization | Application-specific Apple ID password |
| `CERT_THUMBPRINT` | Windows certificate thumbprint | `A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6` |
| `SIGNTOOL_PATH` | Path to Windows signtool.exe | `C:\Program Files\Windows Kits\...` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `CBL_VERSION` | CouchbaseLite version | 3.1.0 |
| `DMG_SIZE` | macOS DMG volume size | 300m |

## Troubleshooting

### macOS Build Issues

**Error: "libcblite.3.dylib not found"**
```bash
./scripts/fetch_libcblite_macos.sh --clean
```

**Error: "Code signing failed"**
- Verify `APPLE_DEV_ID` is correct: `security find-identity -v -p codesigning`
- Check entitlements.plist syntax: `plutil -lint build/macos/entitlements.plist`

**Error: "Notarization failed"**
- Check Apple ID credentials
- Verify app is signed correctly before submission
- Check notarization status: `xcrun notarytool log <ID> --keychain-profile <profile>`

### Windows Build Issues

**Error: "signtool.exe not found"**
- Install Windows SDK: https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/
- Or add to PATH: `C:\Program Files (x86)\Windows Kits\10\bin\x64\`

**Error: "Certificate not found"**
```powershell
# List installed certificates
Get-ChildItem Cert:\CurrentUser\My

# Find thumbprint
Get-ChildItem Cert:\CurrentUser\My | Where-Object {$_.Subject -like "*Your Name*"}
```

**Error: "MSI creation failed"**
- Install WiX Toolset 3.11+: https://github.com/wixtoolset/wix3/releases
- Add to PATH or set in script: `$WixPath = "..."`

## CI/CD Integration

### GitHub Actions (Example)

```yaml
# .github/workflows/build-releases.yml
on: [push]

jobs:
  build-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - name: Fetch CouchbaseLite
        run: ./app/scripts/fetch_libcblite_macos.sh
      - name: Build
        run: pyinstaller app/build_mac.spec
      - name: Sign & Notarize
        env:
          APPLE_DEV_ID: ${{ secrets.APPLE_DEV_ID }}
          APPLE_DEV_PASS: ${{ secrets.APPLE_DEV_PASS }}
        run: ./app/scripts/sign_and_notarize_macos.sh dist/QueryAnalyzer.app

  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - name: Fetch CouchbaseLite
        run: .\app\scripts\fetch_libcblite_windows.ps1
      - name: Build
        run: pyinstaller app\build_win.spec
      - name: Sign
        env:
          CERT_THUMBPRINT: ${{ secrets.CERT_THUMBPRINT }}
        run: .\app\scripts\sign_windows.ps1 -ExePath "dist\QueryAnalyzer\QueryAnalyzer.exe"
```

## Version Updates

When updating to a new version:

1. Update `APP_VERSION` in `build_mac.spec` and `build_win.spec`
2. Update `ProductVersion` parameter in `build_msi.ps1`
3. Update version in `build/windows/version_info.txt`
4. Update version in `app/index.html` (meta tag, JavaScript)
5. Update `README.md` version reference

## References

- [PyInstaller Documentation](https://pyinstaller.org/)
- [Apple Code Signing Guide](https://developer.apple.com/support/code-signing/)
- [Windows Authenticode](https://docs.microsoft.com/en-us/dotnet/framework/tools/signtool-exe)
- [WiX Toolset](https://wixtoolset.org/)
- [CouchbaseLite Python](https://github.com/couchbase/couchbase-lite-python)
