import { useState } from 'react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { RedactionStudio } from './components/RedactionStudio';
import { RehydrationVault } from './components/RehydrationVault';
import { BatchCsvCleaner } from './components/BatchCsvCleaner';
import { RuleConfiguratorModal } from './components/RuleConfiguratorModal';
import { AuditCertificateModal } from './components/AuditCertificateModal';
import { PricingModal } from './components/PricingModal';
import { NetworkMonitorModal } from './components/NetworkMonitorModal';
import { ChromeExtensionBanner } from './components/ChromeExtensionBanner';
import { BlogHub } from './components/BlogHub';

import { DEFAULT_RULES } from './engine/regexRules';
import { EntityRule, MaskingMode, MaskingResult, AuditCertificate } from './types';
import { createAuditCertificate } from './engine/maskingEngine';

import {
  FileText,
  Key,
  FileSpreadsheet,
  Sliders,
  ShieldCheck,
  Code2,
  Mail,
  BookOpen
} from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'studio' | 'vault' | 'csv' | 'guides'>('studio');
  const [selectedPreset, setSelectedPreset] = useState<'healthcare' | 'financial' | 'legal' | 'technical' | undefined>(undefined);
  const [rules, setRules] = useState<EntityRule[]>(DEFAULT_RULES);
  const [mode, setMode] = useState<MaskingMode>('token');
  const [tokenMap, setTokenMap] = useState<Record<string, string>>({});
  const [vaultKey, setVaultKey] = useState<string>('');
  const [auditCert, setAuditCert] = useState<AuditCertificate | null>(null);

  // Modals state
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isSecurityProofOpen, setIsSecurityProofOpen] = useState(false);

  // Cumulative session stats
  const [totalBytesProcessed, setTotalBytesProcessed] = useState(24500);
  const [totalEntitiesNeutralized, setTotalEntitiesNeutralized] = useState(14);

  const handleMaskingComplete = async (res: MaskingResult) => {
    setTokenMap(prev => ({ ...prev, ...res.tokenMap }));
    setVaultKey(res.vaultKey);
    setTotalBytesProcessed(prev => prev + res.stats.originalByteSize);
    setTotalEntitiesNeutralized(prev => prev + res.stats.totalEntitiesFound);

    const cert = await createAuditCertificate(res);
    setAuditCert(cert);
  };

  const handleToggleRule = (ruleId: string) => {
    setRules(prev =>
      prev.map(r => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleAddCustomRule = (newRule: EntityRule) => {
    setRules(prev => [newRule, ...prev]);
  };

  const handleDeleteCustomRule = (ruleId: string) => {
    setRules(prev => prev.filter(r => r.id !== ruleId));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white">
      
      {/* Top Navigation */}
      <Header
        onOpenAudit={() => setIsAuditModalOpen(true)}
        onOpenPricing={() => setIsPricingModalOpen(true)}
        onOpenSecurityMonitor={() => setIsSecurityProofOpen(true)}
        onOpenGuides={() => setActiveTab('guides')}
        processedCount={totalEntitiesNeutralized}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Hero Section */}
        <HeroSection
          onOpenPricing={() => setIsPricingModalOpen(true)}
          onOpenSecurityProof={() => setIsSecurityProofOpen(true)}
        />

        {/* Chrome Extension Companion Banner */}
        <ChromeExtensionBanner />

        {/* Workspace Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-1 sm:space-x-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
            
            <button
              onClick={() => setActiveTab('studio')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'studio'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Prompt & Text Sanitizer</span>
            </button>

            <button
              onClick={() => setActiveTab('vault')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition relative ${
                activeTab === 'vault'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>Reversible De-Masking Vault</span>
              {Object.keys(tokenMap).length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-purple-400/20 text-purple-300 font-mono">
                  {Object.keys(tokenMap).length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('csv')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'csv'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Batch CSV Cleaner</span>
            </button>

            <button
              onClick={() => setActiveTab('guides')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'guides'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Guides & Blog</span>
            </button>

          </div>

          {/* Quick Trigger for Rule Configurator */}
          <button
            onClick={() => setIsRulesModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
          >
            <Sliders className="w-3.5 h-3.5 text-sky-400" />
            <span>Configure Rules ({rules.filter(r => r.enabled).length}/{rules.length})</span>
          </button>
        </div>

        {/* Tab Content Display */}
        {activeTab === 'studio' && (
          <RedactionStudio
            rules={rules}
            mode={mode}
            onChangeMode={setMode}
            onOpenRules={() => setIsRulesModalOpen(true)}
            onMaskingComplete={handleMaskingComplete}
            onSwitchToVault={() => setActiveTab('vault')}
            activePresetId={selectedPreset}
          />
        )}

        {activeTab === 'vault' && (
          <RehydrationVault
            tokenMap={tokenMap}
            vaultKey={vaultKey}
            onPurgeVault={() => {
              setTokenMap({});
              setVaultKey('');
            }}
          />
        )}

        {activeTab === 'csv' && (
          <BatchCsvCleaner
            rules={rules}
            mode={mode}
            onUpdateStats={(bytes, count) => {
              setTotalBytesProcessed(prev => prev + bytes);
              setTotalEntitiesNeutralized(prev => prev + count);
            }}
          />
        )}

        {activeTab === 'guides' && (
          <BlogHub
            onSelectPresetAndLaunch={(presetId) => {
              setSelectedPreset(presetId);
              setActiveTab('studio');
            }}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 mt-12 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span className="font-semibold text-slate-300">RedactOps</span>
            <span>&bull;</span>
            <span>Zero-Knowledge Architecture</span>
            <span>&bull;</span>
            <span className="font-mono text-emerald-400">0 Bytes Egress</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href="mailto:thinklabs76@gmail.com"
              className="hover:text-sky-400 text-slate-400 transition flex items-center gap-1.5"
              title="Contact ThinkLabs Support & Licensing"
            >
              <Mail className="w-3.5 h-3.5 text-sky-400" />
              <span>thinklabs76@gmail.com</span>
            </a>
            <button
              onClick={() => setIsSecurityProofOpen(true)}
              className="hover:text-slate-300 transition"
            >
              Security Telemetry
            </button>
            <button
              onClick={() => setIsPricingModalOpen(true)}
              className="hover:text-slate-300 transition"
            >
              Enterprise Licensing
            </button>
            <a
              href="https://github.com/jaib5053/RedactOps"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-300 transition flex items-center gap-1"
            >
              <Code2 className="w-3.5 h-3.5 text-sky-400" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <RuleConfiguratorModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        rules={rules}
        onToggleRule={handleToggleRule}
        onAddCustomRule={handleAddCustomRule}
        onDeleteCustomRule={handleDeleteCustomRule}
      />

      <AuditCertificateModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        certificate={auditCert}
      />

      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
      />

      <NetworkMonitorModal
        isOpen={isSecurityProofOpen}
        onClose={() => setIsSecurityProofOpen(false)}
        processedBytes={totalBytesProcessed}
      />

    </div>
  );
}

export default App;
