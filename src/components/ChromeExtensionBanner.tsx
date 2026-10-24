import React, { useState } from 'react';
import { Globe, ArrowRight, X, Sparkles, Download, CheckCircle2, ExternalLink, ShieldCheck } from 'lucide-react';

export const ChromeExtensionBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const handleDownloadAndOpenGuide = () => {
    // Trigger download of the extension zip
    const link = document.createElement('a');
    link.href = '/redactops-extension.zip';
    link.download = 'redactops-extension.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Open guide modal
    setShowModal(true);
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="relative overflow-hidden rounded-xl border border-sky-500/30 bg-gradient-to-r from-sky-950/40 via-slate-900 to-indigo-950/40 p-4 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-sky-500/20 border border-sky-500/30 text-sky-400 flex-shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-white tracking-wide uppercase">
                  Browser Extension Companion
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
                  100% Free / Open Source
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Scrub sensitive prompts in real-time directly inside <strong className="text-white">ChatGPT, Claude, & Gemini</strong> without switching tabs.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleDownloadAndOpenGuide}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Extension (.zip)</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 rounded text-slate-400 hover:text-white transition"
              title="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* 10-Second Setup Guide Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Install RedactOps in 10 Seconds</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Works on Chrome, Brave, Edge, Arc & Opera</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300">
              
              <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-mono font-bold text-[11px] flex-shrink-0 mt-0.5">
                  1
                </span>
                <div className="space-y-1">
                  <p className="font-semibold text-white">Unzip the downloaded file</p>
                  <p className="text-slate-400 text-[11px]">
                    Locate <code className="px-1 py-0.5 rounded bg-slate-900 text-sky-300 font-mono">redactops-extension.zip</code> in your Downloads folder and extract it.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-mono font-bold text-[11px] flex-shrink-0 mt-0.5">
                  2
                </span>
                <div className="space-y-1">
                  <p className="font-semibold text-white">Open Extensions Manager & Enable Developer Mode</p>
                  <p className="text-slate-400 text-[11px]">
                    Navigate to <code className="px-1 py-0.5 rounded bg-slate-900 text-sky-300 font-mono">chrome://extensions</code> (or <code className="px-1 py-0.5 rounded bg-slate-900 text-sky-300 font-mono">edge://extensions</code>) and toggle <strong className="text-white">Developer mode</strong> in the top-right corner.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-mono font-bold text-[11px] flex-shrink-0 mt-0.5">
                  3
                </span>
                <div className="space-y-1">
                  <p className="font-semibold text-white">Click "Load unpacked"</p>
                  <p className="text-slate-400 text-[11px]">
                    Click the <strong className="text-white">Load unpacked</strong> button and select the extracted folder.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong className="text-white">All Set!</strong> Visit ChatGPT, Claude, or Gemini. The RedactOps shield badge will appear directly in the message box to sanitize prompts with 1 click.
                </p>
              </div>

            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                onClick={handleDownloadAndOpenGuide}
                className="flex items-center space-x-1.5 text-xs text-sky-400 hover:text-sky-300 font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Re-download Zip</span>
              </button>

              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition"
              >
                Got It
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
