import React, { useState } from 'react';
import {
  BookOpen,
  ReceiptText,
  ShieldCheck,
  Layers
} from 'lucide-react';
import { TradeJournalDashboard } from '../../components/trading/TradeJournalDashboard';
import { CapitalGainsTaxAuditor } from '../../components/trading/CapitalGainsTaxAuditor';
import { VerifiedPnlPortal } from '../../components/trading/VerifiedPnlPortal';

type ReportTab = 'journal' | 'tax_auditor' | 'verified_pnl' | 'all';

export const ReportsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('verified_pnl');

  return (
    <div className="space-y-8">
      {/* Reports Sub-Navigation Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2.5 text-[var(--text-primary)]">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
            Institutional Audit, Tax & Cryptographic Performance Reports
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Behavioral Trade Journal, Budget 2024–2026 Capital Gains Tax Auditor, and SEBI / NSDL Verified Cryptographic P&L
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-[var(--bg-tertiary)] p-1 rounded-2xl border border-[var(--border-color)]">
          <button
            type="button"
            onClick={() => setActiveTab('verified_pnl')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'verified_pnl'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified P&L (SHA-256)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('journal')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'journal'
                ? 'bg-[var(--icici-orange)] text-white shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Trade Journal & Heatmap</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tax_auditor')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tax_auditor'
                ? 'bg-[var(--icici-orange)] text-white shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <ReceiptText className="w-3.5 h-3.5" />
            <span>Tax Auditor (Budget 24-26)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-[var(--icici-orange)] text-white shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Consolidated Stack</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'verified_pnl' && (
        <VerifiedPnlPortal />
      )}

      {activeTab === 'journal' && (
        <TradeJournalDashboard />
      )}

      {activeTab === 'tax_auditor' && (
        <CapitalGainsTaxAuditor />
      )}

      {activeTab === 'all' && (
        <div className="space-y-12">
          {/* SECTION A: Cryptographic Verified P&L Portal */}
          <VerifiedPnlPortal />

          {/* SECTION B: Institutional Trade Journal & Behavioral P&L Analytics */}
          <TradeJournalDashboard />

          {/* SECTION C: Budget 2024–2026 Capital Gains Tax Auditor & ITR Schedule CG Simulator */}
          <CapitalGainsTaxAuditor />
        </div>
      )}
    </div>
  );
};

export default ReportsView;
