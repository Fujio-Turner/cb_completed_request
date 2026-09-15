#!/bin/bash
#
# Fetch Couchbase Lite C (community) for macOS and place libcblite.3.dylib
# plus headers under app/vendor/macos/.
#
# URL tree matches app/Dockerfile (releases/couchbase-lite-c/<ver>/...).
# Usage: ./scripts/fetch_libcblite_macos.sh [--clean]
#
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CBL_VERSION="${CBL_VERSION:-3.2.4}"
DEST="${APP_DIR}/vendor/macos"
URL="https://packages.couchbase.com/releases/couchbase-lite-c/${CBL_VERSION}/couchbase-lite-c-community-${CBL_VERSION}-macos.zip"
DYLIB_NAME="libcblite.3.dylib"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

CLEAN_MODE=false
while [[ $# -gt 0 ]]; do
    case "$1" in
        --clean) CLEAN_MODE=true; shift ;;
        *) log_error "Unknown argument: $1"; exit 1 ;;
    esac
done

mkdir -p "${DEST}/include"

if [ "$CLEAN_MODE" = true ]; then
    log_info "Cleaning existing dylib and headers..."
    rm -f "${DEST}/${DYLIB_NAME}"
    rm -rf "${DEST}/include"
    mkdir -p "${DEST}/include"
fi

log_info "Downloading Couchbase Lite C ${CBL_VERSION} for macOS..."
log_info "URL: ${URL}"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

HTTP_CODE="$(curl -sS -L -o "${TMP}/cbl.zip" -w "%{http_code}" "${URL}")"
if [ "${HTTP_CODE}" != "200" ]; then
    log_error "Download failed HTTP ${HTTP_CODE} from ${URL}"
    exit 1
fi

log_info "Extracting archive..."
unzip -q "${TMP}/cbl.zip" -d "${TMP}/extract"

DYLIB="$(find "${TMP}/extract" -name "${DYLIB_NAME}" | head -1 || true)"
if [ -z "${DYLIB}" ]; then
    log_error "${DYLIB_NAME} not found in downloaded archive"
    find "${TMP}/extract" -type f | head -50 >&2
    exit 1
fi
cp "${DYLIB}" "${DEST}/${DYLIB_NAME}"

# Also copy unversioned / sibling dylibs if present (loader sometimes wants them).
find "$(dirname "${DYLIB}")" -name 'libcblite*.dylib' -exec cp {} "${DEST}/" \;

INC="$(find "${TMP}/extract" -type d -name include | head -1 || true)"
if [ -n "${INC}" ]; then
    cp -R "${INC}/." "${DEST}/include/"
else
    log_warn "No include/ directory in archive — CFFI build may fail"
fi

log_info "✓ ${DYLIB_NAME} placed at ${DEST}/${DYLIB_NAME}"
log_info "File size: $(ls -lh "${DEST}/${DYLIB_NAME}" | awk '{print $5}')"
