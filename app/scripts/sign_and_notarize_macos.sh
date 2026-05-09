#!/bin/bash
#
# Sign and notarize macOS application
#
# Codesigns the application bundle and dylib, then submits for notarization.
# Requires APPLE_DEV_ID and APPLE_DEV_PASS environment variables.
#
# Usage: ./scripts/sign_and_notarize_macos.sh <QueryAnalyzer.app>

set -e

# Configuration
KEYCHAIN_PROFILE="AC_PASSWORD"
NOTARIZE_TIMEOUT=3600  # 1 hour in seconds

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate arguments
if [ $# -lt 1 ]; then
    log_error "Usage: $0 <QueryAnalyzer.app>"
    exit 1
fi

APP_BUNDLE="$1"

# Validate inputs
if [ ! -d "$APP_BUNDLE" ]; then
    log_error "Application bundle not found: $APP_BUNDLE"
    exit 1
fi

if [ -z "$APPLE_DEV_ID" ]; then
    log_error "APPLE_DEV_ID environment variable not set"
    exit 1
fi

# Check for dylib
DYLIB_PATH="$APP_BUNDLE/Contents/MacOS/libcblite.3.dylib"
if [ ! -f "$DYLIB_PATH" ]; then
    log_warn "libcblite.3.dylib not found at $DYLIB_PATH"
    DYLIB_PATH=""
fi

# ============================================================================
# STEP 1: Sign the dylib (if present)
# ============================================================================

if [ -n "$DYLIB_PATH" ]; then
    log_info "Signing libcblite.3.dylib..."
    codesign --force --sign "$APPLE_DEV_ID" "$DYLIB_PATH" || {
        log_error "Failed to sign dylib"
        exit 1
    }
    log_info "✓ dylib signed"
fi

# ============================================================================
# STEP 2: Verify and sign nested frameworks/libraries
# ============================================================================

log_info "Signing nested dependencies..."
find "$APP_BUNDLE/Contents" -type f \( -name "*.dylib" -o -name "*.framework" \) | while read -r item; do
    log_info "  Signing: $item"
    codesign --force --sign "$APPLE_DEV_ID" "$item" || true
done

# ============================================================================
# STEP 3: Sign the main application bundle
# ============================================================================

log_info "Signing application bundle..."
codesign --force \
    --sign "$APPLE_DEV_ID" \
    --entitlements "build/macos/entitlements.plist" \
    "$APP_BUNDLE" || {
    log_error "Failed to sign application bundle"
    exit 1
}

log_info "✓ Application bundle signed"

# ============================================================================
# STEP 4: Verify signature
# ============================================================================

log_info "Verifying signature..."
codesign --verify --verbose=2 "$APP_BUNDLE" || {
    log_error "Signature verification failed"
    exit 1
}

log_info "✓ Signature verified"

# ============================================================================
# STEP 5: Create DMG for notarization
# ============================================================================

APP_NAME=$(basename "$APP_BUNDLE" .app)
DMG_FILE="${APP_NAME}.dmg"

log_info "Creating DMG for notarization..."

# Remove existing DMG
rm -f "$DMG_FILE"

# Create temporary directory for DMG contents
TEMP_DMG_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DMG_DIR" EXIT

cp -R "$APP_BUNDLE" "$TEMP_DMG_DIR/"

# Create DMG with hdiutil
hdiutil create -volname "$APP_NAME" \
    -srcfolder "$TEMP_DMG_DIR" \
    -ov -format UDZO \
    "$DMG_FILE" || {
    log_error "Failed to create DMG"
    exit 1
}

log_info "✓ DMG created: $DMG_FILE"

# ============================================================================
# STEP 6: Submit for notarization
# ============================================================================

log_info "Submitting for notarization (this may take a few minutes)..."

# Store Apple Developer password in keychain (if not already stored)
if [ -n "$APPLE_DEV_PASS" ]; then
    echo "$APPLE_DEV_PASS" | xcrun notarytool store-credentials "$KEYCHAIN_PROFILE" \
        --apple-id "$APPLE_DEV_ID" \
        --password - \
        --team-id "$(echo $APPLE_DEV_ID | cut -d@ -f1)" \
        2>/dev/null || true
fi

# Submit for notarization
SUBMISSION_ID=$(xcrun notarytool submit "$DMG_FILE" \
    --keychain-profile "$KEYCHAIN_PROFILE" \
    --wait \
    --timeout "$NOTARIZE_TIMEOUT" \
    2>&1 | grep -o '[a-f0-9\-]*' | tail -1) || {
    log_error "Failed to submit for notarization"
    exit 1
}

log_info "✓ Submitted for notarization (ID: $SUBMISSION_ID)"

# ============================================================================
# STEP 7: Staple notarization ticket
# ============================================================================

log_info "Stapling notarization ticket..."
xcrun stapler staple "$APP_BUNDLE" || {
    log_warn "Failed to staple notarization ticket (may not be ready yet)"
    log_warn "Retry with: xcrun stapler staple $APP_BUNDLE"
}

log_info "✓ Application notarized and ready for distribution"
log_info ""
log_info "Summary:"
log_info "  App Bundle: $APP_BUNDLE"
log_info "  DMG: $DMG_FILE"
log_info "  Notarization ID: $SUBMISSION_ID"
