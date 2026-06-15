#!/usr/bin/env bash
# Launcher for the RTL-SDR daemon.
# All configuration is read from /etc/meter-reading/rtlamr.toml.
set -euo pipefail

exec /opt/meter-reading/venvs/rtlamr/bin/python \
    /opt/meter-reading/src/rtlamr-python/main.py
