# FCC Smart Library Management & Digital Repository Platform
## System Manual & Quickstart Guide (Federal Co-operative College, Ibadan)

### 1. Overview
The **FCC Smart Library System** is a next-generation Integrated Library Services Platform (ILMS), Discovery OPAC, Digital E-Book Reader, Institutional Repository (OAI-PMH), and Research Gateway designed for higher education excellence.

---

### 2. Testing Credentials & Quick Access

#### A. Student Scholar Portal
* **Option 1 (CEM Scholar):**
  - **Matriculation No:** `FCC/CEM/2024/042`
  - **Security PIN:** `1234`
  - **Name:** Ibrahim Adekunle (Co-operative Economics)
* **Option 2 (CompSci Scholar):**
  - **Matriculation No:** `FCC/CSC/2024/108`
  - **Security PIN:** `4321`
  - **Name:** Chukwudi Okafor (Computer Science)

#### B. Staff & Librarian Operations Hub
* **Officer Identity:** `librarian@fccibadan.edu.ng`
* **Master Authority Passkey:** `9999` (or `admin`)
* **Role:** Dr. Mrs. A. Balogun (Chief College Librarian & System Architect)

#### C. Public Discovery OPAC
* Click **"Explore Public Discovery OPAC (Guest Mode)"** on the login screen to browse holdings without logging in.

---

### 3. Core Functional Highlights
1. **Unified Discovery OPAC:** Faceted search by department (CEM, CSC, BNF, AGR), format (eBook vs. Physical), and in-stock stack availability.
2. **Digital Full-Text E-Reader:** Dark, Sepia, and Light reading modes, chapter jumps, margin annotation tools, and zoom controls.
3. **Institutional Theses Repository:** OAI-PMH compliant scholarly archive with submission pipeline and PDF downloads.
4. **Digital Patron Smart Card:** Holographic QR/NFC simulator, real-time borrow quota tracker, 14-day renewal, and Paystack/Flutterwave fine clearance.
5. **Study Room Booking:** Individual soundproof research carrels, group collaboration rooms, and seminar suites.
6. **AI Smart Librarian:** Natural language query assistant grounded against catalog embeddings with instant APA/BibTeX/MLA citations.
7. **Rapid Barcode / RFID Circulation Desk:** Instant issue/return terminal with live ledger sync and inventory audits.
8. **MARC 21 Cataloguer:** Professional metadata editor (tags 020, 050, 100, 245, 520, 650) with `.MRC` export.
9. **OpenAlex & Crossref Ingestion:** Live federated research query across global scientific literature with 1-click catalog import.
10. **Visual Floorplan & Shelf Audit:** Visual 3-floor map with RFID wand scanner to detect misplaced books.

---

### 4. Running the Application Locally
```bash
# Navigate to the project root
cd c:\Users\wale8\Desktop\fcclibrary

# Install dependencies
npm install

# Start local intranet server
npm run dev -- --host
```
Access in your browser at: `http://localhost:5173`
