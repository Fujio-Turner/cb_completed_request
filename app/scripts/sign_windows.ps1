#
# Sign Windows executable and DLL with Authenticode
#
# Codesigns the EXE and DLL files using a code signing certificate.
# Requires SIGNTOOL_PATH and either CERT_PATH + CERT_PASS or CERT_THUMBPRINT.
#
# Usage: .\scripts\sign_windows.ps1 -ExePath <path_to_exe> -DllPath <path_to_dll>

param(
    [Parameter(Mandatory=$true)]
    [string]$ExePath,
    
    [Parameter(Mandatory=$false)]
    [string]$DllPath,
    
    [Parameter(Mandatory=$false)]
    [string]$CertPath = $env:CERT_PATH,
    
    [Parameter(Mandatory=$false)]
    [string]$CertPass = $env:CERT_PASS,
    
    [Parameter(Mandatory=$false)]
    [string]$CertThumbprint = $env:CERT_THUMBPRINT,
    
    [Parameter(Mandatory=$false)]
    [string]$SigntoolPath = "signtool.exe",
    
    [Parameter(Mandatory=$false)]
    [string]$TimeStampUrl = "http://timestamp.comodoca.com/authenticode"
)

# Colors
$INFO = @{ ForegroundColor = "Green" }
$WARN = @{ ForegroundColor = "Yellow" }
$ERROR = @{ ForegroundColor = "Red" }

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" @INFO
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" @WARN
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-Host "[ERROR] $Message" @ERROR
}

# Validate inputs
if (-not (Test-Path $ExePath)) {
    Write-ErrorMsg "Executable not found: $ExePath"
    exit 1
}

if ($DllPath -and -not (Test-Path $DllPath)) {
    Write-ErrorMsg "DLL not found: $DllPath"
    exit 1
}

# Check for signtool
try {
    & $SigntoolPath /? >$null 2>&1
}
catch {
    Write-ErrorMsg "signtool.exe not found at: $SigntoolPath"
    Write-Warn "Install Windows SDK or add signtool to PATH"
    exit 1
}

# Validate certificate credentials
if (-not $CertThumbprint) {
    if (-not $CertPath -or -not $CertPass) {
        Write-ErrorMsg "Either CERT_THUMBPRINT or both CERT_PATH and CERT_PASS must be set"
        exit 1
    }
    if (-not (Test-Path $CertPath)) {
        Write-ErrorMsg "Certificate file not found: $CertPath"
        exit 1
    }
}

# ============================================================================
# Build signtool command
# ============================================================================

$SigntoolArgs = @(
    "sign",
    "/fd", "SHA256",
    "/tr", $TimeStampUrl,
    "/td", "SHA256"
)

if ($CertThumbprint) {
    Write-Info "Signing with certificate thumbprint: $CertThumbprint"
    $SigntoolArgs += "/sha1", $CertThumbprint
}
else {
    Write-Info "Signing with certificate: $CertPath"
    $SigntoolArgs += "/f", $CertPath
    $SigntoolArgs += "/p", $CertPass
}

# ============================================================================
# Sign the executable
# ============================================================================

Write-Info "Signing executable: $ExePath"
$ExeSignArgs = $SigntoolArgs + $ExePath

& $SigntoolPath $ExeSignArgs | Out-Host

if ($LASTEXITCODE -ne 0) {
    Write-ErrorMsg "Failed to sign executable (exit code: $LASTEXITCODE)"
    exit 1
}

Write-Info "✓ Executable signed"

# ============================================================================
# Sign the DLL (if provided)
# ============================================================================

if ($DllPath) {
    Write-Info "Signing DLL: $DllPath"
    $DllSignArgs = $SigntoolArgs + $DllPath
    
    & $SigntoolPath $DllSignArgs | Out-Host
    
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorMsg "Failed to sign DLL (exit code: $LASTEXITCODE)"
        exit 1
    }
    
    Write-Info "✓ DLL signed"
}

# ============================================================================
# Verify signatures
# ============================================================================

Write-Info "Verifying signature..."

& $SigntoolPath verify /pa /pb $ExePath | Out-Host

if ($LASTEXITCODE -ne 0) {
    Write-ErrorMsg "Signature verification failed"
    exit 1
}

Write-Info "✓ Signature verified"
Write-Info ""
Write-Info "Summary:"
Write-Info "  Executable: $ExePath"
if ($DllPath) {
    Write-Info "  DLL: $DllPath"
}
Write-Info "  Timestamp: $TimeStampUrl"
Write-Info ""
Write-Info "Application is signed and ready for distribution"
