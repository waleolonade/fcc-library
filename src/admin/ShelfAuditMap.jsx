import React, { useState } from 'react';
import { MapPin, Scan, CheckCircle, AlertTriangle, Layers, Building, Search, Sparkles } from 'lucide-react';
import { INITIAL_ITEM_COPIES } from '../data/institutionalSeedData';

export default function ShelfAuditMap({ books }) {
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [auditResult, setAuditResult] = useState(null);

  const floorLayouts = {
    1: {
      name: "Floor 1 • Computer Science & Digital Information Sciences",
      sections: [
        { id: "Aisle 1", callRange: "QA75 - QA76.73", shelves: ["Shelf 01A", "Shelf 01B", "Shelf 02A", "Shelf 02B"] },
        { id: "Aisle 2", callRange: "QA76.9 (Databases & Distributed SQL)", shelves: ["Shelf 05A", "Shelf 05B", "Shelf 06A", "Shelf 06B"] },
        { id: "Aisle 3", callRange: "Z666 - Z699 (Information Retrieval & AI)", shelves: ["Shelf 02A", "Shelf 02B", "Shelf 03A", "Shelf 03B"] }
      ]
    },
    2: {
      name: "Floor 2 • Co-operative Economics, Banking & Law",
      sections: [
        { id: "Aisle 1", callRange: "HG1501 - HG1660 (Banking & Finance)", shelves: ["Shelf 08A", "Shelf 08B", "Shelf 08C", "Shelf 09A"] },
        { id: "Aisle 4", callRange: "HD2951 - HD3000 (Co-operative Principles)", shelves: ["Shelf 12A", "Shelf 12B", "Shelf 13A", "Shelf 13B"] },
        { id: "Aisle 5", callRange: "KTL900 - KTL999 (Cooperative Law)", shelves: ["Shelf 14A", "Shelf 14B", "Shelf 14C", "Shelf 15A"] }
      ]
    },
    3: {
      name: "Floor 3 • Agronomy, Post-Harvest & Dissertations",
      sections: [
        { id: "Aisle 6", callRange: "SB200 - SB300 (Cocoa Agronomy & Soil)", shelves: ["Shelf 19A", "Shelf 19B", "Shelf 20A", "Shelf 20B"] },
        { id: "Aisle 7", callRange: "FCC Dissertations & Institutional Archives", shelves: ["Arch-01", "Arch-02", "Arch-03", "Arch-04"] }
      ]
    }
  };

  const handleAuditScan = (e) => {
    e.preventDefault();
    const barcodeTrimmed = scannedBarcode.trim().toUpperCase();
    const foundCopy = INITIAL_ITEM_COPIES.find(c => c.barcode === barcodeTrimmed || c.rfid === barcodeTrimmed);

    if (!foundCopy) {
      setAuditResult({
        status: 'misplaced',
        msg: `Item "${scannedBarcode}" not registered in active RFID shelf topology!`
      });
      return;
    }

    const book = books.find(b => b.id === foundCopy.bookId);
    setAuditResult({
      status: 'verified',
      msg: `Verified: "${book ? book.title : foundCopy.bookId}" is correctly shelved at [${foundCopy.shelf}]`,
      copy: foundCopy,
      book
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-xs font-semibold mb-2">
          <Sparkles size={13} className="text-indigo-400" />
          Smart Shelf & RFID Inventory Topology
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          Visual Campus Floorplan & Shelf Audit
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Real-time physical stack locator, RFID shelf sensor tracking, and automated misplaced item detection.
        </p>
      </div>

      {/* Audit Scanner Bar */}
      <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Scan size={14} className="text-indigo-400" /> Handheld RFID / Barcode Shelf Wand
        </h3>

        <form onSubmit={handleAuditScan} className="flex gap-2">
          <input
            type="text"
            placeholder="Scan Shelf Barcode or RFID Tag UID (e.g. FCC-CP-00101, E28011606000021A)..."
            value={scannedBarcode}
            onChange={(e) => setScannedBarcode(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow transition"
          >
            Audit Shelf Tag
          </button>
        </form>

        {auditResult && (
          <div className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
            auditResult.status === 'verified'
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              : 'bg-rose-950 text-rose-300 border border-rose-800'
          }`}>
            {auditResult.status === 'verified' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            <span>{auditResult.msg}</span>
          </div>
        )}
      </div>

      {/* Floorplan Selector Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        {[1, 2, 3].map(floor => (
          <button
            key={floor}
            onClick={() => setSelectedFloor(floor)}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition ${
              selectedFloor === floor
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Floor {floor} Stacks
          </button>
        ))}
      </div>

      {/* Interactive Floorplan Map */}
      <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 space-y-5">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-white">{floorLayouts[selectedFloor].name}</span>
          <span className="font-mono text-emerald-400">RFID SCANNER GATE ONLINE</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {floorLayouts[selectedFloor].sections.map(sec => (
            <div key={sec.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <div>
                <div className="text-xs font-bold text-indigo-400">{sec.id}</div>
                <div className="text-[10px] text-slate-500 font-mono">{sec.callRange}</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {sec.shelves.map(shelf => (
                  <div
                    key={shelf}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-center text-xs font-semibold text-slate-300 hover:border-indigo-500 hover:text-white cursor-pointer transition"
                  >
                    <div className="text-[11px] font-mono">{shelf}</div>
                    <div className="text-[9px] text-emerald-400 mt-0.5">● Active In-Stock</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
