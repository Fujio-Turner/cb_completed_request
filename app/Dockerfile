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
ENV PYTHONUNBUFFERED=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8888/')" || exit 1

# Run Flask server
CMD ["python", "app.py"]
