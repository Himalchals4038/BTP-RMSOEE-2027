import React, { useState, useMemo } from 'react';
import {
  Download,
  TrendingUp,
  ShieldCheck,
  PieChart,
  BarChart3,
  Calculator,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Briefcase,
  Maximize2,
  ReceiptText
} from 'lucide-react';
import { useTradingSimulation } from '../../context/TradingSimulationContext';
import { formatCompactCurrency } from '../../utils/financialMath';
import {
  buildPitchDeckReportData,
  generatePitchDeckPDF,
  type PitchDeckReportData
} from '../../utils/pitchDeckReportGenerator';

export const PitchDeckReportViewer: React.FC = () => {
  const { totalNetWorth, wallet, dematHoldings } = useTradingSimulation();

  const [period, setPeriod] = useState<'Month' | 'Quarter' | 'Year'>('Quarter');
  const [activeSlide, setActiveSlide] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'slide' | 'all'>('slide');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Build report data dynamically from real simulation context
  const reportData: PitchDeckReportData = useMemo(() => {
    return buildPitchDeckReportData(
      period,
      Math.max(totalNetWorth, 2500000), // Default realistic corpus if empty
      wallet?.cashBalance ?? 250000,
      dematHoldings ?? []
    );
  }, [period, totalNetWorth, wallet?.cashBalance, dematHoldings]);

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      await generatePitchDeckPDF(reportData);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to generate pitch deck PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const slides = [
    { num: 1, title: 'Executive Summary', icon: Briefcase },
    { num: 2, title: 'Newton-Raphson XIRR', icon: Calculator },
    { num: 3, title: 'Asset Allocation Sunburst', icon: PieChart },
    { num: 4, title: 'Capital Waterfall', icon: BarChart3 },
    { num: 5, title: 'Benchmark Alpha Curve', icon: TrendingUp },
    { num: 6, title: 'Demat Tax Ledger', icon: ReceiptText }
  ];

  return (
    <div className="space-y-6">
      {/* Executive Pitch-Deck Control Ribbon */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60 rounded-3xl p-6 shadow-xl text-white">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-[var(--icici-orange)] text-white text-[11px] font-black uppercase tracking-wider rounded-lg shadow-sm">
                Private Wealth Pitch-Deck
              </span>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                SEBI Mandate Compliant • Client: {reportData.clientName}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              Boardroom Wealth Performance & XIRR Deck
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Institutional-grade presentation deck analyzing multi-asset allocation, Newton-Raphson cash flow compounding, statutory tax savings, and multi-horizon market outperformance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Period Selector */}
            <div className="flex items-center bg-slate-950/80 p-1.5 rounded-2xl border border-slate-700">
              {(['Month', 'Quarter', 'Year'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    period === p
                      ? 'bg-[var(--icici-orange)] text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  {p}ly
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <button
              type="button"
              onClick={() => setViewMode(prev => (prev === 'slide' ? 'all' : 'slide'))}
              className="px-3.5 py-2 rounded-2xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>{viewMode === 'slide' ? 'View All Slides' : 'Slide Mode'}</span>
            </button>

            {/* Download PDF Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-900/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download Pitch-Deck PDF'}</span>
            </button>
          </div>
        </div>

        {downloadSuccess && (
          <div className="mt-4 p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Executive Landscape A4 Pitch-Deck PDF successfully generated and saved to your device.</span>
          </div>
        )}

        {/* Slide Navigation Tabs (When in Slide Mode) */}
        {viewMode === 'slide' && (
          <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-2">
              {slides.map(s => {
                const Icon = s.icon;
                const isActive = activeSlide === s.num;
                return (
                  <button
                    key={s.num}
                    type="button"
                    onClick={() => setActiveSlide(s.num)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-md font-black'
                        : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[var(--icici-orange)]' : 'text-slate-400'}`} />
                    <span>0{s.num}. {s.title}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveSlide(prev => Math.max(1, prev - 1))}
                disabled={activeSlide === 1}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
                title="Previous Slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold text-slate-400">
                {activeSlide} / 6
              </span>
              <button
                type="button"
                onClick={() => setActiveSlide(prev => Math.min(6, prev + 1))}
                disabled={activeSlide === 6}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
                title="Next Slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SLIDE 1: Executive Portfolio Summary */}
      {/* ========================================================================= */}
      {(viewMode === 'all' || activeSlide === 1) && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-[var(--icici-orange)]/10 text-[var(--icici-orange)] rounded text-[10px] font-black uppercase">
                  SLIDE 01 / 06
                </span>
                <span className="text-xs text-[var(--text-secondary)] font-bold">Executive Boardroom Summary</span>
              </div>
              <h3 className="text-lg font-black text-[var(--text-primary)] mt-1">
                Executive Portfolio Summary & Net Worth Snapshot
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-[var(--text-secondary)]">Period: {reportData.periodLabel}</span>
            </div>
          </div>

          {/* 6 Key Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] p-4 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--icici-orange)]"></div>
              <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase">Total Net Worth</p>
              <h4 className="text-xl font-black text-[var(--text-primary)] mt-1">
                {formatCompactCurrency(reportData.totalNetWorth, 'INR')}
              </h4>
              <p className="text-[10px] text-emerald-600 font-bold mt-1">Audited Demat Holding</p>
            </div>

            <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] p-4 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-slate-600"></div>
              <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase">Net Cash Injected</p>
              <h4 className="text-xl font-black text-[var(--text-primary)] mt-1">
                {formatCompactCurrency(reportData.netCashInjected, 'INR')}
              </h4>
              <p className="text-[10px] text-[var(--text-secondary)] font-bold mt-1">Capital Contributed</p>
            </div>

            <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] p-4 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
              <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase">Realized Gains</p>
              <h4 className="text-xl font-black text-emerald-600 mt-1">
                +{formatCompactCurrency(reportData.cumulativeRealizedGains, 'INR')}
              </h4>
              <p className="text-[10px] text-emerald-600 font-bold mt-1">Closed Book Profits</p>
            </div>

            <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] p-4 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500"></div>
              <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase">Taxes Saved</p>
              <h4 className="text-xl font-black text-purple-600 mt-1">
                ₹{reportData.taxesLegallySaved.toLocaleString('en-IN')}
              </h4>
              <p className="text-[10px] text-purple-600 font-bold mt-1">Via 8 Legal Loopholes</p>
            </div>

            <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] p-4 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-sky-500"></div>
              <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase">Absolute Return</p>
              <h4 className="text-xl font-black text-sky-600 mt-1">
                +{reportData.absoluteReturnPct}%
              </h4>
              <p className="text-[10px] text-sky-600 font-bold mt-1">Net Portfolio Alpha</p>
            </div>

            <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] p-4 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
              <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase">Annualized XIRR</p>
              <h4 className="text-xl font-black text-amber-600 mt-1">
                {reportData.xirrResult.xirrPct}% p.a.
              </h4>
              <p className="text-[10px] text-amber-600 font-bold mt-1">Newton-Raphson Audit</p>
            </div>
          </div>

          {/* Strategic Audit Commentary */}
          <div className="p-4 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl space-y-2">
            <h5 className="text-xs font-black uppercase text-[var(--text-primary)] flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[var(--icici-orange)]" />
              Executive Audit & Health Assessment
            </h5>
            <ul className="text-xs text-[var(--text-secondary)] space-y-1.5 leading-relaxed">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                <span><strong>Semi-Automated Rebalance Sentinels:</strong> Dynamically protected ₹3.5L+ from overvalued cyclical peaks, redeploying into 7.18% Sovereign G-Secs and undervalued large caps.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></span>
                <span><strong>Section 112A & 70 Tax Loophole Shield:</strong> Harvested ₹1,25,000 tax-free LTCG and offset short-term losses via peer switches, saving <strong>₹{reportData.taxesLegallySaved.toLocaleString('en-IN')}</strong> in cash taxes.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--icici-orange)] shrink-0"></span>
                <span><strong>Zero Retail Speculation:</strong> 0% algorithmic HFT and speculative F&O derivative drag ensures long-term capital safety.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SLIDE 2: Mathematical Newton-Raphson XIRR Engine */}
      {/* ========================================================================= */}
      {(viewMode === 'all' || activeSlide === 2) && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-600 rounded text-[10px] font-black uppercase">
                  SLIDE 02 / 06
                </span>
                <span className="text-xs text-[var(--text-secondary)] font-bold">Rigorous Mathematical Rate of Return</span>
              </div>
              <h3 className="text-lg font-black text-[var(--text-primary)] mt-1">
                Mathematical Newton-Raphson XIRR Engine
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full text-xs font-bold font-mono">
                Residual: {reportData.xirrResult.residual} (&lt; 10⁻⁶)
              </span>
            </div>
          </div>

          {/* Mathematical Formulation Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 text-slate-200 rounded-2xl font-mono text-xs space-y-2 border border-slate-800">
              <p className="text-[10px] font-black text-[var(--icici-orange)] uppercase tracking-wider">Governing Cash Flow Equation</p>
              <div className="p-3 bg-slate-900 rounded-xl text-center text-sm font-bold text-white border border-slate-800">
                ∑ [ Cᵢ / (1 + r)^((dᵢ - d₀)/365) ] = 0
              </div>
              <p className="text-[11px] text-slate-400">
                Solves for the exact compounding rate `r` across irregular client deposits (Cᵢ &lt; 0) and valuation payouts (Cᵢ &gt; 0).
              </p>
            </div>

            <div className="p-4 bg-slate-950 text-slate-200 rounded-2xl font-mono text-xs space-y-2 border border-slate-800">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">Root-Finding Iteration Algorithm</p>
              <div className="p-3 bg-slate-900 rounded-xl text-center text-sm font-bold text-white border border-slate-800">
                r_{'{k+1}'} = r_k - f(r_k) / f'(r_k)
              </div>
              <p className="text-[11px] text-slate-400">
                Converged in <strong>{reportData.xirrResult.iterations} iterations</strong> with tolerance 1e-6. Annualized XIRR: <strong className="text-amber-400">{reportData.xirrResult.xirrPct}% p.a.</strong>
              </p>
            </div>
          </div>

          {/* Cash Flow Schedule Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-[var(--text-primary)]">
              Irregular Cash Flow Schedule & Net Compounding Vector
            </h4>
            <div className="overflow-x-auto rounded-2xl border border-[var(--border-color)]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[var(--bg-tertiary)] border-b border-[var(--border-color)] text-[var(--text-secondary)] font-bold text-left">
                    <th className="py-2.5 px-4">Transaction Date</th>
                    <th className="py-2.5 px-4">Event Description</th>
                    <th className="py-2.5 px-4">Flow Direction</th>
                    <th className="py-2.5 px-4 text-right">Amount (₹ INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {reportData.xirrResult.cashFlows.map((cf, idx) => {
                    const isInflow = cf.amount < 0;
                    return (
                      <tr key={idx} className="hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-medium text-[var(--text-primary)]">{cf.date}</td>
                        <td className="py-2.5 px-4 text-[var(--text-primary)]">{cf.description}</td>
                        <td className="py-2.5 px-4 font-bold">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${isInflow ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                            {isInflow ? 'Capital Injected (-)' : 'Terminal Valuation (+)'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-[var(--text-primary)]">
                          ₹{Math.abs(cf.amount).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SLIDE 3: Asset Allocation Sunburst & Donut Breakdown */}
      {/* ========================================================================= */}
      {(viewMode === 'all' || activeSlide === 3) && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-purple-500/10 text-purple-600 rounded text-[10px] font-black uppercase">
                  SLIDE 03 / 06
                </span>
                <span className="text-xs text-[var(--text-secondary)] font-bold">Two-Tiered Asset Distribution</span>
              </div>
              <h3 className="text-lg font-black text-[var(--text-primary)] mt-1">
                Asset Allocation Sunburst & Donut Breakdown
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-[var(--text-secondary)]">
              Total Managed: {formatCompactCurrency(reportData.totalNetWorth, 'INR')}
            </span>
          </div>

          {/* Allocation Distribution Bar */}
          <div className="space-y-2">
            <div className="h-4 w-full rounded-full overflow-hidden flex shadow-inner">
              {reportData.assetAllocation.map((a, idx) => (
                <div
                  key={idx}
                  style={{ width: `${a.pct}%`, backgroundColor: a.color }}
                  title={`${a.name}: ${a.pct}%`}
                  className="transition-all hover:opacity-90"
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-[var(--text-secondary)] font-bold">
              <span>Equities (50%)</span>
              <span>Sovereign & Corporate Debt (34%)</span>
              <span>SGB Gold (10%)</span>
              <span>Overnight Sweep (6%)</span>
            </div>
          </div>

          {/* Sleeves Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {reportData.assetAllocation.map((item, idx) => (
              <div
                key={idx}
                className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] p-4 rounded-2xl relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">{item.category}</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-black" style={{ backgroundColor: `${item.color}20`, color: item.color }}>
                    {item.pct}%
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[var(--text-primary)] mt-1.5">{item.name}</h4>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[var(--text-primary)]">
                    {formatCompactCurrency(item.value, 'INR')}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold">
                    {item.pct >= 20 ? 'Core Sleeve' : 'Defensive Cushion'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SLIDE 4: Capital Flow Waterfall Chart */}
      {/* ========================================================================= */}
      {(viewMode === 'all' || activeSlide === 4) && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-sky-500/10 text-sky-600 rounded text-[10px] font-black uppercase">
                  SLIDE 04 / 06
                </span>
                <span className="text-xs text-[var(--text-secondary)] font-bold">Net Wealth Evolution</span>
              </div>
              <h3 className="text-lg font-black text-[var(--text-primary)] mt-1">
                Capital Flow Waterfall: Net Worth Accretion
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600">
              Positive Wealth Delta: +{formatCompactCurrency(reportData.totalNetWorth - reportData.netCashInjected, 'INR')}
            </span>
          </div>

          {/* Interactive Waterfall Visualization */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {reportData.waterfallSteps.map((step, idx) => {
              const isTotal = step.type === 'base' || step.type === 'closing';
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all ${
                    isTotal
                      ? 'bg-slate-900 text-white border-slate-700 shadow-md'
                      : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-primary)]'
                  }`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-75">{step.label}</p>
                  <h4 className={`text-lg font-black mt-1 ${isTotal ? 'text-white' : 'text-emerald-600'}`}>
                    {formatCompactCurrency(step.amount, 'INR')}
                  </h4>
                  <div className="mt-3 pt-2 border-t border-[var(--border-color)]/40 flex items-center justify-between text-[10px]">
                    <span className="opacity-70">Running Total:</span>
                    <span className="font-mono font-bold">{formatCompactCurrency(step.runningTotal, 'INR')}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl text-xs text-[var(--text-secondary)] leading-relaxed">
            <strong>Waterfall Insight:</strong> Opening capital compounded with fresh systematic deposits and quarterly dividend coupons, further accelerated by valuation alpha and <strong>₹{reportData.taxesLegallySaved.toLocaleString('en-IN')}</strong> in legal tax loophole savings.
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SLIDE 5: Benchmark Outperformance Curve */}
      {/* ========================================================================= */}
      {(viewMode === 'all' || activeSlide === 5) && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded text-[10px] font-black uppercase">
                  SLIDE 05 / 06
                </span>
                <span className="text-xs text-[var(--text-secondary)] font-bold">Alpha Generation Across Cycles</span>
              </div>
              <h3 className="text-lg font-black text-[var(--text-primary)] mt-1">
                Benchmark Outperformance Curve: SanchayX vs Indian Markets
              </h3>
            </div>
            <span className="text-xs text-[var(--text-secondary)] font-mono">
              Base: NIFTY 50 TRI & CRISIL Bond
            </span>
          </div>

          {/* Benchmark Comparison Table */}
          <div className="overflow-x-auto rounded-2xl border border-[var(--border-color)]">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[var(--bg-tertiary)] border-b border-[var(--border-color)] text-[var(--text-secondary)] font-bold text-left">
                  <th className="py-3 px-4">Performance Horizon</th>
                  <th className="py-3 px-4">SanchayX Portfolio</th>
                  <th className="py-3 px-4">NIFTY 50 TRI Return</th>
                  <th className="py-3 px-4">CRISIL Composite Bond</th>
                  <th className="py-3 px-4 text-right">Net Alpha Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {reportData.benchmarks.map((b, idx) => (
                  <tr key={idx} className="hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-[var(--text-primary)]">{b.horizon}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[var(--icici-orange)]">+{b.sanchayxReturn}%</td>
                    <td className="py-3 px-4 font-mono text-[var(--text-secondary)]">+{b.nifty50TriReturn}%</td>
                    <td className="py-3 px-4 font-mono text-[var(--text-secondary)]">+{b.crisilBondReturn}%</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                      +{b.alphaGenerated}% Alpha
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Attribution Box */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="p-3.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl">
              <h5 className="text-xs font-bold text-[var(--text-primary)]">20-Year Mean Reversion</h5>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1">Disciplined accumulation of quality stocks trading below 20-year mean P/E.</p>
            </div>
            <div className="p-3.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl">
              <h5 className="text-xs font-bold text-[var(--text-primary)]">Cyclical Exit Sentinels</h5>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1">Automated trim signals when stocks reach &gt;2 standard deviations above historical valuation.</p>
            </div>
            <div className="p-3.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl">
              <h5 className="text-xs font-bold text-[var(--text-primary)]">Statutory Tax Harvesting</h5>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1">+1.5% to +2.2% annual net alpha generated entirely through zero-tax execution.</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SLIDE 6: Demat Tax Ledger & Holdings Statement */}
      {/* ========================================================================= */}
      {(viewMode === 'all' || activeSlide === 6) && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-600 rounded text-[10px] font-black uppercase">
                  SLIDE 06 / 06
                </span>
                <span className="text-xs text-[var(--text-secondary)] font-bold">Audited Demat Statement</span>
              </div>
              <h3 className="text-lg font-black text-[var(--text-primary)] mt-1">
                Demat Tax Ledger & Individual Holdings Statement
              </h3>
            </div>
            <span className="text-xs font-mono text-[var(--text-secondary)]">
              Holdings: {reportData.dematHoldings.length} Securities
            </span>
          </div>

          {/* Holdings Table */}
          <div className="overflow-x-auto rounded-2xl border border-[var(--border-color)]">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[var(--bg-tertiary)] border-b border-[var(--border-color)] text-[var(--text-secondary)] font-bold text-left">
                  <th className="py-2.5 px-4">Ticker / Symbol</th>
                  <th className="py-2.5 px-4">Asset Name</th>
                  <th className="py-2.5 px-4">Qty</th>
                  <th className="py-2.5 px-4">Avg Cost</th>
                  <th className="py-2.5 px-4">Current LTP</th>
                  <th className="py-2.5 px-4">Valuation</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Unrealized P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {reportData.dematHoldings.map((h, idx) => {
                  const isPositive = h.unrealizedPnl >= 0;
                  return (
                    <tr key={idx} className="hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-[var(--text-primary)]">{h.ticker}</td>
                      <td className="py-2.5 px-4 text-[var(--text-secondary)]">{h.name}</td>
                      <td className="py-2.5 px-4 font-mono">{h.qty}</td>
                      <td className="py-2.5 px-4 font-mono">₹{h.avgCost.toFixed(1)}</td>
                      <td className="py-2.5 px-4 font-mono">₹{h.currentLtp.toFixed(1)}</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-[var(--text-primary)]">
                        {formatCompactCurrency(h.currentValue, 'INR')}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          h.holdingStatus === 'LTCG' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                        }`}>
                          {h.holdingStatus}
                        </span>
                      </td>
                      <td className={`py-2.5 px-4 text-right font-mono font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isPositive ? '+' : ''}₹{h.unrealizedPnl.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
