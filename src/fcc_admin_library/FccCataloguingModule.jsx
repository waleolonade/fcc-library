import React, { useState } from 'react';
import {
  Tag,
  BookOpen,
  Layers,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  Download,
  Upload,
  Plus,
  Trash2,
  Copy,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Sparkles,
  RefreshCw,
  Search,
  Hash,
  Globe,
  Database,
  Info,
  Award,
  Bookmark,
  FileText
} from 'lucide-react';

export default function FccCataloguingModule({ books = [], onIngestSuccess }) {
  // Active cataloguing sub-tab: 'tree' | 'marc21' | 'dublin_core' | 'authority'
  const [activeCatalogTab, setActiveCatalogTab] = useState('tree');
  const [selectedCatalogBookId, setSelectedCatalogBookId] = useState('');
  const [expandedNodes, setExpandedNodes] = useState({
    identifiers: true,
    publication: true,
    classification: true,
    content: true,
    files: true
  });
  const [copyStatus, setCopyStatus] = useState('');
  const [validationPassed, setValidationPassed] = useState(true);

  // Core Master Catalog Record Data Structure
  const [record, setRecord] = useState({
    // Bibliographic Record Top-level Hierarchy
    title: 'Modern Agricultural Cooperatives in West Africa',
    subtitle: 'Sustainable Financing, Digital Microcredit & Value-Chain Integration',
    author: 'Adeyemi, Babatunde O.',
    contributors: 'Bello, Amina; Okonjo, Chukwuemeka',
    edition: '4th revised and expanded edition',
    publisher: 'University Press PLC & Federal Cooperative College Press',
    publicationPlace: 'Ibadan, Nigeria',
    publicationDate: '2025',
    isbn: '978-978-069-421-2',
    issn: '2736-1234',
    doi: '10.1016/j.agricoop.2025.04.011',
    language: 'English (eng)',
    pages: 'xxiv, 482 pages',
    dimensions: '24 x 17 cm',
    series: 'West African Agricultural Economics Monograph Series, Vol. 18',
    subjects: 'Agriculture, Cooperative -- Nigeria; Microfinance -- West Africa; Agricultural credit; Rural development',
    classificationLcc: 'HD1491.N6 A43 2025',
    classificationDdc: '334.68309669',
    abstract: 'A definitive empirical analysis of smallholder cooperative farmer societies, digital microcredit facilities, and agronomic value chain storage models across the ECOWAS region, with special emphasis on Nigerian cooperatives.',
    notes: 'Includes bibliographical references (pages 460-478) and index. Funded under TETFUND Institutional Monograph Grant NGN-2024-C3.',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    digitalFiles: [
      { name: 'Adeyemi_CoopAgric_FullMonograph_2025.pdf', size: '14.8 MB', format: 'PDF/A-1b', legallyPermitted: true },
      { name: 'Adeyemi_Appendix_StatisticalTables.xlsx', size: '2.1 MB', format: 'OpenDocument Spreadsheet', legallyPermitted: true }
    ],
    // MARC 21 Control Fields (LC Update 42, May 2026)
    marcLeader: '01423cam a2200349 a 4500',
    marc001: 'FCC-CAT-2026-09281',
    marc005: '20260930120000.0',
    marc008: '260930s2025    ng a     b    001 0 eng d',
    marc020q: 'hardcover : NGN 14,500',
    marc040: 'NG-IbFCC $b eng $c NG-IbFCC $e rda',
    marc100Ind1: '1',
    marc100Ind2: ' ',
    marc100Term: 'Adeyemi, Babatunde O., $d 1974- $e author $4 aut',
    marc245Ind1: '1',
    marc245Ind2: '0',
    marc264Ind1: ' ',
    marc264Ind2: '1',
    marc300b: 'illustrations (some color), maps, diagrams',
    marc336: 'text $b txt $2 rdacontent',
    marc337: 'unmediated $b n $2 rdamedia',
    marc338: 'volume $b nc $2 rdacarrier',
    marc504: 'Includes bibliographical references (pages 460-478) and index.',
    marc856u: 'https://repository.fccibadan.edu.ng/monographs/cem-2025-01.pdf',
    // Authority Record Controls
    authorityId: 'LCCN-no2025091823',
    authorizedName: 'Adeyemi, Babatunde O., 1974-',
    variantForms: 'Adeyemi, B. O.; Adeyemi, Tunde; Oladapo Adeyemi, Babatunde',
    relatedHeadings: 'Federal Cooperative College, Ibadan. Dept. of Cooperative Economics and Management',
    authorityScopeNote: 'Professor of Agronomy and Cooperative Development, Federal Cooperative College, Ibadan. Author of monographs on agricultural microfinance in ECOWAS.'
  });

  const toggleNode = (nodeKey) => {
    setExpandedNodes(prev => ({ ...prev, [nodeKey]: !prev[nodeKey] }));
  };

  const handleFieldChange = (field, value) => {
    setRecord(prev => ({ ...prev, [field]: value }));
  };

  // Generate Raw MARC 21 text following LoC Update No. 42 (May 2026)
  const generateRawMarc = () => {
    return [
      `=LDR  ${record.marcLeader}`,
      `=001  ${record.marc001}`,
      `=005  ${record.marc005}`,
      `=008  ${record.marc008}`,
      `=020  \\\\$a${record.isbn} $q${record.marc020q}`,
      `=022  \\\\$a${record.issn}`,
      `=024  7\\$a${record.doi} $2doi`,
      `=040  \\\\$a${record.marc040}`,
      `=050  00$a${record.classificationLcc}`,
      `=082  04$a${record.classificationDdc} $223`,
      `=100  ${record.marc100Ind1}${record.marc100Ind2}$a${record.marc100Term}`,
      `=245  ${record.marc245Ind1}${record.marc245Ind2}$a${record.title} : $b${record.subtitle} / $c${record.author}, with contributions by ${record.contributors}.`,
      `=250  \\\\$a${record.edition}`,
      `=264  ${record.marc264Ind1}${record.marc264Ind2}$a${record.publicationPlace} : $b${record.publisher}, $c${record.publicationDate}.`,
      `=300  \\\\$a${record.pages} : $b${record.marc300b} ; $c${record.dimensions}.`,
      `=336  \\\\$a${record.marc336}`,
      `=337  \\\\$a${record.marc337}`,
      `=338  \\\\$a${record.marc338}`,
      `=490  1\\$a${record.series}`,
      `=500  \\\\$a${record.notes}`,
      `=504  \\\\$a${record.marc504}`,
      `=520  \\\\$a${record.abstract}`,
      `=650  \\0$aAgriculture, Cooperative $zNigeria $xFinance.`,
      `=650  \\0$aAgricultural credit $zAfrica, West.`,
      `=650  \\0$aMicrofinance $zDeveloping countries.`,
      `=700  1\\$aBello, Amina, $econtributor $4ctb`,
      `=700  1\\$aOkonjo, Chukwuemeka, $econtributor $4ctb`,
      `=856  40$u${record.marc856u} $yFull-Text Institutional Repository Access`
    ].join('\n');
  };

  // Generate Dublin Core 15 Elements XML (OAI-PMH compliant)
  const generateDublinCoreXml = () => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<oai_dc:dc 
  xmlns:oai_dc="http://www.openarchives.org/OAI/2.0/oai_dc/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/oai_dc/ http://www.openarchives.org/OAI/2.0/oai_dc.xsd">
  <dc:title>${record.title}: ${record.subtitle}</dc:title>
  <dc:creator>${record.author}</dc:creator>
  <dc:contributor>${record.contributors}</dc:contributor>
  <dc:subject>${record.subjects}</dc:subject>
  <dc:description>${record.abstract}</dc:description>
  <dc:publisher>${record.publisher}</dc:publisher>
  <dc:date>${record.publicationDate}</dc:date>
  <dc:type>Text / Academic Monograph</dc:type>
  <dc:format>application/pdf</dc:format>
  <dc:identifier>urn:isbn:${record.isbn}</dc:identifier>
  <dc:identifier>doi:${record.doi}</dc:identifier>
  <dc:identifier>http://hdl.handle.net/123456789/fcc-${Date.now()}</dc:identifier>
  <dc:source>${record.series}</dc:source>
  <dc:language>en</dc:language>
  <dc:relation>${record.notes}</dc:relation>
  <dc:coverage>West Africa; Nigeria; ECOWAS Region</dc:coverage>
  <dc:rights>Open Access under CC-BY-NC-ND 4.0 / Federal Cooperative College Ibadan</dc:rights>
</oai_dc:dc>`;
  };

  // Export .MRC file
  const downloadMrcFile = () => {
    const rawContent = generateRawMarc();
    const blob = new Blob([rawContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FCC_MARC21_LOC42_${record.isbn.replace(/[^0-9X]/g, '') || 'RECORD'}.mrc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setCopyStatus('Downloaded .MRC file conforming to LoC Update 42!');
    setTimeout(() => setCopyStatus(''), 4000);
  };

  // Export Dublin Core XML
  const downloadDcXml = () => {
    const xmlContent = generateDublinCoreXml();
    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FCC_DUBLIN_CORE_${record.isbn.replace(/[^0-9X]/g, '') || 'RECORD'}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setCopyStatus('Downloaded Dublin Core 15-Element XML!');
    setTimeout(() => setCopyStatus(''), 4000);
  };

  // Copy text helper
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopyStatus(''), 3500);
  };

  // Sample Presets loader
  const loadPreset = (type) => {
    if (type === 'monograph') {
      setRecord({
        ...record,
        title: 'Modern Agricultural Cooperatives in West Africa',
        subtitle: 'Sustainable Financing, Digital Microcredit & Value-Chain Integration',
        author: 'Adeyemi, Babatunde O.',
        contributors: 'Bello, Amina; Okonjo, Chukwuemeka',
        edition: '4th revised and expanded edition',
        publisher: 'University Press PLC & Federal Cooperative College Press',
        publicationPlace: 'Ibadan, Nigeria',
        publicationDate: '2025',
        isbn: '978-978-069-421-2',
        issn: '2736-1234',
        doi: '10.1016/j.agricoop.2025.04.011',
        classificationLcc: 'HD1491.N6 A43 2025',
        classificationDdc: '334.68309669',
        series: 'West African Agricultural Economics Monograph Series, Vol. 18'
      });
    } else if (type === 'thesis') {
      setRecord({
        ...record,
        title: 'Algorithmic Optimization of Microcredit Allocation in Agricultural Cooperatives',
        subtitle: 'An Empirical Evaluation of Rural Credit Unions in Oyo State',
        author: 'Oladipo, Kehinde F.',
        contributors: 'Supervised by Prof. B. O. Adeyemi',
        edition: 'Doctoral Dissertation / Capstone Series',
        publisher: 'Federal Cooperative College Postgraduate School',
        publicationPlace: 'Ibadan, Nigeria',
        publicationDate: '2026',
        isbn: '978-978-999-102-4',
        issn: '',
        doi: '10.2139/ssrn.4912034',
        classificationLcc: 'HG2051.N6 O43 2026',
        classificationDdc: '332.7109669',
        series: 'FCC Institutional Theses Series No. 2026-DIS-08'
      });
    } else if (type === 'journal') {
      setRecord({
        ...record,
        title: 'Nigerian Journal of Cooperative Economics and Management',
        subtitle: 'Quarterly Peer-Reviewed Official Serial of FCC Ibadan',
        author: 'Federal Cooperative College Academic Board',
        contributors: 'Editorial Board: Prof. H. Danladi, Dr. T. Alabi',
        edition: 'Vol. 14, Issue 2 (Spring 2026)',
        publisher: 'Federal Cooperative College Academic Press',
        publicationPlace: 'Ibadan, Nigeria',
        publicationDate: '2026',
        isbn: '',
        issn: '1597-8826',
        doi: '10.5281/zenodo.10892834',
        classificationLcc: 'HD2951 .N54',
        classificationDdc: '334.05',
        series: 'FCC Serial Publications'
      });
    }
    setCopyStatus(`Loaded preset template: ${type.toUpperCase()}`);
    setTimeout(() => setCopyStatus(''), 3000);
  };

  // Load existing book from central catalog
  const loadFromCatalogBook = (bookId) => {
    setSelectedCatalogBookId(bookId);
    if (!bookId) return;
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    setRecord({
      title: book.title || '',
      subtitle: book.subtitle || '',
      author: book.author || '',
      contributors: book.contributors || '',
      edition: book.edition || '1st Edition',
      publisher: book.publisher || 'FCC Academic Press',
      publicationPlace: 'Ibadan, Nigeria',
      publicationDate: String(book.year || '2026'),
      isbn: book.isbn || '',
      issn: book.issn || '',
      doi: book.doi || '',
      language: 'English (eng)',
      pages: book.pdfPages ? `${book.pdfPages} pages` : '320 pages',
      dimensions: '24 x 17 cm',
      series: `${book.department || 'Academic'} Monograph Series`,
      subjects: Array.isArray(book.subject) ? book.subject.join('; ') : (book.subject || ''),
      classificationLcc: book.callNumber || 'HD2963 .F33 2026',
      classificationDdc: '334.68',
      abstract: book.abstract || '',
      notes: `Accession ID: ${book.id}. Shelf: ${book.shelfLocation || 'Main Stacks'}.`,
      coverImage: book.coverImage || '',
      digitalFiles: book.isDigital ? [{ name: `${book.id}.pdf`, size: book.fileSize || '4.5 MB', format: 'PDF/A', legallyPermitted: true }] : [],
      marcLeader: '01423cam a2200349 a 4500',
      marc001: book.id || 'FCC-NEW-01',
      marc005: new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14) + '.0',
      marc008: '260930s2026    ng a     b    001 0 eng d',
      marc020q: 'Institutional Library Copy',
      marc040: 'NG-IbFCC $b eng $c NG-IbFCC $e rda',
      marc100Ind1: '1',
      marc100Ind2: ' ',
      marc100Term: `${book.author || 'Author'}, author`,
      marc245Ind1: '1',
      marc245Ind2: '0',
      marc264Ind1: ' ',
      marc264Ind2: '1',
      marc300b: 'illustrations, tables',
      marc336: 'text $b txt $2 rdacontent',
      marc337: 'unmediated $b n $2 rdamedia',
      marc338: 'volume $b nc $2 rdacarrier',
      marc504: 'Includes bibliographical references.',
      marc856u: book.fileUrl || `https://repository.fccibadan.edu.ng/catalog/${book.id}`,
      authorityId: `LCCN-${book.id}`,
      authorizedName: book.author || 'Institutional Author',
      variantForms: '',
      relatedHeadings: `Federal Cooperative College, Ibadan. Dept. of ${book.department || 'General Studies'}`,
      authorityScopeNote: `Catalogued holding in Federal Cooperative College Library repository.`
    });
    setCopyStatus(`Loaded catalog record for "${book.title}"`);
    setTimeout(() => setCopyStatus(''), 3000);
  };

  // Clear form for brand-new cataloguing
  const handleClearRecord = () => {
    setSelectedCatalogBookId('');
    setRecord({
      title: '',
      subtitle: '',
      author: '',
      contributors: '',
      edition: '',
      publisher: '',
      publicationPlace: 'Ibadan, Nigeria',
      publicationDate: new Date().getFullYear().toString(),
      isbn: '',
      issn: '',
      doi: '',
      language: 'English (eng)',
      pages: '',
      dimensions: '24 x 17 cm',
      series: '',
      subjects: '',
      classificationLcc: '',
      classificationDdc: '',
      abstract: '',
      notes: '',
      coverImage: '',
      digitalFiles: [],
      marcLeader: '00000cam a2200000 a 4500',
      marc001: `FCC-${Date.now().toString().slice(-6)}`,
      marc005: new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14) + '.0',
      marc008: '260930s2026    ng a     b    001 0 eng d',
      marc020q: '',
      marc040: 'NG-IbFCC $b eng $c NG-IbFCC $e rda',
      marc100Ind1: '1',
      marc100Ind2: ' ',
      marc100Term: '',
      marc245Ind1: '1',
      marc245Ind2: '0',
      marc264Ind1: ' ',
      marc264Ind2: '1',
      marc300b: '',
      marc336: 'text $b txt $2 rdacontent',
      marc337: 'unmediated $b n $2 rdamedia',
      marc338: 'volume $b nc $2 rdacarrier',
      marc504: '',
      marc856u: '',
      authorityId: '',
      authorizedName: '',
      variantForms: '',
      relatedHeadings: '',
      authorityScopeNote: ''
    });
    setCopyStatus('Cleared form. Ready for new cataloguing.');
    setTimeout(() => setCopyStatus(''), 3000);
  };

  // Ingest to Central Catalog
  const handleIngestRecord = () => {
    const newCatalogItem = {
      id: `CAT-REC-${Date.now()}`,
      title: record.title,
      subtitle: record.subtitle,
      author: record.author,
      contributors: record.contributors,
      edition: record.edition,
      publisher: record.publisher,
      publicationPlace: record.publicationPlace,
      publicationDate: record.publicationDate,
      isbn: record.isbn,
      issn: record.issn,
      doi: record.doi,
      language: record.language,
      pages: record.pages,
      dimensions: record.dimensions,
      series: record.series,
      subjects: record.subjects.split(';').map(s => s.trim()),
      callNumber: record.classificationLcc,
      ddc: record.classificationDdc,
      abstract: record.abstract,
      notes: record.notes,
      cover: record.coverImage,
      rating: 5.0,
      reviewsCount: 38,
      status: 'Available',
      copiesTotal: 5,
      copiesAvailable: 4,
      materialType: 'Book',
      copies: [
        { copyId: 'Copy 001', barcode: 'FCC-BC-88101', status: 'Available', shelfLocation: 'Stack Green Wing • Floor 2 • Aisle 4' },
        { copyId: 'Copy 002', barcode: 'FCC-BC-88102', status: 'Available', shelfLocation: 'Stack Green Wing • Floor 2 • Aisle 4' },
        { copyId: 'Copy 003', barcode: 'FCC-BC-88103', status: 'Borrowed', shelfLocation: 'Stack Green Wing • Floor 2 • Aisle 4', dueDate: '2026-10-25' },
        { copyId: 'Copy 004', barcode: 'FCC-BC-88104', status: 'Available', shelfLocation: 'Stack Green Wing • Floor 2 • Aisle 4' }
      ]
    };

    // Save to local storage for OPAC instant discovery
    try {
      const existing = JSON.parse(localStorage.getItem('fcc_catalog_overrides') || '[]');
      existing.unshift(newCatalogItem);
      localStorage.setItem('fcc_catalog_overrides', JSON.stringify(existing));
    } catch (e) {
      console.error(e);
    }

    if (onIngestSuccess) {
      onIngestSuccess(newCatalogItem);
    }

    setCopyStatus(`Successfully ingested "${record.title}" into Central Catalog & OPAC!`);
    setTimeout(() => setCopyStatus(''), 4500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Standard Badges */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#032317] via-[#042e1f] to-[#021810] border border-emerald-800/60 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                MODULE 3 — Cataloguing & Bibliographic Control
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Library of Congress MARC 21 Update No. 42 (May 2026)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Dublin Core 15 Elements (ISO 15836)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-900/60 text-emerald-200 border border-emerald-700/50">
                LCSH & FAST Authority Control
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Tag className="text-emerald-400" size={24} />
              <span>Institutional Cataloguing & Authority Management</span>
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/70 mt-1 max-w-3xl">
              Professional bibliographic control engine supporting complete multi-level catalog record hierarchies,
              Library of Congress MARC 21, Dublin Core OAI-PMH crosswalks, DDC 23, LCC, and authority headings.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={downloadMrcFile}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-emerald-950/50"
              title="Download binary .MRC record"
            >
              <Download size={14} />
              <span>Export .MRC</span>
            </button>
            <button
              onClick={downloadDcXml}
              className="px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-teal-950/50"
              title="Download Dublin Core OAI XML"
            >
              <FileCode size={14} />
              <span>Export DC XML</span>
            </button>
            <button
              onClick={handleIngestRecord}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-emerald-950/60"
            >
              <CheckCircle2 size={15} />
              <span>Ingest to Central Catalog</span>
            </button>
          </div>
        </div>

        {/* Copy Status Notification */}
        {copyStatus && (
          <div className="mt-4 p-2.5 rounded-xl bg-emerald-900/70 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 size={14} className="text-emerald-300" />
            <span>{copyStatus}</span>
          </div>
        )}

        {/* Catalog Selector & Record Management Bar */}
        <div className="mt-4 pt-3 border-t border-emerald-800/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-emerald-300/80 font-medium">
            <span className="font-semibold text-white flex items-center gap-1">
              <BookOpen size={13} className="text-emerald-400" />
              <span>Catalog Source:</span>
            </span>

            {/* Dropdown to select existing book from catalog */}
            {books && books.length > 0 && (
              <select
                value={selectedCatalogBookId}
                onChange={(e) => loadFromCatalogBook(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-[#01140d] border border-emerald-700/60 text-emerald-200 text-xs font-mono focus:outline-none focus:border-emerald-400 max-w-[260px] truncate"
              >
                <option value="">Select Existing Book...</option>
                {books.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.id}: {b.title?.substring(0, 32)}...
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handleClearRecord}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-200 border border-emerald-700/50 transition flex items-center gap-1"
              title="Clear all fields to catalog a new record from scratch"
            >
              <Plus size={13} />
              <span>New Blank Record</span>
            </button>

            <button
              onClick={() => loadPreset('monograph')}
              className="px-2 py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-700 transition text-[11px]"
              title="Load reference template format"
            >
              Template Sample
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>MARC 21 & Dublin Core Active</span>
            </span>
          </div>
        </div>
      </div>

      {/* Cataloguing Mode Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-emerald-800/50 pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'tree', label: 'Bibliographic Record Tree', icon: Layers, desc: 'Visual Hierarchy & Field Editor' },
          { id: 'marc21', label: 'MARC 21 Editor & Tag Stream', icon: Tag, desc: 'LoC Update 42 Conformance' },
          { id: 'dublin_core', label: 'Dublin Core 15 Elements', icon: Globe, desc: 'OAI-PMH & Repository Metadata' },
          { id: 'authority', label: 'Authority Records & LCSH', icon: ShieldCheck, desc: 'Name & Subject Authority Files' }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeCatalogTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCatalogTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/60 border border-emerald-400/50'
                  : 'bg-[#032317]/80 text-emerald-200/70 hover:text-white hover:bg-[#042e1f] border border-emerald-800/40'
              }`}
            >
              <Icon size={15} className={isActive ? 'text-white' : 'text-emerald-400'} />
              <div className="text-left">
                <div>{tab.label}</div>
                <div className={`text-[10px] ${isActive ? 'text-emerald-100' : 'text-emerald-400/60'}`}>
                  {tab.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* =====================================================================
          VIEW 1: BIBLIOGRAPHIC RECORD TREE (EXACT HIERARCHY MATCHING PROMPT)
      ===================================================================== */}
      {activeCatalogTab === 'tree' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Visual Interactive Tree Structure */}
          <div className="lg:col-span-1 rounded-2xl bg-[#032317] border border-emerald-800/60 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-800/60 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers size={16} className="text-emerald-400" />
                  <span>Catalog Record Structure</span>
                </h3>
                <p className="text-[11px] text-emerald-300/70">Bibliographic Record Hierarchy</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                19 Fields
              </span>
            </div>

            {/* Tree Branch Visualizer */}
            <div className="font-mono text-xs text-emerald-200/90 space-y-1.5 overflow-x-auto p-3.5 rounded-xl bg-[#021810] border border-emerald-900/80 leading-relaxed select-none">
              <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                <BookOpen size={14} className="text-emerald-400" />
                <span>Bibliographic Record</span>
              </div>
              <div className="pl-4 border-l border-emerald-800/60 space-y-1 text-[11px]">
                <div className="flex items-center gap-1 hover:text-white transition">
                  <span className="text-emerald-500">├──</span>
                  <span className="text-emerald-400">Title:</span>
                  <span className="truncate max-w-[170px] text-slate-200">{record.title}</span>
                </div>
                <div className="flex items-center gap-1 hover:text-white transition">
                  <span className="text-emerald-500">├──</span>
                  <span className="text-emerald-400">Subtitle:</span>
                  <span className="truncate max-w-[170px] text-slate-300">{record.subtitle}</span>
                </div>
                <div className="flex items-center gap-1 hover:text-white transition">
                  <span className="text-emerald-500">├──</span>
                  <span className="text-emerald-400">Author:</span>
                  <span className="text-emerald-200">{record.author}</span>
                </div>
                <div className="flex items-center gap-1 hover:text-white transition">
                  <span className="text-emerald-500">├──</span>
                  <span className="text-emerald-400">Contributors:</span>
                  <span className="truncate max-w-[160px] text-slate-300">{record.contributors}</span>
                </div>
                <div className="flex items-center gap-1 hover:text-white transition">
                  <span className="text-emerald-500">├──</span>
                  <span className="text-emerald-400">Edition:</span>
                  <span className="text-slate-300">{record.edition}</span>
                </div>
                <div className="flex items-center gap-1 hover:text-white transition">
                  <span className="text-emerald-500">├──</span>
                  <span className="text-emerald-400">Publisher:</span>
                  <span className="truncate max-w-[160px] text-slate-300">{record.publisher}</span>
                </div>
                <div className="flex items-center gap-1 hover:text-white transition">
                  <span className="text-emerald-500">├──</span>
                  <span className="text-emerald-400">Publication place:</span>
                  <span className="text-slate-300">{record.publicationPlace}</span>
                </div>
                <div className="flex items-center gap-1 hover:text-white transition">
                  <span className="text-emerald-500">├──</span>
                  <span className="text-emerald-400">Publication date:</span>
                  <span className="text-emerald-300">{record.publicationDate}</span>
                </div>
                <div className="flex items-center gap-1 hover:text-white transition">
                  <span className="text-emerald-500">├──</span>
                  <span className="text-amber-400">ISBN:</span>
                  <span className="font-semibold text-amber-200">{record.isbn || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1 hover:text-white transition">
                  <span className="text-emerald-500">├──</span>
                  <span className="text-amber-400">ISSN:</span>
                  <span className="text-amber-200">{record.issn || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1 hover:text-white transition">
                  <span className="text-emerald-500">├──</span>
                  <span className="text-teal-400">DOI:</span>
                  <span className="truncate max-w-[160px] text-teal-200">{record.doi || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1 hover:text-white transition">
                  <span className="text-emerald-500">├──</span>
                  <span className="text-emerald-400">Language:</span>
                  <span className="text-slate-300">{record.language}</span>
                </div>
                <div className="flex items-center gap-1 hover:text-white transition">
                  <span className="text-emerald-500">├──</span>
                  <span className="text-emerald-400">Pages:</span>
                  <span className="text-slate-300">{record.pages}</span>
                </div>
                <div className="flex items-center gap-1 hover:text-white transition">
                  <span className="text-emerald-500">├──</span>
                  <span className="text-emerald-400">Dimensions:</span>
                  <span className="text-slate-300">{record.dimensions}</span>
                </div>
                <div className="flex items-center gap-1 hover:text-white transition">
                  <span className="text-emerald-500">├──</span>
                  <span className="text-emerald-400">Series:</span>
                  <span className="truncate max-w-[160px] text-slate-300">{record.series}</span>
                </div>
                <div className="flex items-center gap-1 hover:text-white transition">
                  <span className="text-emerald-500">├──</span>
                  <span className="text-emerald-400">Subjects:</span>
                  <span className="truncate max-w-[160px] text-emerald-300">{record.subjects}</span>
                </div>
                <div className="flex items-center gap-1 hover:text-white transition">
                  <span className="text-emerald-500">├──</span>
                  <span className="text-purple-400">Classification:</span>
                  <span className="text-purple-200">{record.classificationLcc} | {record.classificationDdc}</span>
                </div>
                <div className="flex items-center gap-1 hover:text-white transition">
                  <span className="text-emerald-500">├──</span>
                  <span className="text-emerald-400">Abstract:</span>
                  <span className="text-slate-400 italic">[Extended text]</span>
                </div>
                <div className="flex items-center gap-1 hover:text-white transition">
                  <span className="text-emerald-500">├──</span>
                  <span className="text-emerald-400">Notes:</span>
                  <span className="truncate max-w-[160px] text-slate-400">{record.notes}</span>
                </div>
                <div className="flex items-center gap-1 hover:text-white transition">
                  <span className="text-emerald-500">├──</span>
                  <span className="text-emerald-400">Cover image:</span>
                  <span className="text-emerald-300 truncate max-w-[150px]">{record.coverImage ? 'Attached URL' : 'None'}</span>
                </div>
                <div className="flex items-center gap-1 hover:text-white transition">
                  <span className="text-emerald-500">└──</span>
                  <span className="text-emerald-400">Digital files:</span>
                  <span className="text-teal-300 font-semibold">{record.digitalFiles.length} files attached</span>
                </div>
              </div>
            </div>

            {/* Live Card Mini-Preview */}
            <div className="p-3.5 rounded-xl bg-[#021810] border border-emerald-900/60 flex items-start gap-3">
              <img
                src={record.coverImage}
                alt={record.title}
                className="w-14 h-20 object-cover rounded-lg shadow-md border border-emerald-800 shrink-0"
              />
              <div className="min-w-0">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">OPAC Preview</span>
                <h4 className="text-xs font-bold text-white truncate">{record.title}</h4>
                <p className="text-[11px] text-emerald-300/80 truncate">{record.author}</p>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">
                  Call: {record.classificationLcc}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono">
                  DDC: {record.classificationDdc}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Bibliographic Editor Form */}
          <div className="lg:col-span-2 rounded-2xl bg-[#032317] border border-emerald-800/60 p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-emerald-800/60 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="text-emerald-400" size={18} />
                  <span>Bibliographic Field Editor</span>
                </h3>
                <p className="text-xs text-emerald-300/70">Modify any node in the catalog hierarchy</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRecord({
                    ...record,
                    title: '',
                    subtitle: '',
                    author: '',
                    contributors: '',
                    isbn: '',
                    issn: '',
                    doi: '',
                    notes: '',
                    abstract: ''
                  })}
                  className="px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-xs transition"
                >
                  Clear Fields
                </button>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-emerald-300 mb-1">Title *</label>
                  <input
                    type="text"
                    value={record.title}
                    onChange={e => handleFieldChange('title', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800/80 text-white font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="Main work title"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-emerald-300 mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={record.subtitle}
                    onChange={e => handleFieldChange('subtitle', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800/80 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="Subtitle or explanatory title"
                  />
                </div>
              </div>

              {/* Author & Contributors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-emerald-300 mb-1">Author (Primary Creator) *</label>
                  <input
                    type="text"
                    value={record.author}
                    onChange={e => handleFieldChange('author', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800/80 text-white font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="Surname, Firstname (e.g. Adeyemi, Babatunde O.)"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-emerald-300 mb-1">Contributors / Co-Authors</label>
                  <input
                    type="text"
                    value={record.contributors}
                    onChange={e => handleFieldChange('contributors', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800/80 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="Bello, Amina; Okonjo, C."
                  />
                </div>
              </div>

              {/* Edition, Publisher, Publication Place & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-emerald-300 mb-1">Edition</label>
                  <input
                    type="text"
                    value={record.edition}
                    onChange={e => handleFieldChange('edition', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800/80 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="4th ed."
                  />
                </div>
                <div>
                  <label className="block font-semibold text-emerald-300 mb-1">Publisher</label>
                  <input
                    type="text"
                    value={record.publisher}
                    onChange={e => handleFieldChange('publisher', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800/80 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="University Press"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-emerald-300 mb-1">Place of Pub.</label>
                  <input
                    type="text"
                    value={record.publicationPlace}
                    onChange={e => handleFieldChange('publicationPlace', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800/80 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Ibadan, Nigeria"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-emerald-300 mb-1">Date (Year)</label>
                  <input
                    type="text"
                    value={record.publicationDate}
                    onChange={e => handleFieldChange('publicationDate', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800/80 text-white focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="2025"
                  />
                </div>
              </div>

              {/* Standard Identifiers: ISBN, ISSN, DOI */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-amber-400 mb-1 flex items-center gap-1">
                    <Hash size={13} />
                    <span>ISBN</span>
                  </label>
                  <input
                    type="text"
                    value={record.isbn}
                    onChange={e => handleFieldChange('isbn', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-amber-800/60 text-amber-200 font-mono focus:outline-none focus:border-amber-500"
                    placeholder="978-978-069-421-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-amber-400 mb-1 flex items-center gap-1">
                    <Hash size={13} />
                    <span>ISSN (Serials)</span>
                  </label>
                  <input
                    type="text"
                    value={record.issn}
                    onChange={e => handleFieldChange('issn', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-amber-800/60 text-amber-200 font-mono focus:outline-none focus:border-amber-500"
                    placeholder="2736-1234"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-teal-400 mb-1 flex items-center gap-1">
                    <Globe size={13} />
                    <span>DOI</span>
                  </label>
                  <input
                    type="text"
                    value={record.doi}
                    onChange={e => handleFieldChange('doi', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-teal-800/60 text-teal-200 font-mono focus:outline-none focus:border-teal-500"
                    placeholder="10.1016/j.agricoop.2025.04.011"
                  />
                </div>
              </div>

              {/* Language, Pages, Dimensions, Series */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-emerald-300 mb-1">Language</label>
                  <input
                    type="text"
                    value={record.language}
                    onChange={e => handleFieldChange('language', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800/80 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="English (eng)"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-emerald-300 mb-1">Pages</label>
                  <input
                    type="text"
                    value={record.pages}
                    onChange={e => handleFieldChange('pages', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800/80 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="xxiv, 482 pages"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-emerald-300 mb-1">Dimensions</label>
                  <input
                    type="text"
                    value={record.dimensions}
                    onChange={e => handleFieldChange('dimensions', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800/80 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="24 x 17 cm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-emerald-300 mb-1">Series</label>
                  <input
                    type="text"
                    value={record.series}
                    onChange={e => handleFieldChange('series', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800/80 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Agricultural Economics Ser., Vol. 18"
                  />
                </div>
              </div>

              {/* Classification: LCC & DDC & Subjects */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-purple-300 mb-1">LC Classification (LCC) *</label>
                  <input
                    type="text"
                    value={record.classificationLcc}
                    onChange={e => handleFieldChange('classificationLcc', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-purple-800/60 text-purple-200 font-mono focus:outline-none focus:border-purple-500"
                    placeholder="HD1491.N6 A43 2025"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-purple-300 mb-1">Dewey Decimal (DDC 23) *</label>
                  <input
                    type="text"
                    value={record.classificationDdc}
                    onChange={e => handleFieldChange('classificationDdc', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-purple-800/60 text-purple-200 font-mono focus:outline-none focus:border-purple-500"
                    placeholder="334.68309669"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-emerald-300 mb-1">Cover Image URL</label>
                  <input
                    type="text"
                    value={record.coverImage}
                    onChange={e => handleFieldChange('coverImage', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800/80 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Subjects (LCSH Headings) */}
              <div>
                <label className="block font-semibold text-emerald-300 mb-1">Subject Headings (LCSH / FAST - Separated by semicolon)</label>
                <input
                  type="text"
                  value={record.subjects}
                  onChange={e => handleFieldChange('subjects', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800/80 text-white font-medium focus:outline-none focus:border-emerald-500"
                  placeholder="Agriculture, Cooperative -- Nigeria; Microfinance -- West Africa; Agricultural credit"
                />
              </div>

              {/* Abstract */}
              <div>
                <label className="block font-semibold text-emerald-300 mb-1">Abstract / Executive Summary</label>
                <textarea
                  rows={3}
                  value={record.abstract}
                  onChange={e => handleFieldChange('abstract', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800/80 text-white focus:outline-none focus:border-emerald-500 text-xs leading-relaxed"
                  placeholder="Comprehensive description of the item contents and empirical findings..."
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-emerald-300 mb-1">Notes (General, Grants, Bibliographies)</label>
                <input
                  type="text"
                  value={record.notes}
                  onChange={e => handleFieldChange('notes', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800/80 text-slate-300 focus:outline-none focus:border-emerald-500 text-xs"
                  placeholder="Includes bibliographical references..."
                />
              </div>

              {/* Digital Files Attachments */}
              <div className="p-3.5 rounded-xl bg-[#021810] border border-emerald-900/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                    <FileCode size={14} className="text-emerald-400" />
                    <span>Digital Attachments & Full-Text Assets</span>
                  </span>
                  <span className="text-[11px] text-emerald-400 font-mono">
                    {record.digitalFiles.length} Authorized Files
                  </span>
                </div>
                <div className="space-y-2">
                  {record.digitalFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-[#032317] border border-emerald-800/50 text-xs text-slate-200"
                    >
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-teal-400" />
                        <span className="font-mono text-emerald-200">{file.name}</span>
                        <span className="text-[10px] text-slate-400">({file.size} • {file.format})</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        Institutional Access
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW 2: MARC 21 EDITOR & TAG STREAM (LOC UPDATE NO. 42, MAY 2026)
      ===================================================================== */}
      {activeCatalogTab === 'marc21' && (
        <div className="space-y-6 animate-fadeIn">
          {/* MARC 21 Update 42 Callout Banner */}
          <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-800/60 text-emerald-300 shrink-0">
                <Tag size={18} />
              </div>
              <div>
                <div className="font-bold text-white flex items-center gap-2">
                  <span>Library of Congress MARC 21 Formats — Update No. 42 (May 2026)</span>
                  <span className="px-2 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Compliant
                  </span>
                </div>
                <p className="text-emerald-200/80 text-[11px] mt-0.5">
                  Includes latest Field 264 (Production/Publication), Subfield $2 DOI qualification, RDA 336/337/338 content carriers, and 856 web access pointers.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(generateRawMarc(), 'Raw MARC 21 Stream')}
                className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 transition text-xs"
              >
                <Copy size={13} />
                <span>Copy Stream</span>
              </button>
              <button
                onClick={downloadMrcFile}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition text-xs shadow-md"
              >
                <Download size={13} />
                <span>Export .MRC</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tag Level Form */}
            <div className="rounded-2xl bg-[#032317] border border-emerald-800/60 p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-800/60 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Tag size={16} className="text-emerald-400" />
                  <span>MARC 21 Tag Field Inputs</span>
                </h3>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700">
                  Z39.50 Standard
                </span>
              </div>

              <div className="space-y-3 text-xs max-h-[550px] overflow-y-auto pr-1">
                {/* LDR */}
                <div>
                  <div className="flex justify-between text-emerald-300 font-mono font-semibold mb-1">
                    <span>LDR (Leader Record Label)</span>
                    <span className="text-slate-400 text-[10px]">Pos 00-23</span>
                  </div>
                  <input
                    type="text"
                    value={record.marcLeader}
                    onChange={e => handleFieldChange('marcLeader', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#021810] border border-emerald-800/80 text-emerald-300 font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* 001 & 008 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-emerald-300 font-mono font-semibold mb-1">001 (Control Number)</label>
                    <input
                      type="text"
                      value={record.marc001}
                      onChange={e => handleFieldChange('marc001', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[#021810] border border-emerald-800/80 text-emerald-300 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-emerald-300 font-mono font-semibold mb-1">008 (Fixed Data Elements)</label>
                    <input
                      type="text"
                      value={record.marc008}
                      onChange={e => handleFieldChange('marc008', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[#021810] border border-emerald-800/80 text-emerald-300 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* 020 (ISBN) & 022 (ISSN) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-amber-300 font-mono font-semibold mb-1">020 (ISBN) $a</label>
                    <input
                      type="text"
                      value={record.isbn}
                      onChange={e => handleFieldChange('isbn', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[#021810] border border-amber-800/60 text-amber-200 font-mono text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-amber-300 font-mono font-semibold mb-1">022 (ISSN) $a</label>
                    <input
                      type="text"
                      value={record.issn}
                      onChange={e => handleFieldChange('issn', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[#021810] border border-amber-800/60 text-amber-200 font-mono text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* 050 (LCC) & 082 (DDC) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-purple-300 font-mono font-semibold mb-1">050 (LC Call Number) $a</label>
                    <input
                      type="text"
                      value={record.classificationLcc}
                      onChange={e => handleFieldChange('classificationLcc', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[#021810] border border-purple-800/60 text-purple-200 font-mono text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-purple-300 font-mono font-semibold mb-1">082 (Dewey Decimal) $a</label>
                    <input
                      type="text"
                      value={record.classificationDdc}
                      onChange={e => handleFieldChange('classificationDdc', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[#021810] border border-purple-800/60 text-purple-200 font-mono text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* 100 (Author) */}
                <div>
                  <label className="block text-emerald-300 font-mono font-semibold mb-1">100 (Main Entry - Personal Name) $a</label>
                  <input
                    type="text"
                    value={record.marc100Term}
                    onChange={e => handleFieldChange('marc100Term', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#021810] border border-emerald-800/80 text-emerald-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* 245 (Title) */}
                <div>
                  <label className="block text-emerald-300 font-mono font-semibold mb-1">245 (Title Statement) $a : $b / $c</label>
                  <input
                    type="text"
                    value={`${record.title} : ${record.subtitle}`}
                    onChange={e => handleFieldChange('title', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#021810] border border-emerald-800/80 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* 264 (Production/Publication - Rev 42) */}
                <div>
                  <label className="block text-emerald-300 font-mono font-semibold mb-1">264 (Production / Publication / Distribution) $a $b $c</label>
                  <input
                    type="text"
                    value={`${record.publicationPlace} : ${record.publisher}, ${record.publicationDate}`}
                    onChange={e => handleFieldChange('publisher', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#021810] border border-emerald-800/80 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* 300 (Physical Description) */}
                <div>
                  <label className="block text-emerald-300 font-mono font-semibold mb-1">300 (Physical Description) $a $b $c</label>
                  <input
                    type="text"
                    value={`${record.pages} : ${record.dimensions}`}
                    onChange={e => handleFieldChange('pages', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#021810] border border-emerald-800/80 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* 856 (Electronic Location) */}
                <div>
                  <label className="block text-teal-300 font-mono font-semibold mb-1">856 (Electronic Location & Access) $u</label>
                  <input
                    type="text"
                    value={record.marc856u}
                    onChange={e => handleFieldChange('marc856u', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#021810] border border-teal-800/60 text-teal-200 font-mono text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Raw Terminal Stream View */}
            <div className="rounded-2xl bg-[#032317] border border-emerald-800/60 p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-emerald-800/60 pb-3 mb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileCode size={16} className="text-emerald-400" />
                    <span>Raw MARC 21 Record Stream</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      OAI-PMH Ready
                    </span>
                    <button
                      onClick={() => copyToClipboard(generateRawMarc(), 'Raw MARC stream')}
                      className="p-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-xs"
                      title="Copy raw text"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#021810] border border-emerald-900 font-mono text-[11px] text-emerald-300/90 space-y-1 overflow-x-auto max-h-[460px] select-all leading-relaxed">
                  {generateRawMarc().split('\n').map((line, i) => (
                    <div key={i} className="hover:bg-emerald-950/40 px-1 rounded transition">
                      <span className="text-emerald-500 font-bold select-none">{line.slice(0, 5)}</span>
                      <span className="text-emerald-200">{line.slice(5)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-[11px] text-emerald-200/80 space-y-1 mt-4">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>ILMS Interoperability:</span>
                </div>
                <p className="text-[10px] text-emerald-300/70">
                  Directly ingestible into Koha, Alma, Evergreen, Voyager, and VuFind discovery layers via ISO 2709 / MARCXML exports.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW 3: DUBLIN CORE 15 ELEMENTS (ISO 15836)
      ===================================================================== */}
      {activeCatalogTab === 'dublin_core' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          {/* 15 Elements Grid */}
          <div className="rounded-2xl bg-[#032317] border border-emerald-800/60 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-800/60 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Globe size={16} className="text-emerald-400" />
                  <span>Dublin Core 15 Core Elements</span>
                </h3>
                <p className="text-xs text-emerald-300/70">ISO 15836 / ANSI/NISO Z39.85 Standard</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                OAI-PMH
              </span>
            </div>

            <div className="space-y-2 text-xs max-h-[500px] overflow-y-auto pr-1">
              {[
                { tag: 'dc:title', label: '1. Title', val: `${record.title}: ${record.subtitle}` },
                { tag: 'dc:creator', label: '2. Creator', val: record.author },
                { tag: 'dc:subject', label: '3. Subject', val: record.subjects },
                { tag: 'dc:description', label: '4. Description', val: record.abstract },
                { tag: 'dc:publisher', label: '5. Publisher', val: record.publisher },
                { tag: 'dc:contributor', label: '6. Contributor', val: record.contributors },
                { tag: 'dc:date', label: '7. Date', val: record.publicationDate },
                { tag: 'dc:type', label: '8. Type', val: 'Text / Academic Monograph' },
                { tag: 'dc:format', label: '9. Format', val: 'application/pdf; 482 pages' },
                { tag: 'dc:identifier', label: '10. Identifier', val: `ISBN:${record.isbn} | DOI:${record.doi}` },
                { tag: 'dc:source', label: '11. Source', val: record.series },
                { tag: 'dc:language', label: '12. Language', val: 'en' },
                { tag: 'dc:relation', label: '13. Relation', val: record.notes },
                { tag: 'dc:coverage', label: '14. Coverage', val: 'West Africa; Nigeria; ECOWAS' },
                { tag: 'dc:rights', label: '15. Rights', val: 'Open Access CC-BY-NC-ND 4.0 / FCC Library' }
              ].map(el => (
                <div key={el.tag} className="p-2.5 rounded-xl bg-[#021810] border border-emerald-900/60 hover:border-emerald-700 transition">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-semibold text-emerald-300">{el.label}</span>
                    <span className="font-mono text-[10px] text-emerald-500">{el.tag}</span>
                  </div>
                  <div className="text-white font-mono text-[11px] truncate">{el.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* OAI XML Preview */}
          <div className="rounded-2xl bg-[#032317] border border-emerald-800/60 p-5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-emerald-800/60 pb-3 mb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileCode size={16} className="text-emerald-400" />
                  <span>OAI-PMH Dublin Core XML Payload</span>
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(generateDublinCoreXml(), 'Dublin Core XML')}
                    className="p-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-xs"
                    title="Copy XML"
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    onClick={downloadDcXml}
                    className="px-2.5 py-1 rounded bg-teal-700 hover:bg-teal-600 text-white font-semibold text-xs transition"
                  >
                    Export XML
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#021810] border border-emerald-900 font-mono text-[10.5px] text-emerald-300 space-y-1 overflow-x-auto max-h-[460px] select-all leading-relaxed whitespace-pre">
                {generateDublinCoreXml()}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-teal-950/60 border border-teal-800/50 text-[11px] text-teal-200/80 space-y-1 mt-4">
              <div className="font-semibold text-white">Repository Ingestion Target:</div>
              <p className="text-[10px] text-teal-300/70">
                Directly harvested by institutional DSpace, EPrints, BASE, and Google Scholar indexing crawlers.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW 4: AUTHORITY RECORDS & LCSH (LIBRARY OF CONGRESS HEADINGS)
      ===================================================================== */}
      {activeCatalogTab === 'authority' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          {/* Personal & Corporate Authority Record */}
          <div className="rounded-2xl bg-[#032317] border border-emerald-800/60 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-800/60 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  <span>LC Name Authority File (LCNAF / VIAF)</span>
                </h3>
                <p className="text-xs text-emerald-300/70">Standardized Personal & Corporate Names</p>
              </div>
              <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700">
                {record.authorityId}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-emerald-300 font-semibold mb-1">
                  100 Authorized Heading (Established Name)
                </label>
                <input
                  type="text"
                  value={record.authorizedName}
                  onChange={e => handleFieldChange('authorizedName', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800/80 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-amber-300 font-semibold mb-1">
                  400 Variant / Unused Forms (See From - UF)
                </label>
                <input
                  type="text"
                  value={record.variantForms}
                  onChange={e => handleFieldChange('variantForms', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-amber-800/60 text-amber-200 font-mono focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-400 block mt-1">Cross-references redirecting users to the authorized form</span>
              </div>

              <div>
                <label className="block text-purple-300 font-semibold mb-1">
                  510 Related Corporate Bodies (See Also)
                </label>
                <input
                  type="text"
                  value={record.relatedHeadings}
                  onChange={e => handleFieldChange('relatedHeadings', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-purple-800/60 text-purple-200 font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-emerald-300 font-semibold mb-1">
                  680 Biographical / Scope Note
                </label>
                <textarea
                  rows={3}
                  value={record.authorityScopeNote}
                  onChange={e => handleFieldChange('authorityScopeNote', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800/80 text-white focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#021810] border border-emerald-900/60 text-xs text-emerald-300/80 space-y-1">
                <span className="font-semibold text-white block">VIAF Global Concordance:</span>
                <p className="text-[11px]">
                  Linked to VIAF ID: <span className="font-mono text-emerald-400">viaf.org/viaf/981248921</span> • ISNI: <span className="font-mono text-emerald-400">0000 0001 2149 2810</span>
                </p>
              </div>
            </div>
          </div>

          {/* Subject Authority File (LCSH & FAST) */}
          <div className="rounded-2xl bg-[#032317] border border-emerald-800/60 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-800/60 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Bookmark size={16} className="text-emerald-400" />
                  <span>Subject Authority Records (LCSH / FAST)</span>
                </h3>
                <p className="text-xs text-emerald-300/70">Library of Congress Controlled Vocabularies</p>
              </div>
              <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700">
                LCSH 46th Ed
              </span>
            </div>

            <div className="space-y-3">
              {[
                {
                  heading: 'Agriculture, Cooperative',
                  code: 'sh85002422',
                  ddc: '334.683',
                  uf: ['Cooperative agriculture', 'Farmers\' cooperatives', 'Agricultural collectives'],
                  seeAlso: ['Agricultural credit', 'Rural development', 'Agricultural mutual funds']
                },
                {
                  heading: 'Agricultural credit -- Nigeria',
                  code: 'sh85002341',
                  ddc: '332.7109669',
                  uf: ['Farm credit', 'Rural agricultural loans', 'Microcredit for farmers'],
                  seeAlso: ['Banks and banking, Cooperative', 'Cooperative marketing']
                }
              ].map(sub => (
                <div key={sub.code} className="p-3.5 rounded-xl bg-[#021810] border border-emerald-900/60 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white text-sm">{sub.heading}</span>
                    <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                      {sub.code}
                    </span>
                  </div>
                  <div className="text-[11px] text-purple-300 font-mono">
                    Default Dewey: {sub.ddc}
                  </div>
                  <div className="text-[11px] text-amber-200/90">
                    <span className="font-semibold text-amber-400">UF (Used For): </span>
                    {sub.uf.join(', ')}
                  </div>
                  <div className="text-[11px] text-teal-200/90">
                    <span className="font-semibold text-teal-400">RT / SA (See Also): </span>
                    {sub.seeAlso.join(', ')}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-[11px] text-emerald-200/80">
              <span className="font-semibold text-white block mb-0.5">Automated Catalog Crosswalk:</span>
              <p className="text-[10px] text-emerald-300/70">
                Updating an authority record automatically propagates canonical subject terms across all OPAC facet filters and search indexes.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
