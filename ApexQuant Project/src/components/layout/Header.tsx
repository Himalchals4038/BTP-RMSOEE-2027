import React from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCompactCurrency, CURRENCY_MAP } from '../../utils/financialMath';
import type { CurrencyCode } from '../../utils/financialMath';
import {
  TrendingUp,
  Radio,
  Download,
  FileSpreadsheet,
  Globe,
  Coins
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    kri,
    benchmark,
    setBenchmark,
    currency,
    setCurrency,
    isLiveApi,
    toggleApiMode,
    exportReportPDF,
    exportReportCSV
  } = usePortfolio();

  const currentCurrencySymbol = CURRENCY_MAP[currency]?.symbol || '$';

  return (
    <header className="glass-header sticky top-0 z-40 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-emerald-400 p-0.5 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-50 tracking-tight flex items-center gap-2">
            ApexQuant
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              PRO QUANT OS
            </span>
          </h1>
          <p className="text-xs text-slate-400">Multi-Asset Portfolio Engineering & Risk Intelligence</p>
        </div>
      </div>

      {/* Quick Metrics & Controls */}
      <div className="flex items-center flex-wrap gap-3">
        {/* Total Value Pill formatted dynamically in selected currency */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="p-1 rounded bg-emerald-500/10 text-emerald-400">
            <span className="font-mono font-bold text-xs">{currentCurrencySymbol}</span>
          </div>
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-400">Net Worth</div>
            <div className="text-xs font-mono font-bold text-slate-100">
              {formatCompactCurrency(kri.totalValue, currency)}
              <span className={`ml-1.5 text-[11px] ${kri.totalGainLoss24hPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {kri.totalGainLoss24hPct >= 0 ? '+' : ''}{kri.totalGainLoss24hPct}%
              </span>
            </div>
          </div>
        </div>

        {/* Compact Currency Dropdown Pill: Displays short code (e.g. USD ($)) on top, full names in options */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-xs font-semibold text-slate-200">
          <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className="bg-transparent text-amber-400 font-mono font-bold focus:outline-none cursor-pointer w-[78px] truncate"
            title="Change Currency"
          >
            {Object.values(CURRENCY_MAP).map(c => (
              <option key={c.code} value={c.code} className="bg-slate-900 text-slate-200 font-sans py-1.5">
                {c.code} ({c.symbol}) — {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Benchmark Selector */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 rounded-lg px-2.5 py-1.5">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-medium text-slate-400">Bench:</span>
          <select
            value={benchmark}
            onChange={(e) => setBenchmark(e.target.value as 'SP500' | 'NIFTY50')}
            className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="SP500" className="bg-slate-900 text-slate-200">S&P 500 (US)</option>
            <option value="NIFTY50" className="bg-slate-900 text-slate-200">NIFTY 50 (India)</option>
          </select>
        </div>

        {/* API Connection Mode Toggle */}
        <button
          onClick={toggleApiMode}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            isLiveApi
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 glow-emerald'
              : 'bg-slate-800/80 border border-slate-700 text-slate-300 hover:bg-slate-800'
          }`}
          title="Toggle between Live API Pipeline and Offline Sandbox Data Engine"
        >
          <Radio className={`w-3.5 h-3.5 ${isLiveApi ? 'animate-pulse text-emerald-400' : 'text-slate-400'}`} />
          {isLiveApi ? 'Live API' : 'Sandbox'}
        </button>

        {/* Export Options */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={exportReportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            CSV
          </button>
          <button
            onClick={exportReportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            PDF Report
          </button>
        </div>
      </div>
    </header>
  );
};
