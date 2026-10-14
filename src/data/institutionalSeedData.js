// =========================================================================
// INSTITUTIONAL CONFIGURATION & SCHEMAS
// Federal Co-operative College, Ibadan (FCC Ibadan)
// All data records are loaded dynamically from the SQLite/Laravel Database
// =========================================================================

export const INSTITUTION = {
  name: "Federal Co-operative College, Ibadan",
  shortName: "FCC Ibadan",
  motto: "Pioneering Co-operative Excellence & Technological Advancement",
  established: 1943,
  campus: "Eleyele, Ibadan, Oyo State, Nigeria",
  systemVersion: "v4.8-LSP Enterprise (Localhost Edition)",
  currentSession: "2026/2027 Academic Session",
  currentSemester: "Second Semester",
  todayHours: "08:00 AM – 08:00 PM (Extended Exam Hours: 24/7 Virtual Hub)"
};

// =========================================================================
// 1. MULTI-BRANCH CAMPUS LIBRARIES CONFIG
// =========================================================================
export const BRANCHES = [
  { id: "BR-MAIN", name: "Main Campus Library (Prof. Hezekiah Complex)", code: "MAIN", floors: 3, capacity: 650, location: "Central Campus Quadrangle", hours: "08:00 AM - 08:00 PM" },
  { id: "BR-ENG", name: "Faculty of Engineering Library", code: "ENG", floors: 2, capacity: 250, location: "Engineering Block B, Level 1", hours: "08:30 AM - 06:00 PM" },
  { id: "BR-SCI", name: "Faculty of Science & Computing Library", code: "SCI", floors: 2, capacity: 300, location: "Science Complex, East Wing", hours: "08:00 AM - 07:00 PM" },
  { id: "BR-MED", name: "Medical & Health Sciences Library", code: "MED", floors: 2, capacity: 180, location: "Health Tech Pavilion", hours: "08:00 AM - 09:00 PM" },
  { id: "BR-LAW", name: "Law & Administrative Library", code: "LAW", floors: 1, capacity: 150, location: "Management Sciences Complex", hours: "08:30 AM - 05:30 PM" },
  { id: "BR-DIGI", name: "E-Library & Virtual Innovation Commons", code: "ELIB", floors: 2, capacity: 400, location: "ICT Directorate Centre", hours: "24 Hours (Biometric Gate)" },
  { id: "BR-RES", name: "Postgraduate & Research Depository", code: "RES", floors: 1, capacity: 100, location: "Senate Building Annex", hours: "09:00 AM - 05:00 PM" }
];

// =========================================================================
// 2. PATRON POLICY RULES (CONFIGURED BY ADMIN)
// =========================================================================
export const PATRON_POLICIES = {
  student: {
    maxLoans: 5,
    loanPeriodDays: 14,
    renewalsAllowed: 2,
    finePerDay: 100,
    reserveMax: 3,
    requiresDirectPayment: false
  },
  lecturer: {
    maxLoans: 12,
    loanPeriodDays: 60,
    renewalsAllowed: 4,
    finePerDay: 0,
    reserveMax: 10,
    requiresDirectPayment: false
  },
  researcher: {
    maxLoans: 15,
    loanPeriodDays: 90,
    renewalsAllowed: 5,
    finePerDay: 0,
    reserveMax: 10,
    requiresDirectPayment: false
  },
  guest: {
    maxLoans: 2,
    loanPeriodDays: 7,
    renewalsAllowed: 1,
    finePerDay: 200,
    reserveMax: 1,
    requiresDirectPayment: false
  }
};

// =========================================================================
// 3. CLASSIFICATION SYSTEMS (DDC, LCC, LOCAL)
// =========================================================================
export const CLASSIFICATION_SYSTEMS = [
  {
    id: "CLASS-DDC",
    name: "Dewey Decimal Classification (DDC)",
    shortCode: "DDC",
    description: "Universal classification using numerical codes from 000 to 999. Widely used in public and school libraries.",
    active: true,
    topClasses: [
      { code: "000", label: "Computer Science, Information & General Works" },
      { code: "100", label: "Philosophy & Psychology" },
      { code: "200", label: "Religion" },
      { code: "300", label: "Social Sciences" },
      { code: "400", label: "Language" },
      { code: "500", label: "Natural Sciences & Mathematics" },
      { code: "600", label: "Technology & Applied Sciences" },
      { code: "700", label: "Arts & Recreation" },
      { code: "800", label: "Literature" },
      { code: "900", label: "History & Geography" }
    ]
  },
  {
    id: "CLASS-LCC",
    name: "Library of Congress Classification (LCC)",
    shortCode: "LCC",
    description: "Alphanumeric system developed by the Library of Congress. Standard for academic and research libraries.",
    active: true,
    topClasses: [
      { code: "A", label: "General Works" },
      { code: "B", label: "Philosophy, Psychology, Religion" },
      { code: "C", label: "Auxiliary Sciences of History" },
      { code: "D", label: "World History" },
      { code: "E-F", label: "American History" },
      { code: "G", label: "Geography, Anthropology, Recreation" },
      { code: "H", label: "Social Sciences" },
      { code: "J", label: "Political Science" },
      { code: "K", label: "Law" },
      { code: "L", label: "Education" },
      { code: "M", label: "Music" },
      { code: "N", label: "Fine Arts" },
      { code: "P", label: "Language and Literature" },
      { code: "Q", label: "Science" },
      { code: "R", label: "Medicine" },
      { code: "S", label: "Agriculture" },
      { code: "T", label: "Technology" },
      { code: "U", label: "Military Science" },
      { code: "V", label: "Naval Science" },
      { code: "Z", label: "Library Science, Information Resources" }
    ]
  },
  {
    id: "CLASS-LOCAL",
    name: "FCC Ibadan Local Classification",
    shortCode: "FCC-LC",
    description: "Custom in-house classification designed for the specific departmental structure of Federal Co-operative College, Ibadan.",
    active: true,
    topClasses: [
      { code: "FCC-CEM", label: "Co-operative Economics & Management" },
      { code: "FCC-CSC", label: "Computer Science & IT" },
      { code: "FCC-BNF", label: "Banking & Finance" },
      { code: "FCC-AGE", label: "Agricultural Extension & Management" },
      { code: "FCC-EEE", label: "Electrical & Computer Engineering" },
      { code: "FCC-GEN", label: "General & Reference Works" },
      { code: "FCC-THS", label: "Theses & Dissertations" },
      { code: "FCC-SRL", label: "Serials & Periodicals" }
    ]
  }
];

// =========================================================================
// 4. ABOUT THE LIBRARY
// =========================================================================
export const LIBRARY_INFO = {
  description: "The Federal Co-operative College Library, Ibadan, is the primary academic and research depository of FCC Ibadan Nigeria's apex institution for cooperative education, established in 1943. The library holds physical and digital volumes spanning cooperative economics, agricultural sciences, banking and finance, computer science, and engineering.",
  mission: "To support the academic mission of Federal Co-operative College, Ibadan by providing timely, equitable, and comprehensive access to information resources that inspire research, scholarship, lifelong learning, and cooperative values.",
  vision: "To be the foremost cooperative and agricultural knowledge hub in West Africa, recognised for excellence in information services, innovative digital delivery, and transformative support of scholarly inquiry.",
  rules: [
    "Silence must be maintained in all reading rooms and research sections.",
    "Library cards must be presented at the circulation desk for all borrowing transactions.",
    "Food and drinks are strictly prohibited inside the library building.",
    "Mobile phones must be switched to silent mode. No voice calls inside the reading halls.",
    "A maximum of 5 books may be borrowed at any one time by undergraduate students.",
    "Borrowed materials must be returned on or before the due date to avoid accumulation of fines.",
    "No library materials may be removed from the building without proper circulation desk processing.",
    "Damage or loss of library materials attracts replacement cost plus an administrative surcharge.",
    "Users must present a valid FCC ID card or library card for entry after 6:00 PM.",
    "The library reserves the right to search bags upon entry and exit."
  ],
  openingHours: [
    { day: "Monday – Friday", hours: "08:00 AM - 08:00 PM" },
    { day: "Saturday", hours: "09:00 AM – 05:00 PM" },
    { day: "Sunday", hours: "12:00 PM – 06:00 PM" },
    { day: "Public Holidays", hours: "Closed (Virtual Hub: 24/7)" },
    { day: "Exam Period (Extended)", hours: "24 Hours with Biometric Access" }
  ],
  contactInfo: {
    address: "Federal Co-operative College, Eleyele Road, Ibadan, Oyo State, Nigeria",
    phone: "+234 (0) 2 241 0183",
    email: "library@fccibadanlibrary.com.ng",
    website: "https://fccibadanlibrary.com.ng",
    librarian: "Dr. Mrs. A. Balogun (Chief College Librarian)",
    librarianEmail: "librarian@fccibadanlibrary.com.ng"
  },
  departments: [
    { name: "Circulation & Lending Services", head: "Mr. T. Alabi", location: "Ground Floor, Main Library" },
    { name: "Cataloguing & Classification", head: "Mrs. F. Oyelaran", location: "Floor 1, Main Library" },
    { name: "Reference & Research Services", head: "Dr. O. Adeola", location: "Floor 2, Main Library" },
    { name: "E-Library & Digital Services", head: "Mr. K. Fashola", location: "E-Library Hub, ICT Block" },
    { name: "Serials & Periodicals", head: "Miss A. Adekoya", location: "Floor 3, Main Library" },
    { name: "Institutional Repository", head: "Mr. B. Okafor", location: "Postgraduate Depository" }
  ],
  services: [
    "Physical & Digital Lending (Circulation)",
    "Online Public Access Catalogue (OPAC)",
    "Inter-Library Loan (ILL) Services",
    "Institutional Repository & Theses Archive",
    "Study Room & Seminar Suite Booking",
    "AI Smart Reference Librarian (24/7)",
    "Plagiarism Detection & Turnitin Integration",
    "DOI / ISBN Resolution & Metadata Lookup",
    "Course Reserve Management",
    "Graduation Clearance Verification",
    "Bibliographic Instruction & Information Literacy",
    "Barcode & QR Code Generation Services"
  ]
};

// =========================================================================
// 5. SYSTEM OPERATIONAL KPI METRICS
// =========================================================================
export const SYSTEM_HEALTH_METRICS = {
  overallHealth: "Healthy",
  apiLatencyMs: 12,
  databaseStatus: "Online (SQLite Database Connected)",
  searchEngineStatus: "Healthy (Database Direct Search)",
  redisCacheStatus: "Active",
  storageHealth: "Healthy",
  aiLibrarianService: "Online",
  broadcastChannelSync: "Active (Localhost Node Connected)",
  lastBackupTime: "Automated Daily",
  totalCatalogueRecords: 0,
  totalCatalogRecords: 0,
  totalPhysicalCopies: 0,
  availableCopies: 0,
  borrowedCopies: 0,
  overdueLoans: 0,
  digitalResources: 0,
  registeredPatrons: 0,
  activePatrons: 0,
  booksOnLoan: 0,
  activeLoansCount: 0,
  overdueItems: 0,
  activeReservations: 0,
  digitalResourcesCount: 0,
  repositoryItemsCount: 0,
  totalAuthors: 0,
  totalPublishers: 0,
  totalSubjects: 0,
  borrowingTrends: [],
  resourcesByCategory: [],
  mostBorrowed: []
};

// =========================================================================
// 6. DYNAMIC DATABASE ENTITY REGISTERS (All fetched from Database API)
// =========================================================================
export const INITIAL_COURSES = [];
export const INITIAL_PATRONS = [];
export const INITIAL_BOOKS = [];
export const INITIAL_LOANS = [];
export const INITIAL_READING_LISTS = [];
export const INITIAL_CONTINUE_READING = [];
export const INITIAL_RESERVATIONS = [];
export const INITIAL_STUDY_ROOMS = [];
export const INITIAL_ROOM_BOOKINGS = [];
export const INITIAL_THESES = [];
export const INITIAL_NOTIFICATIONS = [];
export const INITIAL_EVENTS = [];
export const INITIAL_ANNOUNCEMENTS = [];
export const INITIAL_PARTNER_LIBRARIES = [];
export const INITIAL_ACQUISITIONS = [];
export const INITIAL_SERIALS = [];
export const INITIAL_AUDIT_LOGS = [];
export const INITIAL_AUTHORS = [];
export const INITIAL_SUBJECTS = [];
export const INITIAL_LOCATIONS = [];
export const INITIAL_FINES = [];
export const INITIAL_ITEM_COPIES = [];
export const INITIAL_FAVORITES = [];
export const INITIAL_FULL_ANNOUNCEMENTS = [];
export const OPENALEX_SEED_RESEARCH = [];
