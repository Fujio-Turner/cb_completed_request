# API & OpenAPI Guide — Couchbase Query Analyzer (Server Edition)

> Spec format: [OpenAPI 3.1.0](https://spec.openapis.org/oas/latest.html)
>
> Source of truth: [`app/docs/openapi.yaml`](../docs/openapi.yaml)
>
> Markdown reference: [`app/docs/API.md`](../docs/API.md)

---

## 1. What Is OpenAPI?

OpenAPI is a **YAML/JSON specification** that describes a REST API in a
machine-readable format. It is **not** an HTML page — it's a structured data
file that tools render into interactive documentation, client SDKs, and test
suites.

Our spec lives at [`app/docs/openapi.yaml`](../docs/openapi.yaml). The
human-friendly markdown summary lives at
[`app/docs/API.md`](../docs/API.md).

### What We Ship

| Artifact | Path | Purpose |
|---|---|---|
| OpenAPI spec | [`app/docs/openapi.yaml`](../docs/openapi.yaml) | Machine-readable, **source of truth** |
| Markdown reference | [`app/docs/API.md`](../docs/API.md) | Quick-reference for developers |
| Live spec endpoint | `GET /openapi.yaml` | Served verbatim by [`app/app_base.py`](../app_base.py) |
| Swagger UI | `GET /api-docs/` | Interactive explorer that renders the spec — see §11 |

> **Difference from Apollo:** Apollo uses FastAPI, which auto-generates
> OpenAPI from route signatures. We use **Flask**, so the spec is
> **hand-maintained**. There is no codegen step — when you add or change an
> endpoint you must update [`openapi.yaml`](../docs/openapi.yaml) and
> [`API.md`](../docs/API.md) by hand. That is what this guide is for.

---

## 2. Project Structure

```
app/
├── app.py                      # Flask entrypoint — registers CBL route overrides + new /api/storage/*
├── app_base.py                 # Base Flask app — AI endpoints + static index.html + /openapi.yaml
├── ai_analyzer.py              # AI provider integration
├── cbl_store.py                # CBL persistence layer
├── docs/
│   ├── openapi.yaml            # OpenAPI 3.1 spec — ALL endpoints (source of truth)
│   ├── API.md                  # Markdown quick reference
│   └── work/                   # Migration / refactor design docs
└── guides/
    ├── API_OPENAPI.md          # This file
    ├── HTML_APP.md
    ├── HTML_WEBSITE.md
    └── RELEASE.md
```

---

## 3. How Errors Work

Flask doesn't have FastAPI's auto-handler magic, but the project uses a
**consistent JSON error shape** that every endpoint must return.

### Error Response Shape

```json
{
  "success": false,
  "error": "Document not found",
  "code": 404
}
```

| Field | Type | Description |
|---|---|---|
| `success` | `bool` | Always `false` for errors. (Successful responses use `true` or omit it.) |
| `error` | `string` | Human-readable error message. |
| `code` | `int` (optional) | HTTP status code (matches the response status). Optional — added for new endpoints; older ones return only `success` + `error`. |

> **Legacy note:** many existing endpoints in [`app_base.py`](../app_base.py)
> return `{'success': False, 'error': '...'}` without the `code` field. New
> endpoints should include it. When you touch an existing endpoint, add
> `code` if you can do so without breaking the frontend caller.

### How to Raise Errors in Endpoint Code

There is no global exception handler — each endpoint handles its own
errors. The standard pattern is a `try/except` around the body:

```python
from flask import jsonify, request

@app.route('/api/couchbase/load-analyzer/<request_id>', methods=['POST'])
def load_analyzer(request_id):
    try:
        if not CBL_AVAILABLE:
            return jsonify({'success': False, 'error': 'CBL not available', 'code': 503}), 503
        store = _get_cbl_store()
        doc = store.load_analyzer(request_id)
        if not doc:
            return jsonify({'success': False, 'error': 'Not found', 'code': 404}), 404
        return jsonify({'success': True, 'data': doc})
    except Exception as e:
        ic(f"❌ load_analyzer failed: {e}")
        return jsonify({'success': False, 'error': str(e), 'code': 500}), 500
```

**Do not**:

- Return error dicts with HTTP `200`. Always include the matching status code.
- Leak stack traces in `error` strings shipped to production. Log the trace
  with `ic()` and return a short message.

### Standard HTTP status codes used in this project

| Code | When to use |
|---|---|
| `200` | Success. |
| `400` | Invalid input, missing required field, bad path parameter. |
| `404` | Document, blob, request_id, or user_id not found. |
| `500` | Unexpected server error (caught by the outer `try/except`). |
| `501` | Endpoint exists but is not implemented in this build. |
| `503` | CBL bindings not available, AI provider not configured. |

---

## 4. Tags

Every endpoint belongs to exactly one tag. Tags group endpoints in the
docs UI and in [`openapi.yaml`](../docs/openapi.yaml).

| Tag | Prefix | Description |
|---|---|---|
| **Static** | `/`, `/<path>` | Serve `app/index.html` and any other static asset |
| **Analyzer** | `/api/couchbase/*-analyzer*` | Save / load / delete analyzer reports (CBL-backed) |
| **Preferences** | `/api/couchbase/*-preferences*` | Per-user UI preferences (CBL-backed) |
| **AI** | `/api/ai/*` | AI analysis runs, history, payload reference, models, providers |
| **Storage** | `/api/storage/*` | CBL admin: info, maintenance, export, import |
| **Meta** | `/openapi.yaml`, `/api-docs`, `/api/version` | Spec download + Swagger UI + version info |

When adding a new endpoint, assign it to an existing tag. If none fit, add
a new tag entry to both the `tags:` list in
[`openapi.yaml`](../docs/openapi.yaml) and the table above.

> **Removed tag:** the `Cluster` tag (formerly: `/api/couchbase/test`,
> `/check-indexes`, `/query`) was deleted when the Couchbase Server SDK was
> dropped. See
> [`app/docs/work/00_OVERVIEW.md §8`](../docs/work/00_OVERVIEW.md#8-cbl-only-cutover-2026-05-09--current-state).
> Do not re-add it.

---

## 5. Adding a New Endpoint

### Step 1 — Write the Route

Decide where the route lives:

- **CBL-eligible endpoint** that shadows / replaces a former CB-Server route
  → add to [`app/app.py`](../app.py) and register via `_override_route()`
  or `app.add_url_rule()`.
- **AI / preview / admin endpoint** that doesn't touch persistence
  → add to [`app/app_base.py`](../app_base.py) directly with `@app.route`.

Follow the existing pattern:

```python
@app.route('/api/storage/snapshot', methods=['POST'])
def storage_snapshot():
    try:
        body = request.get_json() or {}
        name = body.get('name')
        if not name:
            return jsonify({'success': False, 'error': 'name is required', 'code': 400}), 400
        path = _get_cbl_store().snapshot(name)
        return jsonify({'success': True, 'path': path})
    except Exception as e:
        ic(f"❌ storage_snapshot failed: {e}")
        return jsonify({'success': False, 'error': str(e), 'code': 500}), 500
```

**Conventions:**

- All API routes start with `/api/`.
- Use plain `def` (not `async def`) — Flask 3 supports async but the project
  is sync everywhere; mixing causes confusion.
- Parse JSON bodies with `request.get_json() or {}` — never assume a body
  is present.
- Validate required fields up-front and return `400` if missing.
- Wrap the body in `try/except Exception` and log the trace with `ic()`.
- Return plain dicts via `jsonify(...)`.
- Follow the error shape in §3.

### Step 2 — Add to [`app/docs/openapi.yaml`](../docs/openapi.yaml)

Add a new path entry under `paths:`. Follow this template:

```yaml
  /api/storage/snapshot:
    post:
      operationId: storageSnapshot          # camelCase, unique across all endpoints
      tags: [Storage]                        # pick from §4
      summary: Snapshot the embedded CBL DB  # one line, shown in docs sidebar
      description: >                         # optional, longer explanation
        Take a named on-disk snapshot of the embedded Couchbase Lite
        database without stopping the server. Returns the snapshot path.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [name]
              properties:
                name:
                  type: string
                  description: Snapshot label (used in the filename).
                  example: pre-upgrade
      responses:
        "200":
          description: Snapshot created
          content:
            application/json:
              schema:
                type: object
                required: [success, path]
                properties:
                  success:
                    type: boolean
                  path:
                    type: string
                    example: /var/data/cb_tools_db.cblite2.pre-upgrade.tar.gz
        "400":
          $ref: "#/components/responses/BadRequest"
        "503":
          $ref: "#/components/responses/ServiceUnavailable"
        "500":
          $ref: "#/components/responses/InternalServerError"
```

**Rules:**

- Every endpoint needs an `operationId` — camelCase, globally unique.
- Always include at least one success response and the relevant error
  responses (typically `400`, `404`, `500`, sometimes `503`).
- For reusable schemas, add them under `components/schemas/` and `$ref`
  them.
- For error responses, always use the reusable `$ref` — don't inline error
  schemas.
- Path parameters declared in the URL (`/api/foo/<id>`) translate to
  `/api/foo/{id}` in OpenAPI and require a matching `parameters:` block.

### Step 3 — Add to [`app/docs/API.md`](../docs/API.md)

Add a section under the appropriate tag heading:

````markdown
### `POST /api/storage/snapshot`

Take a named on-disk snapshot of the embedded CBL database.

**Request Body**

| Field  | Type   | Required | Description                          |
|--------|--------|----------|--------------------------------------|
| `name` | string | yes      | Snapshot label (used in the filename) |

**Response**

```json
{ "success": true, "path": "/var/data/cb_tools_db.cblite2.pre-upgrade.tar.gz" }
```

**Errors:** `400` if `name` is missing, `503` if CBL bindings unavailable,
`500` on disk error.
````

### Step 4 — Verify

1. Start the server: `python app.py` (from inside `/app/`).
2. Open `http://localhost:8888/openapi.yaml` — confirm your endpoint shows
   up in the YAML.
3. (Optional) Open `http://localhost:8888/api-docs` once Swagger UI is wired
   up (see §11).
4. Test the endpoint with `curl` or the frontend.
5. Test error cases — confirm they return the standard `{success, error,
   code}` shape with the matching HTTP status code.

---

## 6. Updating an Existing Endpoint

### Changed Parameters or Response Shape

1. **Update the route code** in [`app_base.py`](../app_base.py) or
   [`app.py`](../app.py).
2. **Update [`openapi.yaml`](../docs/openapi.yaml)** — change the parameter
   list, schema properties, or add new response codes.
3. **Update [`API.md`](../docs/API.md)** — adjust the param table or
   response example.
4. **Update the frontend** — search [`app/assets/js/`](../assets/js/) for
   the URL and adjust any callers.

### Renamed Endpoint

1. **Update the route decorator** path.
2. **If overridden:** update the `_override_route(...)` rule in
   [`app.py`](../app.py).
3. **Update [`openapi.yaml`](../docs/openapi.yaml)** — move the path entry
   to the new key.
4. **Update [`API.md`](../docs/API.md)** — update the heading and any
   prose.
5. **Update the frontend** — search `app/assets/js/` for the old URL and
   replace it.
6. **Add a redirect** in [`app_base.py`](../app_base.py) for one release
   if any external consumer might still use the old URL.

### Added a New JSON Body Field

```python
# app_base.py — read the new field
body = request.get_json() or {}
name = body.get('name')
ttl = body.get('ttl_days', 30)          # ← new, with default
```

```yaml
# openapi.yaml — add to the request schema
properties:
  name: { type: string }
  ttl_days:                                # ← new
    type: integer
    default: 30
    description: Auto-purge after N days.
```

```markdown
<!-- API.md — add to the param table -->
| `ttl_days` | int | no | Auto-purge after N days (default 30) |
```

---

## 7. Deleting an Endpoint

1. **Remove the route** from [`app_base.py`](../app_base.py) (and any
   `_override_route` line in [`app.py`](../app.py)).
2. **Remove the path entry** from
   [`app/docs/openapi.yaml`](../docs/openapi.yaml).
3. **Remove the section** from [`app/docs/API.md`](../docs/API.md).
4. **Remove any schemas** in `openapi.yaml` `components/schemas/` that are
   no longer referenced by any path.
5. **Search the frontend** ([`app/assets/js/`](../assets/js/),
   [`app/index.html`](../index.html)) for calls to the deleted URL and
   remove them.
6. **Document the removal** in [`release_notes.md`](../../release_notes.md)
   under the next release. If consumers might still call the old URL, return
   `410 Gone` with a clear message for one release before deleting outright.

### Checking for Orphaned Schemas

After removing a path, grep the spec for any schema that's no longer
referenced:

```bash
# List all schema names
grep -E '^\s{4}\w+:$' app/docs/openapi.yaml | sed 's/://;s/^ *//'

# For each name, check if it's still $ref'd elsewhere
grep -c 'SomeSchemaName' app/docs/openapi.yaml
```

If a schema's only reference was the deleted path, remove it from
`components/schemas/`.

---

## 8. Adding a New Reusable Schema

When multiple endpoints share the same request or response shape, define it
once:

```yaml
components:
  schemas:
    AnalyzerReport:
      type: object
      required: [request_id, name, saved_at]
      properties:
        request_id:
          type: string
        name:
          type: string
        saved_at:
          type: integer
          description: Unix epoch seconds.
        size_bytes:
          type: integer
        preview:
          type: object
          additionalProperties: true
```

Then reference it from path definitions:

```yaml
schema:
  $ref: "#/components/schemas/AnalyzerReport"
```

**Naming conventions:**

- PascalCase for schema names (e.g. `AnalyzerReport`, `AIHistoryEntry`,
  `ErrorResponse`).
- Group related schemas together with YAML comment banners (`# ── AI ──`).

---

## 9. Standard Reusable Error Responses

The following are defined under `components/responses/` in
[`openapi.yaml`](../docs/openapi.yaml) and should be `$ref`'d from every
endpoint that can return them:

| Ref Name | Code | When to use |
|---|---|---|
| `BadRequest` | 400 | Missing/invalid input, bad JSON body |
| `NotFound` | 404 | Document, blob, or report ID not found |
| `UnsupportedOperation` | 501 | Endpoint exists but not implemented in this build |
| `ServiceUnavailable` | 503 | CBL bindings missing, AI provider not configured |
| `InternalServerError` | 500 | Unexpected server error |

Reference them in path definitions with `$ref`:

```yaml
"400":
  $ref: "#/components/responses/BadRequest"
"500":
  $ref: "#/components/responses/InternalServerError"
```

---

## 10. Long-Running Endpoints (`/api/ai/analyze`)

`POST /api/ai/analyze` kicks off an AI analysis in a background thread and
returns immediately with a `document_id`. The frontend polls
`POST /api/ai/status/<document_id>` until the status is `completed` or
`failed`.

Document this in [`openapi.yaml`](../docs/openapi.yaml) by:

- Returning `202 Accepted` with `{document_id, status: "running"}` from
  `analyze`.
- Linking the polling endpoint via `description:` prose — there is no
  formal "callback" relationship in OpenAPI 3.1 we use here.
- Documenting all possible `status` values in an `enum` on the response
  schema: `pending | running | completed | failed | cancelled`.

> **Note:** there is currently no SSE / WebSocket streaming endpoint in this
> project. If one is added, document it as `text/event-stream` per the
> Apollo guide.

---

## 11. Serving the Spec & Swagger UI

### Spec endpoint (always on)

[`app/app_base.py`](../app_base.py) serves
[`app/docs/openapi.yaml`](../docs/openapi.yaml) verbatim:

```python
@app.route('/openapi.yaml')
def openapi_spec():
    return send_from_directory(
        os.path.join(DIRECTORY, 'docs'),
        'openapi.yaml',
        mimetype='application/yaml',
    )
```

External clients and codegen tools should point at
`http://localhost:8888/openapi.yaml`.

### Swagger UI (default-on)

Swagger UI is mounted at **`/api-docs/`** using
[flask-swagger-ui](https://pypi.org/project/flask-swagger-ui/), which vendors
its own JS/CSS — **no runtime CDN dependency**, so it works inside Docker
and the PyInstaller bundles.

```python
# app_base.py
from flask_swagger_ui import get_swaggerui_blueprint

_SWAGGER_URL = '/api-docs'
app.register_blueprint(
    get_swaggerui_blueprint(
        _SWAGGER_URL,
        '/openapi.yaml',
        config={
            'app_name': 'Couchbase Query Analyzer API',
            'docExpansion': 'list',
            'defaultModelsExpandDepth': 1,
            'displayRequestDuration': True,
        },
    ),
    url_prefix=_SWAGGER_URL,
)
```

`flask-swagger-ui` is listed in
[`app/requirements.txt`](../requirements.txt). If the package fails to
import (older builds, slim base image), the route falls back to a `404` and
the rest of the app keeps working.

To use it: start the server (`python app.py` from `/app/`) and open
**http://localhost:8888/api-docs/** in a browser. Each endpoint has a
"Try it out" button that fires a real request against the running server.

---

## 12. Versioning

The spec carries the same version as the app:

```yaml
info:
  title: Couchbase Query Analyzer API
  version: 4.0.0-Beta              # ← bump in lockstep with app/app.py __version__
  description: ...
```

Bump `info.version` in [`openapi.yaml`](../docs/openapi.yaml) every time
you bump `__version__` in [`app.py`](../app.py). The
[`RELEASE.md`](./RELEASE.md) checklist already has a step for this — see
[§2 "Bump version strings"](./RELEASE.md#2-bump-version-strings).

---

## 13. Checklist

Use this checklist when touching any API endpoint:

- [ ] Route added/modified in [`app_base.py`](../app_base.py) or
      [`app.py`](../app.py)
- [ ] Errors return `{success: false, error: "...", code: <http>}` with the
      matching HTTP status code (not `200`)
- [ ] All exception paths log via `ic(...)` before returning
- [ ] Path entry added/updated in
      [`app/docs/openapi.yaml`](../docs/openapi.yaml)
- [ ] `operationId` is set and unique
- [ ] Correct tag assigned (see §4)
- [ ] All error responses use `$ref` to reusable responses (§9)
- [ ] `info.version` in `openapi.yaml` bumped if this is a release
- [ ] Section added/updated in [`app/docs/API.md`](../docs/API.md)
- [ ] Frontend caller in [`app/assets/js/`](../assets/js/) updated if the
      URL or shape changed
- [ ] Tested end-to-end with `curl` or the UI
- [ ] If breaking, an entry was added to
      [`release_notes.md`](../../release_notes.md) under a **Migration**
      heading
