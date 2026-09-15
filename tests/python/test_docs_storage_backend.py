"""Docs must not promise STORAGE_BACKEND=server (issue #258)."""
from pathlib import Path

import pytest

import cbl_store

REPO = Path(__file__).resolve().parents[2]


def test_storage_backend_is_cbl_only():
    if cbl_store.USE_CBL:
        assert cbl_store.storage_backend() == "cbl"
    else:
        with pytest.raises(RuntimeError, match="Couchbase Lite"):
            cbl_store.storage_backend()


def test_readme_does_not_promise_server_fallback():
    readme = (REPO / "README.md").read_text()
    assert "STORAGE_BACKEND=server" not in readme


def test_readme_layout_points_at_app_dir():
    readme = (REPO / "README.md").read_text()
    assert "app/app.py" in readme or "├── app/" in readme
    # Root-level lie from the pre-migration README: `app.py` at repo root.
    assert "\n├── app.py" not in readme
