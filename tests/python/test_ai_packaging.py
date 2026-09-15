"""OpenAI SDK must be a declared desktop dependency (issue #254)."""
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]


def test_openai_is_declared_for_desktop():
    req = (REPO / "app" / "requirements.txt").read_text()
    desktop = REPO / "app" / "requirements-desktop.txt"
    if desktop.exists():
        req += desktop.read_text()
    assert "openai" in req


def test_ai_analyzer_flags_sdk_availability_consistently():
    import ai_analyzer

    try:
        import openai  # noqa: F401

        installed = True
    except ImportError:
        installed = False
    assert ai_analyzer.OPENAI_SDK_AVAILABLE is installed
