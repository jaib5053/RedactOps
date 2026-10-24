import React, { useState } from 'react';
import { Globe, ArrowRight, X, Sparkles } from 'lucide-react';

export const ChromeExtensionBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-sky-500/30 bg-gradient-to-r from-sky-950/40 via-slate-900 to-indigo-950/40 p-4 shadow-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-sky-500/20 border border-sky-500/30 text-sky-400 flex-shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-white tracking-wide uppercase">
                Chrome Extension Companion
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
                Free
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Scrub sensitive prompts in real-time directly inside <strong className="text-white">ChatGPT, Claude, & Gemini</strong> without switching tabs.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => alert('Chrome Extension is ready for Web Store publication. The manifest.json and content script are packaged in the repository.')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Install Extension</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 rounded text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
