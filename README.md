# Schola 🎓

<!--PAGES_LINK_BANNER-->
> 🌐 **Live page:** [https://socrtwo.github.io/Schola/](https://socrtwo.github.io/Schola/)  
> 📦 **Releases:** [github.com/socrtwo/Schola/releases](https://github.com/socrtwo/Schola/releases)
<!--/PAGES_LINK_BANNER-->

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Web%20%7C%20Windows%20%7C%20macOS%20%7C%20Linux%20%7C%20Android%20%7C%20iOS-brightgreen.svg)

## Description

Schola is a comprehensive database and registration system designed for continuing education schools. It streamlines course management, student registration, attendance tracking, and accounting operations.

## Features ✨

- **📋 Registration Management**: Handle student enrollments and course registrations efficiently
- **📍 Attendance Tracking**: Automated attendance sheet generation and tracking
- **💰 Accounting Integration**: Complete financial management and reporting
- **📚 Course Catalogs**: Organize and display courses with detailed information
- **👥 Student Database**: Centralized student information management
- **📊 Reporting**: Generate comprehensive reports for administrative purposes

## Supported Platforms 🖥️

One React/TypeScript code base, packaged for every platform (see [PLATFORMS.md](PLATFORMS.md)):

- **Web / PWA** – installable from the browser; live at [socrtwo.github.io/Schola](https://socrtwo.github.io/Schola/)
- **Windows** – NSIS installer and portable `.exe` (Electron)
- **macOS** – universal `.dmg` / `.zip` (Electron)
- **Linux** – AppImage, `.deb`, `.rpm` (Electron)
- **Android** – APK (Capacitor)
- **iOS / iPadOS** – Capacitor project; simulator build in each release, or install the PWA from Safari
- Responsive design for desktop, tablet and phone

## Key Components 🔧

| Component | Purpose |
|-----------|---------|
| **Registration Module** | Student enrollment and course registration |
| **Attendance System** | Track and generate attendance records |
| **Accounting Suite** | Financial management and invoicing |
| **Course Catalog** | Browse and manage course offerings |
| **Reporting Engine** | Generate administrative and financial reports |

## Technology Stack 💻

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Recharts
- **Desktop**: Electron + electron-builder
- **Mobile**: Capacitor (Android, iOS)
- **Data**: bundled synthetic sample data (`src/data/sampleData.ts`); CSV import/export via PapaParse

## Installation 📥

**Just want to use it?** Download an installer for your platform from the
[Releases](https://github.com/socrtwo/Schola/releases) page, or open the
[live app](https://socrtwo.github.io/Schola/) and choose *Install* in your browser.

**Run from source** (Node.js ≥ 22):

1. Clone the repository:
   ```bash
   git clone https://github.com/socrtwo/Schola.git
   cd Schola
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Production web build (output in `dist/`):
   ```bash
   npm run build:web
   ```

Native desktop and mobile builds are documented in [PLATFORMS.md](PLATFORMS.md).

## Usage 📖

1. Access the web interface
2. Create user accounts for administrators and staff
3. Set up your course catalog
4. Begin registering students
5. Generate attendance and financial reports as needed

## Sample Data 🔒

The application ships with **fully synthetic** demo data (`src/data/sampleData.ts`)
and example import files (`samples/`). Every name, address, email, and phone
number is randomly generated fiction — no real personal information is stored in
this repository. Phone numbers use the reserved 555 prefix and email addresses
use reserved `example.com` domains.

## License 📄

MIT License - See [LICENSE](LICENSE) for details

## Credits 🙏

Developed by Paul Pruitt (socrtwo)