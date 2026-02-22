; Schola NSIS Installer Script
; Creates a Windows installer from the PyInstaller output in dist/Schola/

!include "MUI2.nsh"

; ──────────────────────────────────────────────────────────────────
; General
; ──────────────────────────────────────────────────────────────────
Name "Schola"
OutFile "Schola-Setup-${VERSION}.exe"
Unicode True
InstallDir "$PROGRAMFILES\Schola"
InstallDirRegKey HKLM "Software\Schola" "InstallDir"
RequestExecutionLevel admin

; Version info
!ifndef VERSION
  !define VERSION "1.0.0"
!endif
VIProductVersion "${VERSION}.0"
VIAddVersionKey "ProductName" "Schola"
VIAddVersionKey "ProductVersion" "${VERSION}"
VIAddVersionKey "FileDescription" "Schola — Continuing Education System"
VIAddVersionKey "LegalCopyright" "MIT License"

; ──────────────────────────────────────────────────────────────────
; UI
; ──────────────────────────────────────────────────────────────────
!define MUI_ABORTWARNING
!define MUI_WELCOMEPAGE_TITLE "Welcome to Schola Setup"
!define MUI_WELCOMEPAGE_TEXT "This will install Schola, a continuing education registration and administration system.$\r$\n$\r$\nSchola runs a local web server and opens in your browser."

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

; ──────────────────────────────────────────────────────────────────
; Install
; ──────────────────────────────────────────────────────────────────
Section "Install"
  SetOutPath "$INSTDIR"

  ; Copy all files from PyInstaller dist/Schola/
  File /r "..\..\dist\Schola\*.*"

  ; Write uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"

  ; Start menu shortcuts
  CreateDirectory "$SMPROGRAMS\Schola"
  CreateShortcut "$SMPROGRAMS\Schola\Schola.lnk" "$INSTDIR\Schola.exe"
  CreateShortcut "$SMPROGRAMS\Schola\Uninstall.lnk" "$INSTDIR\Uninstall.exe"

  ; Desktop shortcut
  CreateShortcut "$DESKTOP\Schola.lnk" "$INSTDIR\Schola.exe"

  ; Registry
  WriteRegStr HKLM "Software\Schola" "InstallDir" "$INSTDIR"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Schola" \
    "DisplayName" "Schola"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Schola" \
    "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Schola" \
    "DisplayVersion" "${VERSION}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Schola" \
    "Publisher" "Schola Contributors"
SectionEnd

; ──────────────────────────────────────────────────────────────────
; Uninstall
; ──────────────────────────────────────────────────────────────────
Section "Uninstall"
  ; Remove files
  RMDir /r "$INSTDIR"

  ; Remove shortcuts
  Delete "$DESKTOP\Schola.lnk"
  RMDir /r "$SMPROGRAMS\Schola"

  ; Remove registry keys
  DeleteRegKey HKLM "Software\Schola"
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Schola"
SectionEnd
