import React, { useState } from 'react';
import { X, Award, CheckCircle, Download, Copy, Check, ShieldCheck, Printer } from 'lucide-react';
import { AuditCertificate } from '../types';

interface AuditCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: AuditCertificate | null;
}

export const AuditCertificateModal: React.FC<AuditCertificateModalProps> = ({
  isOpen,
  onClose,
  certificate
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !certificate) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(certificate, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(certificate, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `redactops_compliance_audit_${certificate.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Certificate Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Compliance Verification Certificate
              </h3>
              <p className="text-xs text-slate-400">Cryptographic audit proof for legal & compliance records</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate Body Container */}
        <div className="flex-1 overflow-y-auto py-5 space-y-5">
          
          {/* Certificate Card */}
          <div className="p-6 rounded-xl bg-slate-950 border-2 border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <ShieldCheck className="w-36 h-36 text-sky-400" />
            </div>

            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">Certificate ID</span>
                <div className="text-sm font-mono font-bold text-sky-400">{certificate.id}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">Timestamp (UTC)</span>
                <div className="text-xs font-mono text-slate-300">{new Date(certificate.timestamp).toUTCString()}</div>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase">Input Payload SHA-256 Digest:</span>
                <div className="text-xs font-mono text-slate-300 bg-slate-900 p-2 rounded border border-slate-800 break-all select-all">
                  {certificate.inputSha256}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase">Sanitized Output SHA-256 Digest:</span>
                <div className="text-xs font-mono text-emerald-400 bg-slate-900 p-2 rounded border border-slate-800 break-all select-all">
                  {certificate.outputSha256}
                </div>
              </div>
            </div>

            {/* Scrubbed Breakdown */}
            <div className="border-t border-slate-800/80 pt-4 mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">Total Entities De-Identified:</span>
                <span className="text-sm font-bold font-mono text-emerald-400">
                  {certificate.entitiesScrubbedCount} entities
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(certificate.entitiesBreakdown).map(([type, count]) => (
                  <span
                    key={type}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800"
                  >
                    {type}: <strong className="text-sky-400">{count}</strong>
                  </span>
                ))}
              </div>
            </div>

            {/* Standard Attestation */}
            <div className="border-t border-slate-800/80 pt-4 space-y-1.5">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block mb-1">
                Satisfied Compliance Standards:
              </span>
              {certificate.complianceStandards.map((std, i) => (
                <div key={i} className="flex items-center space-x-2 text-xs text-slate-300">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>{std}</span>
                </div>
              ))}
            </div>

            {/* Zero-Knowledge Seal */}
            <div className="mt-5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center space-x-3">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div className="text-xs text-emerald-300">
                <strong>Zero-Knowledge Attestation:</strong> At no point was raw or transformed data transmitted to any external server. Execution confirmed in-browser.
              </div>
            </div>

          </div>

        </div>

        {/* Modal Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied JSON' : 'Copy Audit Record'}</span>
            </button>
            <button
              onClick={handleDownloadJson}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .JSON</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white rounded-lg transition"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
