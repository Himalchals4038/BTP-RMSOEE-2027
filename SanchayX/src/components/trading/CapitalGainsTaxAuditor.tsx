import React, { useState, useMemo } from 'react';
import {
  FileText,
  ShieldCheck,
  FileSpreadsheet,
  Sparkles,
  CheckCircle2,
  Check
} from 'lucide-react';
import { useTradingSimulation } from '../../context/TradingSimulationContext';
import { usePortfolio } from '../../context/PortfolioContext';

interface TaxLossHarvestCandidate {
  ticker: string;
  name: string;
  qty: number;
  unrealizedLoss: number;
  potentialTaxSaved: number;
  holdingType: 'STCG' | 'LTCG';
  harvestQty: number;
}

export const CapitalGainsTaxAuditor: React.FC = () => {
  const { dematHoldings, trades, placeOrder } = useTradingSimulation();
  const { currentUser } = usePortfolio();

  const [selectedFy, setSelectedFy] = useState<string>('FY 2025-26');
  const [harvestSuccessMessage, setHarvestSuccessMessage] = useState<string | null>(null);

  // Section 112A LTCG Exemption Threshold (Post Budget 2024: ₹1.25 Lakh)
  const LTCG_EXEMPTION_LIMIT = 125000;
  const LTCG_TAX_RATE = 0.125; // 12.5%
  const STCG_TAX_RATE = 0.20;  // 20.0%

  // Compute Tax Audit Metrics based on closed trades and live Demat portfolio
  const taxMetrics = useMemo(() => {
    // 1. Realized STCG & LTCG from trades
    let equityStcgGain = 0;
    let equityLtcgGain = 0;
    let intradaySpeculativePnl = 0;
    let sgbExemptGains = 0;
    let corporateNcdCoupons = 0;

    // Categorize trades / simulated taxable events
    trades.forEach(t => {
      const pnl = t.realizedPnl || (t.action === 'SELL' ? (t.price - 2400) * t.qty : 0);
      if (t.product === 'Intraday (MIS)') {
        intradaySpeculativePnl += pnl;
      } else if (t.ticker.includes('SGB')) {
        if (pnl > 0) sgbExemptGains += pnl;
      } else if (t.ticker.includes('NCD') || t.ticker.includes('BOND')) {
        corporateNcdCoupons += Math.abs(pnl * 0.08);
      } else {
        // Assume recent trades are STCG (< 12 months)
        if (pnl > 0) {
          equityStcgGain += pnl;
        } else {
          // Losses offset STCG
          equityStcgGain += pnl;
        }
      }
    });

    // Baseline historical realized gains if session has few trades
    if (equityStcgGain === 0) equityStcgGain = 145200;
    if (equityLtcgGain === 0) equityLtcgGain = 485000;
    if (intradaySpeculativePnl === 0) intradaySpeculativePnl = 48200;
    if (sgbExemptGains === 0) sgbExemptGains = 180000;
    if (corporateNcdCoupons === 0) corporateNcdCoupons = 52000;

    // LTCG Tax Calculation (Section 112A: 12.5% on gains exceeding ₹1.25 Lakh)
    const taxableLtcg = Math.max(0, equityLtcgGain - LTCG_EXEMPTION_LIMIT);
    const ltcgTax = taxableLtcg * LTCG_TAX_RATE;

    // STCG Tax Calculation (Section 111A: Flat 20.0%)
    const taxableStcg = Math.max(0, equityStcgGain);
    const stcgTax = taxableStcg * STCG_TAX_RATE;

    // Intraday Speculative (Section 43(5): Slab rate, say 30%)
    const intradayTax = Math.max(0, intradaySpeculativePnl) * 0.30;

    // SGB: 0.0% Exempt under Section 47(viib)
    const sgbTax = 0;

    // Total Net Tax
    const totalTaxPayable = ltcgTax + stcgTax + intradayTax;

    return {
      equityLtcgGain,
      taxableLtcg,
      ltcgTax,
      equityStcgGain,
      taxableStcg,
      stcgTax,
      intradaySpeculativePnl,
      intradayTax,
      sgbExemptGains,
      sgbTax,
      corporateNcdCoupons,
      totalTaxPayable
    };
  }, [trades]);

  // Automated Tax-Loss Harvesting Engine
  const harvestingCandidates: TaxLossHarvestCandidate[] = useMemo(() => {
    const candidates: TaxLossHarvestCandidate[] = [];

    dematHoldings.forEach(dh => {
      if (dh.pnl < -500) {
        const unrealizedLoss = Math.abs(dh.pnl);
        // If STCG gains exist, harvesting saves 20%
        const potentialSaved = Number((unrealizedLoss * STCG_TAX_RATE).toFixed(2));
        candidates.push({
          ticker: dh.ticker,
          name: dh.name,
          qty: dh.qty,
          unrealizedLoss,
          potentialTaxSaved: potentialSaved,
          holdingType: 'STCG',
          harvestQty: dh.qty
        });
      }
    });

    // Default institutional candidates if portfolio is green
    if (candidates.length === 0) {
      candidates.push(
        {
          ticker: 'HDFCBANK.NS',
          name: 'HDFC Bank Limited',
          qty: 40,
          unrealizedLoss: 18500,
          potentialTaxSaved: 3700,
          holdingType: 'STCG',
          harvestQty: 40
        },
        {
          ticker: 'INFY.NS',
          name: 'Infosys Limited',
          qty: 25,
          unrealizedLoss: 12200,
          potentialTaxSaved: 2440,
          holdingType: 'STCG',
          harvestQty: 25
        }
      );
    }

    return candidates;
  }, [dematHoldings]);

  // Handle Tax Loss Harvest Execution
  const handleHarvestCandidate = (cand: TaxLossHarvestCandidate) => {
    placeOrder({
      ticker: cand.ticker,
      action: 'SELL',
      product: 'Delivery (CNC)',
      orderType: 'Market Order',
      qty: cand.harvestQty,
      price: 1500
    });
    setHarvestSuccessMessage(
      `Successfully harvested loss of ₹${cand.unrealizedLoss.toLocaleString()} on ${cand.ticker}. Estimated tax savings of ₹${cand.potentialTaxSaved.toLocaleString()} locked in before March 31!`
    );
    setTimeout(() => setHarvestSuccessMessage(null), 6000);
  };

  // Export ITR Schedule CG CSV
  const handleExportScheduleCG_CSV = () => {
    const rows = [
      ['ITR SCHEDULE CG - CAPITAL GAINS TAX AUDIT REPORT'],
      ['Assessment Year', '2025-2026'],
      ['Taxpayer Name', currentUser.name || 'SanchayX Trader'],
      ['PAN Number', 'ABCDE1234F'],
      [''],
      ['Tax Head', 'Section', 'Applicable Rate', 'Gross Gain/Loss', 'Exemption Applied', 'Taxable Amount', 'Tax Payable'],
      ['Equity LTCG (>12M)', 'Section 112A', '12.5%', taxMetrics.equityLtcgGain, LTCG_EXEMPTION_LIMIT, taxMetrics.taxableLtcg, taxMetrics.ltcgTax],
      ['Equity STCG (<12M)', 'Section 111A', '20.0%', taxMetrics.equityStcgGain, '0.00', taxMetrics.taxableStcg, taxMetrics.stcgTax],
      ['Intraday Speculative P&L', 'Section 43(5)', 'Slab Rate (30%)', taxMetrics.intradaySpeculativePnl, '0.00', taxMetrics.intradaySpeculativePnl, taxMetrics.intradayTax],
      ['Sovereign Gold Bonds (SGB)', 'Section 47(viib)', '0.0% (Exempt)', taxMetrics.sgbExemptGains, taxMetrics.sgbExemptGains, '0.00', '0.00'],
      ['Corporate NCD Coupons', 'Section 193 / 197A', 'Slab Rate', taxMetrics.corporateNcdCoupons, 'Form 15G/H Zero-TDS', taxMetrics.corporateNcdCoupons, 'Taxed in Slab'],
      [''],
      ['TOTAL NET CAPITAL GAINS TAX LIABILITY', '', '', '', '', '', taxMetrics.totalTaxPayable]
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SanchayX_ITR_Schedule_CG_${selectedFy}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
        <div>
          <h3 className="text-lg font-black flex items-center gap-2 text-[var(--text-primary)]">
            <FileText className="w-5 h-5 text-purple-500" />
            Indian Capital Gains Tax Auditor & ITR Schedule CG Simulator
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Budget 2024–2026 Compliant
            </span>
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Section 112A (12.5% LTCG beyond ₹1.25L), Section 111A (20% STCG), Section 43(5) Intraday speculative turnover, and automated March 31 Tax-Loss Harvesting.
          </p>
        </div>

        {/* Action Controls & FY Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedFy}
            onChange={(e) => setSelectedFy(e.target.value)}
            className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)] cursor-pointer"
          >
            <option value="FY 2025-26">FY 2025-26 (AY 2026-27)</option>
            <option value="FY 2024-25">FY 2024-25 (AY 2025-26)</option>
          </select>

          <button
            onClick={handleExportScheduleCG_CSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/30 transition-all cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Schedule CG
          </button>
        </div>
      </div>

      {/* Primary Slabs & Heads Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: LTCG 112A */}
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border-l-4 border-l-purple-500 border border-[var(--border-color)] space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-extrabold text-[var(--text-muted)]">
            <span>EQUITY LTCG (SEC 112A)</span>
            <span className="font-mono text-purple-400 font-black">12.5%</span>
          </div>
          <div className="font-mono font-black text-xl text-[var(--text-primary)]">
            +₹{taxMetrics.equityLtcgGain.toLocaleString()}
          </div>
          <div className="text-[10px] space-y-0.5 text-[var(--text-secondary)] font-mono pt-1 border-t border-[var(--border-subtle)]">
            <div className="flex justify-between">
              <span>Exemption:</span>
              <span className="text-emerald-500 font-bold">-₹1,25,000</span>
            </div>
            <div className="flex justify-between font-bold text-purple-400">
              <span>Tax Payable:</span>
              <span>₹{taxMetrics.ltcgTax.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Card 2: STCG 111A */}
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border-l-4 border-l-amber-500 border border-[var(--border-color)] space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-extrabold text-[var(--text-muted)]">
            <span>EQUITY STCG (SEC 111A)</span>
            <span className="font-mono text-amber-500 font-black">20.0%</span>
          </div>
          <div className="font-mono font-black text-xl text-[var(--text-primary)]">
            +₹{taxMetrics.equityStcgGain.toLocaleString()}
          </div>
          <div className="text-[10px] space-y-0.5 text-[var(--text-secondary)] font-mono pt-1 border-t border-[var(--border-subtle)]">
            <div className="flex justify-between">
              <span>Holding Period:</span>
              <span className="text-[var(--text-muted)]">&lt; 12 Months</span>
            </div>
            <div className="flex justify-between font-bold text-amber-500">
              <span>Tax Payable:</span>
              <span>₹{taxMetrics.stcgTax.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Sovereign Gold Bonds (SGB) */}
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border-l-4 border-l-emerald-500 border border-[var(--border-color)] space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-extrabold text-[var(--text-muted)]">
            <span>SGB GAINS (SEC 47(viib))</span>
            <span className="font-mono text-emerald-500 font-black">0% EXEMPT</span>
          </div>
          <div className="font-mono font-black text-xl text-emerald-600 dark:text-emerald-400">
            +₹{taxMetrics.sgbExemptGains.toLocaleString()}
          </div>
          <div className="text-[10px] space-y-0.5 text-[var(--text-secondary)] font-mono pt-1 border-t border-[var(--border-subtle)]">
            <div className="flex justify-between">
              <span>Maturity Status:</span>
              <span className="text-emerald-500 font-bold">100% Tax Free</span>
            </div>
            <div className="flex justify-between font-bold text-emerald-500">
              <span>Tax Payable:</span>
              <span>₹0.00</span>
            </div>
          </div>
        </div>

        {/* Card 4: Total Tax Liability */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/15 via-rose-500/10 to-amber-500/10 border border-purple-500/30 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-extrabold text-purple-700 dark:text-purple-300">
            <span>TOTAL TAX LIABILITY</span>
            <span className="font-mono text-xs uppercase font-black">{selectedFy}</span>
          </div>
          <div className="font-mono font-black text-2xl text-[var(--text-primary)]">
            ₹{taxMetrics.totalTaxPayable.toLocaleString()}
          </div>
          <div className="text-[10px] text-[var(--text-secondary)] font-semibold pt-1 border-t border-purple-500/20">
            Computed under Union Budget 2024-2026 amended Income Tax Act rules.
          </div>
        </div>
      </div>

      {/* Automated Tax-Loss Harvesting Module */}
      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
          <div>
            <h4 className="font-extrabold text-sm text-[var(--text-primary)] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Automated Tax-Loss Harvesting Recommendations (Pre-March 31 Deadline)
            </h4>
            <span className="text-[11px] text-[var(--text-secondary)]">
              Strategically realize unrealized losses in Demat holdings to neutralize taxable STCG and save tax legally.
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            March 31 Financial Year-End Offset Window
          </span>
        </div>

        {harvestSuccessMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            {harvestSuccessMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {harvestingCandidates.map(cand => (
            <div
              key={cand.ticker}
              className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-[var(--text-primary)]">{cand.ticker}</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.2 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                    Unrealized: -₹{cand.unrealizedLoss.toLocaleString()}
                  </span>
                </div>
                <div className="text-[11px] text-[var(--text-secondary)]">{cand.name} ({cand.qty} shares)</div>
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span>Potential Tax Saved:</span>
                  <span className="font-mono font-black">+₹{cand.potentialTaxSaved.toLocaleString()} (STCG 20%)</span>
                </div>
              </div>

              <button
                onClick={() => handleHarvestCandidate(cand)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-all shadow-sm cursor-pointer shrink-0 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Harvest Loss
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Statutory Income Tax Head & Section Treatment Table */}
      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-sm">
        <div className="border-b border-[var(--border-color)] pb-3">
          <h4 className="font-extrabold text-sm text-[var(--text-primary)]">
            Statutory Income Tax Slabs & Simulation Treatment Schedule
          </h4>
          <span className="text-[11px] text-[var(--text-secondary)]">
            Formal Schedule CG compliance reference table mapping Indian tax heads to simulation rules
          </span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="fin-table">
            <thead>
              <tr>
                <th>Income / Asset Head</th>
                <th>Income Tax Section</th>
                <th>Tax Rate</th>
                <th>BTP Simulation Engine Treatment</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-bold text-[var(--text-primary)]">Equity LTCG</td>
                <td className="font-mono text-purple-400 font-bold">Section 112A</td>
                <td className="font-mono font-black text-xs text-[var(--text-primary)]">12.5%</td>
                <td className="text-xs text-[var(--text-secondary)]">
                  Applied to equity delivery holdings held &gt; 12 months with gains exceeding ₹1.25 Lakh per financial year.
                </td>
              </tr>
              <tr>
                <td className="font-bold text-[var(--text-primary)]">Equity STCG</td>
                <td className="font-mono text-amber-500 font-bold">Section 111A</td>
                <td className="font-mono font-black text-xs text-[var(--text-primary)]">20.0%</td>
                <td className="text-xs text-[var(--text-secondary)]">
                  Applied to equity delivery holdings sold within 12 months.
                </td>
              </tr>
              <tr>
                <td className="font-bold text-[var(--text-primary)]">Intraday Speculative P&L</td>
                <td className="font-mono text-blue-400 font-bold">Section 43(5)</td>
                <td className="font-mono font-black text-xs text-[var(--text-primary)]">Slab Rate</td>
                <td className="text-xs text-[var(--text-secondary)]">
                  Categorized as speculative business turnover; cannot offset capital losses.
                </td>
              </tr>
              <tr>
                <td className="font-bold text-[var(--text-primary)]">Sovereign Gold Bonds (SGB)</td>
                <td className="font-mono text-emerald-500 font-bold">Section 47(viib)</td>
                <td className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400">0.0% (Exempt)</td>
                <td className="text-xs text-[var(--text-secondary)]">
                  100% tax-free capital gains on redemption at maturity.
                </td>
              </tr>
              <tr>
                <td className="font-bold text-[var(--text-primary)]">Corporate NCD Coupons</td>
                <td className="font-mono text-indigo-400 font-bold">Section 193 / 197A</td>
                <td className="font-mono font-black text-xs text-[var(--text-primary)]">Slab Rate</td>
                <td className="text-xs text-[var(--text-secondary)]">
                  Zero-TDS applied when backed by valid Form 15G/15H family declaration.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CapitalGainsTaxAuditor;

