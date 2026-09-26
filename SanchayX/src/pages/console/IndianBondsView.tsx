import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  Activity,
  X
} from 'lucide-react';
import { INDIAN_BONDS_CATALOG } from '../../services/bondsExtendedDataset';
import type { BondFDItem } from '../../services/bondsExtendedDataset';
import { YieldCurveChart } from '../../components/trading/YieldCurveChart';
import { BondDepthLadder } from '../../components/trading/BondDepthLadder';
import { usePortfolio } from '../../context/PortfolioContext';
import { useTradingSimulation } from '../../context/TradingSimulationContext';
import { formatCompactCurrency } from '../../utils/financialMath';

type BondFilterCategory = 'All' | 'G-Sec' | 'T-Bill' | 'SDL' | 'PSU Tax-Free' | 'Corporate NCD' | 'SGB';

export const IndianBondsView: React.FC = () => {
  const { currency } = usePortfolio();
  const { wallet } = useTradingSimulation();

  const [activeCategory, setActiveCategory] = useState<BondFilterCategory>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBond, setSelectedBond] = useState<BondFDItem | null>(() => INDIAN_BONDS_CATALOG[0]);
  const [showYieldCurve, setShowYieldCurve] = useState<boolean>(true);
  const [orderModalBond, setOrderModalBond] = useState<BondFDItem | null>(null);
  const [orderQtyUnits, setOrderQtyUnits] = useState<number>(100);
  const [orderCleanPrice, setOrderCleanPrice] = useState<number>(100.25);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);

  // Filter bonds catalog
  const filteredBonds = useMemo(() => {
    return INDIAN_BONDS_CATALOG.filter(bond => {
      const matchCategory = activeCategory === 'All'
        ? true
        : bond.subCategory === activeCategory || bond.category.includes(activeCategory);

      const q = searchQuery.toLowerCase();
      const matchQuery = !q ||
        bond.name.toLowerCase().includes(q) ||
        bond.isin.toLowerCase().includes(q) ||
        bond.issuer.toLowerCase().includes(q);

      return matchCategory && matchQuery;
    });
  }, [activeCategory, searchQuery]);

  // Aggregate Market Telemetry Stats
  const marketStats = useMemo(() => {
    const totalVolCr = INDIAN_BONDS_CATALOG.reduce((acc, b) => acc + (b.dailyTurnoverCr || 0), 0);
    const avgYtm = (INDIAN_BONDS_CATALOG.reduce((acc, b) => acc + b.ytmPct, 0) / INDIAN_BONDS_CATALOG.length).toFixed(2);
    return {
      totalVolCr,
      avgYtm,
      benchmark10y: 7.14,
      rbiRepo: 6.50,
      inflationCpi: 4.85
    };
  }, []);

  const handleOpenOrderModal = (bond: BondFDItem) => {
    setOrderModalBond(bond);
    setOrderCleanPrice(bond.cleanPrice || bond.tradedPrice);
    setOrderQtyUnits(Math.max(10, Math.floor((bond.minInvestment || 10000) / bond.faceValue)));
  };

  const handleExecuteBondOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderModalBond) return;

    const accrued = orderModalBond.accruedInterest || 0;
    const dirtyPrice = orderCleanPrice + accrued;
    const totalOrderCost = orderQtyUnits * dirtyPrice;

    setOrderSuccessMsg(
      `Direct Debt Order Executed on CCIL NDS-OM! ${orderQtyUnits} units of ${orderModalBond.name} settled at ₹${dirtyPrice.toFixed(2)} dirty price (Total: ₹${Math.round(totalOrderCost).toLocaleString()}). ISIN: ${orderModalBond.isin}`
    );

    setTimeout(() => {
      setOrderSuccessMsg(null);
      setOrderModalBond(null);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      {/* SECTION HEADER: Institutional Indian Sovereign & Corporate Debt Terminal */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/15 text-blue-600 dark:text-blue-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[var(--text-primary)]">
                Indian Sovereign & Corporate Debt Terminal
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Direct CCIL NDS-OM settlement, 3M–30Y Benchmark Yield Curve, Clean/Dirty pricing & RBI ASBA auctions
              </p>
            </div>
          </div>
        </div>

        {/* Quick Macro Indicators */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
            <span className="text-[10px] text-[var(--text-muted)] block uppercase font-bold">10Y Benchmark (7.18% GS 2033)</span>
            <strong className="text-blue-600 dark:text-blue-400 font-black text-sm">7.14% YTM</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
            <span className="text-[10px] text-[var(--text-muted)] block uppercase font-bold">CCIL NDS-OM Volume</span>
            <strong className="text-emerald-500 font-black text-sm">₹{marketStats.totalVolCr.toLocaleString()} Cr</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
            <span className="text-[10px] text-[var(--text-muted)] block uppercase font-bold">RBI Policy Repo</span>
            <strong className="text-amber-500 font-black text-sm">6.50%</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
            <span className="text-[10px] text-[var(--text-muted)] block uppercase font-bold">Real Debt Spread</span>
            <strong className="text-purple-500 font-black text-sm">+{Math.round((7.14 - 4.85) * 100)} bps</strong>
          </div>
        </div>
      </div>

      {/* Yield Curve Visualizer Panel */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowYieldCurve(!showYieldCurve)}
            className="text-xs font-black text-blue-600 dark:text-blue-400 flex items-center gap-1.5 hover:underline cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{showYieldCurve ? 'Hide Sovereign Yield Curve' : 'Show 3M–30Y Sovereign Benchmark Yield Curve'}</span>
          </button>
          <span className="text-[10px] text-[var(--text-muted)] font-mono">
            Updated live from RBI CCIL wholesale market feeds
          </span>
        </div>

        {showYieldCurve && (
          <YieldCurveChart
            selectedTenor={selectedBond?.tenorYears ? `${selectedBond.tenorYears}Y` : undefined}
            onSelectTenor={(point) => {
              const matched = INDIAN_BONDS_CATALOG.find(b => b.isin === point.isin);
              if (matched) setSelectedBond(matched);
            }}
          />
        )}
      </div>

      {/* Category Pills & Search Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['All', 'G-Sec', 'T-Bill', 'SDL', 'PSU Tax-Free', 'Corporate NCD', 'SGB'] as BondFilterCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:text-[var(--text-primary)]'
              }`}
            >
              {cat === 'All' ? 'All Debt Securities' : cat}
            </button>
          ))}
        </div>

        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search ISIN, G-Sec, SDL, T-Bill, NCD, SGB..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Main Grid: Telemetry Table (8 cols on XL) + Selected Bond Inspector Drawer (4 cols on XL) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Comprehensive Debt Telemetry Table */}
        <div className="xl:col-span-8 space-y-3">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-tertiary)] border-b border-[var(--border-color)] text-[10px] uppercase font-black text-[var(--text-muted)] tracking-wider">
                    <th className="py-3 px-4">Security & ISIN</th>
                    <th className="py-3 px-3">Rating</th>
                    <th className="py-3 px-3 text-right">Clean (₹)</th>
                    <th className="py-3 px-3 text-right">Dirty (₹)</th>
                    <th className="py-3 px-3 text-right">YTM Yield</th>
                    <th className="py-3 px-3 text-right">Spread</th>
                    <th className="py-3 px-3 text-right">Mod Dur</th>
                    <th className="py-3 px-3 text-right">Daily Vol</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {filteredBonds.map((bond) => {
                    const isSelected = selectedBond?.id === bond.id;
                    const clean = bond.cleanPrice || bond.tradedPrice;
                    const dirty = bond.dirtyPrice || (clean + (bond.accruedInterest || 0));
                    const spread = bond.benchmarkSpreadBps || 0;

                    return (
                      <tr
                        key={bond.id}
                        onClick={() => setSelectedBond(bond)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600/10 dark:bg-blue-500/15'
                            : 'hover:bg-[var(--bg-tertiary)]'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${
                              bond.liquidityTag === 'Highly Liquid' ? 'bg-emerald-500' : 'bg-amber-500'
                            }`} />
                            <div>
                              <div className="font-extrabold text-[var(--text-primary)] hover:text-blue-500">
                                {bond.name}
                              </div>
                              <div className="text-[10px] font-mono text-[var(--text-muted)]">
                                {bond.isin} • {bond.subCategory || bond.category}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            bond.creditRating === 'SOVEREIGN'
                              ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {bond.agencyRating.split(' ')[0]}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-black text-[var(--text-primary)]">
                          ₹{clean.toFixed(2)}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                          ₹{dirty.toFixed(2)}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-black text-xs text-blue-600 dark:text-blue-400">
                          {bond.ytmPct.toFixed(2)}%
                        </td>

                        <td className="py-3 px-3 text-right font-mono text-xs">
                          <span className={spread >= 0 ? 'text-emerald-500 font-bold' : 'text-blue-500 font-bold'}>
                            {spread >= 0 ? `+${spread}` : spread} bps
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right font-mono text-[var(--text-secondary)]">
                          {bond.modifiedDurationYears ? `${bond.modifiedDurationYears.toFixed(2)}Y` : '—'}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold text-[var(--text-primary)]">
                          ₹{bond.dailyTurnoverCr || 150} Cr
                        </td>

                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenOrderModal(bond);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] transition-all cursor-pointer shadow-xs"
                          >
                            Invest / Bid
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Selected Bond Inspector & CCIL NDS-OM 5-Depth Ladder */}
        <div className="xl:col-span-4 space-y-4">
          {selectedBond ? (
            <div className="space-y-4">
              {/* Selected Bond Summary Card */}
              <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-blue-500/15 text-blue-600 dark:text-blue-400">
                      {selectedBond.subCategory || selectedBond.category}
                    </span>
                    <h3 className="text-base font-black text-[var(--text-primary)] mt-1">
                      {selectedBond.name}
                    </h3>
                    <div className="text-xs font-mono text-[var(--text-muted)]">
                      ISIN: {selectedBond.isin}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenOrderModal(selectedBond)}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-all cursor-pointer shadow-sm"
                  >
                    Place Order
                  </button>
                </div>

                {/* Clean vs Dirty Settlement Breakdown */}
                <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Quoted Clean Price:</span>
                    <strong className="text-[var(--text-primary)]">₹{(selectedBond.cleanPrice || selectedBond.tradedPrice).toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Accrued Coupon ({selectedBond.daysSinceLastCoupon || 72} days):</span>
                    <strong className="text-emerald-500">+₹{(selectedBond.accruedInterest || 0).toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between text-xs pt-1 border-t border-[var(--border-color)] font-bold">
                    <span className="text-[var(--text-primary)]">Settlement Dirty Price:</span>
                    <strong className="text-amber-600 dark:text-amber-400 text-sm">
                      ₹{((selectedBond.cleanPrice || selectedBond.tradedPrice) + (selectedBond.accruedInterest || 0)).toFixed(2)}
                    </strong>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {selectedBond.summary}
                </p>
              </div>

              {/* CCIL NDS-OM 5-Depth Order Ladder Component */}
              <BondDepthLadder
                bond={selectedBond}
                onSelectBid={(price) => {
                  setOrderModalBond(selectedBond);
                  setOrderCleanPrice(price);
                }}
              />
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[var(--text-muted)] bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]">
              Select any bond from the table to inspect CCIL NDS-OM depth and risk sensitivity.
            </div>
          )}
        </div>
      </div>

      {/* Bond Order Execution / ASBA Ticket Modal */}
      {orderModalBond && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-3">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-blue-500/15 text-blue-600 dark:text-blue-400 uppercase">
                  CCIL NDS-OM ORDER TICKET
                </span>
                <h3 className="text-base font-black text-[var(--text-primary)] mt-1">
                  {orderModalBond.name}
                </h3>
                <p className="text-xs font-mono text-[var(--text-muted)]">
                  ISIN: {orderModalBond.isin} • {orderModalBond.agencyRating}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOrderModalBond(null)}
                className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {orderSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{orderSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleExecuteBondOrder} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-primary)]">Clean Limit Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={orderCleanPrice}
                    onChange={(e) => setOrderCleanPrice(Number(e.target.value))}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-primary)]">Quantity (Units)</label>
                  <input
                    type="number"
                    min="1"
                    step="10"
                    value={orderQtyUnits}
                    onChange={(e) => setOrderQtyUnits(Number(e.target.value))}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Settlement Cost Calculation Breakdown */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Face Value per Bond:</span>
                  <strong className="text-[var(--text-primary)]">₹{orderModalBond.faceValue}</strong>
                </div>
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Accrued Interest / Unit:</span>
                  <strong className="text-emerald-500">₹{(orderModalBond.accruedInterest || 0).toFixed(2)}</strong>
                </div>
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Settlement Dirty Price / Unit:</span>
                  <strong className="text-amber-600 dark:text-amber-400">
                    ₹{(orderCleanPrice + (orderModalBond.accruedInterest || 0)).toFixed(2)}
                  </strong>
                </div>
                <div className="flex justify-between text-xs pt-1.5 border-t border-[var(--border-color)] font-bold">
                  <span className="text-[var(--text-primary)]">Total Settlement Consideration:</span>
                  <strong className="text-blue-600 dark:text-blue-400 text-sm">
                    ₹{Math.round(orderQtyUnits * (orderCleanPrice + (orderModalBond.accruedInterest || 0))).toLocaleString()}
                  </strong>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] bg-[var(--bg-tertiary)] p-2.5 rounded-xl">
                <span>Available Margin: <strong>{formatCompactCurrency(wallet.availableMargin, currency)}</strong></span>
                <span className="text-emerald-500 font-bold">T+1 CCIL Guaranteed</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOrderModalBond(null)}
                  className="px-4 py-2 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card)] border border-[var(--border-color)] font-bold text-[var(--text-secondary)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg shadow-blue-600/30 cursor-pointer transition-all"
                >
                  CONFIRM DEBT ORDER
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndianBondsView;
