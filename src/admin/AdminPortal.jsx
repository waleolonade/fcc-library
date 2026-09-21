import React, { useState, useEffect } from 'react';
import {
  Shield, RefreshCw, Database, Globe, ShoppingBag, MapPin,
  BarChart3, FileText, LogOut, Sparkles, Layers, BookOpen,
  Award, Newspaper, Printer, Link2, Building2, FileUp, Upload
} from 'lucide-react';
import { INSTITUTION, INITIAL_PARTNER_LIBRARIES } from '../data/institutionalSeedData';
import CirculationDesk from './CirculationDesk';
import MarcCataloguer from './MarcCataloguer';
import ResearchIngestion from './ResearchIngestion';
import AcquisitionsManager from './AcquisitionsManager';
import ShelfAuditMap from './ShelfAuditMap';
import InstitutionalAnalytics from './InstitutionalAnalytics';
import AuditLogViewer from './AuditLogViewer';
import AccreditationAuditor from './AccreditationAuditor';
import SerialsManager from './SerialsManager';
import ExternalLinksManager from './ExternalLinksManager';
import PartnerLibrariesManager from './PartnerLibrariesManager';
import PdfUploadManager from './PdfUploadManager';
import TraceBadge from '../common/TraceBadge';
import { navigateTo, parseCurrentRoute } from '../utils/router';

export default function AdminPortal({
  user,
  onLogout,
  books,
  setBooks,
  partnerLibraries = INITIAL_PARTNER_LIBRARIES,
  setPartnerLibraries,
  loans,
  setLoans,
  onOpenReader
}) {
  const [activeTab, setActiveTab] = useState('circulation');
  // Tabs: 'circulation' | 'pdf_upload' | 'partner-libraries' | 'links' | 'marc' | 'research' | 'acquisitions' | 'serials' | 'shelves' | 'accreditation' | 'analytics' | 'audit'

  // Sync activeTab with URL Hash
  useEffect(() => {
    const syncFromHash = () => {
      const { path } = parseCurrentRoute();
      if (path.startsWith('/admin/')) {
        const sub = path.replace('/admin/', '').split('/')[0];
        const tabMap = {
          'circulation': 'circulation',
          'pdf-upload': 'pdf_upload',
          'pdf_upload': 'pdf_upload',
          'partner-libraries': 'partner_libs',
          'partner_libs': 'partner_libs',
          'links': 'extlinks',
          'extlinks': 'extlinks',
          'marc': 'marc',
          'research': 'research',
          'acquisitions': 'acquisitions',
          'serials': 'serials',
          'shelves': 'shelves',
          'accreditation': 'accreditation',
          'analytics': 'analytics',
          'audit': 'audit'
        };
        if (tabMap[sub]) {
          setActiveTab(tabMap[sub]);
        }
      }
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  const handleTabSwitch = (tabId) => {
    setActiveTab(tabId);
    const pathSlug = tabId === 'partner_libs' ? 'partner-libraries' : tabId === 'extlinks' ? 'links' : tabId === 'pdf_upload' ? 'pdf-upload' : tabId;
    navigateTo(`/admin/${pathSlug}`);
  };

  const handleImportResearchBook = (newBook) => {
    const fullBook = {
      ...newBook,
      id: `FCC-B00${books.length + 1}`
    };
    setBooks([fullBook, ...books]);
    alert(`Successfully ingested "${fullBook.title}" into Central MARC 21 Catalog!`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      {/* Staff Hub Top Navigation Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-8 py-3 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-900/50">
              <Shield size={20} />
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-none">
                {INSTITUTION.shortName} ILS Operations Console
              </div>
              <div className="text-[10px] text-indigo-400 font-mono mt-0.5">
                Staff Cataloguing, Circulation & Research Ingestion Tier
              </div>
            </div>
          </div>

          <nav className="hidden 2xl:flex items-center gap-1">
            {[
              { id: 'circulation', label: 'Circulation Desk', icon: RefreshCw },
              { id: 'pdf_upload', label: 'PDF Book Upload', icon: FileUp },
              { id: 'partner_libs', label: 'Linked Libraries', icon: Building2 },
              { id: 'extlinks', label: 'External Links / eBooks', icon: Link2 },
              { id: 'marc', label: 'MARC 21 Cataloguer', icon: Database },
              { id: 'research', label: 'OpenAlex/Crossref', icon: Globe },
              { id: 'acquisitions', label: 'Acquisitions', icon: ShoppingBag },
              { id: 'serials', label: 'Serials & ISSN', icon: Newspaper },
              { id: 'shelves', label: 'Shelf Audit & Map', icon: MapPin },
              { id: 'accreditation', label: 'Accreditation Audit', icon: Award },
              { id: 'analytics', label: 'Analytics & BI', icon: BarChart3 },
              { id: 'audit', label: 'Audit Logs', icon: FileText },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabSwitch(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeTab === tab.id
                      ? 'bg-indigo-950 text-indigo-300 border border-indigo-800 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-200">{user.name}</div>
            <div className="text-[10px] text-indigo-400 font-mono">{user.title || 'Super Admin'}</div>
          </div>

          <button
            onClick={onLogout}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Sub-Header for Compact / Tablet Screens */}
      <div className="2xl:hidden flex items-center gap-1 p-2 bg-slate-900/70 border-b border-slate-800 overflow-x-auto text-xs font-bold">
        {[
          { id: 'circulation', label: 'Circulation', icon: RefreshCw },
          { id: 'pdf_upload', label: 'PDF Upload', icon: FileUp },
          { id: 'partner_libs', label: 'Linked Libraries', icon: Building2 },
          { id: 'extlinks', label: 'Ext Links', icon: Link2 },
          { id: 'marc', label: 'MARC21', icon: Database },
          { id: 'research', label: 'Research', icon: Globe },
          { id: 'acquisitions', label: 'Acquisitions', icon: ShoppingBag },
          { id: 'serials', label: 'Serials', icon: Newspaper },
          { id: 'shelves', label: 'Shelf Map', icon: MapPin },
          { id: 'accreditation', label: 'Accreditation', icon: Award },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'audit', label: 'Audit', icon: FileText },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabSwitch(tab.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon size={13} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Admin Body */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
        {activeTab === 'circulation' && (
          <CirculationDesk
            books={books}
            setBooks={setBooks}
            loans={loans}
            setLoans={setLoans}
          />
        )}

        {activeTab === 'pdf_upload' && (
          <PdfUploadManager
            books={books}
            setBooks={setBooks}
            onOpenReader={onOpenReader}
          />
        )}

        {activeTab === 'partner_libs' && (
          <PartnerLibrariesManager
            partnerLibraries={partnerLibraries}
            setPartnerLibraries={setPartnerLibraries}
          />
        )}

        {activeTab === 'extlinks' && (
          <ExternalLinksManager
            books={books}
            setBooks={setBooks}
          />
        )}

        {activeTab === 'marc' && (
          <MarcCataloguer
            books={books}
            setBooks={setBooks}
          />
        )}

        {activeTab === 'research' && (
          <ResearchIngestion
            onImportBook={handleImportResearchBook}
          />
        )}

        {activeTab === 'acquisitions' && (
          <AcquisitionsManager />
        )}

        {activeTab === 'serials' && (
          <SerialsManager />
        )}

        {activeTab === 'shelves' && (
          <ShelfAuditMap
            books={books}
          />
        )}

        {activeTab === 'accreditation' && (
          <AccreditationAuditor
            books={books}
            loans={loans}
          />
        )}

        {activeTab === 'analytics' && (
          <InstitutionalAnalytics
            books={books}
            loans={loans}
          />
        )}

        {activeTab === 'audit' && (
          <AuditLogViewer />
        )}
      </main>
    </div>
  );
}
