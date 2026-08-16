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
  Bot
} from 'lucide-react';

export const MarketExplorerPage: React.FC = () => {
  const { assets, isLiveApi, toggleApiMode, exportReportPDF, exportReportCSV, openDocForAsset } = usePortfolio();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showTop5Only, setShowTop5Only] = useState<boolean>(true);

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
    <div className="p-4 lg:p-6 space-y-6 w-full">
      {/* Top Section: API Connection Monitor & Pipeline Status */}
      <div className="glass-card p-5 space-y-4 w-full">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Server className="w-5 h-5 text-[var(--icici-orange)]" />
              REST API Data Pipeline & Connection Monitor
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Real-time Market Data Feeds (NSE India, RBI G-Secs, NASDAQ, Global Crypto & Forex Endpoints)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleApiMode}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isLiveApi
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-300'
                  : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Radio className={`w-4 h-4 ${isLiveApi ? 'animate-pulse text-emerald-500' : 'text-[var(--text-muted)]'}`} />
              {isLiveApi ? 'Live API Mode Active' : 'Offline Research Sandbox Active'}
            </button>
          </div>
        </div>

        {/* API Diagnostics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-[var(--border-color)] w-full">
          <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isLiveApi ? 'bg-emerald-500/20 text-emerald-500' : 'bg-blue-500/20 text-blue-500'}`}>
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Endpoint Latency</div>
              <div className="text-xs font-mono font-bold text-[var(--text-primary)]">
                {isLiveApi ? '42 ms (Live REST)' : '0 ms (Local Memory)'}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Pipeline Health</div>
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">100% Operational</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-500">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Last Price Sync</div>
              <div className="text-xs font-mono font-bold text-[var(--text-primary)]">Just Now</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Markets Tracked</div>
              <div className="text-xs font-mono font-bold text-[var(--text-primary)]">NSE Equities, 20Y Gold DB, RBI G-Secs, Indian Bonds DB</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table: Securities Explorer & Price Grid */}
      <div className="glass-card p-5 space-y-4 w-full">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Globe className="w-4 h-4 text-[var(--icici-orange)]" />
            Securities Catalog ({displayedAssets.length} Displayed)
          </h3>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowTop5Only(!showTop5Only)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                showTop5Only
                  ? 'bg-[var(--icici-orange)] text-white border-transparent shadow-xs'
                  : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Filter className="w-3 h-3" />
              {showTop5Only ? 'Top 5 per Instrument' : 'Show All Securities'}
            </button>

            <div className="flex items-center gap-1 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-1 flex-wrap">
              {['ALL', 'Equities', 'Bonds', 'Commodities', 'ETFs', 'Crypto', 'Forex'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === cat ? 'bg-[var(--icici-orange)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
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
                  <td className="font-mono font-bold text-[var(--text-primary)]">{asset.ticker}</td>
                  <td className="text-[var(--text-secondary)]">{asset.name}</td>
                  <td>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                      {asset.category}
                    </span>
                  </td>
                  <td className="text-xs text-[var(--text-muted)] font-mono">{asset.market}</td>
                  <td className="font-mono font-bold text-[var(--text-primary)]">
                    {asset.currency}{asset.price < 1 ? asset.price.toString() : asset.price.toLocaleString()}
                  </td>
                  <td>
                    <span className={`inline-flex items-center gap-1 font-mono font-bold text-xs ${asset.change24h >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {asset.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
                    </span>
                  </td>
                  <td className="font-mono text-[var(--text-secondary)]">{asset.annualizedVol}%</td>
                  <td className="font-mono text-[var(--text-secondary)]">{asset.beta}</td>
                  <td className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{asset.weight}%</td>
                  <td>
                    <button
                      onClick={() => openDocForAsset(asset.name)}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 transition-colors cursor-pointer font-bold"
                      title={`Ask AI Chatbot about ${asset.name}`}
                    >
                      <Bot className="w-3 h-3 text-emerald-500" />
                      Ask AI
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
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Download className="w-4 h-4 text-purple-500" />
            Quantitative Report Export Hub
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Export comprehensive multi-asset portfolio metrics, weights, and trade logs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportReportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            Export Raw CSV Data
          </button>
          <button
            onClick={exportReportPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--icici-orange)] hover:bg-[var(--icici-orange-hover)] text-white shadow-md transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Generate PDF Analysis Report
          </button>
        </div>
      </div>
    </div>
  );
};
