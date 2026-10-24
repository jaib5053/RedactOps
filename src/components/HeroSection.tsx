import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface HeroSectionProps {
  onOpenPricing: () => void;
  onOpenSecurityProof: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenPricing,
  onOpenSecurityProof
}) => {
  return (
    <div className="relative pt-4 pb-6 border-b border-slate-800/80 mb-6">
      <div className="max-w-4xl mx-auto text-center space-y-4">
        
        {/* Sub-headline Pill */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>The Zero-Knowledge AI Compliance Shield</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Use ChatGPT & Claude on Sensitive Data{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-300 to-indigo-400">
            Without Violating HIPAA or GDPR.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          100% in-browser WebAssembly de-identification. Strip SSNs, patient charts, bank accounts, and secrets client-side. Re-hydrate real values locally when the AI answers.
        </p>

        {/* Compliance badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs text-slate-400">
          <button
            onClick={onOpenSecurityProof}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>HIPAA Safe Harbor (45 CFR § 164.514)</span>
          </button>
          <button
            onClick={onOpenSecurityProof}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>GDPR Art. 32 Pseudonymisation</span>
          </button>
          <button
            onClick={onOpenPricing}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 hover:border-sky-500/40 transition"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
            <span>0 Bytes Server Egress</span>
          </button>
        </div>

      </div>
    </div>
  );
};
