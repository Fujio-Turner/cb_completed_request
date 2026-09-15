"""Version strings must agree (issue #260)."""
import re
from pathlib import Path

from version import __version__

REPO = Path(__file__).resolve().parents[2]
APP = REPO / "app"


def test_app_dunder_matches_version_module():
    import app

    assert app.__version__ == __version__


def test_index_html_meta_matches():
    html = (APP / "index.html").read_text()
    m = re.search(r'<meta name="version" content="([^"]+)"', html)
    assert m, "missing version meta"
    assert m.group(1).lower() == __version__.lower() or __version__.lower() in m.group(1).lower()


def test_specs_do_not_say_5():
    for spec in ("build_mac.spec", "build_win.spec"):
        assert "5.0.0" not in (APP / spec).read_text()


def test_dockerfile_label_matches():
    df = (APP / "Dockerfile").read_text()
    assert __version__ in df
