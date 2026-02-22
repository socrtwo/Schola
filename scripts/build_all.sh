#!/usr/bin/env bash
# build_all.sh — Build Schola distributions for the current platform.
#
# Usage:
#   ./scripts/build_all.sh          Build pip package + desktop app
#   ./scripts/build_all.sh pip      Build pip package only
#   ./scripts/build_all.sh desktop  Build desktop app only
#   ./scripts/build_all.sh docker   Build Docker image only

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

build_pip() {
    echo "==> Building pip package..."
    pip install build 2>/dev/null || true
    python -m build
    echo "    Done: dist/schola-*.whl and dist/schola-*.tar.gz"
}

build_desktop() {
    echo "==> Building desktop app for $(uname -s)..."
    pip install pyinstaller 2>/dev/null || true
    pyinstaller schola.spec --noconfirm
    echo "    Done: dist/Schola/"
}

build_docker() {
    echo "==> Building Docker image..."
    docker build -t schola:latest .
    echo "    Done: schola:latest"
    echo ""
    echo "    Run with:"
    echo "      docker run -p 8000:8000 schola:latest"
    echo ""
    echo "    Or use docker-compose:"
    echo "      docker compose up --build"
}

case "${1:-all}" in
    pip)     build_pip ;;
    desktop) build_desktop ;;
    docker)  build_docker ;;
    all)
        build_pip
        echo ""
        build_desktop
        echo ""
        build_docker
        ;;
    *)
        echo "Usage: $0 {pip|desktop|docker|all}"
        exit 1
        ;;
esac

echo ""
echo "==> Build complete!"
