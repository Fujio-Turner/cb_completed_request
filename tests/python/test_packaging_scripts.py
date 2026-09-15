"""Sign / DMG / MSI scripts (issue #255)."""
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]


def test_sign_script_finds_dylib_anywhere_in_bundle():
    src = (REPO / "app" / "scripts" / "sign_and_notarize_macos.sh").read_text()
    assert "find " in src and "libcblite" in src
    assert "Contents/MacOS/libcblite.3.dylib" not in src


def test_msi_script_has_no_placeholder_guid():
    src = (REPO / "app" / "scripts" / "build_msi.ps1").read_text()
    assert "WixUIWIChangedGuid" not in src
    assert "AppIcon.ico" in src
    assert "Icon Id=" in src or "<Icon" in src


def test_beta_workflow_creates_applications_symlink_in_dmg():
    wf = (REPO / ".github" / "workflows" / "release-4.0.0-beta.yml").read_text()
    action = (REPO / ".github" / "actions" / "build-desktop" / "action.yml").read_text()
    combined = wf + action
    assert "ln -s /Applications" in combined or "build_dmg.sh" in combined
