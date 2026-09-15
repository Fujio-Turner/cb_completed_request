"""Contract for what a desktop (PyInstaller) bundle must contain.

Imported by the spec files and by unit tests so the "CBL + tray + AI"
surface cannot drift between macOS and Windows builds.
"""

REQUIRED_PY_MODULES = (
    "cbl_store",
    "blob_storage",
    "app_base",
    "logging_config",
    "ai_analyzer",
    "tray",
    "CouchbaseLite",
)

REQUIRED_NATIVE = {
    "darwin": "libcblite.3.dylib",
    "win32": "cblite.dll",
}


def desktop_hiddenimports():
    """PyInstaller hiddenimports that every desktop build must collect."""
    extras = (
        "ports",
        "version",
        "flask",
        "flask_cors",
        "openai",
        "platformdirs",
        "requests",
        "icecream",
    )
    return list(REQUIRED_PY_MODULES) + list(extras)
