#!/usr/bin/env bash
# Launcher for the Django/gunicorn API server. API_PORT comes from the
# systemd EnvironmentFile and is expanded here by bash, not by systemd.
set -euo pipefail

exec /opt/meter-reading/venvs/api/bin/gunicorn \
    --bind "0.0.0.0:${API_PORT}" \
    --workers 2 \
    --pythonpath /opt/meter-reading/src/api \
    entry.wsgi:application
