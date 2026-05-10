# API Reference — Couchbase Query Analyzer (Server Edition)

> **Source of truth:** [`app/docs/openapi.yaml`](./openapi.yaml).
> This file is the human-friendly summary. When the two disagree, the YAML
> wins.
>
> **How to extend:** see [`app/guides/API_OPENAPI.md`](../guides/API_OPENAPI.md).

All endpoints live on the local Flask app (default `http://localhost:8888`).
There is **no external Couchbase Server** dependency — persistence is the
embedded CBL store, and source `system:completed_requests` data is provided
via JSON paste / upload.

> **🔍 Interactive explorer:** open
> **http://localhost:8888/api-docs/** while the server is running for the
> Swagger UI rendering of [`openapi.yaml`](./openapi.yaml). Every endpoint
> has a "Try it out" button that fires a real request against your running
> instance.

## Error shape

Every error response uses the same JSON envelope:

```json
{ "success": false, "error": "Document not found", "code": 404 }
```

The HTTP status code matches the `code` field. Older endpoints in
[`app_base.py`](../app_base.py) may omit `code`; new ones must include it.

---

## Static & Meta

### `GET /`

Serve the analyzer UI ([`app/index.html`](../index.html)).

### `GET /<path>`

Serve any static asset under `app/` (CSS, JS, images, fonts).

### `GET /openapi.yaml`

Download the raw OpenAPI 3.1 spec
([`app/docs/openapi.yaml`](./openapi.yaml)).

### `GET /api-docs/`

Vendored Swagger UI (no CDN) rendering [`openapi.yaml`](./openapi.yaml) as
an interactive explorer. Open in a browser; not intended for programmatic
use.

### `GET /api/version`

Return the running app version (matches `__version__` in
[`app/app.py`](../app.py)).

```json
{ "version": "4.0.0-Beta", "backend": "cbl" }
```

---

## Analyzer

### `POST /api/couchbase/save-analyzer`

Save an analyzer report to CBL.

**Request body**

| Field           | Type   | Required | Description                              |
|-----------------|--------|----------|------------------------------------------|
| `requestId`     | string | yes      | Unique ID for the report (typically UUID) |
| `name`          | string | no       | Display name (default `Untitled`)        |
| `analyzerData`  | object | yes      | Full analyzer report payload             |

**Response**

```json
{ "success": true }
```

### `POST /api/couchbase/load-analyzer/{request_id}`

Load a saved report by ID.

**Errors:** `404` if the report does not exist.

### `POST /api/couchbase/delete-analyzer`

Delete a saved report.

**Request body**

| Field       | Type   | Required |
|-------------|--------|----------|
| `requestId` | string | yes      |

---

## Preferences

### `POST /api/couchbase/save-preferences`

Save per-user UI preferences.

**Request body**

| Field         | Type   | Required | Description                                         |
|---------------|--------|----------|-----------------------------------------------------|
| `userId`      | string | yes      | User identifier (`"default"` for single-user installs) |
| `preferences` | object | yes      | Arbitrary preference blob                            |

### `POST /api/couchbase/load-preferences/{user_id}`

Load per-user preferences. Returns `{}` for new users (not `404`).

---

## AI

### `POST /api/ai/cache`

Cache the latest parsed analyzer data in memory for the current session so
subsequent AI calls can reference it by ID without re-uploading.

### `POST /api/ai/preview`

Build the exact prompt + payload that would be sent to the AI provider and
return it for inspection. **No external API call is made.**

### `POST /api/ai/analyze`

Kick off an AI analysis run in a background thread.
Returns **`202 Accepted`** with a `document_id`. Poll
`POST /api/ai/status/{document_id}` until done.

**Request body** (key fields — see [`openapi.yaml`](./openapi.yaml) for full
list)

| Field           | Type   | Required | Notes                                                      |
|-----------------|--------|----------|------------------------------------------------------------|
| `provider`      | string | yes      | One of `openai`, `anthropic`, `grok`, `custom`             |
| `model`         | string | yes      | Provider-specific model id                                 |
| `apiKey`        | string | yes\*    | Required unless server-side key is configured              |
| `apiUrl`        | string | no       | For `custom` provider                                      |
| `endpoint`      | string | no       | For `custom` provider                                      |
| `prompt`        | string | no       | Override the default prompt                                |
| `clusterName`   | string | no       | Tag the run for later filtering                            |
| `requestIdRef`  | string | no       | Reference to the analyzer report this run is about         |

**Response**

```json
{ "document_id": "20260508T1015Z-7c1f...", "status": "running" }
```

### `POST /api/ai/status/{document_id}`

Poll the status of a running AI analysis. Returns the full
[`AIHistoryEntry`](./openapi.yaml) document, including `status` (`pending` →
`running` → `completed` / `failed` / `cancelled`), token counts, and blob
references.

### `POST /api/ai/cancel`

Cancel a running AI analysis.

**Request body**

| Field         | Type   | Required |
|---------------|--------|----------|
| `document_id` | string | yes      |

### `POST /api/ai/history`

Paginated AI history.

**Request body**

| Field         | Type    | Required | Default |
|---------------|---------|----------|---------|
| `clusterName` | string  | no       | (all)   |
| `limit`       | integer | no       | 50      |
| `offset`      | integer | no       | 0       |

**Response**

```json
{ "items": [ { "document_id": "...", "status": "completed", ... } ],
  "total": 412, "limit": 50, "offset": 0 }
```

### `POST /api/ai/clusters`

List distinct cluster names that appear in AI history.

```json
{ "clusters": ["prod-east", "staging", "local"] }
```

### `GET /api/ai/stats`

Aggregate AI usage stats from the CBL `ai_history` collection.

### `GET /api/ai/payload-reference`

Read the current AI payload-reference document from CBL.

### `POST /api/ai/payload-reference/load`

Load the payload-reference document explicitly into the in-memory cache.

### `POST /api/ai/payload-reference/seed`

Seed the payload-reference document from
[`payload_reference.json.template`](../payload_reference.json.template).

### `POST /api/ai/payload-reference/save`

Persist the payload-reference document to CBL.

### `POST /api/ai/payload-reference/invalidate-cache`

Drop the in-memory cache for payload-reference (forces re-load on next read).

### `GET /api/ai/models`

Read the AI provider/model registry from CBL.

### `POST /api/ai/models/load`

Load the models list explicitly.

### `POST /api/ai/models/seed`

Seed the models list from
[`ai_models_list.json.template`](../ai_models_list.json.template).

### `POST /api/ai/models/save`

Persist the models list to CBL.

### `POST /api/ai/models/invalidate-cache`

Drop the in-memory cache for the models list.

### `POST /api/ai/test`

Test connectivity to an AI provider with a given API key.

**Request body**

| Field      | Type   | Required | Description                            |
|------------|--------|----------|----------------------------------------|
| `provider` | string | yes      | `openai`, `anthropic`, `grok`, `custom` |
| `model`    | string | no       | Specific model to test                  |
| `apiKey`   | string | yes      | Provider API key                        |
| `apiUrl`   | string | no       | For `custom` provider                   |

**Response**

```json
{ "success": true, "provider": "anthropic", "model": "claude-3-5-sonnet",
  "latency_ms": 412 }
```

### `POST /api/ai/debug`

Toggle verbose AI logging at runtime.

**Request body**

| Field     | Type | Required |
|-----------|------|----------|
| `enabled` | bool | no       |

### `POST /api/ai/call`

Generic one-shot proxy to an AI provider — no history write, no background
thread. Pass `provider`, `model`, `apiKey`, plus the provider-specific body.

---

## Storage (CBL admin)

### `GET /api/storage/info`

Embedded CBL database info.

```json
{
  "backend": "cbl",
  "db_path": "/var/data/cb_tools_db.cblite2",
  "db_size_bytes": 12345678,
  "collections": { "config": 1, "analyzer": 412, "preferences": 3,
                    "ai_history": 87, "ai_reference": 2, "blobs": 412 },
  "version": "Couchbase Lite 3.2.1 CE"
}
```

### `POST /api/storage/maintenance`

Run a CBL maintenance operation.

**Request body**

| Field | Type   | Required | Allowed values                                         |
|-------|--------|----------|--------------------------------------------------------|
| `op`  | string | yes      | `compact`, `reindex`, `optimize`, `integrity`, `gc_blobs` |

### `GET /api/storage/export`

Stream a `tar.gz` backup of the embedded CBL database. Response is
`application/gzip`.

### `POST /api/storage/import`

Replace the CBL database from an uploaded `tar.gz` backup. Must be
`multipart/form-data` with a single `file` field.

> **Warning:** this stops accepting writes, replaces the on-disk
> `*.cblite2/` directory, and reopens the DB. There is no undo. Take a
> snapshot first via `GET /api/storage/export`.

---

## Removed endpoints (do not re-add)

The following endpoints were removed when the Couchbase Server SDK was
dropped (see
[`app/docs/work/00_OVERVIEW.md §8`](./work/00_OVERVIEW.md#8-cbl-only-cutover-2026-05-09--current-state)):

| Endpoint | Why removed |
|---|---|
| `POST /api/couchbase/test` | Required a live cluster connection |
| `POST /api/couchbase/check-indexes` | Required a live cluster connection |
| `POST /api/couchbase/query` | Live N1QL is gone; data arrives via JSON upload |

If a future feature genuinely needs to talk to a remote Couchbase Server,
discuss the design first — the project is intentionally CBL-only and
JSON-upload-only.
