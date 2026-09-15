"""Unsigned / arch-honest desktop artifacts (issue #252)."""
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]


def test_mac_spec_does_not_claim_universal2():
    src = (REPO / "app" / "build_mac.spec").read_text()
    assert "universal2" not in src


def test_readme_does_not_promise_setup_exe_until_msi_exists():
    readme = (REPO / "README.md").read_text()
    wf = (REPO / ".github" / "workflows" / "release-4.0.0-beta.yml").read_text()
    action = (REPO / ".github" / "actions" / "build-desktop" / "action.yml").read_text()
    if "Setup.exe" in readme:
        assert "build_msi.ps1" in wf or "build_msi.ps1" in action
    else:
        assert "Setup.exe" not in readme


def test_release_workflow_records_arch_in_asset_name():
    wf = (REPO / ".github" / "workflows" / "release-4.0.0-beta.yml").read_text()
    action = (REPO / ".github" / "actions" / "build-desktop" / "action.yml").read_text()
    combined = wf + action
    assert "arm64" in combined or "x86_64" in combined or "UNSIGNED" in combined
