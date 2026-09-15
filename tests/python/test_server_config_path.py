"""Frozen app must load config from _MEIPASS (issue #256)."""
import json
from pathlib import Path
from unittest.mock import patch

REPO = Path(__file__).resolve().parents[2]


def test_load_server_config_uses_meipass_when_frozen(tmp_path, monkeypatch):
    cfg = tmp_path / "config.default.json"
    cfg.write_text(json.dumps({"server": {"port": 9090}}))
    import app

    monkeypatch.delenv("PORT", raising=False)
    monkeypatch.delenv("APP_CONFIG_FILE", raising=False)

    with patch("ports.get_resource_path", return_value=str(tmp_path)):
        data = app._load_server_config()
    assert data["server"]["port"] == 9090


def test_spec_bundles_default_config_not_user_config():
    mac = (REPO / "app" / "build_mac.spec").read_text()
    assert "config.default.json" in mac
    assert "('config.json'" not in mac
