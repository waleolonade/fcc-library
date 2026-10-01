# FCC Smart Library — React Native Mobile Application

The official mobile app for **Federal Cooperative College (FCC), Ibadan — Prof. Hezekiah Central Integrated Library System (ILS)**.

Built with **React Native** & **Expo**, seamlessly synchronized with the **Laravel 11 REST API** backend and **Global World Library APIs**.

---

## 📱 Features

1. **Scholar ID & Gate Pass (`ScholarCardScreen.js`)**:
   - High-fidelity Gold & Emerald digital card with dynamic turnstile QR code.
   - Active book loans tracker with due dates countdown and 1-tap loan renewal (+14 days).
2. **Federated Discovery (`SearchScreen.js`)**:
   - **FCC Central Holdings**: Live local print & digital monographs with shelf availability.
   - **World Free Library APIs**: Real-time querying of Open Library, Google Books, Project Gutenberg, Crossref, and OpenAlex.
3. **Circulation Scanner (`CirculationScannerScreen.js`)**:
   - Optical viewfinder for scanning student scholar cards and book barcodes/ISBNs.
   - 1-tap test barcode simulations for rapid testing without physical cameras.
4. **World Library APIs Hub (`GlobalApisScreen.js`)**:
   - Inspect all connected worldwide library endpoints.
   - Live ping tests to measure latency (ms) and verify upstream status.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** v18+
- **Laravel 11 Backend** running on port 5000:
  ```bash
  cd ../backend
  php artisan serve --port=5000
  ```

### 2. Install Dependencies
```bash
cd mobile
npm install
```

### 3. Run Mobile App
- **Start Expo Dev Server**:
  ```bash
  npm start
  # or from project root: npm run mobile
  ```
- **Run on Android Emulator**:
  ```bash
  npm run android
  # Automatically connects to host machine via http://10.0.2.2:5000/api
  ```
- **Run on iOS Simulator**:
  ```bash
  npm run ios
  # Automatically connects via http://localhost:5000/api
  ```
- **Run on Physical Phone via Expo Go**:
  1. Install **Expo Go** from Google Play Store or Apple App Store.
  2. Scan the QR code displayed in your terminal.
  3. Ensure your phone and development machine are connected to the same Wi-Fi network.

---

## 🌐 API Host Configuration
In `mobile/src/api/mobileApi.js`, the app automatically chooses the correct address:
- **Android Emulator**: `http://10.0.2.2:5000/api`
- **iOS Simulator / Web**: `http://localhost:5000/api`
- **Physical Device**: Call `setCustomApiHost('http://YOUR_LAN_IP:5000/api')` or update `DEFAULT_HOST`.
