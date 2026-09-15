"""Every desktop pipeline must use the CBL recipe (issue #261)."""
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]

WORKFLOWS = [
    ".github/workflows/release-4.0.0-beta.yml",
    ".github/workflows/liquid-dryrun.yml",
    ".github/workflows/qa-build.yml",
    ".github/workflows/release.yml",
]
REQUIRED = ("fetch_libcblite", "build_mac.spec", "build_win.spec", "couchbase-lite-python")


def test_every_desktop_workflow_uses_the_cbl_recipe():
    action = (REPO / ".github" / "actions" / "build-desktop" / "action.yml").read_text()
    for token in REQUIRED:
        assert token in action, token

    missing = []
    for wf in WORKFLOWS:
        text = (REPO / wf).read_text()
        if "pyinstaller" not in text.lower() and "build-macos" not in text and "build-desktop" not in text:
            continue
        if "./.github/actions/build-desktop" in text:
            continue
        for token in REQUIRED:
            if token not in text:
                missing.append((wf, token))
    assert missing == [], f"workflows missing CBL desktop steps: {missing}"
