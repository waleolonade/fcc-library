# 📚 FCC Smart Library Management & Digital Repository Platform

> **Federal Co-operative College (FCC), Ibadan — Founded 1943**  
> *Next-Generation Integrated Library Management System (ILMS), Discovery OPAC, Laravel 11 REST Backend, React Native Mobile App, and World Free Library APIs Federation.*

[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Laravel](https://img.shields.io/badge/Laravel-11.x-FF2D20?logo=laravel&logoColor=white)](https://laravel.com/)
[![PHP](https://img.shields.io/badge/PHP-8.2+-777BB4?logo=php&logoColor=white)](https://php.net/)
[![Expo](https://img.shields.io/badge/Expo-51.0-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![License: MPL 2.0](https://img.shields.io/badge/License-MPL_2.0-blue.svg)](https://opensource.org/licenses/MPL-2.0)

---

## 📑 Table of Contents
1. [Executive Summary & System Architecture](#-executive-summary--system-architecture)
2. [Core Platform Modules](#-core-platform-modules)
   - [Public Discovery OPAC](#1-public-discovery-opac-srclibpublic_opacpublicdiscoveryjsx)
   - [Student Scholar Portal](#2-student-scholar-portal-srcstudent)
   - [FCC Admin Library System](#3-fcc-admin-library-system-srcfcc_admin_libraryfccadminlibraryjsx)
   - [Laravel 11 REST API Backend](#4-laravel-11-rest-api-backend-backend)
   - [React Native Mobile App](#5-react-native-mobile-app-mobile)
3. [Connected World Free Library APIs](#-connected-world-free-library-apis)
4. [System Prerequisites & Environment Requirements](#-system-prerequisites--environment-requirements)
5. [Step-by-Step Installation & Configuration Guide](#-step-by-step-installation--configuration-guide)
   - [Quick Start](#quick-start-3-terminal-commands)
   - [Frontend Web App Setup](#frontend-web-app-setup)
   - [Laravel 11 Backend Configuration](#laravel-11-backend-configuration)
   - [Database Configuration (SQLite / MySQL)](#database-configuration)
   - [Mobile Application Setup](#mobile-application-setup)
6. [System Authentication & Default Credentials](#-system-authentication--default-credentials)
7. [Repository File Structure](#-repository-file-structure)
8. [Production Deployment & Server Hardening](#-production-deployment--server-hardening)
9. [Troubleshooting & Frequently Asked Questions](#-troubleshooting--frequently-asked-questions)
10. [Institutional Accreditation & License](#-institutional-accreditation--license)

---

## 🌟 Executive Summary & System Architecture

The **FCC Smart Library Management & Digital Repository Platform** is an enterprise-grade academic library and research knowledge ecosystem engineered specifically for the **Federal Co-operative College (FCC), Ibadan**. The platform bridges local physical library holdings (print monographs, serials, government gazettes, and institutional theses) with over **100+ million open-access global research resources** through real-time API federation.

```
                                  ┌────────────────────────────────────────┐
                                  │      Academic Patrons & Public         │
                                  └───────────────────┬────────────────────┘
                                                      │
                       ┌──────────────────────────────┼──────────────────────────────┐
                       │                              │                              │
                       ▼                              ▼                              ▼
        ┌──────────────────────────────┐ ┌──────────────────────────────┐ ┌──────────────────────────────┐
        │     Public OPAC Portal       │ │    Student Scholar Suite     │ │    FCC Admin Library Hub     │
        │       (/#/opac)              │ │        (/#/student)          │ │         (/#/admin)           │
        │  • Open Library Live Search  │ │  • IA 2-Page Book Reader     │ │  • Circulation Desk (RFID)   │
        │  • Gutendex E-Book Catalog   │ │  • Gutendex Classic Reader   │ │  • MARC 21 Cataloging Engine │
        │  • Trove Australia Search    │ │  • Trove Manuscripts Search  │ │  • Institutional Repository  │
        │  • Institutional Holdings    │ │  • Scholar Digital Pass (QR) │ │  • World Library APIs Hub    │
        └──────────────┬───────────────┘ └──────────────┬───────────────┘ └──────────────┬───────────────┘
                       │                                │                                │
                       └────────────────────────────────┼────────────────────────────────┘
                                                        │
                                                        ▼
                                       ┌──────────────────────────────────┐
                                       │   Vite Reverse Proxy & Router    │
                                       │       (http://localhost:5173)    │
                                       └────────────────┬─────────────────┘
                                                        │
                       ┌────────────────────────────────┴────────────────────────────────┐
                       │                                                                 │
                       ▼                                                                 ▼
        ┌──────────────────────────────┐                                  ┌──────────────────────────────┐
        │  Laravel 11 REST API Engine  │                                  │   Federated External APIs    │
        │    (http://127.0.0.1:8000)   │                                  │  • Internet Archive / OL     │
        │  • Eloquent ORM & Migrations │                                  │  • Gutendex (70k+ E-Books)   │
        │  • Patron & Loan Lifecycle   │                                  │  • Trove National Library    │
        │  • MARC / AACR2 Data Models  │                                  │  • Crossref Scholarly DOIs   │
        │  • SQLite / MySQL Persistence│                                  │  • OpenAlex Knowledge Graph  │
        └──────────────┬───────────────┘                                  │  • Europe PMC / Google Books │
                       │                                                  └──────────────────────────────┘
                       ▼
        ┌──────────────────────────────┐
        │  Expo / React Native Mobile  │
        │  • Mobile Digital Scholar Card│
        │  • Turnstile Barcode Scanner │
        │  • Offline Loan Sync & Renew │
        └──────────────────────────────┘
```

---

## 📦 Core Platform Modules

### 1. Public Discovery OPAC (`src/public_opac/PublicDiscovery.jsx`)
*Accessible without authentication at `/#/opac`*
- **Universal Multi-Stack Search**: Simultaneously queries local FCC library holdings, Internet Archive Open Library, Project Gutenberg via Gutendex, and the National Library of Australia (Trove).
- **Embedded Readers & Previewers**:
  - Direct 2-page flip view for digitized books via Internet Archive (`archive.org/embed/{id}?mode=2up`).
  - Read-in-browser HTML / Text viewer for Project Gutenberg titles with automatic font and dark/sepia mode adjustment.
  - Trove Australian national library research records and manuscript links.
- **Resilient Fallback Engine**: Equipped with a 7-second auto-watchdog that alerts users if external host firewalls block iframe embedding and offers a 1-tap "Open in Secure Window" button.

### 2. Student Scholar Portal (`src/student/`)
*Accessible at `/#/student` via student passkey or matriculation ID*
- **Personalized Scholar Dashboard**: Live loan tracking, due-date countdowns, overdue fine estimators, and 1-tap loan renewal (+14 days).
- **Trove Explorer (`TroveExplorer.jsx`)**: Search historical archives, newspapers, parliamentary debates, and research reports from the National Library of Australia.
- **Open Library Explorer (`OpenLibraryExplorer.jsx`)**: Instant search by Title, Author, or ISBN with high-resolution cover art and native work/edition metadata.
- **Gutendex Explorer (`GutendexExplorer.jsx`)**: 70,000+ public-domain academic classics, literature, and economics textbooks.
- **FCC Digital Theses & Dissertations (`ThesesRepository.jsx`)**: Institutional repository of National Diploma (ND) and Higher National Diploma (HND) final year research projects.

### 3. FCC Admin Library System (`src/fcc_admin_library/FccAdminLibrary.jsx`)
*Consolidated All-in-One Command Center for Library Staff (`/#/admin`)*
- **Circulation Desk**: Issue books, process returns, calculate overdue fines, record lost items, and support barcode / RFID scanner hardware input.
- **MARC 21 & Dublin Core Cataloging**: Full bibliographic record creation with Dewey Decimal Classification (DDC), Library of Congress (LCC), ISBN-13 validation, and copy barcode generation.
- **Patron Management**: Student matriculation database, faculty profiles, borrowing privilege tiers, and automated fine suspension rules.
- **Institutional Repository**: Digital upload and preservation of College theses, monographs, and past exam papers.
- **World Library APIs Hub**: Administrative control center to register any external library endpoint, configure HTTP authentication, execute real-time latency ping tests, and ingest foreign records into the local catalog with 1 click.

### 4. Laravel 11 REST API Backend (`backend/`)
*High-performance PHP 8.2+ backend engine*
- **Database Schema**: Books, patrons, circulation transactions, theses, audit telemetry, and external library API configuration tables.
- **Federated Endpoints**:
  - `GET /api/catalog`: Local catalog search with pagination, filtering, and availability status.
  - `GET /api/library-apis`: Active external API registry.
  - `POST /api/library-apis/ping`: Server-side latency and health probe.
  - `POST /api/loans/issue`: Issue book with borrower ID validation.
  - `POST /api/loans/return`: Process book return and fine calculations.
- **Database Support**: Out-of-the-box zero-configuration SQLite for development, and instant switch to MySQL / PostgreSQL / MariaDB for production.

### 5. React Native Mobile App (`mobile/`)
*Cross-platform Android and iOS application built with Expo*
- **Digital Scholar Card**: Animated gold and emerald student card with turnstile QR code for automated turnstile check-in at the library entrance.
- **Circulation Barcode Scanner**: Hardware camera integration to scan book barcodes for self-checkout or shelf inventory auditing.
- **Universal Mobile Search**: Federated querying of local holdings and world library APIs optimized for mobile networks.

---

## 🌐 Connected World Free Library APIs

The platform connects out-of-the-box to 7 world-renowned open research repositories:

| # | Provider / Organization | API Service | Coverage & Content | Authentication |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Internet Archive** | Open Library Books & Covers API | Millions of monographs, ISBN metadata, book covers, and digitized scan viewer | Free Open Access |
| **2** | **Project Gutenberg** | Gutendex REST API | 70,000+ public domain full-text books in EPUB, HTML, and TXT | Free Open Access |
| **3** | **National Library of Australia** | Trove v3 API | Digitized Australian newspapers, manuscripts, theses, and rare archives | Free Open Access / API Key |
| **4** | **Google LLC** | Google Books Volumes API | Global books, synopses, author bibliographies, and sample previews | Free Open Access |
| **5** | **Crossref Consortium** | Crossref Scholarly DOI API | 140+ million academic journal articles, DOIs, and citation trees | Free Open Access (Polite Pool) |
| **6** | **OurResearch** | OpenAlex Knowledge Graph | 250+ million scientific works, authors, institutions, and open-access concepts | Free Open Access |
| **7** | **EMBL-EBI** | Europe PMC Life Sciences API | Biomedical, agricultural, cooperative, and environmental research | Free Open Access |

---

## 💻 System Prerequisites & Environment Requirements

Before setting up the project, ensure your workstation or server has the following installed:

| Requirement | Minimum Version | Recommended Version | Verification Command |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v18.18.0` | `v20.x LTS` | `node -v` |
| **npm** | `v9.0.0` | `v10.x` | `npm -v` |
| **PHP** | `v8.2.0` | `v8.3.x` | `php -v` |
| **Composer** | `v2.5.0` | `v2.7.x` | `composer -v` |
| **Git** | `v2.30.0` | Latest | `git --version` |

### Required PHP Extensions
Ensure your `php.ini` has the following extensions enabled:
```ini
extension=curl
extension=fileinfo
extension=mbstring
extension=openssl
extension=pdo
extension=pdo_sqlite
extension=pdo_mysql
extension=tokenizer
extension=xml
```

---

## 🛠️ Step-by-Step Installation & Configuration Guide

### Quick Start (3 Terminal Commands)
If you want to get the web app running immediately:
```bash
# 1. Clone repository
git clone https://github.com/waleolonade/fcclibrary.git
cd fcclibrary

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### Frontend Web App Setup

1. **Install NPM Packages**:
   ```bash
   npm install
   ```

2. **Environment File Configuration**:
   Create a `.env` file in the root directory if you wish to override default backend ports:
   ```env
   # Frontend environment configuration
   VITE_APP_NAME="FCC Smart Library Platform"
   VITE_API_BASE_URL="http://127.0.0.1:8000/api"
   VITE_ENABLE_GLOBAL_APIS=true
   ```

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   The application will start on `http://localhost:5173`.

4. **Build Production Assets**:
   ```bash
   npm run build
   ```
   Compiled distribution files will be output to the `dist/` directory.

---

### Laravel 11 Backend Configuration

1. **Navigate to the Backend Directory**:
   ```bash
   cd backend
   ```

2. **Install Composer Packages**:
   ```bash
   composer install
   ```

3. **Configure the Environment File**:
   Copy `.env.example` to `.env`:
   ```bash
   # On Windows PowerShell:
   Copy-Item .env.example .env

   # On Linux/macOS:
   cp .env.example .env
   ```

4. **Generate Application Key**:
   ```bash
   php artisan key:generate
   ```

5. **Start the Laravel API Server**:
   ```bash
   # Start on default port 8000:
   php artisan serve --port=8000

   # Or using the root shortcut (port 5000):
   npm run backend
   ```

---

### Database Configuration

#### Option A: Zero-Config SQLite (Default & Recommended for Local Dev)
1. Ensure `DB_CONNECTION=sqlite` in `backend/.env`.
2. Create the SQLite database file if it does not already exist:
   ```bash
   # On Windows PowerShell:
   New-Item -ItemType File -Path backend/database/database.sqlite -Force

   # On Linux/macOS:
   touch backend/database/database.sqlite
   ```
3. Run database migrations and seed default library data:
   ```bash
   php artisan migrate --seed
   ```

#### Option B: MySQL / MariaDB (Recommended for Production)
1. Create an empty database in MySQL:
   ```sql
   CREATE DATABASE fcc_library CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Update `backend/.env`:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=fcc_library
   DB_USERNAME=root
   DB_PASSWORD=your_secure_password
   ```
3. Execute migrations and seeders:
   ```bash
   php artisan migrate:fresh --seed
   ```

---

### Mobile Application Setup

The mobile application is located in the `mobile/` directory and is built using React Native and Expo.

1. **Navigate to the Mobile Folder**:
   ```bash
   cd mobile
   npm install
   ```

2. **Configure API Host IP**:
   Open `mobile/src/api/mobileApi.js` and verify the IP resolution:
   - **Android Emulator**: Uses `http://10.0.2.2:5000/api` (automatically routes to host machine).
   - **iOS Simulator**: Uses `http://localhost:5000/api`.
   - **Physical Smartphone**: Change the IP to your computer's local Wi-Fi IP (e.g., `http://192.168.1.100:5000/api`).

3. **Launch Mobile Dev Server**:
   ```bash
   npm start
   # or from root: npm run mobile
   ```

4. **Run on Simulators or Physical Device**:
   - **Android**: `npm run android`
   - **iOS**: `npm run ios`
   - **Physical Device**: Open the **Expo Go** app on your phone and scan the QR code printed in the terminal.

---

## 🔑 System Authentication & Default Credentials

The platform provides pre-configured institutional profiles for rapid evaluation and demonstration:

| Portal | Role / Affiliation | Identifier / Username | Passkey / PIN | Permissions & Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Public OPAC** | Guest / Researcher | *None required* | *None* | Search local holdings, query Open Library, Gutendex & Trove, read books in browser |
| **Student Scholar** | Adebayo Oluwaseun (Cooperative Economics) | `FCC/CEM/2024/042` | `1234` | Personal borrowing history, loan renewal, digital reader, thesis download |
| **Student Scholar** | Chukwudi Okafor (Computer Science) | `FCC/CSC/2024/108` | `4321` | Active e-Book loans, Scholar QR turnstile pass, thesis repository |
| **Admin Library** | Dr. Mrs. A. Balogun (Chief College Librarian) | `librarian@fccibadan.edu.ng` | `9999` *(or `admin`)* | Circulation desk, MARC cataloging, patron suspension, API hub, system telemetry |

---

## 📁 Repository File Structure

```
fcclibrary/
├── backend/                             # Laravel 11.57 REST API Backend
│   ├── app/
│   │   ├── Http/Controllers/           # REST Controllers (Catalog, Loans, APIs)
│   │   └── Models/                     # Eloquent Models (Book, Patron, Loan, Api)
│   ├── config/                          # Laravel Configuration (cors, database, sanctum)
│   ├── database/
│   │   ├── migrations/                 # DB schema (books, loans, patrons, library_apis)
│   │   ├── seeders/                    # Seeders (LibraryApiSeeder, CatalogSeeder)
│   │   └── database.sqlite             # SQLite database file
│   ├── routes/
│   │   └── api.php                     # REST endpoints (/api/catalog, /api/loans, etc.)
│   └── composer.json                    # PHP Backend Dependencies
├── mobile/                              # React Native / Expo Mobile Application
│   ├── src/
│   │   ├── api/mobileApi.js            # Network Client with dynamic IP detection
│   │   └── screens/                    # ScholarCard, Search, Scanner, APIs screens
│   ├── App.js                          # Root Mobile Navigation
│   └── package.json                    # Mobile Dependencies
├── src/                                 # Web Application Frontend (React 18 + Vite)
│   ├── auth/
│   │   └── WorldClassLogin.jsx         # Institutional Multi-Role Authentication UI
│   ├── common/                          # Reusable UI components & modals
│   ├── fcc_admin_library/
│   │   └── FccAdminLibrary.jsx         # All-in-One Consolidated Administrative System
│   ├── public_opac/
│   │   └── PublicDiscovery.jsx         # Open Public Access Catalog (Zero-Auth Discovery)
│   ├── student/
│   │   ├── GutendexExplorer.jsx        # Project Gutenberg 70k+ Book Explorer & Reader
│   │   ├── OpenLibraryExplorer.jsx     # Internet Archive / Open Library 2-Page Reader
│   │   ├── TroveExplorer.jsx           # National Library of Australia Research Portal
│   │   ├── SmartCatalogSearch.jsx      # Multi-Stack Local + World API Search
│   │   ├── ThesesRepository.jsx        # Institutional ND/HND Project Archive
│   │   └── StudentPortal.jsx           # Student Account & Loans Hub
│   ├── App.jsx                          # Primary HashRouter & View Controller
│   ├── index.css                        # Tailwind CSS Design System
│   └── main.jsx                         # React Root Mount
├── package.json                         # NPM Scripts for Web, Backend, and Mobile
├── vite.config.js                       # Vite Configuration & Backend Proxy Routing
├── LICENSE                              # Mozilla Public License 2.0 (MPL-2.0)
└── README.md                            # Comprehensive System Documentation
```

---

## 🚀 Production Deployment & Server Hardening

### 1. Frontend Production Build
Compile the Single-Page Application into static assets:
```bash
npm run build
```
The output directory is `dist/`. These files can be served using Nginx, Apache, or AWS S3 + CloudFront.

### 2. Laravel Backend Production Optimization
Run the following optimization commands in the `backend/` directory:
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize
```

### 3. Example Nginx Configuration
```nginx
# Upstream Vite SPA & Laravel API Configuration
server {
    listen 80;
    server_name library.fccibadan.edu.ng;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name library.fccibadan.edu.ng;

    ssl_certificate /etc/letsencrypt/live/library.fccibadan.edu.ng/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/library.fccibadan.edu.ng/privkey.pem;

    root /var/www/fcclibrary/dist;
    index index.html;

    # Serve React SPA Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API Requests to Laravel 11 Backend
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4. Process Supervision with PM2 or Systemd
To keep the Laravel backend running persistently:
```bash
# Using PM2:
pm2 start "php artisan serve --port=8000" --name "fcc-library-api" --cwd /var/www/fcclibrary/backend
pm2 save
pm2 startup
```

---

## ❓ Troubleshooting & Frequently Asked Questions

### Q1: The Internet Archive book reader shows a blank screen or blocks loading.
**Answer**: Modern web browsers enforce strict Content Security Policies (CSP) and iframe sandboxing. The platform automatically resolves this by using permissive sandbox policies for `archive.org` and `gutenberg.org`. If an institutional campus proxy blocks iframe embeds, our built-in 7-second auto-watchdog displays an unobtrusive banner with a **"Open in Secure External Window"** button.

### Q2: How do I resolve `CORS` errors when calling external library APIs?
**Answer**: Public APIs like Open Library and Gutendex natively send permissive `Access-Control-Allow-Origin: *` headers. For custom institutional APIs registered via the Admin Hub that lack CORS headers, the system routes requests through the Laravel backend proxy (`/api/library-apis/ping`), completely eliminating browser CORS issues.

### Q3: How do I switch the database from SQLite to MySQL?
**Answer**: Open `backend/.env`, set `DB_CONNECTION=mysql`, provide your database credentials (`DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`), and run `php artisan migrate:fresh --seed`.

### Q4: On mobile, the app says "Cannot connect to server".
**Answer**: Ensure your smartphone and development machine are connected to the same Wi-Fi network. In `mobile/src/api/mobileApi.js`, replace `localhost` with your computer's local network IP address (e.g., `192.168.1.15`).

---

## 🏛️ Institutional Accreditation & License

**Federal Co-operative College (FCC), Ibadan**  
PMB 5033, Eleyele, Ibadan, Oyo State, Nigeria.  
*Pioneering cooperative education, agricultural management, and technology training since 1943.*  
Accredited by the **National Board for Technical Education (NBTE)**.

### License
This software is licensed under the **Mozilla Public License 2.0 (MPL-2.0)**.  
See the [`LICENSE`](LICENSE) file for complete terms and conditions.
