"""Local OpenAI-compatible (Ollama) URL rewrite and provider flags."""
from ai_analyzer import (
    dummy_key_for_local,
    is_local_openai_compat,
    openai_compat_base_url,
    rewrite_ai_url_for_runtime,
    running_in_docker,
)


def test_local_openai_ids():
    assert is_local_openai_compat("local-openai")
    assert is_local_openai_compat("OLLAMA")
    assert is_local_openai_compat("lmstudio")
    assert not is_local_openai_compat("openai")
    assert not is_local_openai_compat("claude")


def test_dummy_key_defaults_to_ollama():
    assert dummy_key_for_local("") == "ollama"
    assert dummy_key_for_local(None) == "ollama"
    assert dummy_key_for_local("sk-test") == "sk-test"


def test_rewrite_noop_outside_docker(monkeypatch):
    monkeypatch.delenv("CBQA_IN_DOCKER", raising=False)
    monkeypatch.setattr("ai_analyzer.os.path.exists", lambda p: False)
    url = "http://localhost:11434/v1"
    assert rewrite_ai_url_for_runtime(url) == url


def test_rewrite_localhost_inside_docker(monkeypatch):
    monkeypatch.setenv("CBQA_IN_DOCKER", "1")
    assert (
        rewrite_ai_url_for_runtime("http://localhost:11434/v1")
        == "http://host.docker.internal:11434/v1"
    )
    assert (
        rewrite_ai_url_for_runtime("http://127.0.0.1:1234/v1/chat/completions")
        == "http://host.docker.internal:1234/v1/chat/completions"
    )


def test_http_client_accepts_connect_read_timeout_tuple():
    from ai_analyzer import AIHttpClient
    client = AIHttpClient(timeout=(30, 1800), max_retries=1)
    assert client.timeout == (30, 1800)
    assert client.max_retries == 1


def test_openai_compat_base_url_strips_chat_completions():
    assert openai_compat_base_url("http://localhost:11434/v1") == "http://localhost:11434/v1"
    assert (
        openai_compat_base_url("http://host.docker.internal:11434/v1/chat/completions")
        == "http://host.docker.internal:11434/v1"
    )
    assert (
        openai_compat_base_url("http://localhost:11434/v1/chat/completions/")
        == "http://localhost:11434/v1"
    )


def test_running_in_docker_env(monkeypatch):
    monkeypatch.setenv("CBQA_IN_DOCKER", "true")
    assert running_in_docker() is True
    monkeypatch.setenv("CBQA_IN_DOCKER", "0")
    monkeypatch.setattr("ai_analyzer.os.path.exists", lambda p: False)
    assert running_in_docker() is False
