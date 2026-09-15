"""HTTP listen port + resource-path helpers shared by app.py and app_base.py.

Kept in its own module so app_base can resolve PORT without importing app.py
(which would be a circular import).
"""
from __future__ import annotations

import json
import logging
import os
import sys

logger = logging.getLogger(__name__)

DEFAULT_PORT = 8080


def get_resource_path() -> str:
    """Directory that holds bundled static files.

    PyInstaller extracts datas into ``sys._MEIPASS``. Source runs use the
    directory that contains this file (``app/``).
    """
    if getattr(sys, "frozen", False):
        return sys._MEIPASS  # type: ignore[attr-defined]
    return os.path.dirname(os.path.abspath(__file__))


def _load_server_config() -> dict:
    """Load the first existing JSON config from the candidate list.

    Search order:
      1. $APP_CONFIG_FILE
      2. config.json          (optional user override next to the app)
      3. config.default.json  (shipped default, bundled by PyInstaller)
    """
    candidates = []
    env_path = os.environ.get("APP_CONFIG_FILE")
    if env_path:
        candidates.append(env_path)
    here = get_resource_path()
    candidates.extend(
        [
            os.path.join(here, "config.json"),
            os.path.join(here, "config.default.json"),
        ]
    )
    for path in candidates:
        if not path or not os.path.isfile(path):
            continue
        try:
            with open(path, "r", encoding="utf-8") as fh:
                data = json.load(fh)
            logger.info("loaded server config path=%s", path)
            return data if isinstance(data, dict) else {}
        except Exception as exc:  # noqa: BLE001 — config is best-effort
            logger.warning("failed to read config path=%s: %s", path, exc)
    return {}


def get_server_port(default: int = DEFAULT_PORT) -> int:
    """Resolve the HTTP listen port.

    Priority:
      1. $PORT env var (Docker / start scripts / Playwright)
      2. config.json ``server.port``
      3. ``default`` (8080)
    """
    env = os.environ.get("PORT")
    if env:
        try:
            port = int(env)
            if 0 < port < 65536:
                return port
            logger.warning("ignoring out-of-range PORT env var=%s", env)
        except ValueError:
            logger.warning("ignoring invalid PORT env var=%s", env)
    cfg = _load_server_config().get("server") or {}
    val = cfg.get("port")
    if isinstance(val, int) and 0 < val < 65536:
        return val
    if isinstance(val, str) and val.isdigit():
        port = int(val)
        if 0 < port < 65536:
            return port
    return default
