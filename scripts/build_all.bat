@echo off
REM build_all.bat — Build Schola desktop app on Windows.
REM Usage: scripts\build_all.bat

echo ==> Building Schola for Windows...

cd /d "%~dp0\.."

echo ==> Installing build dependencies...
pip install pyinstaller build 2>nul

echo ==> Building pip package...
python -m build
echo     Done: dist\schola-*.whl

echo ==> Building Windows desktop app...
pyinstaller schola.spec --noconfirm
echo     Done: dist\Schola\Schola.exe

echo.
echo ==> Build complete!
echo     Distribute the entire dist\Schola\ folder.
echo     Users run Schola.exe to start the application.
pause
