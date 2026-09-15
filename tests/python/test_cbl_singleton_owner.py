"""One CBLStore owner (issue #257)."""
import pytest

import cbl_store

pytestmark = pytest.mark.skipif(
    cbl_store.USE_CBL is False,
    reason="CBL bindings required",
)


def test_app_storage_and_app_base_are_same_instance():
    import app
    import app_base

    a = app.storage()
    b = app_base._get_cbl_store()
    assert a is b


def test_close_db_resets_app_cache(tmp_path, monkeypatch):
    import app

    monkeypatch.setenv("CBL_DB_DIR", str(tmp_path))
    first = app.storage()
    cbl_store.close_db()
    app._cbl_store = None
    second = app.storage()
    assert first is not second
