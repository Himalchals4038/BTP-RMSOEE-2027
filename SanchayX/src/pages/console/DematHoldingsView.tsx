import React, { useState, useMemo } from 'react';
import {
  Building2,
  Calendar,
  Coins,
  Layers,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  ArrowRightLeft
} from 'lucide-react';
import { useTradingSimulation } from '../../context/TradingSimulationContext';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCompactCurrency } from '../../utils/financialMath';
import { LivePriceCell } from '../../components/common/LivePriceCell';
import { CorporateActionsCalendar } from '../../components/trading/CorporateActionsCalendar';
import { SgbArbitrageTracker } from '../../components/trading/SgbArbitrageTracker';
import { VirtualTable } from '../../components/common/VirtualTable';
import type { BrokerName, DematHolding } from '../../types/tradingSimulation';

const BROKER_CONFIG: Record<BrokerName, { label: string; tagColor: string; bgBadge: string; borderColor: string }> = {
  'Zerodha': {
    label: 'Zerodha (Kite)',
    tagColor: 'text-blue-500 dark:text-blue-400',
    bgBadge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-500/30'
  },
  'Groww': {
    label: 'Groww',
    tagColor: 'text-emerald-500 dark:text-emerald-400',
    bgBadge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    borderColor: 'border-emerald-500/30'
  },
  'Upstox': {
    label: 'Upstox',
    tagColor: 'text-purple-500 dark:text-purple-400',
    bgBadge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    borderColor: 'border-purple-500/30'
  },
  'ICICI Direct': {
    label: 'ICICI Direct',
    tagColor: 'text-amber-500 dark:text-amber-400',
    bgBadge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-500/30'
  }
};

const ALL_BROKERS: BrokerName[] = ['Zerodha', 'Groww', 'Upstox', 'ICICI Direct'];

export const DematHoldingsView: React.FC = () => {
  const {
    dematHoldings,
    totalHoldingsValue,
    totalInvestedValue,
    totalUnrealizedPnl,
    pledgeShares,
    unpledgeShares,
    harvestTaxLosses,
    triggerCorporateAction
  } = useTradingSimulation();
  const { currency } = usePortfolio();

  const [activeSubSection, setActiveSubSection] = useState<'holdings' | 'corporate_actions' | 'sgb_arbitrage'>('holdings');
  const [selectedBroker, setSelectedBroker] = useState<'ALL' | BrokerName>('ALL');
  const [isHarvesting, setIsHarvesting] = useState<boolean>(false);
  const [harvestFeedback, setHarvestFeedback] = useState<{ savedTax: number; harvestedLoss: number; count: number } | null>(null);

  // Compute broker-level aggregated stats
  const brokerMetrics = useMemo(() => {
    const stats: Record<string, { count: number; currentValue: number; investedValue: number; pnl: number }> = {
      'ALL': { count: dematHoldings.length, currentValue: totalHoldingsValue, investedValue: totalInvestedValue, pnl: totalUnrealizedPnl }
    };

    ALL_BROKERS.forEach(b => {
      stats[b] = { count: 0, currentValue: 0, investedValue: 0, pnl: 0 };
    });

    dematHoldings.forEach(h => {
      const brokerKey = h.broker || 'Zerodha';
      if (!stats[brokerKey]) {
        stats[brokerKey] = { count: 0, currentValue: 0, investedValue: 0, pnl: 0 };
      }
      stats[brokerKey].count += 1;
      stats[brokerKey].currentValue += h.currentValue;
      stats[brokerKey].investedValue += h.investedValue;
      stats[brokerKey].pnl += h.pnl;
    });

    return stats;
  }, [dematHoldings, totalHoldingsValue, totalInvestedValue, totalUnrealizedPnl]);

  // Filtered holdings list based on active broker tab
  const displayedHoldings = useMemo(() => {
    if (selectedBroker === 'ALL') return dematHoldings;
    return dematHoldings.filter(h => (h.broker || 'Zerodha') === selectedBroker);
  }, [dematHoldings, selectedBroker]);

  // Tax-Loss Harvesting Opportunity Scanner (Budget 2024–2026: STCG 20%, LTCG 12.5%)
  const taxLossAnalysis = useMemo(() => {
    const losingHoldings = dematHoldings.filter(h => h.pnl < 0);
    let stclTotal = 0;
    let ltclTotal = 0;

    losingHoldings.forEach(h => {
      const loss = Math.abs(h.pnl);
      if (h.holdingType === 'LTCG') {
        ltclTotal += loss;
      } else {
        stclTotal += loss;
      }
    });

    const stcgTaxShield = stclTotal * 0.20; // 20% STCG rate
    const ltcgTaxShield = ltclTotal * 0.125; // 12.5% LTCG rate
    const totalTaxSaved = stcgTaxShield + ltcgTaxShield;

    return {
      candidates: losingHoldings,
      stclTotal,
      ltclTotal,
      stcgTaxShield,
      ltcgTaxShield,
      totalTaxSaved
    };
  }, [dematHoldings]);

  // Handler for 1-Click Cross-Broker Rebalance
  const handleExecuteHarvest = () => {
    setIsHarvesting(true);
    setTimeout(() => {
      const res = harvestTaxLosses();
      setIsHarvesting(false);
      setHarvestFeedback(res);
      setTimeout(() => {
        setHarvestFeedback(null);
      }, 7000);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
        <div>
          <h3 className="text-lg font-black flex items-center gap-2 text-[var(--text-primary)]">
            <Building2 className="w-5 h-5 text-blue-500" />
            CDSL / NSDL Multi-Broker Demat Aggregator & Corporate Actions
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Consolidated multi-depository holdings across Zerodha, Groww, Upstox, & ICICI Direct with Cross-Broker Tax-Loss Harvesting
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
            <span>Consolidated Demat ({dematHoldings.length})</span>
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
          <button
            type="button"
            onClick={() => setActiveSubSection('sgb_arbitrage')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubSection === 'sgb_arbitrage'
                ? 'bg-[var(--icici-orange)] text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span>SGB Gold Arbitrage</span>
          </button>
        </div>
      </div>

      {activeSubSection === 'corporate_actions' ? (
        <CorporateActionsCalendar />
      ) : activeSubSection === 'sgb_arbitrage' ? (
        <SgbArbitrageTracker />
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
              <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">TOTAL INVESTED VALUE</div>
              <div className="text-2xl font-mono font-extrabold text-[var(--text-primary)] mt-1">
                {formatCompactCurrency(totalInvestedValue, currency)}
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1">Across 4 Connected Demat Accounts</div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
              <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">CONSOLIDATED MARKET VALUE</div>
              <div className="text-2xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCompactCurrency(totalHoldingsValue, currency)}
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1">Real-time T+1 Depository Sync</div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">OVERALL UNREALIZED P&L</div>
              <div className={`text-2xl font-mono font-extrabold mt-1 ${totalUnrealizedPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {totalUnrealizedPnl >= 0 ? '+' : ''}{formatCompactCurrency(totalUnrealizedPnl, currency)}
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
                Yield: {totalInvestedValue > 0 ? ((totalUnrealizedPnl / totalInvestedValue) * 100).toFixed(2) : 0}%
              </div>
            </div>
          </div>

          {/* Cross-Broker Tax-Loss Harvesting Sentinel Card */}
          <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/20 via-purple-950/10 to-transparent p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-[var(--text-primary)]">
                      Cross-Broker Tax-Loss Harvesting Sentinel
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-extrabold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      Budget 2024–2026 Compliant
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Offset unrealized capital losses against capital gains across multiple brokers to save taxes (STCG @ 20%, LTCG @ 12.5%).
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExecuteHarvest}
                disabled={isHarvesting || taxLossAnalysis.candidates.length === 0}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-lg ${
                  taxLossAnalysis.candidates.length > 0
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/25 active:scale-95'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border border-[var(--border-color)] cursor-not-allowed'
                }`}
              >
                {isHarvesting ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <ArrowRightLeft className="w-4 h-4" />
                )}
                <span>
                  {taxLossAnalysis.candidates.length > 0
                    ? `1-Click Rebalance (${formatCompactCurrency(taxLossAnalysis.totalTaxSaved, currency)} Tax Shield)`
                    : 'No Losses to Harvest'}
                </span>
              </button>
            </div>

            {/* Tax Harvest Success Toast */}
            {harvestFeedback && (
              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>
                    Successfully harvested <strong>{formatCompactCurrency(harvestFeedback.harvestedLoss, currency)}</strong> loss across {harvestFeedback.count} assets. Saved <strong>{formatCompactCurrency(harvestFeedback.savedTax, currency)}</strong> in direct tax liability!
                  </span>
                </div>
              </div>
            )}

            {/* Harvesting Statistics & Candidate Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">STCL IDENTIFIED (20% RATE)</div>
                <div className="text-base font-mono font-bold text-rose-500 mt-0.5">
                  -{formatCompactCurrency(taxLossAnalysis.stclTotal, currency)}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                  Tax Shield: +{formatCompactCurrency(taxLossAnalysis.stcgTaxShield, currency)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">LTCL IDENTIFIED (12.5% RATE)</div>
                <div className="text-base font-mono font-bold text-rose-500 mt-0.5">
                  -{formatCompactCurrency(taxLossAnalysis.ltclTotal, currency)}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                  Tax Shield: +{formatCompactCurrency(taxLossAnalysis.ltcgTaxShield, currency)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <div className="text-[10px] font-bold text-indigo-400 uppercase">NET TAX LIABILITY SAVED</div>
                <div className="text-base font-mono font-extrabold text-emerald-400 mt-0.5">
                  +{formatCompactCurrency(taxLossAnalysis.totalTaxSaved, currency)}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                  {taxLossAnalysis.candidates.length} Loss-bearing asset(s) ready
                </div>
              </div>
            </div>

            {taxLossAnalysis.candidates.length > 0 && (
              <div className="rounded-xl overflow-hidden border border-[var(--border-color)]/60 bg-[var(--bg-secondary)] text-xs">
                <div className="p-2.5 bg-[var(--bg-tertiary)] font-bold text-[var(--text-secondary)] text-[11px] flex items-center justify-between border-b border-[var(--border-color)]">
                  <span>Harvesting Eligible Securities</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-normal">Auto-swaps into peer sector ETF or resets basis</span>
                </div>
                <div className="divide-y divide-[var(--border-color)]/50">
                  {taxLossAnalysis.candidates.map(c => {
                    const brokerInfo = BROKER_CONFIG[c.broker || 'Zerodha'];
                    const taxRate = c.holdingType === 'LTCG' ? 0.125 : 0.20;
                    const taxSaved = Math.abs(c.pnl) * taxRate;
                    return (
                      <div key={c.ticker} className="p-2.5 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${brokerInfo.bgBadge} ${brokerInfo.borderColor}`}>
                            {c.broker || 'Zerodha'}
                          </span>
                          <span className="font-mono font-bold text-[var(--text-primary)]">{c.ticker}</span>
                          <span className="text-[11px] text-[var(--text-muted)]">({c.holdingType || 'STCG'} • {c.holdingPeriodDays || 90}d)</span>
                        </div>
                        <div className="flex items-center gap-4 font-mono text-[11px]">
                          <span className="text-rose-500 font-bold">{formatCompactCurrency(c.pnl, currency)}</span>
                          <span className="text-emerald-500 font-bold">
                            Save {formatCompactCurrency(taxSaved, currency)} ({Math.round(taxRate * 100)}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Broker Filter Tabs & Metrics Bar */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedBroker('ALL')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
                  selectedBroker === 'ALL'
                    ? 'bg-[var(--icici-orange)] text-white border-transparent shadow-sm'
                    : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All Consolidated ({dematHoldings.length})</span>
              </button>

              {ALL_BROKERS.map(b => {
                const count = brokerMetrics[b]?.count || 0;
                const info = BROKER_CONFIG[b];
                const isActive = selectedBroker === b;
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setSelectedBroker(b)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
                      isActive
                        ? 'bg-[var(--bg-card-hover)] border-[var(--icici-orange)] text-[var(--icici-orange)] shadow-sm'
                        : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${b === 'Zerodha' ? 'bg-blue-500' : b === 'Groww' ? 'bg-emerald-500' : b === 'Upstox' ? 'bg-purple-500' : 'bg-amber-500'}`}></span>
                    <span>{info.label} ({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Broker Distribution Bar */}
            <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {ALL_BROKERS.map(b => {
                const stats = brokerMetrics[b];
                const pctOfTotal = totalHoldingsValue > 0 ? ((stats.currentValue / totalHoldingsValue) * 100).toFixed(1) : '0.0';
                return (
                  <div key={b} className="border-r last:border-r-0 border-[var(--border-color)] pr-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[var(--text-primary)]">{b}</span>
                      <span className="font-mono text-[10px] text-[var(--text-muted)]">{pctOfTotal}%</span>
                    </div>
                    <div className="font-mono font-bold text-sm text-[var(--text-primary)] mt-0.5">
                      {formatCompactCurrency(stats.currentValue, currency)}
                    </div>
                    <div className={`text-[10px] font-mono mt-0.5 ${stats.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {stats.pnl >= 0 ? '+' : ''}{formatCompactCurrency(stats.pnl, currency)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Holdings Virtual Table with Broker & Tax Profile Columns */}
          <VirtualTable
            items={displayedHoldings}
            rowHeight={64}
            viewportHeight={480}
            keyExtractor={(dh) => `${dh.broker || 'Zerodha'}-${dh.ticker}`}
            emptyState={
              <div className="p-8 text-center text-xs text-[var(--text-muted)] font-bold bg-[var(--bg-tertiary)] rounded-2xl border border-[var(--border-subtle)]">
                No securities held in {selectedBroker === 'ALL' ? 'Demat accounts' : selectedBroker}.
              </div>
            }
            renderHeader={() => (
              <tr>
                <th>Stock Symbol</th>
                <th>Depository Broker</th>
                <th>Category</th>
                <th>Demat Qty</th>
                <th>Avg Cost</th>
                <th>Live LTP</th>
                <th>Current Value ({currency})</th>
                <th>Overall P&L</th>
                <th>Tax Profile</th>
                <th>Collateral Status</th>
                <th>Actions</th>
              </tr>
            )}
            renderRow={(dh: DematHolding) => {
              const brokerInfo = BROKER_CONFIG[dh.broker || 'Zerodha'];
              return (
                <tr key={`${dh.broker || 'Zerodha'}-${dh.ticker}`}>
                  <td className="font-mono font-bold text-[var(--text-primary)]">
                    {dh.ticker}
                    <div className="text-[10px] text-[var(--text-muted)] font-sans">{dh.name}</div>
                  </td>
                  <td>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${brokerInfo.bgBadge} ${brokerInfo.borderColor}`}>
                      {dh.broker || 'Zerodha'}
                    </span>
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
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      dh.holdingType === 'LTCG'
                        ? 'bg-blue-500/10 text-blue-500 border border-blue-500/30'
                        : 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                    }`}>
                      {dh.holdingType || 'STCG'} ({dh.holdingPeriodDays || 120}d)
                    </span>
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
              );
            }}
          />
        </div>
      )}
    </div>
  );
};

export default DematHoldingsView;
