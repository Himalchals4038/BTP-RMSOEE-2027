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

  // Compute 30-day mini sparkline dataset for any ticker
  const getSparklineData = (ticker: string) => {
    if (history.length === 0) return [];
    const slice = history.slice(-30);
    return slice.map((row: HistoricalDataPoint) => ({
      date: row.date,
      price: (row[ticker] as number) || 100
    }));
  };

  // Total current weight sum
  const totalWeightSum = useMemo(() => {
    return Number(assets.reduce((sum, a) => sum + a.weight, 0).toFixed(2));
  }, [assets]);

  // Autocomplete search candidate assets
  const filteredSearchCandidates = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return assets.filter(a =>
      a.ticker.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q)
    );
  }, [assets, searchQuery]);

  // Main Asset Card Grid display (filtered dynamically by searchQuery)
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

  // Compute category exposure sums
  const cryptoExposure = useMemo(() => {
    const cryptoSum = assets.filter(a => a.category === 'Crypto').reduce((sum, a) => sum + a.weight, 0);
    return Number(cryptoSum.toFixed(1));
  }, [assets]);

  const equityExposure = useMemo(() => {
    const eqSum = assets.filter(a => a.category === 'Equities' || a.category === 'ETFs').reduce((sum, a) => sum + a.weight, 0);
    return Number(eqSum.toFixed(1));
  }, [assets]);

  return (
    <div className="p-6 space-y-6 w-full">
      {/* Top Banner: One-Click Quantitative Optimizers */}
      <div className="glass-card p-5 space-y-4 w-full">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              One-Click Quantitative Portfolio Optimizers
            </h2>
            <p className="text-xs text-slate-400">
              Automated Modern Portfolio Theory (MPT) & Risk Parity Solver Engines
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={normalizeWeights}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 border border-slate-700 text-blue-400 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Auto-Normalize to 100%
            </button>
            <div className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border ${
              totalWeightSum === 100
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
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
            className="p-3 rounded-xl bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 hover:border-emerald-500 text-left transition-all hover:scale-[1.02] cursor-pointer"
          >
            <div className="text-xs font-bold text-emerald-400 flex items-center justify-between">
              Max Sharpe Ratio
              <Target className="w-4 h-4" />
            </div>
            <div className="text-[11px] text-slate-300 mt-1">Maximizes Risk-Adjusted Returns</div>
          </button>

          <button
            onClick={() => applyOptimization('min_variance')}
            disabled={isLoading}
            className="p-3 rounded-xl bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 hover:border-blue-500 text-left transition-all hover:scale-[1.02] cursor-pointer"
          >
            <div className="text-xs font-bold text-blue-400 flex items-center justify-between">
              Minimum Variance
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-[11px] text-slate-300 mt-1">Minimizes Portfolio Volatility</div>
          </button>

          <button
            onClick={() => applyOptimization('risk_parity')}
            disabled={isLoading}
            className="p-3 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 hover:border-purple-500 text-left transition-all hover:scale-[1.02] cursor-pointer"
          >
            <div className="text-xs font-bold text-purple-400 flex items-center justify-between">
              Risk Parity Weighting
              <Sliders className="w-4 h-4" />
            </div>
            <div className="text-[11px] text-slate-300 mt-1">Equal Volatility Risk Contribution</div>
          </button>

          <button
            onClick={() => applyOptimization('equal_weight')}
            disabled={isLoading}
            className="p-3 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 hover:border-slate-600 text-left transition-all hover:scale-[1.02] cursor-pointer"
          >
            <div className="text-xs font-bold text-slate-200 flex items-center justify-between">
              Equal Weight (1/N)
              <RefreshCw className="w-4 h-4" />
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Uniform 1/N Asset Split</div>
          </button>
        </div>
      </div>

      {/* Main Grid: Asset Allocator Table + Constraint Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Asset Weight Sliders & Search in Responsive Grid (2 cols) */}
        <div className="lg:col-span-2 glass-card p-5 space-y-4 w-full">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-400" />
              Interactive Asset Allocation Cards
            </h2>

            <div className="flex items-center gap-2">
              {/* Top 5 View Toggle */}
              <button
                onClick={() => setShowTop5Only(!showTop5Only)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  showTop5Only
                    ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Filter className="w-3 h-3 text-blue-400" />
                {showTop5Only ? 'Top 5 per Category' : 'Show All Instruments'}
              </button>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 flex-wrap">
                {['ALL', 'Crypto', 'Equities', 'Bonds', 'ETFs', 'Forex', 'Commodities'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategoryFilter(cat);
                      setSearchQuery('');
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                      selectedCategoryFilter === cat ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Autocomplete & Instant Filter Ticker Search Bar */}
          <div className="relative">
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 focus-within:border-blue-500 transition-all">
              <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Live Search ticker or company name (e.g., HDFC Bank, NVIDIA, BTC, ETH, IN10Y)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown Candidate Suggestions */}
            {searchQuery.trim() && filteredSearchCandidates.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-30 max-h-48 overflow-y-auto">
                {filteredSearchCandidates.map(cand => (
                  <div
                    key={cand.ticker}
                    onClick={() => {
                      addAssetToPortfolio(cand);
                    }}
                    className="p-2.5 hover:bg-slate-800 flex items-center justify-between cursor-pointer text-xs border-b border-slate-800/50"
                  >
                    <div>
                      <span className="font-bold text-white mr-2 font-mono">{cand.ticker}</span>
                      <span className="text-slate-300 text-[11px]">{cand.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">{cand.category}</span>
                      <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
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
            <div className="py-12 text-center text-xs text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800">
              No securities match &quot;<span className="text-white font-semibold">{searchQuery}</span>&quot; in category &quot;{selectedCategoryFilter}&quot;.
              <div className="mt-3">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategoryFilter('ALL');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-colors"
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
                  className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3 shadow-md"
                >
                  {/* Header info */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleAssetLock(asset.ticker)}
                        className={`p-1 rounded transition-colors ${asset.isLocked ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
                        title={asset.isLocked ? 'Locked (Excluded from Auto-Normalize)' : 'Unlocked'}
                      >
                        {asset.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: asset.color }} />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white font-mono text-sm">{asset.ticker}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">{asset.category}</span>
                          <button
                            onClick={() => openDocForAsset(asset.name)}
                            className="text-slate-500 hover:text-blue-400 transition-colors p-0.5"
                            title={`Read Wikipedia & Financial Theory Docs for ${asset.name}`}
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">{asset.name}</div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-slate-100 text-sm">
                        {asset.currency}{asset.price < 1 ? asset.price.toString() : asset.price.toLocaleString()}
                      </div>
                      <div className={`text-[11px] font-bold flex items-center justify-end gap-0.5 ${asset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {asset.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
                      </div>
                    </div>
                  </div>

                  {/* 30-Day Mini Price Sparkline Chart */}
                  <div className="h-14 w-full bg-slate-950/70 rounded-lg p-1 border border-slate-800">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getSparklineData(asset.ticker)}>
                        <defs>
                          <linearGradient id={`grad_${asset.ticker}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={asset.change24h >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0.35}/>
                            <stop offset="100%" stopColor={asset.change24h >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="price"
                          stroke={asset.change24h >= 0 ? '#10b981' : '#ef4444'}
                          strokeWidth={1.8}
                          fill={`url(#grad_${asset.ticker})`}
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Sliders & Weight Controls Footer */}
                  <div className="space-y-2 pt-1 border-t border-slate-800/60">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">
                        Vol: <span className="text-slate-200 font-mono">{asset.annualizedVol}%</span>
                      </span>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={asset.weight}
                            onChange={(e) => updateAssetWeight(asset.ticker, Number(e.target.value))}
                            className="w-14 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-right font-mono font-bold text-emerald-400 focus:outline-none focus:border-blue-500"
                          />
                          <span className="text-xs text-slate-400 font-bold">%</span>
                        </div>
                        {asset.weight > 0 && (
                          <button
                            onClick={() => removeAssetFromPortfolio(asset.ticker)}
                            className="text-slate-600 hover:text-rose-400 transition-colors p-1 cursor-pointer"
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
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Risk & Exposure Constraints
            </h2>
            <p className="text-xs text-slate-400">Custom Boundaries for Portfolio Allocator</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Risk Profile Mode</label>
            <div className="grid grid-cols-2 gap-2">
              {(['Conservative', 'Balanced', 'Aggressive', 'Custom Volatility'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => updateConstraints({ riskMode: mode })}
                  className={`p-2 rounded-lg text-xs font-medium border text-center transition-all ${
                    constraints.riskMode === mode
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Max Volatility Cap</span>
              <span className="font-mono font-bold text-amber-400">{constraints.volatilityCap}% Ann.</span>
            </div>
            <input
              type="range"
              min="5"
              max="40"
              value={constraints.volatilityCap}
              onChange={(e) => updateConstraints({ volatilityCap: Number(e.target.value) })}
            />
            <p className="text-[10px] text-slate-500">Filters allocations producing risk above threshold</p>
          </div>

          <div className="space-y-4 pt-2 border-t border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Max Crypto Exposure Limit</span>
                <span className={`font-mono font-bold ${cryptoExposure > constraints.maxCryptoExposure ? 'text-rose-400' : 'text-emerald-400'}`}>
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
                <div className="flex items-center gap-1 text-[11px] text-rose-400">
                  <AlertTriangle className="w-3 h-3" />
                  Crypto exposure exceeds limit!
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Min Equities & ETFs Exposure</span>
                <span className={`font-mono font-bold ${equityExposure >= constraints.minEquityExposure ? 'text-emerald-400' : 'text-amber-400'}`}>
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

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Constraint Validation Engine
            </div>
            <div className="text-[11px] text-slate-400">
              All portfolio weight adjustments maintain linear portfolio return and quadratic covariance matrix consistency.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
