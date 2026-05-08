# Couchbase Query Analyzer - Server Edition v4.0.0
# Flask-based web server with Couchbase integration and AI analysis
#
# Build:   docker build -t couchbase-query-analyzer:4.0.0 -f app/Dockerfile .
# Run:     docker run -p 8888:8888 couchbase-query-analyzer:4.0.0
# Access:  http://localhost:8888

FROM python:3.11-slim

# Add version and metadata labels
LABEL version="4.0.0"
LABEL description="Couchbase Query Analyzer - Server Edition with AI Analysis"
LABEL maintainer="Fujio Turner"

# Set working directory
WORKDIR /app

# Install system dependencies required for Couchbase SDK
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libssl-dev \
    cmake \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY app/requirements.txt .

# Install Python dependencies
# Note: toon-python is intentionally NOT installed in the container.
# It lives in a private GitLab repo and is an optional payload-encoding
# optimization. app.py sets TOON_AVAILABLE=False and falls back to JSON.
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ .

# Create config directory for volume mounting
RUN mkdir -p /app/config

# Expose Flask port
EXPOSE 8888

# Set environment variables
ENV FLASK_APP=app.py
ENV FLASK_ENV=production
ENV FLASK_DEBUG=0
ENV PYTHONUNBUFFERED=1
# Skip the runtime "pip install toon-python" attempt (private GitLab pkg, not on PyPI).
# App falls back to JSON for AI payloads — no functional loss.
ENV SKIP_TOON_INSTALL=1
# Gunicorn tuning (override at runtime if needed)
ENV GUNICORN_WORKERS=2
ENV GUNICORN_THREADS=4
ENV GUNICORN_TIMEOUT=120

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8888/')" || exit 1

# Run with gunicorn (production WSGI server) instead of Flask's dev server.
# Uses sh -c so env vars expand at container start.
CMD ["sh", "-c", "exec gunicorn --bind 0.0.0.0:8888 --workers ${GUNICORN_WORKERS} --threads ${GUNICORN_THREADS} --timeout ${GUNICORN_TIMEOUT} --access-logfile - --error-logfile - app:app"]
