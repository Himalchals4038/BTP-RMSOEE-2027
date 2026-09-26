import React, { useState } from 'react';
import {
  BookOpen,
  ReceiptText,
  ShieldCheck,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { TradeJournalDashboard } from '../../components/trading/TradeJournalDashboard';
import { CapitalGainsTaxAuditor } from '../../components/trading/CapitalGainsTaxAuditor';
import { VerifiedPnlPortal } from '../../components/trading/VerifiedPnlPortal';
import { PitchDeckReportViewer } from '../../components/trading/PitchDeckReportViewer';

type ReportTab = 'pitch_deck' | 'tax_auditor' | 'verified_pnl' | 'journal' | 'all';

export const ReportsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('pitch_deck');

  return (
    <div className="space-y-8">
      {/* Reports Sub-Navigation Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2.5 text-[var(--text-primary)]">
            <FileSpreadsheet className="w-6 h-6 text-[var(--icici-orange)]" />
            Pitch-Deck Wealth Reports, Tax Mastery & Audit Statements
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Boardroom Pitch-Deck Reports with Newton-Raphson XIRR, Budget 2024–2026 Tax Auditor (8 Legal Loopholes), and Cryptographic Verified P&L
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-[var(--bg-tertiary)] p-1 rounded-2xl border border-[var(--border-color)]">
          <button
            type="button"
            onClick={() => setActiveTab('pitch_deck')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pitch_deck'
                ? 'bg-[var(--icici-orange)] text-white shadow-md shadow-[var(--icici-orange)]/20'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Pitch-Deck (XIRR)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tax_auditor')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tax_auditor'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <ReceiptText className="w-3.5 h-3.5" />
            <span>Tax Auditor (8 Loopholes)</span>
          </button>

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
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('journal')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'journal'
                ? 'bg-slate-700 text-white shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Trade Journal</span>
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
      {activeTab === 'pitch_deck' && (
        <PitchDeckReportViewer />
      )}

      {activeTab === 'tax_auditor' && (
        <CapitalGainsTaxAuditor />
      )}

      {activeTab === 'verified_pnl' && (
        <VerifiedPnlPortal />
      )}

      {activeTab === 'journal' && (
        <TradeJournalDashboard />
      )}

      {activeTab === 'all' && (
        <div className="space-y-12">
          {/* SECTION A: Boardroom Pitch-Deck Wealth Reports with Newton-Raphson XIRR */}
          <PitchDeckReportViewer />

          {/* SECTION B: Budget 2024–2026 Capital Gains Tax Auditor & 8 Master Loopholes */}
          <CapitalGainsTaxAuditor />

          {/* SECTION C: Cryptographic Verified P&L Portal */}
          <VerifiedPnlPortal />

          {/* SECTION D: Institutional Trade Journal & Behavioral P&L Analytics */}
          <TradeJournalDashboard />
        </div>
      )}
    </div>
  );
};

export default ReportsView;

