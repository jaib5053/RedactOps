import React, { useState } from 'react';
import { RefreshCw, Key, Check, Copy, ArrowRight, ShieldAlert, Sparkles, FileText, Eye, EyeOff, Trash2 } from 'lucide-react';
import { rehydrateResponse } from '../engine/maskingEngine';

interface RehydrationVaultProps {
  tokenMap: Record<string, string>;
  vaultKey: string;
  onPurgeVault?: () => void;
}

export const RehydrationVault: React.FC<RehydrationVaultProps> = ({
  tokenMap,
  vaultKey,
  onPurgeVault
}) => {
  const [llmOutput, setLlmOutput] = useState('');
  const [restoredResult, setRestoredResult] = useState<{
    text: string;
    restoredCount: number;
    tokens: string[];
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPlaintextValues, setShowPlaintextValues] = useState(false);

  const activeTokensCount = Object.keys(tokenMap).length;

  const handleRehydrate = () => {
    if (!llmOutput.trim()) return;
    const res = rehydrateResponse(llmOutput, tokenMap);
    setRestoredResult({
      text: res.restoredText,
      restoredCount: res.restoredCount,
      tokens: res.matchedTokens
    });
  };

  const handleCopy = () => {
    if (!restoredResult?.text) return;
    navigator.clipboard.writeText(restoredResult.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePurge = () => {
    setRestoredResult(null);
    setLlmOutput('');
    if (onPurgeVault) {
      onPurgeVault();
    }
  };

  const handleLoadSampleLlmResponse = () => {
    // Generate sample based on available tokens
    const sample = `AI CLINICAL ASSESSMENT & ACTION PLAN
Patient Identity: [PERSON_1]
Contact Protocol: Please notify the patient at [EMAIL_1] or direct phone [PHONE_1].
Medication Verification: The prescription was validated for [PERSON_1]. Ensure hospital MRN [MRN_1] is linked in the internal pharmacy ledger.

Next Step: Schedule clinic follow-up in 14 days and coordinate with attending physician [PERSON_2].`;
    setLlmOutput(sample);
  };

  return (
    <div className="space-y-6">
      
      {/* Vault Status Header */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              Client-Side Reversible De-Masking Vault
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                Active Key: {vaultKey ? vaultKey.substring(0, 16) + '...' : 'Ephemeral Session'}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {activeTokensCount > 0 
                ? `${activeTokensCount} reversible token mappings active in browser memory.`
                : 'No tokens generated yet. First sanitize a document in the Studio to populate the vault.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {activeTokensCount > 0 && onPurgeVault && (
            <button
              onClick={handlePurge}
              className="text-xs font-medium text-rose-300 hover:text-rose-200 bg-rose-950/40 hover:bg-rose-900/40 px-3 py-1.5 rounded-lg border border-rose-800/40 transition flex items-center gap-1.5"
              title="Securely zeroize and erase all in-memory token mappings"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Zeroize Memory</span>
            </button>
          )}

          <button
            onClick={handleLoadSampleLlmResponse}
            className="text-xs font-medium text-purple-300 hover:text-purple-200 bg-purple-950/50 hover:bg-purple-900/50 px-3 py-1.5 rounded-lg border border-purple-800/40 transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Load AI Response Demo</span>
          </button>
        </div>
      </div>

      {/* Workflow Explanation Banner */}
      <div className="p-3.5 rounded-lg bg-slate-900/40 border border-slate-800 text-xs text-slate-300 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-slate-800 font-mono text-slate-300">Workflow</span>
          <span>1. Redact prompt in Studio &rarr; 2. Feed to ChatGPT/Claude &rarr; 3. Paste AI answer here &rarr; 4. Re-hydrate real client PII locally!</span>
        </div>
      </div>

      {/* Dual Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Input LLM Response */}
        <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              1. Paste AI Model Output (With Tokens)
            </span>
            <span className="text-xs font-mono text-slate-500">
              {llmOutput.length} chars
            </span>
          </div>

          <textarea
            value={llmOutput}
            onChange={(e) => setLlmOutput(e.target.value)}
            placeholder="Paste the response returned by ChatGPT, Claude, or your LLM containing tokens like [PERSON_1], [EMAIL_1], [CARD_1]..."
            className="flex-1 min-h-[320px] p-4 bg-transparent text-sm font-mono text-slate-200 placeholder-slate-600 focus:outline-none resize-none leading-relaxed"
          />

          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {activeTokensCount === 0 && (
                <span className="text-amber-400 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> First sanitize text in Studio
                </span>
              )}
            </span>
            <button
              onClick={handleRehydrate}
              disabled={!llmOutput.trim() || activeTokensCount === 0}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1.5 shadow-md shadow-purple-500/20"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>De-Mask & Restore Real Values</span>
            </button>
          </div>
        </div>

        {/* Right: Restored Output */}
        <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                2. De-Masked Output (Original PII Restored)
              </span>
              {restoredResult && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  {restoredResult.restoredCount} replacements restored
                </span>
              )}
            </div>

            {restoredResult && (
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Result'}</span>
              </button>
            )}
          </div>

          <div className="flex-1 min-h-[320px] p-4 bg-slate-950/50 font-mono text-sm leading-relaxed overflow-y-auto">
            {restoredResult ? (
              <pre className="whitespace-pre-wrap text-slate-200">{restoredResult.text}</pre>
            ) : (
              <div className="h-full min-h-[280px] flex flex-col items-center justify-center text-slate-600 text-center px-6">
                <RefreshCw className="w-8 h-8 mb-2 opacity-40 text-purple-400" />
                <p className="text-sm font-medium text-slate-400">Ready to Re-Hydrate</p>
                <p className="text-xs text-slate-500 mt-1">
                  Once you paste your AI response and click De-Mask, your real client names and confidential records will be re-inserted locally.
                </p>
              </div>
            )}
          </div>

          {/* Active Token Mapping Pill Drawer */}
          <div className="p-3 bg-slate-950 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Active In-Memory Cryptographic Lookup Table:
              </span>
              {Object.keys(tokenMap).length > 0 && (
                <button
                  onClick={() => setShowPlaintextValues(!showPlaintextValues)}
                  className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 transition"
                  title="Toggle visibility of original plaintext in lookup table to prevent shoulder-surfing"
                >
                  {showPlaintextValues ? <EyeOff className="w-3 h-3 text-sky-400" /> : <Eye className="w-3 h-3 text-slate-400" />}
                  <span>{showPlaintextValues ? 'Conceal Values' : 'Reveal Values'}</span>
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {Object.entries(tokenMap).length > 0 ? (
                Object.entries(tokenMap).map(([token, orig]) => (
                  <span
                    key={token}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700"
                    title={showPlaintextValues ? `Maps ${token} -> ${orig}` : `Maps ${token} -> (Concealed)`}
                  >
                    <span className="text-purple-400 font-semibold">{token}</span>
                    <ArrowRight className="w-2.5 h-2.5 text-slate-500" />
                    <span className="text-slate-400 truncate max-w-[120px]">
                      {showPlaintextValues ? orig : '••••••••'}
                    </span>
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-600 italic">No tokens mapped in this session.</span>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
