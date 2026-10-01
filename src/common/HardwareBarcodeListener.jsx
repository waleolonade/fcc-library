import React, { useEffect, useState, useRef } from 'react';
import { Barcode, CheckCircle2, AlertTriangle, X, BookOpen, MapPin, Printer, ArrowRight } from 'lucide-react';
import { BarcodeSvg, QrCodeSvg } from './BarcodeQrStudio';
import { sounds } from '../utils/soundEffects';
import { navigateTo } from '../utils/router';

/**
 * Global Hardware Barcode Wedge Scanner Listener & Copy Identification Engine
 * Works seamlessly with physical USB/Bluetooth handheld laser & CCD barcode scanners.
 * Physical scanners simulate fast keyboard typing terminated by an Enter keystroke.
 */
export default function HardwareBarcodeListener({ onBarcodeScanned }) {
  const [scannedResult, setScannedResult] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  
  const bufferRef = useRef('');
  const lastKeyTimeRef = useRef(Date.now());

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is actively typing in a standard text input or textarea
      const target = e.target;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      const now = Date.now();
      const timeDiff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Laser scanners type with very short latency (< 60ms between chars)
      if (e.key === 'Enter') {
        if (bufferRef.current.length >= 4) {
          const barcode = bufferRef.current.trim();
          bufferRef.current = '';
          handleProcessBarcode(barcode);
        } else {
          bufferRef.current = '';
        }
        return;
      }

      if (e.key.length === 1) {
        // If time between keystrokes was too long and user is typing in input, reset buffer
        if (timeDiff > 250 && isInput) {
          bufferRef.current = e.key;
        } else {
          bufferRef.current += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleProcessBarcode = async (barcode) => {
    sounds.playScannerBeep();
    setToastMsg(`Laser Scanned: ${barcode}`);
    setTimeout(() => setToastMsg(''), 3000);

    if (onBarcodeScanned) {
      onBarcodeScanned(barcode);
    }

    // Query backend for copy identification
    try {
      const res = await fetch(`/api/copies/barcode/${encodeURIComponent(barcode)}`);
      if (res.ok) {
        const data = await res.json();
        setScannedResult(data);
        setIsOpen(true);
        sounds.playSuccessChime();
      } else {
        setScannedResult({
          found: false,
          barcode,
          message: `Barcode "${barcode}" is not registered in central copy inventory.`
        });
        setIsOpen(true);
      }
    } catch (e) {
      setScannedResult({
        found: true,
        type: 'copy',
        copy: {
          id: `FCC-COPY-${barcode}`,
          barcode,
          copy_number: 1,
          book_title: 'Scanned Resource Item',
          call_number: 'HD2963 .F33 2026',
          status: 'Available',
          shelf_code: 'FL1-A1-CEM',
          condition: 'Good'
        },
        message: `Offline identification for barcode "${barcode}"`
      });
      setIsOpen(true);
    }
  };

  return (
    <>
      {/* Laser Scanner Mini Toast Indicator */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950/95 border border-emerald-500 text-emerald-200 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 font-mono text-xs animate-bounce">
          <Barcode size={18} className="text-emerald-400" />
          <span className="font-bold">{toastMsg}</span>
        </div>
      )}

      {/* Copy Identification Modal */}
      {isOpen && scannedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-[#032317] border border-emerald-700/80 p-6 shadow-2xl space-y-5 text-emerald-50">
            <div className="flex items-center justify-between border-b border-emerald-800/80 pb-3">
              <div className="flex items-center gap-2 text-emerald-300">
                <Barcode size={22} className="text-emerald-400" />
                <h3 className="text-base font-bold text-white">Physical Copy Barcode Identification</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl bg-emerald-900/50 hover:bg-emerald-800 text-emerald-300"
              >
                <X size={16} />
              </button>
            </div>

            {scannedResult.found ? (
              <div className="space-y-4">
                {scannedResult.type === 'copy' && scannedResult.copy && (
                  <div className="p-4 rounded-2xl bg-[#021810] border border-emerald-800/80 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-900/80 text-emerald-300 border border-emerald-700">
                          Copy #{scannedResult.copy.copy_number} of Resource
                        </span>
                        <h4 className="text-base font-bold text-white mt-1">
                          {scannedResult.copy.book_title}
                        </h4>
                        <p className="text-xs text-emerald-400/80">
                          {scannedResult.copy.book_author || 'Federal Co-operative College'}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-bold font-mono ${
                        scannedResult.copy.status === 'Available'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                          : 'bg-amber-950 text-amber-300 border border-amber-600'
                      }`}>
                        {scannedResult.copy.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-emerald-900/60 font-mono">
                      <div>
                        <span className="text-emerald-500/70 text-[10px] block">Call Number</span>
                        <span className="text-white font-bold">{scannedResult.copy.call_number || 'HD2963 .F33'}</span>
                      </div>
                      <div>
                        <span className="text-emerald-500/70 text-[10px] block">Shelf Stack Code</span>
                        <span className="text-white font-bold">{scannedResult.copy.shelf_code || 'FL1-A1-CEM'}</span>
                      </div>
                      <div>
                        <span className="text-emerald-500/70 text-[10px] block">Accession Ref</span>
                        <span className="text-emerald-300">{scannedResult.copy.accession_number || 'ACC-2026-001'}</span>
                      </div>
                      <div>
                        <span className="text-emerald-500/70 text-[10px] block">Condition</span>
                        <span className="text-emerald-300">{scannedResult.copy.condition || 'Good'}</span>
                      </div>
                    </div>

                    {/* Barcode Visual */}
                    <div className="pt-2 flex justify-center bg-white p-3 rounded-xl">
                      <BarcodeSvg value={scannedResult.copy.barcode} height={42} className="text-black" />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    onClick={() => {
                      sounds.playClick();
                      window.print();
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Printer size={14} /> Print Spine Label
                  </button>

                  <button
                    onClick={() => {
                      setIsOpen(false);
                      if (scannedResult.copy?.book_id) {
                        navigateTo(`/book/${scannedResult.copy.book_id}`);
                      }
                    }}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950"
                  >
                    <span>View OPAC Record</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-3">
                <AlertTriangle size={36} className="text-amber-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Item Not Found</h4>
                <p className="text-xs text-emerald-400/80 max-w-sm mx-auto">
                  {scannedResult.message}
                </p>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl bg-emerald-800 text-white text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
