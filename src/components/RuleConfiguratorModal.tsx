import React, { useState } from 'react';
import { X, Sliders, Plus, Trash2, CheckCircle2, Shield, AlertTriangle } from 'lucide-react';
import { EntityRule } from '../types';

interface RuleConfiguratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: EntityRule[];
  onToggleRule: (ruleId: string) => void;
  onAddCustomRule: (rule: EntityRule) => void;
  onDeleteCustomRule: (ruleId: string) => void;
}

export const RuleConfiguratorModal: React.FC<RuleConfiguratorModalProps> = ({
  isOpen,
  onClose,
  rules,
  onToggleRule,
  onAddCustomRule,
  onDeleteCustomRule
}) => {
  const [customName, setCustomName] = useState('');
  const [customPrefix, setCustomPrefix] = useState('');
  const [customRegexStr, setCustomRegexStr] = useState('');
  const [regexError, setRegexError] = useState('');
  const [redosWarning, setRedosWarning] = useState('');
  const [testString, setTestString] = useState('Confidential Project Apollo with ID PROJ-9921');
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const validateReDoS = (pattern: string): string | null => {
    // Detect nested quantifiers (e.g. (a+)+, (.*)*, ([a-z]+)+) that cause exponential backtracking
    if (/\([^)]*[*+]\)[*+]/.test(pattern) || /\([^)]*\{\d+,?\d*\}\)[*+]/.test(pattern)) {
      return 'Potential ReDoS hazard: Nested repetition (e.g., (a+)+) can trigger catastrophic backtracking. Please use bounded or atomic groups.';
    }
    // Detect multiple unconstrained wildcards
    if (/\.\*.*\.\*/.test(pattern) || /\.\+.*\.\+/.test(pattern)) {
      return 'Potential ReDoS hazard: Multiple overlapping wildcards detected.';
    }
    return null;
  };

  const handleTestRegex = () => {
    setRegexError('');
    setRedosWarning('');
    try {
      const redos = validateReDoS(customRegexStr);
      if (redos) {
        setRedosWarning(redos);
      }
      const re = new RegExp(customRegexStr, 'g');
      const start = performance.now();
      const matches = testString.match(re);
      const elapsed = performance.now() - start;
      if (elapsed > 100) {
        setRedosWarning(`Execution warning: Evaluation took ${elapsed.toFixed(1)}ms. Optimize pattern to avoid UI thread lag.`);
      }
      if (matches) {
        setTestResult(`Matched ${matches.length} instance(s): ${matches.join(', ')}`);
      } else {
        setTestResult('No matches found in test string.');
      }
    } catch (err: any) {
      setRegexError(err.message || 'Invalid Regular Expression syntax');
      setTestResult(null);
    }
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    setRegexError('');
    setRedosWarning('');

    if (!customName.trim() || !customPrefix.trim() || !customRegexStr.trim()) {
      setRegexError('All fields are required.');
      return;
    }

    const redos = validateReDoS(customRegexStr);
    if (redos) {
      setRegexError(redos);
      return;
    }

    try {
      const compiledRegex = new RegExp(customRegexStr, 'g');
      const newRule: EntityRule = {
        id: `custom_${Date.now()}`,
        name: customName.trim(),
        description: 'User-defined proprietary pattern',
        category: 'custom',
        regex: compiledRegex,
        tokenPrefix: customPrefix.trim().toUpperCase(),
        example: testString,
        enabled: true,
        isCustom: true,
        color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      };

      onAddCustomRule(newRule);
      setCustomName('');
      setCustomPrefix('');
      setCustomRegexStr('');
      setTestResult(null);
    } catch (err: any) {
      setRegexError(err.message || 'Invalid regular expression');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Detection & Redaction Rules</h3>
              <p className="text-xs text-slate-400">Toggle built-in compliance detectors or configure proprietary regex patterns</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6">
          
          {/* Built-in rules grid */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Standard Compliance Rulepacks ({rules.filter(r => r.enabled).length} of {rules.length} Active)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  onClick={() => onToggleRule(rule.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-start justify-between ${
                    rule.enabled
                      ? 'bg-slate-800/80 border-sky-500/40 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-500 opacity-60'
                  }`}
                >
                  <div className="pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-200">{rule.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-sky-400 border border-slate-700">
                        [{rule.tokenPrefix}]
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{rule.description}</p>
                    <p className="text-[10px] font-mono text-slate-500 mt-1 truncate">eg: {rule.example}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    {rule.isCustom && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCustomRule(rule.id);
                        }}
                        className="p-1 rounded text-rose-400 hover:bg-rose-500/20 transition"
                        title="Delete custom rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => {}}
                      className="rounded border-slate-700 text-sky-500 focus:ring-sky-500 h-4 w-4 pointer-events-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Custom Proprietary Pattern */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <h4 className="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              Add Custom Team / Proprietary Pattern
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              Scrub internal codenames (e.g. Project Apollo), employee badge IDs, or proprietary customer serial numbers.
            </p>

            <form onSubmit={handleAddRule} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Rule Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Project Codename"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Token Prefix</label>
                  <input
                    type="text"
                    placeholder="e.g., PROJECT_CODE"
                    value={customPrefix}
                    onChange={(e) => setCustomPrefix(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 uppercase font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Regular Expression (RegEx)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g., \\bProject\\s+(?:Apollo|Titan|Zeus)\\b"
                    value={customRegexStr}
                    onChange={(e) => setCustomRegexStr(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={handleTestRegex}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-lg transition"
                  >
                    Test Regex
                  </button>
                </div>
              </div>

              {/* Test Sandbox */}
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <label className="text-[10px] text-slate-500 block mb-1">Test Sandbox Input:</label>
                <input
                  type="text"
                  value={testString}
                  onChange={(e) => setTestString(e.target.value)}
                  className="w-full bg-transparent text-xs font-mono text-slate-300 focus:outline-none"
                />
                {testResult && (
                  <div className="mt-2 text-xs text-emerald-400 font-mono">
                    &rarr; {testResult}
                  </div>
                )}
                {redosWarning && (
                  <div className="mt-2 text-xs text-amber-400 font-mono flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {redosWarning}
                  </div>
                )}
                {regexError && (
                  <div className="mt-2 text-xs text-rose-400 font-mono flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {regexError}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white rounded-lg transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Save Custom Rule
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-between items-center flex-shrink-0">
          <span className="text-xs text-slate-500">All rules compile directly into local browser regex pipelines</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition"
          >
            Apply & Close
          </button>
        </div>

      </div>
    </div>
  );
};
