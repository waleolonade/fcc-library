import React, { useState } from 'react';
import { Link2, Check, Copy, ExternalLink } from 'lucide-react';
import { copyToClipboardWithFeedback, getPermalink } from '../utils/router';
import { sounds } from '../utils/soundEffects';

export default function TraceBadge({
  uri,
  label,
  showLabel = false,
  isAction = false,
  className = ''
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    const fullUrl = uri.startsWith('http')
      ? uri
      : `${window.location.origin}${window.location.pathname}${uri.startsWith('#') ? uri : '#' + (uri.startsWith('/') ? uri : '/' + uri)}`;
    
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(fullUrl).then(() => {
        sounds.playClick();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        copyToClipboardWithFeedback(fullUrl, () => {
          sounds.playClick();
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      });
    } else {
      copyToClipboardWithFeedback(fullUrl, () => {
        sounds.playClick();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={`Trace Address: ${uri} (Click to copy traceable link)`}
      className={`inline-flex items-center gap-1 font-mono text-[9px] px-1.5 py-0.5 rounded-md border transition-all select-none max-w-full overflow-hidden shrink-0 ${
        copied
          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
          : 'bg-slate-900/80 text-slate-400 hover:text-emerald-300 border-slate-700/60 hover:border-emerald-500/50 hover:bg-slate-800'
      } ${className}`}
    >
      {copied ? (
        <>
          <Check size={9} className="text-emerald-400 shrink-0" />
          <span className="font-sans font-medium text-emerald-400 truncate">Copied!</span>
        </>
      ) : (
        <>
          <Link2 size={9} className="text-emerald-400 shrink-0" />
          {showLabel && <span className="font-sans text-slate-300 mr-0.5 shrink-0">{label || 'URI'}:</span>}
          <span className="truncate max-w-[65px] xs:max-w-[90px] sm:max-w-[120px] text-slate-400 group-hover:text-emerald-300">
            {decodeURIComponent(uri || '')}
          </span>
        </>
      )}
    </button>
  );
}
