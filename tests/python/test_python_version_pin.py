"""Desktop CI and Docker must share one CPython (issue #262)."""
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]


def _pyver_file() -> str:
    return (REPO / ".python-version").read_text().strip()


def test_python_version_file_is_3_12():
    assert _pyver_file().startswith("3.12")


def test_dockerfile_matches_python_version_file():
    df = (REPO / "app" / "Dockerfile").read_text()
    ver = _pyver_file().split(".")
    assert f"python:{ver[0]}.{ver[1]}" in df


def test_workflows_do_not_pin_3_11():
    for wf in (REPO / ".github" / "workflows").glob("*.yml"):
        text = wf.read_text()
        if "setup-python" not in text:
            continue
        assert "python-version: '3.11'" not in text, wf
        assert (
            "python-version-file: '.python-version'" in text
            or "python-version: '3.12'" in text
        )
