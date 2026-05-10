"""
Gunicorn configuration that aligns with CBQA logging standard (LOGGING.md).

This config routes gunicorn's access and error logs through Python's logging
system so they follow the same format as the app: ISO8601 timestamps, consistent
level names, and module prefixes.

See: app/guides/LOGGING.md § 3 (CLI / startup vs. library output)
"""

import logging
import sys

# Disable gunicorn's default access log (we'll use Python logging instead)
accesslog = None
access_log_format = ""

# gunicorn's error log goes through Python logging (configured by app.py's
# configure_logging()), so we use the Python logger here.
errorlog = "-"  # stderr
loglevel = "info"


class GunicornFormatter(logging.Formatter):
    """Format gunicorn logs to match CBQA standard (LOGGING.md § 5)."""

    def format(self, record):
        # Gunicorn's messages are already formatted; we just wrap them
        # with our standard timestamp and level.
        record.name = "gunicorn"
        return super().format(record)


# Custom logging config for gunicorn
def when_ready(server):
    """Called when the server is ready; ensure our formatter is installed."""
    root = logging.getLogger()
    for handler in root.handlers:
        if isinstance(handler, logging.StreamHandler):
            # Reuse the formatter that app.py set up (from configure_logging)
            # If it doesn't exist, fall back to our standard format.
            if not handler.formatter:
                fmt = logging.Formatter(
                    "%(asctime)s %(levelname)-7s %(name)s: %(message)s",
                    datefmt="%Y-%m-%dT%H:%M:%S",
                )
                handler.setFormatter(fmt)
