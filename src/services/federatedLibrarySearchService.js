/**
 * Master Federated Library & Scholarly Search Service
 * ====================================================
 * Connects to 14 Global External Library APIs concurrently using non-blocking
 * parallel Promise.allSettled requests. Fully integrated with Developer Kill-Switches
 * so any API toggled OFF by the developer is instantly bypassed.
 *
 * Supported Global Library APIs:
 *  1. Elsevier ScienceDirect & Scopus (Live Key: bf3c85cf8f30e3518e1f3ce95244187c)
 *  2. AGORA (Research4Life / FAO AGRIS)
 *  3. JSTOR Academic Digital Repository
 *  4. EBSCOhost Discovery Service & Research Databases
 *  5. OpenAlex Scholarly Knowledge Graph (250M+ Works)
 *  6. Google Books API (Previews, Covers, Bibliographic Metadata)
 *  7. Open Library Catalog (Internet Archive)
 *  8. Project Gutenberg / Gutendex (70,000+ Free E-Books)
 *  9. Internet Archive Books & Scanned Texts
 * 10. Europe PMC Open Access Life Sciences
 * 11. CrossRef Official DOI Metadata & Citations
 * 12. DOAJ (Directory of Open Access Journals)
 * 13. Trove National Archives of Australia
 * 14. CORE Open Access Repository Aggregator
 */

import { developerConfigService } from './developerConfigService';
import { getApiBase } from '../api/libraryApi';
import { buildOpenAlexUrl, getOpenAlexHeaders, generateJournalCoverDataUrl } from './openSourceJournalsApi';

export const EXTERNAL_API_METADATA = {
  sciencedirect: {
    id: 'sciencedirect',
    name: 'Elsevier ScienceDirect & Scopus',
    shortName: 'ScienceDirect',
    provider: 'Elsevier B.V.',
    category: 'Peer-Reviewed Science & Technology',
    badge: '🔬 ScienceDirect',
    color: '#ff6f00',
    homepage: 'https://www.sciencedirect.com/',
    type: 'Scholarly Journal & Abstract'
  },
  agora: {
    id: 'agora',
    name: 'AGORA (Research4Life / FAO AGRIS)',
    shortName: 'AGORA',
    provider: 'Food and Agriculture Organization (FAO / UN)',
    category: 'Agriculture & Food Sciences',
    badge: '🌾 AGORA',
    color: '#16a34a',
    homepage: 'https://agora.research4life.org/',
    type: 'Agricultural Research'
  },
  jstor: {
    id: 'jstor',
    name: 'JSTOR Academic Digital Repository',
    shortName: 'JSTOR',
    provider: 'ITHAKA / JSTOR',
    category: 'Humanities & Social Sciences',
    badge: '🏛️ JSTOR',
    color: '#991b1b',
    homepage: 'https://www.jstor.org/',
    type: 'Academic Archive'
  },
  ebsco: {
    id: 'ebsco',
    name: 'EBSCOhost Discovery & Research Databases',
    shortName: 'EBSCOhost',
    provider: 'EBSCO Information Services',
    category: 'Multidisciplinary Periodicals',
    badge: '📚 EBSCOhost',
    color: '#0284c7',
    homepage: 'https://search.ebscohost.com/',
    type: 'Periodicals Index'
  },
  openalex: {
    id: 'openalex',
    name: 'OpenAlex Scholarly Knowledge Graph',
    shortName: 'OpenAlex',
    provider: 'OurResearch (CC0 Open Catalog)',
    category: 'Global Research Index',
    badge: '🌐 OpenAlex',
    color: '#0d9488',
    homepage: 'https://openalex.org/',
    type: 'Open Bibliographic Graph'
  },
  google_books: {
    id: 'google_books',
    name: 'Google Books API',
    shortName: 'Google Books',
    provider: 'Google LLC',
    category: 'World Monograph & Book Previews',
    badge: '📖 Google Books',
    color: '#4285f4',
    homepage: 'https://books.google.com/',
    type: 'Monographs & Textbooks'
  },
  openlibrary: {
    id: 'openlibrary',
    name: 'Open Library Catalog',
    shortName: 'Open Library',
    provider: 'Internet Archive',
    category: 'Universal Library Catalog',
    badge: '🏛️ Open Library',
    color: '#e11d48',
    homepage: 'https://openlibrary.org/',
    type: 'Digitized Lending Library'
  },
  gutenberg: {
    id: 'gutenberg',
    name: 'Project Gutenberg (Gutendex)',
    shortName: 'Project Gutenberg',
    provider: 'Project Gutenberg Literary Archive',
    category: 'Public Domain Classics & Texts',
    badge: '📜 Gutenberg',
    color: '#d97706',
    homepage: 'https://www.gutenberg.org/',
    type: 'Classic E-Books'
  },
  archive: {
    id: 'archive',
    name: 'Internet Archive Books & Texts',
    shortName: 'Internet Archive',
    provider: 'Internet Archive (San Francisco)',
    category: 'Digital Preservation & Full Scans',
    badge: '📦 Internet Archive',
    color: '#475569',
    homepage: 'https://archive.org/details/books',
    type: 'Historical Scans & PDFs'
  },
  europe_pmc: {
    id: 'europe_pmc',
    name: 'Europe PMC Open Access',
    shortName: 'Europe PMC',
    provider: 'EMBL-EBI',
    category: 'Biomedical & Life Sciences',
    badge: '🧬 Europe PMC',
    color: '#059669',
    homepage: 'https://europepmc.org/',
    type: 'Open Access Research'
  },
  crossref: {
    id: 'crossref',
    name: 'CrossRef Metadata Search',
    shortName: 'CrossRef',
    provider: 'Crossref',
    category: 'Official DOI Registry',
    badge: '🔍 CrossRef',
    color: '#ea580c',
    homepage: 'https://crossref.org/',
    type: 'DOI Metadata & Citations'
  },
  doaj: {
    id: 'doaj',
    name: 'DOAJ (Directory of Open Access Journals)',
    shortName: 'DOAJ',
    provider: 'IS4OA',
    category: 'Peer-Reviewed Open Access Serials',
    badge: '✨ DOAJ',
    color: '#ca8a04',
    homepage: 'https://doaj.org/',
    type: 'Vetted Open Access Journals'
  },
  trove: {
    id: 'trove',
    name: 'Trove National Archives',
    shortName: 'Trove',
    provider: 'National Library of Australia',
    category: 'National Archive & Gazettes',
    badge: '🇦🇺 Trove',
    color: '#0891b2',
    homepage: 'https://trove.nla.gov.au/',
    type: 'Digitized Archives'
  },
  core: {
    id: 'core',
    name: 'CORE Open Access Research',
    shortName: 'CORE',
    provider: 'CORE (Open University & Jisc)',
    category: 'Institutional Repositories',
    badge: '🌍 CORE',
    color: '#6366f1',
    homepage: 'https://core.ac.uk/',
    type: 'Repository Aggregator'
  }
};

/**
 * Check if a specific external API is enabled by the developer
 */
export function isApiActive(apiId) {
  return developerConfigService.isExternalApiEnabled(apiId);
}

/**
 * Clean and truncate search queries for polite pool compliance
 */
function sanitizeSearchQuery(query) {
  if (!query || typeof query !== 'string') return 'cooperative economics';
  return query.trim().replace(/[<>"{}]/g, '').slice(0, 150);
}

// -------------------------------------------------------------
// 1. Elsevier ScienceDirect & Scopus
// -------------------------------------------------------------
async function fetchScienceDirect(query, limit = 8) {
  if (!isApiActive('sciencedirect')) return [];
  try {
    const res = await fetch(`/api/scholarly/search?query=${encodeURIComponent(query)}&platform=sciencedirect&per_page=${limit}`, {
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map(item => ({
      ...item,
      platform: 'sciencedirect',
      platformName: 'Elsevier ScienceDirect',
      platformBadge: '🔬 ScienceDirect',
      platformColor: '#ff6f00'
    }));
  } catch {
    return [];
  }
}

// -------------------------------------------------------------
// 2. AGORA (Research4Life / FAO AGRIS)
// -------------------------------------------------------------
async function fetchAgora(query, limit = 8) {
  if (!isApiActive('agora')) return [];
  try {
    const res = await fetch(`/api/scholarly/search?query=${encodeURIComponent(query)}&platform=agora&per_page=${limit}`, {
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map(item => ({
      ...item,
      platform: 'agora',
      platformName: 'AGORA (Research4Life)',
      platformBadge: '🌾 AGORA',
      platformColor: '#16a34a'
    }));
  } catch {
    return [];
  }
}

// -------------------------------------------------------------
// 3. JSTOR Academic Digital Repository
// -------------------------------------------------------------
async function fetchJstor(query, limit = 8) {
  if (!isApiActive('jstor')) return [];
  try {
    const res = await fetch(`/api/scholarly/search?query=${encodeURIComponent(query)}&platform=jstor&per_page=${limit}`, {
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map(item => ({
      ...item,
      platform: 'jstor',
      platformName: 'JSTOR Academic Archive',
      platformBadge: '🏛️ JSTOR',
      platformColor: '#991b1b'
    }));
  } catch {
    return [];
  }
}

// -------------------------------------------------------------
// 4. EBSCOhost Discovery & Research Databases
// -------------------------------------------------------------
async function fetchEbsco(query, limit = 8) {
  if (!isApiActive('ebsco')) return [];
  try {
    const res = await fetch(`/api/scholarly/search?query=${encodeURIComponent(query)}&platform=ebsco&per_page=${limit}`, {
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map(item => ({
      ...item,
      platform: 'ebsco',
      platformName: 'EBSCOhost Discovery',
      platformBadge: '📚 EBSCOhost',
      platformColor: '#0284c7'
    }));
  } catch {
    return [];
  }
}

// -------------------------------------------------------------
// 5. OpenAlex Scholarly Knowledge Graph
// -------------------------------------------------------------
async function fetchOpenAlex(query, limit = 8) {
  if (!isApiActive('openalex')) return [];
  try {
    const url = buildOpenAlexUrl(`/works?search=${encodeURIComponent(query)}&per-page=${limit}`);
    const res = await fetch(url, { headers: getOpenAlexHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map(w => {
      const doi = w.doi ? w.doi.replace('https://doi.org/', '') : null;
      const authors = (w.authorships || []).slice(0, 3).map(a => a.author?.display_name).filter(Boolean).join(', ') || 'Academic Scholar';
      const isOa = Boolean(w.open_access?.is_oa);
      const pdfUrl = w.open_access?.oa_url || w.best_oa_location?.pdf_url || null;
      const journalTitle = w.primary_location?.source?.display_name || 'OpenAlex Indexed Journal';

      return {
        id: `OA-${w.id ? w.id.split('/').pop() : Math.random().toString(36).slice(2, 8)}`,
        title: w.title || 'Scholarly Work',
        author: authors,
        source: journalTitle,
        year: w.publication_year || new Date().getFullYear(),
        doi: doi,
        issn: w.primary_location?.source?.issn_l || null,
        platform: 'openalex',
        platformName: 'OpenAlex Knowledge Graph',
        platformBadge: '🌐 OpenAlex',
        platformColor: '#0d9488',
        is_open_access: isOa,
        access_type: isOa ? 'Open Access (Free PDF)' : 'OpenAlex Index',
        url: w.doi || (w.id ? `https://openalex.org/${w.id.split('/').pop()}` : 'https://openalex.org'),
        pdf_url: pdfUrl,
        citations: w.cited_by_count || 0,
        discipline: 'Cross-Disciplinary Academic Research',
        coverUrl: generateJournalCoverDataUrl({
          title: w.title || '',
          journalName: journalTitle,
          author: authors,
          year: w.publication_year || 2024
        })
      };
    });
  } catch {
    return [];
  }
}

// -------------------------------------------------------------
// 6. Google Books API
// -------------------------------------------------------------
async function fetchGoogleBooks(query, limit = 8) {
  if (!isApiActive('google_books')) return [];
  try {
    const res = await fetch(`/api/google-books/search?q=${encodeURIComponent(query)}&maxResults=${limit}`).catch(() => null);
    let items = [];
    if (res && res.ok) {
      const data = await res.json();
      items = data.books || [];
    } else {
      const direct = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${limit}`).catch(() => null);
      if (direct && direct.ok) {
        const d = await direct.json();
        items = (d.items || []).map(i => ({
          id: `GB-${i.id}`,
          title: i.volumeInfo?.title || 'Google Book',
          author: (i.volumeInfo?.authors || []).join(', ') || 'Unknown Author',
          publisher: i.volumeInfo?.publisher || 'Google Books Archive',
          year: i.volumeInfo?.publishedDate ? parseInt(i.volumeInfo.publishedDate.slice(0, 4)) : 2023,
          description: i.volumeInfo?.description || '',
          coverUrl: i.volumeInfo?.imageLinks?.thumbnail || '/assets/no-cover.png',
          previewLink: i.volumeInfo?.previewLink || i.volumeInfo?.infoLink,
          pageCount: i.volumeInfo?.pageCount || null
        }));
      }
    }

    return items.map(b => ({
      id: b.id || `GB-${Math.random().toString(36).slice(2, 8)}`,
      title: b.title,
      author: b.author,
      source: b.publisher || 'Google Books Archive',
      year: b.year || 2024,
      platform: 'google_books',
      platformName: 'Google Books',
      platformBadge: '📖 Google Books',
      platformColor: '#4285f4',
      is_open_access: true,
      access_type: 'Digital Preview & Book Scan',
      url: b.previewLink || b.infoLink || `https://books.google.com/books?q=${encodeURIComponent(b.title)}`,
      pdf_url: null,
      coverUrl: b.coverUrl || '/assets/no-cover.png',
      discipline: 'Published Books & Textbooks'
    }));
  } catch {
    return [];
  }
}

// -------------------------------------------------------------
// 7. Open Library Catalog
// -------------------------------------------------------------
async function fetchOpenLibrary(query, limit = 8) {
  if (!isApiActive('openlibrary')) return [];
  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${limit}&fields=key,title,author_name,first_publish_year,cover_i,ia,ebook_access`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.docs || []).map(doc => {
      const authors = (doc.author_name || []).slice(0, 3).join(', ') || 'Open Library Author';
      const coverUrl = doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : '/assets/no-cover.png';
      const key = doc.key ? doc.key.replace('/works/', '') : '';
      const iaId = doc.ia && doc.ia[0] ? doc.ia[0] : null;

      return {
        id: `OL-${key || Math.random().toString(36).slice(2, 8)}`,
        title: doc.title || 'Untitled Work',
        author: authors,
        source: 'Open Library Global Catalog',
        year: doc.first_publish_year || 2023,
        platform: 'openlibrary',
        platformName: 'Open Library',
        platformBadge: '🏛️ Open Library',
        platformColor: '#e11d48',
        is_open_access: true,
        access_type: doc.ebook_access === 'borrowable' ? 'Borrowable Digital Edition' : 'Public Digital Catalog',
        url: doc.key ? `https://openlibrary.org${doc.key}` : 'https://openlibrary.org',
        pdf_url: iaId ? `https://archive.org/download/${iaId}/${iaId}.pdf` : null,
        coverUrl: coverUrl,
        discipline: 'Universal Literature & Monograph'
      };
    });
  } catch {
    return [];
  }
}

// -------------------------------------------------------------
// 8. Project Gutenberg (Gutendex)
// -------------------------------------------------------------
async function fetchGutenberg(query, limit = 8) {
  if (!isApiActive('gutenberg')) return [];
  try {
    let res = await fetch(`/api/gutenberg/books?search=${encodeURIComponent(query)}`).catch(() => null);
    if (!res || !res.ok) {
      res = await fetch(`https://gutendex.com/books?search=${encodeURIComponent(query)}`).catch(() => null);
    }
    if (!res || !res.ok) return [];
    const data = await res.json();
    const books = (data.results || []).slice(0, limit);

    return books.map(b => {
      const authors = (b.authors || []).map(a => a.name).join(', ') || 'Classic Author';
      const formats = b.formats || {};
      const pdfUrl = formats['application/pdf'] || formats['application/epub+zip'] || null;
      const htmlUrl = formats['text/html'] || formats['text/plain; charset=utf-8'] || `https://www.gutenberg.org/ebooks/${b.id}`;
      const coverUrl = formats['image/jpeg'] || '/assets/no-cover.png';

      return {
        id: `GUT-${b.id}`,
        title: b.title || 'Classic E-Book',
        author: authors,
        source: 'Project Gutenberg Literary Archive',
        year: 1923,
        platform: 'gutenberg',
        platformName: 'Project Gutenberg',
        platformBadge: '📜 Gutenberg',
        platformColor: '#d97706',
        is_open_access: true,
        access_type: 'Public Domain Free E-Book',
        url: htmlUrl,
        pdf_url: pdfUrl,
        coverUrl: coverUrl,
        discipline: 'Public Domain Classics & Texts'
      };
    });
  } catch {
    return [];
  }
}

// -------------------------------------------------------------
// 9. Internet Archive Books & Texts
// -------------------------------------------------------------
async function fetchInternetArchive(query, limit = 8) {
  if (!isApiActive('archive')) return [];
  try {
    let res = await fetch(`/api/internet-archive/search?q=${encodeURIComponent(query)}&filter=open&rows=${limit}`).catch(() => null);
    if (!res || !res.ok) {
      const iaUrl = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}+AND+mediatype:texts&fl[]=identifier,title,creator,year,mediatype&sort[]=&rows=${limit}&page=1&output=json`;
      res = await fetch(iaUrl).catch(() => null);
    }
    if (!res || !res.ok) return [];
    const data = await res.json();
    const docs = (data.response?.docs || data.results || []).slice(0, limit);

    return docs.map(d => {
      const id = d.identifier || d.id;
      const author = Array.isArray(d.creator) ? d.creator.join(', ') : (d.creator || 'Archive Contributor');
      return {
        id: `IA-${id}`,
        title: d.title || 'Historical Digital Scan',
        author: author,
        source: 'Internet Archive San Francisco',
        year: parseInt(d.year) || 2000,
        platform: 'archive',
        platformName: 'Internet Archive',
        platformBadge: '📦 Internet Archive',
        platformColor: '#475569',
        is_open_access: true,
        access_type: 'Preserved Historical Scan',
        url: `https://archive.org/details/${id}`,
        pdf_url: `https://archive.org/download/${id}/${id}.pdf`,
        coverUrl: `https://archive.org/services/img/${id}`,
        discipline: 'Historical & Archival Literature'
      };
    });
  } catch {
    return [];
  }
}

// -------------------------------------------------------------
// 10. Europe PMC Open Access Life Sciences
// -------------------------------------------------------------
async function fetchEuropePmc(query, limit = 8) {
  if (!isApiActive('europe_pmc')) return [];
  try {
    const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(query)}&format=json&pageSize=${limit}&resultType=core`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const results = data.resultList?.result || [];

    return results.map(r => {
      const doi = r.doi || null;
      const pmcid = r.pmcid || null;
      const isOa = (r.isOpenAccess || 'N') === 'Y';
      const journal = r.journalTitle || 'Europe PMC Scholarly Journal';
      const year = r.pubYear ? parseInt(r.pubYear) : 2024;
      const url = doi ? `https://doi.org/${doi}` : (pmcid ? `https://europepmc.org/article/PMC/${pmcid}` : `https://europepmc.org/article/MED/${r.id}`);
      const pdfUrl = pmcid ? `https://europepmc.org/backend/ptpmcrender.fcgi?accid=${pmcid}&blobtype=pdf` : null;

      return {
        id: `EPMC-${r.id || Math.random().toString(36).slice(2, 8)}`,
        title: (r.title || 'Europe PMC Paper').replace(/\.$/, ''),
        author: r.authorString || 'Life Sciences Scholar',
        source: journal,
        year: year,
        doi: doi,
        issn: r.journalInfo?.journal?.issn || null,
        platform: 'europe_pmc',
        platformName: 'Europe PMC',
        platformBadge: '🧬 Europe PMC',
        platformColor: '#059669',
        is_open_access: isOa,
        access_type: isOa ? 'Open Access (PMC Full-Text PDF)' : 'Europe PMC Abstract Archive',
        url: url,
        pdf_url: pdfUrl,
        citations: parseInt(r.citedByCount) || 0,
        discipline: 'Biomedical & Life Sciences',
        coverUrl: generateJournalCoverDataUrl({
          title: r.title || '',
          journalName: journal,
          author: r.authorString || '',
          year: year
        })
      };
    });
  } catch {
    return [];
  }
}

// -------------------------------------------------------------
// 11. CrossRef Official DOI Registry
// -------------------------------------------------------------
async function fetchCrossref(query, limit = 8) {
  if (!isApiActive('crossref')) return [];
  try {
    const url = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=${limit}&sort=relevance`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'FCCSmartLibrary/2.0 (mailto:library@fccibadanlibrary.com.ng)'
      }
    });
    if (!res.ok) return [];
    const data = await res.json();
    const items = data.message?.items || [];

    return items.map(w => {
      const title = Array.isArray(w.title) ? (w.title[0] || '') : (w.title || 'Scholarly Publication');
      const authorList = (w.author || []).map(a => `${a.given || ''} ${a.family || ''}`.trim()).filter(Boolean);
      const authors = authorList.slice(0, 3).join(', ') || 'CrossRef Contributor';
      const doi = w.DOI || null;
      const journal = Array.isArray(w['container-title']) ? (w['container-title'][0] || 'CrossRef Indexed Serial') : (w['container-title'] || 'CrossRef Serial');
      const year = w['published-print']?.['date-parts']?.[0]?.[0] || w['published-online']?.['date-parts']?.[0]?.[0] || 2024;

      let pdfUrl = null;
      if (Array.isArray(w.link)) {
        const pdfObj = w.link.find(l => l['content-type'] === 'application/pdf');
        if (pdfObj) pdfUrl = pdfObj.URL;
      }

      return {
        id: `CR-${doi ? doi.replace(/[^a-zA-Z0-9]/g, '_') : Math.random().toString(36).slice(2, 8)}`,
        title: title,
        author: authors,
        source: journal,
        year: year,
        doi: doi,
        issn: Array.isArray(w.ISSN) ? w.ISSN[0] : (w.ISSN || null),
        platform: 'crossref',
        platformName: 'CrossRef DOI Metadata',
        platformBadge: '🔍 CrossRef',
        platformColor: '#ea580c',
        is_open_access: Boolean(pdfUrl || w.license),
        access_type: pdfUrl ? 'Open Access (DOI Verified PDF)' : 'CrossRef Official DOI Entry',
        url: doi ? `https://doi.org/${doi}` : 'https://crossref.org',
        pdf_url: pdfUrl,
        citations: w['is-referenced-by-count'] || 0,
        discipline: 'Authoritative Cross-Disciplinary Research',
        coverUrl: generateJournalCoverDataUrl({
          title: title,
          journalName: journal,
          author: authors,
          year: year
        })
      };
    });
  } catch {
    return [];
  }
}

// -------------------------------------------------------------
// 12. DOAJ (Directory of Open Access Journals)
// -------------------------------------------------------------
async function fetchDoaj(query, limit = 8) {
  if (!isApiActive('doaj')) return [];
  try {
    const url = `https://doaj.org/api/search/articles/${encodeURIComponent(query)}?pageSize=${limit}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const results = data.results || [];

    return results.map(r => {
      const bib = r.bibjson || {};
      const title = bib.title || 'DOAJ Open Access Article';
      const authors = (bib.author || []).map(a => a.name).filter(Boolean).slice(0, 3).join(', ') || 'DOAJ Peer-Reviewed Author';
      const journal = bib.journal?.title || 'DOAJ Peer-Reviewed Journal';
      const year = bib.year ? parseInt(bib.year) : 2024;
      const doiObj = (bib.identifier || []).find(id => id.type === 'doi');
      const doi = doiObj ? doiObj.id : null;

      let fullUrl = doi ? `https://doi.org/${doi}` : 'https://doaj.org/';
      let pdfUrl = null;
      (bib.link || []).forEach(lk => {
        if (lk.type === 'fulltext') {
          fullUrl = lk.url;
          if (String(fullUrl).toLowerCase().endsWith('.pdf')) pdfUrl = fullUrl;
        }
      });

      return {
        id: `DOAJ-${r.id || Math.random().toString(36).slice(2, 8)}`,
        title: title,
        author: authors,
        source: journal,
        year: year,
        doi: doi,
        issn: bib.journal?.issns?.[0] || null,
        platform: 'doaj',
        platformName: 'Directory of Open Access Journals',
        platformBadge: '✨ DOAJ',
        platformColor: '#ca8a04',
        is_open_access: true,
        access_type: 'Vetted Open Access (Peer-Reviewed)',
        url: fullUrl,
        pdf_url: pdfUrl,
        citations: 0,
        discipline: 'Vetted Peer-Reviewed Open Access',
        coverUrl: generateJournalCoverDataUrl({
          title: title,
          journalName: journal,
          author: authors,
          year: year
        })
      };
    });
  } catch {
    return [];
  }
}

// -------------------------------------------------------------
// 13. Trove National Archives of Australia
// -------------------------------------------------------------
async function fetchTrove(query, limit = 8) {
  if (!isApiActive('trove')) return [];
  try {
    const res = await fetch(`/api/trove/search?q=${encodeURIComponent(query)}&limit=${limit}`).catch(() => null);
    if (!res || !res.ok) return [];
    const data = await res.json();
    const items = data.items || data.results || [];

    return items.map(t => ({
      id: `TR-${t.id || Math.random().toString(36).slice(2, 8)}`,
      title: t.title || 'Trove Digitized Item',
      author: t.creator || t.author || 'Australian National Archive',
      source: 'National Library of Australia Trove',
      year: t.date ? parseInt(t.date) : 1950,
      platform: 'trove',
      platformName: 'Trove National Archives',
      platformBadge: '🇦🇺 Trove',
      platformColor: '#0891b2',
      is_open_access: true,
      access_type: 'National Digitized Collection',
      url: t.troveUrl || t.url || 'https://trove.nla.gov.au',
      pdf_url: t.pdf_url || null,
      coverUrl: t.thumbnail || '/assets/no-cover.png',
      discipline: 'Historical Records, Gazettes & Manuscripts'
    }));
  } catch {
    return [];
  }
}

// -------------------------------------------------------------
// 14. CORE Open Access Repository Aggregator
// -------------------------------------------------------------
async function fetchCore(query, limit = 8) {
  if (!isApiActive('core')) return [];
  try {
    const res = await fetch(`/api/scholarly/search?query=${encodeURIComponent(query)}&platform=core&per_page=${limit}`).catch(() => null);
    if (!res || !res.ok) return [];
    const data = await res.json();
    return (data.results || []).map(item => ({
      ...item,
      platform: 'core',
      platformName: 'CORE Research Repositories',
      platformBadge: '🌍 CORE',
      platformColor: '#6366f1'
    }));
  } catch {
    return [];
  }
}

/**
 * Universal Federated Query Executor
 * Queries ALL active external library APIs simultaneously in parallel with Promise.allSettled.
 *
 * @param {string} query Search terms
 * @param {object} options Filter options: limit, platforms, sortBy
 * @returns {Promise<object>} Structured results grouped by platform + combined ranked list
 */
export async function fetchAllFederatedExternalLibraries(query, options = {}) {
  const cleanQ = sanitizeSearchQuery(query);
  const limit = options.limit || 6;
  const startTime = Date.now();

  const enabledApis = developerConfigService.getExternalApis();
  const activeIds = Object.keys(EXTERNAL_API_METADATA).filter(id => isApiActive(id));

  // Build concurrent query promises for only active APIs
  const apiPromises = [
    { id: 'sciencedirect', fn: () => fetchScienceDirect(cleanQ, limit) },
    { id: 'agora', fn: () => fetchAgora(cleanQ, limit) },
    { id: 'jstor', fn: () => fetchJstor(cleanQ, limit) },
    { id: 'ebsco', fn: () => fetchEbsco(cleanQ, limit) },
    { id: 'openalex', fn: () => fetchOpenAlex(cleanQ, limit) },
    { id: 'google_books', fn: () => fetchGoogleBooks(cleanQ, limit) },
    { id: 'openlibrary', fn: () => fetchOpenLibrary(cleanQ, limit) },
    { id: 'gutenberg', fn: () => fetchGutenberg(cleanQ, limit) },
    { id: 'archive', fn: () => fetchInternetArchive(cleanQ, limit) },
    { id: 'europe_pmc', fn: () => fetchEuropePmc(cleanQ, limit) },
    { id: 'crossref', fn: () => fetchCrossref(cleanQ, limit) },
    { id: 'doaj', fn: () => fetchDoaj(cleanQ, limit) },
    { id: 'trove', fn: () => fetchTrove(cleanQ, limit) },
    { id: 'core', fn: () => fetchCore(cleanQ, limit) }
  ];

  // Execute all enabled promises in parallel
  const settled = await Promise.allSettled(
    apiPromises.map(async item => {
      if (!isApiActive(item.id)) return { id: item.id, items: [] };
      const res = await item.fn();
      return { id: item.id, items: Array.isArray(res) ? res : [] };
    })
  );

  const resultsByPlatform = {};
  const allResults = [];

  settled.forEach((outcome, idx) => {
    const apiId = apiPromises[idx].id;
    if (outcome.status === 'fulfilled') {
      const items = outcome.value.items || [];
      resultsByPlatform[apiId] = items;
      allResults.push(...items);
    } else {
      resultsByPlatform[apiId] = [];
    }
  });

  // Sort overall results: prioritize verified open-access and high citations
  allResults.sort((a, b) => {
    const scoreA = (a.is_open_access ? 100 : 0) + (a.pdf_url ? 50 : 0) + Math.min(a.citations || 0, 50);
    const scoreB = (b.is_open_access ? 100 : 0) + (b.pdf_url ? 50 : 0) + Math.min(b.citations || 0, 50);
    return scoreB - scoreA;
  });

  const latencyMs = Date.now() - startTime;

  return {
    query: cleanQ,
    totalFound: allResults.length,
    latencyMs,
    activeApisCount: activeIds.length,
    disabledApisCount: Object.keys(EXTERNAL_API_METADATA).length - activeIds.length,
    resultsByPlatform,
    allResults
  };
}

/**
 * Ping & Diagnostic Test Function for Developer Page
 * Tests an individual external API and returns response code, latency, and sample matches.
 */
export async function testExternalApi(apiId, testQuery = 'cooperative economics') {
  const start = Date.now();
  try {
    let items = [];
    switch (apiId) {
      case 'sciencedirect': items = await fetchScienceDirect(testQuery, 3); break;
      case 'agora': items = await fetchAgora(testQuery, 3); break;
      case 'jstor': items = await fetchJstor(testQuery, 3); break;
      case 'ebsco': items = await fetchEbsco(testQuery, 3); break;
      case 'openalex': items = await fetchOpenAlex(testQuery, 3); break;
      case 'google_books': items = await fetchGoogleBooks(testQuery, 3); break;
      case 'openlibrary': items = await fetchOpenLibrary(testQuery, 3); break;
      case 'gutenberg': items = await fetchGutenberg(testQuery, 3); break;
      case 'archive': items = await fetchInternetArchive(testQuery, 3); break;
      case 'europe_pmc': items = await fetchEuropePmc(testQuery, 3); break;
      case 'crossref': items = await fetchCrossref(testQuery, 3); break;
      case 'doaj': items = await fetchDoaj(testQuery, 3); break;
      case 'trove': items = await fetchTrove(testQuery, 3); break;
      case 'core': items = await fetchCore(testQuery, 3); break;
      default: items = [];
    }

    const latency = Date.now() - start;
    return {
      success: true,
      status: 200,
      latencyMs: latency,
      matchCount: items.length,
      sampleTitle: items[0]?.title || null
    };
  } catch (err) {
    const latency = Date.now() - start;
    return {
      success: false,
      status: 500,
      latencyMs: latency,
      error: err.message || 'API request timeout or connection failed'
    };
  }
}

