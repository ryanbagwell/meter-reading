#!/usr/bin/env bash
# uninstall.sh — stop and remove all meter-reading services from the host.
# Usage: sudo ./uninstall.sh
set -euo pipefail

[[ $EUID -eq 0 ]] || { echo "Run with sudo: sudo ./uninstall.sh"; exit 1; }

echo "Stopping services..."
systemctl stop meter-api meter-reader meter-ui 2>/dev/null || true

echo "Disabling services..."
systemctl disable meter-api meter-reader meter-ui 2>/dev/null || true

echo "Removing systemd units..."
rm -f /etc/systemd/system/meter-api.service
rm -f /etc/systemd/system/meter-reader.service
rm -f /etc/systemd/system/meter-ui.service
systemctl daemon-reload

echo "Removing nginx site config..."
rm -f /etc/nginx/sites-enabled/meter-reading
rm -f /etc/nginx/sites-available/meter-reading
systemctl reload nginx 2>/dev/null || true

echo "Removing udev rules..."
rm -f /etc/udev/rules.d/51-rtl-sdr.rules
udevadm control --reload-rules

echo "Removing installed files (/opt/meter-reading)..."
rm -rf /opt/meter-reading

echo "Removing config (/etc/meter-reading)..."
rm -rf /etc/meter-reading

echo "Removing system user 'meter-reading'..."
userdel meter-reading 2>/dev/null || true

echo ""
echo "Uninstall complete."
