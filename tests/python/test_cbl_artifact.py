"""CBL download URL construction (no network)."""
from pathlib import Path

from cbl_artifact import CBL_PYTHON_SHA, CBL_VERSION, community_zip_url, dylib_members

REPO = Path(__file__).resolve().parents[2]


def test_version_matches_dockerfile():
    dockerfile = (REPO / "app" / "Dockerfile").read_text()
    collapsed = dockerfile.replace(" ", "")
    assert f"CBL_VERSION={CBL_VERSION}" in collapsed
    assert CBL_PYTHON_SHA in dockerfile


def test_macos_url_uses_releases_tree_not_swift():
    url = community_zip_url(CBL_VERSION, "macos")
    assert f"releases/couchbase-lite-c/{CBL_VERSION}/" in url
    assert "/swift/" not in url
    assert url.endswith(f"couchbase-lite-c-community-{CBL_VERSION}-macos.zip")


def test_windows_url_uses_windows_x86_64():
    url = community_zip_url(CBL_VERSION, "windows-x86_64")
    assert "/cpp/" not in url
    assert url.endswith("windows-x86_64.zip")


def test_fetch_scripts_use_releases_tree():
    sh = (REPO / "app" / "scripts" / "fetch_libcblite_macos.sh").read_text()
    ps1 = (REPO / "app" / "scripts" / "fetch_libcblite_windows.ps1").read_text()
    assert "releases/couchbase-lite-c" in sh
    assert "/swift/" not in sh
    assert "releases/couchbase-lite-c" in ps1
    assert "/cpp/" not in ps1


def test_dylib_member_path():
    assert "libcblite.3.dylib" in dylib_members()[0]


def test_desktop_action_pins_python_bindings_sha():
    action = (REPO / ".github" / "actions" / "build-desktop" / "action.yml").read_text()
    assert CBL_PYTHON_SHA in action
    assert "couchbase-lite-python" in action
