import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Plus
} from 'lucide-react';
import { useTradingSimulation } from '../../context/TradingSimulationContext';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCompactCurrency } from '../../utils/financialMath';

export const FundsView: React.FC = () => {
  const { wallet, addFunds } = useTradingSimulation();
  const { currency } = usePortfolio();

  const [addFundsAmount, setAddFundsAmount] = useState<number>(50000);
  const [fundSuccessMsg, setFundSuccessMsg] = useState<boolean>(false);

  const handleAddFundsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (addFundsAmount <= 0) return;
    addFunds(Number(addFundsAmount));
    setFundSuccessMsg(true);
    setTimeout(() => setFundSuccessMsg(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[var(--border-color)] pb-4">
        <h3 className="text-lg font-black flex items-center gap-2 text-[var(--text-primary)]">
          <CreditCard className="w-5 h-5 text-[var(--icici-orange)]" />
          Funds & 3-in-1 Integrated Banking Ecosystem
        </h3>
        <p className="text-xs text-[var(--text-secondary)]">
          Liquid trading margin, Demat collateral haircut pledging, auto-sweep FD @ 7.1% p.a., and ASBA lien
        </p>
      </div>

      {fundSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-pulse">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          Funds Added Successfully via UPI Instant Transfer! Liquid margin updated.
        </div>
      )}

      {/* Margin metrics cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
          <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">AVAILABLE MARGIN</div>
          <div className="text-xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCompactCurrency(wallet.availableMargin, currency)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
          <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">USED MARGIN</div>
          <div className="text-xl font-mono font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {formatCompactCurrency(wallet.usedMargin, currency)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
          <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">CASH BALANCE</div>
          <div className="text-xl font-mono font-extrabold text-[var(--text-primary)] mt-1">
            {formatCompactCurrency(wallet.cashBalance, currency)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
          <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">DEMAT COLLATERAL</div>
          <div className="text-xl font-mono font-extrabold text-blue-600 dark:text-blue-400 mt-1">
            {formatCompactCurrency(wallet.dematCollateral, currency)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
          <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">AUTO-SWEEP FD (7.1%)</div>
          <div className="text-xl font-mono font-extrabold text-purple-600 dark:text-purple-400 mt-1">
            {formatCompactCurrency(wallet.autoSweepBalance, currency)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
          <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">ASBA BLOCKED LIEN</div>
          <div className="text-xl font-mono font-extrabold text-rose-500 mt-1">
            {formatCompactCurrency(wallet.asbaBlockedLien, currency)}
          </div>
        </div>
      </div>

      {/* Add funds form */}
      <div className="p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-4">
        <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Plus className="w-4 h-4 text-[var(--icici-orange)]" />
          Instant UPI / NetBanking Deposit (Zero Gateway Fee)
        </h4>

        <form onSubmit={handleAddFundsSubmit} className="flex flex-wrap items-center gap-4">
          <input
            type="number"
            min="100"
            step="100"
            value={addFundsAmount}
            onChange={(e) => setAddFundsAmount(Number(e.target.value))}
            className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)] w-48"
            placeholder="Amount in ₹"
          />
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[var(--icici-orange)] hover:bg-[var(--icici-orange-hover)] text-white font-extrabold text-xs shadow-md cursor-pointer transition-all"
          >
            ADD FUNDS VIA UPI INSTANT
          </button>
        </form>
      </div>
    </div>
  );
};
export default FundsView;
