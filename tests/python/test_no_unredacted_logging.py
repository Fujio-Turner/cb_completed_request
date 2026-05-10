"""
Source-tree scanner gate. Walks the codebase and fails if any logging line
touches a credential without going through the documented helpers.

This is the *primary* defence against regression — unit tests can be
forgotten, this scanner cannot. If this test fails, the migration is incomplete.

Spec: app/docs/work/LOGGING_4_0_0/09_TESTING.md § 4
"""
import pathlib
import re


# Patterns that suggest a credential is about to be logged in Python.
PYTHON_PATTERNS = [
    re.compile(r"(ic|logger\.\w+|print)\([^)]*\bheaders\b"),
    re.compile(r"(ic|logger\.\w+|print)\([^)]*\bapi_key\b"),
    re.compile(r"(ic|logger\.\w+|print)\([^)]*\bapiKey\b"),
    re.compile(r"(ic|logger\.\w+|print)\([^)]*\bAuthorization\b"),
]

# Patterns that suggest a credential is about to be logged in JavaScript.
JS_PATTERNS = [
    re.compile(r"(console|Logger)\.\w+\([^)]*\bheaders\b"),
    re.compile(r"(console|Logger)\.\w+\([^)]*\bapiKey\b"),
    re.compile(r"(console|Logger)\.\w+\([^)]*\bAuthorization\b"),
    re.compile(r"\bconsole\.(log|warn|error)\("),  # any plain console.*
]

# Lines explicitly allowed (file:line format). Each must justify itself
# in a comment within four lines of context.
ALLOWED_PY = {
    "app/app_base.py:718",   # logger.debug("  Has API Key: %s", bool(api_key)) — bool only
}

# Entire files allowed (usually because they implement the logging system itself).
# main-legacy.js was migrated to Logger.* by LOGGING_4_0_0 — it is no longer
# allow-listed. main-legacy-cleaned.js is a dead, unreferenced intermediate
# cleanup variant kept around for diff inspection.
ALLOWED_JS_FILES = {
    "app/assets/js/base.js",  # Logger implementation uses console.* internally
    "app/assets/js/main-legacy-cleaned.js",  # Dead intermediate; not shipped
    "app/assets/js/chart.umd.js",  # Third-party Chart.js library
}

REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]


def _scan(root: pathlib.Path, glob: str, patterns, allowed_lines, allowed_files):
    """
    Scan files for credential logging patterns.
    
    Args:
        root: Root directory to scan
        glob: Glob pattern (e.g., "*.py" or "**/*.js")
        patterns: List of compiled regex patterns to match
        allowed_lines: Set of "file:line" entries that are OK
        allowed_files: Set of file paths that are entirely OK
        
    Returns:
        List of failures (file:line + matched text)
    """
    fails = []
    for path in root.glob(glob):
        rel = str(path.relative_to(REPO_ROOT))
        
        # Skip third-party and build artifacts
        if rel in allowed_files:
            continue
        if rel.startswith("app/assets/css") or rel.startswith("app/assets/img"):
            continue
        if "node_modules" in rel or "min.js" in rel:
            continue
        
        try:
            content = path.read_text()
        except (UnicodeDecodeError, OSError):
            # Skip binary or unreadable files
            continue
        
        for i, line in enumerate(content.splitlines(), 1):
            tag = f"{rel}:{i}"
            if tag in allowed_lines:
                continue
            
            for pat in patterns:
                if pat.search(line):
                    # Check for exceptions: safe wrappers or dev probes
                    if "mask_api_key" in line or "_safe_headers" in line or "safeHeaders" in line:
                        continue
                    if "# dev probe" in line or "// dev probe" in line:
                        continue
                    # ESLint's no-console suppression is also an
                    # explicit, reviewable opt-out — typically used
                    # inside logger implementations themselves.
                    if "eslint-disable" in line and "no-console" in line:
                        continue
                    
                    fails.append(f"{tag}  {line.strip()}")
    
    return fails


def test_no_unredacted_python_logging():
    """
    Scan app/*.py for unredacted logging of credentials.
    
    Fails if any logger, print, or ic call references:
    - headers
    - api_key
    - apiKey
    - Authorization
    
    Unless wrapped in mask_api_key(), _safe_headers(), or safeHeaders().
    """
    fails = _scan(REPO_ROOT / "app", "*.py", PYTHON_PATTERNS, ALLOWED_PY, set())
    assert not fails, "Unredacted Python logging:\n" + "\n".join(fails)


def test_no_unredacted_js_logging():
    """
    Scan app/assets/js/**/*.js for unredacted logging of credentials.
    
    Fails if any console or Logger call:
    - references headers, apiKey, or Authorization
    - is a plain console.log/warn/error (not routed through Logger)
    
    Unless in an allowed file (like base.js where Logger is implemented).
    """
    fails = _scan(
        REPO_ROOT / "app" / "assets" / "js",
        "**/*.js",
        JS_PATTERNS,
        set(),
        ALLOWED_JS_FILES
    )
    assert not fails, "Unredacted JS logging:\n" + "\n".join(fails)
