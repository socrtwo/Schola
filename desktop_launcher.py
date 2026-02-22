"""Desktop launcher for Schola.

Starts the Django development server and opens a browser window.
Used by PyInstaller builds for Windows, Mac, and Linux desktop apps.
"""

import os
import sys
import socket
import threading
import time
import webbrowser


def find_free_port():
    """Find a free TCP port on localhost."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def wait_for_server(host, port, timeout=30):
    """Block until the server is accepting connections."""
    start = time.time()
    while time.time() - start < timeout:
        try:
            with socket.create_connection((host, port), timeout=1):
                return True
        except OSError:
            time.sleep(0.3)
    return False


def main():
    # Ensure settings are configured
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "schola.settings")
    os.environ.setdefault("DJANGO_DEBUG", "true")

    # When running as a frozen PyInstaller bundle, adjust paths
    if getattr(sys, "frozen", False):
        base_dir = os.path.dirname(sys.executable)
        os.environ.setdefault("DB_ENGINE", "django.db.backends.sqlite3")
        os.environ.setdefault("DB_NAME", os.path.join(base_dir, "schola.db"))
    else:
        base_dir = os.path.dirname(os.path.abspath(__file__))

    # Add project to sys.path
    if base_dir not in sys.path:
        sys.path.insert(0, base_dir)

    import django
    django.setup()

    from django.core.management import call_command

    # Run migrations automatically
    print("Schola: Running database migrations...")
    call_command("migrate", "--run-syncdb", verbosity=0)

    port = find_free_port()
    url = f"http://127.0.0.1:{port}"

    print(f"Schola: Starting server on {url}")
    print("Schola: Close this window to stop the server.\n")

    # Open browser after server starts (in background thread)
    def open_browser():
        if wait_for_server("127.0.0.1", port):
            webbrowser.open(url)

    threading.Thread(target=open_browser, daemon=True).start()

    # Run the development server (blocks)
    try:
        call_command("runserver", f"127.0.0.1:{port}", "--noreload")
    except KeyboardInterrupt:
        print("\nSchola: Server stopped.")


if __name__ == "__main__":
    main()
