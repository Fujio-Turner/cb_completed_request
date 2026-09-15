"""Committed PyInstaller specs must be buildable (issue #250)."""
from pathlib import Path

APP = Path(__file__).resolve().parents[2] / "app"


def _spec_source(name: str) -> str:
    return (APP / name).read_text()


def test_mac_spec_version_is_4():
    src = _spec_source("build_mac.spec")
    assert "5.0.0" not in src
    assert "4.0.0" in src or "APP_VERSION" in src


def test_mac_spec_does_not_force_universal2():
    assert "target_arch='universal2'" not in _spec_source("build_mac.spec")
    assert 'target_arch="universal2"' not in _spec_source("build_mac.spec")


def test_mac_spec_uses_existing_icns():
    src = _spec_source("build_mac.spec")
    assert "QueryAnalyzer.icns" in src
    assert (APP / "assets/img/QueryAnalyzer.icns").is_file()


def test_win_spec_is_onedir_not_onefile_plus_collect():
    src = _spec_source("build_win.spec")
    assert "exclude_binaries=True" in src
    assert "EXE(\n    pyz,\n    a.scripts,\n    a.binaries" not in src


def test_runtime_hook_exists_if_spec_names_it():
    for spec in ("build_mac.spec", "build_win.spec"):
        src = _spec_source(spec)
        if "rt_set_cbl_path.py" in src:
            assert (APP / "build/hooks/rt_set_cbl_path.py").is_file()


def test_specs_bundle_default_config_not_user_config():
    for spec in ("build_mac.spec", "build_win.spec"):
        src = _spec_source(spec)
        assert "config.default.json" in src
        assert "('config.json'" not in src
