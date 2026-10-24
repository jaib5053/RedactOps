import React, { useState } from 'react';
import { Table, Download, Upload, CheckCircle, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { EntityRule, MaskingMode } from '../types';
import { parseCsv, processCsvMasking } from '../engine/csvEngine';

interface BatchCsvCleanerProps {
  rules: EntityRule[];
  mode: MaskingMode;
  onUpdateStats: (byteCount: number, entityCount: number) => void;
}

export const BatchCsvCleaner: React.FC<BatchCsvCleanerProps> = ({
  rules,
  mode,
  onUpdateStats
}) => {
  const [csvContent, setCsvContent] = useState('');
  const [cleanedCsv, setCleanedCsv] = useState('');
  const [parsedRows, setParsedRows] = useState<string[][]>([]);
  const [cleanedRows, setCleanedRows] = useState<string[][]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalScrubbed, setTotalScrubbed] = useState(0);

  const sampleCsv = `Patient_ID,Full_Name,SSN,Email,Phone,Primary_Diagnosis
1001,Jonathan Hastings,123-45-6789,jonathan.hastings@outlook.com,(555) 382-9102,Pneumonia Acute
1002,Helena Vance,451-92-3819,helena.vance@company.org,(555) 723-9912,Cardiac Arrhythmia
1003,Marcus Sterling,982-12-0041,marcus.sterling@meridian.io,(555) 438-2991,Type II Diabetes
1004,Rachel Morrison,092-41-8821,rachel.morrison@apexpharma.com,(555) 829-1002,Hypertension
1005,David Steinberg,331-52-9901,david.steinberg@cloudsync.io,(555) 912-3341,Post-Op Recovery`;

  const handleLoadSample = () => {
    setCsvContent(sampleCsv);
    setCleanedCsv('');
    setParsedRows(parseCsv(sampleCsv));
    setCleanedRows([]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
      setParsedRows(parseCsv(content));
      setCleanedCsv('');
      setCleanedRows([]);
    };
    reader.readAsText(file);
  };

  const handleCleanCsv = async () => {
    if (!csvContent.trim()) return;
    setIsProcessing(true);

    try {
      const result = await processCsvMasking(csvContent, rules, mode, { skipHeader: true });
      setCleanedCsv(result.sanitizedCsv);
      setCleanedRows(result.cleanedRows);
      setTotalScrubbed(result.totalEntitiesFound);

      const byteSize = new Blob([csvContent]).size;
      onUpdateStats(byteSize, result.totalEntitiesFound);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!cleanedCsv) return;
    const blob = new Blob([cleanedCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `redactops_clean_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Revoke Blob URL to prevent memory leaks
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  return (
    <div className="space-y-6">
      
      {/* CSV Cleaner Banner */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Client-Side Batch CSV / Tabular Sanitizer
            </h3>
            <p className="text-xs text-slate-400">
              Scrub columns containing PII, HIPAA medical markers, or credit cards in bulk. RFC 4180 compliant with 0 bytes data egress.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLoadSample}
            className="text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition"
          >
            Load Sample CSV
          </button>

          <label className="text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 px-3 py-1.5 rounded-lg cursor-pointer transition flex items-center gap-1.5 shadow-md shadow-sky-500/20">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload .CSV File</span>
            <input type="file" accept=".csv,.tsv,.txt" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Editor & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Raw CSV View */}
        <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Table className="w-3.5 h-3.5 text-slate-400" />
              Source CSV Data ({parsedRows.length > 0 ? `${parsedRows.length - 1} rows` : '0 rows'})
            </span>
          </div>

          <textarea
            value={csvContent}
            onChange={(e) => {
              setCsvContent(e.target.value);
              setParsedRows(parseCsv(e.target.value));
            }}
            placeholder="Paste raw CSV content here or upload a file..."
            className="p-4 bg-transparent text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none resize-none h-[280px] leading-relaxed"
          />

          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-mono">
              Mode: <span className="text-sky-400 capitalize">{mode}</span>
            </span>
            <button
              onClick={handleCleanCsv}
              disabled={!csvContent.trim() || isProcessing}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>{isProcessing ? 'Scrubbing...' : 'Sanitize Entire CSV'}</span>
            </button>
          </div>
        </div>

        {/* Sanitized CSV View */}
        <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Sanitized Output (Ready for AI / Export)
              </span>
              {totalScrubbed > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  {totalScrubbed} PII cells sanitized
                </span>
              )}
            </div>

            {cleanedCsv && (
              <button
                onClick={handleDownload}
                className="flex items-center space-x-1.5 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .CSV</span>
              </button>
            )}
          </div>

          <textarea
            readOnly
            value={cleanedCsv}
            placeholder="Sanitized CSV will display here with all SSNs, names, and contact details replaced..."
            className="p-4 bg-slate-950/50 text-xs font-mono text-slate-300 focus:outline-none resize-none h-[280px] leading-relaxed"
          />

          <div className="p-3 bg-slate-950 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between">
            <span>Status: {cleanedCsv ? 'Ready for cloud AI analysis' : 'Awaiting input'}</span>
            {cleanedCsv && (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> 100% In-Browser Scrubbed
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Tabular Visual Grid Preview */}
      {cleanedRows.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-slate-950 border-b border-slate-800">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Live Table Preview (First 5 Rows Cleaned)
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  {cleanedRows[0]?.map((col, idx) => (
                    <th key={idx} className="p-3 font-semibold">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {cleanedRows.slice(1, 6).map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-800/30 transition">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-3 text-slate-300">
                        {cell.startsWith('[') && cell.endsWith(']') ? (
                          <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                            {cell}
                          </span>
                        ) : (
                          cell
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
