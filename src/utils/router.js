// ==========================================
// INSTITUTIONAL DEEP-LINKING & TRACEABLE URL ROUTER
// Comprehensive URI Schema for every page, button, modal & file
// ==========================================

export const SYSTEM_ROUTES = [
  // Public & Discovery Pages
  { path: '/opac', label: 'Public Discovery OPAC', category: 'Public', desc: 'Central public catalog search and discovery' },
  { path: '/opac/partner-libraries', label: 'Linked External Libraries', category: 'Public', desc: 'Direct gateway to university and national partner libraries' },
  { path: '/kiosk', label: 'Self-Service Library Station (Module 8)', category: 'Public', desc: 'Touchscreen self-checkout and self-return station with instant digital receipts' },
  { path: '/login', label: 'Student Scholar Portal Login', category: 'Auth', desc: 'Matric number and security PIN authentication for students' },
  { path: '/admin/login', label: 'Librarian & Staff Console Login', category: 'Auth', desc: 'Chief Librarian and Operational Staff credential authentication' },
  { path: '/hod/login', label: 'HOD Departmental Gateway Login', category: 'Auth', desc: 'Department Head department code and secure PIN authentication' },

  // Scholar / Student Portal Views
  { path: '/scholar/profile', label: 'Student Patron Profile (Module 6)', category: 'Scholar', desc: 'Patron profile with ASCII ID, loans, reservations, fines, and reading velocity' },
  { path: '/scholar/catalog', label: 'Scholar Catalog Explorer', category: 'Scholar', desc: 'Full institutional collection with live stack holdings' },
  { path: '/scholar/dept-resources', label: 'My Department Resources & Syllabi', category: 'Scholar', desc: 'Curriculum texts, past questions, and lecture notes uploaded by HOD' },
  { path: '/scholar/libraries', label: 'Scholar Partner Libraries', category: 'Scholar', desc: 'Federated external academic library portals' },
  { path: '/scholar/reserves', label: 'Course Reserves & Syllabus', category: 'Scholar', desc: 'Curriculum-assigned departmental reading lists' },
  { path: '/scholar/theses', label: 'Institutional Repository (Theses)', category: 'Scholar', desc: 'Archived HND & ND student theses and capstone projects' },
  { path: '/scholar/plagiarism', label: 'Plagiarism & Originality Scanner', category: 'Scholar', desc: 'Turnitin-grade thesis similarity check engine' },
  { path: '/scholar/loans', label: 'Smart Loans & PVC NFC Card', category: 'Scholar', desc: 'Active physical checkouts, countdown due dates, renewals, and fines' },
  { path: '/scholar/kiosk', label: 'Self-Service Station (Module 8)', category: 'Scholar', desc: 'Self-checkout and self-return touch kiosk' },
  { path: '/scholar/barcode_studio', label: 'Barcode & QR ID Studio (Module 7)', category: 'Scholar', desc: 'Student ID barcode and QR generation studio' },
  { path: '/scholar/clearance', label: 'Graduation Clearance Certificate', category: 'Scholar', desc: 'Automated debt-free exit audit & official certificate' },
  { path: '/scholar/rooms', label: 'Study Rooms & Carrels', category: 'Scholar', desc: 'Collaborative acoustic media rooms & research pods' },
  { path: '/scholar/ill', label: 'Inter-Library Loan (ILL)', category: 'Scholar', desc: 'National consortia resource-sharing requests' },
  { path: '/scholar/helpdesk', label: 'Ask-a-Librarian Helpdesk', category: 'Scholar', desc: 'Live reference and research consultation ticket desk' },
  { path: '/scholar/ai-librarian', label: 'AI Smart Research Librarian', category: 'Scholar', desc: 'Grounding conversational research assistant' },

  // HOD (Head of Department) Academic Portal
  { path: '/hod/overview', label: 'HOD Departmental Overview', category: 'HOD', desc: 'Departmental statistics, faculty metrics, student count, and upload status' },
  { path: '/hod/upload', label: 'Departmental Resource Ingestion', category: 'HOD', desc: 'Upload PDFs, syllabi, past questions, and physical book acquisitions to staging queue' },
  { path: '/hod/submissions', label: 'Departmental Submissions Tracker', category: 'HOD', desc: 'Monitor pending, approved, and revision-requested items in the central pipeline' },
  { path: '/hod/curriculum', label: 'Course Reserves & Reading Lists', category: 'HOD', desc: 'Curate recommended texts and syllabi mapped to departmental course codes' },
  { path: '/hod/analytics', label: 'Departmental Library Analytics', category: 'HOD', desc: 'Student reading velocity, syllabus coverage gaps, and borrowing engagement' },

  // Staff / Admin Operations Console
  { path: '/admin/overview', label: 'Administrative Command Center', category: 'Admin', desc: 'Central institutional library oversight, quick metrics, and staff actions' },
  { path: '/admin/integrations', label: 'Institutional Integrations Hub (Module 6)', category: 'Admin', desc: 'SIS, Staff HR, LMS, SAML SSO, and Result System connectors' },
  { path: '/admin/barcode-qr', label: 'Barcode & QR Master Studio (Module 7)', category: 'Admin', desc: 'Institutional Barcode & QR Generation Studio' },
  { path: '/admin/hod-submissions', label: 'Pending HOD Submissions Queue', category: 'Admin', desc: 'Staging & Approval Pipeline: Review HOD uploads, assign Call Number & Shelf' },
  { path: '/admin/policies', label: 'Institutional RBAC & Loan Policies', category: 'Admin', desc: 'Global borrow limits, loan durations per tier, fine calculation rules, and waivers' },
  { path: '/admin/patrons', label: 'Patron Registry & SIS Batch Import', category: 'Admin', desc: 'Batch import students/faculty via CSV/Excel, manage patron roles and statuses' },
  { path: '/admin/circulation', label: 'Circulation Desk (Barcode/RFID)', category: 'Admin', desc: 'Rapid desk checkouts, returns, fine collection, and clearances' },
  { path: '/admin/pdf-upload', label: 'PDF Book Upload & Metadata Studio', category: 'Admin', desc: 'Upload PDF files, author credentials, chapters and course links' },
  { path: '/admin/partner-libraries', label: 'Partner Libraries Gateway Manager', category: 'Admin', desc: 'Manage external partner library OPAC integrations' },
  { path: '/admin/links', label: 'External Links & Open Access Repository', category: 'Admin', desc: 'Ingestion for direct external PDFs, eBooks and URLs' },
  { path: '/admin/marc', label: 'MARC 21 & Dublin Core Cataloguer', category: 'Admin', desc: 'Standardized bibliographic control, DDC/LCC classification, and .MRC export' },
  { path: '/admin/research', label: 'OpenAlex & Crossref Harvester', category: 'Admin', desc: 'Live DOI and scholarly open-access research ingestion' },
  { path: '/admin/acquisitions', label: 'Acquisitions & Vendor Orders', category: 'Admin', desc: 'TETFUND book budget allocations and purchase orders' },
  { path: '/admin/serials', label: 'Serials & ISSN Subscriptions', category: 'Admin', desc: 'Journal holdings, periodicity and missing claims' },
  { path: '/admin/shelves', label: 'Interactive Shelf Audit Map', category: 'Admin', desc: '3-floor architectural stack visualizer and RFID wand' },
  { path: '/admin/accreditation', label: 'NBTE / NUC Accreditation Auditor', category: 'Admin', desc: 'Government compliance scorecard and Grade A certificate' },
  { path: '/admin/analytics', label: 'Institutional Analytics & BI', category: 'Admin', desc: 'Collection velocity, departmental stats and heatmaps' },
  { path: '/admin/audit', label: 'Immutable Audit Security Logs', category: 'Admin', desc: 'Cryptographically hashed circulation and staff event logs' },

  // Digital Files & Documents
  { path: '/file/certificate/clearance', label: 'Clearance Certificate PDF/Print', category: 'Files', desc: 'Official signed graduation clearance document' },
  { path: '/file/certificate/accreditation', label: 'NBTE Accreditation Certificate', category: 'Files', desc: 'Official National Board for Technical Education Grade A Credential' },
  { path: '/file/card/pvc', label: 'PVC Smart NFC Library Card', category: 'Files', desc: 'Double-sided high-resolution printable ID' },
  { path: '/file/marc/export', label: 'MARC21 Binary Export (.MRC)', category: 'Files', desc: 'Standardized machine-readable bibliographic record file' },
  { path: '/file/theses/sample-pdf', label: 'Thesis Full Text (PDF)', category: 'Files', desc: 'Academic research paper repository document' },
];

export function parseCurrentRoute() {
  const hash = window.location.hash || '#/opac';
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const [pathPart, queryPart] = raw.split('?');
  const path = pathPart.startsWith('/') ? pathPart : '/' + pathPart;

  const params = {};
  if (queryPart) {
    const searchParams = new URLSearchParams(queryPart);
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }
  }

  return { path, params, rawHash: hash };
}

export function navigateTo(path, params = {}) {
  let newHash = '#' + (path.startsWith('/') ? path : '/' + path);

  const queryKeys = Object.keys(params);
  if (queryKeys.length > 0) {
    const searchParams = new URLSearchParams();
    queryKeys.forEach(k => {
      if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
        searchParams.set(k, params[k]);
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      newHash += '?' + qs;
    }
  }

  if (window.location.hash !== newHash) {
    window.location.hash = newHash;
  }
}

export function getPermalink(path, params = {}) {
  let url = window.location.origin + window.location.pathname + '#' + (path.startsWith('/') ? path : '/' + path);
  const queryKeys = Object.keys(params);
  if (queryKeys.length > 0) {
    const searchParams = new URLSearchParams();
    queryKeys.forEach(k => {
      if (params[k]) searchParams.set(k, params[k]);
    });
    const qs = searchParams.toString();
    if (qs) url += '?' + qs;
  }
  return url;
}

export function getActionUri(domain, actionName, parameters = {}) {
  const paramsStr = Object.entries(parameters)
    .filter(([_, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return `action://${domain}/${actionName}${paramsStr ? '?' + paramsStr : ''}`;
}

export function copyToClipboardWithFeedback(text, callback) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      if (callback) callback(true);
    }).catch(() => {
      fallbackCopy(text, callback);
    });
  } else {
    fallbackCopy(text, callback);
  }
}

function fallbackCopy(text, callback) {
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    if (callback) callback(success);
  } catch (e) {
    if (callback) callback(false);
  }
}
