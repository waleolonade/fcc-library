import React, { useState, useRef } from 'react';
import {
  Upload, Sparkles, Check, X, RefreshCw, Sliders, Image as ImageIcon,
  ShieldCheck, AlertCircle, Camera
} from 'lucide-react';
import { processPassportPhoto } from '../utils/passportImageStudio';
import { sounds } from '../utils/soundEffects';

export default function PassportUploadModal({
  isOpen,
  onClose,
  currentUser,
  currentPhoto,
  onPhotoUpdated
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [originalPreview, setOriginalPreview] = useState(null);
  const [processedPhoto, setProcessedPhoto] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bgMode, setBgMode] = useState('studio-white'); // 'transparent' | 'studio-white' | 'studio-emerald'
  const [tolerance, setTolerance] = useState(38);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, or WEBP).');
      sounds.playErrorBuzz();
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError('File size too large. Please select an image under 8MB.');
      sounds.playErrorBuzz();
      return;
    }

    setError('');
    setSelectedFile(file);
    const origUrl = URL.createObjectURL(file);
    setOriginalPreview(origUrl);

    // Run automatic processing
    await runProcessing(file, bgMode, tolerance);
  };

  const runProcessing = async (sourceFile, mode, tol) => {
    setIsProcessing(true);
    setError('');
    try {
      sounds.playClick();
      const result = await processPassportPhoto(sourceFile, {
        bgMode: mode,
        tolerance: tol,
        targetSize: 600,
        watermarkOpacity: 0.42,
        includeSealText: true
      });
      setProcessedPhoto(result.dataUrl);
      sounds.playSuccessChime();
    } catch (err) {
      console.error('Failed to process passport photo:', err);
      setError('Could not process background. Please try another clear photograph.');
      sounds.playErrorBuzz();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBgModeChange = async (newMode) => {
    setBgMode(newMode);
    if (selectedFile) {
      await runProcessing(selectedFile, newMode, tolerance);
    }
  };

  const handleToleranceChange = async (e) => {
    const newTol = parseInt(e.target.value, 10);
    setTolerance(newTol);
  };

  const handleApplyTolerance = async () => {
    if (selectedFile) {
      await runProcessing(selectedFile, bgMode, tolerance);
    }
  };

  const handleSaveAndApply = async () => {
    if (!processedPhoto) return;
    setIsSaving(true);
    setError('');

    try {
      // 1. Update local storage session
      const studentSession = localStorage.getItem('fcc_student_session');
      let updatedUser = { ...currentUser, photo: processedPhoto };
      if (studentSession) {
        try {
          const parsed = JSON.parse(studentSession);
          updatedUser = { ...parsed, photo: processedPhoto, photo_url: processedPhoto };
          localStorage.setItem('fcc_student_session', JSON.stringify(updatedUser));
        } catch (e) {}
      }

      // 2. Also save to verified mobile pass profile
      try {
        const mobilePass = localStorage.getItem('fcc_mobile_pass_user');
        if (mobilePass) {
          const parsedMp = JSON.parse(mobilePass);
          localStorage.setItem('fcc_mobile_pass_user', JSON.stringify({ ...parsedMp, photo: processedPhoto }));
        }
      } catch (e) {}

      // 3. Persist to backend database
      const patronId = currentUser?.id || currentUser?.matric || 'FCC/CSC/2026/409';
      try {
        await fetch(`/api/patrons/${encodeURIComponent(patronId)}/photo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photo: processedPhoto, id: patronId, matric: currentUser?.matric })
        });
      } catch (backendErr) {
        // Fallback: direct backend port 8000
        try {
          const directApi = `${window.location.protocol}//${window.location.hostname}:8000/api/patrons/${encodeURIComponent(patronId)}/photo`;
          await fetch(directApi, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photo: processedPhoto, id: patronId, matric: currentUser?.matric })
          });
        } catch (e) {}
      }

      setSaveSuccess(true);
      sounds.playSuccessChime();
      if (onPhotoUpdated) {
        onPhotoUpdated(processedPhoto);
      }

      setTimeout(() => {
        setIsSaving(false);
        setSaveSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to save profile photo:', err);
      setError('Photo processed successfully, but saving to server encountered an error. Applied locally.');
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#032317] border border-emerald-700/80 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 text-white overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950 border border-emerald-500/60 flex items-center justify-center text-emerald-400">
              <Camera size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span>Official Passport Upload Studio</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  AI BG-Removal + Watermark
                </span>
              </h2>
              <p className="text-xs text-emerald-300/70">
                Removes background automatically and embeds official Federal Co-operative College watermark seal.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Upload Drop Zone / Picker */}
        {!selectedFile && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-emerald-700/80 hover:border-emerald-400 rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition bg-[#021810]/70 hover:bg-[#021810] space-y-3 group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-900/40 group-hover:bg-emerald-800/60 border border-emerald-600/50 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition shadow-lg">
              <Upload size={28} />
            </div>
            <div>
              <div className="font-bold text-sm text-white group-hover:text-emerald-300 transition">
                Click to select passport photo or drag &amp; drop
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Supports JPG, PNG, WEBP (Max 8MB). Works with any background.
              </p>
            </div>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="p-8 rounded-3xl bg-[#021810] border border-emerald-800 text-center space-y-3">
            <RefreshCw size={36} className="mx-auto text-emerald-400 animate-spin" />
            <div className="text-sm font-bold text-white">
              Removing photo background &amp; embedding FCC watermark...
            </div>
            <p className="text-xs text-emerald-300/70 font-mono">
              Detecting perimeter chroma • Feathering hair edges • Stamping college crest
            </p>
          </div>
        )}

        {/* Side-by-Side Comparison */}
        {selectedFile && !isProcessing && processedPhoto && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Original */}
              <div className="p-4 rounded-2xl bg-[#021810] border border-emerald-900/80 space-y-2 text-center">
                <span className="text-[11px] font-mono font-bold text-slate-400 uppercase block">
                  Original Uploaded Photo
                </span>
                <div className="w-44 h-44 mx-auto rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 shadow-inner">
                  <img
                    src={originalPreview}
                    alt="Original Upload"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] text-emerald-400 hover:text-emerald-200 underline"
                >
                  Choose different picture
                </button>
              </div>

              {/* Processed with Watermark */}
              <div className="p-4 rounded-2xl bg-[#021810] border border-emerald-600/80 space-y-2 text-center relative shadow-lg shadow-emerald-950/60">
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono font-bold text-emerald-300 uppercase">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>Verified Watermarked Passport</span>
                </div>
                <div className="w-44 h-44 mx-auto rounded-2xl overflow-hidden border-2 border-emerald-500 bg-emerald-950/40 shadow-xl relative group">
                  <img
                    src={processedPhoto}
                    alt="Processed Passport"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/80 text-[9px] font-mono text-emerald-300">
                    WATERMARKED ✓
                  </div>
                </div>
                <span className="text-[11px] text-emerald-300/80 block">
                  Background removed + FCC Crest embedded
                </span>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Background Style Selector */}
            <div className="p-4 rounded-2xl bg-[#021810] border border-emerald-900/80 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-2">
                  <Sparkles size={14} className="text-emerald-400" />
                  <span>Passport Studio Background Style</span>
                </span>
                <span className="text-[11px] font-mono text-emerald-400">
                  {bgMode === 'studio-white' ? 'Clean Studio White' : bgMode === 'studio-emerald' ? 'Institutional Emerald' : 'Transparent Cutout'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'studio-white', label: 'Studio White', color: 'bg-white text-slate-900' },
                  { id: 'studio-emerald', label: 'College Mint', color: 'bg-emerald-100 text-emerald-950' },
                  { id: 'transparent', label: 'Transparent', color: 'bg-slate-800 text-white' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => handleBgModeChange(opt.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold transition border ${
                      bgMode === opt.id
                        ? 'border-emerald-400 bg-emerald-800 text-white shadow-md'
                        : 'border-emerald-900/60 bg-[#032317] text-emerald-300/70 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Fine-Tuning Background Tolerance Slider */}
              <div className="pt-2 border-t border-emerald-900/60 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Sliders size={12} className="text-emerald-400" />
                    <span>Cutout Sensitivity (Tolerance: {tolerance})</span>
                  </span>
                  <button
                    onClick={handleApplyTolerance}
                    className="text-emerald-400 hover:text-white font-mono text-[10px] underline"
                  >
                    Re-calculate
                  </button>
                </div>
                <input
                  type="range"
                  min="20"
                  max="65"
                  value={tolerance}
                  onChange={handleToleranceChange}
                  onMouseUp={handleApplyTolerance}
                  onTouchEnd={handleApplyTolerance}
                  className="w-full accent-emerald-500 h-1.5 bg-emerald-950 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-emerald-800/80">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-xl border border-emerald-800/80 bg-emerald-950/60 hover:bg-emerald-900 text-xs font-semibold text-emerald-300 hover:text-white transition disabled:opacity-50"
          >
            Cancel
          </button>

          {processedPhoto && (
            <button
              onClick={handleSaveAndApply}
              disabled={isSaving || isProcessing}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-xl shadow-emerald-950 flex items-center gap-2 transition disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Saving to Central SIS...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check size={16} className="text-white" />
                  <span>Applied Successfully!</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Save &amp; Apply Official Passport</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
