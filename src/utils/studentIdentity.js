/**
 * Institutional Student Identity & Barcode Formatter
 * Federal Co-operative College, Ibadan - Smart Library & SIS Gateway
 * 
 * Standard Format: FCC-STU-{DEPT}-{YY}{MATRIC_NUM}
 * - {DEPT}: 3-4 letter department code (e.g. CSC, CEM, BNF, PAD, AGR, BAM)
 * - {YY}: 2-digit Year of Admission (e.g. 26 from 2026, 24 from 2024)
 * - {MATRIC_NUM}: Unique student sequence number (e.g. 409, 011, 077)
 * 
 * Examples:
 * - FCC/CSC/2026/409 => FCC-STU-CSC-26409
 * - FCC/CEM/2024/011 => FCC-STU-CEM-24011
 * - FCC/BNF/2024/077 => FCC-STU-BNF-24077
 */

export function resolveDeptCode(deptOrMatric = '') {
  const str = String(deptOrMatric).toUpperCase();
  if (str.includes('CSC') || str.includes('COMPUTER') || str.includes('SOFTWARE') || str.includes('INFORMATION TECH')) return 'CSC';
  if (str.includes('CEM') || str.includes('COOPERATIVE') || str.includes('CO-OPERATIVE') || str.includes('ECONOMICS')) return 'CEM';
  if (str.includes('BNF') || str.includes('BANKING') || str.includes('FINANCE')) return 'BNF';
  if (str.includes('PAD') || str.includes('PUBLIC ADMIN') || str.includes('ADMINISTRATION')) return 'PAD';
  if (str.includes('AGR') || str.includes('AGRIC') || str.includes('AGRICULTURAL')) return 'AGR';
  if (str.includes('BAM') || str.includes('BUSINESS ADMIN')) return 'BAM';

  // Check 3 letters
  const letters = str.replace(/[^A-Z]/g, '');
  return letters.slice(0, 3) || 'CSC';
}

export function formatStudentBarcode(matric, dept = null, fallbackYear = 2026) {
  if (!matric) return 'FCC-STU-CSC-26409';

  const cleanMatric = String(matric).trim();

  // If already in standard format with department (e.g. FCC-STU-CSC-26409)
  if (/^FCC-STU-[A-Za-z]{2,4}-\d+$/i.test(cleanMatric)) {
    return cleanMatric.toUpperCase();
  }

  // 1. Matches FCC/DEPT/YYYY/NUM or DEPT/YYYY/NUM
  const fullMatch = cleanMatric.match(/(?:FCC[\/-])?([A-Za-z]{2,4})[\/-](\d{4})[\/-](\d+)/i);
  if (fullMatch) {
    const deptCode = fullMatch[1].toUpperCase();
    const year2 = fullMatch[2].slice(-2);
    const num = fullMatch[3];
    return `FCC-STU-${deptCode}-${year2}${num}`;
  }

  // Resolve department code
  const deptCode = dept ? resolveDeptCode(dept) : resolveDeptCode(cleanMatric);

  // 2. Matches general YYYY and NUM
  const match = cleanMatric.match(/(\d{4})\D+(\d+)/);
  if (match) {
    const year2 = match[1].slice(-2);
    const num = match[2];
    return `FCC-STU-${deptCode}-${year2}${num}`;
  }

  // 3. If old format FCC-STU-26409
  if (cleanMatric.toUpperCase().startsWith('FCC-STU-')) {
    const suffix = cleanMatric.toUpperCase().replace(/^FCC-STU-/, '');
    return `FCC-STU-${deptCode}-${suffix}`;
  }

  // 4. Fallback: extract continuous digits
  const digits = cleanMatric.replace(/[^0-9]/g, '');
  if (digits.length >= 5) {
    return `FCC-STU-${deptCode}-${digits.slice(-5)}`;
  }

  const year2 = String(fallbackYear).slice(-2);
  const num = (digits || '409').padStart(3, '0');
  return `FCC-STU-${deptCode}-${year2}${num}`;
}

export function formatStudentLibraryId(matric, dept = null, fallbackYear = 2026) {
  return formatStudentBarcode(matric, dept, fallbackYear);
}
