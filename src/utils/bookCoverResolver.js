// =========================================================================
// BOOK COVER RESOLVER & DYNAMIC COVER GENERATOR
// Ensures 100% of books across FCC E-Library display authentic, rich cover pictures
// =========================================================================

export const OFFLINE_BOOK_COVER_SVG = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="100%" height="100%">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#064e3b" />
      <stop offset="40%" stop-color="#022c22" />
      <stop offset="100%" stop-color="#011612" />
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde047" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <linearGradient id="spine" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="rgba(0,0,0,0.8)" />
      <stop offset="100%" stop-color="rgba(0,0,0,0)" />
    </linearGradient>
    <pattern id="pattern" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1" fill="rgba(16,185,129,0.15)" />
    </pattern>
  </defs>
  <rect width="400" height="600" fill="url(#bg)" />
  <rect width="400" height="600" fill="url(#pattern)" />
  <rect x="18" y="18" width="364" height="564" rx="8" fill="none" stroke="#10b981" stroke-width="2" stroke-opacity="0.4" />
  <rect x="24" y="24" width="352" height="552" rx="6" fill="none" stroke="#fde047" stroke-width="1" stroke-opacity="0.3" />
  <g transform="translate(160, 80)">
    <circle cx="40" cy="40" r="36" fill="#042f2e" stroke="url(#gold)" stroke-width="2" />
    <path d="M22 45 L40 30 L58 45 L58 24 L40 16 L22 24 Z" fill="#10b981" />
    <path d="M40 30 L40 54" stroke="#fde047" stroke-width="2" />
    <path d="M26 54 Q40 62 54 54" stroke="#fde047" stroke-width="2" fill="none" />
  </g>
  <text x="200" y="185" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" letter-spacing="3" fill="#a7f3d0">FEDERAL COOPERATIVE COLLEGE</text>
  <text x="200" y="205" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" font-weight="600" letter-spacing="2" fill="#34d399">IBADAN • E-LIBRARY REPOSITORY</text>
  <line x1="70" y1="222" x2="330" y2="222" stroke="url(#gold)" stroke-width="2" stroke-linecap="round" />
  <g transform="translate(125, 245)">
    <rect x="0" y="0" width="150" height="180" rx="8" fill="#022c22" stroke="#10b981" stroke-width="2" />
    <rect x="10" y="10" width="130" height="160" rx="4" fill="#031b15" stroke="#fde047" stroke-width="1" stroke-opacity="0.4" />
    <line x1="25" y1="40" x2="125" y2="40" stroke="#fde047" stroke-width="3" stroke-linecap="round" />
    <line x1="25" y1="65" x2="110" y2="65" stroke="#a7f3d0" stroke-width="2" stroke-linecap="round" />
    <line x1="25" y1="85" x2="120" y2="85" stroke="#a7f3d0" stroke-width="2" stroke-linecap="round" />
    <line x1="25" y1="105" x2="95" y2="105" stroke="#a7f3d0" stroke-width="2" stroke-linecap="round" />
    <circle cx="75" cy="140" r="10" fill="#10b981" opacity="0.7" />
  </g>
  <text x="200" y="475" text-anchor="middle" font-family="Georgia, serif" font-size="15" font-weight="bold" fill="#ffffff">OFFICIAL ACADEMIC TEXTBOOK</text>
  <text x="200" y="500" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" fill="#94a3b8">Institutional Peer-Reviewed Edition</text>
  <rect x="0" y="0" width="28" height="600" fill="url(#spine)" />
</svg>
`);

export const CURATED_COVERS_BY_KEYWORD = [
  {
    keywords: ['internet', 'web', 'com 122', 'networking', 'network', 'protocol', 'wifi'],
    url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&auto=format&fit=crop&q=80',
    accent: '#0284c7'
  },
  {
    keywords: ['architecture', 'microprocessor', 'hardware', 'assembly', 'hennessy', 'patterson'],
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
    accent: '#0d9488'
  },
  {
    keywords: ['organization', 'digital logic', 'circuit', 'computer organization', 'gate'],
    url: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=600&auto=format&fit=crop&q=80',
    accent: '#2563eb'
  },
  {
    keywords: ['operating system', 'silberschatz', 'kernel', 'process', 'memory management', 'linux', 'unix', 'os '],
    url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=80',
    accent: '#4f46e5'
  },
  {
    keywords: ['database', 'sql', 'elmasri', 'navathe', 'relational', 'data storage'],
    url: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&auto=format&fit=crop&q=80',
    accent: '#059669'
  },
  {
    keywords: ['python', 'programming', 'code', 'algorithm', 'software', 'java', 'c++'],
    url: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=600&auto=format&fit=crop&q=80',
    accent: '#d97706'
  },
  {
    keywords: ['cooperative', 'economics', 'cem', 'credit', 'capital', 'micro-credit', 'babalola'],
    url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format&fit=crop&q=80',
    accent: '#10b981'
  },
  {
    keywords: ['bank', 'finance', 'bnf', 'monetary', 'fintech', 'sanusi', 'investment'],
    url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80',
    accent: '#f59e0b'
  },
  {
    keywords: ['agriculture', 'cocoa', 'farm', 'agr', 'extension', 'crop', 'soil', 'harvest'],
    url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=80',
    accent: '#84cc16'
  },
  {
    keywords: ['english', 'communication', 'gns', 'literature', 'grammar', 'writing'],
    url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&auto=format&fit=crop&q=80',
    accent: '#8b5cf6'
  },
  {
    keywords: ['math', 'mathematics', 'calculus', 'algebra', 'statistics'],
    url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80',
    accent: '#ec4899'
  },
  {
    keywords: ['artificial intelligence', 'artificialintelligence', 'ai ', 'russell', 'norvig', 'machine learning', 'deep learning', 'neural', 'cyber', 'robotics', 'cambridge'],
    url: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=600&auto=format&fit=crop&q=80',
    accent: '#6366f1'
  },
  {
    keywords: ['thesis', 'dissertation', 'project', 'capstone', 'empirical', 'research monograph'],
    url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80',
    accent: '#d97706'
  }
];

export const DEFAULT_BOOK_COVER = 'https://images.unsplash.com/photo-1532012164546-f432f2e37b73?w=600&auto=format&fit=crop&q=80';

/**
 * Resolves a reliable, high-resolution cover picture for any book.
 * Always returns a valid image URL (never null or empty).
 */
export function getBookCoverUrl(book) {
  if (!book) return DEFAULT_BOOK_COVER;

  // 1. If book already has an uploaded image (data URL, base64, or http url), return it directly
  const existing = book.cover_image || book.coverImage || book.cover || book.cover_path || book.cover_data_url || book.coverUrl || book.cover_url || (book.cover_file && book.cover_file.data);
  if (existing && typeof existing === 'string' && existing.trim().length > 10) {
    const trimmed = existing.trim();
    if (trimmed.startsWith('storage/') || trimmed.startsWith('uploads/') || trimmed.startsWith('covers/')) {
      return '/' + trimmed;
    }
    return trimmed;
  }

  // 2. Match curated cover by title / subject / department keywords
  const searchStr = `${book.title || ''} ${book.subject || ''} ${book.department || ''} ${book.author || ''}`.toLowerCase();
  for (const entry of CURATED_COVERS_BY_KEYWORD) {
    if (entry.keywords.some(kw => searchStr.includes(kw))) {
      return entry.url;
    }
  }

  // 3. Fallback based on department
  const dept = (book.department || '').toLowerCase();
  if (dept.includes('computer') || dept.includes('csc')) {
    return 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80';
  }
  if (dept.includes('cooperative') || dept.includes('cem')) {
    return 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format&fit=crop&q=80';
  }
  if (dept.includes('bank') || dept.includes('finance')) {
    return 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80';
  }
  if (dept.includes('agric') || dept.includes('agr')) {
    return 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=80';
  }
  if (dept.includes('business') || dept.includes('bam') || dept.includes('management')) {
    return 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80';
  }
  if (dept.includes('public') || dept.includes('administration') || dept.includes('pad')) {
    return 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80';
  }
  if (dept.includes('marketing') || dept.includes('consumer') || dept.includes('mkt')) {
    return 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80';
  }

  return DEFAULT_BOOK_COVER;
}
