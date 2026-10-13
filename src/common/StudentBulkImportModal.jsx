import React, { useState, useMemo, useRef } from 'react';
import {
  X, Upload, FileText, Download, CheckCircle2, AlertCircle,
  Building2, Lock, Users, Sparkles, Trash2, ArrowRight, ShieldCheck,
  FileSpreadsheet, HelpCircle
} from 'lucide-react';
import { libraryApi } from '../api/libraryApi';
import { sounds } from '../utils/soundEffects';
import { formatStudentBarcode } from '../utils/studentIdentity';

export default function StudentBulkImportModal({
  isOpen,
  onClose,
  mode = 'hod', // 'hod' | 'admin'
  currentDept = null,
  departments = [],
  onImportComplete
}) {
  const isHod = mode === 'hod';
  const fileInputRef = useRef(null);

  const hodDeptName = currentDept?.name || 'Co-operative Economics & Management';
  const hodDeptCode = currentDept?.code || 'CEM';

  // Admin Department Assignment Mode
  // 'single': Assign all rows to a single department
  // 'auto': Auto-detect from CSV 'Department' column
  const [adminDeptMode, setAdminDeptMode] = useState('single');
  const [selectedDept, setSelectedDept] = useState(isHod ? hodDeptName : (departments[0]?.name || hodDeptName));

  // Input Mode: 'paste' | 'file'
  const [inputTab, setInputTab] = useState('paste');
  const [pastedText, setPastedText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [defaultLevel, setDefaultLevel] = useState('ND I');

  const [isImporting, setIsImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Sample data generator
  const getSampleText = () => {
    if (isHod) {
      return `Matric, Name, Level, Email, Phone
FCC/${hodDeptCode}/2026/001, Oluwaseun Adeleke, ND I, o.adeleke@fccibadan.edu.ng, +234 802 111 2233
FCC/${hodDeptCode}/2026/002, Aminat Bakare, ND I, a.bakare@fccibadan.edu.ng, +234 803 222 3344
FCC/${hodDeptCode}/2026/003, Chinedu Eze, ND II, c.eze@fccibadan.edu.ng, +234 804 333 4455
FCC/${hodDeptCode}/2026/004, Fatima Bello, HND I, f.bello@fccibadan.edu.ng, +234 805 444 5566
FCC/${hodDeptCode}/2026/005, Tunde Oladipo, HND II, t.oladipo@fccibadan.edu.ng, +234 806 555 6677`;
    }
    return `Matric, Name, Department, Level, Email, Phone
FCC/CSC/2026/010, Kehinde Alabi, Computer Science & Information Technology, ND I, k.alabi@fccibadan.edu.ng, +234 802 111 2233
FCC/CEM/2026/011, Blessing Okon, Co-operative Economics & Management, ND I, b.okon@fccibadan.edu.ng, +234 803 222 3344
FCC/BNF/2026/012, Musa Danjuma, Banking & Finance, ND II, m.danjuma@fccibadan.edu.ng, +234 804 333 4455
FCC/AGR/2026/013, Grace Adeleke, Agricultural Extension & Management, HND I, g.adeleke@fccibadan.edu.ng, +234 805 444 5566
FCC/BAM/2026/014, Emmanuel David, Business Administration & Management, HND II, e.david@fccibadan.edu.ng, +234 806 555 6677`;
  };

  // Download Sample CSV template
  const handleDownloadTemplate = () => {
    const content = getSampleText();
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', isHod ? `FCC_${hodDeptCode}_student_template.csv` : 'FCC_college_students_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setPastedText(text);
        setInputTab('paste'); // Switch to preview
      }
    };
    reader.readAsText(file);
  };

  // Parser: Parses CSV / TSV text into student records
  const parsedStudents = useMemo(() => {
    if (!pastedText.trim()) return [];

    const lines = pastedText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];

    // Detect header
    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes('name') || firstLine.includes('matric') || firstLine.includes('student');

    let colIndexes = {
      matric: -1,
      name: -1,
      dept: -1,
      level: -1,
      email: -1,
      phone: -1
    };

    const dataLines = hasHeader ? lines.slice(1) : lines;

    if (hasHeader) {
      const headerTokens = lines[0].split(/[\t,;]/).map(t => t.trim().toLowerCase().replace(/['"]/g, ''));
      headerTokens.forEach((tok, idx) => {
        if (tok.includes('matric')) colIndexes.matric = idx;
        else if (tok.includes('name')) colIndexes.name = idx;
        else if (tok.includes('dept') || tok.includes('department')) colIndexes.dept = idx;
        else if (tok.includes('level')) colIndexes.level = idx;
        else if (tok.includes('email') || tok.includes('mail')) colIndexes.email = idx;
        else if (tok.includes('phone') || tok.includes('mobile')) colIndexes.phone = idx;
      });
    }

    const students = [];

    dataLines.forEach((line, lineIndex) => {
      // Split by comma, tab, or semicolon (respecting quotes simple split)
      const tokens = line.split(/[\t,;]/).map(t => t.trim().replace(/^["']|["']$/g, ''));
      if (tokens.length === 0 || tokens.every(t => !t)) return;

      let name = '';
      let matric = '';
      let dept = isHod ? hodDeptName : selectedDept;
      let lvl = defaultLevel;
      let email = '';
      let phone = '';

      if (hasHeader && colIndexes.name !== -1) {
        name = tokens[colIndexes.name] || '';
        if (colIndexes.matric !== -1) matric = tokens[colIndexes.matric] || '';
        if (!isHod && adminDeptMode === 'auto' && colIndexes.dept !== -1 && tokens[colIndexes.dept]) {
          dept = tokens[colIndexes.dept];
        }
        if (colIndexes.level !== -1 && tokens[colIndexes.level]) lvl = tokens[colIndexes.level];
        if (colIndexes.email !== -1) email = tokens[colIndexes.email] || '';
        if (colIndexes.phone !== -1) phone = tokens[colIndexes.phone] || '';
      } else {
        // Fallback positional detection
        // Format: Matric, Name, Level (or Name, Matric, Level)
        if (tokens[0]?.toUpperCase().includes('FCC/')) {
          matric = tokens[0];
          name = tokens[1] || '';
          if (tokens[2]) lvl = tokens[2];
          if (tokens[3]) email = tokens[3];
          if (tokens[4]) phone = tokens[4];
        } else {
          name = tokens[0];
          matric = tokens[1] || '';
          if (tokens[2]) lvl = tokens[2];
          if (tokens[3]) email = tokens[3];
          if (tokens[4]) phone = tokens[4];
        }
      }

      // If HOD mode, strictly enforce HOD department!
      if (isHod) {
        dept = hodDeptName;
      }

      if (name.trim()) {
        const autoBarcode = formatStudentBarcode(matric, dept);
        students.push({
          id: `preview-${lineIndex}`,
          name: name.trim(),
          matric: matric.trim(),
          libraryId: autoBarcode,
          barcode: autoBarcode,
          department: dept,
          level: lvl.trim() || defaultLevel,
          email: email.trim(),
          phone: phone.trim()
        });
      }
    });

    return students;
  }, [pastedText, isHod, hodDeptName, selectedDept, adminDeptMode, defaultLevel]);

  if (!isOpen) return null;

  // Handle Import Submit
  const handleExecuteImport = async () => {
    if (parsedStudents.length === 0) {
      setErrorMessage('No valid student records found to import.');
      return;
    }

    setIsImporting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const enforceDept = isHod ? hodDeptName : (adminDeptMode === 'single' ? selectedDept : null);

      const result = await libraryApi.patrons.bulkAddPatrons(
        parsedStudents,
        selectedDept,
        enforceDept,
        defaultLevel
      );

      if (result.success) {
        sounds?.playSuccessChime?.();
        setSuccessMessage(`Successfully imported ${result.count || parsedStudents.length} scholars to the database!`);
        if (onImportComplete) {
          onImportComplete(result.patrons || parsedStudents);
        }
        setTimeout(() => {
          onClose();
          setPastedText('');
          setUploadedFileName('');
          setSuccessMessage('');
        }, 1500);
      } else {
        setErrorMessage(result.message || 'Failed to complete bulk import.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error occurred while saving bulk students.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
              isHod ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
            }`}>
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{isHod ? `Bulk Student Import - ${hodDeptName}` : 'Bulk Student Roster Import & Assignment'}</span>
              </h3>
              <p className="text-xs text-slate-400">
                {isHod
                  ? `HOD Privilege: All imported students will strictly be assigned to ${hodDeptName}`
                  : 'College Central Registry: Batch import students across departments or assign en masse'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Department Policy Card */}
          <div className={`p-4 rounded-2xl border ${
            isHod ? 'bg-teal-950/40 border-teal-800/60' : 'bg-indigo-950/40 border-indigo-800/60'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Building2 size={18} className={isHod ? 'text-teal-400' : 'text-indigo-400'} />
                <div>
                  <div className="text-xs font-bold text-white">
                    {isHod ? `Department Enforcement: ${hodDeptName}` : 'Target Department Assignment'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {isHod
                      ? 'Locked to your department alone. No student can be registered outside your departmental jurisdiction.'
                      : 'Assign all imported rows to a chosen department or detect from CSV columns.'}
                  </div>
                </div>
              </div>

              {!isHod && (
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={selectedDept}
                    onChange={e => setSelectedDept(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:border-indigo-500 focus:outline-none"
                  >
                    {departments.length > 0 ? (
                      departments.map(d => (
                        <option key={d.code || d.name} value={d.name}>
                          {d.name} ({d.code})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Co-operative Economics & Management">Co-operative Economics (CEM)</option>
                        <option value="Computer Science & Information Technology">Computer Science (CSC)</option>
                        <option value="Banking & Finance">Banking & Finance (BNF)</option>
                        <option value="Agricultural Extension & Management">Agricultural Extension (AGR)</option>
                        <option value="Business Administration & Management">Business Administration (BAM)</option>
                        <option value="Public Administration">Public Administration (PAD)</option>
                      </>
                    )}
                  </select>
                </div>
              )}
            </div>

            {!isHod && (
              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="radio"
                    name="adminDeptMode"
                    checked={adminDeptMode === 'single'}
                    onChange={() => setAdminDeptMode('single')}
                    className="accent-indigo-500"
                  />
                  <span>Assign all rows to <strong>{selectedDept}</strong></span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="radio"
                    name="adminDeptMode"
                    checked={adminDeptMode === 'auto'}
                    onChange={() => setAdminDeptMode('auto')}
                    className="accent-indigo-500"
                  />
                  <span>Auto-detect from CSV 'Department' column</span>
                </label>
              </div>
            )}
          </div>

          {/* Action Tabs & Template Tools */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setInputTab('paste')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  inputTab === 'paste' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Paste Table / Text
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputTab('file');
                  fileInputRef.current?.click();
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                  inputTab === 'file' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Upload size={12} />
                <span>Upload CSV File</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPastedText(getSampleText())}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition flex items-center gap-1"
                title="Populate test data with 1-click"
              >
                <Sparkles size={12} className="text-amber-400" />
                <span>Load Sample Data</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition flex items-center gap-1"
              >
                <Download size={12} />
                <span>Download Template (.csv)</span>
              </button>
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv,.txt,.tsv"
            className="hidden"
          />

          {/* Paste / Editor Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Roster Input (CSV or Tab-Delimited):</span>
              <span>{parsedStudents.length} scholar rows parsed</span>
            </div>
            <textarea
              rows={6}
              value={pastedText}
              onChange={e => setPastedText(e.target.value)}
              placeholder={`Paste student roster here. Example format:\nMatric, Name, Level, Email, Phone\nFCC/${hodDeptCode}/2026/001, Oluwaseun Adeleke, ND I, o.adeleke@fccibadan.edu.ng, +234 802 000 0000`}
              className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-indigo-500 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Parsed Preview Table */}
          {parsedStudents.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Users size={14} className={isHod ? 'text-teal-400' : 'text-indigo-400'} />
                  <span>Import Preview ({parsedStudents.length} Scholars)</span>
                </h4>
                <span className="text-[11px] font-mono text-emerald-400">
                  Ready to register to database
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/70">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[9px] sticky top-0">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Scholar Name</th>
                      <th className="py-2 px-3">Matric No</th>
                      <th className="py-2 px-3">Auto Barcode</th>
                      <th className="py-2 px-3">Assigned Department</th>
                      <th className="py-2 px-3">Level</th>
                      <th className="py-2 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {parsedStudents.map((st, i) => (
                      <tr key={i} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 font-mono text-slate-500">{i + 1}</td>
                        <td className="py-2 px-3 font-semibold text-white">{st.name}</td>
                        <td className="py-2 px-3 font-mono text-indigo-400">{st.matric || 'Auto-generated'}</td>
                        <td className="py-2 px-3 font-mono text-emerald-400 font-semibold">{st.barcode}</td>
                        <td className="py-2 px-3 text-slate-300">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                            {st.department}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-400">{st.level}</td>
                        <td className="py-2 px-3 text-right">
                          <span className="text-emerald-400 font-mono text-[10px]">Valid</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              {parsedStudents.length > 0 ? (
                <span>Total records ready: <strong className="text-white">{parsedStudents.length}</strong></span>
              ) : (
                <span>Upload CSV or paste roster above to preview</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isImporting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isImporting || parsedStudents.length === 0}
                className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-lg transition flex items-center gap-2 ${
                  isHod
                    ? 'bg-teal-600 hover:bg-teal-500 shadow-teal-950'
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-950'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {isImporting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Importing to Database...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet size={14} />
                    <span>Import {parsedStudents.length} Scholars</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
