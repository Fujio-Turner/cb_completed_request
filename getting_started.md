# Getting Started with Couchbase Query Analyzer

This guide will help you get the Couchbase Query Analyzer up and running and configured with AI-powered analysis.

> **Note on Versions**:
> *   **Classic Static HTML (v3.x)**: Browser-only, no installation required. Available online at https://cb.fuj.io/en/. No AI analysis or settings persistence.
> *   **New Desktop App (v4.0.0+)**: Local app with AI analysis and embedded **Couchbase Lite** storage for analysis history and preferences. Source data is provided by pasting or uploading the JSON output of `system:completed_requests`.

---

## 1. Get the Tool

Choose between the **New Desktop App** (with AI analysis) or the simple **Classic Static HTML** (browser-only).

### 🐳 Docker — *New Desktop App v4.0.0*

[Pull from Docker Hub](https://hub.docker.com/r/fujioturner/couchbase-query-analyzer/tags)

```bash
# New Desktop App (with AI analysis, embedded Couchbase Lite storage)
docker pull fujioturner/couchbase-query-analyzer:4.0.0
docker run -p 8888:8888 fujioturner/couchbase-query-analyzer:4.0.0

# Or use 'latest' tag (always points to New Desktop App)
docker run -p 8888:8888 fujioturner/couchbase-query-analyzer:latest
```

*After running, open http://localhost:8888*

### 🍎 macOS — *New Desktop App v4.0.0*

[Download for macOS](https://github.com/Fujio-Turner/cb_completed_request/releases)

1. Download `QueryAnalyzer-4.0.0-macos.dmg` from [GitHub Releases](https://github.com/Fujio-Turner/cb_completed_request/releases).
2. Open the DMG and drag **QueryAnalyzer.app** to Applications.
3. Double-click to run. *Security warning? Go to System Settings → Privacy & Security → Allow.*

*The app will open http://localhost:8888 automatically.*

### 🪟 Windows — *New Desktop App v4.0.0*

[Download for Windows](https://github.com/Fujio-Turner/cb_completed_request/releases)

1. Download `QueryAnalyzer-4.0.0-windows.zip` from [GitHub Releases](https://github.com/Fujio-Turner/cb_completed_request/releases).
2. Extract and double-click `QueryAnalyzer.exe` to run.
3. *"Windows protected your PC"? Click "More info" → "Run anyway".*

*The app will open http://localhost:8888 automatically.*

### 🌐 Browser Only — *Classic Static HTML v3.29.3*

No installation required — just open in your browser:

**[→ Open cb.fuj.io/en/](https://cb.fuj.io/en/)**

> **Note:** The Classic Static HTML does not include AI analysis or settings persistence. For those features, use the New Desktop App above.

---

## 2. Setup AI Analysis *(New Desktop App only)*

> **📦 No external database setup required.**
> Starting in **v4.0.0**, the New Desktop App stores all analysis data, preferences, and AI history locally using embedded **Couchbase Lite**. There is nothing to install, no bucket to create, and no credentials to configure for storage.
>
> *To analyze queries, run `SELECT *, meta().plan FROM system:completed_requests` against your cluster from any client (cbq, Capella UI, Workbench, etc.) and paste or upload the JSON output into the analyzer.*

Get an API Key from xAI Grok, Anthropic Claude, or OpenAI for AI-powered query analysis.

| Grok x.ai | Anthropic Claude | OpenAI |
|-----------|------------------|--------|
| [Sign Up](https://accounts.x.ai/sign-in?redirect=docs) → [Get API Key](https://console.x.ai/) | [Sign Up](https://console.anthropic.com/) → [Get API Key](https://console.anthropic.com/settings/keys) | [Sign Up](https://platform.openai.com/signup) → [Get API Key](https://platform.openai.com/api-keys) |

**To configure:** In the **Settings** icon, select the **"Users' AI API"** tab, paste your API key, and click **Save**.

---

## 🎉 Ready to Analyze!

You can now perform AI-powered analysis of your slow queries.

**[Start Analyzing → User Guide](user_guide.html)**
