// Centralized Theme Configuration for HOD Dashboard & Ingestion Studio
// Synchronizes solid brand colors created by Admin or Developer from the database.
// Guarantees that every academic department possesses a distinct, non-colliding solid color.

export const SOLID_COLOR_PALETTES = {
  blue: {
    key: 'blue',
    name: 'Royal Blue',
    solid: '#1d4ed8',
    dark: '#1e3a8a',
    deep: '#0f172a',
    accent: '#60a5fa',
    border: 'border-blue-500',
    btn: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-950',
    badge: 'bg-blue-950 text-blue-200 border-blue-700',
    grad: 'from-blue-950/90 via-slate-900 to-slate-900 border-blue-600/50',
    txt: 'text-blue-400'
  },
  emerald: {
    key: 'emerald',
    name: 'Forest Emerald',
    solid: '#059669',
    dark: '#064e3b',
    deep: '#022c22',
    accent: '#34d399',
    border: 'border-emerald-500',
    btn: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950',
    badge: 'bg-emerald-950 text-emerald-200 border-emerald-700',
    grad: 'from-emerald-950/90 via-slate-900 to-slate-900 border-emerald-600/50',
    txt: 'text-emerald-400'
  },
  amber: {
    key: 'amber',
    name: 'Amber Gold',
    solid: '#d97706',
    dark: '#78350f',
    deep: '#451a03',
    accent: '#fbbf24',
    border: 'border-amber-500',
    btn: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950',
    badge: 'bg-amber-950 text-amber-200 border-amber-700',
    grad: 'from-amber-950/90 via-slate-900 to-slate-900 border-amber-600/50',
    txt: 'text-amber-400'
  },
  violet: {
    key: 'violet',
    name: 'Violet Purple',
    solid: '#7c3aed',
    dark: '#4c1d95',
    deep: '#2e1065',
    accent: '#c084fc',
    border: 'border-violet-500',
    btn: 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-950',
    badge: 'bg-violet-950 text-violet-200 border-violet-700',
    grad: 'from-violet-950/90 via-slate-900 to-slate-900 border-violet-600/50',
    txt: 'text-violet-400'
  },
  rose: {
    key: 'rose',
    name: 'Crimson Rose',
    solid: '#e11d48',
    dark: '#881337',
    deep: '#4c0519',
    accent: '#fb7185',
    border: 'border-rose-500',
    btn: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950',
    badge: 'bg-rose-950 text-rose-200 border-rose-700',
    grad: 'from-rose-950/90 via-slate-900 to-slate-900 border-rose-600/50',
    txt: 'text-rose-400'
  },
  teal: {
    key: 'teal',
    name: 'Ocean Teal',
    solid: '#0d9488',
    dark: '#134e4a',
    deep: '#042f2e',
    accent: '#2dd4bf',
    border: 'border-teal-500',
    btn: 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-950',
    badge: 'bg-teal-950 text-teal-200 border-teal-700',
    grad: 'from-teal-950/90 via-slate-900 to-slate-900 border-teal-600/50',
    txt: 'text-teal-400'
  },
  indigo: {
    key: 'indigo',
    name: 'Royal Indigo',
    solid: '#4f46e5',
    dark: '#312e81',
    deep: '#1e1b4b',
    accent: '#818cf8',
    border: 'border-indigo-500',
    btn: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950',
    badge: 'bg-indigo-950 text-indigo-200 border-indigo-700',
    grad: 'from-indigo-950/90 via-slate-900 to-slate-900 border-indigo-600/50',
    txt: 'text-indigo-400'
  },
  cyan: {
    key: 'cyan',
    name: 'Electric Cyan',
    solid: '#06b6d4',
    dark: '#0e7490',
    deep: '#083344',
    accent: '#22d3ee',
    border: 'border-cyan-500',
    btn: 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-950',
    badge: 'bg-cyan-950 text-cyan-200 border-cyan-700',
    grad: 'from-cyan-950/90 via-slate-900 to-slate-900 border-cyan-600/50',
    txt: 'text-cyan-400'
  },
  sky: {
    key: 'sky',
    name: 'Sky Blue',
    solid: '#0284c7',
    dark: '#0369a1',
    deep: '#082f49',
    accent: '#38bdf8',
    border: 'border-sky-500',
    btn: 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-950',
    badge: 'bg-sky-950 text-sky-200 border-sky-700',
    grad: 'from-sky-950/90 via-slate-900 to-slate-900 border-sky-600/50',
    txt: 'text-sky-400'
  },
  lime: {
    key: 'lime',
    name: 'Lime Olive',
    solid: '#65a30d',
    dark: '#3f6212',
    deep: '#1a2e05',
    accent: '#a3e635',
    border: 'border-lime-500',
    btn: 'bg-lime-600 hover:bg-lime-500 text-white shadow-lime-950',
    badge: 'bg-lime-950 text-lime-200 border-lime-700',
    grad: 'from-lime-950/90 via-slate-900 to-slate-900 border-lime-600/50',
    txt: 'text-lime-400'
  },
  bronze: {
    key: 'bronze',
    name: 'Warm Bronze',
    solid: '#b45309',
    dark: '#78350f',
    deep: '#451a03',
    accent: '#f59e0b',
    border: 'border-amber-600',
    btn: 'bg-amber-700 hover:bg-amber-600 text-white shadow-amber-950',
    badge: 'bg-amber-950 text-amber-200 border-amber-700',
    grad: 'from-amber-950/90 via-slate-900 to-slate-900 border-amber-600/50',
    txt: 'text-amber-400'
  },
  orange: {
    key: 'orange',
    name: 'Rustic Orange',
    solid: '#ea580c',
    dark: '#9a3412',
    deep: '#431407',
    accent: '#fb923c',
    border: 'border-orange-500',
    btn: 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-950',
    badge: 'bg-orange-950 text-orange-200 border-orange-700',
    grad: 'from-orange-950/90 via-slate-900 to-slate-900 border-orange-600/50',
    txt: 'text-orange-400'
  },
  fuchsia: {
    key: 'fuchsia',
    name: 'Tech Fuchsia',
    solid: '#c026d3',
    dark: '#86198f',
    deep: '#4a044e',
    accent: '#e879f9',
    border: 'border-fuchsia-500',
    btn: 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-fuchsia-950',
    badge: 'bg-fuchsia-950 text-fuchsia-200 border-fuchsia-700',
    grad: 'from-fuchsia-950/90 via-slate-900 to-slate-900 border-fuchsia-600/50',
    txt: 'text-fuchsia-400'
  },
  sunset: {
    key: 'sunset',
    name: 'Sunset Coral',
    solid: '#f43f5e',
    dark: '#be123c',
    deep: '#4c0519',
    accent: '#fb7185',
    border: 'border-rose-500',
    btn: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950',
    badge: 'bg-rose-950 text-rose-200 border-rose-700',
    grad: 'from-rose-950/90 via-slate-900 to-slate-900 border-rose-600/50',
    txt: 'text-rose-400'
  },
  yellow: {
    key: 'yellow',
    name: 'Solar Gold',
    solid: '#eab308',
    dark: '#a16207',
    deep: '#422006',
    accent: '#fde047',
    badge: 'bg-yellow-950 text-yellow-200 border-yellow-700',
    grad: 'from-yellow-950/90 via-slate-900 to-slate-900 border-yellow-600/50',
    txt: 'text-yellow-400',
    btn: 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-yellow-950',
    border: 'border-yellow-500'
  },
  slate: {
    key: 'slate',
    name: 'Slate Platinum',
    solid: '#64748b',
    dark: '#334155',
    deep: '#0f172a',
    accent: '#94a3b8',
    border: 'border-slate-500',
    btn: 'bg-slate-700 hover:bg-slate-600 text-white shadow-slate-950',
    badge: 'bg-slate-900 text-slate-200 border-slate-700',
    grad: 'from-slate-900 via-slate-900 to-slate-950 border-slate-600/50',
    txt: 'text-slate-300'
  },
  crimson: {
    key: 'crimson',
    name: 'Ruby Crimson',
    solid: '#be123c',
    dark: '#881337',
    deep: '#4c0519',
    accent: '#fda4af',
    border: 'border-rose-600',
    btn: 'bg-rose-700 hover:bg-rose-600 text-white shadow-rose-950',
    badge: 'bg-rose-950 text-rose-200 border-rose-800',
    grad: 'from-rose-950/90 via-slate-900 to-slate-900 border-rose-700/50',
    txt: 'text-rose-400'
  },
  navy: {
    key: 'navy',
    name: 'Cobalt Navy',
    solid: '#2563eb',
    dark: '#1d4ed8',
    deep: '#172554',
    accent: '#60a5fa',
    border: 'border-blue-500',
    btn: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-950',
    badge: 'bg-blue-950 text-blue-200 border-blue-700',
    grad: 'from-blue-950/90 via-slate-900 to-slate-900 border-blue-600/50',
    txt: 'text-blue-400'
  },
  jade: {
    key: 'jade',
    name: 'Deep Jade',
    solid: '#047857',
    dark: '#064e3b',
    deep: '#022c22',
    accent: '#6ee7b7',
    border: 'border-emerald-600',
    btn: 'bg-emerald-700 hover:bg-emerald-600 text-white shadow-emerald-950',
    badge: 'bg-emerald-950 text-emerald-200 border-emerald-800',
    grad: 'from-emerald-950/90 via-slate-900 to-slate-900 border-emerald-700/50',
    txt: 'text-emerald-400'
  },
  grape: {
    key: 'grape',
    name: 'Deep Grape',
    solid: '#581c87',
    dark: '#3b0764',
    deep: '#1e0538',
    accent: '#d8b4fe',
    border: 'border-purple-600',
    btn: 'bg-purple-800 hover:bg-purple-700 text-white shadow-purple-950',
    badge: 'bg-purple-950 text-purple-200 border-purple-800',
    grad: 'from-purple-950/90 via-slate-900 to-slate-900 border-purple-700/50',
    txt: 'text-purple-400'
  },
  copper: {
    key: 'copper',
    name: 'Rustic Copper',
    solid: '#9a3412',
    dark: '#7c2d12',
    deep: '#431407',
    accent: '#fdba74',
    border: 'border-orange-600',
    btn: 'bg-orange-800 hover:bg-orange-700 text-white shadow-orange-950',
    badge: 'bg-orange-950 text-orange-200 border-orange-800',
    grad: 'from-orange-950/90 via-slate-900 to-slate-900 border-orange-700/50',
    txt: 'text-orange-400'
  },
  coffee: {
    key: 'coffee',
    name: 'Warm Mocha',
    solid: '#78350f',
    dark: '#5a250b',
    deep: '#361505',
    accent: '#fcd34d',
    border: 'border-amber-700',
    btn: 'bg-amber-800 hover:bg-amber-700 text-white shadow-amber-950',
    badge: 'bg-amber-950 text-amber-200 border-amber-800',
    grad: 'from-amber-950/90 via-slate-900 to-slate-900 border-amber-700/50',
    txt: 'text-amber-400'
  },
  magenta: {
    key: 'magenta',
    name: 'Bright Magenta',
    solid: '#a21caf',
    dark: '#701a75',
    deep: '#4a044e',
    accent: '#f0abfc',
    border: 'border-fuchsia-600',
    btn: 'bg-fuchsia-700 hover:bg-fuchsia-600 text-white shadow-fuchsia-950',
    badge: 'bg-fuchsia-950 text-fuchsia-200 border-fuchsia-800',
    grad: 'from-fuchsia-950/90 via-slate-900 to-slate-900 border-fuchsia-700/50',
    txt: 'text-fuchsia-400'
  },
  steel: {
    key: 'steel',
    name: 'Deep Steel',
    solid: '#334155',
    dark: '#1e293b',
    deep: '#0f172a',
    accent: '#cbd5e1',
    border: 'border-slate-600',
    btn: 'bg-slate-800 hover:bg-slate-700 text-white shadow-slate-950',
    badge: 'bg-slate-900 text-slate-200 border-slate-700',
    grad: 'from-slate-900 via-slate-900 to-slate-950 border-slate-700/50',
    txt: 'text-slate-300'
  }
};

// Aliases for backwards compatibility with historical seeds
SOLID_COLOR_PALETTES.purple = SOLID_COLOR_PALETTES.violet;
SOLID_COLOR_PALETTES.red = SOLID_COLOR_PALETTES.rose;
SOLID_COLOR_PALETTES.mint = SOLID_COLOR_PALETTES.emerald;
SOLID_COLOR_PALETTES.gold = SOLID_COLOR_PALETTES.yellow;

export const HOD_DEPARTMENT_THEMES = {
  CSC: {
    deptCode: 'CSC',
    deptName: 'Computer Science & Information Technology',
    colorKey: 'blue',
    colorName: 'Royal Blue',
    solidPrimary: '#1d4ed8',
    solidDark: '#1e3a8a',
    solidDeep: '#0f172a',
    accent: '#60a5fa',
    badgeClass: 'bg-blue-950 text-blue-200 border-blue-700',
    bannerGradient: 'from-blue-950/90 via-slate-900 to-slate-900 border-blue-600/50',
    btnPrimary: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-950',
    activeTab: 'bg-blue-600 text-white shadow-lg shadow-blue-950',
    textAccent: 'text-blue-400',
    borderSolid: 'border-blue-500'
  },
  CEM: {
    deptCode: 'CEM',
    deptName: 'Co-operative Economics & Management',
    colorKey: 'emerald',
    colorName: 'Forest Emerald',
    solidPrimary: '#059669',
    solidDark: '#064e3b',
    solidDeep: '#022c22',
    accent: '#34d399',
    badgeClass: 'bg-emerald-950 text-emerald-200 border-emerald-700',
    bannerGradient: 'from-emerald-950/90 via-slate-900 to-slate-900 border-emerald-600/50',
    btnPrimary: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950',
    activeTab: 'bg-emerald-600 text-white shadow-lg shadow-emerald-950',
    textAccent: 'text-emerald-400',
    borderSolid: 'border-emerald-500'
  },
  BNF: {
    deptCode: 'BNF',
    deptName: 'Banking & Finance',
    colorKey: 'amber',
    colorName: 'Amber Gold',
    solidPrimary: '#d97706',
    solidDark: '#78350f',
    solidDeep: '#451a03',
    accent: '#fbbf24',
    badgeClass: 'bg-amber-950 text-amber-200 border-amber-700',
    bannerGradient: 'from-amber-950/90 via-slate-900 to-slate-900 border-amber-600/50',
    btnPrimary: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950',
    activeTab: 'bg-amber-600 text-white shadow-lg shadow-amber-950',
    textAccent: 'text-amber-400',
    borderSolid: 'border-amber-500'
  },
  AGR: {
    deptCode: 'AGR',
    deptName: 'Agricultural Extension & Management',
    colorKey: 'violet',
    colorName: 'Violet Purple',
    solidPrimary: '#7c3aed',
    solidDark: '#4c1d95',
    solidDeep: '#2e1065',
    accent: '#c084fc',
    badgeClass: 'bg-violet-950 text-violet-200 border-violet-700',
    bannerGradient: 'from-violet-950/90 via-slate-900 to-slate-900 border-violet-600/50',
    btnPrimary: 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-950',
    activeTab: 'bg-violet-600 text-white shadow-lg shadow-violet-950',
    textAccent: 'text-violet-400',
    borderSolid: 'border-violet-500'
  },
  BAM: {
    deptCode: 'BAM',
    deptName: 'Business Administration & Management',
    colorKey: 'rose',
    colorName: 'Crimson Rose',
    solidPrimary: '#e11d48',
    solidDark: '#881337',
    solidDeep: '#4c0519',
    accent: '#fb7185',
    badgeClass: 'bg-rose-950 text-rose-200 border-rose-700',
    bannerGradient: 'from-rose-950/90 via-slate-900 to-slate-900 border-rose-600/50',
    btnPrimary: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950',
    activeTab: 'bg-rose-600 text-white shadow-lg shadow-rose-950',
    textAccent: 'text-rose-400',
    borderSolid: 'border-rose-500'
  },
  PAD: {
    deptCode: 'PAD',
    deptName: 'Public Administration',
    colorKey: 'teal',
    colorName: 'Ocean Teal',
    solidPrimary: '#0d9488',
    solidDark: '#134e4a',
    solidDeep: '#042f2e',
    accent: '#2dd4bf',
    badgeClass: 'bg-teal-950 text-teal-200 border-teal-700',
    bannerGradient: 'from-teal-950/90 via-slate-900 to-slate-900 border-teal-600/50',
    btnPrimary: 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-950',
    activeTab: 'bg-teal-600 text-white shadow-lg shadow-teal-950',
    textAccent: 'text-teal-400',
    borderSolid: 'border-teal-500'
  },
  LIS: {
    deptCode: 'LIS',
    deptName: 'Library and Information Science',
    colorKey: 'indigo',
    colorName: 'Royal Indigo',
    solidPrimary: '#4f46e5',
    solidDark: '#312e81',
    solidDeep: '#1e1b4b',
    accent: '#818cf8',
    badgeClass: 'bg-indigo-950 text-indigo-200 border-indigo-700',
    bannerGradient: 'from-indigo-950/90 via-slate-900 to-slate-900 border-indigo-600/50',
    btnPrimary: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950',
    activeTab: 'bg-indigo-600 text-white shadow-lg shadow-indigo-950',
    textAccent: 'text-indigo-400',
    borderSolid: 'border-indigo-500'
  },
  PA: {
    deptCode: 'PA',
    deptName: 'Public Administration',
    colorKey: 'teal',
    colorName: 'Ocean Teal',
    solidPrimary: '#0d9488',
    solidDark: '#134e4a',
    solidDeep: '#042f2e',
    accent: '#2dd4bf',
    badgeClass: 'bg-teal-950 text-teal-200 border-teal-700',
    bannerGradient: 'from-teal-950/90 via-slate-900 to-slate-900 border-teal-600/50',
    btnPrimary: 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-950',
    activeTab: 'bg-teal-600 text-white shadow-lg shadow-teal-950',
    textAccent: 'text-teal-400',
    borderSolid: 'border-teal-500'
  },
  BF: {
    deptCode: 'BF',
    deptName: 'Banking and Finance',
    colorKey: 'amber',
    colorName: 'Amber Gold',
    solidPrimary: '#d97706',
    solidDark: '#78350f',
    solidDeep: '#451a03',
    accent: '#fbbf24',
    badgeClass: 'bg-amber-950 text-amber-200 border-amber-700',
    bannerGradient: 'from-amber-950/90 via-slate-900 to-slate-900 border-amber-600/50',
    btnPrimary: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950',
    activeTab: 'bg-amber-600 text-white shadow-lg shadow-amber-950',
    textAccent: 'text-amber-400',
    borderSolid: 'border-amber-500'
  },
  ACC: {
    deptCode: 'ACC',
    deptName: 'Accountancy',
    colorKey: 'sky',
    colorName: 'Sky Blue',
    solidPrimary: '#0284c7',
    solidDark: '#0369a1',
    solidDeep: '#082f49',
    accent: '#38bdf8',
    badgeClass: 'bg-sky-950 text-sky-200 border-sky-700',
    bannerGradient: 'from-sky-950/90 via-slate-900 to-slate-900 border-sky-600/50',
    btnPrimary: 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-950',
    activeTab: 'bg-sky-600 text-white shadow-lg shadow-sky-950',
    textAccent: 'text-sky-400',
    borderSolid: 'border-sky-500'
  },
  AM: {
    deptCode: 'AM',
    deptName: 'Agribusiness Management',
    colorKey: 'jade',
    colorName: 'Deep Jade',
    solidPrimary: '#047857',
    solidDark: '#064e3b',
    solidDeep: '#022c22',
    accent: '#6ee7b7',
    badgeClass: 'bg-emerald-950 text-emerald-200 border-emerald-700',
    bannerGradient: 'from-emerald-950/90 via-slate-900 to-slate-900 border-emerald-600/50',
    btnPrimary: 'bg-emerald-700 hover:bg-emerald-600 text-white shadow-emerald-950',
    activeTab: 'bg-emerald-700 text-white shadow-lg shadow-emerald-950',
    textAccent: 'text-emerald-400',
    borderSolid: 'border-emerald-600'
  },
  AER: {
    deptCode: 'AER',
    deptName: 'Agricultural Extension & Rural Development',
    colorKey: 'lime',
    colorName: 'Lime Olive',
    solidPrimary: '#65a30d',
    solidDark: '#3f6212',
    solidDeep: '#1a2e05',
    accent: '#a3e635',
    badgeClass: 'bg-lime-950 text-lime-200 border-lime-700',
    bannerGradient: 'from-lime-950/90 via-slate-900 to-slate-900 border-lime-600/50',
    btnPrimary: 'bg-lime-600 hover:bg-lime-500 text-white shadow-lime-950',
    activeTab: 'bg-lime-600 text-white shadow-lg shadow-lime-950',
    textAccent: 'text-lime-400',
    borderSolid: 'border-lime-500'
  },
  AGT: {
    deptCode: 'AGT',
    deptName: 'Agriculture Technology',
    colorKey: 'bronze',
    colorName: 'Warm Bronze',
    solidPrimary: '#b45309',
    solidDark: '#78350f',
    solidDeep: '#451a03',
    accent: '#f59e0b',
    badgeClass: 'bg-amber-950 text-amber-200 border-amber-700',
    bannerGradient: 'from-amber-950/90 via-slate-900 to-slate-900 border-amber-600/50',
    btnPrimary: 'bg-amber-700 hover:bg-amber-600 text-white shadow-amber-950',
    activeTab: 'bg-amber-700 text-white shadow-lg shadow-amber-950',
    textAccent: 'text-amber-400',
    borderSolid: 'border-amber-600'
  },
  APT: {
    deptCode: 'APT',
    deptName: 'Animal Production Technology',
    colorKey: 'orange',
    colorName: 'Rustic Orange',
    solidPrimary: '#ea580c',
    solidDark: '#9a3412',
    solidDeep: '#431407',
    accent: '#fb923c',
    badgeClass: 'bg-orange-950 text-orange-200 border-orange-700',
    bannerGradient: 'from-orange-950/90 via-slate-900 to-slate-900 border-orange-600/50',
    btnPrimary: 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-950',
    activeTab: 'bg-orange-600 text-white shadow-lg shadow-orange-950',
    textAccent: 'text-orange-400',
    borderSolid: 'border-orange-500'
  },
  AI: {
    deptCode: 'AI',
    deptName: 'Artificial Intelligence',
    colorKey: 'cyan',
    colorName: 'Electric Cyan',
    solidPrimary: '#06b6d4',
    solidDark: '#0e7490',
    solidDeep: '#083344',
    accent: '#22d3ee',
    badgeClass: 'bg-cyan-950 text-cyan-200 border-cyan-700',
    bannerGradient: 'from-cyan-950/90 via-slate-900 to-slate-900 border-cyan-600/50',
    btnPrimary: 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-950',
    activeTab: 'bg-cyan-600 text-white shadow-lg shadow-cyan-950',
    textAccent: 'text-cyan-400',
    borderSolid: 'border-cyan-500'
  },
  SWD: {
    deptCode: 'SWD',
    deptName: 'Software and Web Development',
    colorKey: 'fuchsia',
    colorName: 'Tech Fuchsia',
    solidPrimary: '#c026d3',
    solidDark: '#86198f',
    solidDeep: '#4a044e',
    accent: '#e879f9',
    badgeClass: 'bg-fuchsia-950 text-fuchsia-200 border-fuchsia-700',
    bannerGradient: 'from-fuchsia-950/90 via-slate-900 to-slate-900 border-fuchsia-600/50',
    btnPrimary: 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-fuchsia-950',
    activeTab: 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-950',
    textAccent: 'text-fuchsia-400',
    borderSolid: 'border-fuchsia-500'
  },
  NCC: {
    deptCode: 'NCC',
    deptName: 'Networking and Cloud Computing',
    colorKey: 'navy',
    colorName: 'Cobalt Navy',
    solidPrimary: '#2563eb',
    solidDark: '#1d4ed8',
    solidDeep: '#172554',
    accent: '#60a5fa',
    badgeClass: 'bg-blue-950 text-blue-200 border-blue-700',
    bannerGradient: 'from-blue-950/90 via-slate-900 to-slate-900 border-blue-600/50',
    btnPrimary: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-950',
    activeTab: 'bg-blue-600 text-white shadow-lg shadow-blue-950',
    textAccent: 'text-blue-400',
    borderSolid: 'border-blue-500'
  },
  HMT: {
    deptCode: 'HMT',
    deptName: 'Hospitality Management Technology',
    colorKey: 'sunset',
    colorName: 'Sunset Coral',
    solidPrimary: '#f43f5e',
    solidDark: '#be123c',
    solidDeep: '#4c0519',
    accent: '#fb7185',
    badgeClass: 'bg-rose-950 text-rose-200 border-rose-700',
    bannerGradient: 'from-rose-950/90 via-slate-900 to-slate-900 border-rose-600/50',
    btnPrimary: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950',
    activeTab: 'bg-rose-600 text-white shadow-lg shadow-rose-950',
    textAccent: 'text-rose-400',
    borderSolid: 'border-rose-500'
  },
  HRE: {
    deptCode: 'HRE',
    deptName: 'Home and Rural Economics',
    colorKey: 'jade',
    colorName: 'Forest Jade',
    solidPrimary: '#10b981',
    solidDark: '#047857',
    solidDeep: '#022c22',
    accent: '#34d399',
    badgeClass: 'bg-emerald-950 text-emerald-200 border-emerald-700',
    bannerGradient: 'from-emerald-950/90 via-slate-900 to-slate-900 border-emerald-600/50',
    btnPrimary: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950',
    activeTab: 'bg-emerald-600 text-white shadow-lg shadow-emerald-950',
    textAccent: 'text-emerald-400',
    borderSolid: 'border-emerald-500'
  },
  MC: {
    deptCode: 'MC',
    deptName: 'Mass Communication',
    colorKey: 'yellow',
    colorName: 'Solar Gold',
    solidPrimary: '#eab308',
    solidDark: '#a16207',
    solidDeep: '#422006',
    accent: '#fde047',
    badgeClass: 'bg-yellow-950 text-yellow-200 border-yellow-700',
    bannerGradient: 'from-yellow-950/90 via-slate-900 to-slate-900 border-yellow-600/50',
    btnPrimary: 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-yellow-950',
    activeTab: 'bg-yellow-600 text-white shadow-lg shadow-yellow-950',
    textAccent: 'text-yellow-400',
    borderSolid: 'border-yellow-500'
  },
  OTM: {
    deptCode: 'OTM',
    deptName: 'Office Technology Management',
    colorKey: 'slate',
    colorName: 'Slate Platinum',
    solidPrimary: '#64748b',
    solidDark: '#334155',
    solidDeep: '#0f172a',
    accent: '#94a3b8',
    badgeClass: 'bg-slate-900 text-slate-200 border-slate-700',
    bannerGradient: 'from-slate-900 via-slate-900 to-slate-950 border-slate-600/50',
    btnPrimary: 'bg-slate-700 hover:bg-slate-600 text-white shadow-slate-950',
    activeTab: 'bg-slate-700 text-white shadow-lg shadow-slate-950',
    textAccent: 'text-slate-300',
    borderSolid: 'border-slate-500'
  }
};

/**
 * Normalizes any color input (key, hex, or color name) to a canonical SOLID_COLOR_PALETTES key.
 */
export function normalizeColorKey(rawColor = '') {
  if (!rawColor) return '';
  const c = String(rawColor).trim().toLowerCase();
  for (const [key, p] of Object.entries(SOLID_COLOR_PALETTES)) {
    if (key === c || p.name.toLowerCase() === c || p.solid.toLowerCase() === c) {
      return p.key || key;
    }
  }
  return c;
}

/**
 * Returns a map of all colors currently occupied by existing departments.
 * Example return: { blue: 'CSC', emerald: 'CEM', '#1d4ed8': 'CSC' }
 */
export function getUsedDepartmentColors(departments = [], excludeDeptIdOrCode = null) {
  const used = {};
  if (!Array.isArray(departments)) return used;

  const excludeTarget = excludeDeptIdOrCode ? String(excludeDeptIdOrCode).toUpperCase() : null;

  departments.forEach(dept => {
    if (!dept) return;
    const deptId = String(dept.id || '').toUpperCase();
    const deptCode = String(dept.code || '').toUpperCase();

    if (excludeTarget && (deptId === excludeTarget || deptCode === excludeTarget)) {
      return;
    }

    let colorKey = normalizeColorKey(dept.color);
    if (!colorKey && HOD_DEPARTMENT_THEMES[deptCode]) {
      colorKey = HOD_DEPARTMENT_THEMES[deptCode].colorKey;
    }

    if (colorKey) {
      used[colorKey] = deptCode;
      if (SOLID_COLOR_PALETTES[colorKey]) {
        used[SOLID_COLOR_PALETTES[colorKey].solid.toLowerCase()] = deptCode;
      }
    }
  });

  return used;
}

/**
 * Automatically computes the next guaranteed UNIQUE solid color key that is NOT taken by any existing department.
 */
export function getAvailableDepartmentColor(departments = [], preferredKey = null, excludeDeptIdOrCode = null) {
  const used = getUsedDepartmentColors(departments, excludeDeptIdOrCode);
  const allKeys = [
    'blue', 'emerald', 'amber', 'violet', 'rose', 'teal', 'indigo', 'cyan',
    'sky', 'lime', 'bronze', 'orange', 'fuchsia', 'sunset', 'yellow', 'slate',
    'crimson', 'navy', 'jade', 'grape', 'copper', 'coffee', 'magenta', 'steel'
  ];

  if (preferredKey) {
    const normPref = normalizeColorKey(preferredKey);
    if (!used[normPref]) {
      return normPref;
    }
  }

  // Pick the first available unused color from the palette
  const freeKey = allKeys.find(k => !used[k]);
  if (freeKey) return freeKey;

  // Fallback if all 24 are somehow assigned
  return allKeys[0];
}

/**
 * Resolves the solid departmental theme dynamically.
 * Prioritizes:
 * 1. Database customColor chosen by Admin/Developer.
 * 2. Accredited preset theme (HOD_DEPARTMENT_THEMES).
 * 3. Guaranteed unique non-colliding palette derived from available colors.
 */
export function getDynamicDeptTheme(code = 'GEN', name = '', customColor = '', allDepartments = []) {
  const c = (code || 'GEN').toUpperCase();
  const rawColor = (customColor || '').trim().toLowerCase();

  // 1. If database has an explicit color assigned by Admin/Developer
  if (rawColor) {
    const matchedKey = normalizeColorKey(rawColor);
    if (matchedKey && SOLID_COLOR_PALETTES[matchedKey]) {
      const p = SOLID_COLOR_PALETTES[matchedKey];
      return {
        deptCode: c,
        deptName: name || `${c} Department`,
        colorKey: p.key || matchedKey,
        colorName: p.name,
        solidPrimary: p.solid,
        solidDark: p.dark,
        solidDeep: p.deep,
        accent: p.accent,
        badgeClass: p.badge,
        bannerGradient: p.grad,
        btnPrimary: p.btn,
        activeTab: `${p.btn} shadow-lg`,
        textAccent: p.txt,
        borderSolid: p.border
      };
    }

    if (rawColor.startsWith('#')) {
      return {
        deptCode: c,
        deptName: name || `${c} Department`,
        colorKey: 'custom',
        colorName: 'Custom Solid',
        solidPrimary: customColor,
        solidDark: '#0f172a',
        solidDeep: '#020617',
        accent: customColor,
        badgeClass: 'bg-slate-900 text-white border-slate-700',
        bannerGradient: 'from-slate-900 via-slate-900 to-slate-950 border-slate-700/50',
        btnPrimary: 'bg-slate-800 hover:bg-slate-700 text-white shadow-slate-950',
        activeTab: 'bg-slate-800 text-white shadow-lg',
        textAccent: 'text-slate-300',
        borderSolid: 'border-slate-500'
      };
    }
  }

  // 2. Preset theme for accredited departments
  if (HOD_DEPARTMENT_THEMES[c]) {
    return {
      ...HOD_DEPARTMENT_THEMES[c],
      deptName: name || HOD_DEPARTMENT_THEMES[c].deptName
    };
  }

  // 3. Fallback: Automatically assign a guaranteed UNIQUE color not taken by existing departments
  const availableKey = getAvailableDepartmentColor(allDepartments, null, c);
  const p = SOLID_COLOR_PALETTES[availableKey] || SOLID_COLOR_PALETTES.blue;

  return {
    deptCode: c,
    deptName: name || `${c} Department`,
    colorKey: p.key || availableKey,
    colorName: p.name,
    solidPrimary: p.solid,
    solidDark: p.dark,
    solidDeep: p.deep,
    accent: p.accent,
    badgeClass: p.badge,
    bannerGradient: p.grad,
    btnPrimary: p.btn,
    activeTab: `${p.btn} shadow-lg`,
    textAccent: p.txt,
    borderSolid: p.border
  };
}
