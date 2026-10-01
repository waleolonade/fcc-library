// =========================================================================
// BACKGROUND PATTERNS — One unique SVG pattern per major page
// Usage: import { PATTERNS } from '../utils/backgroundPatterns';
// Then inline as style={{ backgroundImage: PATTERNS.scholar }}
//
// All patterns use very low opacity so they sit subtly beneath content.
// The base bg colour (#021810 dark green or slate-950) still dominates.
// =========================================================================

// Encode an SVG string for use as a CSS background-image data-URI
function svgUri(svg) {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

// 1. SCHOLAR PORTAL — Fine diagonal grid (like graph paper, emerald tint)
const scholarGrid = svgUri(`
<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'>
  <defs>
    <pattern id='sg' width='60' height='60' patternUnits='userSpaceOnUse'>
      <path d='M 60 0 L 0 0 0 60' fill='none' stroke='%2310b981' stroke-width='0.4' opacity='0.18'/>
      <path d='M 30 0 L 30 60 M 0 30 L 60 30' fill='none' stroke='%2310b981' stroke-width='0.2' opacity='0.09'/>
    </pattern>
  </defs>
  <rect width='60' height='60' fill='url(%23sg)'/>
</svg>
`);

// 2. ADMIN DASHBOARD — Isometric dot-grid (professional, techy)
const adminDots = svgUri(`
<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28'>
  <defs>
    <pattern id='ad' width='28' height='28' patternUnits='userSpaceOnUse'>
      <circle cx='1' cy='1' r='1.1' fill='%236366f1' opacity='0.22'/>
    </pattern>
  </defs>
  <rect width='28' height='28' fill='url(%23ad)'/>
</svg>
`);

// 3. PUBLIC OPAC / DISCOVERY — Hexagonal honeycomb mesh
const opacHex = svgUri(`
<svg xmlns='http://www.w3.org/2000/svg' width='56' height='100'>
  <defs>
    <pattern id='hex' width='56' height='100' patternUnits='userSpaceOnUse'>
      <path d='M28 0 L56 14 56 42 28 56 0 42 0 14 Z' fill='none' stroke='%2314b8a6' stroke-width='0.5' opacity='0.15'/>
      <path d='M0 56 L28 70 56 56' fill='none' stroke='%2314b8a6' stroke-width='0.5' opacity='0.10'/>
      <path d='M28 56 L28 100' fill='none' stroke='%2314b8a6' stroke-width='0.5' opacity='0.10'/>
    </pattern>
  </defs>
  <rect width='56' height='100' fill='url(%23hex)'/>
</svg>
`);

// 4. STUDENT LOGIN — Diagonal hatching / cross-weave
const loginHatch = svgUri(`
<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'>
  <defs>
    <pattern id='lh' width='48' height='48' patternUnits='userSpaceOnUse'>
      <path d='M0 48 L48 0 M-12 12 L12 -12 M36 60 L60 36' stroke='%2310b981' stroke-width='0.5' opacity='0.12'/>
      <path d='M0 0 L48 48 M-12 36 L36 -12 M12 60 L60 12' stroke='%2310b981' stroke-width='0.5' opacity='0.08'/>
    </pattern>
  </defs>
  <rect width='48' height='48' fill='url(%23lh)'/>
</svg>
`);

// 5. ADMIN LOGIN — Stacked circuit-board traces (indigo/slate)
const adminCircuit = svgUri(`
<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'>
  <defs>
    <pattern id='ac' width='80' height='80' patternUnits='userSpaceOnUse'>
      <path d='M10 0 L10 20 L30 20 L30 40 M50 0 L50 60 L70 60 L70 80
               M0 30 L20 30 L20 50 L40 50 M60 10 L60 30 L80 30'
        fill='none' stroke='%236366f1' stroke-width='0.6' opacity='0.18' stroke-linecap='round'/>
      <circle cx='10' cy='20' r='2' fill='%236366f1' opacity='0.20'/>
      <circle cx='30' cy='40' r='2' fill='%236366f1' opacity='0.20'/>
      <circle cx='70' cy='60' r='2' fill='%236366f1' opacity='0.20'/>
      <circle cx='20' cy='50' r='2' fill='%236366f1' opacity='0.20'/>
    </pattern>
  </defs>
  <rect width='80' height='80' fill='url(%23ac)'/>
</svg>
`);

// 6. HOD DASHBOARD — Triangular mosaic / geometric tri-grid (teal)
const hodTriangle = svgUri(`
<svg xmlns='http://www.w3.org/2000/svg' width='60' height='52'>
  <defs>
    <pattern id='ht' width='60' height='52' patternUnits='userSpaceOnUse'>
      <path d='M30 0 L60 52 L0 52 Z' fill='none' stroke='%2314b8a6' stroke-width='0.5' opacity='0.14'/>
      <path d='M0 0 L30 52 L60 0 Z' fill='none' stroke='%2314b8a6' stroke-width='0.5' opacity='0.10'/>
      <path d='M0 26 L60 26' stroke='%2314b8a6' stroke-width='0.3' opacity='0.08'/>
    </pattern>
  </defs>
  <rect width='60' height='52' fill='url(%23ht)'/>
</svg>
`);

// 7. APP ROOT (global wrapper) — Topographic contour lines (very faint)
const appTopo = svgUri(`
<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'>
  <defs>
    <pattern id='tp' width='120' height='120' patternUnits='userSpaceOnUse'>
      <ellipse cx='60' cy='60' rx='50' ry='30' fill='none' stroke='%2310b981' stroke-width='0.4' opacity='0.07'/>
      <ellipse cx='60' cy='60' rx='36' ry='20' fill='none' stroke='%2310b981' stroke-width='0.4' opacity='0.07'/>
      <ellipse cx='60' cy='60' rx='22' ry='12' fill='none' stroke='%2310b981' stroke-width='0.4' opacity='0.07'/>
      <ellipse cx='60' cy='60' rx='9' ry='5' fill='none' stroke='%2310b981' stroke-width='0.4' opacity='0.07'/>
    </pattern>
  </defs>
  <rect width='120' height='120' fill='url(%23tp)'/>
</svg>
`);

// 8. BOOKSHELVES / CARD SECTIONS — Subtle ruled lines (like notebook paper)
const ruledLines = svgUri(`
<svg xmlns='http://www.w3.org/2000/svg' width='100' height='24'>
  <defs>
    <pattern id='rl' width='100' height='24' patternUnits='userSpaceOnUse'>
      <line x1='0' y1='23.5' x2='100' y2='23.5' stroke='%2310b981' stroke-width='0.3' opacity='0.10'/>
    </pattern>
  </defs>
  <rect width='100' height='24' fill='url(%23rl)'/>
</svg>
`);

// 9. FINE MANAGEMENT / REPORTS — Cross-hash ledger lines
const ledgerGrid = svgUri(`
<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'>
  <defs>
    <pattern id='lg' width='40' height='40' patternUnits='userSpaceOnUse'>
      <rect width='40' height='40' fill='none' stroke='%236366f1' stroke-width='0.3' opacity='0.12'/>
      <line x1='0' y1='20' x2='40' y2='20' stroke='%236366f1' stroke-width='0.2' opacity='0.08'/>
    </pattern>
  </defs>
  <rect width='40' height='40' fill='url(%23lg)'/>
</svg>
`);

// 10. CATALOGUE / MARC — Thin wave / sine curves (like a library card catalogue)
const catalogueWaves = svgUri(`
<svg xmlns='http://www.w3.org/2000/svg' width='100' height='30'>
  <defs>
    <pattern id='cw' width='100' height='30' patternUnits='userSpaceOnUse'>
      <path d='M0 15 Q25 5 50 15 Q75 25 100 15' fill='none' stroke='%2310b981' stroke-width='0.5' opacity='0.13'/>
    </pattern>
  </defs>
  <rect width='100' height='30' fill='url(%23cw)'/>
</svg>
`);

export const PATTERNS = {
  // Page-level patterns
  scholar: scholarGrid,        // StudentPortal pages
  adminPanel: adminDots,       // FccAdminLibrary pages
  opac: opacHex,               // PublicDiscovery
  login: loginHatch,           // WorldClassLogin
  adminLogin: adminCircuit,    // AdminLogin
  hod: hodTriangle,            // HodDashboard
  app: appTopo,                // App root wrapper

  // Component-level / section patterns
  bookCards: ruledLines,       // Ruled card backgrounds
  ledger: ledgerGrid,          // Fine/Report tables
  catalogue: catalogueWaves,   // Catalogue management
};
