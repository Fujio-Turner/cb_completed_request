#
# Fetch Couchbase Lite C (community) for Windows and place cblite.dll
# plus headers under app/vendor/windows/.
#
# URL tree matches app/Dockerfile (releases/couchbase-lite-c/<ver>/...).
# Usage: .\scripts\fetch_libcblite_windows.ps1 [-Clean]
#
param(
    [switch]$Clean
)

$ErrorActionPreference = "Stop"

$AppDir = Split-Path -Parent $PSScriptRoot
$CblVersion = if ($env:CBL_VERSION) { $env:CBL_VERSION } else { "3.2.4" }
$Dest = Join-Path $AppDir "vendor\windows"
$Url = "https://packages.couchbase.com/releases/couchbase-lite-c/$CblVersion/couchbase-lite-c-community-$CblVersion-windows-x86_64.zip"
$DllName = "cblite.dll"
$ExpectedFile = Join-Path $Dest $DllName

function Write-Info([string]$Message) { Write-Host "[INFO] $Message" -ForegroundColor Green }
function Write-Warn([string]$Message) { Write-Host "[WARN] $Message" -ForegroundColor Yellow }
function Write-Err([string]$Message)  { Write-Host "[ERROR] $Message" -ForegroundColor Red }

New-Item -ItemType Directory -Path (Join-Path $Dest "include") -Force | Out-Null

if ($Clean) {
    Write-Info "Cleaning existing DLL and headers..."
    if (Test-Path $ExpectedFile) { Remove-Item $ExpectedFile -Force }
    $inc = Join-Path $Dest "include"
    if (Test-Path $inc) { Remove-Item $inc -Recurse -Force }
    New-Item -ItemType Directory -Path $inc -Force | Out-Null
}

Write-Info "Downloading Couchbase Lite C $CblVersion for Windows..."
Write-Info "URL: $Url"

$TempDir = Join-Path ([System.IO.Path]::GetTempPath()) ("cbl-fetch-" + [guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
try {
    $ZipFile = Join-Path $TempDir "cbl.zip"
    try {
        $response = Invoke-WebRequest -Uri $Url -OutFile $ZipFile -PassThru
        if ($response.StatusCode -ne 200) {
            Write-Err "Download failed HTTP $($response.StatusCode) from $Url"
            exit 1
        }
    }
    catch {
        Write-Err "Failed to download cblite from $Url"
        Write-Err $_.Exception.Message
        exit 1
    }

    Write-Info "Extracting archive..."
    Expand-Archive -Path $ZipFile -DestinationPath (Join-Path $TempDir "extract") -Force

    $dll = Get-ChildItem -Path (Join-Path $TempDir "extract") -Filter $DllName -Recurse -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if (-not $dll) {
        Write-Err "$DllName not found in downloaded archive"
        exit 1
    }
    Copy-Item -Path $dll.FullName -Destination $ExpectedFile -Force

    Get-ChildItem -Path $dll.DirectoryName -Filter "cblite*.dll" | ForEach-Object {
        Copy-Item $_.FullName -Destination $Dest -Force
    }

    # Import lib is required to compile the CFFI bindings (runtime still uses the DLL).
    $lib = Get-ChildItem -Path (Join-Path $TempDir "extract") -Filter "cblite.lib" -Recurse -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if ($lib) {
        Copy-Item -Path $lib.FullName -Destination (Join-Path $Dest "cblite.lib") -Force
    }
    else {
        Write-Warn "cblite.lib not found in archive — CFFI build may fail"
    }

    $incDir = Get-ChildItem -Path (Join-Path $TempDir "extract") -Directory -Recurse -Filter "include" |
        Select-Object -First 1
    if ($incDir) {
        Copy-Item -Path (Join-Path $incDir.FullName "*") -Destination (Join-Path $Dest "include") -Recurse -Force
    }
    else {
        Write-Warn "No include/ directory in archive — CFFI build may fail"
    }

    $FileSize = (Get-Item $ExpectedFile).Length
    Write-Info "✓ $DllName placed at $ExpectedFile"
    Write-Info "File size: $FileSize bytes"
}
finally {
    Remove-Item -Path $TempDir -Recurse -Force -ErrorAction SilentlyContinue
}
