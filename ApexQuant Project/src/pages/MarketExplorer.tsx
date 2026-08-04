import React, { useState, useMemo } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import {
  Globe,
  Radio,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Server,
  Zap,
  Clock,
  Filter,
  BookOpen
} from 'lucide-react';

export const MarketExplorerPage: React.FC = () => {
  const { assets, isLiveApi, toggleApiMode, exportReportPDF, exportReportCSV, openDocForAsset } = usePortfolio();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showTop5Only, setShowTop5Only] = useState<boolean>(true);

  // Optimized list: focus on Top 5 from each market category by default
  const displayedAssets = useMemo(() => {
    let filtered = assets.filter(a => {
      if (selectedCategory === 'ALL') return true;
      return a.category === selectedCategory;
    });

    if (showTop5Only) {
      if (selectedCategory === 'ALL') {
        const categoryMap: Record<string, typeof assets> = {};
        filtered.forEach(a => {
          categoryMap[a.category] = categoryMap[a.category] || [];
          if (categoryMap[a.category].length < 5) {
            categoryMap[a.category].push(a);
          }
        });
        return Object.values(categoryMap).flat();
      } else {
        return filtered.slice(0, 5);
      }
    }

    return filtered;
  }, [assets, selectedCategory, showTop5Only]);

  return (
    <div className="p-6 space-y-6 w-full">
      {/* Top Section: API Connection Monitor & Pipeline Status */}
      <div className="glass-card p-5 space-y-4 w-full">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-400" />
              REST API Data Pipeline & Connection Monitor
            </h2>
            <p className="text-xs text-slate-400">
              Real-time Market Data Feeds (NSE India, RBI G-Secs, NASDAQ, Global Crypto & Forex Endpoints)
            </p>
          </div>

          {/* Mode Switch Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleApiMode}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isLiveApi
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 glow-emerald'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Radio className={`w-4 h-4 ${isLiveApi ? 'animate-pulse text-emerald-400' : 'text-slate-400'}`} />
              {isLiveApi ? 'Live API Mode Active' : 'Offline Research Sandbox Active'}
            </button>
          </div>
        </div>

        {/* API Diagnostics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-slate-800 w-full">
          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isLiveApi ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Endpoint Latency</div>
              <div className="text-xs font-mono font-bold text-white">
                {isLiveApi ? '42 ms (Live REST)' : '0 ms (Local Memory)'}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Pipeline Health</div>
              <div className="text-xs font-bold text-emerald-400">100% Operational</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Last Price Sync</div>
              <div className="text-xs font-mono font-bold text-slate-200">Just Now</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Markets Tracked</div>
              <div className="text-xs font-mono font-bold text-white">NSE Debt, RBI, US, Crypto, FX</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table: Securities Explorer & Price Grid */}
      <div className="glass-card p-5 space-y-4 w-full">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            Securities Catalog ({displayedAssets.length} Displayed)
          </h3>

          <div className="flex items-center gap-3">
            {/* Top 5 Filter Toggle */}
            <button
              onClick={() => setShowTop5Only(!showTop5Only)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                showTop5Only
                  ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Filter className="w-3 h-3 text-blue-400" />
              {showTop5Only ? 'Top 5 per Instrument' : 'Show All Securities'}
            </button>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 flex-wrap">
              {['ALL', 'Crypto', 'Equities', 'Bonds', 'ETFs', 'Forex', 'Commodities'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                    selectedCategory === cat ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="fin-table">
            <thead>
              <tr>
                <th>Ticker Symbol</th>
                <th>Security Name</th>
                <th>Category</th>
                <th>Exchange / Market</th>
                <th>Current Price</th>
                <th>24h Change (%)</th>
                <th>Annualized Vol (%)</th>
                <th>Beta</th>
                <th>Weight</th>
                <th>Wiki Profile</th>
              </tr>
            </thead>
            <tbody>
              {displayedAssets.map(asset => (
                <tr key={asset.ticker}>
                  <td className="font-mono font-bold text-white">{asset.ticker}</td>
                  <td className="text-slate-200">{asset.name}</td>
                  <td>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300">
                      {asset.category}
                    </span>
                  </td>
                  <td className="text-xs text-slate-400 font-mono">{asset.market}</td>
                  <td className="font-mono font-bold text-slate-100">
                    {asset.currency}{asset.price < 1 ? asset.price.toString() : asset.price.toLocaleString()}
                  </td>
                  <td>
                    <span className={`inline-flex items-center gap-1 font-mono font-bold text-xs ${asset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {asset.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
                    </span>
                  </td>
                  <td className="font-mono text-slate-300">{asset.annualizedVol}%</td>
                  <td className="font-mono text-slate-300">{asset.beta}</td>
                  <td className="font-mono font-bold text-emerald-400">{asset.weight}%</td>
                  <td>
                    <button
                      onClick={() => openDocForAsset(asset.name)}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-blue-400 hover:bg-slate-700 transition-colors cursor-pointer"
                      title={`Read Wikipedia documentation profile for ${asset.name}`}
                    >
                      <BookOpen className="w-3 h-3 text-blue-400" />
                      Read Wiki
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Options Banner */}
      <div className="glass-card p-5 flex flex-wrap items-center justify-between gap-4 w-full">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Download className="w-4 h-4 text-purple-400" />
            Quantitative Report Export Hub
          </h3>
          <p className="text-xs text-slate-400">
            Export comprehensive multi-asset portfolio metrics, weights, and trade logs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportReportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Export Raw CSV Data
          </button>
          <button
            onClick={exportReportPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Generate PDF Analysis Report
          </button>
        </div>
      </div>
    </div>
  );
};
