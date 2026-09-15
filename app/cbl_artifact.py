"""Couchbase Lite C community-edition artifact URLs.

Used by the fetch scripts (documented) and by unit tests so download URLs
cannot drift from the Dockerfile. Does not hit the network.
"""

CBL_VERSION = "3.2.4"
# Pin the experimental Python bindings to a SHA that matches CBL C 3.2.4
# (`where` on index config). `--depth 1` of master will drift and break the
# CFFI compile against these headers.
CBL_PYTHON_GIT = "https://github.com/couchbaselabs/couchbase-lite-python.git"
CBL_PYTHON_SHA = "2d1c79041de30a26a8b7f632d52a89fc031f1600"
BASE = "https://packages.couchbase.com/releases/couchbase-lite-c"

# platform in {"macos", "windows-x86_64", "linux-x86_64", "linux-arm64"}
_VALID_PLATFORMS = frozenset(
    {"macos", "windows-x86_64", "linux-x86_64", "linux-arm64"}
)


def community_zip_url(version: str, platform: str) -> str:
    if platform not in _VALID_PLATFORMS:
        raise ValueError(f"unknown CBL platform: {platform}")
    return f"{BASE}/{version}/couchbase-lite-c-community-{version}-{platform}.zip"


def dylib_members():
    return ("libcblite-community/lib/libcblite.3.dylib",)
