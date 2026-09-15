"""Tray helpers (issue #253)."""
from pathlib import Path
from unittest.mock import patch

import tray

REPO = Path(__file__).resolve().parents[2]


def test_is_supported_on_darwin():
    with patch("tray._is_macos", return_value=True), patch("tray._is_windows", return_value=False):
        assert tray.is_supported() is True


def test_is_supported_on_linux_is_false():
    with patch("tray._is_macos", return_value=False), patch("tray._is_windows", return_value=False):
        assert tray.is_supported() is False


def test_run_tray_returns_false_when_rumps_missing():
    with patch("tray._is_macos", return_value=True), patch(
        "tray._run_macos_tray", side_effect=ImportError("No module named rumps")
    ):
        assert tray.run_tray(8080) is False


def test_requirements_desktop_lists_tray_libs():
    text = (REPO / "app" / "requirements-desktop.txt").read_text()
    assert "rumps" in text
    assert "pystray" in text
