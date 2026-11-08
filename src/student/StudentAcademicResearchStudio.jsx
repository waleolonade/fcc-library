import React, { useState, useEffect } from 'react';
import {
  Search, BookOpen, Globe, FileText, Sparkles, Quote, Download,
  ExternalLink, Copy, Check, ChevronRight, Award, Bookmark,
  Layers, Filter, RefreshCw, AlertCircle, Compass, HelpCircle, Building2
} from 'lucide-react';
import { getApiBase } from '../api/libraryApi';
import { sounds } from '../utils/soundEffects';

const QUICK_TOPICS = [
  'Co-operative Economics in Nigeria',
  'Agricultural Micro-Credit & Smallholders',
  'Database Normalization 1NF to 3NF',
  'Monetary Policy & Central Banking',
  'Financial Accounting Standards & Auditing',
  'Public Administration & Governance'
];

export default function StudentAcademicResearchStudio({
  initialQuery = 'cooperative economics',
  onClose = null,
  activeUser = null
}) {
  const [query, setQuery] = useState(initialQuery);
  const [searching, setSearching] = useState(false);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'wikipedia' | 'openalex' | 'google_books' | 'crossref' | 'fcc_books'
  const [copiedCitation, setCopiedCitation] = useState(null);
  const [citationFormat, setCitationFormat] = useState('apa'); // 'apa' | 'mla' | 'harvard' | 'chicago'

  const executeSearch = async (searchTerm) => {
    const term = (searchTerm || query || '').trim();
    if (!term) return;
    setSearching(true);
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/student/research-engine?q=${encodeURIComponent(term)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setData(json.data);
          sounds.playSuccessChime();
        }
      }
    } catch (err) {
      console.warn('Research Engine search error:', err);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    executeSearch(initialQuery);
  }, []);

  const handleCopyCitation = (text, id) => {
    navigator.clipboard?.writeText(text);
    sounds.playSuccessChime();
    setCopiedCitation(id);
    setTimeout(() => setCopiedCitation(null), 2500);
  };

  const wiki = data?.wikipedia;
  const alexArticles = data?.scholarly_articles || [];
  const googleBooks = data?.google_books || [];
  const crossrefPapers = data?.crossref_papers || [];
  const fccBooks = data?.fcc_library_holdings || [];
  const assessmentGuides = data?.assessment_guides || [];

  return (
    <div className="bg-[#01140d] border border-emerald-800/80 rounded-3xl p-4 sm:p-7 space-y-6 text-white shadow-2xl">
      {/* HEADER WITH SEARCH BAR & INSTRUCTION */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800 flex items-center gap-1">
                <Sparkles size={11} />
                <span>Multi-API Student Assessment Hub</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-emerald-300 bg-emerald-950 border border-emerald-800">
                Wikipedia • Google • OpenAlex • CrossRef
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
              Academic Research &amp; Assessment Assistant
            </h2>
            <p className="text-xs text-emerald-300/80 max-w-2xl">
              Federated academic research engine designed to accelerate your coursework, seminar presentations, HND capstone theses, and exam assignments with verified peer-reviewed citations.
            </p>
          </div>

          {onClose && (
            <button
              onClick={() => { sounds.playClick(); onClose(); }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold transition self-end md:self-auto cursor-pointer"
            >
              ✕ Close Studio
            </button>
          )}
        </div>

        {/* SEARCH FORM */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sounds.playClick();
            executeSearch(query);
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your assignment topic, research question, or seminar title..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#021d13] border-2 border-emerald-700/80 focus:border-emerald-400 text-sm text-white placeholder-emerald-600/70 focus:outline-none transition shadow-inner"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={searching}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition cursor-pointer disabled:opacity-50"
          >
            {searching ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Searching Scholarly Repositories...</span>
              </>
            ) : (
              <>
                <Search size={16} />
                <span>Search All Research APIs</span>
              </>
            )}
          </button>
        </form>

        {/* QUICK TOPIC PILLS */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-[11px] font-mono text-emerald-400/80 mr-1 flex items-center gap-1">
            <Compass size={12} />
            <span>Curriculum Topics:</span>
          </span>
          {QUICK_TOPICS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setQuery(t);
                sounds.playClick();
                executeSearch(t);
              }}
              className="px-2.5 py-1 rounded-lg bg-[#021d13] hover:bg-emerald-950 border border-emerald-800/80 hover:border-emerald-500 text-[11px] text-emerald-200 transition cursor-pointer"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* FILTER TABS & CITATION FORMAT SELECTOR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 rounded-2xl bg-[#021d13] border border-emerald-800/80 text-xs">
        <div className="flex flex-wrap items-center gap-1">
          {[
            { id: 'all', label: 'All Resources' },
            { id: 'wikipedia', label: 'Wikipedia Academic Overview' },
            { id: 'openalex', label: `OpenAlex Papers (${alexArticles.length})` },
            { id: 'google_books', label: `Google Books (${googleBooks.length})` },
            { id: 'crossref', label: `CrossRef (${crossrefPapers.length})` },
            { id: 'fcc_books', label: `FCC Shelf Holdings (${fccBooks.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); sounds.playClick(); }}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer text-[11px] ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-emerald-300/80 hover:text-white hover:bg-emerald-950/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 px-2 shrink-0">
          <span className="text-[10px] font-mono text-slate-400">Citation Style:</span>
          <select
            value={citationFormat}
            onChange={(e) => setCitationFormat(e.target.value)}
            className="bg-[#01140d] text-emerald-200 border border-emerald-700 rounded-lg px-2 py-1 text-xs focus:outline-none"
          >
            <option value="apa">APA 7th (Standard)</option>
            <option value="mla">MLA 9th</option>
            <option value="harvard">Harvard</option>
            <option value="chicago">Chicago</option>
          </select>
        </div>
      </div>

      {/* SEARCH RESULTS DISPLAY */}
      {searching ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-emerald-300">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono tracking-wide">Querying Wikipedia, Google Books, OpenAlex &amp; CrossRef APIs...</p>
        </div>
      ) : !data ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          Enter an assessment topic or research keyword above to retrieve academic resources.
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. WIKIPEDIA ACADEMIC SUMMARY CARD */}
          {(activeTab === 'all' || activeTab === 'wikipedia') && wiki && (
            <div className="rounded-3xl bg-gradient-to-r from-[#03281a] to-[#011d13] border-2 border-emerald-600/60 p-5 sm:p-6 shadow-xl relative overflow-hidden space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1">
                    <Globe size={11} />
                    <span>Wikipedia Academic Foundation</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{wiki.description}</span>
                </div>

                <a
                  href={wiki.page_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-cyan-300 hover:text-white flex items-center gap-1 transition"
                >
                  <span>Open Full Article</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              <h3 className="text-lg font-black text-white">{wiki.title}</h3>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-4xl">
                {wiki.extract}
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-emerald-900/60 text-xs">
                <div className="text-[11px] font-mono text-emerald-300/80 truncate max-w-2xl">
                  {wiki.apa_citation}
                </div>

                <button
                  onClick={() => handleCopyCitation(wiki.apa_citation, 'wiki')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-800/60 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition shrink-0 cursor-pointer"
                >
                  {copiedCitation === 'wiki' ? <Check size={13} className="text-emerald-300" /> : <Quote size={13} />}
                  <span>{copiedCitation === 'wiki' ? 'Citation Copied!' : 'Copy APA Citation'}</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. OPENALEX PEER-REVIEWED SCHOLARLY PAPERS */}
          {(activeTab === 'all' || activeTab === 'openalex') && alexArticles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide font-mono">
                  <Award size={15} className="text-purple-400" />
                  <span>OpenAlex Peer-Reviewed Journal Articles ({alexArticles.length})</span>
                </h3>
                <span className="text-[10px] font-mono text-purple-300">Open Scholarly Graph (250M+ Works)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {alexArticles.map((art) => (
                  <div
                    key={art.id}
                    className="p-4 rounded-2xl bg-[#021d13] border border-purple-900/60 hover:border-purple-500 transition space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                        <span className="text-purple-300 font-bold">{art.year} • {art.venue}</span>
                        {art.is_open_access && (
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold">
                            Open Access
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-snug">
                        {art.title}
                      </h4>

                      <div className="text-xs text-slate-300">
                        <span>Authors: <strong className="text-slate-100">{art.authors}</strong></span>
                      </div>

                      {art.cited_by_count > 0 && (
                        <div className="text-[10px] text-amber-300 font-mono">
                          Cited by {art.cited_by_count} academic publications
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-purple-950 flex items-center justify-between gap-2 text-xs">
                      <button
                        onClick={() => handleCopyCitation(art.apa_citation, art.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        {copiedCitation === art.id ? <Check size={11} className="text-emerald-400" /> : <Quote size={11} />}
                        <span>{copiedCitation === art.id ? 'Copied' : 'Cite'}</span>
                      </button>

                      {art.pdf_url && (
                        <a
                          href={art.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold flex items-center gap-1 shadow transition"
                        >
                          <Download size={11} />
                          <span>PDF Paper</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. GOOGLE BOOKS ACADEMIC MONOGRAPHS */}
          {(activeTab === 'all' || activeTab === 'google_books') && googleBooks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide font-mono">
                  <BookOpen size={15} className="text-cyan-400" />
                  <span>Google Books Academic Treatises &amp; Textbooks ({googleBooks.length})</span>
                </h3>
                <span className="text-[10px] font-mono text-cyan-300">Google Books API</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {googleBooks.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-2xl bg-[#021d13] border border-cyan-900/60 hover:border-cyan-500 transition space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-mono text-cyan-300">
                        <span>{b.publisher} ({b.published_date})</span>
                        {b.page_count && <span>{b.page_count} Pages</span>}
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-2">
                        {b.title}
                      </h4>

                      <div className="text-xs text-slate-300">
                        <span>Author(s): <strong className="text-slate-100">{b.authors}</strong></span>
                      </div>

                      <p className="text-[11px] text-slate-300/80 line-clamp-2 leading-relaxed">
                        {b.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-cyan-950 flex items-center justify-between gap-2 text-xs">
                      <button
                        onClick={() => handleCopyCitation(b.apa_citation, b.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        {copiedCitation === b.id ? <Check size={11} className="text-emerald-400" /> : <Quote size={11} />}
                        <span>{copiedCitation === b.id ? 'Copied' : 'Cite'}</span>
                      </button>

                      {b.preview_link && (
                        <a
                          href={b.preview_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white text-[11px] font-bold flex items-center gap-1 shadow transition"
                        >
                          <ExternalLink size={11} />
                          <span>Google Preview</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. CROSSREF SCHOLARLY PAPERS */}
          {(activeTab === 'all' || activeTab === 'crossref') && crossrefPapers.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide font-mono">
                <FileText size={15} className="text-amber-400" />
                <span>CrossRef Academic DOI Index ({crossrefPapers.length})</span>
              </h3>

              <div className="space-y-2">
                {crossrefPapers.map((cp, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-[#021d13] border border-amber-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="font-bold text-white line-clamp-1">{cp.title}</div>
                      <div className="text-[11px] text-slate-300">
                        {cp.authors} • <em className="text-amber-300">{cp.journal}</em> ({cp.year})
                      </div>
                      {cp.doi && (
                        <div className="text-[10px] font-mono text-cyan-300 truncate">DOI: {cp.doi}</div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleCopyCitation(cp.apa_citation, `cr-${idx}`)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 transition"
                      >
                        {copiedCitation === `cr-${idx}` ? <Check size={11} className="text-emerald-400" /> : <Quote size={11} />}
                        <span>Cite</span>
                      </button>

                      {cp.url && (
                        <a
                          href={cp.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-amber-700 hover:bg-amber-600 text-white text-[11px] font-bold flex items-center gap-1 transition"
                        >
                          <ExternalLink size={11} />
                          <span>DOI Article</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. FCC CENTRAL LIBRARY HOLDINGS CORRELATION */}
          {(activeTab === 'all' || activeTab === 'fcc_books') && fccBooks.length > 0 && (
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-950/80 to-[#022418] border border-emerald-600/80 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide font-mono">
                  <Building2 size={15} className="text-emerald-400" />
                  <span>On-Campus Physical Library Holdings ({fccBooks.length})</span>
                </h3>
                <span className="text-[10px] font-mono text-emerald-300">Available at FCC Central Library Stacks</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fccBooks.map((fb) => (
                  <div key={fb.id} className="p-3 rounded-2xl bg-[#01140d] border border-emerald-700/60 space-y-1.5 text-xs">
                    <div className="font-bold text-white line-clamp-1">{fb.title}</div>
                    <div className="text-[11px] text-slate-300">By {fb.author}</div>
                    <div className="flex items-center justify-between text-[10px] font-mono pt-1 text-emerald-300 border-t border-emerald-900">
                      <span>Call No: <strong className="text-white">{fb.call_number}</strong></span>
                      <span className="text-amber-300">{fb.shelf_location}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
