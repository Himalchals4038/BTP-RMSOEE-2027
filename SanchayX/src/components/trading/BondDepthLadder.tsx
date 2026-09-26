import React, { useState, useMemo } from 'react';
import {
  Layers,
  Percent,
  IndianRupee,
  TrendingDown,
  TrendingUp,
  Gavel,
  CheckCircle2,
  X
} from 'lucide-react';
import type { BondFDItem } from '../../services/bondsExtendedDataset';
import {
  generateBondNdsOmDepth,
  simulateInterestRateShift
} from '../../services/bondPricingEngine';
import type { BondDepthRung } from '../../services/bondPricingEngine';

interface BondDepthLadderProps {
  bond: BondFDItem;
  onSelectBid?: (price: number, ytm: number) => void;
  className?: string;
}

export const BondDepthLadder: React.FC<BondDepthLadderProps> = ({
  bond,
  onSelectBid,
  className = ''
}) => {
  const [biddingMode, setBiddingMode] = useState<'PRICE' | 'YIELD'>('PRICE');
  const [showAsbaModal, setShowAsbaModal] = useState<boolean>(false);
  const [asbaLotSize, setAsbaLotSize] = useState<number>(100);
  const [asbaBidYtm, setAsbaBidYtm] = useState<number>(bond.ytmPct);
  const [asbaFeedback, setAsbaFeedback] = useState<string | null>(null);

  // Generate 5-depth level-2 order book
  const depth = useMemo(() => {
    return generateBondNdsOmDepth(bond.cleanPrice || bond.tradedPrice, bond.ytmPct, bond.faceValue);
  }, [bond]);

  // Compute interest rate sensitivity for +25 bps and -25 bps repo move
  const modDur = bond.modifiedDurationYears || 6.5;
  const conv = bond.convexity || 50;
  const hikeScenario = useMemo(() => {
    return simulateInterestRateShift(bond.cleanPrice || bond.tradedPrice, bond.ytmPct, modDur, conv, 25);
  }, [bond, modDur, conv]);

  const cutScenario = useMemo(() => {
    return simulateInterestRateShift(bond.cleanPrice || bond.tradedPrice, bond.ytmPct, modDur, conv, -25);
  }, [bond, modDur, conv]);

  const handleRungClick = (rung: BondDepthRung) => {
    if (onSelectBid) {
      onSelectBid(rung.cleanPrice, rung.ytmPct);
    }
  };

  const handleAsbaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const bidAmount = asbaLotSize * bond.faceValue;
    setAsbaFeedback(`RBI Primary ASBA Bid Placed! ₹${bidAmount.toLocaleString()} blocked in linked bank account. Allocation status: SUCCESSFUL ALLOTMENT.`);
    setTimeout(() => {
      setAsbaFeedback(null);
      setShowAsbaModal(false);
    }, 3500);
  };

  return (
    <div className={`p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm space-y-4 ${className}`}>
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h4 className="text-sm font-extrabold text-[var(--text-primary)]">
              CCIL NDS-OM 5-Depth Order Ladder
            </h4>
            <span className="px-2 py-0.2 rounded text-[9px] font-mono font-black bg-blue-500/15 text-blue-600 dark:text-blue-400">
              Direct Clearing
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Real-time wholesale Level-2 order queue on Clearing Corporation of India (CCIL)
          </p>
        </div>

        {/* Dual Bidding Mode Toggle: Price-Based vs Yield-Based */}
        <div className="flex items-center gap-1 bg-[var(--bg-tertiary)] p-1 rounded-xl border border-[var(--border-color)]">
          <button
            type="button"
            onClick={() => setBiddingMode('PRICE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              biddingMode === 'PRICE'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <IndianRupee className="w-3.5 h-3.5" />
            <span>Price Bidding (₹ Clean)</span>
          </button>
          <button
            type="button"
            onClick={() => setBiddingMode('YIELD')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              biddingMode === 'YIELD'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Yield Bidding (% YTM)</span>
          </button>
        </div>
      </div>

      {/* Spread & Volume Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-xs">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-[10px] text-[var(--text-muted)] block uppercase font-bold">Best Bid / Ask Spread</span>
            <span className="font-mono font-black text-amber-600 dark:text-amber-400">
              {biddingMode === 'PRICE' ? `₹${depth.spreadPriceInr.toFixed(2)}` : `${depth.spreadBps} bps`}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--text-muted)] block uppercase font-bold">Total Bid / Ask Volume</span>
            <span className="font-mono font-bold text-[var(--text-primary)]">
              ₹{depth.totalBidQtyCr} Cr / ₹{depth.totalAskQtyCr} Cr
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAsbaModal(true)}
          className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 font-extrabold text-xs border border-amber-500/30 flex items-center gap-1.5 cursor-pointer transition-all"
        >
          <Gavel className="w-3.5 h-3.5 text-amber-500" />
          <span>RBI ASBA Primary Auction</span>
        </button>
      </div>

      {/* 5-Depth Ladder Table (Bids on Left, Asks on Right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* BUYERS / BIDS */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-black text-emerald-600 dark:text-emerald-400 pb-1 border-b border-emerald-500/25 uppercase">
            <span>BIDS (BUYERS)</span>
            <span>ORDERS • QTY (₹ CR) • {biddingMode === 'PRICE' ? 'CLEAN PRICE (₹)' : 'YTM YIELD (%)'}</span>
          </div>

          <div className="space-y-1 text-xs font-mono">
            {depth.bids.map((b) => (
              <div
                key={`bid-${b.rank}`}
                onClick={() => handleRungClick(b)}
                className="relative flex items-center justify-between p-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-emerald-500/10 border border-[var(--border-subtle)] hover:border-emerald-500/30 cursor-pointer transition-all overflow-hidden"
              >
                {/* Visual Depth Bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 bg-emerald-500/15 pointer-events-none transition-all"
                  style={{ width: `${b.depthPct}%` }}
                />

                <div className="relative flex items-center gap-2">
                  <span className="w-4 text-[10px] text-[var(--text-muted)] font-bold">{b.rank}</span>
                  <span className="text-[11px] text-[var(--text-secondary)]">{b.orders} ord</span>
                  <span className="font-bold text-[var(--text-primary)]">₹{b.qtyCr} Cr</span>
                </div>

                <div className="relative text-right">
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs">
                    {biddingMode === 'PRICE' ? `₹${b.cleanPrice.toFixed(2)}` : `${b.ytmPct.toFixed(3)}%`}
                  </span>
                  {biddingMode === 'PRICE' && (
                    <span className="text-[9px] text-[var(--text-muted)] block">
                      YTM {b.ytmPct.toFixed(2)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SELLERS / ASKS */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-black text-rose-600 dark:text-rose-400 pb-1 border-b border-rose-500/25 uppercase">
            <span>{biddingMode === 'PRICE' ? 'CLEAN PRICE (₹)' : 'YTM YIELD (%)'} • QTY (₹ CR) • ORDERS</span>
            <span>ASKS (SELLERS)</span>
          </div>

          <div className="space-y-1 text-xs font-mono">
            {depth.asks.map((a) => (
              <div
                key={`ask-${a.rank}`}
                onClick={() => handleRungClick(a)}
                className="relative flex items-center justify-between p-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-rose-500/10 border border-[var(--border-subtle)] hover:border-rose-500/30 cursor-pointer transition-all overflow-hidden"
              >
                {/* Visual Depth Bar */}
                <div
                  className="absolute right-0 top-0 bottom-0 bg-rose-500/15 pointer-events-none transition-all"
                  style={{ width: `${a.depthPct}%` }}
                />

                <div className="relative text-left">
                  <span className="font-black text-rose-600 dark:text-rose-400 text-xs">
                    {biddingMode === 'PRICE' ? `₹${a.cleanPrice.toFixed(2)}` : `${a.ytmPct.toFixed(3)}%`}
                  </span>
                  {biddingMode === 'PRICE' && (
                    <span className="text-[9px] text-[var(--text-muted)] block">
                      YTM {a.ytmPct.toFixed(2)}%
                    </span>
                  )}
                </div>

                <div className="relative flex items-center gap-2">
                  <span className="font-bold text-[var(--text-primary)]">₹{a.qtyCr} Cr</span>
                  <span className="text-[11px] text-[var(--text-secondary)]">{a.orders} ord</span>
                  <span className="w-4 text-[10px] text-[var(--text-muted)] font-bold text-right">{a.rank}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interest Rate Sensitivity Risk Gauge: Modified Duration & Convexity */}
      <div className="p-3.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
            <Percent className="w-4 h-4 text-blue-500" />
            <span>Interest Rate Sensitivity Risk Gauge (RBI Repo Policy Shifts)</span>
          </div>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">
            Mod Duration: {modDur.toFixed(2)}Y • Convexity: {conv.toFixed(1)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* -25 bps Rate Cut Scenario (Bullish Price) */}
          <div className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-emerald-500/25 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> If RBI Cuts Repo by 25 bps
              </span>
              <div className="text-xs font-bold text-[var(--text-primary)]">
                Price Rises to <strong className="font-mono text-emerald-500">₹{cutScenario.projectedPrice}</strong>
              </div>
            </div>
            <div className="text-right font-mono font-black text-xs text-emerald-600 dark:text-emerald-400">
              +{Math.abs(cutScenario.priceChangePct)}% (+₹{Math.abs(cutScenario.priceChangeAmount)})
            </div>
          </div>

          {/* +25 bps Rate Hike Scenario (Bearish Price) */}
          <div className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-rose-500/25 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" /> If RBI Hikes Repo by 25 bps
              </span>
              <div className="text-xs font-bold text-[var(--text-primary)]">
                Price Drops to <strong className="font-mono text-rose-500">₹{hikeScenario.projectedPrice}</strong>
              </div>
            </div>
            <div className="text-right font-mono font-black text-xs text-rose-600 dark:text-rose-400">
              {hikeScenario.priceChangePct}% (-₹{Math.abs(hikeScenario.priceChangeAmount)})
            </div>
          </div>
        </div>
      </div>

      {/* ASBA Primary Auction Bidding Modal */}
      {showAsbaModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-3.5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-amber-500/20 text-amber-600">
                    RBI E-KUBER ASBA
                  </span>
                  <span className="text-xs font-mono font-bold text-[var(--text-muted)]">
                    {bond.isin}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-[var(--text-primary)]">
                  Primary Market Bond Auction
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAsbaModal(false)}
                className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {asbaFeedback && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{asbaFeedback}</span>
              </div>
            )}

            <form onSubmit={handleAsbaSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-[var(--text-primary)]">Auction Security</label>
                <input
                  type="text"
                  readOnly
                  value={`${bond.name} (${bond.agencyRating})`}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs font-bold text-[var(--text-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-[var(--text-primary)]">Lot Size (Units)</label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={asbaLotSize}
                    onChange={(e) => setAsbaLotSize(Number(e.target.value))}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[var(--text-primary)] focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[var(--text-primary)]">Competitive Bid YTM (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={asbaBidYtm}
                    onChange={(e) => setAsbaBidYtm(Number(e.target.value))}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-600 dark:text-amber-400 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-1 font-mono text-xs">
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Face Value per Unit:</span>
                  <strong className="text-[var(--text-primary)]">₹{bond.faceValue}</strong>
                </div>
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Total Bid Value:</span>
                  <strong className="text-amber-600 dark:text-amber-400 font-black">
                    ₹{(asbaLotSize * bond.faceValue).toLocaleString()}
                  </strong>
                </div>
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Bank Block Mechanism:</span>
                  <strong className="text-emerald-500 font-bold">SEBI ASBA Lien (Zero Debit)</strong>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAsbaModal(false)}
                  className="px-4 py-2 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card)] border border-[var(--border-color)] font-bold text-[var(--text-secondary)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black shadow-md cursor-pointer transition-all"
                >
                  SUBMIT ASBA BID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BondDepthLadder;
