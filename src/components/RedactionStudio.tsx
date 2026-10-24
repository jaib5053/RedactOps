import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Sparkles,
  Copy,
  Check,
  Download,
  Trash2,
  Cpu,
  Layers,
  ArrowRight,
  FileCheck,
  Zap,
  Clock,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import { EntityRule, MaskingMode, MaskingResult } from '../types';
import { SAMPLE_DATASETS } from '../engine/sampleDatasets';
import { processMasking } from '../engine/maskingEngine';

interface RedactionStudioProps {
  rules: EntityRule[];
  mode: MaskingMode;
  onChangeMode: (mode: MaskingMode) => void;
  onOpenRules: () => void;
  onMaskingComplete: (result: MaskingResult) => void;
  onSwitchToVault: () => void;
  activePresetId?: string;
}

export const RedactionStudio: React.FC<RedactionStudioProps> = ({
  rules,
  mode,
  onChangeMode,
  onOpenRules,
  onMaskingComplete,
  onSwitchToVault,
  activePresetId
}) => {
  const [inputText, setInputText] = useState(SAMPLE_DATASETS[0].content);
  const [result, setResult] = useState<MaskingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedSample, setSelectedSample] = useState(SAMPLE_DATASETS[0].id);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

  // Trigger initial masking on mount or when sample changes
  useEffect(() => {
    handleRunMasking(inputText);
  }, [mode]);

  useEffect(() => {
    if (activePresetId) {
      handleSelectSample(activePresetId);
    }
  }, [activePresetId]);

  const handleRunMasking = async (textToProcess: string) => {
    if (!textToProcess.trim()) {
      setResult(null);
      return;
    }

    setIsProcessing(true);
    try {
      const res = await processMasking(textToProcess, rules, mode);
      setResult(res);
      onMaskingComplete(res);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectSample = (sampleId: string) => {
    setSelectedSample(sampleId);
    const sample = SAMPLE_DATASETS.find(s => s.id === sampleId);
    if (sample) {
      setInputText(sample.content);
      handleRunMasking(sample.content);
    }
  };

  const handleCopy = () => {
    if (!result?.sanitizedText) return;
    navigator.clipboard.writeText(result.sanitizedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!result?.sanitizedText) return;
    const blob = new Blob([result.sanitizedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `redactops_clean_prompt_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revoke Blob URL to prevent memory leaks
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const handleClear = () => {
    setInputText('');
    setResult(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Sample Selector Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-sky-400" />
            Quick Scenarios:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {SAMPLE_DATASETS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleSelectSample(sample.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                selectedSample === sample.id
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {sample.title.split(' ')[0]} ({sample.category.split(' ')[0]})
            </button>
          ))}
        </div>
      </div>

      {/* Mode Switcher & Processing Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/90 border border-slate-800">
        
        {/* Masking Mode Radios */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
            Mode:
          </span>

          {[
            { id: 'token', label: 'Tokenized [PERSON_1]', desc: 'Reversible & ideal for LLMs' },
            { id: 'redacted', label: 'Redacted [REDACTED]', desc: 'Permanent blackout' },
            { id: 'synthetic', label: 'Synthetic (Fake Data)', desc: 'Realistic placeholder' },
            { id: 'scramble', label: 'Scrambled (XXXX)', desc: 'Format preserving' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => onChangeMode(m.id as MaskingMode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                mode === m.id
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
              title={m.desc}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <button
            onClick={onOpenRules}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-950 hover:bg-slate-800 border border-slate-800 transition"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
            <span>Rules ({rules.filter(r => r.enabled).length})</span>
          </button>

          <button
            onClick={() => handleRunMasking(inputText)}
            disabled={!inputText.trim() || isProcessing}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 transition shadow-md shadow-sky-500/20 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isProcessing ? 'Scrubbing...' : 'Sanitize for AI'}</span>
          </button>
        </div>

      </div>

      {/* Dual Pane Studio: Raw Input vs Sanitized Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Pane: Raw Sensitive Input */}
        <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              1. Raw Sensitive Prompt / Document
            </span>
            <div className="flex items-center space-x-3 text-xs text-slate-500 font-mono">
              <span>{inputText.length} chars</span>
              <button
                onClick={handleClear}
                className="hover:text-rose-400 transition"
                title="Clear input"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              handleRunMasking(e.target.value);
            }}
            placeholder="Paste raw customer data, emails, clinical records, or contracts here..."
            className="flex-1 min-h-[380px] p-4 bg-transparent text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none resize-none leading-relaxed"
          />

          <div className="p-3 bg-slate-950 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between">
            <span>Client-side Web Worker Active</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> In-Memory Only
            </span>
          </div>
        </div>

        {/* Right Pane: Sanitized Safe Output */}
        <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5" />
                2. Sanitized Output (Safe for Public AI)
              </span>
              {result && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  {result.stats.totalEntitiesFound} PII scrubbed
                </span>
              )}
            </div>

            {/* Quick Copy / Download Buttons */}
            {result && (
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-xs font-medium text-white transition shadow-sm"
                  title="Copy safe prompt to paste into ChatGPT"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy for AI'}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Download .txt"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 min-h-[380px] p-4 bg-slate-950/60 font-mono text-xs leading-relaxed overflow-y-auto">
            {result ? (
              <pre className="whitespace-pre-wrap text-slate-200">{result.sanitizedText}</pre>
            ) : (
              <div className="h-full min-h-[340px] flex flex-col items-center justify-center text-slate-600 text-center px-6">
                <Cpu className="w-8 h-8 mb-2 opacity-40 text-sky-400" />
                <p className="text-sm font-medium text-slate-400">Waiting for Data Input</p>
                <p className="text-xs text-slate-500 mt-1">
                  Type or paste sensitive records on the left to see instant zero-knowledge redaction.
                </p>
              </div>
            )}
          </div>

          {/* Stats Bar */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
            <div className="flex items-center space-x-4">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                {result ? `${result.stats.processingTimeMs}ms` : '0ms'}
              </span>
              <span>
                SHA-256: <code className="text-slate-300">{result ? result.sha256Hash.substring(0, 10) + '...' : 'none'}</code>
              </span>
            </div>

            {mode === 'token' && result && result.stats.totalEntitiesFound > 0 && (
              <button
                onClick={onSwitchToVault}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold"
              >
                <span>Rehydration Vault Ready</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Scrubbed Entity Breakdown Chips */}
      {result && result.entities.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              Detected & Neutralized Entities ({result.entities.length})
            </span>
            <span className="text-xs text-slate-500">
              Zero values transmitted outside memory
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {result.entities.map((ent) => (
              <div
                key={ent.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-950 border border-slate-800"
              >
                <span className="text-slate-400">{ent.type}:</span>
                <span className="text-rose-400 line-through opacity-75">{ent.rawText}</span>
                <span className="text-slate-600">&rarr;</span>
                <span className="text-emerald-400 font-semibold">{ent.maskedText}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
