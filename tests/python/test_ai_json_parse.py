"""Repair/parse of AI analysis JSON — especially malformed local-model output."""
import json

from ai_analyzer import (
    LOCAL_MODEL_JSON_RULES,
    get_ai_system_prompt,
    overview_text_to_html,
    parse_ai_json_content,
)


VALID_ANALYSIS = {
    "analysis_summary": {
        "overview_html": "<h3>Overall Health</h3><p>Cluster is healthy.</p>"
    },
    "critical_issues": [],
    "recommendations": [],
}


def test_valid_json_passes_through():
    parsed = parse_ai_json_content(json.dumps(VALID_ANALYSIS))
    assert parsed["analysis_summary"]["overview_html"] == VALID_ANALYSIS["analysis_summary"]["overview_html"]
    assert parsed["critical_issues"] == []


def test_dict_input_is_normalized_not_reencoded():
    parsed = parse_ai_json_content(dict(VALID_ANALYSIS))
    assert "<h3>Overall Health</h3>" in parsed["analysis_summary"]["overview_html"]


def test_markdown_fence_is_stripped():
    fenced = "```json\n" + json.dumps(VALID_ANALYSIS) + "\n```"
    parsed = parse_ai_json_content(fenced)
    assert parsed["analysis_summary"]["overview_html"].startswith("<h3>")


def test_think_tags_are_stripped():
    wrapped = (
        "<think>I will emit JSON like {\"analysis_summary\": {\"overview_html\": \"nope\"}}</think>\n"
        + json.dumps(VALID_ANALYSIS)
    )
    parsed = parse_ai_json_content(wrapped)
    assert "Cluster is healthy" in parsed["analysis_summary"]["overview_html"]
    assert "nope" not in parsed["analysis_summary"]["overview_html"]


def test_unescaped_newlines_in_overview_html():
    """The Qwen failure: raw newlines inside the overview_html string."""
    raw = """{
  "analysis_summary": {
    "overview_html": "
Overall Health

Critical performance crisis detected. All 99 queries (100%) fall in the 5-10 second duration range.

Key Bottlenecks

    Systemic ~9s latency floor: All query groups show identical ~9s durations.
    100% concurrent query conflicts: All 99 queries show resource contention.

Main Findings
"
  },
  "critical_issues": [],
  "recommendations": []
}"""
    # This is the Firefox error the UI used to surface.
    try:
        json.loads(raw)
        raise AssertionError("fixture must be invalid JSON")
    except json.JSONDecodeError as exc:
        assert "line" in str(exc).lower() or "Expecting" in str(exc) or "Invalid" in str(exc) or "Unterminated" in str(exc)

    parsed = parse_ai_json_content(raw)
    html = parsed["analysis_summary"]["overview_html"]
    assert "<h3>Overall Health</h3>" in html
    assert "<h3>Key Bottlenecks</h3>" in html
    assert "<h3>Main Findings</h3>" in html
    assert "systemic ~9s latency floor" in html.lower()
    assert parsed["critical_issues"] == []


def test_truncated_qwen_json_is_recovered():
    """Model stopped after overview prose and never closed the object."""
    raw = """{
  "analysis_summary": {
    "overview_html": "
Overall Health

Critical performance crisis detected. All 99 queries (100%) fall in the 5-10 second duration range.

Key Bottlenecks

    Systemic ~9s latency floor: Doc Fetch phase consumes 8,388-9,017ms.
    100% concurrent query conflicts: the cluster is saturated.

Main Findings
"""
    parsed = parse_ai_json_content(raw)
    html = parsed["analysis_summary"]["overview_html"]
    assert "<h3>Overall Health</h3>" in html
    assert "8,388-9,017ms" in html
    assert "<li>" in html


def test_html_attribute_double_quotes_are_repaired():
    raw = """{
  "analysis_summary": {
    "overview_html": "<h3>Overall Health</h3><p><span class="severity-critical">9s floor</span></p>"
  }
}"""
    try:
        json.loads(raw)
        raise AssertionError("fixture must be invalid JSON")
    except json.JSONDecodeError:
        pass
    parsed = parse_ai_json_content(raw)
    html = parsed["analysis_summary"]["overview_html"]
    assert "severity-critical" in html
    assert "9s floor" in html


def test_trailing_comma_is_stripped():
    raw = """{
  "analysis_summary": {"overview_html": "<p>ok</p>"},
  "critical_issues": [],
}"""
    parsed = parse_ai_json_content(raw)
    assert parsed["analysis_summary"]["overview_html"] == "<p>ok</p>"


def test_unquoted_keys_are_quoted():
    raw = '{analysis_summary: {overview_html: "<p>ok</p>"}, critical_issues: []}'
    parsed = parse_ai_json_content(raw)
    assert parsed["analysis_summary"]["overview_html"] == "<p>ok</p>"


def test_invalid_underscore_escape_is_fixed():
    raw = '{"analysis_summary": {"overview_html": "<p>idx\\_users</p>"}}'
    parsed = parse_ai_json_content(raw)
    assert "idx_users" in parsed["analysis_summary"]["overview_html"] or "idx\\_users" in parsed["analysis_summary"]["overview_html"]


def test_empty_and_none_return_none():
    assert parse_ai_json_content(None) is None
    assert parse_ai_json_content("") is None
    assert parse_ai_json_content("   ") is None


def test_non_json_prose_is_salvaged_as_overview():
    parsed = parse_ai_json_content("Overall Health\n\nThe cluster is saturated.")
    html = parsed["analysis_summary"]["overview_html"]
    assert "<h3>Overall Health</h3>" in html
    assert "saturated" in html


def test_overview_text_to_html_leaves_existing_html_alone():
    src = "<h3>Overall Health</h3><p>Already HTML.</p>"
    assert overview_text_to_html(src) == src


def test_overview_text_to_html_leaves_inline_span_html_alone():
    src = "<span class='severity-critical'>9s floor</span> across all groups."
    assert overview_text_to_html(src) == src


def test_system_prompt_requires_json_encoding():
    prompt = get_ai_system_prompt()
    assert "CRITICAL JSON ENCODING" in prompt
    assert "LOCAL MODEL STRICT JSON" in LOCAL_MODEL_JSON_RULES


def test_local_provider_appends_json_rules(monkeypatch):
    captured = {}

    def fake_execute(url, headers, payload, timeout=None, max_retries=None):
        captured["payload"] = payload
        return {
            "success": True,
            "data": {"choices": [{"message": {"content": "{}"}}]},
            "elapsed_ms": 1,
        }

    import ai_analyzer
    monkeypatch.setattr(ai_analyzer, "_execute_ai_request", fake_execute)
    ai_analyzer.call_ai_provider(
        provider="local-openai",
        model="qwen3.8:27b-mlx",
        api_key="",
        api_url="http://localhost:11434/v1",
        endpoint="chat/completions",
        prompt="Analyze query performance",
        payload_data={"data": {}},
    )
    system = captured["payload"]["messages"][0]["content"]
    assert "LOCAL MODEL STRICT JSON" in system
    assert "response_format" not in captured["payload"]
    assert captured["payload"]["model"] == "qwen3.8:27b-mlx"
