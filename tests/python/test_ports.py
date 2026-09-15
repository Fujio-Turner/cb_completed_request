"""Listen-port resolution (issue #249)."""
from unittest.mock import patch

from ports import DEFAULT_PORT, get_server_port


def test_default_port_is_8080():
    assert DEFAULT_PORT == 8080


def test_env_port_wins(monkeypatch):
    monkeypatch.setenv("PORT", "5555")
    assert get_server_port() == 5555


def test_invalid_env_port_falls_back(monkeypatch):
    monkeypatch.setenv("PORT", "not-a-port")
    with patch("ports._load_server_config", return_value={}):
        assert get_server_port() == DEFAULT_PORT


def test_config_json_port_used_when_no_env(monkeypatch):
    monkeypatch.delenv("PORT", raising=False)
    with patch("ports._load_server_config", return_value={"server": {"port": 9090}}):
        assert get_server_port() == 9090


def test_banner_port_matches_bind_port(capsys, monkeypatch):
    monkeypatch.setenv("PORT", "8080")
    import app

    app._startup_banner(8080)
    out = capsys.readouterr().out
    assert "localhost:8080" in out
    assert "localhost:8888" not in out
