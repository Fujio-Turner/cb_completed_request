# Use the official Nginx image from Docker Hub
FROM nginx:alpine

# Add version and metadata labels
LABEL version="3.27.0-post"
LABEL description="Couchbase Slow Query Analysis Tool"
LABEL maintainer="Fujio Turner"

# Copy static HTML files to the Nginx web root directory
COPY . /usr/share/nginx/html

# Create nginx configuration to handle the multi-language structure
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Default to English version \
    location = / { \
        try_files /en/index.html =404; \
    } \
    \
    # Handle language directories \
    location / { \
        try_files $uri $uri/ =404; \
    } \
    \
    # Security headers \
    add_header X-Frame-Options "SAMEORIGIN"; \
    add_header X-Content-Type-Options "nosniff"; \
    add_header X-XSS-Protection "1; mode=block"; \
}' > /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
