"""Tracked-tree hygiene: gitignore must actually apply.

These paths were committed on release-4.0.0-beta despite .gitignore
(node_modules, coverage artifacts, .DS_Store, credential-shaped config).
"""
import subprocess
from pathlib import Path


REPO = Path(__file__).resolve().parents[2]


def _tracked_files() -> list[str]:
    result = subprocess.run(
        ["git", "ls-files", "-z"],
        cwd=REPO,
        check=True,
        capture_output=True,
    )
    return [p for p in result.stdout.decode().split("\0") if p]


def test_node_modules_is_not_tracked():
    tracked = _tracked_files()
    leaked = [p for p in tracked if p == "node_modules" or p.startswith("node_modules/")]
    assert leaked == [], f"node_modules still tracked ({len(leaked)} paths)"


def test_coverage_and_ds_store_not_tracked():
    tracked = set(_tracked_files())
    forbidden = {".coverage", ".DS_Store", "app/.DS_Store"}
    leaked = sorted(forbidden & tracked)
    assert leaked == [], f"ignored junk still tracked: {leaked}"


def test_user_config_json_is_not_tracked():
    tracked = set(_tracked_files())
    assert "app/config.json" not in tracked
    # The shipped default (no secrets) must remain in the tree.
    assert (REPO / "app" / "config.default.json").is_file()
