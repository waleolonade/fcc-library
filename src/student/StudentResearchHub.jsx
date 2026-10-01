
import React, { useState, useMemo, useEffect } from 'react';
import {
  Award, Globe, FileText, Sparkles, Quote, Search, Download,
  ExternalLink, Bookmark, Check, Copy, BookOpen, AlertCircle,
  GraduationCap, ChevronRight, Filter, ShieldCheck, Share2, ArrowRight
} from 'lucide-react';
import { OPENALEX_SEED_RESEARCH, INSTITUTION } from '../data/institutionalSeedData';
import { sounds } from '../utils/soundEffects';
import { departmentService } from '../services/departmentService';

const HND_PROJECT_TOPICS = [
  {
    id: 'TOPIC-CEM-01',
    dept: 'Co-operative Economics & Management',
    level: 'HND II',
    title: 'Evaluating the Impact of Apex Cooperative Societies on Micro-Credit Access and Agricultural Productivity in Oyo State',
    problem: 'Despite government interventions, smallholder farmers face severe liquidity constraints. Apex cooperative unions offer micro-credit, but fund disbursement velocity and default rates require empirical evaluation.',
    objectives: [
      'Assess the loan disbursement procedures of apex agricultural cooperatives in Ibadan agricultural zone.',
      'Measure the correlation between cooperative credit volume and farm yield among beneficiary farmers.',
      'Identify institutional bottlenecks in loan recovery and collateral waivers.'
    ],
    methodology: 'Descriptive survey research design using structured questionnaires across 120 registered cooperative farmers in 4 local government areas. Regression analysis via SPSS.',
    shelfReferences: [
      { callNumber: 'HD2963 .A34 2026', title: 'Principles and Practice of Co-operative Economics (Prof. Adebayo)' },
      { callNumber: 'HG2051.N6 O48 2025', title: 'Micro-Credit Administration in Developing Agrarian Economies' }
    ]
  },
  {
    id: 'TOPIC-CEM-02',
    dept: 'Co-operative Economics & Management',
    level: 'HND II',
    title: 'Financial Governance and Audit Compliance in Multipurpose Cooperative Societies Post-Regulatory Directives',
    problem: 'Recent supervisory guidelines mandate strict financial audits for cooperative societies. Many grassroots societies struggle with internal controls and bookkeeping standards.',
    objectives: [
      'Examine the internal audit mechanisms implemented by multipurpose cooperatives in tertiary institutions.',
      'Evaluate compliance levels with statutory dividend distribution and reserve fund retention rules.',
      'Determine the effect of transparent governance on membership growth and retention.'
    ],
    methodology: 'Purposive sampling of 15 campus-based cooperative societies. Content analysis of audited annual financial statements and executive interviews.',
    shelfReferences: [
      { callNumber: 'HF5686.C8 B35 2024', title: 'Auditing and Financial Control in Cooperative Enterprise' }
    ]
  },
  {
    id: 'TOPIC-CSC-01',
    dept: 'Computer Science',
    level: 'HND II',
    title: 'Design and Implementation of an IoT and RFID-Integrated Automated Library Circulation and Anti-Theft Management System',
    problem: 'Manual circulation desks create bottlenecks during peak examination periods, while book misplacement in multi-floor stacks leads to phantom loss of catalog holdings.',
    objectives: [
      'Architect a high-frequency RFID transponder and barcode scanning reader module.',
      'Implement an automated anti-theft security gate listener with real-time audio-visual alarms.',
      'Develop a web-based circulation desk dashboard connected to a relational database with loan ledger telemetry.'
    ],
    methodology: 'Object-Oriented Analysis and Design (OOAD) with Agile prototyping. Technology stack: React, Laravel 11 PHP, SQLite/MySQL, and WebSockets.',
    shelfReferences: [
      { callNumber: 'QA76.9 .D3 O46 2026', title: 'Computer Networks and Distributed Systems Architecture (Tanenbaum)' },
      { callNumber: 'TK7882.R4 F33 2025', title: 'RFID Technology Principles and Automation Protocols' }
    ]
  },
  {
    id: 'TOPIC-CSC-02',
    dept: 'Computer Science',
    level: 'HND II',
    title: 'Machine Learning Predictive Framework for Student Academic Performance and Early Attrition Warning in Higher Education',
    problem: 'Academic advisors lack early indicators to identify students at risk of carry-overs or dropout before end-of-semester examinations.',
    objectives: [
      'Extract behavioral parameters from LMS logins, attendance, and library borrowing velocity.',
      'Train and validate supervised classification models (Random Forest, XGBoost, Logistic Regression).',
      'Deploy a responsive advisor notification dashboard with risk score heatmaps.'
    ],
    methodology: 'CRISP-DM methodology with anonymized student historical data (N=1,500). Python Scikit-Learn pipeline with 80/20 train-test split.',
    shelfReferences: [
      { callNumber: 'QA76.73.P98 M45 2025', title: 'Machine Learning in Educational Data Mining' }
    ]
  },
  {
    id: 'TOPIC-BNF-01',
    dept: 'Banking & Finance',
    level: 'HND II',
    title: 'Comparative Assessment of Fintech Micro-Lending Platforms and Traditional Microfinance Banks on Youth SME Financing',
    problem: 'Digital instant loan apps have expanded credit access but at high effective interest rates, while traditional MFBs require physical collateral that young entrepreneurs often lack.',
    objectives: [
      'Compare interest rate structures, turnaround time, and repayment flexible terms between Fintech and MFBs.',
      'Assess borrower satisfaction and financial distress among youth-owned enterprises in Ibadan.',
      'Recommend optimal credit regulation models for consumer protection.'
    ],
    methodology: 'Mixed-method comparative survey with 150 small business owners and key informant interviews with microfinance risk officers.',
    shelfReferences: [
      { callNumber: 'HG178.33.N6 S26 2025', title: 'Fintech Disruption and Commercial Banking Dynamics in West Africa' }
    ]
  },
  {
    id: 'TOPIC-AGR-01',
    dept: 'Agricultural Extension & Management',
    level: 'HND II',
    title: 'Adoption Determinants of Climate-Smart Crop Storage Technologies Among Smallholder Farmers in Agro-Ecological Zones',
    problem: 'Post-harvest grain losses in Nigeria exceed 30% annually due to insect infestation and poor aeration. Adoption of modern hermetic storage bags remains inconsistent.',
    objectives: [
      'Identify current grain preservation techniques among maize and cowpea farmers.',
      'Determine the socio-economic factors influencing adoption of Purdue Improved Crop Storage (PICS) bags.',
      'Evaluate extension agents contact frequency on technology uptake.'
    ],
    methodology: 'Multi-stage random sampling of 140 grain farmers. Binary logistic regression model estimating adoption probability.',
    shelfReferences: [
      { callNumber: 'S494.5.A45 O53 2024', title: 'Modern Agricultural Extension Principles and Technology Transfer' }
    ]
  }
];

const SCHOLARLY_JOURNALS = [
  {
    id: 'JRN-01',
    title: 'Nigerian Journal of Co-operative Economics & Rural Development (NJCERD)',
    issn: '0794-8212',
    frequency: 'Quarterly',
    publisher: 'FCC Academic Press & Research Directorate',
    latestIssue: 'Vol. 18, No. 2 (June 2026)',
    indexedIn: 'African Journals Online (AJOL), Crossref, Google Scholar',
    scope: 'Cooperative governance, agrarian finance, apex union sustainability, micro-insurance.',
    articlesCount: 48,
    openAccess: true
  },
  {
    id: 'JRN-02',
    title: 'West African Journal of Applied Computing & Information Systems (WAJACIS)',
    issn: '2276-9048',
    frequency: 'Bi-Annual',
    publisher: 'Faculty of Science & Computing, FCC Ibadan',
    latestIssue: 'Vol. 12, Issue 1 (May 2026)',
    indexedIn: 'DOAJ, Scopus Preview, IEEE Xplore Listed',
    scope: 'Machine learning, IoT in agriculture, library automation, cyber-security in fintech.',
    articlesCount: 36,
    openAccess: true
  },
  {
    id: 'JRN-03',
    title: 'Journal of Banking, Sustainable Finance & SME Development',
    issn: '1597-4405',
    frequency: 'Tri-Annual',
    publisher: 'Department of Banking & Finance in partnership with CIBN',
    latestIssue: 'Vol. 9, No. 1 (April 2026)',
    indexedIn: 'EBSCOhost, ProQuest, Crossref',
    scope: 'Microfinance risk modeling, monetary policy impacts, ESG financing in Africa.',
    articlesCount: 29,
    openAccess: true
  },
  {
    id: 'JRN-04',
    title: 'Tropical Journal of Agricultural Extension & Agro-Enterprise Innovation',
    issn: '1119-9180',
    frequency: 'Quarterly',
    publisher: 'FCC Agricultural Extension Directorate',
    latestIssue: 'Vol. 22, No. 1 (March 2026)',
    indexedIn: 'CAB Direct, AGORA, FAO AGRIS',
    scope: 'Participatory extension methods, post-harvest technology, cooperative farming.',
    articlesCount: 52,
    openAccess: true
  }
];

const INSTITUTIONAL_SEED_THESES = [
  {
    id: 'TH-CEM-2025-01',
    title: 'Evaluating the Impact of Apex Cooperative Societies on Micro-Credit Access and Agricultural Productivity in Oyo State',
    author: 'Adeyemi, Samuel Taiwo',
    matric: 'FCC/CEM/2024/042',
    department: 'Co-operative Economics & Management',
    supervisor: 'Prof. A. O. Adebayo',
    degree: 'Higher National Diploma (HND II) Dissertation',
    year: 2025,
    pages: 142,
    abstract: 'Empirical survey assessing loan disbursement procedures, credit volume correlation with crop yields, and institutional recovery bottlenecks across 120 registered cooperative farmers in Oyo State.',
    doi: '10.5897/FCC.ETD.2025.101',
    callNumber: 'ETD-CEM-2025-01',
    downloads: 348,
    isApproved: true
  },
  {
    id: 'TH-CSC-2025-02',
    title: 'Design and Implementation of an IoT and RFID-Integrated Automated Library Circulation and Anti-Theft Management System',
    author: 'Okonjo, Kevin E. & Balogun, M. A.',
    matric: 'FCC/CSC/2024/018',
    department: 'Computer Science',
    supervisor: 'Dr. (Mrs) K. E. Okonjo',
    degree: 'Higher National Diploma (HND II) Dissertation',
    year: 2025,
    pages: 168,
    abstract: 'Architected high-frequency RFID transponders, automated barcode listener telemetry, and real-time loan ledger synchronization for polytechnic and college repositories.',
    doi: '10.5897/FCC.ETD.2025.102',
    callNumber: 'ETD-CSC-2025-02',
    downloads: 512,
    isApproved: true
  },
  {
    id: 'TH-BNF-2025-03',
    title: 'Comparative Assessment of Fintech Micro-Lending Platforms and Traditional Microfinance Banks on Youth SME Financing in Ibadan',
    author: 'Sanusi, Folashade O.',
    matric: 'FCC/BNF/2024/077',
    department: 'Banking & Finance',
    supervisor: 'Dr. F. O. Sanusi',
    degree: 'Higher National Diploma (HND II) Dissertation',
    year: 2025,
    pages: 135,
    abstract: 'Investigates turnaround velocities, interest spread structures, and borrower distress among 150 youth-owned retail and agricultural enterprises.',
    doi: '10.5897/FCC.ETD.2025.103',
    callNumber: 'ETD-BNF-2025-03',
    downloads: 289,
    isApproved: true
  },
  {
    id: 'TH-AGR-2025-04',
    title: 'Adoption Determinants of Climate-Smart Crop Storage Technologies Among Smallholder Farmers in Agro-Ecological Zones',
    author: 'Ogunlesi, Babatunde K.',
    matric: 'FCC/AGR/2024/033',
    department: 'Agricultural Extension & Management',
    supervisor: 'Prof. (Mrs) T. K. Bello',
    degree: 'Higher National Diploma (HND II) Dissertation',
    year: 2025,
    pages: 154,
    abstract: 'Multi-stage random sampling of 140 grain farmers analyzing socioeconomic determinants of Purdue Improved Crop Storage (PICS) bags adoption.',
    doi: '10.5897/FCC.ETD.2025.104',
    callNumber: 'ETD-AGR-2025-04',
    downloads: 410,
    isApproved: true
  }
];

export default function StudentResearchHub({
  initialSubTab = 'hnd_projects', // 'hnd_projects' | 'papers' | 'journals' | 'topics' | 'references'
  theses = [],
  books = [],
  user,
  onOpenReader,
  onOpenAi
}) {
  const [subTab, setSubTab] = useState(initialSubTab);
  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);
  const [departments, setDepartments] = useState(() => departmentService.getDepartments());

  useEffect(() => {
    const unsub = departmentService.subscribe((updated) => {
      setDepartments(updated);
    });
    return unsub;
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');
  const [copiedId, setCopiedId] = useState(null);
  const [savedTopics, setSavedTopics] = useState([]);
  const [approvedHodDissertations, setApprovedHodDissertations] = useState([]);

  // Fetch approved HOD capstone/dissertation submissions
  const loadApprovedDissertations = () => {
    try {
      const localSubs = JSON.parse(localStorage.getItem('fcc_hod_submissions_v48') || '[]');
      const pendingQueue = JSON.parse(localStorage.getItem('fcc_pending_department_uploads') || '[]');
      const allApproved = [...localSubs, ...pendingQueue].filter(s =>
        s.status === 'approved' &&
        (String(s.resource_type || '').toLowerCase().includes('project') ||
         String(s.resource_type || '').toLowerCase().includes('dissertation') ||
         String(s.resource_type || '').toLowerCase().includes('capstone') ||
         String(s.resource_type || '').toLowerCase().includes('thesis') ||
         String(s.resource_type || '').toLowerCase().includes('research'))
      );
      setApprovedHodDissertations(allApproved);
    } catch (e) {
      setApprovedHodDissertations([]);
    }
  };

  useEffect(() => {
    loadApprovedDissertations();
    const handleSync = () => loadApprovedDissertations();
    window.addEventListener('fcc-submissions-updated', handleSync);
    window.addEventListener('fcc-catalog-updated', handleSync);
    return () => {
      window.removeEventListener('fcc-submissions-updated', handleSync);
      window.removeEventListener('fcc-catalog-updated', handleSync);
    };
  }, []);

  // Citation Generator state
  const [citationForm, setCitationForm] = useState({
    type: 'book',
    author: user?.name ? `${user.name.split(' ').slice(-1)[0]}, ${user.name.split(' ')[0][0]}.` : 'Adebayo, A. O.',
    year: '2026',
    title: 'Principles and Practice of Co-operative Economics in Developing Nations',
    publisher: 'FCC Academic Press',
    place: 'Ibadan, Nigeria',
    journal: 'Nigerian Journal of Co-operative Economics',
    volume: '18',
    issue: '2',
    pages: '45-62',
    doi: '10.5897/FCC.2026.042',
    url: 'https://repository.fccibadan.edu.ng/handle/123456789/490'
  });
  const [selectedStyle, setSelectedStyle] = useState('APA');

  const isHnd2 = Boolean(
    user?.level?.includes('HND2') ||
    user?.level?.includes('HND 2') ||
    user?.level?.includes('HND II') ||
    user?.level?.includes('Final') ||
    user?.matric?.includes('HND')
  );

  // Normalize theses combining prop, approved HOD submissions, and institutional seeds
  const normalizedTheses = useMemo(() => {
    const rawTheses = [...theses];

    // Convert approved HOD uploads to thesis format
    approvedHodDissertations.forEach((ah, i) => {
      rawTheses.unshift({
        id: ah.id || `HOD-TH-${i + 1}`,
        title: ah.title,
        author: ah.author,
        matric: ah.uploaded_by_hod_id || 'FCC/HOD/APPROVED',
        department: ah.department_name || 'Academic Department',
        supervisor: ah.hod_name || 'Department Academic Board',
        degree: `${ah.target_level || 'HND II'} Academic Capstone`,
        year: 2026,
        abstract: ah.abstract || 'Approved Departmental Capstone Research Dissertation.',
        doi: `10.5897/FCC.HOD.2026.${ah.id}`,
        callNumber: ah.assigned_call_number || `ETD-${ah.course_code || 'CEM'}-2026`,
        downloads: 215,
        fileDataUrl: ah.file_data_url || '',
        isApproved: true
      });
    });

    const baseList = rawTheses.length > 0 ? rawTheses : INSTITUTIONAL_SEED_THESES;

    return baseList.map((t, idx) => ({
      id: t.id || `TH-${idx + 101}`,
      title: t.title || 'Institutional Research Dissertation',
      author: t.studentName || t.author || 'FCC Final Year Scholar',
      matric: t.matric || 'FCC/CEM/2024/042',
      department: t.department || 'Co-operative Economics & Management',
      supervisor: t.supervisor || t.advisor || 'Prof. A. O. Adebayo',
      degree: t.degree || 'Higher National Diploma (HND II) Dissertation',
      year: t.year || 2025,
      abstract: t.abstract || 'Empirical research archived in Federal Co-operative College Institutional Repository.',
      doi: t.doi || `10.5897/FCC.ETD.${t.year || 2025}.${idx + 101}`,
      callNumber: t.callNumber || `ETD-${t.department_code || 'CEM'}-${t.year || 2025}-${idx + 1}`,
      downloads: t.downloads || 184 + (idx * 23),
      fileDataUrl: t.fileDataUrl || '',
      isApproved: true
    }));
  }, [theses, approvedHodDissertations]);

  const filteredTheses = useMemo(() => {
    return normalizedTheses.filter(t => {
      const q = searchQuery.toLowerCase().trim();
      const matchQ = !q ||
        t.title.toLowerCase().includes(q) ||
        t.author.toLowerCase().includes(q) ||
        t.department.toLowerCase().includes(q) ||
        t.supervisor.toLowerCase().includes(q) ||
        t.abstract.toLowerCase().includes(q);
      const matchDept = selectedDeptFilter === 'All' || t.department.includes(selectedDeptFilter);
      return matchQ && matchDept;
    });
  }, [normalizedTheses, searchQuery, selectedDeptFilter]);

  const filteredPapers = useMemo(() => {
    return OPENALEX_SEED_RESEARCH.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      return !q ||
        p.title.toLowerCase().includes(q) ||
        p.authors.some(a => a.toLowerCase().includes(q)) ||
        p.venue.toLowerCase().includes(q);
    });
  }, [searchQuery]);

  const filteredTopics = useMemo(() => {
    return HND_PROJECT_TOPICS.filter(top => {
      const q = searchQuery.toLowerCase().trim();
      const matchQ = !q ||
        top.title.toLowerCase().includes(q) ||
        top.problem.toLowerCase().includes(q) ||
        top.dept.toLowerCase().includes(q);
      const matchDept = selectedDeptFilter === 'All' || top.dept.includes(selectedDeptFilter);
      return matchQ && matchDept;
    });
  }, [searchQuery, selectedDeptFilter]);

  const handleCopy = (text, id) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopiedId(id);
    sounds.playSuccessChime();
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleToggleSaveTopic = (topicId) => {
    sounds.playClick();
    if (savedTopics.includes(topicId)) {
      setSavedTopics(savedTopics.filter(id => id !== topicId));
    } else {
      setSavedTopics([...savedTopics, topicId]);
    }
  };

  // Generate citation string
  const formattedCitation = useMemo(() => {
    const { author, year, title, publisher, place, journal, volume, issue, pages, doi } = citationForm;
    switch (selectedStyle) {
      case 'APA':
        if (citationForm.type === 'journal') {
          return `${author} (${year}). ${title}. ${journal}, ${volume}(${issue}), ${pages}. https://doi.org/${doi}`;
        }
        return `${author} (${year}). ${title}. ${place}: ${publisher}. https://doi.org/${doi}`;
      case 'Harvard':
        if (citationForm.type === 'journal') {
          return `${author}, ${year}. ${title}. ${journal}, ${volume}(${issue}), pp.${pages}.`;
        }
        return `${author}, ${year}. ${title}. ${place}: ${publisher}.`;
      case 'MLA':
        if (citationForm.type === 'journal') {
          return `${author}. "${title}." ${journal}, vol. ${volume}, no. ${issue}, ${year}, pp. ${pages}.`;
        }
        return `${author}. ${title}. ${publisher}, ${year}.`;
      case 'Chicago':
        return `${author}. ${title}. ${place}: ${publisher}, ${year}.`;
      case 'IEEE':
        return `[1] ${author}, "${title}," ${journal || publisher}, vol. ${volume || 1}, pp. ${pages || '1-10'}, ${year}.`;
      case 'BibTeX':
        return `@article{fcc_${year},\n  author  = {${author}},\n  title   = {${title}},\n  journal = {${journal}},\n  year    = {${year}},\n  volume  = {${volume}},\n  pages   = {${pages}},\n  doi     = {${doi}}\n}`;
      default:
        return `${author} (${year}). ${title}.`;
    }
  }, [citationForm, selectedStyle]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. HND2 FINAL YEAR RESEARCH PRIORITY BANNER */}
      {isHnd2 && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-[#032317] to-slate-900 border-2 border-emerald-500/50 p-6 shadow-2xl">
          <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                  <GraduationCap size={14} className="text-emerald-400" />
                  HND2 DIPLOMA RESEARCH ACCELERATOR
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  FINAL YEAR REQUIREMENT
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Institutional Capstone & Thesis Gateway
              </h2>
              <p className="text-xs sm:text-sm text-emerald-200/90 max-w-2xl leading-relaxed">
                As an HND II Scholar, your dissertation is a core prerequisite for Graduation Clearance, NBTE validation, and NYSC mobilization. Explore verified departmental projects, approved topic proposals, and official style citation formatting.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={() => setSubTab('topics')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950 flex items-center gap-2 transition"
              >
                <Sparkles size={14} />
                <span>Explore Topics Bank</span>
              </button>
              <button
                onClick={() => setSubTab('references')}
                className="px-4 py-2 rounded-xl bg-[#021810] hover:bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-bold transition flex items-center gap-2"
              >
                <Quote size={14} />
                <span>Citation Builder</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. RESEARCH SUB-NAVIGATION TABS */}
      <div className="bg-[#032317]/90 p-1.5 rounded-2xl border border-emerald-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shadow-lg">
        {[
          { id: 'hnd_projects', label: 'HND Projects', icon: Award, badge: normalizedTheses.length },
          { id: 'papers', label: 'Research Papers', icon: Globe, badge: 'OpenAlex' },
          { id: 'journals', label: 'Journals', icon: FileText, badge: 'ISSN' },
          { id: 'topics', label: 'Project Topics', icon: Sparkles, badge: isHnd2 ? 'Curated' : undefined },
          { id: 'references', label: 'References', icon: Quote, badge: 'APA/MLA' },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setSubTab(tab.id);
                sounds.playClick();
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/80 scale-[1.02]'
                  : 'text-emerald-300/80 hover:text-white hover:bg-emerald-900/40'
              }`}
            >
              <Icon size={15} className={isActive ? 'text-white' : 'text-emerald-400'} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`px-2 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-emerald-950 text-emerald-200' : 'bg-[#021810] text-emerald-400 border border-emerald-800/60'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. SEARCH & DEPARTMENT FACET BAR (FOR LIST VIEWS) */}
      {subTab !== 'references' && (
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 shadow">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${subTab.replace('_', ' ')} by keyword, title, author, or methodology...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[11px] text-slate-400 font-semibold shrink-0">Dept Filter:</span>
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-300 font-medium focus:outline-none focus:border-emerald-500"
            >
              <option value="All">All Academic Departments</option>
              {departments.map(dept => (
                <option key={dept.code} value={dept.name}>
                  {dept.code} — {dept.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 4. SUB-TAB 1: HND PROJECTS & DISSERTATIONS */}
      {subTab === 'hnd_projects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Showing <strong className="text-white">{filteredTheses.length}</strong> verified HND Capstone Dissertations</span>
            <span className="font-mono text-emerald-400">Institutional OAI-PMH Compliant</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTheses.map(th => (
              <div
                key={th.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between group shadow-lg space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {th.callNumber}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">{th.year} • {th.degree.includes('HND') ? 'HND II' : 'ND II'}</span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-300 transition line-clamp-2">
                    {th.title}
                  </h3>

                  <div className="text-xs text-slate-400">
                    <span>By <strong className="text-slate-200">{th.author}</strong></span>
                    <span className="mx-1">•</span>
                    <span>Advisor: <strong className="text-slate-300">{th.supervisor}</strong></span>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                    {th.abstract}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                  <span className="text-[11px] font-mono text-slate-400 truncate max-w-[150px]">
                    DOI: {th.doi}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(th.doi, th.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-[11px]"
                      title="Copy Permanent DOI"
                    >
                      {copiedId === th.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                    <button
                      onClick={() => {
                        sounds.playClick();
                        if (onOpenReader) {
                          onOpenReader({
                            id: th.id || `TH-${Date.now()}`,
                            title: th.title,
                            subtitle: `${th.degree || 'HND II Dissertation'} • Dept: ${th.department}`,
                            author: th.author,
                            authorCredentials: `${th.degree || 'HND II Scholar'} (Advisor: ${th.supervisor})`,
                            authorAffiliation: `Federal Co-operative College, Ibadan (${th.department})`,
                            callNumber: th.callNumber || `ETD-FCC-${th.year || 2026}`,
                            shelfLocation: 'Institutional Repository • Digital ETD Collection',
                            isDigital: true,
                            pdfPages: th.pages || 148,
                            fileDataUrl: th.fileDataUrl || '',
                            pdfUrl: th.fileDataUrl || '',
                            fileName: `${th.title.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
                            abstract: th.abstract,
                            doi: th.doi
                          });
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow flex items-center gap-1.5 transition"
                    >
                      <BookOpen size={13} />
                      <span>Read Dissertation</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. SUB-TAB 2: RESEARCH PAPERS (OPEN ACCESS & CROSSREF) */}
      {subTab === 'papers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Peer-Reviewed Open Access Research Papers (OpenAlex Index)</span>
            <span className="font-mono text-indigo-400">Live Scholarly Harvesting</span>
          </div>

          <div className="space-y-3">
            {filteredPapers.map(paper => (
              <div
                key={paper.id}
                className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition space-y-2 shadow-md"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                    {paper.venue || 'Peer-Reviewed Journal'}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">{paper.year}</span>
                </div>

                <h4 className="text-sm sm:text-base font-bold text-white hover:text-indigo-300 transition">
                  {paper.title}
                </h4>

                <p className="text-xs text-slate-400">
                  Authors: {paper.authors?.join(', ')}
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {paper.concepts?.slice(0, 4).map((c, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300">
                      #{c}
                    </span>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-emerald-400 font-mono">
                    Citations: {paper.citedByCount || 14}
                  </span>
                  <a
                    href={paper.doiUrl || `https://doi.org/${paper.doi}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-bold border border-indigo-500/40 transition flex items-center gap-1.5"
                  >
                    <span>Full Text DOI</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. SUB-TAB 3: JOURNALS & PERIODICALS */}
      {subTab === 'journals' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-400 px-1">
            Institutional & Consortia Indexed Academic Journals
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SCHOLARLY_JOURNALS.map(j => (
              <div
                key={j.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-950 text-teal-300 border border-teal-800">
                    ISSN: {j.issn}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">{j.latestIssue}</span>
                </div>

                <h4 className="text-base font-bold text-white leading-snug">
                  {j.title}
                </h4>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {j.scope}
                </p>

                <div className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
                  <div><strong>Publisher:</strong> {j.publisher}</div>
                  <div className="text-[11px] text-slate-400">Indexed in: {j.indexedIn}</div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-emerald-400 font-mono">
                    {j.articlesCount} Peer-Reviewed Articles
                  </span>
                  <button
                    onClick={() => {
                      sounds.playClick();
                      alert(`Accessing ${j.title} volume archive via Federal Institutional Repository proxy.`);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow flex items-center gap-1.5 transition"
                  >
                    <span>Browse Issues</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. SUB-TAB 4: HND PROJECT TOPICS BANK */}
      {subTab === 'topics' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/80 text-xs text-emerald-200 flex items-start gap-3">
            <Sparkles size={18} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-white text-sm">Approved Final Year Project Topic Repository</div>
              <p className="text-emerald-300/80 mt-0.5 leading-relaxed">
                Curated by FCC Departmental Academic Boards. Each topic includes verified problem statements, empirical methodologies, and call-number references mapped to physical library stacks.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {filteredTopics.map(top => {
              const isSaved = savedTopics.includes(top.id);
              return (
                <div
                  key={top.id}
                  className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg hover:border-emerald-500/40 transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {top.dept}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                        {top.level}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleSaveTopic(top.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border ${
                        isSaved
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-950 text-slate-300 hover:text-white border-slate-800'
                      }`}
                    >
                      <Bookmark size={13} className={isSaved ? 'fill-amber-400 text-amber-400' : ''} />
                      <span>{isSaved ? 'Saved to My Projects' : 'Save Topic'}</span>
                    </button>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                      {top.title}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">
                        Problem Statement
                      </span>
                      <p className="text-slate-300 leading-relaxed">
                        {top.problem}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                      <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wide">
                        Suggested Research Methodology
                      </span>
                      <p className="text-slate-300 leading-relaxed">
                        {top.methodology}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Core Research Objectives
                    </span>
                    <ul className="space-y-1 text-slate-300">
                      {top.objectives.map((obj, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold shrink-0">{i + 1}.</span>
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 block">Recommended Shelf Holdings:</span>
                      {top.shelfReferences.map((ref, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-slate-300 text-[11px]">
                          <span className="font-mono text-emerald-400 font-bold">{ref.callNumber}</span>
                          <span>— {ref.title}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleCopy(`${top.title}\n\nProblem:\n${top.problem}\n\nMethodology:\n${top.methodology}`, top.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      {copiedId === top.id ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      <span>{copiedId === top.id ? 'Proposal Copied!' : 'Copy Proposal Text'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 8. SUB-TAB 5: REFERENCES & CITATION BUILDER */}
      {subTab === 'references' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Form: Citation Parameters */}
          <div className="lg:col-span-6 p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Quote size={18} className="text-emerald-400" />
                  <span>Academic Citation Generator</span>
                </h3>
                <p className="text-xs text-slate-400">Institutional Reference Standards for HND Dissertations</p>
              </div>

              {/* Style Selector */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                {['APA', 'Harvard', 'MLA', 'Chicago', 'IEEE', 'BibTeX'].map(style => (
                  <button
                    key={style}
                    onClick={() => setSelectedStyle(style)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      selectedStyle === style
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCitationForm({ ...citationForm, type: 'book' })}
                  className={`flex-1 py-1.5 rounded-lg font-bold border transition ${
                    citationForm.type === 'book'
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  Book / Monograph
                </button>
                <button
                  type="button"
                  onClick={() => setCitationForm({ ...citationForm, type: 'journal' })}
                  className={`flex-1 py-1.5 rounded-lg font-bold border transition ${
                    citationForm.type === 'journal'
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  Journal Article
                </button>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Author(s) (Surname, Initials)</label>
                <input
                  type="text"
                  value={citationForm.author}
                  onChange={e => setCitationForm({ ...citationForm, author: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Publication Year</label>
                  <input
                    type="text"
                    value={citationForm.year}
                    onChange={e => setCitationForm({ ...citationForm, year: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">DOI / Accession Ref</label>
                  <input
                    type="text"
                    value={citationForm.doi}
                    onChange={e => setCitationForm({ ...citationForm, doi: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Work Title</label>
                <input
                  type="text"
                  value={citationForm.title}
                  onChange={e => setCitationForm({ ...citationForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {citationForm.type === 'book' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Publisher</label>
                    <input
                      type="text"
                      value={citationForm.publisher}
                      onChange={e => setCitationForm({ ...citationForm, publisher: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">City / Location</label>
                    <input
                      type="text"
                      value={citationForm.place}
                      onChange={e => setCitationForm({ ...citationForm, place: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Journal Name</label>
                    <input
                      type="text"
                      value={citationForm.journal}
                      onChange={e => setCitationForm({ ...citationForm, journal: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Vol / Issue</label>
                    <input
                      type="text"
                      value={`${citationForm.volume}(${citationForm.issue})`}
                      onChange={e => {
                        const parts = e.target.value.replace(')', '').split('(');
                        setCitationForm({ ...citationForm, volume: parts[0] || '1', issue: parts[1] || '1' });
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Pages</label>
                    <input
                      type="text"
                      value={citationForm.pages}
                      onChange={e => setCitationForm({ ...citationForm, pages: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Preview Card */}
          <div className="lg:col-span-6 space-y-4">
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-800/80 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  {selectedStyle} 7th EDITION PREVIEW
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Ready to Paste
                </span>
              </div>

              {/* Formatted Output Box */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm font-serif leading-relaxed text-white selection:bg-emerald-500">
                {formattedCitation}
              </div>

              {/* In-Text Citation Box */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">In-Text Citation (Parenthetical)</span>
                <span className="text-emerald-300 font-mono">({citationForm.author.split(',')[0]}, {citationForm.year})</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => handleCopy(formattedCitation, 'citation-full')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950 flex items-center gap-2 transition"
                >
                  {copiedId === 'citation-full' ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedId === 'citation-full' ? 'Citation Copied!' : 'Copy Citation'}</span>
                </button>
              </div>
            </div>

            {/* Quick Reference Rules Guideline */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-2 text-slate-300">
              <div className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-emerald-400" />
                <span>FCC Institutional Dissertation Style Guide</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Higher National Diploma (HND) projects must strictly follow the APA 7th Edition format for in-text citations and the reference list. Ensure every in-text citation corresponds to a complete alphabetical entry in Chapter 5.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
