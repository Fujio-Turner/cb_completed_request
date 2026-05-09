#!/bin/bash
#
# Build macOS DMG installer with nice layout
#
# Creates a professional DMG with background image, app icon,
# and Applications shortcut for drag-and-drop installation.
#
# Usage: ./scripts/build_dmg.sh <QueryAnalyzer.app> [--bg-image <path>]

set -e

# Configuration
DMG_VOLUME_NAME="QueryAnalyzer"
DMG_SIZE="300m"  # Size of DMG volume
APP_X=100
APP_Y=100
APP_SYMLINK_X=300
APP_SYMLINK_Y=100

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

# Parse arguments
if [ $# -lt 1 ]; then
    log_error "Usage: $0 <QueryAnalyzer.app> [--bg-image <path>]"
    exit 1
fi

APP_BUNDLE="$1"
BG_IMAGE=""

shift
while [[ $# -gt 0 ]]; do
    case $1 in
        --bg-image)
            BG_IMAGE="$2"
            shift 2
            ;;
        *)
            log_error "Unknown argument: $1"
            exit 1
            ;;
    esac
done

# Validate app bundle
if [ ! -d "$APP_BUNDLE" ]; then
    log_error "Application bundle not found: $APP_BUNDLE"
    exit 1
fi

# Extract app name
APP_NAME=$(basename "$APP_BUNDLE" .app)
DMG_FILE="${APP_NAME}.dmg"
TEMP_DIR=$(mktemp -d)
MOUNT_DIR="/Volumes/$DMG_VOLUME_NAME"

trap "rm -rf $TEMP_DIR; [ -d \"$MOUNT_DIR\" ] && hdiutil detach \"$MOUNT_DIR\" 2>/dev/null || true" EXIT

log_info "Building DMG for $APP_NAME..."

# ============================================================================
# STEP 1: Create temporary DMG
# ============================================================================

log_info "Creating temporary DMG..."

# Remove existing DMG
rm -f "$DMG_FILE"

# Create temporary DMG
hdiutil create -srcfolder "$TEMP_DIR" \
    -volname "$DMG_VOLUME_NAME" \
    -fs HFS+ \
    -fsargs "-c c=64,a=16,e=16" \
    -format UDRW \
    -size $DMG_SIZE \
    "${DMG_FILE}.tmp" || {
    log_error "Failed to create temporary DMG"
    exit 1
}

# ============================================================================
# STEP 2: Mount DMG
# ============================================================================

log_info "Mounting DMG..."

# Attach the DMG
DEVICE=$(hdiutil attach "${DMG_FILE}.tmp" | grep -E '^/dev/' | head -1 | awk '{print $1}')

if [ -z "$DEVICE" ]; then
    log_error "Failed to mount DMG"
    exit 1
fi

sleep 1

# ============================================================================
# STEP 3: Copy app and create symlink
# ============================================================================

log_info "Copying application..."

cp -R "$APP_BUNDLE" "$MOUNT_DIR/" || {
    log_error "Failed to copy application"
    hdiutil detach "$DEVICE"
    exit 1
}

# Create symlink to Applications folder
ln -s /Applications "$MOUNT_DIR/Applications" || {
    log_warn "Failed to create Applications symlink"
}

# ============================================================================
# STEP 4: Create background image (if not provided)
# ============================================================================

if [ -n "$BG_IMAGE" ] && [ -f "$BG_IMAGE" ]; then
    log_info "Using background image: $BG_IMAGE"
    cp "$BG_IMAGE" "$MOUNT_DIR/.background.png"
    BG_IMAGE_NAME=".background.png"
else
    log_info "Creating default background image..."
    BG_IMAGE_NAME=".background.png"
    
    # Create a simple background image using ImageMagick (if available)
    if command -v convert &> /dev/null; then
        convert -size 600x400 \
            xc:'#f0f0f0' \
            -gravity center \
            -pointsize 48 \
            -fill '#333333' \
            -annotate +0+0 'Drag to Applications' \
            "$MOUNT_DIR/$BG_IMAGE_NAME" 2>/dev/null || {
            log_warn "Failed to create custom background image"
            BG_IMAGE_NAME=""
        }
    else
        log_warn "ImageMagick not found, skipping custom background"
        BG_IMAGE_NAME=""
    fi
fi

# ============================================================================
# STEP 5: Configure DMG layout with AppleScript
# ============================================================================

log_info "Configuring DMG layout..."

APPLESCRIPT=$(cat <<'EOF'
tell application "Finder"
    tell disk "VOLUME_NAME"
        open
        set current view of container window to icon view
        set toolbar visible of container window to false
        set statusbar visible of container window to false
        set the bounds of container window to {100, 100, 700, 500}
        set viewOptions to the icon view options of container window
        set arrangement of viewOptions to not arranged
        set icon size of viewOptions to 100
        set background picture of viewOptions to file ".background.png"
        
        set position of item "APP_NAME.app" of container window to {APP_X, APP_Y}
        set position of item "Applications" of container window to {APP_SYMLINK_X, APP_SYMLINK_Y}
        
        close
        open
        update without registering applications
    end tell
end tell
EOF
)

APPLESCRIPT=${APPLESCRIPT//VOLUME_NAME/$DMG_VOLUME_NAME}
APPLESCRIPT=${APPLESCRIPT//APP_NAME/$APP_NAME}
APPLESCRIPT=${APPLESCRIPT//APP_X/$APP_X}
APPLESCRIPT=${APPLESCRIPT//APP_Y/$APP_Y}
APPLESCRIPT=${APPLESCRIPT//APP_SYMLINK_X/$APP_SYMLINK_X}
APPLESCRIPT=${APPLESCRIPT//APP_SYMLINK_Y/$APP_SYMLINK_Y}

osascript <<< "$APPLESCRIPT" 2>/dev/null || {
    log_warn "Failed to configure DMG layout via AppleScript"
}

sleep 2

# ============================================================================
# STEP 6: Unmount DMG
# ============================================================================

log_info "Finalizing DMG..."

hdiutil detach "$DEVICE" || {
    log_error "Failed to unmount DMG"
    exit 1
}

# ============================================================================
# STEP 7: Convert to read-only compressed
# ============================================================================

log_info "Converting to compressed format..."

hdiutil convert "${DMG_FILE}.tmp" \
    -format UDZO \
    -imagekey zlib-level=9 \
    -o "$DMG_FILE" || {
    log_error "Failed to convert DMG"
    exit 1
}

rm -f "${DMG_FILE}.tmp"

# ============================================================================
# SUMMARY
# ============================================================================

DMG_SIZE=$(ls -lh "$DMG_FILE" | awk '{print $5}')

log_info "✓ DMG created successfully"
log_info ""
log_info "Summary:"
log_info "  File: $DMG_FILE"
log_info "  Size: $DMG_SIZE"
log_info "  Volume: $DMG_VOLUME_NAME"
log_info ""
log_info "DMG is ready for distribution"
