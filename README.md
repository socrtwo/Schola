# Schola

A multi-tenant continuing education registration and administration system.
Manage course catalogs, registrations, attendance, payments, and accounting
for one or many education organizations.

## Quick Start

### Option 1: pip install (any platform)

```bash
pip install .
schola migrate
schola seed_demo        # optional: load sample data
schola runserver
```

Open http://127.0.0.1:8000 in your browser.

### Option 2: Docker (recommended for production)

```bash
# Development
docker compose up --build

# Production (PostgreSQL + Gunicorn + Nginx)
cp .env.example .env    # edit with your settings
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Option 3: Desktop App (Windows / macOS / Linux)

Build a standalone desktop application that bundles its own server:

```bash
pip install pyinstaller
pyinstaller schola.spec
```

This produces `dist/Schola/` — run `Schola.exe` (Windows), `Schola.app`
(macOS), or `./Schola` (Linux). The app starts a local server and opens
your browser automatically.

### Option 4: Mobile (Android / iOS)

Deploy Schola to any web server. The app includes Progressive Web App (PWA)
support — users can "Add to Home Screen" from their mobile browser for a
native app-like experience with offline caching.

## Platform Distribution Summary

| Platform | Method | How to build |
|----------|--------|-------------|
| **Windows** | Desktop exe | `make build-desktop-windows` or `pyinstaller schola.spec` |
| **macOS** | Desktop .app | `make build-desktop-mac` or `pyinstaller schola.spec` |
| **Linux** | Desktop binary | `make build-desktop-linux` or `pyinstaller schola.spec` |
| **Android** | PWA (Add to Home Screen) | Deploy to web server |
| **iOS** | PWA (Add to Home Screen) | Deploy to web server |
| **Web Server** | Docker or pip | `docker compose up` or `pip install .` |

## Development

```bash
# Install with dev dependencies
pip install -e ".[dev]"

# Run tests
python manage.py test core -v2

# Run development server
python manage.py runserver
```

See `make help` for all available targets.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Data Model](docs/DATA_MODEL.md)
- [Workflows](docs/WORKFLOWS.md)

## License

MIT
