#
# Build Windows MSI installer using WiX Toolset
#
# Creates a professional Windows installer with uninstall support,
# registry entries, and system tray integration.
#
# Requires:
#   - WiX Toolset 3.11+ (heat.exe, candle.exe, light.exe)
#   - Visual Studio Build Tools or full Visual Studio
#
# Usage: .\scripts\build_msi.ps1 -ExePath <path> -ProductVersion <version>

param(
    [Parameter(Mandatory=$true)]
    [string]$ExePath,
    
    [Parameter(Mandatory=$false)]
    [string]$ProductVersion = "4.0.0",
    
    [Parameter(Mandatory=$false)]
    [string]$WixPath = "C:\Program Files (x86)\WiX Toolset v3.11\bin",
    
    [Parameter(Mandatory=$false)]
    [string]$OutputDir = "."
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

# Check for WiX tools
$HeatExe = Join-Path $WixPath "heat.exe"
$CandleExe = Join-Path $WixPath "candle.exe"
$LightExe = Join-Path $WixPath "light.exe"

$toolsFound = $true
if (-not (Test-Path $HeatExe)) {
    Write-ErrorMsg "heat.exe not found at: $HeatExe"
    $toolsFound = $false
}
if (-not (Test-Path $CandleExe)) {
    Write-ErrorMsg "candle.exe not found at: $CandleExe"
    $toolsFound = $false
}
if (-not (Test-Path $LightExe)) {
    Write-ErrorMsg "light.exe not found at: $LightExe"
    $toolsFound = $false
}

if (-not $toolsFound) {
    Write-ErrorMsg "WiX Toolset not found"
    Write-Warn "Install from: https://github.com/wixtoolset/wix3/releases"
    exit 1
}

# ============================================================================
# Configuration
# ============================================================================

$ProductName = "QueryAnalyzer"
$ProductId = (New-Guid).ToString()
$UpgradeCode = "7E1F3E8B-2A4C-4D5E-A6B7-C8D9E0F1A2B3"  # Fixed for upgrades
$Manufacturer = "Fujio Turner"

$SourceDir = Split-Path $ExePath
$WxsFile = Join-Path $OutputDir "QueryAnalyzer.wxs"
$WxoFile = Join-Path $OutputDir "QueryAnalyzer.wixobj"
$MsiFile = Join-Path $OutputDir "QueryAnalyzer-${ProductVersion}.msi"
$CabFile = Join-Path $OutputDir "QueryAnalyzer.cab"

Write-Info "Building MSI Installer for $ProductName v$ProductVersion"
Write-Info "Source Directory: $SourceDir"

# ============================================================================
# Create WiX source file
# ============================================================================

Write-Info "Generating WiX configuration..."

$WxsContent = @"
<?xml version="1.0" encoding="UTF-8"?>
<Wix xmlns="http://schemas.microsoft.com/wix/2006/wi">
    <Product Id="$ProductId"
             Name="$ProductName"
             Language="1033"
             Version="$ProductVersion"
             Manufacturer="$Manufacturer"
             UpgradeCode="$UpgradeCode">
        
        <Package Id="*"
                 Keywords="Query,Analyzer,Couchbase"
                 Description="$ProductName - N1QL Query Performance Analyzer"
                 Comments="$ProductName v$ProductVersion"
                 Manufacturer="$Manufacturer"
                 InstallerVersion="200"
                 Languages="1033"
                 SummaryCodepage="1252"
                 Compressed="yes" />
        
        <Media Id="1" Cabinet="$([System.IO.Path]::GetFileName($CabFile))" EmbedCab="yes" />
        
        <!-- Directory structure -->
        <Directory Id="TARGETDIR" Name="SourceDir">
            <Directory Id="ProgramFilesFolder">
                <Directory Id="INSTALLFOLDER" Name="$ProductName" />
            </Directory>
            <Directory Id="ProgramMenuFolder">
                <Directory Id="ApplicationProgramsFolder" Name="$ProductName" />
            </Directory>
            <Directory Id="DesktopFolder" Name="Desktop" />
        </Directory>
        
        <!-- Application files -->
        <Feature Id="ProductFeature"
                 Title="$ProductName"
                 Level="1">
            <ComponentRef Id="MainExeComponent" />
            <ComponentRef Id="DesktopShortcutComponent" />
            <ComponentRef Id="StartMenuShortcutComponent" />
            <ComponentRef Id="UninstallShortcutComponent" />
        </Feature>
        
        <!-- Main executable component -->
        <DirectoryRef Id="INSTALLFOLDER">
            <Component Id="MainExeComponent" Guid="$(var.WixUIWIChangedGuid)">
                <File Id="MainExeFile"
                      Name="$([System.IO.Path]::GetFileName($ExePath))"
                      Source="$ExePath"
                      KeyPath="yes" />
                <Shortcut Id="DesktopShortcut"
                          Directory="DesktopFolder"
                          Name="$ProductName"
                          WorkingDirectory="INSTALLFOLDER"
                          Icon="AppIcon.ico"
                          IconIndex="0" />
            </Component>
        </DirectoryRef>
        
        <!-- Start menu shortcut -->
        <DirectoryRef Id="ApplicationProgramsFolder">
            <Component Id="StartMenuShortcutComponent" Guid="*">
                <Shortcut Id="StartMenuShortcut"
                          Target="[INSTALLFOLDER]\$([System.IO.Path]::GetFileName($ExePath))"
                          Name="$ProductName" />
                <RemoveFolder Id="RemoveApplicationFolder" On="uninstall" />
                <RegistryValue Root="HKCU"
                              Key="Software\$Manufacturer\$ProductName"
                              Name="installed"
                              Type="integer"
                              Value="1"
                              KeyPath="yes" />
            </Component>
        </DirectoryRef>
        
        <!-- Desktop shortcut -->
        <DirectoryRef Id="DesktopFolder">
            <Component Id="DesktopShortcutComponent" Guid="*">
                <Shortcut Id="DesktopShortcutRemove"
                          Directory="DesktopFolder"
                          Name="$ProductName"
                          Target="[INSTALLFOLDER]\$([System.IO.Path]::GetFileName($ExePath))" />
                <RegistryValue Root="HKCU"
                              Key="Software\$Manufacturer\$ProductName"
                              Name="DesktopShortcut"
                              Type="integer"
                              Value="1"
                              KeyPath="yes" />
            </Component>
        </DirectoryRef>
        
        <!-- Uninstall shortcut -->
        <DirectoryRef Id="ApplicationProgramsFolder">
            <Component Id="UninstallShortcutComponent" Guid="*">
                <Shortcut Id="UninstallShortcut"
                          Name="Uninstall $ProductName"
                          Target="[SystemFolder]msiexec.exe"
                          Arguments="/x [ProductCode]"
                          Description="Uninstall $ProductName" />
                <RegistryValue Root="HKCU"
                              Key="Software\$Manufacturer\$ProductName"
                              Name="UninstallShortcut"
                              Type="integer"
                              Value="1"
                              KeyPath="yes" />
            </Component>
        </DirectoryRef>
        
        <!-- UI -->
        <UIRef Id="WixUI_InstallDir" />
        <UIRef Id="WixUI_ErrorProgressText" />
        
        <!-- Properties -->
        <Property Id="WIXUI_INSTALLDIR" Value="INSTALLFOLDER" />
        <Property Id="ARPNOMODIFY" Value="1" />
        <Property Id="ARPNOREPAIR" Value="1" />
        <Property Id="ARPHELPLINK" Value="https://cb.fuj.io" />
        <Property Id="ARPPRODUCTICON" Value="AppIcon.ico" />
        
        <!-- Auto-upgrade from previous versions -->
        <Upgrade Id="$UpgradeCode">
            <UpgradeVersion OnlyDetect="no"
                           Property="PREVIOUSVERSIONFOUND"
                           Minimum="0.0.0.0"
                           IncludeMinimum="yes"
                           Maximum="$ProductVersion"
                           IncludeMaximum="no" />
        </Upgrade>
        
        <InstallExecuteSequence>
            <RemoveExistingProducts After="InstallValidate" />
        </InstallExecuteSequence>
        
    </Product>
</Wix>
"@

$WxsContent | Out-File -FilePath $WxsFile -Encoding UTF8

log_info "✓ WiX source created: $WxsFile"

# ============================================================================
# Compile WiX source
# ============================================================================

Write-Info "Compiling WiX source..."

& $CandleExe $WxsFile -o $WxoFile

if ($LASTEXITCODE -ne 0) {
    Write-ErrorMsg "Failed to compile WiX source (exit code: $LASTEXITCODE)"
    exit 1
}

Write-Info "✓ WiX source compiled"

# ============================================================================
# Link WiX object to MSI
# ============================================================================

Write-Info "Linking MSI..."

& $LightExe -out $MsiFile $WxoFile -ext WixUIExtension -ext WixUtilExtension

if ($LASTEXITCODE -ne 0) {
    Write-ErrorMsg "Failed to link MSI (exit code: $LASTEXITCODE)"
    exit 1
}

Write-Info "✓ MSI created"

# ============================================================================
# Cleanup
# ============================================================================

Write-Info "Cleaning temporary files..."
Remove-Item -Path $WxoFile -Force -ErrorAction SilentlyContinue
Remove-Item -Path $CabFile -Force -ErrorAction SilentlyContinue

# ============================================================================
# Summary
# ============================================================================

$MsiSize = (Get-Item $MsiFile).Length / 1MB
Write-Info ""
Write-Info "Summary:"
Write-Info "  Installer: $MsiFile"
Write-Info "  Size: $([Math]::Round($MsiSize, 2)) MB"
Write-Info "  Version: $ProductVersion"
Write-Info ""
Write-Info "MSI installer is ready for distribution"
Write-Info ""
Write-Warn "Note: This is a basic MSI template. For production:"
Write-Warn "  - Add proper icon and license files"
Write-Warn "  - Configure installation directory permissions"
Write-Warn "  - Add registry entries for uninstall"
Write-Warn "  - Consider code signing the MSI"
