import React from 'react';

/**
 * InstitutionalFooter
 * Consistent Institutional Copyright & Developer Attribution across every page & mobile popup
 * "© Federal Co-operative College, Ibadan • Developed by Brainfeels Tech"
 */
export default function InstitutionalFooter({ compact = false, className = '', light = false }) {
  const currentYear = 2026;

  if (compact) {
    return (
      <div className={`pt-2.5 mt-3 border-t ${light ? 'border-emerald-300/80 text-slate-700' : 'border-slate-800/80 text-slate-400'} text-[10px] text-center flex flex-wrap items-center justify-center gap-1.5 font-sans ${className}`}>
        <span>&copy; {currentYear} Federal Co-operative College, Ibadan</span>
        <span className={`${light ? 'text-slate-400' : 'text-slate-600'} hidden xs:inline`}>&bull;</span>
        <span>
          Developed by <strong className={`${light ? 'text-emerald-800 font-bold' : 'text-cyan-400 font-semibold'}`}>Brainfeels Tech</strong>
        </span>
      </div>
    );
  }

  return (
    <footer className={`w-full py-4 px-4 sm:px-6 text-center text-xs ${light ? 'text-slate-700 border-t border-emerald-300/60 bg-transparent' : 'text-slate-400 border-t border-slate-800/80 bg-[#020611]/90 backdrop-blur-md'} relative z-20 ${className}`}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className={`flex flex-wrap items-center justify-center gap-2 ${light ? 'text-slate-800' : 'text-slate-300'}`}>
          <span className="font-semibold">&copy; {currentYear} Federal Co-operative College, Ibadan</span>
          <span className={`${light ? 'text-slate-400' : 'text-slate-600'} hidden sm:inline`}>&bull;</span>
          <span className={`${light ? 'text-slate-600' : 'text-slate-400'} text-[11px]`}>Directorate of Library &amp; Information Services</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          <span className={light ? 'text-slate-600' : 'text-slate-400'}>Developed by</span>
          <span className={`font-bold ${light ? 'text-emerald-800' : 'text-cyan-300'} tracking-wide`}>Brainfeels Tech</span>
        </div>
      </div>
    </footer>
  );
}
