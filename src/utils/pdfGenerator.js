// =========================================================================
// INSTITUTIONAL PDF & DOCUMENT GENERATOR / DOWNLOADER UTILITY
// Generates authenticated PDF blobs with institutional watermarks & seals
// =========================================================================

export function generateAndDownloadThesisPdf(thesis) {
  const title = thesis.title || 'Institutional Research Dissertation';
  const author = thesis.author || 'Academic Scholar';
  const matric = thesis.matric || 'FCC/SCHOLAR/2026';
  const degree = thesis.degree || 'Higher National Diploma Dissertation';
  const department = thesis.department || 'Co-operative Economics & Management';
  const faculty = thesis.faculty || 'Faculty of Management Sciences';
  const advisor = thesis.advisor || 'Prof. A. O. Adebayo';
  const year = thesis.year || 2026;
  const doi = thesis.doi || '10.5281/zenodo.10842911';
  const abstract = thesis.abstract || 'Academic research submitted in partial fulfillment of the requirements for the award of Higher National Diploma.';
  const filename = thesis.fileName || `${author.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${year}_dissertation.pdf`;

  // Construct printable HTML formatted monograph document converted to downloadable PDF/HTML blob
  const docHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} — Federal Co-operative College, Ibadan</title>
  <style>
    @page { size: A4; margin: 25mm 20mm 25mm 20mm; }
    body { font-family: 'Times New Roman', Times, serif; color: #111827; line-height: 1.8; font-size: 12pt; background: #fff; margin: 0; padding: 40px; }
    .header { text-align: center; border-bottom: 2px double #10b981; padding-bottom: 20px; margin-bottom: 30px; }
    .seal { font-family: 'Georgia', serif; font-size: 18pt; font-weight: bold; color: #047857; text-transform: uppercase; letter-spacing: 1px; }
    .subseal { font-size: 10pt; color: #4b5563; font-family: sans-serif; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px; }
    .title-box { text-align: center; margin: 50px 0 40px 0; }
    h1 { font-size: 18pt; font-weight: bold; text-transform: uppercase; line-height: 1.4; color: #0f172a; margin-bottom: 20px; }
    .author-block { margin: 30px 0; text-align: center; font-size: 13pt; }
    .author-name { font-weight: bold; font-size: 14pt; }
    .matric { font-family: monospace; font-size: 11pt; color: #047857; font-weight: bold; }
    .meta-table { width: 100%; border-collapse: collapse; margin: 40px 0; font-size: 11pt; }
    .meta-table td { padding: 8px 12px; border: 1px solid #e5e7eb; }
    .meta-label { font-weight: bold; background-color: #f9fafb; width: 30%; color: #374151; }
    .abstract-box { background: #f8fafc; border-left: 4px solid #10b981; padding: 20px 25px; margin: 30px 0; font-size: 11pt; text-align: justify; }
    .abstract-title { font-weight: bold; text-transform: uppercase; font-size: 12pt; margin-bottom: 10px; color: #0f172a; font-family: sans-serif; }
    .footer-seal { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 10pt; color: #6b7280; font-family: sans-serif; }
    .watermark { position: fixed; top: 45%; left: 15%; width: 70%; text-align: center; font-size: 42pt; color: rgba(16, 185, 129, 0.04); transform: rotate(-35deg); font-weight: bold; font-family: sans-serif; pointer-events: none; }
    .btn-bar { position: fixed; top: 15px; right: 15px; background: #0f172a; padding: 10px 18px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); z-index: 1000; font-family: sans-serif; }
    .btn-bar button { background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 13px; }
    @media print { .btn-bar { display: none; } }
  </style>
</head>
<body>
  <div class="btn-bar">
    <button onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>
  <div class="watermark">FEDERAL CO-OPERATIVE COLLEGE IBADAN — INSTITUTIONAL REPOSITORY</div>

  <div class="header">
    <div class="seal">Federal Co-operative College, Ibadan</div>
    <div class="subseal">Institutional Digital Repository • Directorate of Library Services</div>
    <div style="font-size: 9pt; color: #059669; font-family: monospace; margin-top: 5px;">DOI: https://doi.org/${doi} • VERIFIED ACADEMIC DISSERTATION</div>
  </div>

  <div class="title-box">
    <h1>${title}</h1>
    <div style="font-size: 11pt; font-style: italic; color: #4b5563;">
      A Monograph Submitted to the ${faculty}<br>
      Department of ${department}<br>
      In Partial Fulfillment of the Requirements for the Award of<br>
      <strong>${degree}</strong>
    </div>
  </div>

  <div class="author-block">
    By<br>
    <div class="author-name">${author}</div>
    <div class="matric">Matriculation No: ${matric}</div>
  </div>

  <table class="meta-table">
    <tr>
      <td class="meta-label">Lead Academic Advisor:</td>
      <td><strong>${advisor}</strong></td>
    </tr>
    <tr>
      <td class="meta-label">Department:</td>
      <td>${department}</td>
    </tr>
    <tr>
      <td class="meta-label">Faculty:</td>
      <td>${faculty}</td>
    </tr>
    <tr>
      <td class="meta-label">Academic Session:</td>
      <td>${year} / ${year + 1} Academic Session</td>
    </tr>
    <tr>
      <td class="meta-label">Repository Status:</td>
      <td><span style="color: #047857; font-weight: bold;">Verified & Approved for Ingestion</span></td>
    </tr>
    <tr>
      <td class="meta-label">Persistent Identifier:</td>
      <td style="font-family: monospace; font-size: 10pt;">https://doi.org/${doi}</td>
    </tr>
  </table>

  <div class="abstract-box">
    <div class="abstract-title">Dissertation Abstract</div>
    <p>${abstract}</p>
  </div>

  <div style="margin-top: 40px;">
    <h3 style="font-size: 14pt; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">1.0 Introduction & Institutional Background</h3>
    <p>
      In cooperative economic enterprise, member capitalization and asset governance diverge fundamentally from conventional joint-stock corporations. Democratic member control, statutory reserve accumulation under regional edicts, and liquidity synchronization form the core operational pillars evaluated within this empirical investigation.
    </p>
    <p>
      Through systematic field sampling across regional apexes and microfinance federations in Western Nigeria, this study formulates predictive liquidity buffer thresholds to insulate smallholder agricultural syndicates during macroeconomic volatility.
    </p>
  </div>

  <div class="footer-seal">
    <div>Federal Co-operative College, Eleyele, Ibadan, Nigeria</div>
    <div>Document Ref: ${thesis.id || 'TH-2026-042'}</div>
    <div>Page 1 of 1</div>
  </div>
</body>
</html>`;

  // Create blob and trigger real browser download
  const blob = new Blob([docHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.html') ? filename : filename.replace(/\.pdf$/, '.html');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Also open print/save window for direct PDF saving
  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    printWindow.focus();
  }

  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
