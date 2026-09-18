import React, { useState } from 'react';
import {
  Building2,
  Calendar
} from 'lucide-react';
import { useTradingSimulation } from '../../context/TradingSimulationContext';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCompactCurrency } from '../../utils/financialMath';
import { LivePriceCell } from '../../components/common/LivePriceCell';
import { CorporateActionsCalendar } from '../../components/trading/CorporateActionsCalendar';
import { VirtualTable } from '../../components/common/VirtualTable';

export const DematHoldingsView: React.FC = () => {
  const {
    dematHoldings,
    totalHoldingsValue,
    totalInvestedValue,
    totalUnrealizedPnl,
    pledgeShares,
    unpledgeShares,
    triggerCorporateAction
  } = useTradingSimulation();
  const { currency } = usePortfolio();

  const [activeSubSection, setActiveSubSection] = useState<'holdings' | 'corporate_actions'>('holdings');

  return (
    <div className="space-y-6">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
        <div>
          <h3 className="text-lg font-black flex items-center gap-2 text-[var(--text-primary)]">
            <Building2 className="w-5 h-5 text-blue-500" />
            CDSL / NSDL Demat Holdings Statement & Corporate Actions
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Verified depository holdings statement, pledge margin collateral (20% haircut), and corporate yield distribution
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[var(--bg-tertiary)] p-1 rounded-xl border border-[var(--border-color)]">
          <button
            type="button"
            onClick={() => setActiveSubSection('holdings')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubSection === 'holdings'
                ? 'bg-[var(--icici-orange)] text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Demat Holdings ({dematHoldings.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubSection('corporate_actions')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubSection === 'corporate_actions'
                ? 'bg-[var(--icici-orange)] text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Corporate Actions Schedule</span>
          </button>
        </div>
      </div>

      {activeSubSection === 'corporate_actions' ? (
        <CorporateActionsCalendar />
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
              <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">INVESTED VALUE</div>
              <div className="text-2xl font-mono font-extrabold text-[var(--text-primary)] mt-1">
                {formatCompactCurrency(totalInvestedValue, currency)}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
              <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">CURRENT VALUE</div>
              <div className="text-2xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCompactCurrency(totalHoldingsValue, currency)}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">OVERALL GAIN / (LOSS)</div>
              <div className={`text-2xl font-mono font-extrabold mt-1 ${totalUnrealizedPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {totalUnrealizedPnl >= 0 ? '+' : ''}{formatCompactCurrency(totalUnrealizedPnl, currency)}
              </div>
            </div>
          </div>

          {/* Holdings Virtual Table with LivePriceCell */}
          <VirtualTable
            items={dematHoldings}
            rowHeight={58}
            viewportHeight={480}
            keyExtractor={(dh) => dh.ticker}
            emptyState={
              <div className="p-8 text-center text-xs text-[var(--text-muted)] font-bold bg-[var(--bg-tertiary)] rounded-2xl border border-[var(--border-subtle)]">
                No securities held in Demat account. Buy delivery shares or subscribe to SGB/Bonds.
              </div>
            }
            renderHeader={() => (
              <tr>
                <th>Stock Symbol</th>
                <th>Category</th>
                <th>Demat Qty</th>
                <th>Avg Cost</th>
                <th>Live LTP</th>
                <th>Current Value ({currency})</th>
                <th>Overall P&L</th>
                <th>Collateral Status</th>
                <th>Actions</th>
              </tr>
            )}
            renderRow={(dh) => (
              <tr key={dh.ticker}>
                <td className="font-mono font-bold text-[var(--text-primary)]">
                  {dh.ticker}
                  <div className="text-[10px] text-[var(--text-muted)] font-sans">{dh.name}</div>
                </td>
                <td>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                    {dh.category}
                  </span>
                </td>
                <td className="font-mono font-bold text-[var(--text-primary)]">{dh.qty}</td>
                <td className="font-mono text-[var(--text-secondary)]">₹{dh.avgCost.toFixed(2)}</td>
                <td>
                  <LivePriceCell ticker={dh.ticker} initialPrice={dh.ltp} prefix="₹" />
                </td>
                <td className="font-mono font-bold text-[var(--text-primary)]">
                  {formatCompactCurrency(dh.currentValue, currency)}
                </td>
                <td className={`font-mono font-bold ${dh.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {dh.pnl >= 0 ? '+' : ''}{formatCompactCurrency(dh.pnl, currency)} ({dh.pnlPct.toFixed(2)}%)
                </td>
                <td>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                    dh.pledgedStatus === 'Pledged (Collateral)'
                      ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)]'
                  }`}>
                    {dh.pledgedStatus === 'Pledged (Collateral)' ? `Pledged (₹${Math.round((dh.pledgedQty || dh.qty) * dh.ltp * 0.8).toLocaleString()})` : 'Unpledged'}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-1.5">
                    {dh.pledgedStatus === 'Pledged (Collateral)' ? (
                      <button
                        onClick={() => unpledgeShares(dh.ticker, dh.qty)}
                        className="px-2 py-1 rounded text-[11px] font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 border border-amber-500/30 cursor-pointer"
                        title="Unpledge collateral"
                      >
                        Unpledge
                      </button>
                    ) : (
                      <button
                        onClick={() => pledgeShares(dh.ticker, dh.qty)}
                        className="px-2 py-1 rounded text-[11px] font-bold bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 border border-blue-500/30 cursor-pointer"
                        title="Pledge for trading margin (20% haircut)"
                      >
                        Pledge
                      </button>
                    )}
                    <button
                      onClick={() => triggerCorporateAction('DIVIDEND', dh.ticker, Math.round(dh.ltp * 0.025))}
                      className="px-2 py-1 rounded text-[11px] font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 border border-emerald-500/30 cursor-pointer"
                      title="Simulate Corporate Action Dividend Yield"
                    >
                      Dividend
                    </button>
                  </div>
                </td>
              </tr>
            )}
          />
        </div>
      )}
    </div>
  );
};
export default DematHoldingsView;
