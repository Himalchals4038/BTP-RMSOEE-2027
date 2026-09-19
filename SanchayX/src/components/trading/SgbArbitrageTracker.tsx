import React, { useState } from 'react';
import { Coins, ShieldCheck, Zap, CheckCircle2 } from 'lucide-react';
import { SGB_ARBITRAGE_CATALOG, analyzeSgbArbitrage } from '../../services/bondPricingEngine';
import { useTradingSimulation } from '../../context/TradingSimulationContext';

export const SgbArbitrageTracker: React.FC = () => {
  const { buySgbTranche } = useTradingSimulation();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // MCX Live 24K Gold Spot Rate
  const mcxGoldPrice10g = 71850;
  const liveGoldPerGram = mcxGoldPrice10g / 10;

  const analyses = SGB_ARBITRAGE_CATALOG.map(sgb =>
    analyzeSgbArbitrage(sgb.symbol, sgb.series, sgb.tradedPrice, mcxGoldPrice10g, sgb.maturity)
  );

  const handleBuy = (item: typeof analyses[0]) => {
    const res = buySgbTranche(5, item.trancheSymbol);
    if (res.success) {
      setSuccessMsg(`✓ Arbitrage Order Executed: Bought 5 units of ${item.trancheSymbol} at ₹${item.tradedPricePerGram}/g. Added to Demat Holdings!`);
      setTimeout(() => setSuccessMsg(null), 5000);
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-500" />
            <h4 className="font-extrabold text-sm text-[var(--text-primary)]">
              Sovereign Gold Bond (SGB) 24K Secondary Market Arbitrage Tracker
            </h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              5 Hz TELEMETRY
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Compares NSE/BSE secondary traded SGB tranches against live MCX 24K pure gold spot rate (₹{liveGoldPerGram}/g).
          </p>
        </div>

        {/* Live MCX Gold Spot Benchmark */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
          <span className="text-[10px] font-bold uppercase text-[var(--text-muted)]">MCX 24K Gold Spot:</span>
          <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-xs">₹{liveGoldPerGram.toFixed(2)}/g</span>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Arbitrage Table */}
      <div className="overflow-x-auto w-full">
        <table className="fin-table">
          <thead>
            <tr>
              <th>SGB Tranche / Series</th>
              <th>Secondary Price</th>
              <th>MCX 24K Spot</th>
              <th>Spread / Discount</th>
              <th>Effective Yield</th>
              <th>Arbitrage Signal</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {analyses.map(item => {
              const isDiscount = item.spreadPct < 0;
              return (
                <tr key={item.trancheSymbol}>
                  <td className="font-mono font-bold text-[var(--text-primary)]">
                    <div className="flex items-center gap-1.5">
                      <span>{item.trancheSymbol}</span>
                      <span className="text-[10px] text-[var(--text-muted)] font-sans">({item.maturityDate})</span>
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] font-sans">{item.seriesName}</div>
                  </td>
                  <td className="font-mono font-bold text-[var(--text-primary)]">
                    ₹{item.tradedPricePerGram.toFixed(2)}/g
                  </td>
                  <td className="font-mono text-[var(--text-secondary)]">
                    ₹{item.liveGold24kPerGram.toFixed(2)}/g
                  </td>
                  <td className="font-mono font-bold">
                    <span className={isDiscount ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                      {isDiscount ? '' : '+'}{item.spreadInr} ({item.spreadPct}%)
                    </span>
                    {isDiscount && (
                      <span className="ml-1 text-[10px] text-emerald-500 font-sans font-bold">DISCOUNT</span>
                    )}
                  </td>
                  <td className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {item.effectiveAnnualYieldPct}% p.a.
                    <div className="text-[9px] text-[var(--text-muted)] font-sans">2.5% RBI + Discount</div>
                  </td>
                  <td>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                      item.arbitrageSignal === 'STRONG_BUY_DISCOUNT'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : item.arbitrageSignal === 'PREMIUM_AVOID'
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                        : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                    }`}>
                      {item.arbitrageSignal === 'STRONG_BUY_DISCOUNT' ? '★ STRONG ARBITRAGE BUY' : item.arbitrageSignal === 'PREMIUM_AVOID' ? '✕ PREMIUM (AVOID)' : 'FAIR VALUE'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleBuy(item)}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-xs shadow-xs cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Buy Arbitrage</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-[var(--text-secondary)]">
        <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
        <span>
          <strong>Sovereign Guarantee:</strong> SGBs are backed by the Reserve Bank of India with 100% tax-free capital gains at maturity under Section 47(viic), plus 2.50% p.a. annual coupon paid semi-annually.
        </span>
      </div>
    </div>
  );
};

export default SgbArbitrageTracker;
