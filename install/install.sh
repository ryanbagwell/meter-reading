#!/usr/bin/env bash
# install.sh — install meter-reading services onto the host and enable them at boot.
# Usage: sudo ./install/install.sh
set -euo pipefail

# ─── Paths ───────────────────────────────────────────────────────────────────
INSTALL_DIR=/opt/meter-reading
SRC_DIR=$INSTALL_DIR/src
VENV_DIR=$INSTALL_DIR/venvs
BIN_DIR=$INSTALL_DIR/bin
NVM_DIR=$INSTALL_DIR/nvm
ENV_FILE=/etc/meter-reading/meter-reading.env
SERVICE_USER=meter-reading
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
PROJECT_DIR=$(dirname "$SCRIPT_DIR")
export NVM_DIR

# ─── Helpers ─────────────────────────────────────────────────────────────────
info()  { echo "  [setup] $*"; }
error() { echo "  [ERROR] $*" >&2; exit 1; }

# ─── 1. Require root ─────────────────────────────────────────────────────────
[[ $EUID -eq 0 ]] || error "Run this script with sudo: sudo ./install/install.sh"

# ─── 2. Check prerequisites ──────────────────────────────────────────────────
info "Checking prerequisites..."

PYTHON=""
for cmd in python3.13 python3.12 python3; do
    if command -v "$cmd" &>/dev/null; then
        ver=$("$cmd" -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
        major=${ver%%.*}
        minor=${ver#*.}
        if (( major > 3 || (major == 3 && minor >= 12) )); then
            PYTHON=$(command -v "$cmd")
            break
        fi
    fi
done
[[ -n "$PYTHON" ]] || error "Python 3.12+ is required but not found."
info "  Python:  $PYTHON ($("$PYTHON" --version))"

command -v curl  &>/dev/null || error "curl is required but not found."
command -v rsync &>/dev/null || error "rsync is required but not found."

# ─── 3. Create system user ───────────────────────────────────────────────────
info "Creating system user '$SERVICE_USER'..."
if id "$SERVICE_USER" &>/dev/null; then
    info "  User '$SERVICE_USER' already exists."
else
    useradd --system --no-create-home --home-dir "$INSTALL_DIR" \
            --shell /usr/sbin/nologin "$SERVICE_USER"
    info "  Created user '$SERVICE_USER'."
fi
if getent group plugdev &>/dev/null; then
    usermod -aG plugdev "$SERVICE_USER"
    info "  Added '$SERVICE_USER' to 'plugdev' group."
else
    info "  Warning: 'plugdev' group not found — RTL-SDR USB access may need manual configuration."
fi

# ─── 4. Copy source files ────────────────────────────────────────────────────
info "Copying source files to $SRC_DIR..."
mkdir -p "$SRC_DIR"
for svc in api rtlamr-python ui; do
    rsync -a --delete \
          --exclude='__pycache__'  \
          --exclude='*.pyc'        \
          --exclude='.venv'        \
          --exclude='*.egg-info'   \
          --exclude='node_modules' \
          --exclude='.next'        \
          --exclude='db.sqlite3'   \
          "$PROJECT_DIR/$svc/" "$SRC_DIR/$svc/"
    info "  Copied $svc/"
done

# ─── 5. Set up API virtualenv ────────────────────────────────────────────────
info "Setting up API virtualenv..."
[[ -d "$VENV_DIR/api" ]] || "$PYTHON" -m venv "$VENV_DIR/api"
"$VENV_DIR/api/bin/pip" install --quiet --upgrade pip
"$VENV_DIR/api/bin/pip" install --quiet -e "$SRC_DIR/api" gunicorn
info "  API venv ready at $VENV_DIR/api"

# ─── 6. Run database migrations ──────────────────────────────────────────────
info "Running database migrations..."
(
    cd "$SRC_DIR/api"
    DJANGO_SETTINGS_MODULE=entry.settings \
        "$VENV_DIR/api/bin/python" manage.py migrate --run-syncdb
)
info "  Migrations complete."

# ─── 7. Collect static files ─────────────────────────────────────────────────
info "Collecting static files..."
(
    cd "$SRC_DIR/api"
    DJANGO_SETTINGS_MODULE=entry.settings \
        "$VENV_DIR/api/bin/python" manage.py collectstatic --noinput
)
info "  Static files collected."

# ─── 9. Set up rtlamr virtualenv ─────────────────────────────────────────────
info "Setting up rtlamr-python virtualenv..."
[[ -d "$VENV_DIR/rtlamr" ]] || "$PYTHON" -m venv "$VENV_DIR/rtlamr"
"$VENV_DIR/rtlamr/bin/pip" install --quiet --upgrade pip
"$VENV_DIR/rtlamr/bin/pip" install --quiet --upgrade -e "$SRC_DIR/rtlamr-python"
info "  rtlamr venv ready at $VENV_DIR/rtlamr"

# ─── 10. Set up Node.js via nvm ──────────────────────────────────────────────
info "Setting up Node.js via nvm..."
mkdir -p "$NVM_DIR"
if [[ ! -s "$NVM_DIR/nvm.sh" ]]; then
    info "  nvm not found — installing to $NVM_DIR..."
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh \
        | PROFILE=/dev/null bash
fi
# shellcheck source=/dev/null
source "$NVM_DIR/nvm.sh"

NODE_VERSION="lts/*"
[[ -f "$PROJECT_DIR/ui/.nvmrc" ]] && NODE_VERSION=$(cat "$PROJECT_DIR/ui/.nvmrc")
nvm install "$NODE_VERSION"
nvm use "$NODE_VERSION"

NPM=$(command -v npm) || error "npm not found after nvm setup."
info "  Node.js: $(node --version)  npm: $(npm --version)"

# ─── 11. Build Next.js UI ────────────────────────────────────────────────────
info "Building Next.js UI (this may take a minute)..."
"$NPM" --prefix "$SRC_DIR/ui" ci --silent
"$NPM" --prefix "$SRC_DIR/ui" run build
info "  UI build complete."

# ─── 12. Install and configure nginx ─────────────────────────────────────────
info "Setting up nginx..."
if ! command -v nginx &>/dev/null; then
    info "  nginx not found — installing via apt..."
    apt-get install -y nginx
fi
install -m 644 "$SCRIPT_DIR/meter-reading.nginx" \
    /etc/nginx/sites-available/meter-reading
# Disable the default site if it is still enabled.
rm -f /etc/nginx/sites-enabled/default
# Enable the meter-reading site.
ln -sf /etc/nginx/sites-available/meter-reading \
    /etc/nginx/sites-enabled/meter-reading
nginx -t
info "  nginx configured."

# ─── 13. Install RTL-SDR udev rules ──────────────────────────────────────────
info "Installing RTL-SDR udev rules..."
install -m 644 "$SCRIPT_DIR/51-rtl-sdr.rules" /etc/udev/rules.d/
udevadm control --reload-rules
udevadm trigger
info "  udev rules installed."

# ─── 14. Install config files ────────────────────────────────────────────────
info "Installing config files..."
mkdir -p /etc/meter-reading
if [[ -f "$ENV_FILE" ]]; then
    info "  $ENV_FILE already exists — skipping (edit manually to reconfigure)."
else
    install -m 640 -o root -g "$SERVICE_USER" \
        "$SCRIPT_DIR/meter-reading.env.example" "$ENV_FILE"
    info "  Created $ENV_FILE — review and edit before starting services."
fi
if [[ -f /etc/meter-reading/rtlamr.toml ]]; then
    info "  /etc/meter-reading/rtlamr.toml already exists — skipping."
else
    install -m 640 -o root -g "$SERVICE_USER" \
        "$SCRIPT_DIR/rtlamr.toml.example" /etc/meter-reading/rtlamr.toml
    info "  Created /etc/meter-reading/rtlamr.toml — edit to configure the meter reader."
fi

# ─── 15. Install launcher scripts ────────────────────────────────────────────
info "Installing launcher scripts..."
mkdir -p "$BIN_DIR"

install -m 755 "$SCRIPT_DIR/start-meter-reader.sh" "$BIN_DIR/"
install -m 755 "$SCRIPT_DIR/start-meter-api.sh"   "$BIN_DIR/"

# Generate start-meter-ui.sh with the nvm node bin dir and npm path baked in.
# The PATH export is required because systemd's default PATH doesn't include
# the nvm directory, and npm start invokes node internally.
NODE_BIN_DIR=$(dirname "$NPM")
cat > "$BIN_DIR/start-meter-ui.sh" <<SCRIPT
#!/usr/bin/env bash
export PATH="$NODE_BIN_DIR:\$PATH"
exec "$NPM" --prefix /opt/meter-reading/src/ui start -- -p 3000
SCRIPT
chmod 755 "$BIN_DIR/start-meter-ui.sh"

info "  Scripts installed to $BIN_DIR"

# ─── 16. Set file ownership ──────────────────────────────────────────────────
info "Setting file ownership to '$SERVICE_USER'..."
chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"

# ─── 17. Install systemd units ───────────────────────────────────────────────
info "Installing systemd service units..."
for unit in meter-api meter-reader meter-ui; do
    install -m 644 "$SCRIPT_DIR/${unit}.service" /etc/systemd/system/
    info "  Installed ${unit}.service"
done
systemctl daemon-reload

# ─── 18. Enable and start services ───────────────────────────────────────────
info "Enabling services at boot..."
systemctl enable meter-api meter-reader meter-ui nginx

info "Starting services..."
systemctl restart meter-api
# Give the API a moment to accept connections before the dependent services start.
sleep 3
systemctl restart meter-reader meter-ui
systemctl restart nginx

echo ""
echo "Setup complete."
echo ""
echo "  UI + API:  http://localhost/          (via nginx)"
echo "  API docs:  http://localhost/api/docs"
echo "  Config:    $ENV_FILE"
echo "  Logs:      journalctl -u meter-api -u meter-reader -u meter-ui -f"
echo "             journalctl -u nginx -f"
echo ""
echo "  To check status:  systemctl status meter-api meter-reader meter-ui nginx"
echo "  To stop all:      systemctl stop meter-api meter-reader meter-ui nginx"
