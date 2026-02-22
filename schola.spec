# -*- mode: python ; coding: utf-8 -*-
"""PyInstaller spec file for Schola desktop application.

Build on each target platform:
    pip install pyinstaller
    pyinstaller schola.spec

Produces: dist/Schola/ (directory) or dist/Schola.exe / Schola.app
"""

import sys
from pathlib import Path

block_cipher = None
base_dir = Path(SPECPATH)

# Collect Django and app data files
datas = [
    # Django templates
    (str(base_dir / "core" / "templates"), "core/templates"),
    # Static files (if any)
    # (str(base_dir / "core" / "static"), "core/static"),
    # Management commands
    (str(base_dir / "core" / "management"), "core/management"),
    # Django project settings
    (str(base_dir / "schola"), "schola"),
]

# Include core module files
hidden_imports = [
    "django",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.db.backends.sqlite3",
    "core",
    "core.models",
    "core.views",
    "core.admin",
    "core.urls",
    "core.services",
    "core.catalog",
    "core.exporters",
    "core.importers",
    "core.messaging",
    "core.providers",
    "core.attendance",
    "core.managers",
    "core.payment_processors",
    "schola.settings",
    "schola.urls",
    "schola.wsgi",
]

a = Analysis(
    [str(base_dir / "desktop_launcher.py")],
    pathex=[str(base_dir)],
    binaries=[],
    datas=datas,
    hiddenimports=hidden_imports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="Schola",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,  # Show console so user sees server status
    icon=None,     # Add icon path here: icon='assets/schola.ico'
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name="Schola",
)

# macOS .app bundle (only on macOS)
if sys.platform == "darwin":
    app = BUNDLE(
        coll,
        name="Schola.app",
        icon=None,  # Add icon path here: icon='assets/schola.icns'
        bundle_identifier="org.schola.app",
        info_plist={
            "CFBundleDisplayName": "Schola",
            "CFBundleShortVersionString": "1.0.0",
            "NSHighResolutionCapable": True,
        },
    )
