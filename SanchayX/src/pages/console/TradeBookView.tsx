import React from 'react';
import {
  FileText,
  Download
} from 'lucide-react';
import { useTradingSimulation } from '../../context/TradingSimulationContext';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCompactCurrency } from '../../utils/financialMath';
import { exportContractNotePDF } from '../../utils/exportUtils';

export const TradeBookView: React.FC = () => {
  const { trades } = useTradingSimulation();
  const { currency, currentUser } = usePortfolio();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
        <div>
          <h3 className="text-lg font-black flex items-center gap-2 text-[var(--text-primary)]">
            <FileText className="w-5 h-5 text-purple-500" />
            Executed Trade Book & Digital Contract Notes
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Executed fill details, brokerage calculation, STT, and on-demand dynamic PDF contract notes
          </p>
        </div>

        {trades.length > 0 && (
          <button
            onClick={() => exportContractNotePDF(trades[0], currentUser)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--icici-orange)] text-white text-xs font-bold hover:bg-[var(--icici-orange-hover)] transition-colors cursor-pointer shadow-md"
          >
            <Download className="w-4 h-4" />
            Download Latest Contract Note PDF
          </button>
        )}
      </div>

      <div className="overflow-x-auto w-full">
        {trades.length > 0 ? (
          <table className="fin-table">
            <thead>
              <tr>
                <th>Trade Ref ID</th>
                <th>Time</th>
                <th>Symbol</th>
                <th>Type</th>
                <th>Executed Qty</th>
                <th>Executed Price</th>
                <th>Brokerage & Statutory</th>
                <th>Net Value</th>
                <th>Contract Note</th>
              </tr>
            </thead>
            <tbody>
              {trades.map(tb => (
                <tr key={tb.id}>
                  <td className="font-mono text-xs text-[var(--text-muted)]">{tb.id}</td>
                  <td className="font-mono text-xs text-[var(--text-secondary)]">{tb.time}</td>
                  <td className="font-mono font-bold text-[var(--text-primary)]">{tb.ticker}</td>
                  <td>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      tb.action === 'BUY'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                    }`}>
                      {tb.action}
                    </span>
                  </td>
                  <td className="font-mono font-bold text-[var(--text-primary)]">{tb.quantity || tb.qty}</td>
                  <td className="font-mono text-[var(--text-secondary)]">₹{tb.price.toFixed(2)}</td>
                  <td className="font-mono text-[var(--text-muted)]">
                    ₹{tb.charges ? tb.charges.totalCharges.toFixed(2) : '20.00'}
                  </td>
                  <td className="font-mono font-bold text-[var(--text-primary)]">
                    {formatCompactCurrency(tb.netValue || (tb.price * (tb.quantity || tb.qty)), currency)}
                  </td>
                  <td>
                    <button
                      onClick={() => exportContractNotePDF(tb, currentUser)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card-hover)] text-xs font-bold text-[var(--icici-orange)] border border-[var(--border-color)] cursor-pointer transition-colors"
                      title="Download Digital Contract Note"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-xs text-[var(--text-muted)] font-bold bg-[var(--bg-tertiary)] rounded-2xl border border-[var(--border-subtle)]">
            No executed trades found in current session.
          </div>
        )}
      </div>
    </div>
  );
};
export default TradeBookView;
