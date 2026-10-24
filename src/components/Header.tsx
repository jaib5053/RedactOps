import React from 'react';
import { ShieldCheck, Lock, Activity, Award, Sparkles, BookOpen } from 'lucide-react';

interface HeaderProps {
  onOpenAudit: () => void;
  onOpenPricing: () => void;
  onOpenSecurityMonitor: () => void;
  onOpenGuides?: () => void;
  processedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAudit,
  onOpenPricing,
  onOpenSecurityMonitor,
  onOpenGuides,
  processedCount
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 shadow-lg shadow-sky-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white tracking-tight">Redact<span className="text-sky-400">Ops</span></span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                Zero-Knowledge
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Client-Side PII Masking & De-Identification Engine</p>
          </div>
        </div>

        {/* Live Zero-Knowledge Status Badge */}
        <div className="hidden md:flex items-center space-x-2 bg-slate-900/90 px-3 py-1.5 rounded-full border border-slate-800">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs text-slate-300 font-mono">100% In-Browser</span>
          <span className="text-slate-600">•</span>
          <button 
            onClick={onOpenSecurityMonitor}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1 transition-colors"
            title="Inspect Network and Crypto Isolation Proof"
          >
            <Lock className="w-3 h-3" />
            <span>0B Egress (Verified)</span>
          </button>
        </div>

        {/* Navigation & Action Buttons */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {onOpenGuides && (
            <button
              onClick={onOpenGuides}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
              title="Read AI compliance & redaction guides"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Guides</span>
            </button>
          )}

          <button
            onClick={onOpenSecurityMonitor}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Telemetry Proof</span>
          </button>

          {processedCount > 0 && (
            <button
              onClick={onOpenAudit}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-sky-300 bg-sky-950/60 hover:bg-sky-900/60 border border-sky-800/60 transition"
            >
              <Award className="w-3.5 h-3.5 text-sky-400" />
              <span>Audit Cert</span>
            </button>
          )}

          <button
            onClick={onOpenPricing}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-md shadow-sky-500/20 transition transform active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Upgrade to Pro</span>
          </button>
        </div>

      </div>
    </header>
  );
};
