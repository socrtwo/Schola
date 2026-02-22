# Schola — Build & Distribution Targets
# =======================================

.PHONY: help install dev test lint run migrate seed clean \
        docker-dev docker-prod docker-stop \
        build-pip build-desktop-windows build-desktop-mac build-desktop-linux \
        build-all collectstatic

PYTHON ?= python3
PIP ?= pip
MANAGE = $(PYTHON) manage.py

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-28s\033[0m %s\n", $$1, $$2}'

# ---------------------------------------------------------------------------
# Development
# ---------------------------------------------------------------------------

install: ## Install dependencies (production)
	$(PIP) install -r requirements.txt

dev: ## Install with dev dependencies
	$(PIP) install -e ".[dev]"

test: ## Run test suite
	$(MANAGE) test core -v2

lint: ## Run linter
	flake8 core/ schola/ --max-line-length=120 --exclude=migrations

run: ## Run development server
	$(MANAGE) runserver

migrate: ## Run database migrations
	$(MANAGE) migrate

seed: ## Seed demo data
	$(MANAGE) seed_demo

collectstatic: ## Collect static files
	$(MANAGE) collectstatic --noinput

clean: ## Remove build artifacts
	rm -rf dist/ build/ *.egg-info/
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete 2>/dev/null || true

# ---------------------------------------------------------------------------
# Docker
# ---------------------------------------------------------------------------

docker-dev: ## Start development stack (PostgreSQL + Django)
	docker compose up --build

docker-prod: ## Start production stack (PostgreSQL + Django + Nginx)
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d

docker-stop: ## Stop all containers
	docker compose down

# ---------------------------------------------------------------------------
# Distribution: pip package
# ---------------------------------------------------------------------------

build-pip: clean ## Build pip-installable package (sdist + wheel)
	$(PYTHON) -m build
	@echo ""
	@echo "  Built packages in dist/"
	@echo "  Install with: pip install dist/schola-*.whl"

# ---------------------------------------------------------------------------
# Distribution: Desktop (PyInstaller)
# ---------------------------------------------------------------------------

build-desktop-windows: ## Build Windows desktop app (.exe)
	$(PIP) install pyinstaller
	pyinstaller schola.spec
	@echo ""
	@echo "  Windows build: dist/Schola/Schola.exe"
	@echo "  Distribute the entire dist/Schola/ directory."

build-desktop-mac: ## Build macOS desktop app (.app)
	$(PIP) install pyinstaller
	pyinstaller schola.spec
	@echo ""
	@echo "  macOS build: dist/Schola.app"
	@echo "  Distribute the .app bundle or zip it."

build-desktop-linux: ## Build Linux desktop app
	$(PIP) install pyinstaller
	pyinstaller schola.spec
	@echo ""
	@echo "  Linux build: dist/Schola/Schola"
	@echo "  Distribute the entire dist/Schola/ directory."
	@echo "  Optional: install desktop entry with 'make install-desktop-linux'"

install-desktop-linux: ## Install .desktop entry on Linux
	mkdir -p $(HOME)/.local/share/applications
	cp scripts/schola.desktop $(HOME)/.local/share/applications/
	@echo "  Desktop entry installed."

# ---------------------------------------------------------------------------
# Build all
# ---------------------------------------------------------------------------

build-all: build-pip ## Build pip package (desktop builds are platform-specific)
	@echo ""
	@echo "  pip package built. For desktop builds, run on target platform:"
	@echo "    make build-desktop-windows   (on Windows)"
	@echo "    make build-desktop-mac       (on macOS)"
	@echo "    make build-desktop-linux     (on Linux)"
	@echo ""
	@echo "  For Docker deployment:"
	@echo "    make docker-prod"
	@echo ""
	@echo "  For mobile (Android/iOS):"
	@echo "    Deploy to any web server — PWA install-to-homescreen is built in."
