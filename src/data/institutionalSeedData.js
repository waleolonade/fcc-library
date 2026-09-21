// =========================================================================
// INSTITUTIONAL SEED DATA & MOCK REGISTERS (ENTERPRISE EDITION)
// Federal Co-operative College, Ibadan (FCC Ibadan) & Multi-Campus Library System
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
// 1. MULTI-BRANCH CAMPUS LIBRARIES
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
// 2. ACADEMIC COURSES & SYLLABUS READING LISTS
// =========================================================================
export const INITIAL_COURSES = [
  {
    code: "CSC 301",
    title: "Database Systems & Distributed Architectures",
    department: "Computer Science",
    faculty: "Faculty of Science & Computing",
    level: "ND II / HND I",
    lecturer: "Dr. K. E. Okonjo",
    syllabus: "Relational modeling, distributed ACID transactions, Raft consensus, query optimization, PostgreSQL replication, NoSQL and vector indexing for AI retrieval.",
    requiredBookIds: ["FCC-B002", "FCC-B005"],
    recommendedBookIds: ["FCC-B007"],
    pastQuestions: [
      { year: 2025, title: "CSC 301 Second Semester Examination (2025)", file: "csc301_exam_2025.pdf", size: "1.4 MB" },
      { year: 2024, title: "CSC 301 Second Semester Examination (2024)", file: "csc301_exam_2024.pdf", size: "1.2 MB" },
      { year: 2023, title: "CSC 301 Supplementary Exam Papers (2023)", file: "csc301_exam_2023.pdf", size: "1.1 MB" }
    ],
    lectureMaterials: [
      { week: 1, title: "Week 1-3: Relational Algebra & SQL Query Tuning", file: "csc301_week1_3.pdf" },
      { week: 4, title: "Week 4-7: Distributed Transactions & Raft Protocol", file: "csc301_week4_7.pdf" },
      { week: 8, title: "Week 8-12: Vector Databases & LLM Embedding Indexing", file: "csc301_week8_12.pdf" }
    ]
  },
  {
    code: "EEE 305",
    title: "Digital Electronics & Embedded Microcontrollers",
    department: "Computer Engineering",
    faculty: "Faculty of Engineering",
    level: "ND II",
    lecturer: "Engr. Dr. T. J. Adeleke",
    syllabus: "Boolean algebra, combinational logic design, synchronous sequential circuits, FPGA HDL modeling, ARM Cortex microcontroller architectures and sensor interfacing.",
    requiredBookIds: ["FCC-B008"],
    recommendedBookIds: ["FCC-B002"],
    pastQuestions: [
      { year: 2025, title: "EEE 305 Semester Examination (2025)", file: "eee305_exam_2025.pdf", size: "1.6 MB" },
      { year: 2024, title: "EEE 305 Mid-Semester Assessment (2024)", file: "eee305_exam_2024.pdf", size: "980 KB" }
    ],
    lectureMaterials: [
      { week: 1, title: "Microcontroller Bus Architecture & Interrupt Handling", file: "eee305_lectures.pdf" }
    ]
  },
  {
    code: "CPE 311",
    title: "Computer Architecture & Organization",
    department: "Computer Engineering",
    faculty: "Faculty of Engineering",
    level: "HND I",
    lecturer: "Prof. S. N. Varma",
    syllabus: "RISC-V ISA design, superscalar pipelining, cache memory hierarchies, virtual memory translation, DMA controllers, and GPU compute units.",
    requiredBookIds: ["FCC-B005", "FCC-B008"],
    recommendedBookIds: ["FCC-B002"],
    pastQuestions: [
      { year: 2025, title: "CPE 311 Main Examination (2025)", file: "cpe311_exam_2025.pdf", size: "1.8 MB" },
      { year: 2024, title: "CPE 311 Main Examination (2024)", file: "cpe311_exam_2024.pdf", size: "1.5 MB" }
    ],
    lectureMaterials: [
      { week: 1, title: "Pipelining Hazards & Branch Prediction Algorithms", file: "cpe311_pipelining.pdf" }
    ]
  },
  {
    code: "CEM 411",
    title: "Advanced Co-operative Management & Digital E-Commerce",
    department: "Co-operative Economics & Management",
    faculty: "Faculty of Management Sciences",
    level: "HND II",
    lecturer: "Prof. A. O. Adebayo",
    syllabus: "Strategic governance of multi-purpose agricultural unions, statutory reserve compliance under CBN/Federal edicts, fintech cooperative credit syndicates and fair-trade value chains.",
    requiredBookIds: ["FCC-B001", "FCC-B006"],
    recommendedBookIds: ["FCC-B004", "FCC-B003"],
    pastQuestions: [
      { year: 2025, title: "CEM 411 Final Year Examination (2025)", file: "cem411_exam_2025.pdf", size: "2.1 MB" },
      { year: 2024, title: "CEM 411 Final Year Examination (2024)", file: "cem411_exam_2024.pdf", size: "1.9 MB" }
    ],
    lectureMaterials: [
      { week: 1, title: "Statutory Reserves, Liquidity Ratios & Bye-law Compliance", file: "cem411_reserves.pdf" },
      { week: 5, title: "Agronomic Export Syndication & Currency Hedging", file: "cem411_syndication.pdf" }
    ]
  },
  {
    code: "BNF 302",
    title: "Agricultural Credit & Micro-Finance Banking",
    department: "Banking & Finance",
    faculty: "Faculty of Management Sciences",
    level: "HND I",
    lecturer: "Chief (Mrs.) Folake Sanusi",
    syllabus: "Credit risk scoring for smallholder farmers, non-performing loan work-outs, Basel III microfinance prudential ratios, and warehouse receipt financing.",
    requiredBookIds: ["FCC-B003"],
    recommendedBookIds: ["FCC-B001"],
    pastQuestions: [
      { year: 2025, title: "BNF 302 Examination Papers (2025)", file: "bnf302_exam_2025.pdf", size: "1.3 MB" }
    ],
    lectureMaterials: [
      { week: 1, title: "Micro-Credit Risk Analysis & Collateral Subsitution", file: "bnf302_notes.pdf" }
    ]
  },
  {
    code: "AGE 201",
    title: "Principles of Agricultural Extension & Rural Sociology",
    department: "Agricultural Extension & Management",
    faculty: "Faculty of Agricultural Sciences",
    level: "ND II",
    lecturer: "Engr. T. J. Adeleke",
    syllabus: "Diffusion of innovations, farmer field schools, cooperative mobilization, post-harvest blight mitigation, and community-led agrarian development.",
    requiredBookIds: ["FCC-B004"],
    recommendedBookIds: ["FCC-B001"],
    pastQuestions: [
      { year: 2025, title: "AGE 201 Examination Papers (2025)", file: "age201_exam_2025.pdf", size: "1.1 MB" }
    ],
    lectureMaterials: [
      { week: 1, title: "Participatory Rural Appraisal (PRA) Techniques", file: "age201_pra.pdf" }
    ]
  }
];

// =========================================================================
// 3. COMPLETE INSTITUTIONAL PATRONS (STUDENTS & STAFF) WITH ADMIN-GENERATED PINS
// =========================================================================
export const INITIAL_PATRONS = [
  {
    id: "PAT-001",
    matric: "FCC/CEM/2024/042",
    libraryId: "LIB-FCC-42091",
    name: "Wale Olonade",
    role: "student",
    category: "Undergraduate Scholar",
    department: "Co-operative Economics & Management",
    faculty: "Faculty of Management Sciences",
    level: "HND II (Final Year)",
    programme: "Higher National Diploma",
    email: "w.olonade@student.fccibadan.edu.ng",
    phone: "+234 803 491 8821",
    pin: "1234", // Admin generated / changeable by Admin
    pinCreatedAt: "2026-09-01T10:00:00Z",
    status: "Active",
    borrowQuota: 5,
    activeLoansCount: 1,
    overdueCount: 0,
    outstandingFines: 0,
    clearanceStatus: "Pending Library Signature",
    registeredBranch: "Main Campus Library",
    validUntil: "2027-11-30",
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    researchInterests: ["Cooperative Fintech", "Smallholder Agronomy", "Micro-Credit Syndicates"],
    orcid: "0009-0004-8192-4410",
    profileCompletion: 92
  },
  {
    id: "PAT-002",
    matric: "FCC/CEM/2024/011",
    libraryId: "LIB-FCC-42092",
    name: "Ibrahim Adekunle",
    role: "student",
    category: "Undergraduate Scholar",
    department: "Co-operative Economics & Management",
    faculty: "Faculty of Management Sciences",
    level: "HND II (Final Year)",
    programme: "Higher National Diploma",
    email: "i.adekunle@student.fccibadan.edu.ng",
    phone: "+234 812 345 6789",
    pin: "5678",
    pinCreatedAt: "2026-09-01T10:00:00Z",
    status: "Active",
    borrowQuota: 5,
    activeLoansCount: 1,
    overdueCount: 1,
    outstandingFines: 300,
    clearanceStatus: "Fines Pending Clearance",
    registeredBranch: "Main Campus Library",
    validUntil: "2027-11-30",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    researchInterests: ["Agricultural Credit", "Rural Cooperatives"],
    orcid: "0009-0002-1192-3321",
    profileCompletion: 85
  },
  {
    id: "PAT-003",
    matric: "FCC/CSC/2024/108",
    libraryId: "LIB-FCC-42093",
    name: "Chukwudi Okafor",
    role: "student",
    category: "Undergraduate Scholar",
    department: "Computer Science",
    faculty: "Faculty of Science & Computing",
    level: "ND II",
    programme: "National Diploma",
    email: "c.okafor@student.fccibadan.edu.ng",
    phone: "+234 809 888 1234",
    pin: "4321",
    pinCreatedAt: "2026-09-02T11:00:00Z",
    status: "Active",
    borrowQuota: 5,
    activeLoansCount: 1,
    overdueCount: 0,
    outstandingFines: 0,
    clearanceStatus: "Active Student",
    registeredBranch: "E-Library & Virtual Commons",
    validUntil: "2027-08-31",
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    researchInterests: ["Distributed Systems", "Database Optimization", "AI Search"],
    orcid: "0009-0008-3341-9012",
    profileCompletion: 95
  },
  {
    id: "PAT-004",
    matric: "FCC/BNF/2024/077",
    libraryId: "LIB-FCC-42094",
    name: "Amina Bello",
    role: "student",
    category: "Undergraduate Scholar",
    department: "Banking & Finance",
    faculty: "Faculty of Management Sciences",
    level: "HND I",
    programme: "Higher National Diploma",
    email: "a.bello@student.fccibadan.edu.ng",
    phone: "+234 806 777 9900",
    pin: "2468",
    pinCreatedAt: "2026-09-03T09:30:00Z",
    status: "Active",
    borrowQuota: 5,
    activeLoansCount: 0,
    overdueCount: 0,
    outstandingFines: 0,
    clearanceStatus: "Active Student",
    registeredBranch: "Main Campus Library",
    validUntil: "2028-06-30",
    photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    researchInterests: ["Microfinance Risk", "Fintech Innovations"],
    orcid: "0009-0001-4455-7788",
    profileCompletion: 88
  }
];

// =========================================================================
// 4. PATRON POLICY RULES (CONFIGURED BY ADMIN)
// =========================================================================
export const PATRON_POLICIES = {
  student: {
    maxLoans: 5,
    loanPeriodDays: 14,
    renewalsAllowed: 2,
    finePerDay: 100, // Naira
    reserveMax: 3,
    requiresDirectPayment: false // Students do NOT pay direct online; admin waives/manages institutional clearance
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
// 5. MASTER CATALOGUE HOLDINGS (PHYSICAL & DIGITAL)
// =========================================================================
export const INITIAL_BOOKS = [
  {
    id: "FCC-B001",
    title: "Principles and Practice of Co-operative Economics",
    subtitle: "Empirical Models, Statutory Reserves & Apex Syndicate Accounting",
    author: "Prof. A. O. Adebayo",
    authorCredentials: "Ph.D., FSNA, Professor of Cooperative Econometrics",
    authorAffiliation: "Federal Co-operative College, Ibadan",
    coAuthors: "Dr. B. A. Olowookere, Chief M. K. Balogun",
    isbn: "978-978-49021-1-4",
    issn: "",
    callNumber: "HD2963 .A34 2024",
    subject: "Co-operative Economics",
    department: "Co-operative Economics & Management",
    courseCode: "CEM 411",
    targetLevel: "HND II",
    branch: "Main Campus Library (Prof. Hezekiah Complex)",
    shelfLocation: "Floor 2 • Aisle 4 • Shelf 12B",
    copiesTotal: 12,
    copiesAvailable: 7,
    isDigital: true,
    pdfPages: 384,
    fileSize: "6.4 MB",
    fileName: "principles-of-cooperative-economics.pdf",
    rating: 4.9,
    citations: 84,
    doi: "10.1016/j.coop.2024.01.002",
    publisher: "FCC Ibadan Academic Press",
    year: 2024,
    edition: "4th Revised Edition",
    abstract: "Comprehensive analysis of modern agrarian credit unions, apex cooperatives, and fiscal regulatory mechanisms in West Africa with empirical data from Nigerian apexes.",
    chapters: [
      { title: "Chapter 1: Foundational Frameworks of Raiffeisen & Schulze Credit Unions", page: 1 },
      { title: "Chapter 2: Financial Ratios & Liquidity Stress in Cooperatives", page: 48 },
      { title: "Chapter 3: Risk Hedging & Apex Syndicate Accounting", page: 112 },
      { title: "Chapter 4: Modern Statutory Reserves & Audit Protocols", page: 230 },
      { title: "Chapter 5: Digital Value Chains & Fair-Trade Settlement", page: 310 }
    ],
    reviews: [
      { user: "Dr. K. Okonjo", rating: 5, comment: "The definitive textbook for cooperative accounting in Sub-Saharan Africa." },
      { user: "Wale Olonade (Scholar)", rating: 5, comment: "Chapter 3 on liquidity stress testing helped directly with my final year project." }
    ]
  },
  {
    id: "FCC-B002",
    title: "Distributed Database Systems & High-Throughput SQL",
    subtitle: "Consensus Protocols, Multi-Master Replication & Cloud Vector Indices",
    author: "Dr. K. E. Okonjo & M. Stone",
    authorCredentials: "Ph.D., Lead Systems Architect & ACM Fellow",
    authorAffiliation: "Federal Co-operative College & MIT Distributed Lab",
    coAuthors: "Prof. S. N. Varma",
    isbn: "978-0-13-449416-6",
    issn: "",
    callNumber: "QA76.9.D3 O38 2025",
    subject: "Computer Science",
    department: "Computer Science",
    courseCode: "CSC 301",
    targetLevel: "ND II / HND I",
    branch: "Faculty of Science & Computing Library",
    shelfLocation: "Floor 1 • Aisle 2 • Shelf 05A",
    copiesTotal: 8,
    copiesAvailable: 2,
    isDigital: true,
    pdfPages: 512,
    fileSize: "8.8 MB",
    fileName: "distributed-database-systems.pdf",
    rating: 4.8,
    citations: 192,
    doi: "10.1145/3318464.3389700",
    publisher: "Prentice Hall International",
    year: 2025,
    edition: "3rd Edition",
    abstract: "Covers consensus protocols, Raft, multi-region replication, transaction isolation levels, and ACID compliance under network partitions with practical Postgres/Cassandra case studies.",
    chapters: [
      { title: "Chapter 1: Transaction Processing & Serializability Theory", page: 1 },
      { title: "Chapter 2: The Raft Consensus Algorithm & Quorum Replications", page: 65 },
      { title: "Chapter 3: Distributed Query Optimization & Indexing", page: 140 },
      { title: "Chapter 4: PostgreSQL Multi-Master Architectures & CDC Pipelines", page: 245 },
      { title: "Chapter 5: Vector Indexing (HNSW) for AI Retrieval", page: 380 }
    ],
    reviews: [
      { user: "Chukwudi Okafor", rating: 5, comment: "Covers both theory and real-world Postgres internals with high clarity." }
    ]
  },
  {
    id: "FCC-B003",
    title: "Macro-prudential Banking Reforms & Risk Hedging",
    subtitle: "Non-Performing Loan Resolution, Basel III Capital Adequacy & Microfinance",
    author: "Chief (Mrs.) Folake Sanusi",
    authorCredentials: "M.Sc., FCIB, Fellow of the Chartered Institute of Bankers",
    authorAffiliation: "Federal Co-operative College, Ibadan",
    coAuthors: "H. L. Babatunde",
    isbn: "978-978-8120-44-1",
    issn: "",
    callNumber: "HG1601 .S26 2023",
    subject: "Banking & Finance",
    department: "Banking & Finance",
    courseCode: "BNF 302",
    targetLevel: "HND I",
    branch: "Law & Administrative Library",
    shelfLocation: "Floor 2 • Aisle 1 • Shelf 08C",
    copiesTotal: 15,
    copiesAvailable: 11,
    isDigital: false,
    pdfPages: 290,
    fileSize: "4.2 MB",
    fileName: "macro-prudential-banking-reforms.pdf",
    rating: 4.6,
    citations: 45,
    doi: "10.1080/09603107.2023.119",
    publisher: "University of Ibadan Press",
    year: 2023,
    edition: "2nd Edition",
    abstract: "Examination of non-performing loan management, Basel III framework implementations, and sub-Saharan microfinance resilience amid inflationary pressures.",
    chapters: [
      { title: "Chapter 1: Evolution of Nigerian Banking Regulatory Directives", page: 1 },
      { title: "Chapter 2: Basel III Capital Adequacy & Liquidity Coverage Ratios", page: 50 },
      { title: "Chapter 3: Stress-Testing Credit Portfolios in Developing Markets", page: 120 },
      { title: "Chapter 4: Derivatives & FX Forward Hedging for Agribusinesses", page: 200 }
    ]
  },
  {
    id: "FCC-B004",
    title: "Cocoa Agronomy & Smallholder Value-Chain Mechanics",
    subtitle: "Soil Biochemistry, Pest Mitigation & Cooperative Export Logistics",
    author: "Engr. T. J. Adeleke",
    authorCredentials: "Ph.D., Agricultural Extension Specialist",
    authorAffiliation: "Federal Co-operative College, Ibadan",
    coAuthors: "Dr. O. Alabi",
    isbn: "978-978-3012-88-0",
    issn: "",
    callNumber: "SB267 .A43 2024",
    subject: "Agricultural Extension",
    department: "Agricultural Extension & Management",
    courseCode: "AGE 201",
    targetLevel: "ND II",
    branch: "Main Campus Library (Prof. Hezekiah Complex)",
    shelfLocation: "Floor 3 • Aisle 6 • Shelf 19A",
    copiesTotal: 6,
    copiesAvailable: 0,
    isDigital: true,
    pdfPages: 440,
    fileSize: "7.9 MB",
    fileName: "cocoa-agronomy-value-chain.pdf",
    rating: 4.7,
    citations: 63,
    doi: "10.1007/s10460-024-0982-1",
    publisher: "Agronomic Research Publications",
    year: 2024,
    edition: "1st Edition",
    abstract: "Soil biochemistry, fungal blight mitigation, post-harvest solar drying paradigms, and cooperative export consortium tactics for premium West African cocoa beans.",
    chapters: [
      { title: "Chapter 1: Soil Pedology and Micro-nutrient Regimes for Theobroma Cacao", page: 1 },
      { title: "Chapter 2: Integrated Pest Management & Biological Control Agents", page: 85 },
      { title: "Chapter 3: Fermentation Science and Flavor Precursor Synthesis", page: 190 },
      { title: "Chapter 4: Fair-Trade Certification and Cooperative Export Logistics", page: 310 }
    ]
  },
  {
    id: "FCC-B005",
    title: "Artificial Intelligence in Academic Information Retrieval",
    subtitle: "Vector Search, RAG Pipelines, MARC21 Crosswalks & Transformer Indices",
    author: "Dr. O. J. Fatoyinbo & Prof. S. N. Varma",
    authorCredentials: "Ph.D., Lead AI Researcher & IEEE Senior Member",
    authorAffiliation: "Federal Co-operative College & Indian Institute of Technology",
    coAuthors: "Dr. K. E. Okonjo",
    isbn: "978-1-5090-4822-9",
    issn: "",
    callNumber: "Z666.5 .F38 2026",
    subject: "Computer Science",
    department: "Computer Science",
    courseCode: "CSC 301",
    targetLevel: "ND II / HND I",
    branch: "E-Library & Virtual Commons",
    shelfLocation: "Floor 1 • Aisle 3 • Shelf 02B",
    copiesTotal: 10,
    copiesAvailable: 6,
    isDigital: true,
    pdfPages: 360,
    fileSize: "5.5 MB",
    fileName: "ai-in-academic-information-retrieval.pdf",
    rating: 4.9,
    citations: 112,
    doi: "10.1109/TKDE.2026.1049281",
    publisher: "IEEE Computer Society Press",
    year: 2026,
    edition: "1st Edition",
    abstract: "Dense vector retrieval, retrieval-augmented generation (RAG) for academic citations, semantic MARC/Dublin Core cross-walking, and transformer-based discovery indices.",
    chapters: [
      { title: "Chapter 1: Lexical BM25 vs Semantic Vector Embedding Paradigms", page: 1 },
      { title: "Chapter 2: RAG Pipelines & Scholarly Citation Grounding", page: 60 },
      { title: "Chapter 3: LLM Guardrails & Hallucination Prevention in Libraries", page: 140 },
      { title: "Chapter 4: Automated Cataloging & Metadata Extraction Protocols", page: 230 }
    ]
  },
  {
    id: "FCC-B006",
    title: "Cooperative Law, Governance & Statutory Auditing in Nigeria",
    subtitle: "A Complete Commentary on the Nigerian Co-operative Societies Act",
    author: "Barrister B. A. Olowookere",
    authorCredentials: "LL.M, BL, Senior Lecturer in Commercial Law",
    authorAffiliation: "Federal Co-operative College, Ibadan",
    coAuthors: "Hon. Justice T. M. Alabi",
    isbn: "978-978-900-112-9",
    issn: "",
    callNumber: "KTL982 .O46 2023",
    subject: "Co-operative Economics",
    department: "Co-operative Economics & Management",
    courseCode: "CEM 411",
    targetLevel: "HND II",
    branch: "Law & Administrative Library",
    shelfLocation: "Floor 2 • Aisle 5 • Shelf 14C",
    copiesTotal: 14,
    copiesAvailable: 9,
    isDigital: true,
    pdfPages: 310,
    fileSize: "4.8 MB",
    fileName: "cooperative-law-governance-nigeria.pdf",
    rating: 4.7,
    citations: 38,
    doi: "10.2139/ssrn.4298102",
    publisher: "Malthouse Law Books",
    year: 2023,
    edition: "5th Edition",
    abstract: "Comprehensive treatise on the Nigerian Co-operative Societies Act, dispute resolution arbitration, bye-law drafting, and director fiduciary duties.",
    chapters: [
      { title: "Chapter 1: Legal Personality and Registration Formalities", page: 1 },
      { title: "Chapter 2: Bye-Law Drafting, Amendments and Enforceability", page: 45 },
      { title: "Chapter 3: Director Fiduciary Obligations and Surcharges", page: 120 },
      { title: "Chapter 4: Winding-Up and Liquidation Protocols", page: 210 }
    ]
  },
  {
    id: "FCC-B007",
    title: "Advanced Computer Networks & Cloud Infrastructure",
    subtitle: "Software-Defined Networking, BGP Routing & Edge Security Protocols",
    author: "Prof. S. N. Varma & Dr. A. Bello",
    authorCredentials: "Ph.D., Senior Network Architect",
    authorAffiliation: "Federal Co-operative College & Cisco Networking Academy",
    coAuthors: "Engr. Dr. T. J. Adeleke",
    isbn: "978-0-13-892100-2",
    issn: "",
    callNumber: "TK5105.5 .V37 2025",
    subject: "Computer Science",
    department: "Computer Engineering",
    courseCode: "CPE 311",
    targetLevel: "HND I",
    branch: "Faculty of Engineering Library",
    shelfLocation: "Floor 1 • Aisle 4 • Shelf 10A",
    copiesTotal: 9,
    copiesAvailable: 5,
    isDigital: true,
    pdfPages: 480,
    fileSize: "7.2 MB",
    fileName: "advanced-computer-networks.pdf",
    rating: 4.8,
    citations: 145,
    doi: "10.1109/MCOM.2025.889102",
    publisher: "Pearson Higher Education",
    year: 2025,
    edition: "2nd Edition",
    abstract: "In-depth treatment of SDN controllers, OpenFlow, zero-trust network architectures, multi-tenant BGP peering, and edge computing for distributed data pipelines.",
    chapters: [
      { title: "Chapter 1: Physical & Data Link Layer Carrier Technologies", page: 1 },
      { title: "Chapter 2: BGP Routing, Anycast & AS Topology Modeling", page: 80 },
      { title: "Chapter 3: Software-Defined Networking & OpenFlow Planes", page: 180 },
      { title: "Chapter 4: Zero-Trust Network Access (ZTNA) & Cryptographic Handshakes", page: 310 }
    ]
  },
  {
    id: "FCC-B008",
    title: "Microcontroller System Design & Embedded C Programming",
    subtitle: "ARM Cortex-M Hardware Timers, DMA Buffering & Real-Time Kernels",
    author: "Engr. Dr. K. O. Adeleke",
    authorCredentials: "Ph.D., COREN Registered Engineer",
    authorAffiliation: "Faculty of Engineering, FCC Ibadan",
    coAuthors: "Engr. T. J. Adeleke",
    isbn: "978-978-5501-99-8",
    issn: "",
    callNumber: "TJ223.M53 A34 2024",
    subject: "Computer Engineering",
    department: "Computer Engineering",
    courseCode: "EEE 305",
    targetLevel: "ND II",
    branch: "Faculty of Engineering Library",
    shelfLocation: "Floor 2 • Aisle 2 • Shelf 04B",
    copiesTotal: 10,
    copiesAvailable: 4,
    isDigital: true,
    pdfPages: 390,
    fileSize: "6.1 MB",
    fileName: "microcontroller-system-design.pdf",
    rating: 4.8,
    citations: 72,
    doi: "10.1007/978-3-030-98102-1",
    publisher: "FCC Engineering Academic Press",
    year: 2024,
    edition: "1st Edition",
    abstract: "Practical embedded system engineering using 32-bit ARM microcontrollers, FreeRTOS scheduling, ADC direct memory access, and IoT telemetry over LoRaWAN.",
    chapters: [
      { title: "Chapter 1: ARM Cortex-M Memory Map & Core Registers", page: 1 },
      { title: "Chapter 2: GPIO, Hardware Timers & PWM Waveform Generation", page: 55 },
      { title: "Chapter 3: Interrupt Service Routines & Direct Memory Access (DMA)", page: 130 },
      { title: "Chapter 4: FreeRTOS Real-Time Kernel Tasks & Semaphores", page: 220 }
    ]
  }
];

// =========================================================================
// 6. INITIAL ACTIVE & HISTORICAL BORROWINGS
// =========================================================================
export const INITIAL_LOANS = [
  {
    id: "LN-9821",
    matric: "FCC/CEM/2024/042",
    studentName: "Wale Olonade",
    bookId: "FCC-B001",
    bookTitle: "Principles and Practice of Co-operative Economics",
    author: "Prof. A. O. Adebayo",
    callNumber: "HD2963 .A34 2024",
    barcode: "FCC-CP-00102",
    borrowDate: "2026-09-10",
    dueDate: "2026-09-24", // Due in 6 days (Green status)
    status: "Active",
    fine: 0,
    renewalsCount: 0,
    branch: "Main Campus Library (Prof. Hezekiah Complex)",
    shelfLocation: "Floor 2 • Aisle 4 • Shelf 12B"
  },
  {
    id: "LN-9822",
    matric: "FCC/CEM/2024/042",
    studentName: "Wale Olonade",
    bookId: "FCC-B006",
    bookTitle: "Cooperative Law, Governance & Statutory Auditing in Nigeria",
    author: "Barrister B. A. Olowookere",
    callNumber: "KTL982 .O46 2023",
    barcode: "FCC-CP-00601",
    borrowDate: "2026-09-08",
    dueDate: "2026-09-22", // Due in 4 days (Yellow status)
    status: "Active",
    fine: 0,
    renewalsCount: 1,
    branch: "Law & Administrative Library",
    shelfLocation: "Floor 2 • Aisle 5 • Shelf 14C"
  },
  {
    id: "LN-9823",
    matric: "FCC/CSC/2024/108",
    studentName: "Chukwudi Okafor",
    bookId: "FCC-B002",
    bookTitle: "Distributed Database Systems & High-Throughput SQL",
    author: "Dr. K. E. Okonjo & M. Stone",
    callNumber: "QA76.9.D3 O38 2025",
    barcode: "FCC-CP-00201",
    borrowDate: "2026-09-12",
    dueDate: "2026-09-26",
    status: "Active",
    fine: 0,
    renewalsCount: 0,
    branch: "Faculty of Science & Computing Library",
    shelfLocation: "Floor 1 • Aisle 2 • Shelf 05A"
  },
  {
    id: "LN-9820",
    matric: "FCC/CEM/2024/011",
    studentName: "Ibrahim Adekunle",
    bookId: "FCC-B004",
    bookTitle: "Cocoa Agronomy & Smallholder Value-Chain Mechanics",
    author: "Engr. T. J. Adeleke",
    callNumber: "SB267 .A43 2024",
    barcode: "FCC-CP-00401",
    borrowDate: "2026-08-20",
    dueDate: "2026-09-03", // Overdue by 15 days (Red status)
    status: "Overdue",
    fine: 300,
    renewalsCount: 2,
    branch: "Main Campus Library (Prof. Hezekiah Complex)",
    shelfLocation: "Floor 3 • Aisle 6 • Shelf 19A"
  }
];

// =========================================================================
// 7. STUDENT PERSONAL READING LISTS
// =========================================================================
export const INITIAL_READING_LISTS = [
  {
    id: "RL-001",
    matric: "FCC/CEM/2024/042",
    name: "My Final Year Project (Fintech Cooperatives)",
    description: "Core academic references on apex liquidity models and cooperative member equity accumulation.",
    createdDate: "2026-09-05",
    isPublic: true,
    items: [
      { bookId: "FCC-B001", notes: "Focus on Chapter 3 for apex syndicate formulas." },
      { bookId: "FCC-B006", notes: "Review statutory audit requirements in Nigeria." },
      { bookId: "FCC-B003", notes: "Compare Basel III ratios with Raiffeisen reserves." }
    ]
  },
  {
    id: "RL-002",
    matric: "FCC/CEM/2024/042",
    name: "Machine Learning & AI in Commerce",
    description: "Exploration of vector retrieval algorithms and database architectures.",
    createdDate: "2026-09-12",
    isPublic: false,
    items: [
      { bookId: "FCC-B005", notes: "Important RAG pipeline concepts for AI librarian." },
      { bookId: "FCC-B002", notes: "PostgreSQL distributed query optimization." }
    ]
  }
];

// =========================================================================
// 8. CONTINUE READING HISTORY
// =========================================================================
export const INITIAL_CONTINUE_READING = [
  {
    matric: "FCC/CEM/2024/042",
    bookId: "FCC-B001",
    title: "Principles and Practice of Co-operative Economics",
    author: "Prof. A. O. Adebayo",
    progress: 68,
    lastPage: 261,
    totalPages: 384,
    lastOpened: "Today, 10:14 AM"
  },
  {
    matric: "FCC/CEM/2024/042",
    bookId: "FCC-B005",
    title: "Artificial Intelligence in Academic Information Retrieval",
    author: "Dr. O. J. Fatoyinbo",
    progress: 42,
    lastPage: 151,
    totalPages: 360,
    lastOpened: "Yesterday, 04:30 PM"
  },
  {
    matric: "FCC/CEM/2024/042",
    bookId: "FCC-B007",
    title: "Advanced Computer Networks & Cloud Infrastructure",
    author: "Prof. S. N. Varma",
    progress: 25,
    lastPage: 120,
    totalPages: 480,
    lastOpened: "2 days ago"
  }
];

// =========================================================================
// 9. STUDENT RESERVATIONS
// =========================================================================
export const INITIAL_RESERVATIONS = [
  {
    id: "RES-2026-01",
    matric: "FCC/CEM/2024/042",
    bookId: "FCC-B004",
    title: "Cocoa Agronomy & Smallholder Value-Chain Mechanics",
    author: "Engr. T. J. Adeleke",
    reservedDate: "2026-09-14",
    queuePosition: 1,
    status: "Available", // Waiting, Available, Collected, Expired, Cancelled
    pickupLocation: "Main Campus Library • Circulation Desk Bay 2",
    expiryDate: "2026-09-22"
  },
  {
    id: "RES-2026-02",
    matric: "FCC/CEM/2024/042",
    bookId: "FCC-B002",
    title: "Distributed Database Systems & High-Throughput SQL",
    author: "Dr. K. E. Okonjo",
    reservedDate: "2026-09-16",
    queuePosition: 2,
    status: "Waiting",
    pickupLocation: "Faculty of Science & Computing Library",
    expiryDate: "2026-09-30"
  }
];

// =========================================================================
// 10. STUDY SPACES & BOOKINGS
// =========================================================================
export const INITIAL_STUDY_ROOMS = [
  {
    id: "RM-A101",
    name: "Quiet Research Carrel Alpha",
    type: "Individual Research Pod",
    capacity: 1,
    floor: "Floor 1 • Main Library",
    status: "available",
    facilities: ["High-speed Wi-Fi", "Dedicated Power Outlet", "Ergonomic Mesh Chair", "Adjustable LED Task Lamp", "Sound-dampening Acoustic Paneling"],
    availableTimeSlots: ["08:00 - 10:00", "10:00 - 12:00", "12:00 - 14:00", "14:00 - 16:00", "16:00 - 18:00", "18:00 - 20:00"]
  },
  {
    id: "RM-B204",
    name: "Cooperative Synergy Group Suite",
    type: "Collaborative Study Room",
    capacity: 6,
    floor: "Floor 2 • West Wing",
    status: "available",
    facilities: ["55-inch Ultra HD Presentation Screen", "Magnetic Ceramic Whiteboard", "Conference Table", "Air Conditioning", "USB-C Fast Charging Hub", "High-speed Wi-Fi"],
    availableTimeSlots: ["09:00 - 11:00", "11:00 - 13:00", "13:00 - 15:00", "15:00 - 17:00", "17:00 - 19:00"]
  },
  {
    id: "RM-C302",
    name: "Postgraduate & Defense Seminar Suite",
    type: "Conference & Defense Room",
    capacity: 14,
    floor: "Floor 3 • Senate Wing",
    status: "booked",
    facilities: ["4K Laser Projector", "Wireless Ceiling Mic Array", "Surround Audio", "Lectern with Touch Control", "Air Conditioning", "HD Video Conferencing Cam"],
    availableTimeSlots: ["14:00 - 16:00", "16:00 - 18:00"]
  },
  {
    id: "RM-D105",
    name: "E-Library Multimedia Innovation Pod",
    type: "Digital Media Station",
    capacity: 2,
    floor: "Ground Floor • E-Library Hub",
    status: "available",
    facilities: ["Dual 27-inch 4K Color-Accurate Monitors", "Studio Condenser Mic", "High-Performance Workstation", "Noise-Cancelling Headphones", "Gigabit LAN"],
    availableTimeSlots: ["08:00 - 10:00", "10:00 - 12:00", "12:00 - 14:00", "14:00 - 16:00", "16:00 - 18:00"]
  }
];

export const INITIAL_ROOM_BOOKINGS = [
  {
    id: "BKG-9901",
    matric: "FCC/CEM/2024/042",
    studentName: "Wale Olonade",
    roomId: "RM-A101",
    roomName: "Quiet Research Carrel Alpha",
    date: "2026-09-18",
    timeSlot: "14:00 - 16:00",
    status: "Confirmed",
    checkInCode: "CHK-782"
  }
];

// =========================================================================
// 11. INSTITUTIONAL REPOSITORY THESES & DISSERTATIONS
// =========================================================================
export const INITIAL_THESES = [
  {
    id: "TH-2025-019",
    title: "Impact of Micro-Credit Cooperatives on Cocoa Smallholders in Ondo & Oyo States",
    author: "Adebayo, Samuel T.",
    matric: "FCC/CEM/2023/019",
    year: 2025,
    advisor: "Prof. O. Alabi",
    department: "Co-operative Economics & Management",
    faculty: "Faculty of Management Sciences",
    degree: "Higher National Diploma Dissertation",
    status: "Published", // Draft, Submitted, Under Review, Approved, Published, Rejected, Embargoed
    access: "Open Access Full-Text",
    downloads: 342,
    citations: 14,
    doi: "10.5281/zenodo.10842911",
    fileSize: "5.1 MB",
    fileName: "adebayo_samuel_2025_dissertation.pdf",
    abstract: "Empirical field survey of 420 smallholder farming families across Idanre and Iddo Local Government Areas. Findings demonstrate a 34% income stabilization effect attributable to prompt seasonal micro-credit disbursement from cooperative apex unions."
  },
  {
    id: "TH-2024-088",
    title: "Design of a Decentralized Crop Storage Verification Protocol Using Hedera Hashgraph",
    author: "Nnamdi, Grace C.",
    matric: "FCC/CSC/2023/088",
    year: 2024,
    advisor: "Dr. K. Okonjo",
    department: "Computer Science",
    faculty: "Faculty of Science & Computing",
    degree: "Postgraduate Diploma Project",
    status: "Published",
    access: "Campus Intranet Only",
    downloads: 189,
    citations: 8,
    doi: "10.5281/zenodo.9482012",
    fileSize: "4.6 MB",
    fileName: "nnamdi_grace_2024_project.pdf",
    abstract: "Architects a zero-knowledge cryptographic warehouse receipt verification model for post-harvest grain silos, reducing collateral verification latency from 7 days to sub-second blockchain settlement."
  },
  {
    id: "TH-2024-104",
    title: "Comparative Liquidity Stress Testing of Cooperative Apexes Post-CBN Monetary Edicts",
    author: "Jimoh, Ridwan A.",
    matric: "FCC/BNF/2023/104",
    year: 2024,
    advisor: "Chief (Mrs.) Folake Sanusi",
    department: "Banking & Finance",
    faculty: "Faculty of Management Sciences",
    degree: "Higher National Diploma Dissertation",
    status: "Published",
    access: "Open Access Full-Text",
    downloads: 412,
    citations: 21,
    doi: "10.5281/zenodo.9984120",
    fileSize: "6.2 MB",
    fileName: "jimoh_ridwan_2024_thesis.pdf",
    abstract: "Quantitative stress modeling examining reserve ratios and cash asset drawdowns across five major cooperative federations during cash restriction cycles."
  },
  {
    id: "TH-2026-042",
    title: "Algorithmic Risk Syndication & Apex Liquidity Buffering in Nigerian Agri-Cooperatives",
    author: "Wale Olonade",
    matric: "FCC/CEM/2024/042",
    year: 2026,
    advisor: "Prof. A. O. Adebayo",
    department: "Co-operative Economics & Management",
    faculty: "Faculty of Management Sciences",
    degree: "Higher National Diploma Dissertation",
    status: "Under Review", // Student's active thesis submission in review pipeline
    access: "Pending Departmental Defense & Library Ingestion",
    downloads: 12,
    citations: 0,
    doi: "10.5281/zenodo.fcc.2026.042",
    fileSize: "4.8 MB",
    fileName: "olonade_wale_2026_defense_draft.pdf",
    abstract: "Proposes an automated mathematical framework for cooperative apex liquidity pooling during harvest contraction windows, incorporating real-time stress models across 15 agricultural unions in Western Nigeria."
  }
];

// =========================================================================
// 12. NOTIFICATIONS & PERSONALIZED RESEARCH ALERTS
// =========================================================================
export const INITIAL_NOTIFICATIONS = [
  {
    id: "NOTIF-01",
    matric: "FCC/CEM/2024/042",
    category: "Due Date",
    title: "Book Due in 4 Days",
    message: "Cooperative Law, Governance & Statutory Auditing is due on Sept 22, 2026. You can renew online in 1 click.",
    timestamp: "10 mins ago",
    isRead: false,
    actionUrl: "#/scholar/loans",
    priority: "medium"
  },
  {
    id: "NOTIF-02",
    matric: "FCC/CEM/2024/042",
    category: "Reservation",
    title: "Reserved Book Ready for Pickup",
    message: "Your reserved copy of 'Cocoa Agronomy & Smallholder Value-Chain' is now at the Main Library Circulation Desk.",
    timestamp: "2 hours ago",
    isRead: false,
    actionUrl: "#/scholar/reservations",
    priority: "high"
  },
  {
    id: "NOTIF-03",
    matric: "FCC/CEM/2024/042",
    category: "Research Alert",
    title: "3 New OpenAccess Papers in Cooperative Fintech",
    message: "New research published in Journal of Cleaner Production matching your followed topic 'Cooperative Economics'.",
    timestamp: "Yesterday",
    isRead: true,
    actionUrl: "#/scholar/research",
    priority: "low"
  },
  {
    id: "NOTIF-04",
    matric: "FCC/CEM/2024/042",
    category: "Study Room",
    title: "Study Room Booking Confirmed",
    message: "Quiet Research Carrel Alpha is booked for you today from 14:00 to 16:00. Check-in code: CHK-782.",
    timestamp: "3 hours ago",
    isRead: false,
    actionUrl: "#/scholar/rooms",
    priority: "medium"
  }
];

// =========================================================================
// 13. LIBRARY EVENTS & WORKSHOPS
// =========================================================================
export const INITIAL_EVENTS = [
  {
    id: "EVT-01",
    title: "Academic Research & Citation Management Workshop (APA 7th & BibTeX)",
    category: "Research Training",
    date: "Wednesday, 24 Sept 2026",
    time: "10:00 AM - 12:30 PM",
    venue: "E-Library Multimedia Hall (Level 2)",
    speaker: "Dr. Mrs. A. Balogun (College Librarian)",
    seatsAvailable: 45,
    isRegistered: true,
    description: "Hands-on masterclass for final-year students on automating bibliographies, DOI resolution, and avoiding accidental plagiarism."
  },
  {
    id: "EVT-02",
    title: "OpenAlex & IEEE Xplore Federated Discovery Orientation",
    category: "Information Literacy",
    date: "Friday, 26 Sept 2026",
    time: "02:00 PM - 04:00 PM",
    venue: "Virtual Research Hub (Zoom / Hybrid)",
    speaker: "Mr. T. Alabi (Senior Cataloguer)",
    seatsAvailable: 120,
    isRegistered: false,
    description: "Learn how to query 250M+ global research papers and download open-access PDFs through the FCC campus proxy."
  },
  {
    id: "EVT-03",
    title: "Cooperative Agronomy & Value-Chain Tech Symposium 2026",
    category: "Conference",
    date: "Thursday, 02 Oct 2026",
    time: "09:00 AM - 04:00 PM",
    venue: "Prof. Hezekiah Auditorium",
    speaker: "Federal Ministry of Agriculture & Rural Development Delegates",
    seatsAvailable: 18,
    isRegistered: false,
    description: "Annual national gathering of agricultural apex leaders, researchers, and student innovators."
  }
];

// =========================================================================
// 14. INSTITUTIONAL ANNOUNCEMENTS
// =========================================================================
export const INITIAL_ANNOUNCEMENTS = [
  {
    id: "ANN-01",
    title: "Second Semester Examination Period — 24/7 Virtual Library Access",
    priority: "High Priority",
    date: "16 Sept 2026",
    branch: "All Libraries",
    badgeColor: "rose",
    message: "In support of the upcoming ND/HND examinations, the Main Campus Library and E-Learning Hub will operate extended 24-hour reading hours starting Monday. Biometric cards required for entry after 09:00 PM."
  },
  {
    id: "ANN-02",
    title: "New E-Book Subscriptions Added: ScienceDirect & IEEE Computer Society",
    priority: "Resource Update",
    date: "12 Sept 2026",
    branch: "E-Library Hub",
    badgeColor: "emerald",
    message: "The Library Directorate has acquired institutional multi-user licenses for 14,000+ new peer-reviewed computer engineering and agricultural economics volumes."
  },
  {
    id: "ANN-03",
    title: "Student PIN Verification & PVC ID Card Revalidation Notice",
    priority: "Administrative",
    date: "08 Sept 2026",
    branch: "Circulation Desks",
    badgeColor: "indigo",
    message: "Students experiencing login issues should visit their faculty librarian for immediate PIN reset. Please note library services require NO direct monetary payments."
  }
];

// =========================================================================
// 15. EXTERNAL LINKED PARTNER LIBRARIES
// =========================================================================
export const INITIAL_PARTNER_LIBRARIES = [
  {
    id: "LIB-UI-01",
    name: "Kenneth Dike Library — University of Ibadan",
    category: "Nigerian Federal University Partner",
    url: "https://library.ui.edu.ng",
    opacUrl: "https://opac.ui.edu.ng/discovery",
    protocol: "Z39.50 / Web OPAC",
    holdingsCount: "1,450,000+ Volumes",
    location: "Ibadan, Oyo State (12km from FCC)",
    accessType: "Consortium Reciprocal Access",
    status: "Active Interlink",
    description: "Nigeria's premier university depository with extensive West African cooperative, agronomic, and archival holdings. FCC scholars enjoy reciprocal walk-in and digital borrowing.",
    badgeColor: "emerald"
  },
  {
    id: "LIB-OAU-02",
    name: "Hezekiah Oluwasanmi Library — OAU Ile-Ife",
    category: "Nigerian Federal University Partner",
    url: "https://library.oauife.edu.ng",
    opacUrl: "https://library.oauife.edu.ng/opac",
    protocol: "KOHA ILS / OAI-PMH",
    holdingsCount: "850,000+ Volumes",
    location: "Ile-Ife, Osun State",
    accessType: "Consortium Inter-Library Loan",
    status: "Active Interlink",
    description: "Leading technological and agricultural engineering repository. Direct inter-library loan agreement with FCC Ibadan for postgraduate and final-year research.",
    badgeColor: "indigo"
  },
  {
    id: "LIB-NAT-03",
    name: "National Library of Nigeria (NLN)",
    category: "National Legal Depository",
    url: "https://nln.gov.ng",
    opacUrl: "https://opac.nln.gov.ng",
    protocol: "MARC21 / Z39.50 Gateway",
    holdingsCount: "5,000,000+ Records",
    location: "Abuja & Ibadan Branch (Iyaganku)",
    accessType: "Federal Open Legal Deposit",
    status: "Active Interlink",
    description: "Statutory national repository for all publications, federal gazettes, edicts, and historical monographs published in Nigeria under the National Library Act.",
    badgeColor: "teal"
  },
  {
    id: "LIB-OPEN-04",
    name: "OpenLibrary & Internet Archive",
    category: "Global Open Digital Library",
    url: "https://openlibrary.org",
    opacUrl: "https://openlibrary.org/search",
    protocol: "REST API / Web Reader",
    holdingsCount: "20,000,000+ eBooks",
    location: "Global Distributed Node",
    accessType: "Free Open Access Full-Text",
    status: "Active Interlink",
    description: "Universal catalog covering millions of digitized public domain and academic books. Students can read complete full-text editions directly online.",
    badgeColor: "amber"
  },
  {
    id: "LIB-LOC-05",
    name: "Library of Congress (LOC) Online Catalog",
    category: "Global National Authority Library",
    url: "https://loc.gov",
    opacUrl: "https://catalog.loc.gov",
    protocol: "Z39.50 / MARC 21 Authority",
    holdingsCount: "170,000,000+ Items",
    location: "Washington, D.C., USA",
    accessType: "Global Bibliographic Search",
    status: "Active Interlink",
    description: "The world's largest bibliographic database. Used by FCC cataloguers and researchers for standardized classification (LCC) and global authority records.",
    badgeColor: "purple"
  },
  {
    id: "LIB-DOAB-06",
    name: "DOAB — Directory of Open Access Books",
    category: "Peer-Reviewed Academic Open Access",
    url: "https://www.doabooks.org",
    opacUrl: "https://www.doabooks.org/doab?func=search",
    protocol: "OAI-PMH / Direct PDF",
    holdingsCount: "85,000+ Academic Monographs",
    location: "International Consortium",
    accessType: "Open Access Peer-Reviewed",
    status: "Active Interlink",
    description: "Curated directory of peer-reviewed academic monographs from over 600 academic publishers worldwide across economics, computer science, and agriculture.",
    badgeColor: "blue"
  }
];

// =========================================================================
// 16. OPENALEX / CROSSREF SEED RESEARCH PAPERS
// =========================================================================
export const OPENALEX_SEED_RESEARCH = [
  {
    doi: "10.1016/j.jclepro.2025.141992",
    title: "Decarbonizing Agricultural Value Chains Through Cooperative Agro-Solar Grids",
    authors: ["Olatunji, A. B.", "Adeyemi, S. K.", "Chen, W."],
    venue: "Journal of Cleaner Production",
    year: 2025,
    citations: 28,
    openAccess: true,
    concepts: ["Cooperative Economics", "Renewable Energy", "Agronomy", "Microgrids"],
    abstract: "Empirical evaluation of solar-powered mini-grid interventions across 30 agrarian multi-purpose cooperative unions in Oyo and Ogun States, demonstrating 42% reduction in post-harvest diesel expenses.",
    openAccessPdf: "https://doi.org/10.1016/j.jclepro.2025.141992"
  },
  {
    doi: "10.1109/TSC.2026.3389102",
    title: "Optimizing Multi-Tenant Query Execution in Edge Library Databases",
    authors: ["Okonjo, K. E.", "Balogun, M. A.", "Smith, R."],
    venue: "IEEE Transactions on Services Computing",
    year: 2026,
    citations: 41,
    openAccess: true,
    concepts: ["Database Systems", "Edge Computing", "Information Retrieval", "MARC21"],
    abstract: "Presents a low-latency caching and indexing layer for distributed institutional repositories operating across low-bandwidth African university campuses.",
    openAccessPdf: "https://doi.org/10.1109/TSC.2026.3389102"
  },
  {
    doi: "10.1080/09603107.2024.2319401",
    title: "Inflationary Transmission Channels in Nigerian Non-Bank Financial Intermediaries",
    authors: ["Sanusi, F. O.", "Babatunde, H. L."],
    venue: "Applied Financial Economics",
    year: 2024,
    citations: 19,
    openAccess: true,
    concepts: ["Banking & Finance", "Monetary Policy", "Cooperative Credit", "Inflation"],
    abstract: "Analyzes reserve drawdowns and liquidity volatility among apex thrift societies following Central Bank of Nigeria cash policy shifts.",
    openAccessPdf: "https://doi.org/10.1080/09603107.2024.2319401"
  }
];

// =========================================================================
// 17. SYSTEM HEALTH & OPERATIONAL KPI INDICATORS
// =========================================================================
export const SYSTEM_HEALTH_METRICS = {
  overallHealth: "Healthy",
  apiLatencyMs: 24,
  databaseStatus: "Online (PostgreSQL Cluster Primary)",
  searchEngineStatus: "Healthy (OpenSearch / Vector HNSW)",
  redisCacheStatus: "Active (0.8ms Hit Rate 96.4%)",
  storageHealth: "Healthy (42.8 GB / 500 GB Used)",
  aiLibrarianService: "Online (Grounding Accuracy 99.2%)",
  broadcastChannelSync: "Active (Localhost Node Connected)",
  lastBackupTime: "Today at 04:00 AM (Automated Snapshot)",
  totalCatalogueRecords: 125430,
  activePatrons: 28540,
  booksOnLoan: 8421,
  overdueItems: 341,
  activeReservations: 327,
  digitalResourcesCount: 54920,
  repositoryItemsCount: 14205
};

export const INITIAL_ACQUISITIONS = [
  { id: "PO-2026-081", title: "Modern Agro-Business Management (5 copies)", vendor: "University Press Plc, Ibadan", budget: 175000, status: "Approved", requestedBy: "Head of Dept - AGR", date: "2026-09-14", isbn: "978-978-030-992-1" },
  { id: "PO-2026-082", title: "Cloud Native Microservices & Kubernetes (4 copies)", vendor: "CSS Bookshops Ltd, Lagos", budget: 220000, status: "Under Review", requestedBy: "Dr. K. Okonjo - CSC", date: "2026-09-16", isbn: "978-0-13-549102-3" },
  { id: "PO-2026-083", title: "Nigerian Commercial Banking Compendium (10 copies)", vendor: "Spectrum Books, Ring Road Ibadan", budget: 350000, status: "Delivered & Cataloged", requestedBy: "Mrs. Folake Sanusi - BNF", date: "2026-09-02", isbn: "978-978-8120-00-5" }
];

export const INITIAL_SERIALS = [
  { id: "SER-01", title: "Journal of Co-operative and Rural Development Studies", issn: "1597-2844", frequency: "Quarterly", latestVolume: "Vol. 28 No. 3 (Sept 2026)", status: "Active Subscription", missingIssues: 0 },
  { id: "SER-02", title: "West African Agronomic Review", issn: "0794-5590", frequency: "Bi-annual", latestVolume: "Vol. 19 No. 1 (June 2026)", status: "Active Subscription", missingIssues: 1 },
  { id: "SER-03", title: "African Journal of Information Systems & Computing", issn: "1936-7287", frequency: "Monthly", latestVolume: "Vol. 14 No. 8 (August 2026)", status: "Active Subscription", missingIssues: 0 }
];

export const INITIAL_AUDIT_LOGS = [
  { id: "LOG-5501", timestamp: "2026-09-18 11:42:15", user: "Dr. Mrs. A. Balogun", role: "SUPER_ADMIN", action: "PIN_RESET", detail: "Generated new secure library PIN for student Wale Olonade (FCC/CEM/2024/042)" },
  { id: "LOG-5502", timestamp: "2026-09-18 10:15:30", user: "Mr. T. Alabi (Cataloguer)", role: "CATALOGUER", action: "MARC_INGEST", detail: "Added MARC21 bibliographic record for Artificial Intelligence in Academic Retrieval (Z666.5 .F38)" },
  { id: "LOG-5503", timestamp: "2026-09-18 09:04:00", user: "System Scheduler", role: "DAEMON", action: "HEALTH_CHECK", detail: "Automated daily integrity audit verified 100% of PDF asset hashes." }
];

export const INITIAL_ITEM_COPIES = [
  { barcode: "FCC-CP-00101", bookId: "FCC-B001", rfid: "E28011606000021A", copyNo: 1, shelf: "Floor 2 • Aisle 4 • 12B", status: "available" },
  { barcode: "FCC-CP-00102", bookId: "FCC-B001", rfid: "E28011606000021B", copyNo: 2, shelf: "Floor 2 • Aisle 4 • 12B", status: "on_loan" },
  { barcode: "FCC-CP-00201", bookId: "FCC-B002", rfid: "E28011606000022A", copyNo: 1, shelf: "Floor 1 • Aisle 2 • 05A", status: "on_loan" },
  { barcode: "FCC-CP-00202", bookId: "FCC-B002", rfid: "E28011606000022B", copyNo: 2, shelf: "Floor 1 • Aisle 2 • 05A", status: "available" },
  { barcode: "FCC-CP-00301", bookId: "FCC-B003", rfid: "E28011606000023A", copyNo: 1, shelf: "Floor 2 • Aisle 1 • 08C", status: "available" },
  { barcode: "FCC-CP-00401", bookId: "FCC-B004", rfid: "E28011606000024A", copyNo: 1, shelf: "Floor 3 • Aisle 6 • 19A", status: "on_loan" }
];

