# 📚 FCC Smart Library Management & Digital Repository Platform

> **Federal Co-operative College (FCC), Ibadan**  
> *Next-Generation Integrated Library Management System (ILMS), Discovery OPAC, Digital E-Book Reader, and Institutional Research Repository.*

---

## 🌟 Overview

The **FCC Smart Library System** is an enterprise-grade digital library ecosystem built for higher education institutions. It provides a seamless bridge between physical collection circulation, digital full-text e-reading, OAI-PMH compliant institutional repository archiving, MARC 21 cataloguing, federated scholarly research ingestion, and AI-assisted reference services.

---

## 🚀 Key Features & Functional Modules

### 👩‍🎓 1. Student Scholar Portal
- **Smart Catalog Discovery**: Search physical stacks and digital collections with filters by department (Co-operative Economics, Computer Science, Banking & Finance, Agricultural Extension), format, and real-time availability.
- **Digital E-Book Reader**: Integrated reader supporting Dark, Sepia, and Light modes, chapter bookmarks, margin text highlights, and page navigation.
- **Smart Patron Digital Card**: QR code & simulated NFC patron identification with active loan counters, 14-day extension workflow, and fine management.
- **Course Reserves & Study Rooms**: Reserve physical course textbooks and book soundproof individual carrels or group study suites.
- **AI Smart Librarian**: Natural language assistant trained on catalog metadata providing instant APA 7th, MLA 9th, and BibTeX citations.
- **Theses Archive & Graduation Clearance**: Institutional repository search with PDF downloads and online library clearance verification for graduating students.

### 🏛️ 2. Staff & Librarian Operations Hub
- **Rapid Circulation Desk**: Barcode and RFID scanner simulation for instant book check-outs, returns, renewals, and patron hold management.
- **MARC 21 Cataloguer**: Professional MARC metadata editor supporting tags `020` (ISBN), `050` (Call No), `100` (Author), `245` (Title), `520` (Summary), `650` (Subject) with `.MRC` export.
- **OpenAlex & Crossref Ingestion**: Live federated research query engine to import global scientific literature into the institutional repository with 1-click cataloging.
- **Shelf Audit & Interactive Map**: Visual 3-floor shelf mapping with RFID wand simulation to detect misplaced books and audit inventory status.
- **Institutional Analytics & BI**: Executive dashboards tracking circulation velocity, patron engagement, departmental resource usage, and collection growth.
- **System Health & Audit Logs**: Detailed audit trail logger monitoring system transactions, database backups, and security events.

---

## 🔑 Default Testing Credentials

| Portal / Module | Username / Identifier | Passkey / PIN | Assigned Role |
| :--- | :--- | :--- | :--- |
| **Student Scholar (CEM)** | `FCC/CEM/2024/042` | `1234` | Ibrahim Adekunle (Co-operative Economics) |
| **Student Scholar (CSC)** | `FCC/CSC/2024/108` | `4321` | Chukwudi Okafor (Computer Science) |
| **Librarian Hub (Admin)** | `librarian@fccibadan.edu.ng` | `9999` *(or `admin`)* | Dr. Mrs. A. Balogun (Chief College Librarian) |
| **Public Discovery OPAC** | Guest Access | *None required* | Public Researcher / Guest Visitor |

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite 5, Tailwind CSS 3, Lucide React Icons
- **Backend**: Node.js, Express 5, CORS, Dotenv
- **Database Engine**: SQLite3 / MySQL (via `mysql2`)
- **Build Tooling**: Vite multi-page bundle options (`index.html`, `admin.html`, `student.html`)

---

## 📋 Prerequisites

Ensure you have the following installed on your local machine:
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher

---

## 💻 Full Setup & Installation Guide

### Step 1: Clone the Repository
```bash
git clone https://github.com/waleolonade/fcc-library.git
cd fcc-library
```

### Step 2: Install Project Dependencies
```bash
npm install
```

### Step 3: Initialize the Database
Run the database setup script to configure SQLite/MySQL tables and populate seed data:
```bash
npm run init-db
```
*(Alternatively, initialize MySQL specifically via `npm run init-mysql`)*

### Step 4: Start the Backend API Server
Launch the Express backend server (runs on `http://localhost:5000`):
```bash
npm run server
```

### Step 5: Start the Development Server
In a separate terminal window, start the Vite development server:
```bash
npm run dev
```

Access the application in your web browser:
- **Unified Portal & Login**: [http://localhost:5173](http://localhost:5173)
- **Student Scholar Portal**: [http://localhost:5173/student.html](http://localhost:5173/student.html)
- **Librarian Hub**: [http://localhost:5173/admin.html](http://localhost:5173/admin.html)

---

## 📁 Repository Directory Layout

```
fcc-library/
├── database/               # Database SQL dumps, SQLite database, and schemas
│   ├── schema.sql          # Primary MySQL schema definition
│   └── brainfeels_library.sqlite
├── docs/                   # Documentation manuals and API specs
│   ├── SYSTEM_MANUAL.md    # System Operational Manual
│   ├── database_schema.sql # Detailed schema queries
│   └── laravel_api_blueprint.md
├── scripts/                # Database initialization and migration scripts
│   ├── init-db.js
│   ├── setup-mysql.js
│   └── export-sql.js
├── server/                 # Express API server codebase
│   ├── db.js               # Database connection abstraction
│   └── server.js           # REST API endpoints & route handlers
├── src/                    # Frontend React source code
│   ├── admin/              # Librarian Hub components & modules
│   ├── student/            # Student Scholar components & modules
│   ├── public_opac/        # Public discovery components
│   ├── common/             # Shared UI components (E-Reader, Modal, etc.)
│   ├── auth/               # Login & authentication interface
│   ├── api/                # Client-side API integration handlers
│   └── utils/              # Citation formatters, NLP search, PDF generators
├── index.html              # Main entry point (Login & OPAC)
├── admin.html              # Admin Portal entry point
├── student.html            # Student Portal entry point
├── package.json            # Project dependencies and script definitions
├── tailwind.config.js      # Tailwind CSS design system configuration
└── vite.config.js          # Vite build options & proxy configuration
```

---

## 📦 Building for Production

To create an optimized production bundle:

```bash
npm run build
```

The output will be generated inside the `dist/` folder, ready for deployment to any web host or web server (e.g. Nginx, Apache, Node.js static server).

To preview the production build locally:
```bash
npm run preview
```

---

## 📄 License

Developed for **Federal Co-operative College (FCC), Ibadan**. All rights reserved.
