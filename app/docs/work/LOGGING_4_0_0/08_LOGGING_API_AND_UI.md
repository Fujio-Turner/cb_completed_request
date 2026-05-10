# 08 · `/api/logging/info` endpoint + Settings → Logging UI

**Depends on:** [`01_LOGGING_CONFIG_MODULE.md`](./01_LOGGING_CONFIG_MODULE.md), [`03_APP_PY_MIGRATION.md`](./03_APP_PY_MIGRATION.md).
**Blocks:** nothing.
**Status:** ✅ DONE — endpoints registered, OpenAPI updated, 14/14 pytest cases pass. Settings-panel UI + Playwright spec still pending.
**Spec compliance:** [`app/guides/API_OPENAPI.md`](../../../guides/API_OPENAPI.md) is the canonical guide for any new `/api/*` route.

---

## 1. Goal

Once the rotating file handler is producing logs, users need a way to:

1. **See where the active log file lives** (different per distribution
   — see [`LOGGING.md §9.1`](../../../guides/LOGGING.md)).
2. **See how big it is** and how many rotated files have piled up.
3. **Download the active log** for a bug report without `cd`-ing
   around the filesystem.

All three through the existing **Settings** modal in
[`app/index.html`](../../../index.html), backed by one new endpoint
and one optional download endpoint.

## 2. New endpoints

### `GET /api/logging/info`

Returns a JSON description of the live logging configuration. **No** auth
needed (single-user app). **No** secrets in the response — only paths,
sizes, and counts.

```json
{
  "level": "INFO",
  "json_mode": false,
  "active_file": {
    "path": "/Users/jane/Library/Logs/CouchbaseQueryAnalyzer/cbqa.log",
    "size_bytes": 4823910,
    "size_human": "4.6 MB"
  },
  "rotated_files": [
    {
      "path": "/Users/jane/Library/Logs/.../cbqa.log.20260508-141522.log",
      "size_bytes": 52428800,
      "size_human": "50.0 MB",
      "mtime": "2026-05-08T14:15:22Z"
    }
  ],
  "rotated_total_bytes": 52428800,
  "caps": {
    "max_size_mb": 50,
    "max_age_days": 7,
    "rotated_total_mb": 500
  }
}
```

### `GET /api/logging/active-log`

Streams the active file as `text/plain` with
`Content-Disposition: attachment; filename=cbqa.log`. No tailing, no
filtering — that's a future endpoint.

```python
# app/app.py (or wherever the logging blueprint lands)
@app.route("/api/logging/info", methods=["GET"])
def api_logging_info():
    from app.logging_config import _default_log_file
    import os, datetime
    path = os.environ.get("CBQA_LOG_FILE", _default_log_file())
    if not path or path.lower() in ("off", "none", "0"):
        return jsonify({
            "level": logging.getLevelName(logging.getLogger().level),
            "json_mode": os.environ.get("CBQA_LOG_JSON") == "1",
            "active_file": None,
            "rotated_files": [],
            "rotated_total_bytes": 0,
            "caps": _caps_from_env(),
        })

    base = pathlib.Path(path)
    rotated = sorted(base.parent.glob(f"{base.name}.*.log"),
                     key=lambda p: p.stat().st_mtime, reverse=True)
    rotated_info = [
        {
            "path": str(p),
            "size_bytes": p.stat().st_size,
            "size_human": _human(p.stat().st_size),
            "mtime": datetime.datetime.fromtimestamp(p.stat().st_mtime, datetime.UTC).isoformat(),
        }
        for p in rotated
    ]
    active = base.stat() if base.exists() else None
    return jsonify({
        "level": logging.getLevelName(logging.getLogger().level),
        "json_mode": os.environ.get("CBQA_LOG_JSON") == "1",
        "active_file": None if active is None else {
            "path": str(base),
            "size_bytes": active.st_size,
            "size_human": _human(active.st_size),
        },
        "rotated_files": rotated_info,
        "rotated_total_bytes": sum(r["size_bytes"] for r in rotated_info),
        "caps": _caps_from_env(),
    })


@app.route("/api/logging/active-log", methods=["GET"])
def api_logging_active_log():
    from app.logging_config import _default_log_file
    path = os.environ.get("CBQA_LOG_FILE", _default_log_file())
    if not path or not pathlib.Path(path).exists():
        return jsonify({"success": False, "error": "logging is disabled or no active file"}), 404
    return send_file(path, mimetype="text/plain", as_attachment=True,
                     download_name="cbqa.log")
```

`_human()` and `_caps_from_env()` are tiny private helpers. Both belong
in `app/app.py` next to the routes; they are not reused elsewhere.

## 3. Error envelope

Per [`API_OPENAPI.md`](../../../guides/API_OPENAPI.md) the project-wide
error shape is `{ "success": false, "error": "<message>" }` — used
above for the 404 from `active-log`. `info` always succeeds (returns
`active_file: null` when logging-to-file is disabled rather than an
error — it's a state, not a failure).

## 4. OpenAPI updates (mandatory before merge)

Per [`API_OPENAPI.md`](../../../guides/API_OPENAPI.md), append to
[`app/docs/openapi.yaml`](../../../docs/openapi.yaml):

```yaml
paths:
  /api/logging/info:
    get:
      tags: [Logging]
      summary: Read the active log configuration and rotated-file inventory.
      responses:
        '200':
          description: Logging state.
          content:
            application/json:
              schema: { $ref: '#/components/schemas/LoggingInfo' }

  /api/logging/active-log:
    get:
      tags: [Logging]
      summary: Download the active log file.
      responses:
        '200':
          description: text/plain file download.
          content:
            text/plain: { schema: { type: string, format: binary } }
        '404':
          description: Logging is disabled or no active file exists.
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Error' }

components:
  schemas:
    LoggingInfo:
      type: object
      required: [level, json_mode, active_file, rotated_files, rotated_total_bytes, caps]
      properties:
        level: { type: string, enum: [DEBUG, INFO, WARNING, ERROR, CRITICAL] }
        json_mode: { type: boolean }
        active_file:
          oneOf:
            - { type: 'null' }
            - $ref: '#/components/schemas/LoggingFileEntry'
        rotated_files:
          type: array
          items: { $ref: '#/components/schemas/LoggingFileEntry' }
        rotated_total_bytes: { type: integer }
        caps:
          type: object
          required: [max_size_mb, max_age_days, rotated_total_mb]
          properties:
            max_size_mb: { type: integer }
            max_age_days: { type: integer }
            rotated_total_mb: { type: integer }
    LoggingFileEntry:
      type: object
      required: [path, size_bytes, size_human]
      properties:
        path: { type: string }
        size_bytes: { type: integer }
        size_human: { type: string }
        mtime: { type: string, format: date-time }
```

A new `Logging` tag is added to the tag list at the top of the spec.

Then mirror into [`app/docs/API.md`](../../../docs/API.md) per the
guide's update flow.

## 5. UI panel — Settings → Logging

In [`app/index.html`](../../../index.html), add a new section to the
Settings modal. Suggested HTML skeleton:

```html
<section class="settings-section" id="settings-logging">
  <h3>Logging</h3>
  <p class="muted">Server log file location, size, and rotated archive.</p>

  <dl class="settings-grid">
    <dt>Active level</dt>            <dd id="log-level">…</dd>
    <dt>JSON mode</dt>               <dd id="log-json-mode">…</dd>
    <dt>Active file</dt>             <dd id="log-active-path">…</dd>
    <dt>Active size</dt>             <dd id="log-active-size">…</dd>
    <dt>Rotated files</dt>           <dd id="log-rotated-count">…</dd>
    <dt>Rotated total</dt>           <dd id="log-rotated-total">…</dd>
    <dt>Caps</dt>                    <dd id="log-caps">…</dd>
  </dl>

  <div class="settings-actions">
    <button id="log-refresh">Refresh</button>
    <a id="log-download" href="/api/logging/active-log" download>
      Download active log
    </a>
  </div>
</section>
```

JS handler in [`app/assets/js/settings.js`](../../../assets/js/settings.js):

```javascript
import { Logger } from './base.js';

async function refreshLoggingPanel() {
  try {
    const r = await fetch('/api/logging/info');
    const info = await r.json();
    document.getElementById('log-level').textContent = info.level;
    document.getElementById('log-json-mode').textContent = info.json_mode ? 'on' : 'off';

    const active = info.active_file;
    document.getElementById('log-active-path').textContent = active ? active.path : 'disabled';
    document.getElementById('log-active-size').textContent = active ? active.size_human : '—';

    document.getElementById('log-rotated-count').textContent = String(info.rotated_files.length);
    document.getElementById('log-rotated-total').textContent =
      humanBytes(info.rotated_total_bytes);
    document.getElementById('log-caps').textContent =
      `${info.caps.max_size_mb} MB / ${info.caps.max_age_days} d / ${info.caps.rotated_total_mb} MB`;

    document.getElementById('log-download').style.display = active ? '' : 'none';
  } catch (err) {
    Logger.error('[settings] failed to load logging info', err);
  }
}
document.getElementById('log-refresh').addEventListener('click', refreshLoggingPanel);
```

No new CSS file needed — reuse the existing settings-grid styles.

## 6. Tests

### Python (`tests/python/test_logging_api.py`)

```python
def test_info_returns_active_file(client, tmp_log_file_env):
    r = client.get("/api/logging/info")
    assert r.status_code == 200
    body = r.get_json()
    assert body["level"] in {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
    assert body["active_file"] is not None
    assert body["active_file"]["path"].endswith("cbqa.log")
    assert isinstance(body["rotated_files"], list)


def test_info_when_disabled(client, monkeypatch):
    monkeypatch.setenv("CBQA_LOG_FILE", "off")
    # Re-configure for this test only
    from app.logging_config import configure_logging
    configure_logging()
    r = client.get("/api/logging/info")
    assert r.get_json()["active_file"] is None


def test_download_returns_file(client, tmp_log_file_env):
    r = client.get("/api/logging/active-log")
    assert r.status_code == 200
    assert r.headers["Content-Disposition"].startswith("attachment")


def test_download_404_when_disabled(client, monkeypatch):
    monkeypatch.setenv("CBQA_LOG_FILE", "off")
    from app.logging_config import configure_logging
    configure_logging()
    r = client.get("/api/logging/active-log")
    assert r.status_code == 404
```

### Playwright (`playwright/e2e/server/logging-panel.spec.js`)

```javascript
test('Settings → Logging shows active file path and size', async ({ page }) => {
  await page.goto('http://localhost:5555/');
  await page.click('[data-testid="open-settings"]');
  await page.click('a[href="#settings-logging"]');
  await expect(page.locator('#log-active-path')).not.toHaveText('disabled');
  await expect(page.locator('#log-active-size')).toContainText(/[KMG]?B$/);
  await expect(page.locator('#log-download')).toHaveAttribute('href', '/api/logging/active-log');
});
```

## 7. Acceptance checklist

- [x] `GET /api/logging/info` registered in `app/app.py` and returns
      the documented JSON shape.
- [x] `GET /api/logging/active-log` registered and streams the file.
- [x] Both endpoints documented in [`app/docs/openapi.yaml`](../../../docs/openapi.yaml)
      with the new `Logging` tag.
- [ ] [`app/docs/API.md`](../../../docs/API.md) regenerated / updated to
      mirror the spec. *(still TODO)*
- [ ] Settings → Logging panel renders and "Download active log"
      delivers the file. *(HTML/JS still TODO)*
- [x] All pytest cases pass — 14/14 in
      [`tests/python/test_logging_api.py`](../../../../tests/python/test_logging_api.py).
- [ ] Playwright spec passes. *(spec exists at
      `playwright/e2e/server/logging-panel.spec.js`; needs running
      server to verify.)*
- [x] [`AGENT.md`](../../../../AGENT.md) Flask Endpoints table updated
      with the two new rows.

---

## 8. Post-implementation review (2026-05-10)

### 8.1 `_human_bytes` formatting bug

The first implementation was

```python
return f"{size_bytes:.1f} {unit}".rstrip('0').rstrip('.')
```

`rstrip('0')` is applied to the *entire string* — but the unit
("B" / "KB" / "MB" / …) is at the end, so the trailing zeros from the
number are never trimmed. `_human_bytes(500)` returned `'500.0 B'`
instead of the intended `'500 B'`. Fixed by trimming the number first,
then concatenating the unit.

### 8.2 Test wiring (`Working outside of application context`)

The original `test_logging_api.py` tests called `logging_info()` /
`logging_active_log()` directly. Both call `flask.jsonify(...)` which
needs an active Flask application context. The tests raised
`RuntimeError: Working outside of application context.` for 7/14
cases. Fixed by adding an autouse fixture at the top of the file:

```python
@pytest.fixture(autouse=True)
def _flask_app_context():
    from app_base import app as _flask_app
    with _flask_app.app_context():
        yield
```

### 8.3 Test imports

The first version used `from app.app import logging_info`. With no
`app/__init__.py` and `app.py` in `app/`, that style fails on
collection. Resolved by `sys.path`-injecting `app/` in
`tests/python/conftest.py` and using bare `from app import …` (Python
finds `app.py` on the path).
