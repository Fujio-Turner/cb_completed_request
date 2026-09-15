"""CBL_AVAILABLE must follow native bindings, not the presence of cbl_store.py."""
import cbl_store
import app


def test_cbl_available_follows_use_cbl_flag():
    assert app.CBL_AVAILABLE is bool(cbl_store.USE_CBL)


def test_storage_returns_none_when_bindings_missing(monkeypatch):
    monkeypatch.setattr(app, "CBL_AVAILABLE", True)

    class Boom:
        def __init__(self):
            raise RuntimeError("CBLStore requires CBL bindings (import error: fake)")

    monkeypatch.setattr(app, "CBLStore", Boom)
    monkeypatch.setattr(app, "_cbl_store", None)
    assert app.storage() is None


def test_storage_info_is_json_error_not_traceback(monkeypatch):
    monkeypatch.setattr(app, "storage", lambda: None)
    client = app.app.test_client()
    res = client.get("/api/storage/info")
    assert res.status_code == 503
    body = res.get_json()
    assert body["success"] is False
    assert "CBL" in body["error"]



