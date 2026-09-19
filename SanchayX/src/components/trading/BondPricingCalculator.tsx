import React, { useState } from 'react';
import { Landmark } from 'lucide-react';
import {
  RBI_10Y_BENCHMARK_YTM,
  solveBondYTM,
  calculateAccruedInterest
} from '../../services/bondPricingEngine';

export const BondPricingCalculator: React.FC = () => {
  const [cleanPrice, setCleanPrice] = useState<number>(100.25);
  const [faceValue, setFaceValue] = useState<number>(100);
  const [couponRate, setCouponRate] = useState<number>(7.18);
  const [tenorYears, setTenorYears] = useState<number>(7);
  const [daysSinceCoupon, setDaysSinceCoupon] = useState<number>(72);
  const [isTaxFree, setIsTaxFree] = useState<boolean>(false);

  const calculatedYtm = solveBondYTM(cleanPrice, faceValue, couponRate, tenorYears);
  const spreadBps = Math.round((calculatedYtm - RBI_10Y_BENCHMARK_YTM) * 100);
  const { accruedInterest, dirtyPrice } = calculateAccruedInterest(
    faceValue,
    couponRate,
    cleanPrice,
    2,
    daysSinceCoupon
  );

  return (
    <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-indigo-500" />
            <h4 className="font-extrabold text-sm text-[var(--text-primary)]">
              Dynamic YTM Solver & Clean / Dirty Price Settlement Engine
            </h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
              RBI 10Y LINKED
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Solves Yield-to-Maturity via Newton-Raphson method and calculates millisecond accrued interest settlement amount.
          </p>
        </div>

        {/* Live RBI 10Y Benchmark Display */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
          <span className="text-[10px] font-bold uppercase text-[var(--text-muted)]">RBI 10Y G-Sec Benchmark:</span>
          <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-xs">{RBI_10Y_BENCHMARK_YTM}%</span>
        </div>
      </div>

      {/* Input Parameters & Dynamic Solver */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div>
          <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] block mb-1">Clean Price (₹)</label>
          <input
            type="number"
            step="0.05"
            value={cleanPrice}
            onChange={(e) => setCleanPrice(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs font-mono font-bold text-[var(--text-primary)]"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] block mb-1">Face Value (₹)</label>
          <input
            type="number"
            step="10"
            value={faceValue}
            onChange={(e) => setFaceValue(parseFloat(e.target.value) || 100)}
            className="w-full px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs font-mono font-bold text-[var(--text-primary)]"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] block mb-1">Coupon Rate (%)</label>
          <input
            type="number"
            step="0.05"
            value={couponRate}
            onChange={(e) => setCouponRate(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs font-mono font-bold text-[var(--text-primary)]"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] block mb-1">Tenor (Years)</label>
          <input
            type="number"
            step="0.5"
            value={tenorYears}
            onChange={(e) => setTenorYears(parseFloat(e.target.value) || 1)}
            className="w-full px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs font-mono font-bold text-[var(--text-primary)]"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] block mb-1">Days Since Coupon</label>
          <input
            type="number"
            value={daysSinceCoupon}
            onChange={(e) => setDaysSinceCoupon(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs font-mono font-bold text-[var(--text-primary)]"
          />
        </div>
        <div className="flex flex-col justify-end">
          <label className="flex items-center gap-2 cursor-pointer pb-2">
            <input
              type="checkbox"
              checked={isTaxFree}
              onChange={(e) => setIsTaxFree(e.target.checked)}
              className="accent-[var(--icici-orange)]"
            />
            <span className="text-[11px] font-bold text-[var(--text-secondary)]">Tax-Free (Sec 10)</span>
          </label>
        </div>
      </div>

      {/* Calculated Results Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <div className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase">SOLVED YTM</div>
          <div className="text-xl font-mono font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
            {calculatedYtm}%
          </div>
          <div className="text-[9px] text-[var(--text-muted)] font-mono mt-0.5">
            Spread: {spreadBps >= 0 ? `+${spreadBps}` : spreadBps} bps vs RBI 10Y
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
          <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">CLEAN PRICE</div>
          <div className="text-xl font-mono font-black text-[var(--text-primary)] mt-0.5">
            ₹{cleanPrice.toFixed(2)}
          </div>
          <div className="text-[9px] text-[var(--text-muted)] font-sans mt-0.5">Excludes accrued interest</div>
        </div>

        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase">ACCRUED INTEREST</div>
          <div className="text-xl font-mono font-black text-amber-600 dark:text-amber-400 mt-0.5">
            +₹{accruedInterest.toFixed(3)}
          </div>
          <div className="text-[9px] text-[var(--text-muted)] font-sans mt-0.5">For {daysSinceCoupon} days elapsed</div>
        </div>

        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">DIRTY SETTLEMENT PRICE</div>
          <div className="text-xl font-mono font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
            ₹{dirtyPrice.toFixed(2)}
          </div>
          <div className="text-[9px] text-[var(--text-muted)] font-sans mt-0.5">Clean + Accrued Total</div>
        </div>
      </div>
    </div>
  );
};

export default BondPricingCalculator;
