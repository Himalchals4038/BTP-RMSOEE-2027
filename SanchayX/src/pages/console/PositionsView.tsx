import React from 'react';
import {
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useTradingSimulation } from '../../context/TradingSimulationContext';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCompactCurrency } from '../../utils/financialMath';
import { LivePriceCell } from '../../components/common/LivePriceCell';

interface PositionsViewProps {
  onTriggerPanic?: () => void;
}

export const PositionsView: React.FC<PositionsViewProps> = ({ onTriggerPanic }) => {
  const {
    positions,
    totalMtmPnl,
    totalRealizedPnl,
    totalUnrealizedPnl,
    squareOffPosition,
    panicSquareOffAllIntraday
  } = useTradingSimulation();
  const { currency } = usePortfolio();

  const handleSquareOff = (ticker: string) => {
    squareOffPosition(ticker);
  };

  const handlePanicSquareOff = () => {
    if (onTriggerPanic) {
      onTriggerPanic();
    } else {
      if (window.confirm('SEBI Panic Square-Off: Liquidate all intraday MIS open positions immediately at market?')) {
        panicSquareOffAllIntraday();
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
        <div>
          <h3 className="text-lg font-black flex items-center gap-2 text-[var(--text-primary)]">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            Live Intraday & F&O Open Positions
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Real-time mark-to-market (MTM) position tracking with isolated tick subscriptions & instant square-off
          </p>
        </div>

        <div className="flex items-center gap-2">
          {positions.length > 0 && (
            <button
              type="button"
              onClick={handlePanicSquareOff}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-md transition-all cursor-pointer animate-pulse"
              title="Panic Square-Off All MIS Positions [Shift+S]"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>PANIC SQUARE OFF [Shift+S]</span>
            </button>
          )}

          <span className="text-xs font-mono text-[var(--text-muted)] font-bold bg-[var(--bg-tertiary)] px-3 py-1.5 rounded-xl border border-[var(--border-color)]">
            {positions.length} Active Positions
          </span>
        </div>
      </div>

      {/* MTM Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">TOTAL MTM P&L</div>
          <div className={`text-2xl font-mono font-extrabold mt-1 ${totalMtmPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {totalMtmPnl >= 0 ? '+' : ''}{formatCompactCurrency(totalMtmPnl, currency)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
          <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">REALIZED P&L</div>
          <div className={`text-2xl font-mono font-extrabold mt-1 ${totalRealizedPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {totalRealizedPnl >= 0 ? '+' : ''}{formatCompactCurrency(totalRealizedPnl, currency)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
          <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">UNREALIZED P&L</div>
          <div className={`text-2xl font-mono font-extrabold mt-1 ${totalUnrealizedPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {totalUnrealizedPnl >= 0 ? '+' : ''}{formatCompactCurrency(totalUnrealizedPnl, currency)}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        {positions.length > 0 ? (
          <table className="fin-table">
            <thead>
              <tr>
                <th>Instrument / Symbol</th>
                <th>Product</th>
                <th>Net Qty</th>
                <th>Avg Buy Price</th>
                <th>Live LTP (Selective Tick)</th>
                <th>Blocked Margin</th>
                <th>MTM P&L ({currency})</th>
                <th>P&L %</th>
                <th>Quick Action</th>
              </tr>
            </thead>
            <tbody>
              {positions.map(p => (
                <tr key={p.ticker}>
                  <td className="font-mono font-bold text-[var(--text-primary)]">
                    {p.ticker}
                    <div className="text-[10px] text-[var(--text-muted)] font-sans">{p.name}</div>
                  </td>
                  <td>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                      {p.product}
                    </span>
                  </td>
                  <td className="font-mono font-bold text-[var(--text-primary)]">{p.qty}</td>
                  <td className="font-mono text-[var(--text-secondary)]">₹{p.avgBuyPrice.toFixed(2)}</td>
                  <td>
                    {/* Optimization 1: Selective subscription cell */}
                    <LivePriceCell ticker={p.ticker} initialPrice={p.ltp} prefix="₹" />
                  </td>
                  <td className="font-mono text-xs text-[var(--text-muted)]">
                    {formatCompactCurrency(p.marginBlocked, currency)}
                  </td>
                  <td className={`font-mono font-bold ${p.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {p.pnl >= 0 ? '+' : ''}{formatCompactCurrency(p.pnl, currency)}
                  </td>
                  <td className={`font-mono font-bold ${p.pnlPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {p.pnlPct >= 0 ? '+' : ''}{p.pnlPct.toFixed(2)}%
                  </td>
                  <td>
                    <button
                      onClick={() => handleSquareOff(p.ticker)}
                      className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold cursor-pointer transition-colors shadow-xs"
                    >
                      Square Off
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-xs text-[var(--text-muted)] font-bold bg-[var(--bg-tertiary)] rounded-2xl border border-[var(--border-subtle)]">
            No active open positions. Place an Intraday (MIS), BO, or CO trade to open a live position.
          </div>
        )}
      </div>
    </div>
  );
};
export default PositionsView;
