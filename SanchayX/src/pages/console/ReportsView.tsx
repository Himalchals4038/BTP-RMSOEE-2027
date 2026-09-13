import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { TradeJournalDashboard } from '../../components/trading/TradeJournalDashboard';

export const ReportsView: React.FC = () => {
  const { exportReportCSV, exportReportPDF } = usePortfolio();

  return (
    <div className="space-y-8">
      {/* SECTION A: Institutional Trade Journal & Behavioral P&L Analytics */}
      <TradeJournalDashboard />

      {/* SECTION B: Tax P&L Statement & SEBI Statutory Audit */}
      <div className="p-6 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
          <div>
            <h4 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-500" />
              FY 2025-26 Indian Capital Gains Tax Statement
            </h4>
            <p className="text-xs text-[var(--text-secondary)]">
              Union Budget 2024 revised slabs: STCG taxed at flat 20%, LTCG taxed at 12.5% beyond ₹1.25 Lakh exemption limit
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportReportCSV}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/30 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={exportReportPDF}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600/15 hover:bg-rose-600/25 text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-500/30 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Tax PDF</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <span className="text-[var(--text-muted)] block text-[10px] font-bold uppercase">Short Term Capital Gains (STCG @ 20%)</span>
            <span className="font-mono font-extrabold text-lg text-emerald-600 dark:text-emerald-400">+₹1,45,200.00</span>
            <span className="text-[10px] text-[var(--text-muted)] block mt-1">Applicable Tax: ₹29,040.00</span>
          </div>
          <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <span className="text-[var(--text-muted)] block text-[10px] font-bold uppercase">Long Term Capital Gains (LTCG @ 12.5%)</span>
            <span className="font-mono font-extrabold text-lg text-emerald-600 dark:text-emerald-400">+₹4,85,000.00</span>
            <span className="text-[10px] text-[var(--text-muted)] block mt-1">Exemption: ₹1,25,000 | Tax: ₹45,000.00</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ReportsView;
