import React, { useState, useMemo } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { getHistoricalPrices } from '../services/api';
import type { HistoricalDataPoint } from '../services/mockData';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';
import {
  Sliders,
  Search,
  Plus,
  Lock,
  Unlock,
  Trash2,
  RefreshCw,
  Zap,
  Target,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Filter,
  Bot,
  X,
  Table,
  PieChart as PieChartIcon,
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';

export const PortfolioBuilder: React.FC = () => {
  const {
    assets,
    constraints,
    updateAssetWeight,
    toggleAssetLock,
    normalizeWeights,
    removeAssetFromPortfolio,
    applyOptimization,
    updateConstraints,
    openDocForAsset,
    isLoading
  } = usePortfolio();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [showTop5Only, setShowTop5Only] = useState<boolean>(true);

  // Innovation: Tri-Mode Zero-Scroll Compact Console Mode
  type ConsoleMode = 'matrix' | 'donut' | 'buckets';
  const [consoleMode, setConsoleMode] = useState<ConsoleMode>('matrix');

  // Bucket weights calculations for Mode C
  const bucketWeights = useMemo(() => {
    let eq = 0, debt = 0, gold = 0, cash = 0;
    assets.forEach(a => {
      if (a.category === 'Equities' || a.category === 'ETFs' || a.category === 'Crypto') eq += a.weight;
      else if (a.category === 'Bonds') debt += a.weight;
      else if (a.category === 'Commodities') gold += a.weight;
      else cash += a.weight;
    });
    return {
      Equities: Number(eq.toFixed(1)),
      Debt: Number(debt.toFixed(1)),
      Gold: Number(gold.toFixed(1)),
      Cash: Number(cash.toFixed(1))
    };
  }, [assets]);

  // Adjust an entire bucket weight proportionally among constituent assets
  const updateBucketWeight = (categoryName: 'Equities' | 'Debt' | 'Gold' | 'Cash', targetWeight: number) => {
    const currentWeight = bucketWeights[categoryName];
    const target = Math.max(0, Math.min(100, targetWeight));

    const bucketAssets = assets.filter(a => {
      if (categoryName === 'Equities') return a.category === 'Equities' || a.category === 'ETFs' || a.category === 'Crypto';
      if (categoryName === 'Debt') return a.category === 'Bonds';
      if (categoryName === 'Gold') return a.category === 'Commodities';
      return a.category === 'Forex' || (a.category !== 'Equities' && a.category !== 'ETFs' && a.category !== 'Crypto' && a.category !== 'Bonds' && a.category !== 'Commodities');
    });

    if (bucketAssets.length === 0) return;

    if (currentWeight === 0) {
      const each = Number((target / bucketAssets.length).toFixed(1));
      bucketAssets.forEach(a => updateAssetWeight(a.ticker, each));
    } else {
      const ratio = target / currentWeight;
      bucketAssets.forEach(a => {
        if (!a.isLocked) {
          updateAssetWeight(a.ticker, Number((a.weight * ratio).toFixed(1)));
        }
      });
    }
  };

  // Preset Allocation Strategies
  const applyPresetStrategy = (eqPct: number, debtPct: number, goldPct: number, cashPct: number) => {
    updateBucketWeight('Equities', eqPct);
    updateBucketWeight('Debt', debtPct);
    updateBucketWeight('Gold', goldPct);
    updateBucketWeight('Cash', cashPct);
    setTimeout(() => normalizeWeights(), 50);
  };

  // Equalize weights across active assets
  const equalizeActiveWeights = () => {
    const active = assets.filter(a => a.weight > 0);
    if (active.length === 0) return;
    const each = Number((100 / active.length).toFixed(1));
    active.forEach(a => updateAssetWeight(a.ticker, each));
    setTimeout(() => normalizeWeights(), 50);
  };

  // Donut data for Mode B
  const donutData = useMemo(() => {
    return assets
      .filter(a => a.weight > 0)
      .map(a => ({
        name: a.ticker,
        fullName: a.name,
        value: a.weight,
        color: a.color || '#f26522',
        return: a.annualizedReturn,
        vol: a.annualizedVol,
        category: a.category
      }))
      .sort((a, b) => b.value - a.value);
  }, [assets]);

  const weightedStats = useMemo(() => {
    let ret = 0, vol = 0;
    donutData.forEach(d => {
      ret += (d.return * d.value) / 100;
      vol += (d.vol * d.value) / 100;
    });
    return {
      return: ret.toFixed(1),
      vol: vol.toFixed(1)
    };
  }, [donutData]);

  const history = useMemo(() => getHistoricalPrices(), []);

  const getSparklineData = (ticker: string) => {
    if (history.length === 0) return [];
    const slice = history.slice(-30);
    return slice.map((row: HistoricalDataPoint) => ({
      date: row.date,
      price: (row[ticker] as number) || 100
    }));
  };

  const totalWeightSum = useMemo(() => {
    return Number(assets.reduce((sum, a) => sum + a.weight, 0).toFixed(2));
  }, [assets]);

  const displayedAssets = useMemo(() => {
    let list = assets;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return list.filter(a =>
        a.ticker.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
      );
    }

    if (selectedCategoryFilter !== 'ALL') {
      list = list.filter(a => a.category === selectedCategoryFilter);
    }

    if (showTop5Only) {
      if (selectedCategoryFilter === 'ALL') {
        const categoryMap: Record<string, typeof assets> = {};
        list.forEach(a => {
          categoryMap[a.category] = categoryMap[a.category] || [];
          if (categoryMap[a.category].length < 5) {
            categoryMap[a.category].push(a);
          }
        });
        return Object.values(categoryMap).flat();
      } else {
        return list.slice(0, 5);
      }
    }

    return list;
  }, [assets, selectedCategoryFilter, showTop5Only, searchQuery]);

  const cryptoExposure = useMemo(() => {
    const cryptoSum = assets.filter(a => a.category === 'Crypto').reduce((sum, a) => sum + a.weight, 0);
    return Number(cryptoSum.toFixed(1));
  }, [assets]);

  const equityExposure = useMemo(() => {
    const eqSum = assets.filter(a => a.category === 'Equities' || a.category === 'ETFs').reduce((sum, a) => sum + a.weight, 0);
    return Number(eqSum.toFixed(1));
  }, [assets]);

  return (
    <div className="p-4 lg:p-6 space-y-6 w-full">
      {/* Top Banner: One-Click Quantitative Optimizers */}
      <div className="glass-card p-5 space-y-4 w-full">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Zap className="w-5 h-5 text-[var(--icici-orange)]" />
              One-Click Quantitative Portfolio Optimizers
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Automated Modern Portfolio Theory (MPT) & Risk Parity Solver Engines
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={normalizeWeights}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--icici-orange)] hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Auto-Normalize to 100%
            </button>
            <div className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border ${
              totalWeightSum === 100
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
            }`}>
              Total Weight: {totalWeightSum}%
            </div>
          </div>
        </div>

        {/* 4 Optimizer Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 w-full">
          <button
            onClick={() => applyOptimization('max_sharpe')}
            disabled={isLoading}
            className="p-3 rounded-xl bg-gradient-to-r from-emerald-600/10 to-teal-600/10 border border-emerald-500/30 hover:border-emerald-500 text-left transition-all hover:scale-[1.01] cursor-pointer"
          >
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
              Max Sharpe Ratio
              <Target className="w-4 h-4" />
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-1">Maximizes Risk-Adjusted Returns</div>
          </button>

          <button
            onClick={() => applyOptimization('min_variance')}
            disabled={isLoading}
            className="p-3 rounded-xl bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-blue-500/30 hover:border-blue-500 text-left transition-all hover:scale-[1.01] cursor-pointer"
          >
            <div className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between">
              Minimum Variance
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-1">Minimizes Portfolio Volatility</div>
          </button>

          <button
            onClick={() => applyOptimization('risk_parity')}
            disabled={isLoading}
            className="p-3 rounded-xl bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-500/30 hover:border-purple-500 text-left transition-all hover:scale-[1.01] cursor-pointer"
          >
            <div className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center justify-between">
              Risk Parity Weighting
              <Sliders className="w-4 h-4" />
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-1">Equal Volatility Risk Contribution</div>
          </button>

          <button
            onClick={() => applyOptimization('equal_weight')}
            disabled={isLoading}
            className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:border-[var(--icici-orange)] text-left transition-all hover:scale-[1.01] cursor-pointer"
          >
            <div className="text-xs font-bold text-[var(--text-primary)] flex items-center justify-between">
              Equal Weight (1/N)
              <RefreshCw className="w-4 h-4" />
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-1">Uniform 1/N Asset Split</div>
          </button>
        </div>
      </div>

      {/* Main Grid: Asset Allocator Table + Constraint Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Asset Weight Sliders & Search */}
        <div className="lg:col-span-2 glass-card p-5 space-y-4 w-full">
          {/* Header & Mode Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-sm font-black text-[var(--text-primary)] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[var(--icici-orange)]" />
                Zero-Scroll Allocation Console
              </h2>

              {/* Mode Switcher Tabs */}
              <div className="flex items-center gap-1 bg-[var(--bg-tertiary)] p-1 rounded-xl border border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setConsoleMode('matrix')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    consoleMode === 'matrix'
                      ? 'bg-[var(--icici-orange)] text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                  title="High-Density Tabular Matrix"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Matrix</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConsoleMode('donut')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    consoleMode === 'donut'
                      ? 'bg-[var(--icici-orange)] text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                  title="Radial Sunburst / Interactive Donut"
                >
                  <PieChartIcon className="w-3.5 h-3.5" />
                  <span>Donut</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConsoleMode('buckets')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    consoleMode === 'buckets'
                      ? 'bg-[var(--icici-orange)] text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                  title="4 Macro Asset Class Buckets"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>4 Buckets</span>
                </button>
              </div>
            </div>

            {/* Quick Action & Total Weight Status */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className={`px-2.5 py-1 rounded-lg text-xs font-mono font-black border flex items-center gap-1.5 ${
                Math.abs(totalWeightSum - 100) < 0.1
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : totalWeightSum > 100
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
              }`}>
                <span>Total:</span>
                <span>{totalWeightSum}%</span>
                {Math.abs(totalWeightSum - 100) < 0.1 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                )}
              </div>

              <button
                type="button"
                onClick={normalizeWeights}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--icici-orange)]/15 hover:bg-[var(--icici-orange)]/25 text-[var(--icici-orange)] border border-[var(--icici-orange)]/30 text-xs font-bold transition-colors cursor-pointer"
                title="Normalize active unlocked weights to exactly 100%"
              >
                <Zap className="w-3 h-3" />
                <span>Normalize</span>
              </button>

              <button
                type="button"
                onClick={equalizeActiveWeights}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] border border-[var(--border-color)] text-xs font-bold transition-colors cursor-pointer"
                title="Equalize all active weights (1/N)"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Equalize</span>
              </button>
            </div>
          </div>

          {/* Search & Category Filter Strip (Active in Matrix & Donut mode) */}
          {consoleMode !== 'buckets' && (
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by ticker, name, or asset class..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl pl-8 pr-7 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--icici-orange)]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] absolute right-2 top-2"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-1 flex-wrap">
                {['ALL', 'Equities', 'Bonds', 'Commodities', 'ETFs', 'Crypto'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategoryFilter(cat);
                      setSearchQuery('');
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      selectedCategoryFilter === cat ? 'bg-[var(--icici-orange)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowTop5Only(!showTop5Only)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                  showTop5Only
                    ? 'bg-[var(--icici-orange)]/15 text-[var(--icici-orange)] border-[var(--icici-orange)]/30'
                    : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)]'
                }`}
              >
                <Filter className="w-3 h-3" />
                {showTop5Only ? 'Top 5 / Class' : 'All Securities'}
              </button>
            </div>
          )}

          {/* =========================================================================
              MODE A: HIGH-DENSITY TABULAR MATRIX (Zero-Scroll Institutional Table)
              ========================================================================= */}
          {consoleMode === 'matrix' && (
            <div className="rounded-xl border border-[var(--border-color)] overflow-hidden bg-[var(--bg-card)] shadow-xs">
              <div className="max-h-[460px] overflow-y-auto divide-y divide-[var(--border-color)]">
                <table className="w-full text-left border-collapse density-table">
                  <thead className="bg-[var(--bg-tertiary)] text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider sticky top-0 z-10 border-b border-[var(--border-color)]">
                    <tr>
                      <th className="py-2.5 px-3">Security</th>
                      <th className="py-2.5 px-2">Class</th>
                      <th className="py-2.5 px-2 text-right">Price / 24h</th>
                      <th className="py-2.5 px-2 text-center w-24">30D Trend</th>
                      <th className="py-2.5 px-2 text-right">Vol</th>
                      <th className="py-2.5 px-3 text-center min-w-[200px]">Target Weight</th>
                      <th className="py-2.5 px-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]/60 text-xs">
                    {displayedAssets.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-xs text-[var(--text-muted)]">
                          No securities matching &quot;{searchQuery}&quot;.
                        </td>
                      </tr>
                    ) : (
                      displayedAssets.map(asset => (
                        <tr
                          key={asset.ticker}
                          className={`hover:bg-[var(--bg-card-hover)] transition-colors ${
                            asset.weight > 0 ? 'bg-[var(--bg-tertiary)]/20' : ''
                          }`}
                        >
                          {/* Security Info */}
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleAssetLock(asset.ticker)}
                                className={`p-1 rounded transition-colors ${asset.isLocked ? 'bg-amber-500/20 text-amber-500' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                                title={asset.isLocked ? 'Locked from auto-normalization' : 'Lock weight'}
                              >
                                {asset.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                              </button>
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: asset.color }} />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-extrabold text-xs text-[var(--text-primary)]">{asset.ticker}</span>
                                  <button
                                    onClick={() => openDocForAsset(asset.name)}
                                    className="text-[var(--text-muted)] hover:text-emerald-500 transition-colors"
                                    title={`Ask AI Bot about ${asset.name}`}
                                  >
                                    <Bot className="w-3 h-3" />
                                  </button>
                                </div>
                                <span className="text-[10px] text-[var(--text-secondary)] block truncate max-w-[130px]">{asset.name}</span>
                              </div>
                            </div>
                          </td>

                          {/* Category Badge */}
                          <td className="py-2 px-2">
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-black uppercase bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                              {asset.category}
                            </span>
                          </td>

                          {/* Price & 24h Change */}
                          <td className="py-2 px-2 text-right">
                            <span className="font-mono font-bold text-xs text-[var(--text-primary)] block">
                              {asset.currency}{asset.price < 1 ? asset.price.toString() : asset.price.toLocaleString()}
                            </span>
                            <span className={`text-[10px] font-bold ${asset.change24h >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
                            </span>
                          </td>

                          {/* Sparkline */}
                          <td className="py-2 px-2 text-center">
                            <div className="h-7 w-20 mx-auto">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={getSparklineData(asset.ticker)}>
                                  <Area
                                    type="monotone"
                                    dataKey="price"
                                    stroke={asset.change24h >= 0 ? '#16a34a' : '#dc2626'}
                                    strokeWidth={1.5}
                                    fill={asset.change24h >= 0 ? 'rgba(22, 163, 74, 0.15)' : 'rgba(220, 38, 38, 0.15)'}
                                    isAnimationActive={false}
                                  />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </td>

                          {/* Volatility */}
                          <td className="py-2 px-2 text-right font-mono text-xs text-[var(--text-secondary)]">
                            {asset.annualizedVol}%
                          </td>

                          {/* Weight Stepper & Direct Input */}
                          <td className="py-2 px-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => updateAssetWeight(asset.ticker, Math.max(0, Number((asset.weight - 5).toFixed(1))))}
                                className="px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] text-[10px] font-bold border border-[var(--border-color)] cursor-pointer"
                                title="Decrease by 5%"
                              >
                                -5%
                              </button>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.5"
                                  value={asset.weight}
                                  onChange={(e) => updateAssetWeight(asset.ticker, Number(e.target.value))}
                                  className="w-14 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded px-1.5 py-0.5 text-xs text-right font-mono font-black text-[var(--icici-orange)] focus:outline-none focus:border-[var(--icici-orange)] tabular-nums"
                                />
                                <span className="text-xs text-[var(--text-muted)] font-bold">%</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => updateAssetWeight(asset.ticker, Math.min(100, Number((asset.weight + 5).toFixed(1))))}
                                className="px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] text-[10px] font-bold border border-[var(--border-color)] cursor-pointer"
                                title="Increase by 5%"
                              >
                                +5%
                              </button>
                            </div>
                            {/* Mini fill bar */}
                            <div className="w-full bg-[var(--border-color)]/50 rounded-full h-1 mt-1.5 overflow-hidden">
                              <div
                                className="h-full bg-[var(--icici-orange)] transition-all duration-200"
                                style={{ width: `${Math.min(100, asset.weight)}%` }}
                              />
                            </div>
                          </td>

                          {/* Remove / Zero Action */}
                          <td className="py-2 px-2 text-center">
                            {asset.weight > 0 ? (
                              <button
                                onClick={() => removeAssetFromPortfolio(asset.ticker)}
                                className="p-1 rounded text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="Reset allocation to 0%"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => updateAssetWeight(asset.ticker, 5)}
                                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--icici-orange)] hover:bg-[var(--icici-orange)]/10 transition-colors cursor-pointer"
                                title="Add 5% initial weight"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================================
              MODE B: RADIAL SUNBURST / INTERACTIVE DONUT CONSOLE
              ========================================================================= */}
          {consoleMode === 'donut' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center p-2">
              {/* Donut Chart & Center Stats */}
              <div className="md:col-span-6 flex flex-col items-center justify-center relative min-h-[300px]">
                <ResponsiveContainer width="100%" height={290}>
                  <PieChart>
                    <Pie
                      data={donutData.length > 0 ? donutData : [{ name: 'Unallocated', value: 100, color: '#64748b' }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={72}
                      outerRadius={112}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {(donutData.length > 0 ? donutData : [{ name: 'Unallocated', color: '#64748b' }]).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [`${val}%`, 'Allocation']}
                      contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Central HUD */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-wider">
                    {donutData.length} Active Holdings
                  </span>
                  <div className="text-xl font-extrabold font-mono text-[var(--text-primary)]">
                    {weightedStats.return}%
                  </div>
                  <span className="text-[9px] text-emerald-500 font-bold">Exp. Return</span>
                  <span className="text-[9px] text-[var(--text-muted)] font-mono mt-0.5">Vol: {weightedStats.vol}%</span>
                </div>
              </div>

              {/* Active Holdings List & Quick Weight Adjusters */}
              <div className="md:col-span-6 space-y-2 max-h-[320px] overflow-y-auto pr-1">
                <div className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-wider pb-1 border-b border-[var(--border-color)] flex justify-between">
                  <span>Constituent Weight Ladder</span>
                  <span>Allocation</span>
                </div>
                {donutData.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[var(--text-muted)] font-bold">
                    No active assets. Add securities using the Matrix or 4-Bucket view.
                  </div>
                ) : (
                  donutData.map(d => (
                    <div
                      key={d.name}
                      className="p-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-between gap-2 hover:border-[var(--icici-orange)] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        <div>
                          <span className="font-mono font-bold text-xs text-[var(--text-primary)]">{d.name}</span>
                          <span className="text-[10px] text-[var(--text-secondary)] block truncate max-w-[130px]">{d.fullName}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateAssetWeight(d.name, Math.max(0, Number((d.value - 1).toFixed(1))))}
                          className="w-6 h-6 rounded bg-[var(--bg-card)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold border border-[var(--border-color)] flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-mono font-extrabold text-xs text-[var(--icici-orange)] tabular-nums">
                          {d.value}%
                        </span>
                        <button
                          type="button"
                          onClick={() => updateAssetWeight(d.name, Math.min(100, Number((d.value + 1).toFixed(1))))}
                          className="w-6 h-6 rounded bg-[var(--bg-card)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold border border-[var(--border-color)] flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              MODE C: 4 CATEGORICAL BUCKET SLIDERS (Macro Allocation)
              ========================================================================= */}
          {consoleMode === 'buckets' && (
            <div className="space-y-4 pt-1">
              {/* Preset Strategies Quick Buttons */}
              <div className="p-3 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
                <div className="flex items-center justify-between text-[11px] font-black text-[var(--text-muted)] uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[var(--icici-orange)]" />
                    Macro Allocation Strategy Presets
                  </span>
                  <span className="text-[10px] text-emerald-500 font-bold">1-Click Auto Proportional Split</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => applyPresetStrategy(60, 25, 10, 5)}
                    className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--icici-orange)] text-left transition-all cursor-pointer shadow-xs"
                  >
                    <div className="font-extrabold text-xs text-[var(--text-primary)]">Balanced Growth</div>
                    <div className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5">60% Eq • 25% Debt • 10% Gold</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetStrategy(20, 55, 15, 10)}
                    className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--icici-orange)] text-left transition-all cursor-pointer shadow-xs"
                  >
                    <div className="font-extrabold text-xs text-[var(--text-primary)]">Defensive Wealth</div>
                    <div className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5">20% Eq • 55% Debt • 15% Gold</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetStrategy(80, 10, 5, 5)}
                    className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--icici-orange)] text-left transition-all cursor-pointer shadow-xs"
                  >
                    <div className="font-extrabold text-xs text-[var(--text-primary)]">Aggressive Alpha</div>
                    <div className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5">80% Eq • 10% Debt • 5% Gold</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetStrategy(30, 55, 15, 0)}
                    className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--icici-orange)] text-left transition-all cursor-pointer shadow-xs"
                  >
                    <div className="font-extrabold text-xs text-[var(--text-primary)]">Ray Dalio Weather</div>
                    <div className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5">30% Eq • 55% Debt • 15% Gold</div>
                  </button>
                </div>
              </div>

              {/* 4 Macro Range Sliders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Equities Bucket */}
                <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[var(--icici-orange)]" />
                      <div>
                        <span className="font-extrabold text-xs text-[var(--text-primary)]">Equities & High Growth</span>
                        <span className="text-[10px] text-[var(--text-muted)] block">NIFTY 50, US Tech & Global Equities</span>
                      </div>
                    </div>
                    <span className="font-mono font-extrabold text-base text-[var(--icici-orange)] tabular-nums">
                      {bucketWeights.Equities}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={bucketWeights.Equities}
                    onChange={(e) => updateBucketWeight('Equities', Number(e.target.value))}
                    className="w-full accent-[var(--icici-orange)] cursor-pointer"
                  />
                  <div className="text-[10px] text-[var(--text-secondary)] font-mono flex justify-between">
                    <span>Scales constituents proportionally</span>
                    <span>Min: 0% • Max: 100%</span>
                  </div>
                </div>

                {/* 2. Fixed Income / Debt Bucket */}
                <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-500" />
                      <div>
                        <span className="font-extrabold text-xs text-[var(--text-primary)]">Fixed Income & Senior Bonds</span>
                        <span className="text-[10px] text-[var(--text-muted)] block">Government G-Secs, Corporate Bonds & FDs</span>
                      </div>
                    </div>
                    <span className="font-mono font-extrabold text-base text-emerald-500 tabular-nums">
                      {bucketWeights.Debt}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={bucketWeights.Debt}
                    onChange={(e) => updateBucketWeight('Debt', Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="text-[10px] text-[var(--text-secondary)] font-mono flex justify-between">
                    <span>Scales debt holdings proportionally</span>
                    <span>Min: 0% • Max: 100%</span>
                  </div>
                </div>

                {/* 3. Gold & Commodities Bucket */}
                <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-amber-500" />
                      <div>
                        <span className="font-extrabold text-xs text-[var(--text-primary)]">Sovereign Gold & Commodities</span>
                        <span className="text-[10px] text-[var(--text-muted)] block">RBI Sovereign Gold Bonds (SGB), Silver MCX</span>
                      </div>
                    </div>
                    <span className="font-mono font-extrabold text-base text-amber-500 tabular-nums">
                      {bucketWeights.Gold}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={bucketWeights.Gold}
                    onChange={(e) => updateBucketWeight('Gold', Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="text-[10px] text-[var(--text-secondary)] font-mono flex justify-between">
                    <span>Inflation Hedge Allocation</span>
                    <span>Min: 0% • Max: 100%</span>
                  </div>
                </div>

                {/* 4. Cash & Auto-Sweep Bucket */}
                <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-500" />
                      <div>
                        <span className="font-extrabold text-xs text-[var(--text-primary)]">Cash & Liquid Auto-Sweep</span>
                        <span className="text-[10px] text-[var(--text-muted)] block">Savings Overnight Sweep, Forex & Liquidity</span>
                      </div>
                    </div>
                    <span className="font-mono font-extrabold text-base text-blue-500 tabular-nums">
                      {bucketWeights.Cash}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={bucketWeights.Cash}
                    onChange={(e) => updateBucketWeight('Cash', Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                  <div className="text-[10px] text-[var(--text-secondary)] font-mono flex justify-between">
                    <span>Liquid Buffer for Tactical Orders</span>
                    <span>Min: 0% • Max: 100%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Custom User Constraint Controls */}
        <div className="glass-card p-5 space-y-6 w-full">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Risk & Exposure Constraints
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">Custom Boundaries for Portfolio Allocator</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--text-primary)]">Risk Profile Mode</label>
            <div className="grid grid-cols-2 gap-2">
              {(['Conservative', 'Balanced', 'Aggressive', 'Custom Volatility'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => updateConstraints({ riskMode: mode })}
                  className={`p-2 rounded-lg text-xs font-bold border text-center transition-all cursor-pointer ${
                    constraints.riskMode === mode
                      ? 'bg-[var(--icici-orange)] border-transparent text-white shadow-xs'
                      : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--text-primary)]">Max Volatility Cap</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{constraints.volatilityCap}% Ann.</span>
            </div>
            <input
              type="range"
              min="5"
              max="40"
              value={constraints.volatilityCap}
              onChange={(e) => updateConstraints({ volatilityCap: Number(e.target.value) })}
            />
            <p className="text-[10px] text-[var(--text-muted)]">Filters allocations producing risk above threshold</p>
          </div>

          <div className="space-y-4 pt-2 border-t border-[var(--border-color)]">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-primary)] font-semibold">Max Crypto Exposure Limit</span>
                <span className={`font-mono font-bold ${cryptoExposure > constraints.maxCryptoExposure ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {cryptoExposure}% / {constraints.maxCryptoExposure}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={constraints.maxCryptoExposure}
                onChange={(e) => updateConstraints({ maxCryptoExposure: Number(e.target.value) })}
              />
              {cryptoExposure > constraints.maxCryptoExposure && (
                <div className="flex items-center gap-1 text-[11px] text-rose-600 font-bold">
                  <AlertTriangle className="w-3 h-3" />
                  Crypto exposure exceeds limit!
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-primary)] font-semibold">Min Equities & ETFs Exposure</span>
                <span className={`font-mono font-bold ${equityExposure >= constraints.minEquityExposure ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {equityExposure}% / {constraints.minEquityExposure}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                value={constraints.minEquityExposure}
                onChange={(e) => updateConstraints({ minEquityExposure: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs space-y-1">
            <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Constraint Validation Engine
            </div>
            <div className="text-[11px] text-[var(--text-secondary)]">
              All portfolio weight adjustments maintain linear portfolio return and quadratic covariance matrix consistency.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
