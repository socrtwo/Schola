"""Command-line entry point for Schola.

Provides the ``schola`` console_script that wraps Django's manage.py
for pip-installed deployments.
"""

import os
import sys


def main():
    """Run Schola management commands (wraps Django manage.py)."""
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "schola.settings")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
