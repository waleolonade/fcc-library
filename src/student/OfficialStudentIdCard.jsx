import React, { useRef, useState } from 'react';
import {
  Printer, Download, QrCode, Barcode, Shield, CheckCircle,
  Sparkles, RefreshCw, Smartphone, Award, Cpu, Wifi, Scissors,
  FileText, Check, AlertCircle
} from 'lucide-react';
import { INSTITUTION } from '../data/institutionalSeedData';
import { sounds } from '../utils/soundEffects';
import { BarcodeSvg, QrCodeSvg } from '../common/BarcodeQrStudio';
import { formatStudentBarcode, formatStudentLibraryId } from '../utils/studentIdentity';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * ISO/IEC 7810 ID-1 Standard Student Library Card
 * Standard CR80 Dimensions: 54mm (W) x 85.6mm (H) [Portrait Orientation]
 * Equivalent 300 DPI Print Resolution: 638px x 1011px (Aspect Ratio: 1 : 1.585)
 */
export default function OfficialStudentIdCard({ user, className = "" }) {
  const cardRef = useRef(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  // Strict Institutional Format: FCC-STU-{DEPT}-{YY}{MATRIC_NUM} e.g. FCC-STU-CSC-26409
  const libraryId = (user?.library_id && String(user.library_id).startsWith('FCC-STU-'))
    ? user.library_id
    : (user?.barcode && String(user.barcode).startsWith('FCC-STU-'))
      ? user.barcode
      : formatStudentLibraryId(user?.matric, user?.dept || user?.department);

  const barcodeValue = (user?.barcode && String(user.barcode).startsWith('FCC-STU-'))
    ? user.barcode
    : libraryId;

  const studentName = user?.name || 'OLAWALE AKEEM OLONADE';
  const matricNo = user?.matric || 'FCC/CSC/2026/409';
  const departmentName = user?.department || user?.dept || 'Computer Science & Information Technology';
  const facultyName = user?.faculty || 'School of Applied Sciences & Management';
  const levelProgramme = `${user?.level || 'HND I'} • ${user?.programme || 'Higher National Diploma'}`;
  const validThru = user?.validUntil || user?.valid_until || '2027-12-31';
  const photoUrl = user?.photoUrl || user?.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80";

  // =========================================================================
  // 1. RESTRUCTURED OFFICIAL ID CARD PRINT HANDLER (CR80 PVC SIZE)
  // =========================================================================
  const handlePrintCard = () => {
    sounds.playClick();
    setIsPrinting(true);

    try {
      // Create isolated print iframe
      const existingIframe = document.getElementById('id-card-print-frame');
      if (existingIframe) {
        existingIframe.remove();
      }

      const printIframe = document.createElement('iframe');
      printIframe.id = 'id-card-print-frame';
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';
      document.body.appendChild(printIframe);

      const cardHtml = cardRef.current ? cardRef.current.outerHTML : '';

      const printDocument = printIframe.contentWindow.document;
      printDocument.open();
      printDocument.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <title>FCC Ibadan - Official Library Scholar ID Card - ${matricNo}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=JetBrains+Mono:wght@500;700;800&display=swap" rel="stylesheet">
          <style>
            @page {
              size: 54mm 85.6mm; /* Exact ISO/IEC 7810 ID-1 / CR80 PVC Card */
              margin: 0;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .cr80-print-container {
              width: 54mm;
              height: 85.6mm;
              max-width: 54mm;
              max-height: 85.6mm;
              overflow: hidden;
              position: relative;
              margin: auto;
              background: #021810;
              border-radius: 3.18mm; /* Standard 3.18mm corner radius on CR80 */
              box-shadow: none !important;
            }
            /* Scale contents seamlessly to fit 54mm x 85.6mm */
            .cr80-print-container > div {
              width: 100% !important;
              height: 100% !important;
              max-width: 100% !important;
              border-radius: 3.18mm !important;
              box-shadow: none !important;
            }
            @media screen {
              body {
                padding: 10mm;
                background: #f1f5f9;
              }
              .cut-guides {
                border: 1px dashed #94a3b8;
                padding: 4mm;
                display: inline-block;
              }
            }
          </style>
        </head>
        <body>
          <div class="cut-guides">
            <div class="cr80-print-container">
              ${cardHtml}
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 400);
            };
          </script>
        </body>
        </html>
      `);
      printDocument.close();

      setTimeout(() => {
        setIsPrinting(false);
        sounds.playSuccessChime();
      }, 1000);
    } catch (err) {
      console.error('Print generation error:', err);
      setIsPrinting(false);
      // Fallback
      window.print();
    }
  };

  // =========================================================================
  // 2. RESTRUCTURED DOWNLOAD AS PDF HANDLER (CR80 PVC SIZE)
  // =========================================================================
  const handleDownloadPdf = async () => {
    if (!cardRef.current || isGeneratingPdf) return;

    sounds.playClick();
    setIsGeneratingPdf(true);
    setPdfSuccess(false);

    try {
      // 1. Capture card at 300+ DPI Retina Scale
      const canvas = await html2canvas(cardRef.current, {
        scale: 3, // 300+ DPI equivalent
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#021810',
        windowWidth: 380
      });

      const imgData = canvas.toDataURL('image/png', 1.0);

      // 2. Initialize jsPDF with standard ISO/IEC 7810 ID-1 / CR80 PVC Card Dimensions:
      // Width: 54 mm, Height: 85.6 mm (Portrait)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [54, 85.6],
        compress: true
      });

      // 3. Place card graphic with zero margins
      pdf.addImage(imgData, 'PNG', 0, 0, 54, 85.6, undefined, 'FAST');

      // 4. Set document metadata
      pdf.setProperties({
        title: `FCC Smart Library Card - ${studentName}`,
        subject: `Institutional Scholar Library Identity - ${libraryId}`,
        author: 'Federal Co-operative College, Ibadan - Smart Library & SIS',
        keywords: 'library, barcode, student id, fcc ibadan, smart card',
        creator: 'FCC Smart ILS Enterprise Studio'
      });

      // 5. Trigger download
      const cleanMatric = matricNo.replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(`FCC_Smart_Library_Card_${cleanMatric}.pdf`);

      setIsGeneratingPdf(false);
      setPdfSuccess(true);
      sounds.playSuccessChime();
      setTimeout(() => setPdfSuccess(false), 4000);
    } catch (err) {
      console.error('PDF generation error:', err);
      setIsGeneratingPdf(false);
      alert('Unable to generate PDF. Please use the Print Official Card option.');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* =======================================================
          THE RESTRUCTURED OFFICIAL CR80 STUDENT ID CARD
      ======================================================= */}
      <div className="flex justify-center">
        <div
          ref={cardRef}
          id="fcc-official-student-card"
          className="w-full max-w-[360px] select-none rounded-[22px] bg-gradient-to-b from-[#021810] via-[#042a1d] to-[#01140d] border-2 border-emerald-500/70 p-5 shadow-2xl text-white relative overflow-hidden flex flex-col justify-between"
          style={{
            aspectRatio: '54 / 85.6', // Exact CR80 ID-1 proportions
            boxShadow: '0 25px 50px -12px rgba(2, 24, 16, 0.8), 0 0 35px rgba(16, 185, 129, 0.25)'
          }}
        >
          {/* Holographic Security Guilloche Texture Overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.06]"
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 50%, #10b981 1px, transparent 1px), radial-gradient(circle at 0% 0%, #34d399 1px, transparent 1px)',
              backgroundSize: '12px 12px'
            }}
          />

          {/* Hologram Light Accent Ribbon */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-400/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />

          {/* ===================================================
              CARD HEADER: CREST, INSTITUTION NAME, RFID STATUS
          =================================================== */}
          <div className="relative z-10 border-b border-emerald-500/30 pb-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 p-0.5 border border-emerald-400/40 shrink-0 overflow-hidden shadow">
                  <img src="/assets/fcc-logo.png" alt="FCC Logo" className="w-full h-full object-cover rounded-md" />
                </div>
                <div className="text-left">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-white leading-tight">
                    {INSTITUTION.shortName}
                  </h4>
                  <p className="text-[8px] font-bold text-emerald-400 tracking-wider uppercase font-mono">
                    SMART LIBRARY MEMBERSHIP
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/60 shadow-sm shrink-0">
                <Wifi size={10} className="text-emerald-400 rotate-90 animate-pulse" />
                <span className="text-[8px] font-mono font-bold text-emerald-300">RFID: ACTIVE</span>
              </div>
            </div>
          </div>

          {/* ===================================================
              CARD BODY: PHOTO, CHIP, SCHOLAR DETAILS
          =================================================== */}
          <div className="relative z-10 my-auto py-2 space-y-2.5">
            {/* Portrait Photo & Microchip Row */}
            <div className="flex items-center gap-3">
              {/* Official Scholar Photo */}
              <div className="relative shrink-0">
                <div className="w-[68px] h-[82px] rounded-xl bg-slate-900 border-2 border-emerald-400/80 p-0.5 shadow-lg overflow-hidden">
                  <img
                    src={photoUrl}
                    alt={studentName}
                    className="w-full h-full object-cover rounded-[9px]"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 p-0.5 bg-emerald-500 rounded-full shadow">
                  <CheckCircle size={10} className="text-[#021810]" />
                </div>
              </div>

              {/* Scholar Information */}
              <div className="text-left flex-1 min-w-0 space-y-1">
                {/* Gold EMV Contact Chip Simulation */}
                <div className="w-8 h-6 rounded-md bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 border border-amber-200/80 p-0.5 flex flex-col justify-between shadow-sm">
                  <div className="w-full h-[1px] bg-amber-700/60" />
                  <div className="flex justify-between w-full h-[1px] bg-amber-700/60" />
                  <div className="w-full h-[1px] bg-amber-700/60" />
                </div>

                <div>
                  <h3 className="text-[13px] font-black uppercase text-white tracking-tight leading-tight line-clamp-1">
                    {studentName}
                  </h3>
                  <p className="text-[10px] font-mono font-bold text-emerald-300 tracking-wide">
                    {matricNo}
                  </p>
                </div>

                <div className="text-[8.5px] text-slate-300 leading-tight">
                  <p className="truncate font-semibold text-emerald-200">{departmentName}</p>
                  <p className="text-slate-400 text-[8px] font-mono">{levelProgramme}</p>
                </div>
              </div>
            </div>

            {/* LIBRARY ID BADGE */}
            <div className="px-3 py-1.5 rounded-xl bg-[#01140d] border border-emerald-500/40 flex items-center justify-between shadow-inner">
              <span className="text-[8px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                LIBRARY ID
              </span>
              <span className="text-[12px] font-mono font-black tracking-widest text-emerald-300 uppercase">
                {libraryId}
              </span>
            </div>

            {/* CODE-128 BARCODE CONTAINER */}
            <div className="p-2 rounded-xl bg-white text-slate-950 flex flex-col items-center shadow-lg border border-slate-200">
              <BarcodeSvg
                value={barcodeValue}
                height={34}
                className="text-black w-full"
                showLabel={true}
                labelClassName="text-slate-950 font-black tracking-widest text-[9.5px]"
              />
            </div>

            {/* OPTICAL QR CODE TURNSTILE TOKEN */}
            <div className="flex items-center justify-center gap-3 pt-0.5">
              <div className="p-1.5 bg-white rounded-xl shadow-md shrink-0">
                <QrCodeSvg value={`fcc-patron:${libraryId}:${matricNo}`} size={74} />
              </div>
              <div className="text-left text-[8px] font-mono text-emerald-400/90 leading-snug space-y-0.5">
                <p className="font-bold text-white flex items-center gap-1">
                  <Shield size={10} className="text-emerald-400" />
                  <span>SIS Verified Token</span>
                </p>
                <p>Turnstile & Kiosk Access</p>
                <p className="text-[7.5px] text-slate-400">EXP: {validThru}</p>
              </div>
            </div>
          </div>

          {/* ===================================================
              CARD FOOTER: MICRO-TEXT SECURITY BANNER
          =================================================== */}
          <div className="relative z-10 border-t border-emerald-500/30 pt-1.5 text-center">
            <p className="text-[7px] font-mono tracking-wider text-emerald-400/80 uppercase">
              Scan at Entrance Turnstile or Self-Checkout Kiosk
            </p>
            <p className="text-[6.5px] font-mono tracking-widest text-slate-500 uppercase mt-0.5">
              ★ OFFICIAL SCHOLAR CARD • ISO/IEC 7810 ID-1 • FCC IBADAN ★
            </p>
          </div>
        </div>
      </div>

      {/* =======================================================
          ACTION BUTTON: DOWNLOAD AS PDF (ISO CR80 PVC SIZE)
      ======================================================= */}
      <div className="max-w-[360px] mx-auto w-full">
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={isGeneratingPdf}
          className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-xl shadow-emerald-950/60 flex items-center justify-center gap-2 transition hover:scale-[1.01] active:scale-[0.98] disabled:opacity-60"
        >
          {isGeneratingPdf ? (
            <>
              <RefreshCw size={15} className="animate-spin text-white" />
              <span>Rendering ISO CR80 ID Card PDF...</span>
            </>
          ) : pdfSuccess ? (
            <>
              <Check size={16} className="text-emerald-200" />
              <span className="text-white">ID Card PDF Downloaded Successfully!</span>
            </>
          ) : (
            <>
              <Download size={15} className="text-white" />
              <span className="tracking-wide">Download as PDF</span>
            </>
          )}
        </button>
      </div>

      {/* Printable Specs Badge */}
      <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-slate-400 text-center">
        <span>Standard ISO/IEC 7810 ID-1 (CR80)</span>
        <span>•</span>
        <span>54mm × 85.6mm</span>
        <span>•</span>
        <span className="text-emerald-400 font-bold">300 DPI Ready</span>
      </div>
    </div>
  );
}
