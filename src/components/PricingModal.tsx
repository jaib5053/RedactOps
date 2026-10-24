import React, { useState } from 'react';
import { X, Check, Sparkles, Shield, Zap, Building2, CheckCircle2 } from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [checkoutTier, setCheckoutTier] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSimulateCheckout = (tierName: string) => {
    setCheckoutTier(tierName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              Upgrade Your Compliance & Workflow Speed
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Never risk client PII or HIPAA data in AI tools. Zero-knowledge guarantee.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Billing Switch */}
        <div className="flex items-center justify-center my-6 flex-shrink-0">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center space-x-1">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                billingPeriod === 'monthly'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                billingPeriod === 'yearly'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                Save 25%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-4 pb-4">
          
          {/* Free Tier */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Community</span>
              <div className="mt-3 flex items-baseline">
                <span className="text-3xl font-extrabold text-white font-mono">$0</span>
                <span className="text-xs text-slate-500 ml-1">/ forever</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                For individuals scrubbing quick snippets before pasting into LLMs.
              </p>

              <div className="mt-6 space-y-2.5">
                {[
                  '100% In-Browser Zero-Knowledge',
                  'Standard 12 PII & HIPAA detectors',
                  'Text & Prompt Sanitizer',
                  'Max 1MB per batch',
                  'Client-side Session Only'
                ].map((feat, i) => (
                  <div key={i} className="flex items-center text-xs text-slate-300">
                    <Check className="w-3.5 h-3.5 text-slate-500 mr-2 flex-shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={onClose}
              className="mt-6 w-full py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 transition"
            >
              Current Active Plan
            </button>
          </div>

          {/* Pro Tier (Highlighted) */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-sky-950/40 to-slate-950 border-2 border-sky-500 relative flex flex-col justify-between shadow-xl shadow-sky-500/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-sky-500 text-white rounded-full text-[10px] font-bold uppercase tracking-wider shadow">
              Most Popular
            </div>

            <div>
              <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> Pro Specialist
              </span>
              <div className="mt-3 flex items-baseline">
                <span className="text-3xl font-extrabold text-white font-mono">
                  {billingPeriod === 'monthly' ? '$29' : '$22'}
                </span>
                <span className="text-xs text-slate-400 ml-1">/ seat / month</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                For paralegals, consultants, and engineers handling sensitive client files.
              </p>

              <div className="mt-6 space-y-2.5">
                {[
                  'Everything in Community, plus:',
                  'Reversible Masking Vault (1-Click De-Mask)',
                  'Unlimited CSV & Structured Bulk exports',
                  'Custom Regex & Internal Project Rules',
                  'Chrome Extension for ChatGPT & Claude',
                  'Cryptographic Audit PDF/JSON Certs',
                  'PDF & DOCX parsing engine'
                ].map((feat, i) => (
                  <div key={i} className="flex items-center text-xs text-slate-200">
                    <Check className="w-3.5 h-3.5 text-sky-400 mr-2 flex-shrink-0" />
                    <span className={i === 0 ? 'text-slate-400' : 'font-medium'}>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleSimulateCheckout('Pro Specialist ($29/mo)')}
              className="mt-6 w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-lg shadow-sky-500/25 transition"
            >
              Start 14-Day Free Pro Trial
            </button>
          </div>

          {/* Team / Business Tier */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> Team & Clinic
              </span>
              <div className="mt-3 flex items-baseline">
                <span className="text-3xl font-extrabold text-white font-mono">
                  {billingPeriod === 'monthly' ? '$149' : '$119'}
                </span>
                <span className="text-xs text-slate-400 ml-1">/ month (5 seats)</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                For legal practices, clinics, and fintech ops needing unified team policies.
              </p>

              <div className="mt-6 space-y-2.5">
                {[
                  'Includes 5 Full Pro Seats (+$25/extra)',
                  'Centralized Team Rulepack Synchronization',
                  'SOC 2 & HIPAA Self-Attestation Pack',
                  'Consolidated Monthly Audit Digest',
                  'Priority 24/7 Slack & Email Support',
                  'Dedicated Invoicing / PO Billing'
                ].map((feat, i) => (
                  <div key={i} className="flex items-center text-xs text-slate-300">
                    <Check className="w-3.5 h-3.5 text-purple-400 mr-2 flex-shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleSimulateCheckout('Team & Clinic ($149/mo)')}
              className="mt-6 w-full py-2 rounded-xl text-xs font-semibold text-purple-300 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/60 transition"
            >
              Get Team License
            </button>
          </div>

        </div>

        {/* Enterprise Inquiries Callout */}
        <div className="pt-3 pb-1 border-t border-slate-800 text-center text-xs text-slate-400">
          Need custom volume seats, PO invoicing, or a signed HIPAA Business Associate Agreement (BAA)? Contact us at{' '}
          <a
            href="mailto:thinklabs76@gmail.com"
            className="text-sky-400 hover:text-sky-300 font-semibold underline underline-offset-2 transition"
          >
            thinklabs76@gmail.com
          </a>
        </div>

        {/* Simulated Checkout Confirmation Modal / Alert */}
        {checkoutTier && (
          <div className="mt-4 p-4 rounded-xl bg-sky-950/80 border border-sky-800 text-sky-200 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <strong>Checkout Simulation Ready:</strong> You selected <strong>{checkoutTier}</strong>. 
                In production, this routes via Stripe Customer Portal with 0-setup instant activation.
              </div>
            </div>
            <button
              onClick={() => setCheckoutTier(null)}
              className="px-3 py-1 bg-sky-800 hover:bg-sky-700 text-white rounded font-medium ml-4 transition"
            >
              Dismiss
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
