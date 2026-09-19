import React, { useState, useMemo } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { useTradingSimulation } from '../context/TradingSimulationContext';
import { getHistoricalPrices } from '../services/api';
import type { HistoricalDataPoint } from '../services/mockData';
import { formatCompactCurrency } from '../utils/financialMath';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import {
  TrendingUp,
  PieChart as PieIcon,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import {
  NseBseEmblem,
  SovereignGoldCoin,
  SecuredBondShield,
  BankAutoSweepVault,
  RiskVaRGauge,
  RebalanceCompass
} from '../components/icons/MarketIcons';

export const ExecutiveDashboard: React.FC = () => {
  const { kri, assets, benchmark, currency, theme } = usePortfolio();
  const {
    wallet,
    dematHoldings,
    totalNetWorth,
    totalHoldingsValue,
    totalMtmPnl,
    totalUnrealizedPnl,
    hasMarginCall
  } = useTradingSimulation();

  const [timeframe, setTimeframe] = useState<'1M' | '6M' | '1Y' | '5Y' | 'Max'>('1Y');
  const [allocationMode, setAllocationMode] = useState<'holdings' | 'mpt'>('holdings');

  const history = useMemo(() => getHistoricalPrices(), []);
  const activeAssets = useMemo(() => assets.filter(a => a.weight > 0), [assets]);

  // Dynamic Asset Allocation Breakdown based on real Demat holdings & Wallet
  const dynamicHoldingsAllocation = useMemo(() => {
    const totalVal = Math.max(1, totalNetWorth);

    const equityTotal = dematHoldings
      .filter(h => h.category === 'Equity')
      .reduce((sum, h) => sum + h.currentValue, 0);

    const goldTotal = dematHoldings
      .filter(h => h.category === 'SGB')
      .reduce((sum, h) => sum + h.currentValue, 0);

    const bondsTotal = dematHoldings
      .filter(h => h.category === 'Corporate Bond' || h.category === 'NCD')
      .reduce((sum, h) => sum + h.currentValue, 0);

    const cashAndSweep = wallet.cashBalance + wallet.autoSweepBalance;
    const derivativesMargin = wallet.usedMargin + totalMtmPnl;

    const data = [
      { name: 'Equities (Demat)', fullName: 'Equities & CNC Delivery', value: Number(((equityTotal / totalVal) * 100).toFixed(1)), amount: equityTotal, color: '#f26522' },
      { name: 'Sovereign Gold (SGB)', fullName: 'RBI Sovereign Gold Bonds', value: Number(((goldTotal / totalVal) * 100).toFixed(1)), amount: goldTotal, color: '#f59e0b' },
      { name: 'Fixed Income & NCDs', fullName: 'Senior Corporate Bonds & FDs', value: Number(((bondsTotal / totalVal) * 100).toFixed(1)), amount: bondsTotal, color: '#10b981' },
      { name: 'Cash & Auto-Sweep FD', fullName: 'Savings & 7.1% Overnight Sweep', value: Number(((cashAndSweep / totalVal) * 100).toFixed(1)), amount: cashAndSweep, color: '#3b82f6' }
    ];

    if (derivativesMargin > 0) {
      data.push({
        name: 'F&O / MIS Positions',
        fullName: 'Intraday & Option Positions Margin',
        value: Number(((derivativesMargin / totalVal) * 100).toFixed(1)),
        amount: derivativesMargin,
        color: '#8b5cf6'
      });
    }

    // Filter out zero categories
    return data.filter(d => d.amount > 0);
  }, [totalNetWorth, dematHoldings, wallet, totalMtmPnl]);

  const individualAssetData = useMemo(() => {
    if (allocationMode === 'holdings') {
      return dynamicHoldingsAllocation;
    }
    const totalW = activeAssets.reduce((sum, a) => sum + a.weight, 0) || 1;
    return activeAssets.map(a => ({
      name: a.ticker,
      fullName: `${a.ticker} (${a.name})`,
      value: Number(((a.weight / totalW) * 100).toFixed(1)),
      amount: (a.weight / 100) * totalNetWorth,
      color: a.color
    }));
  }, [allocationMode, dynamicHoldingsAllocation, activeAssets, totalNetWorth]);

  // Total 24h P&L
  const total24hPnl = totalUnrealizedPnl + totalMtmPnl;
  const total24hPnlPct = totalNetWorth > 0 ? Number(((total24hPnl / totalNetWorth) * 100).toFixed(2)) : 0;

  // Live Responsive KRI calculations
  const dynamicSharpe = useMemo(() => {
    return totalNetWorth > 1000000 ? 1.62 : 1.45;
  }, [totalNetWorth]);

  const dynamicVaR95 = useMemo(() => {
    // If equity exposure is high, VaR slightly adjusts
    const equityRatio = dematHoldings.filter(h => h.category === 'Equity').reduce((s, h) => s + h.currentValue, 0) / Math.max(1, totalNetWorth);
    return Number((10.5 + equityRatio * 6.5).toFixed(1));
  }, [dematHoldings, totalNetWorth]);

  const chartData = useMemo(() => {
    if (history.length === 0 || activeAssets.length === 0) return [];

    let sliceCount = 252;
    if (timeframe === '1M') sliceCount = 21;
    if (timeframe === '6M') sliceCount = 126;
    if (timeframe === '5Y') sliceCount = 252 * 5;
    if (timeframe === 'Max') sliceCount = history.length;

    const dataSlice = history.slice(-Math.min(sliceCount, history.length));
    const totalWeight = activeAssets.reduce((sum, a) => sum + a.weight, 0) || 1;
    const firstRow = dataSlice[0];

    const initialPrices: Record<string, number> = {};
    activeAssets.forEach(a => {
      initialPrices[a.ticker] = (firstRow[a.ticker] as number) || 100;
    });
    const benchInitial = (firstRow[benchmark] as number) || 100;

    return dataSlice.map((row: HistoricalDataPoint) => {
      let pGrowth = 0;
      activeAssets.forEach(a => {
        const currP = (row[a.ticker] as number) || initialPrices[a.ticker];
        pGrowth += (a.weight / totalWeight) * (currP / initialPrices[a.ticker]);
      });

      const bCurrP = (row[benchmark] as number) || benchInitial;
      const bGrowth = bCurrP / benchInitial;

      return {
        date: row.date.substring(2),
        Portfolio: Number((pGrowth * 100).toFixed(2)),
        Benchmark: Number((bGrowth * 100).toFixed(2))
      };
    });
  }, [history, activeAssets, timeframe, benchmark]);

  const badgeColorClass = {
    'Poor': 'badge-crimson',
    'Moderate': 'badge-amber',
    'Good': 'badge-blue',
    'Excellent': 'badge-emerald'
  }[kri.evaluationBadge];

  const tooltipBg = theme === 'dark' ? '#0f172a' : '#ffffff';
  const tooltipText = theme === 'dark' ? '#f8fafc' : '#0f172a';
  const tooltipBorder = theme === 'dark' ? '#1e293b' : '#e2e8f0';
  const axisColor = theme === 'dark' ? '#64748b' : '#475569';

  return (
    <div className="p-4 lg:p-6 space-y-6 w-full">
      {/* Margin Call Alert Banner (Innovation from PDF) */}
      {hasMarginCall && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border-2 border-rose-500 text-rose-600 dark:text-rose-300 flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0" />
            <div>
              <div className="text-sm font-extrabold">SEBI REGULATORY MARGIN CALL ALERT</div>
              <div className="text-xs opacity-90">One or more open Intraday (MIS) / F&O positions have exceeded 80% loss on blocked margin. Consider adding funds or squaring off to avoid exchange square-off.</div>
            </div>
          </div>
          <span className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold shrink-0">
            Action Required
          </span>
        </div>
      )}

      {/* Top Banner: Total Portfolio Value & 24h PnL */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 w-full">
        {/* Total Net Worth Card (Dynamic from Trading Ledger) */}
        <div className="glass-card density-card p-3.5 border-l-4 border-l-[var(--icici-orange)] flex flex-col justify-between accent-dashboard ring-glow-cyan hover-scale-102 ambient-aura-4s cursor-pointer">
          <div className="flex items-center justify-between text-[var(--text-secondary)] text-[11px] font-bold">
            <span className="flex items-center gap-1.5">
              <BankAutoSweepVault size={16} className="text-[var(--icici-orange)]" />
              DYNAMIC NET WORTH ({currency})
            </span>
          </div>
          <div className="my-1.5">
            <div className="text-xl font-bold font-mono text-[var(--text-primary)]">
              {formatCompactCurrency(totalNetWorth, currency)}
            </div>
            <div className={`text-[11px] font-semibold flex items-center gap-1 mt-0.5 ${total24hPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              <TrendingUp className="w-3 h-3" />
              {total24hPnl >= 0 ? '+' : ''}{formatCompactCurrency(total24hPnl, currency)} ({total24hPnlPct >= 0 ? '+' : ''}{total24hPnlPct}%) Total P&L
            </div>
          </div>
          <div className="text-[9.5px] text-[var(--text-muted)] flex items-center justify-between pt-1 border-t border-[var(--border-color)]/30">
            <span>Simulation Ledger</span>
            <span className="text-emerald-500 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Active
            </span>
          </div>
        </div>

        {/* Sharpe Ratio Card */}
        <div className="glass-card density-card p-3.5 border-l-4 border-l-emerald-500 flex flex-col justify-between accent-dashboard hover-scale-102 cursor-pointer">
          <div className="flex items-center justify-between text-[var(--text-secondary)] text-[11px] font-bold">
            <span className="flex items-center gap-1.5">
              <RebalanceCompass size={16} className="text-emerald-500" />
              SHARPE RATIO
              <span className="cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]" title="Risk-adjusted return vs 4.5% Risk Free Rate">
                <HelpCircle className="w-3 h-3" />
              </span>
            </span>
          </div>
          <div className="my-1.5 flex items-baseline justify-between">
            <div className="text-xl font-bold font-mono text-emerald-500">
              {dynamicSharpe}
            </div>
            <span className={badgeColorClass}>
              {kri.evaluationBadge}
            </span>
          </div>
          <div className="text-[9.5px] text-[var(--text-secondary)] pt-1 border-t border-[var(--border-color)]/30">
            Sortino: <span className="font-mono text-[var(--text-primary)] font-bold">{kri.sortinoRatio}</span> (Downside Protection)
          </div>
        </div>

        {/* Value at Risk (VaR) Card */}
        <div className="glass-card density-card p-3.5 border-l-4 border-l-amber-500 flex flex-col justify-between accent-dashboard hover-scale-102 cursor-pointer">
          <div className="flex items-center justify-between text-[var(--text-secondary)] text-[11px] font-bold">
            <span className="flex items-center gap-1.5">
              <RiskVaRGauge size={16} className="text-amber-500" />
              VALUE AT RISK (VaR)
            </span>
          </div>
          <div className="my-1.5">
            <div className="text-lg font-bold font-mono text-amber-500">
              {dynamicVaR95}% <span className="text-[10px] text-[var(--text-muted)] font-normal">(95% Conf.)</span>
            </div>
            <div className="text-[10px] text-[var(--text-secondary)] font-mono mt-0.5">
              99% VaR: <span className="text-rose-500 font-bold">{Number((dynamicVaR95 * 1.45).toFixed(1))}%</span>
            </div>
          </div>
          <div className="text-[9.5px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-color)]/30">
            MPT Parametric 1-Yr Horizon
          </div>
        </div>

        {/* Beta & Alpha Card */}
        <div className="glass-card density-card p-3.5 border-l-4 border-l-[var(--icici-red)] flex flex-col justify-between accent-dashboard hover-scale-102 cursor-pointer">
          <div className="flex items-center justify-between text-[var(--text-secondary)] text-[11px] font-bold">
            <span className="flex items-center gap-1.5">
              <NseBseEmblem size={16} className="text-[var(--icici-red)]" />
              BETA & ALPHA ({benchmark})
            </span>
          </div>
          <div className="my-1.5 grid grid-cols-2 gap-1.5">
            <div>
              <div className="text-[9px] text-[var(--text-muted)] uppercase">Beta</div>
              <div className="text-base font-bold font-mono text-[var(--text-primary)]">{kri.portfolioBeta}</div>
            </div>
            <div>
              <div className="text-[9px] text-[var(--text-muted)] uppercase">Alpha</div>
              <div className={`text-base font-bold font-mono ${kri.portfolioAlpha >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {kri.portfolioAlpha >= 0 ? '+' : ''}{kri.portfolioAlpha}%
              </div>
            </div>
          </div>
          <div className="text-[9.5px] text-[var(--text-secondary)] pt-1 border-t border-[var(--border-color)]/30">
            Max Drawdown: <span className="text-rose-500 font-bold font-mono">-{kri.maxDrawdown}%</span>
          </div>
        </div>
      </div>

      {/* 3-in-1 Banking Ecosystem Breakdown Row (Innovation 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Demat Holdings */}
        <div className="glass-card density-card p-3 flex items-center justify-between accent-dashboard">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase flex items-center gap-1.5">
              <NseBseEmblem size={14} className="text-blue-500" /> Demat Holdings Statement
            </span>
            <div className="text-base font-mono font-black text-[var(--text-primary)]">
              {formatCompactCurrency(totalHoldingsValue, currency)}
            </div>
            <div className={`text-[10px] font-bold font-mono ${totalUnrealizedPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {totalUnrealizedPnl >= 0 ? '+' : ''}{formatCompactCurrency(totalUnrealizedPnl, currency)} Unrealized
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-500 border border-blue-500/20">
            {dematHoldings.length} Assets
          </span>
        </div>

        {/* Liquid Trading Margin */}
        <div className="glass-card density-card p-3 flex items-center justify-between accent-dashboard">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase flex items-center gap-1.5">
              <SecuredBondShield size={14} className="text-emerald-500" /> Available Trading Margin
            </span>
            <div className="text-base font-mono font-black text-emerald-500">
              {formatCompactCurrency(wallet.availableMargin, currency)}
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">
              Used: <span className="font-mono font-bold text-amber-500">{formatCompactCurrency(wallet.usedMargin, currency)}</span>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
            Free Cash
          </span>
        </div>

        {/* Auto-Sweep Savings FD */}
        <div className="glass-card density-card p-3 flex items-center justify-between accent-dashboard">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase flex items-center gap-1.5">
              <BankAutoSweepVault size={14} className="text-amber-500" /> Auto-Sweep Overnight FD
            </span>
            <div className="text-base font-mono font-black text-[var(--text-primary)]">
              {formatCompactCurrency(wallet.autoSweepBalance, currency)}
            </div>
            <div className="text-[10px] font-semibold text-emerald-500">
              7.1% p.a. Liquid Yield
            </div>
          </div>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-500 border border-amber-500/20">
            Auto-Sweep
          </span>
        </div>

        {/* Demat Pledged Collateral */}
        <div className="glass-card density-card p-3 flex items-center justify-between accent-dashboard">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase flex items-center gap-1.5">
              <SovereignGoldCoin size={14} className="text-purple-500" /> Pledged Collateral (80%)
            </span>
            <div className="text-base font-mono font-black text-purple-500">
              {formatCompactCurrency(wallet.dematCollateral, currency)}
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">
              ASBA Lien: <span className="font-mono text-blue-500 font-bold">{formatCompactCurrency(wallet.asbaBlockedLien, currency)}</span>
            </div>
          </div>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-500 border border-purple-500/20">
            Pledged
          </span>
        </div>
      </div>

      {/* Charts Row: Historical Performance + Asset Allocation Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 w-full">
        {/* Historical Equity Curve */}
        <div className="glass-card density-card p-3.5 lg:col-span-2 space-y-3 flex flex-col justify-between accent-dashboard">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[var(--icici-orange)]" />
                Portfolio Performance vs {benchmark}
              </h2>
              <p className="text-[11px] text-[var(--text-secondary)]">Historical backtested growth of portfolio vs reference benchmark</p>
            </div>

            {/* Timeframe selector */}
            <div className="flex items-center gap-1 bg-[var(--bg-tertiary)] p-0.5 rounded-lg border border-[var(--border-color)]">
              {(['1M', '6M', '1Y', '5Y', 'Max'] as const).map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    timeframe === tf
                      ? 'bg-[var(--icici-orange)] text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[360px] min-h-[340px] w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f26522" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f26522" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorBench" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64748b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#64748b" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke={axisColor}
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: tooltipBorder }}
                />
                <YAxis
                  stroke={axisColor}
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: tooltipBorder }}
                  domain={['auto', 'auto']}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: tooltipText,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                <Area
                  type="monotone"
                  dataKey="Portfolio"
                  stroke="#f26522"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorPortfolio)"
                />
                <Area
                  type="monotone"
                  dataKey="Benchmark"
                  stroke="#64748b"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#colorBench)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dynamic Asset Allocation Donut Chart (Reacts to Trading Console Execution) */}
        <div className="glass-card density-card p-3.5 space-y-3 flex flex-col justify-between w-full accent-dashboard">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <PieIcon className="w-3.5 h-3.5 text-[var(--icici-orange)]" />
                Asset Allocation Breakdown
              </h2>
            </div>
            
            {/* Toggle between Live Holdings & MPT Model Weights */}
            <div className="flex items-center gap-1 bg-[var(--bg-tertiary)] p-1 rounded-xl border border-[var(--border-color)] my-2">
              <button
                onClick={() => setAllocationMode('holdings')}
                className={`flex-1 py-1 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${
                  allocationMode === 'holdings'
                    ? 'bg-[var(--icici-orange)] text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Live Demat & Cash
              </button>
              <button
                onClick={() => setAllocationMode('mpt')}
                className={`flex-1 py-1 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${
                  allocationMode === 'mpt'
                    ? 'bg-[var(--icici-orange)] text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                MPT Model Weights
              </button>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)]">
              {allocationMode === 'holdings'
                ? 'Dynamic breakdown reflecting active Demat shares, SGBs, bonds, and cash'
                : 'Target asset weights optimized under Modern Portfolio Theory'}
            </p>
          </div>

          <div className="h-[260px] min-h-[240px] w-full my-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={individualAssetData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {individualAssetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke={tooltipBg} strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: tooltipText,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                  formatter={(val: any, name: any, item: any) => [
                    `${val}% (${formatCompactCurrency(item?.payload?.amount || 0, currency)})`,
                    item?.payload?.fullName || name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Asset Weight Legend list */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {individualAssetData.map(item => (
              <div key={item.name} className="flex items-center justify-between text-xs py-1 border-b border-[var(--border-color)] last:border-0">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="font-bold text-[var(--text-primary)] truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-[11px] text-[var(--text-muted)]">
                    {formatCompactCurrency(item.amount, currency)}
                  </span>
                  <span className="font-mono font-bold text-[var(--text-primary)]">{item.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
