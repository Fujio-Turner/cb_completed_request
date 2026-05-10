#!/usr/bin/env python3
"""
Optional system-tray / menubar icon for the standalone QueryAnalyzer app.

When launched as a PyInstaller bundle (.app on macOS, .exe on Windows), this
module gives the user a menu icon with:

    🔍 CBQA
       ├─ Open in Browser
       ├─ About
       └─ Quit

The Flask server runs on a daemon thread so the tray library can own the main
thread (a hard requirement for NSApplication on macOS).

This module is imported lazily from ``app.py``'s ``__main__`` block so it
adds zero overhead when running under gunicorn / Docker (server edition) or
when imported by tests.

Skip the tray with ``CBQA_NO_TRAY=1`` — useful for headless smoke tests.
"""

from __future__ import annotations

import os
import sys
import webbrowser


def _is_macos() -> bool:
    return sys.platform == 'darwin'


def _is_windows() -> bool:
    return sys.platform == 'win32'


def is_supported() -> bool:
    """True if a tray implementation exists for the current platform."""
    return _is_macos() or _is_windows()


def _hard_quit() -> None:
    """
    Werkzeug's dev server (used by ``app.run``) doesn't expose a clean
    cross-thread shutdown hook, so we exit the whole process. The Flask
    thread is a daemon, so this is safe.
    """
    os._exit(0)


# ---------------------------------------------------------------------------
# macOS — rumps menubar app
# ---------------------------------------------------------------------------

def _run_macos_tray(port: int) -> None:
    import rumps  # type: ignore

    url = f"http://localhost:{port}"

    class QueryAnalyzerApp(rumps.App):
        def __init__(self):
            # title="🔍" puts a magnifying-glass glyph in the menubar; no
            # icon file required, so we don't need to bundle a PNG.
            super().__init__("CBQA", title="🔍")
            self.menu = ["Open in Browser", "About", None]  # None → separator

        @rumps.clicked("Open in Browser")
        def open_browser(self, _):
            webbrowser.open(url)

        @rumps.clicked("About")
        def about(self, _):
            rumps.alert(
                title="Couchbase Query Analyzer",
                message=(
                    f"Running at {url}\n\n"
                    "Use the Quit menu item to stop the server."
                ),
            )

        # rumps adds a default Quit item that calls rumps.quit_application(),
        # which exits the process — exactly what we want.

    QueryAnalyzerApp().run()


# ---------------------------------------------------------------------------
# Windows — pystray system tray
# ---------------------------------------------------------------------------

def _run_windows_tray(port: int) -> None:
    import pystray  # type: ignore
    from PIL import Image, ImageDraw  # type: ignore

    url = f"http://localhost:{port}"

    # Build a simple 64×64 magnifying-glass icon programmatically so we
    # don't have to ship a separate file or rely on the .ico being on disk
    # at runtime (PyInstaller would unpack it but this is simpler).
    img = Image.new('RGB', (64, 64), color=(28, 28, 60))
    d = ImageDraw.Draw(img)
    d.ellipse((10, 10, 42, 42), outline=(0, 217, 255), width=4)
    d.line((36, 36, 56, 56), fill=(0, 217, 255), width=4)

    def on_open(icon, item):  # noqa: ARG001
        webbrowser.open(url)

    def on_quit(icon, item):  # noqa: ARG001
        icon.stop()
        _hard_quit()

    icon = pystray.Icon(
        "cbqa",
        img,
        f"Couchbase Query Analyzer (port {port})",
        menu=pystray.Menu(
            pystray.MenuItem("Open in Browser", on_open, default=True),
            pystray.MenuItem("Quit", on_quit),
        ),
    )
    icon.run()


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def run_tray(port: int) -> bool:
    """
    Start the platform-appropriate tray and BLOCK until the user quits.

    Returns:
        True  — tray ran (and has now exited; the process is being torn down).
        False — no tray available / library missing / unexpected error.
                Caller should fall back to a blocking ``app.run(...)``.
    """
    try:
        if _is_macos():
            _run_macos_tray(port)
            return True
        if _is_windows():
            _run_windows_tray(port)
            return True
    except Exception as e:  # pragma: no cover — best-effort UX
        print(f"⚠️  Could not start tray icon: {e}", file=sys.stderr)
        return False
    return False
