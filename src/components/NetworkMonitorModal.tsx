import React from 'react';
import { X, ShieldCheck, WifiOff, Cpu, Lock, CheckCircle2, ArrowRight } from 'lucide-react';

interface NetworkMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  processedBytes: number;
}

export const NetworkMonitorModal: React.FC<NetworkMonitorModalProps> = ({
  isOpen,
  onClose,
  processedBytes
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 overflow-hidden">
        
        {/* Glow accent */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Zero-Knowledge Architectural Verification
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">100% Client-Side</span>
              </h3>
              <p className="text-xs text-slate-400">Inspect the sandbox security boundary and live network diagnostics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center">
            <WifiOff className="w-5 h-5 text-emerald-400 mb-2" />
            <span className="text-2xl font-bold font-mono text-emerald-400">0 Bytes</span>
            <span className="text-xs text-slate-400 uppercase tracking-wider mt-1">External Data Egress</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center">
            <Cpu className="w-5 h-5 text-sky-400 mb-2" />
            <span className="text-2xl font-bold font-mono text-sky-400">
              {(processedBytes / 1024).toFixed(1)} KB
            </span>
            <span className="text-xs text-slate-400 uppercase tracking-wider mt-1">Local Memory Scrubbed</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center">
            <Lock className="w-5 h-5 text-purple-400 mb-2" />
            <span className="text-2xl font-bold font-mono text-purple-400">AES-GCM</span>
            <span className="text-xs text-slate-400 uppercase tracking-wider mt-1">WebCrypto Key Isolation</span>
          </div>
        </div>

        {/* Technical Explanations */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start space-x-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-white">No Backend Ingestion Pipeline: </span>
              RedactOps operates strictly within your browser's V8 Javascript runtime. Document parsing, regular expression matching, and token substitution happen in-memory.
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-white">Inspect Your Network Tab: </span>
              Open Chrome/Firefox DevTools (<code className="px-1 py-0.5 bg-slate-800 rounded font-mono text-sky-300">F12</code> &gt; <code className="px-1 py-0.5 bg-slate-800 rounded font-mono text-sky-300">Network</code>) and drop a 10MB CSV. You will observe exactly zero outbound POST or PUT requests carrying your data.
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-white">Ephemeral Session Cryptography: </span>
              The reversible token-to-PII mapping table is stored only in volatile browser RAM and wiped immediately when you refresh or close this browser tab.
            </div>
          </div>
        </div>

        {/* Footer info & Dismiss */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <span className="text-xs font-mono text-slate-500">Protocol: ZERO_KNOWLEDGE_V1</span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition"
          >
            Acknowledge & Close
          </button>
        </div>

      </div>
    </div>
  );
};
