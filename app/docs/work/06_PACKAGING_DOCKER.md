# 06 — Packaging: Docker

**Status:** ✅ COMPLETE

The Docker image is the **easiest** of the three distributions because:

- We control the OS (Debian slim).
- `libcblite` ships as a `.tar.gz` per arch (`x86_64` / `arm64`).
- Python CFFI bindings can be built at image-build time.

This doc is a near-direct port of [PouchPipes' `Dockerfile`](https://github.com/Fujio-Turner/PouchPipes/blob/main/docs/CBL_STORE.md#step-1-dockerfile--add-cbl-c--python-bindings).

> **Working directory:** [`app/Dockerfile`](../../Dockerfile) and the new
> [`app/docker-compose.yml`](../../docker-compose.yml) both live inside `/app/`
> (the Server Edition root). All `docker build` / `docker compose` commands in
> this doc are run **from inside `/app/`** — there are no Docker artefacts
> outside `/app/`.

---

## 1. `Dockerfile` (lives at [`app/Dockerfile`](../../Dockerfile))

```dockerfile
# syntax=docker/dockerfile:1.7
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    CBL_VERSION=3.2.1 \
    CBL_DB_DIR=/app/data \
    CBL_DB_NAME=cb_tools_db \
    STORAGE_BACKEND=cbl

WORKDIR /app

# Required by RELEASE_WORK_CHECK.py — verifies LABEL version=
LABEL version="4.0.0-beta"
LABEL maintainer="Couchbase Query Analyzer"

# ---- 1. System dependencies for CBL-C and the CFFI build ----
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        wget gcc libffi-dev git ca-certificates zlib1g-dev && \
    rm -rf /var/lib/apt/lists/*

# ---- 2. Download libcblite for the right architecture ----
RUN ARCH="$(dpkg --print-architecture)" && \
    if [ "$ARCH" = "amd64" ]; then \
        CBL_TUPLE="x86_64";  CBL_LIBDIR="x86_64-linux-gnu"; \
    else \
        CBL_TUPLE="aarch64"; CBL_LIBDIR="aarch64-linux-gnu"; \
    fi && \
    wget -q "https://packages.couchbase.com/releases/couchbase-lite-c/${CBL_VERSION}/couchbase-lite-c-community-${CBL_VERSION}-linux-${CBL_TUPLE}.tar.gz" \
        -O /tmp/cblite.tar.gz && \
    mkdir -p /opt/cblite && \
    tar xzf /tmp/cblite.tar.gz -C /opt/cblite --strip-components=1 && \
    cp /opt/cblite/lib/${CBL_LIBDIR}/libcblite.so* /usr/local/lib/ && \
    cp -r /opt/cblite/include/* /usr/local/include/ && \
    ldconfig && \
    rm -rf /tmp/cblite.tar.gz /opt/cblite

# ---- 3. Build the Python CFFI bindings ----
RUN pip install --no-cache-dir cffi setuptools && \
    git clone --depth 1 https://github.com/couchbaselabs/couchbase-lite-python.git /opt/cbl-python && \
    cd /opt/cbl-python/CouchbaseLite && \
    python3 ../build.py \
        --include /usr/local/include \
        --library /usr/local/lib/libcblite.so

ENV PYTHONPATH="/opt/cbl-python:${PYTHONPATH}"

# ---- 4. App ----
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN mkdir -p /app/data

EXPOSE 8888
CMD ["gunicorn", "-w", "1", "-b", "0.0.0.0:8888", "app:app"]
```

Notes:

- `gunicorn -w 1` is **required** — CBL is a single-writer; multiple workers would corrupt the database.
- The image is now ~280 MB (vs ~140 MB for v4.0.0). The bulk is `libcblite.so` (~50 MB) and the bindings build artefacts.
- We can shrink this later via a multi-stage build that drops `gcc` / `git` from the final image.

---

## 2. `docker-compose.yml` (new file at [`app/docker-compose.yml`](../../docker-compose.yml))

Run with `cd app && docker compose up`:

```yaml
services:
  query-analyzer:
    build: .
    image: couchbase-query-analyzer:4.0.0-beta
    ports:
      - "8888:8888"
    environment:
      STORAGE_BACKEND: cbl
      CBL_DB_DIR: /app/data
      CBL_DB_NAME: cb_tools_db
    volumes:
      - cbl-data:/app/data           # CBL database persists here
    restart: unless-stopped

volumes:
  cbl-data:
```

The volume holds `cb_tools_db.cblite2/` so app data survives container rebuilds.

---

## 3. Multi-arch build (CI)

Run from inside `/app/` (the build context is the `/app/` directory):

```sh
cd app
docker buildx build \
    --platform linux/amd64,linux/arm64 \
    -t ghcr.io/fujio-turner/couchbase-query-analyzer:4.0.0-beta \
    --push .
```

A single-arch local build is just:

```sh
cd app
docker build -t couchbase-query-analyzer:4.0.0-beta .
```

GitHub Actions matrix:

```yaml
- platforms: linux/amd64,linux/arm64
- runs-on: ubuntu-latest
```

The `dpkg --print-architecture` branch in the Dockerfile already handles both at build time.

---

## 4. Healthcheck

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -fsS http://localhost:8888/api/storage/info || exit 1
```

`/api/storage/info` (new endpoint from Doc 03 #31) confirms the DB is open and queryable.

---

## 5. Verifying inside the container

```sh
docker run --rm couchbase-query-analyzer:4.0.0-beta \
    python -c "from cbl_store import CBLStore; s=CBLStore(); print(s.stats())"
```

Expected:

```
{'collections': {'config': 0, 'analyzer': 0, ...}, 'db_size_bytes': 32768}
```

---

## 6. Migration from a v4.0.0 deployment

Existing deployments mounted no volume for app data (it lived in the external CB Server). Upgrading is a one-shot script:

```sh
docker run --rm \
    -v $PWD/cbl-data:/app/data \
    -e LEGACY_CB_URL=couchbase://prod \
    -e LEGACY_CB_USER=Administrator \
    -e LEGACY_CB_PASS=... \
    couchbase-query-analyzer:4.0.0-beta \
    python -m migrate_to_cbl
```

See [`09_DATA_MIGRATION.md`](./09_DATA_MIGRATION.md) for what that does.
