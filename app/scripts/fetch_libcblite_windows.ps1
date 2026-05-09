#
# Fetch CouchbaseLite native DLL for Windows
#
# Downloads cblite.dll from the official Couchbase repository
# and places it in vendor/windows/
#
# Usage: .\scripts\fetch_libcblite_windows.ps1 [-Clean]

param(
    [switch]$Clean
)

# Configuration
$CBL_VERSION = "3.1.0"
$DOWNLOAD_URL = "https://packages.couchbase.com/couchbase-lite/cpp/windows/cblite-${CBL_VERSION}-windows-x64.zip"
$VENDOR_DIR = "vendor\windows"
$DLL_NAME = "cblite.dll"
$EXPECTED_FILE = Join-Path $VENDOR_DIR $DLL_NAME

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Create vendor directory
if (-not (Test-Path $VENDOR_DIR)) {
    New-Item -ItemType Directory -Path $VENDOR_DIR -Force | Out-Null
}

# Clean if requested
if ($Clean) {
    Write-Info "Cleaning existing DLL..."
    if (Test-Path $EXPECTED_FILE) {
        Remove-Item $EXPECTED_FILE -Force
    }
}

# Check if DLL already exists
if (Test-Path $EXPECTED_FILE) {
    Write-Info "✓ cblite.dll already exists at $EXPECTED_FILE"
    exit 0
}

Write-Info "Downloading cblite v$CBL_VERSION for Windows..."

# Create temporary directory
$TEMP_DIR = New-TemporaryFile | ForEach-Object { Remove-Item $_; New-Item -ItemType Directory -Path $_ }

try {
    # Download
    $ZipFile = Join-Path $TEMP_DIR "cblite.zip"
    try {
        Invoke-WebRequest -Uri $DOWNLOAD_URL -OutFile $ZipFile -ErrorAction Stop
    }
    catch {
        Write-Error "Failed to download cblite from $DOWNLOAD_URL"
        exit 1
    }

    Write-Info "Extracting DLL..."
    try {
        Expand-Archive -Path $ZipFile -DestinationPath $TEMP_DIR -Force -ErrorAction Stop
    }
    catch {
        Write-Error "Failed to extract DLL"
        exit 1
    }

    # Find and copy the DLL
    $DllFound = $false
    $PossiblePaths = @(
        (Join-Path $TEMP_DIR $DLL_NAME),
        (Join-Path $TEMP_DIR "bin" $DLL_NAME),
        (Join-Path $TEMP_DIR "cblite" $DLL_NAME),
        (Join-Path $TEMP_DIR "cblite" "bin" $DLL_NAME),
        (Get-ChildItem -Path $TEMP_DIR -Filter $DLL_NAME -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName)
    )

    foreach ($Path in $PossiblePaths) {
        if ($Path -and (Test-Path $Path)) {
            Copy-Item -Path $Path -Destination $EXPECTED_FILE -Force
            $DllFound = $true
            break
        }
    }

    if (-not $DllFound) {
        Write-Error "cblite.dll not found in downloaded archive"
        exit 1
    }

    $FileSize = (Get-Item $EXPECTED_FILE).Length
    Write-Info "✓ cblite.dll downloaded and placed at $EXPECTED_FILE"
    Write-Info "File size: $FileSize bytes"
}
finally {
    # Cleanup
    Remove-Item -Path $TEMP_DIR -Recurse -Force -ErrorAction SilentlyContinue
}
