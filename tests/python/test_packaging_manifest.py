"""Desktop bundle contract (issue #247)."""
from pathlib import Path

from packaging_manifest import REQUIRED_NATIVE, REQUIRED_PY_MODULES, desktop_hiddenimports

REPO = Path(__file__).resolve().parents[2]


def test_cbl_is_a_required_desktop_module():
    assert "CouchbaseLite" in desktop_hiddenimports()
    assert "cbl_store" in REQUIRED_PY_MODULES


def test_native_lib_names_match_fetch_scripts():
    assert REQUIRED_NATIVE["darwin"] == "libcblite.3.dylib"
    assert REQUIRED_NATIVE["win32"] == "cblite.dll"


def test_beta_release_workflow_builds_cbl_bindings():
    wf = (REPO / ".github" / "workflows" / "release-4.0.0-beta.yml").read_text()
    action = (REPO / ".github" / "actions" / "build-desktop" / "action.yml").read_text()
    combined = wf + action
    assert "fetch_libcblite_macos.sh" in combined
    assert "couchbase-lite-python" in combined
    assert "build_mac.spec" in combined
    assert "build_win.spec" in combined
    assert "cat > QueryAnalyzer.spec" not in wf
