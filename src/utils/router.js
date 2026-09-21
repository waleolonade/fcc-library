// ==========================================
// INSTITUTIONAL DEEP-LINKING & TRACEABLE URL ROUTER
// Comprehensive URI Schema for every page, button, modal & file
// ==========================================

export const SYSTEM_ROUTES = [
  // Public & Discovery Pages
  { path: '/opac', label: 'Public Discovery OPAC', category: 'Public', desc: 'Central public catalog search and discovery' },
  { path: '/opac/partner-libraries', label: 'Linked External Libraries', category: 'Public', desc: 'Direct gateway to university and national partner libraries' },
  { path: '/login', label: 'Institutional Authentication Portal', category: 'Auth', desc: 'Dual gateway for student PIN and staff MFA credentials' },

  // Scholar / Student Portal Views
  { path: '/scholar/catalog', label: 'Scholar Catalog Explorer', category: 'Scholar', desc: 'Full institutional collection with live stack holdings' },
  { path: '/scholar/libraries', label: 'Scholar Partner Libraries', category: 'Scholar', desc: 'Federated external academic library portals' },
  { path: '/scholar/reserves', label: 'Course Reserves & Syllabus', category: 'Scholar', desc: 'Curriculum-assigned departmental reading lists' },
  { path: '/scholar/theses', label: 'Institutional Repository (Theses)', category: 'Scholar', desc: 'Archived HND & ND student theses and capstone projects' },
  { path: '/scholar/plagiarism', label: 'Plagiarism & Originality Scanner', category: 'Scholar', desc: 'Turnitin-grade thesis similarity check engine' },
  { path: '/scholar/loans', label: 'Smart Loans & PVC NFC Card', category: 'Scholar', desc: 'Active physical checkouts, fine balance and digital identity' },
  { path: '/scholar/clearance', label: 'Graduation Clearance Certificate', category: 'Scholar', desc: 'Automated debt-free exit audit & official certificate' },
  { path: '/scholar/rooms', label: 'Study Rooms & Carrels', category: 'Scholar', desc: 'Collaborative acoustic media rooms & research pods' },
  { path: '/scholar/ill', label: 'Inter-Library Loan (ILL)', category: 'Scholar', desc: 'National consortia resource-sharing requests' },
  { path: '/scholar/helpdesk', label: 'Ask-a-Librarian Helpdesk', category: 'Scholar', desc: 'Live reference and research consultation ticket desk' },
  { path: '/scholar/ai-librarian', label: 'AI Smart Research Librarian', category: 'Scholar', desc: 'Grounding conversational research assistant' },

  // Staff / Admin Operations Console
  { path: '/admin/circulation', label: 'Circulation Desk (Barcode/RFID)', category: 'Admin', desc: 'Rapid desk checkouts, returns and biometric verification' },
  { path: '/admin/pdf-upload', label: 'PDF Book Upload & Metadata Studio', category: 'Admin', desc: 'Upload PDF files, author credentials, chapters and course links' },
  { path: '/admin/partner-libraries', label: 'Partner Libraries Gateway Manager', category: 'Admin', desc: 'Manage external partner library OPAC integrations' },
  { path: '/admin/links', label: 'External Links & Open Access Repository', category: 'Admin', desc: 'Ingestion for direct external PDFs, eBooks and URLs' },
  { path: '/admin/marc', label: 'MARC 21 & Dublin Core Cataloguer', category: 'Admin', desc: 'Standardized bibliographic control and .MRC export' },
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
