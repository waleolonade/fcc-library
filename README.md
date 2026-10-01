# 📚 FCC Smart Library Management & Digital Repository Platform

> **Federal Co-operative College (FCC), Ibadan — Founded 1943**  
> *Next-Generation Integrated Library Management System (ILMS), Discovery OPAC, Laravel 11 Backend, React Native Mobile App & Global Free Library APIs Integration.*

---

## 🌟 Architecture Overview

The **FCC Smart Library Ecosystem** provides a unified academic library platform powered by:
1. **Laravel 11 REST API Backend (`backend/`)**: High-performance PHP 8.2 backend with Eloquent ORM, SQLite/MySQL persistence, CORS, Sanctum, audit telemetry, and federated library API endpoints.
2. **FCC Admin Library (`src/fcc_admin_library/FccAdminLibrary.jsx`)**: All administrative and operational workflows consolidated into a single powerhouse module (Circulation Desk, MARC 21, Ingestion, Digital Shelves, Patron Management, Theses, Analytics, and Global APIs Hub).
3. **Student Scholar Portal (`src/student/`)**: Comprehensive student suite connected to Admin via [`UserFccAdminBridge.jsx`](file:///c:/Users/wale8/Desktop/fcclibrary/src/student/UserFccAdminBridge.jsx), featuring Smart Catalog Discovery, Digital Book Reader, Theses Repository, and Global API federation.
4. **React Native Mobile App (`mobile/`)**: Cross-platform Android & iOS app with digital Scholar Card (QR turnstile pass), active loans manager with 1-tap renewal, local & worldwide search, and a circulation barcode scanner.
5. **World Free Library APIs Hub**: Real-time integration with top world repositories plus an interactive Admin engine to dynamically register, ping-test, and ingest from any public or institutional library API worldwide.

---

## 🌐 Connected World Free Library APIs

The system connects out-of-the-box to 6 world-renowned free library APIs and allows Administrators to add custom endpoints dynamically:

| # | Provider / Institution | API Service Name | Primary Coverage & Format | Authentication |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Internet Archive** | Open Library Books & Covers API | Global book catalog, ISBN metadata, book covers | Free Open Access |
| **2** | **Google LLC** | Google Books Volumes API | Global books, previews, descriptions, categories | Free Open Access |
| **3** | **Crossref Consortium** | Crossref Scholarly DOI API | Millions of journal articles, DOIs, research papers | Free Open Access (Polite Pool) |
| **4** | **OurResearch** | OpenAlex Knowledge Graph API | Scientific papers, citations, open-access repos | Free Open Access |
| **5** | **Project Gutenberg** | Project Gutenberg Gutendex API | 70,000+ public domain full-text classic books | Free Open Access |
| **6** | **EMBL-EBI** | Europe PMC Life Sciences API | Biomedical, agricultural & scientific literature | Free Open Access |

### 🛠️ Admin "Add New Library API" Feature
Admins can navigate to the **World Library APIs Hub** tab in `FccAdminLibrary.jsx` to:
- Register any external library or institutional repository via URL template (e.g., `https://api.example.org/search?q={query}`).
- Configure authentication modes (Free Open Access, Bearer Token, API Key Header).
- Run live **Ping Tests** to verify endpoint status, latency (ms), and payload health.
- Perform federated search with **1-click book ingestion** directly into the FCC central catalog.

---

## 🚀 Running the Project

### 1. Web Application & Dev Server
```bash
# Install frontend packages
npm install

# Start Vite Frontend (http://localhost:5173)
npm run dev

# Build for production
npm run build
```

### 2. Laravel 11 Backend Server
```bash
# Start Laravel 11 API Server (http://127.0.0.1:5000)
npm run backend
# Or: php backend/artisan serve --port=5000

# Run database migrations and seed world APIs
npm run backend:migrate
```

### 3. React Native Mobile App (`mobile/`)
```bash
# Navigate to mobile directory and start Expo
npm run mobile
# Or: cd mobile && npm start

# Run on Android Emulator
npm run mobile:android

# Run on iOS Simulator
npm run mobile:ios
```

---

## 🔑 Default Testing Credentials

| Portal / Module | Username / Identifier | Passkey / PIN | Assigned Role |
| :--- | :--- | :--- | :--- |
| **Student Scholar (CEM)** | `FCC/CEM/2024/042` | `1234` | Adebayo Oluwaseun (Co-operative Economics) |
| **Student Scholar (CSC)** | `FCC/CSC/2024/108` | `4321` | Chukwudi Okafor (Computer Science) |
| **Librarian Hub (Admin)** | `librarian@fccibadan.edu.ng` | `9999` *(or `admin`)* | Dr. Mrs. A. Balogun (Chief College Librarian) |
| **Public Discovery OPAC** | Guest Access | *None required* | Public Visitor / Guest Researcher |

---

## 📁 Repository Structure

```
fcclibrary/
├── backend/                         # Laravel 11.57 REST API Backend
│   ├── app/Models/                  # Eloquent Models (Book, Patron, Loan, LibraryApi, etc.)
│   ├── app/Http/Controllers/        # REST Controllers (LibraryApiController, Catalog, etc.)
│   ├── database/migrations/         # Migrations (Library APIs, Books, Loans, Patrons)
│   ├── database/seeders/            # World Library APIs Seeder (LibraryApiSeeder.php)
│   └── routes/api.php               # API Endpoints (/api/catalog, /api/library-apis, etc.)
├── mobile/                          # React Native / Expo Mobile Application
│   ├── App.js                       # Root Navigation & Tab Navigator
│   ├── src/api/mobileApi.js         # Mobile REST Client with Auto Host Resolution
│   ├── src/screens/                 # HomeScreen, SearchScreen, ScholarCardScreen, etc.
│   └── README.md                    # Mobile Setup & Run Guide
├── src/
│   ├── fcc_admin_library/           # Consolidated FCC Admin Library module
│   │   └── FccAdminLibrary.jsx      # Unified All-in-One Admin Library System
│   ├── student/                     # Student Scholar Portal
│   │   ├── SmartCatalogSearch.jsx   # Local Holdings + World Library APIs Search
│   │   ├── UserFccAdminBridge.jsx   # Two-Way Student <-> Admin Bridge
│   │   └── StudentPortal.jsx        # Scholar Hub Component
│   ├── auth/WorldClassLogin.jsx     # Institutional Multi-Role Authentication
│   ├── public_opac/PublicDiscovery.jsx # Public OPAC Discovery Portal
│   ├── common/                      # Reusable modals, BookReader, RouteTracer
│   └── App.jsx                      # Primary Web Application Router
└── package.json                     # NPM Scripts for Web, Backend, and Mobile
```

---

## 🏛️ Institutional Accreditation
Federal Cooperative College, Ibadan, Oyo State, Nigeria.  
Accredited by the National Board for Technical Education (NBTE).
