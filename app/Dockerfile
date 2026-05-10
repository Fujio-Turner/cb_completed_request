# syntax=docker/dockerfile:1.7
# Couchbase Query Analyzer - Server Edition v5.0.0 (CBL)
#
# Build:  docker build -t couchbase-query-analyzer:5.0.0 .
# Run:    docker run -p 8080:8080 couchbase-query-analyzer:5.0.0
# Compose: docker compose up --build
#
# Build CONTEXT must be the /app directory (where this Dockerfile lives).
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    CBL_VERSION=3.2.1 \
    CBL_DB_DIR=/app/data \
    CBL_DB_NAME=cb_tools_db \
    PORT=8080
# Note: STORAGE_BACKEND is no longer needed — Couchbase Lite is the only
# supported storage backend. The Couchbase Server SDK has been removed.
# Note: SKIP_TOON_INSTALL is intentionally NOT set. `python-toon` is now
# pulled in via requirements.txt and surfaced as `toon_python` by the
# /app/toon_python.py shim, so `import toon_python` succeeds at startup
# and TOON_AVAILABLE=True — no runtime pip install or JSON fallback needed.

WORKDIR /app

# Required by RELEASE_WORK_CHECK.py — verifies LABEL version=
LABEL version="5.0.0"
LABEL maintainer="Couchbase Query Analyzer"

# ---- 1. System dependencies for CBL-C and the CFFI build ----
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        wget gcc libffi-dev git ca-certificates zlib1g-dev && \
    rm -rf /var/lib/apt/lists/*

# ---- 2. Download libcblite for the right architecture ----
# Note: package filename uses `x86_64` / `arm64`, but the lib directory
# inside the tarball uses the GNU triplet (x86_64-linux-gnu / aarch64-linux-gnu).
RUN ARCH="$(dpkg --print-architecture)" && \
    if [ "$ARCH" = "amd64" ]; then \
        CBL_PKG_ARCH="x86_64"; CBL_LIBDIR="x86_64-linux-gnu"; \
    else \
        CBL_PKG_ARCH="arm64";  CBL_LIBDIR="aarch64-linux-gnu"; \
    fi && \
    wget -q "https://packages.couchbase.com/releases/couchbase-lite-c/${CBL_VERSION}/couchbase-lite-c-community-${CBL_VERSION}-linux-${CBL_PKG_ARCH}.tar.gz" \
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
# Build context is /app/, so COPY copies its contents into /app inside container.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN mkdir -p /app/data

# ---- 5. Healthcheck ----
# Uses python (always available) instead of curl, and honors $PORT.
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import os,urllib.request,sys; sys.exit(0 if urllib.request.urlopen(f'http://localhost:{os.environ.get(\"PORT\",\"8080\")}/api/storage/info').status==200 else 1)" || exit 1

EXPOSE 8080
# Use sh -c so $PORT expands at container start. Override with -e PORT=xxxx
# or via docker-compose.yml `environment.PORT`.
CMD ["sh", "-c", "exec gunicorn -w 1 -b 0.0.0.0:${PORT:-8080} app:app"]
