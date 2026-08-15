import React, { useState, useMemo } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { getHistoricalPrices } from '../services/api';
import type { HistoricalDataPoint } from '../services/mockData';
import {
  ResponsiveContainer,
  AreaChart,
  Area
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
  TrendingUp,
  TrendingDown,
  Filter,
  BookOpen,
  X
} from 'lucide-react';

export const PortfolioBuilder: React.FC = () => {
  const {
    assets,
    constraints,
    updateAssetWeight,
    toggleAssetLock,
    normalizeWeights,
    addAssetToPortfolio,
    removeAssetFromPortfolio,
    applyOptimization,
    updateConstraints,
    openDocForAsset,
    isLoading
  } = usePortfolio();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [showTop5Only, setShowTop5Only] = useState<boolean>(true);

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

  const filteredSearchCandidates = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return assets.filter(a =>
      a.ticker.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q)
    );
  }, [assets, searchQuery]);

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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[var(--icici-orange)]" />
              Interactive Asset Allocation Cards
            </h2>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowTop5Only(!showTop5Only)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  showTop5Only
                    ? 'bg-[var(--icici-orange)] text-white border-transparent shadow-xs'
                    : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Filter className="w-3 h-3" />
                {showTop5Only ? 'Top 5 per Category' : 'Show All Instruments'}
              </button>

              <div className="flex items-center gap-1 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-1 flex-wrap">
                {['ALL', 'Equities', 'Bonds', 'Commodities', 'ETFs', 'Crypto', 'Forex'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategoryFilter(cat);
                      setSearchQuery('');
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      selectedCategoryFilter === cat ? 'bg-[var(--icici-orange)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Autocomplete Search Bar */}
          <div className="relative">
            <div className="flex items-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg px-3 py-2.5 focus-within:border-[var(--icici-orange)] transition-all">
              <Search className="w-4 h-4 text-[var(--text-muted)] mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Live Search ticker or company name (e.g., Reliance, HDFC, Apple, BTC, IN10Y)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {searchQuery.trim() && filteredSearchCandidates.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-2xl z-30 max-h-48 overflow-y-auto">
                {filteredSearchCandidates.map(cand => (
                  <div
                    key={cand.ticker}
                    onClick={() => {
                      addAssetToPortfolio(cand);
                    }}
                    className="p-2.5 hover:bg-[var(--bg-card-hover)] flex items-center justify-between cursor-pointer text-xs border-b border-[var(--border-color)]"
                  >
                    <div>
                      <span className="font-bold text-[var(--text-primary)] mr-2 font-mono">{cand.ticker}</span>
                      <span className="text-[var(--text-secondary)] text-[11px]">{cand.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)] font-semibold">{cand.category}</span>
                      <span className="text-xs text-[var(--icici-orange)] font-bold flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" />
                        {cand.weight > 0 ? `${cand.weight}%` : 'Activate (10%)'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Asset Cards Grid */}
          {displayedAssets.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-color)]">
              No securities match &quot;<span className="text-[var(--text-primary)] font-semibold">{searchQuery}</span>&quot; in category &quot;{selectedCategoryFilter}&quot;.
              <div className="mt-3">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategoryFilter('ALL');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[var(--icici-orange)] text-white text-xs font-bold hover:bg-[var(--icici-orange-hover)] transition-colors cursor-pointer"
                >
                  Clear Search & View All Securities
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {displayedAssets.map(asset => (
                <div
                  key={asset.ticker}
                  className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--icici-orange)] transition-all flex flex-col justify-between space-y-3 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleAssetLock(asset.ticker)}
                        className={`p-1 rounded transition-colors ${asset.isLocked ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                        title={asset.isLocked ? 'Locked (Excluded from Auto-Normalize)' : 'Unlocked'}
                      >
                        {asset.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: asset.color }} />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[var(--text-primary)] font-mono text-sm">{asset.ticker}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)] font-semibold">{asset.category}</span>
                          <button
                            onClick={() => openDocForAsset(asset.name)}
                            className="text-[var(--text-muted)] hover:text-[var(--icici-orange)] transition-colors p-0.5"
                            title={`Read Financial Theory Docs for ${asset.name}`}
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)] line-clamp-1">{asset.name}</div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-[var(--text-primary)] text-sm">
                        {asset.currency}{asset.price < 1 ? asset.price.toString() : asset.price.toLocaleString()}
                      </div>
                      <div className={`text-[11px] font-bold flex items-center justify-end gap-0.5 ${asset.change24h >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {asset.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
                      </div>
                    </div>
                  </div>

                  {/* Sparkline Chart */}
                  <div className="h-14 w-full bg-[var(--bg-tertiary)] rounded-lg p-1 border border-[var(--border-color)]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getSparklineData(asset.ticker)}>
                        <defs>
                          <linearGradient id={`grad_${asset.ticker}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={asset.change24h >= 0 ? '#16a34a' : '#dc2626'} stopOpacity={0.35}/>
                            <stop offset="100%" stopColor={asset.change24h >= 0 ? '#16a34a' : '#dc2626'} stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="price"
                          stroke={asset.change24h >= 0 ? '#16a34a' : '#dc2626'}
                          strokeWidth={1.8}
                          fill={`url(#grad_${asset.ticker})`}
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Controls */}
                  <div className="space-y-2 pt-1 border-t border-[var(--border-color)]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-secondary)] text-[11px]">
                        Vol: <span className="text-[var(--text-primary)] font-mono">{asset.annualizedVol}%</span>
                      </span>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={asset.weight}
                            onChange={(e) => updateAssetWeight(asset.ticker, Number(e.target.value))}
                            className="w-14 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded px-1.5 py-0.5 text-xs text-right font-mono font-bold text-[var(--icici-orange)] focus:outline-none focus:border-[var(--icici-orange)]"
                          />
                          <span className="text-xs text-[var(--text-secondary)] font-bold">%</span>
                        </div>
                        {asset.weight > 0 && (
                          <button
                            onClick={() => removeAssetFromPortfolio(asset.ticker)}
                            className="text-[var(--text-muted)] hover:text-rose-600 transition-colors p-1 cursor-pointer"
                            title="Remove asset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.5"
                      value={asset.weight}
                      onChange={(e) => updateAssetWeight(asset.ticker, Number(e.target.value))}
                    />
                  </div>
                </div>
              ))}
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
