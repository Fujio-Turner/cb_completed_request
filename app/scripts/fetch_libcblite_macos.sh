#!/bin/bash
#
# Fetch CouchbaseLite native dylib for macOS
#
# Downloads the universal binary (Intel + Apple Silicon) libcblite.3.dylib
# from the official Couchbase repository and places it in vendor/macos/
#
# Usage: ./scripts/fetch_libcblite_macos.sh [--clean]

set -e

# Configuration
CBLITE_VERSION="3.1.0"
DOWNLOAD_URL="https://packages.couchbase.com/couchbase-lite/swift/macos/libcblite-${CBLITE_VERSION}-macos-universal.zip"
VENDOR_DIR="vendor/macos"
DYLIB_NAME="libcblite.3.dylib"
EXPECTED_FILE="${VENDOR_DIR}/${DYLIB_NAME}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Parse command line arguments
CLEAN_MODE=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --clean)
            CLEAN_MODE=true
            shift
            ;;
        *)
            log_error "Unknown argument: $1"
            exit 1
            ;;
    esac
done

# Create vendor directory
mkdir -p "$VENDOR_DIR"

# Clean if requested
if [ "$CLEAN_MODE" = true ]; then
    log_info "Cleaning existing dylib..."
    rm -f "$EXPECTED_FILE"
fi

# Check if dylib already exists
if [ -f "$EXPECTED_FILE" ]; then
    log_info "✓ libcblite.3.dylib already exists at $EXPECTED_FILE"
    exit 0
fi

log_info "Downloading libcblite v$CBLITE_VERSION for macOS..."

# Create temporary directory
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Download and extract
if ! curl -fsSL "$DOWNLOAD_URL" -o "$TEMP_DIR/libcblite.zip"; then
    log_error "Failed to download libcblite from $DOWNLOAD_URL"
    exit 1
fi

log_info "Extracting dylib..."
if ! unzip -q "$TEMP_DIR/libcblite.zip" -d "$TEMP_DIR"; then
    log_error "Failed to extract dylib"
    exit 1
fi

# Find and copy the dylib
if [ -f "$TEMP_DIR/libcblite.3.dylib" ]; then
    cp "$TEMP_DIR/libcblite.3.dylib" "$EXPECTED_FILE"
elif [ -f "$TEMP_DIR/libcblite/libcblite.3.dylib" ]; then
    cp "$TEMP_DIR/libcblite/libcblite.3.dylib" "$EXPECTED_FILE"
else
    log_error "libcblite.3.dylib not found in downloaded archive"
    exit 1
fi

log_info "✓ libcblite.3.dylib downloaded and placed at $EXPECTED_FILE"
log_info "File size: $(ls -lh $EXPECTED_FILE | awk '{print $5}')"
