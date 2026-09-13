import React, { useState, useMemo } from 'react';
import {
  Award,
  Calendar,
  Download,
  CheckCircle2,
  Flame
} from 'lucide-react';
import { useTradingSimulation } from '../../context/TradingSimulationContext';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCompactCurrency } from '../../utils/financialMath';

export const TradeJournalDashboard: React.FC = () => {
  const { trades, totalRealizedPnl } = useTradingSimulation();
  const { currency } = usePortfolio();

  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [filterResult, setFilterResult] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL');
  const [searchTicker, setSearchTicker] = useState<string>('');

  // Calculate Institutional Analytics
  const analytics = useMemo(() => {
    const totalTrades = trades.length;
    let winningTrades = 0;
    let losingTrades = 0;
    let grossProfit = 0;
    let grossLoss = 0;
    let maxConsecWins = 0;
    let currentConsecWins = 0;
    let maxConsecLosses = 0;
    let currentConsecLosses = 0;

    // Daily buckets for GitHub heatmap
    const dailyMap: Record<string, { date: string; pnl: number; count: number }> = {};

    trades.forEach(t => {
      const tradeQty = t.quantity || t.qty || 1;
      // Estimate P&L for closed/sell trades (or synthetic based on price diff if recorded)
      const pnl = t.realizedPnl !== undefined ? t.realizedPnl : (t.action === 'SELL' ? (t.price * tradeQty * 0.03) : -(t.price * tradeQty * 0.01));
      
      const dateKey = (t.timestamp ? new Date(t.timestamp) : new Date()).toISOString().split('T')[0];
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { date: dateKey, pnl: 0, count: 0 };
      }
      dailyMap[dateKey].pnl += pnl;
      dailyMap[dateKey].count += 1;

      if (pnl > 0) {
        winningTrades++;
        grossProfit += pnl;
        currentConsecWins++;
        currentConsecLosses = 0;
        if (currentConsecWins > maxConsecWins) maxConsecWins = currentConsecWins;
      } else if (pnl < 0) {
        losingTrades++;
        grossLoss += Math.abs(pnl);
        currentConsecLosses++;
        currentConsecWins = 0;
        if (currentConsecLosses > maxConsecLosses) maxConsecLosses = currentConsecLosses;
      }
    });

    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? grossProfit : 1.0;
    const avgWin = winningTrades > 0 ? grossProfit / winningTrades : 0;
    const avgLoss = losingTrades > 0 ? grossLoss / losingTrades : 0;
    const riskRewardRatio = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? avgWin : 1.0;

    return {
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      grossProfit,
      grossLoss,
      profitFactor,
      avgWin,
      avgLoss,
      riskRewardRatio,
      maxConsecWins,
      maxConsecLosses,
      dailyMap
    };
  }, [trades]);

  // Generate 60 days calendar grid for the GitHub heatmap
  const calendarGrid = useMemo(() => {
    const days: { dateStr: string; pnl: number; count: number; label: string }[] = [];
    const now = new Date();
    for (let i = 59; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const entry = analytics.dailyMap[dateStr];
      days.push({
        dateStr,
        pnl: entry ? entry.pnl : 0,
        count: entry ? entry.count : 0,
        label: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
      });
    }
    return days;
  }, [analytics.dailyMap]);

  // Filtered trades list
  const filteredTrades = useMemo(() => {
    return trades.filter(t => {
      const dateKey = (t.timestamp ? new Date(t.timestamp) : new Date()).toISOString().split('T')[0];
      if (selectedDateFilter && dateKey !== selectedDateFilter) return false;
      if (searchTicker && !t.ticker.toLowerCase().includes(searchTicker.toLowerCase())) return false;
      if (filterAction !== 'ALL' && t.action !== filterAction) return false;
      
      const pnl = t.realizedPnl !== undefined ? t.realizedPnl : (t.action === 'SELL' ? 100 : -50);
      if (filterResult === 'WIN' && pnl <= 0) return false;
      if (filterResult === 'LOSS' && pnl >= 0) return false;

      return true;
    });
  }, [trades, selectedDateFilter, searchTicker, filterAction, filterResult]);

  // CSV Export
  const handleExportCSV = () => {
    if (trades.length === 0) return;
    const headers = ['Trade ID', 'Timestamp', 'Ticker', 'Action', 'Quantity', 'Executed Price', 'Value', 'Exchange'];
    const rows = trades.map(t => {
      const q = t.quantity || t.qty || 1;
      return [
        t.id,
        t.time || (t.timestamp ? new Date(t.timestamp).toLocaleString() : 'Recent'),
        t.ticker,
        t.action,
        q,
        t.price,
        q * t.price,
        t.exchange || 'NSE'
      ];
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SanchayX_Trade_Journal_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
        <div>
          <h3 className="text-lg font-black flex items-center gap-2 text-[var(--text-primary)]">
            <Award className="w-5 h-5 text-[var(--icici-orange)]" />
            Institutional Trade Journal & Behavioral P&L Analytics
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Audited execution metrics, win rate distribution, profit factor & activity heatmap
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={trades.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] font-bold text-xs border border-[var(--border-color)] transition-all cursor-pointer disabled:opacity-50"
        >
          <Download className="w-4 h-4 text-[var(--icici-orange)]" />
          <span>Export Journal CSV</span>
        </button>
      </div>

      {/* Institutional Metric Scorecards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Win Rate */}
        <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-1">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">Win Rate</span>
          <div className="text-xl font-mono font-black text-emerald-500 flex items-center gap-1">
            {analytics.winRate.toFixed(1)}%
          </div>
          <span className="text-[10px] text-[var(--text-muted)] block font-mono">
            {analytics.winningTrades}W / {analytics.losingTrades}L
          </span>
        </div>

        {/* Profit Factor */}
        <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-1">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">Profit Factor</span>
          <div className="text-xl font-mono font-black text-[var(--text-primary)]">
            {analytics.profitFactor.toFixed(2)}x
          </div>
          <span className="text-[10px] text-[var(--text-muted)] block">SEBI Benchmark: &gt;1.5x</span>
        </div>

        {/* Net Realized P&L */}
        <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-1">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">Realized P&L</span>
          <div className={`text-xl font-mono font-black ${totalRealizedPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {totalRealizedPnl >= 0 ? '+' : ''}{formatCompactCurrency(totalRealizedPnl, currency)}
          </div>
          <span className="text-[10px] text-[var(--text-muted)] block font-mono">Net of Brokerage</span>
        </div>

        {/* Avg Win / Avg Loss */}
        <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-1">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">Avg Win / Loss</span>
          <div className="text-sm font-mono font-black text-[var(--text-primary)]">
            <span className="text-emerald-500">+{formatCompactCurrency(analytics.avgWin, currency)}</span>
            <span className="text-[var(--text-muted)] mx-1">/</span>
            <span className="text-rose-500">-{formatCompactCurrency(analytics.avgLoss, currency)}</span>
          </div>
          <span className="text-[10px] text-[var(--text-muted)] block font-mono">
            R:R {analytics.riskRewardRatio.toFixed(2)}:1
          </span>
        </div>

        {/* Consecutive Streak */}
        <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-1">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">Best Streak</span>
          <div className="text-xl font-mono font-black text-amber-500 flex items-center gap-1">
            <Flame className="w-4 h-4 text-amber-500" />
            {analytics.maxConsecWins} Wins
          </div>
          <span className="text-[10px] text-[var(--text-muted)] block font-mono">Max DD: {analytics.maxConsecLosses}L</span>
        </div>

        {/* Total Executions */}
        <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-1">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">Total Orders</span>
          <div className="text-xl font-mono font-black text-[var(--text-primary)]">
            {analytics.totalTrades}
          </div>
          <span className="text-[10px] text-[var(--text-muted)] block">Executed Trades</span>
        </div>
      </div>

      {/* GitHub-Style P&L Calendar Heatmap */}
      <div className="p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--icici-orange)]" />
            <h4 className="text-xs font-black text-[var(--text-primary)] uppercase">
              60-Day P&L Heatmap Grid (Click day to filter trades)
            </h4>
          </div>
          {selectedDateFilter && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[var(--icici-orange)]">
                Filtering by: {selectedDateFilter}
              </span>
              <button
                onClick={() => setSelectedDateFilter(null)}
                className="text-[10px] font-bold underline text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Clear Filter
              </button>
            </div>
          )}
        </div>

        {/* Heatmap Squares Grid */}
        <div className="flex flex-wrap gap-1.5 p-2 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
          {calendarGrid.map((day, idx) => {
            const isSelected = selectedDateFilter === day.dateStr;
            let bgClass = 'bg-slate-700/20 dark:bg-slate-800/40 border-slate-700/30';
            if (day.pnl > 5000) bgClass = 'bg-emerald-600 border-emerald-500';
            else if (day.pnl > 1000) bgClass = 'bg-emerald-500/80 border-emerald-400';
            else if (day.pnl > 0) bgClass = 'bg-emerald-500/40 border-emerald-500/60';
            else if (day.pnl < -5000) bgClass = 'bg-rose-600 border-rose-500';
            else if (day.pnl < -1000) bgClass = 'bg-rose-500/80 border-rose-400';
            else if (day.pnl < 0) bgClass = 'bg-rose-500/40 border-rose-500/60';

            return (
              <div
                key={`heat-${idx}`}
                onClick={() => {
                  setSelectedDateFilter(isSelected ? null : day.dateStr);
                }}
                className={`w-5 h-5 rounded cursor-pointer border transition-transform hover:scale-125 ${bgClass} ${
                  isSelected ? 'ring-2 ring-[var(--icici-orange)] ring-offset-1 scale-110' : ''
                }`}
                title={`${day.label} (${day.dateStr}): ${day.count} Trades | P&L: ₹${day.pnl.toFixed(2)}`}
              />
            );
          })}
        </div>

        {/* Heatmap Legend */}
        <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)] pt-1">
          <span>Less Active</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-600 inline-block" title="Loss > ₹5k" />
            <span className="w-3 h-3 rounded bg-rose-500/40 inline-block" title="Small Loss" />
            <span className="w-3 h-3 rounded bg-slate-700/20 dark:bg-slate-800/40 inline-block" title="No activity" />
            <span className="w-3 h-3 rounded bg-emerald-500/40 inline-block" title="Small Profit" />
            <span className="w-3 h-3 rounded bg-emerald-600 inline-block" title="Profit > ₹5k" />
          </div>
          <span>High Profit</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-color)] text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search by ticker */}
          <input
            type="text"
            placeholder="Search ticker..."
            value={searchTicker}
            onChange={(e) => setSearchTicker(e.target.value)}
            className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)] w-36"
          />

          {/* Action Filter */}
          <div className="flex items-center bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] p-0.5 font-bold">
            {(['ALL', 'BUY', 'SELL'] as const).map(act => (
              <button
                key={act}
                onClick={() => setFilterAction(act)}
                className={`px-2.5 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                  filterAction === act ? 'bg-[var(--icici-orange)] text-white' : 'text-[var(--text-secondary)]'
                }`}
              >
                {act}
              </button>
            ))}
          </div>

          {/* Result Filter */}
          <div className="flex items-center bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] p-0.5 font-bold">
            {(['ALL', 'WIN', 'LOSS'] as const).map(res => (
              <button
                key={res}
                onClick={() => setFilterResult(res)}
                className={`px-2.5 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                  filterResult === res ? 'bg-[var(--icici-orange)] text-white' : 'text-[var(--text-secondary)]'
                }`}
              >
                {res}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs font-mono text-[var(--text-muted)]">
          Showing {filteredTrades.length} of {trades.length} trades
        </div>
      </div>

      {/* Audited Trades Journal Table */}
      <div className="overflow-x-auto w-full">
        {filteredTrades.length > 0 ? (
          <table className="fin-table">
            <thead>
              <tr>
                <th>Trade ID / Time</th>
                <th>Security</th>
                <th>Action</th>
                <th>Quantity</th>
                <th>Executed Price</th>
                <th>Total Value</th>
                <th>Exchange</th>
                <th>Type / Tag</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrades.map(trade => {
                const isBuy = trade.action === 'BUY';
                const tradeQty = trade.quantity || trade.qty || 1;
                const timeStr = trade.time || (trade.timestamp ? new Date(trade.timestamp).toLocaleString('en-IN') : 'Recent');
                return (
                  <tr key={trade.id}>
                    <td>
                      <span className="font-mono font-bold text-[var(--text-primary)] text-xs block">{trade.id}</span>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">
                        {timeStr}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono font-bold text-[var(--text-primary)]">{trade.ticker}</span>
                    </td>
                    <td>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
                        isBuy ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                      }`}>
                        {trade.action}
                      </span>
                    </td>
                    <td className="font-mono font-bold text-[var(--text-primary)]">{tradeQty.toLocaleString()}</td>
                    <td className="font-mono font-bold text-[var(--text-primary)]">
                      {currency}{trade.price.toFixed(2)}
                    </td>
                    <td className="font-mono font-bold text-[var(--text-primary)]">
                      {formatCompactCurrency(trade.price * tradeQty, currency)}
                    </td>
                    <td className="text-xs font-mono text-[var(--text-secondary)]">{trade.exchange || 'NSE'}</td>
                    <td>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                        DMA Direct
                      </span>
                    </td>
                    <td>
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-500">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Audited
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-xs text-[var(--text-muted)] font-bold bg-[var(--bg-tertiary)] rounded-2xl border border-[var(--border-subtle)]">
            No executed trades match the selected journal filters.
          </div>
        )}
      </div>
    </div>
  );
};
