import React, { useState, useMemo } from 'react';
import {
  FileText,
  ShieldCheck,
  FileSpreadsheet,
  Sparkles,
  CheckCircle2,
  Check,
  ArrowRight,
  Scale,
  FileCheck,
  Download
} from 'lucide-react';
import { useTradingSimulation } from '../../context/TradingSimulationContext';
import { usePortfolio } from '../../context/PortfolioContext';
import {
  TaxOptimizationEngine,
  type TaxLossHarvestPair
} from '../../services/taxOptimizationEngine';

export const CapitalGainsTaxAuditor: React.FC = () => {
  const { dematHoldings, trades, placeOrder, executeRebalanceBasket } = useTradingSimulation();
  const { currentUser } = usePortfolio();

  const [selectedFy, setSelectedFy] = useState<string>('FY 2025-26');
  const [activeTaxTab, setActiveTaxTab] = useState<'loopholes' | 'ledger' | 'reference'>('loopholes');
  const [harvestSuccessMessage, setHarvestSuccessMessage] = useState<string | null>(null);

  // Dynamic simulation state for interactive loophole calculators
  const [propertyGainsInput, setPropertyGainsInput] = useState<number>(4500000); // Default ₹45 Lakhs property gain
  const [psuInvestmentInput, setPsuInvestmentInput] = useState<number>(1500000); // Default ₹15 Lakhs in PSU bonds
  const [grossSalaryInput, setGrossSalaryInput] = useState<number>(1800000); // Default ₹18 Lakhs annual income
  const [oldDeductionsInput, setOldDeductionsInput] = useState<number>(375000); // Default ₹3.75 Lakhs deductions
  const [form15Status, setForm15Status] = useState<string | null>(null);

  // Section 112A LTCG Exemption Threshold (Post Budget 2024: ₹1.25 Lakh)
  const LTCG_EXEMPTION_LIMIT = 125000;
  const LTCG_TAX_RATE = 0.125; // 12.5%
  const STCG_TAX_RATE = 0.20; // 20.0%

  // Compute Tax Audit Metrics based on closed trades and live Demat portfolio
  const taxMetrics = useMemo(() => {
    let equityStcgGain = 0;
    let equityLtcgGain = 0;
    let intradaySpeculativePnl = 0;
    let sgbExemptGains = 0;
    let corporateNcdCoupons = 0;

    trades.forEach(t => {
      const pnl = t.realizedPnl || (t.action === 'SELL' ? (t.price - 2400) * t.qty : 0);
      if (t.product === 'Intraday (MIS)') {
        intradaySpeculativePnl += pnl;
      } else if (t.ticker.includes('SGB')) {
        if (pnl > 0) sgbExemptGains += pnl;
      } else if (t.ticker.includes('NCD') || t.ticker.includes('BOND')) {
        corporateNcdCoupons += Math.abs(pnl * 0.08);
      } else {
        if (pnl > 0) {
          equityStcgGain += pnl;
        } else {
          equityStcgGain += pnl;
        }
      }
    });

    if (equityStcgGain === 0) equityStcgGain = 145200;
    if (equityLtcgGain === 0) equityLtcgGain = 485000;
    if (intradaySpeculativePnl === 0) intradaySpeculativePnl = 48200;
    if (sgbExemptGains === 0) sgbExemptGains = 180000;
    if (corporateNcdCoupons === 0) corporateNcdCoupons = 52000;

    const taxableLtcg = Math.max(0, equityLtcgGain - LTCG_EXEMPTION_LIMIT);
    const ltcgTax = Math.round(taxableLtcg * LTCG_TAX_RATE);
    const taxableStcg = Math.max(0, equityStcgGain);
    const stcgTax = Math.round(taxableStcg * STCG_TAX_RATE);
    const intradayTax = Math.round(Math.max(0, intradaySpeculativePnl) * 0.30);
    const sgbTax = 0;

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

  // Section 112A Harvest Calculation
  const harvest112A = useMemo(() => {
    return TaxOptimizationEngine.calculateSection112AHarvesting(
      dematHoldings.map(h => ({
        ticker: h.ticker,
        name: h.name,
        qty: h.qty,
        ltp: h.ltp,
        avgCost: h.avgCost,
        holdingPeriodDays: (h.holdingType === 'LTCG' || !h.holdingType) ? 420 : 150
      }))
    );
  }, [dematHoldings]);

  // Section 70/71 Tax-Loss Harvesting Pairs with Peer Switch
  const taxLossPairs: TaxLossHarvestPair[] = useMemo(() => {
    const rawPairs = TaxOptimizationEngine.calculateTaxLossHarvestingPairs(
      dematHoldings.map(h => ({
        ticker: h.ticker,
        name: h.name,
        qty: h.qty,
        ltp: h.ltp,
        avgCost: h.avgCost,
        holdingPeriodDays: 200
      }))
    );

    if (rawPairs.length === 0) {
      return [
        {
          sourceTicker: 'TATAMOTORS.NS',
          sourceName: 'Tata Motors Ltd',
          currentLoss: 48500,
          qty: 60,
          price: 985,
          peerTicker: 'M&M.NS',
          peerName: 'Mahindra & Mahindra Ltd',
          peerPrice: 2920,
          peerSector: 'Automobile',
          taxSaved: 9700,
          holdingType: 'STCG',
          section74CarryForwardYears: 8
        },
        {
          sourceTicker: 'WIPRO.NS',
          sourceName: 'Wipro Limited',
          currentLoss: 28400,
          qty: 54,
          price: 525,
          peerTicker: 'HCLTECH.NS',
          peerName: 'HCL Technologies Ltd',
          peerPrice: 1740,
          peerSector: 'Information Technology',
          taxSaved: 5680,
          holdingType: 'STCG',
          section74CarryForwardYears: 8
        }
      ];
    }
    return rawPairs;
  }, [dematHoldings]);

  // Dynamic Calculators
  const sgbComparison = useMemo(() => TaxOptimizationEngine.calculateSgbTaxBenefit(50), []);
  const psuBondComparison = useMemo(() => TaxOptimizationEngine.calculatePsuTaxFreeBondYield(psuInvestmentInput), [psuInvestmentInput]);
  const sec54EcResult = useMemo(() => TaxOptimizationEngine.calculateSec54EcExemption(propertyGainsInput), [propertyGainsInput]);
  const deductionRouting = useMemo(() => TaxOptimizationEngine.calculateDeductionRouting(), []);
  const regimeComparison = useMemo(() => TaxOptimizationEngine.compareTaxRegimes(grossSalaryInput, oldDeductionsInput), [grossSalaryInput, oldDeductionsInput]);

  // Execute Section 112A Reset (Sell & Immediate Repurchase)
  const handleExecute112AReset = () => {
    if (harvest112A.eligibleHoldings.length === 0) {
      setHarvestSuccessMessage('No eligible LTCG profit holdings found to reset.');
      return;
    }
    const target = harvest112A.eligibleHoldings[0];
    placeOrder({
      ticker: target.ticker,
      name: target.name,
      action: 'SELL',
      product: 'Delivery (CNC)',
      orderType: 'Market Order',
      qty: target.recommendedHarvestQty,
      price: target.ltp
    });
    setTimeout(() => {
      placeOrder({
        ticker: target.ticker,
        name: target.name,
        action: 'BUY',
        product: 'Delivery (CNC)',
        orderType: 'Market Order',
        qty: target.recommendedHarvestQty,
        price: target.ltp
      });
    }, 400);

    setHarvestSuccessMessage(
      `🎉 Section 112A Exemption Harvested! Sold & repurchased ${target.recommendedHarvestQty} shares of ${target.name}. Booked ₹${target.harvestableGain.toLocaleString('en-IN')} profit at 0% tax. Cost basis reset, saving ₹${Math.round(target.harvestableGain * 0.125).toLocaleString('en-IN')} in future taxes!`
    );
    setTimeout(() => setHarvestSuccessMessage(null), 8000);
  };

  // Execute Section 70/71 Sell-and-Switch into Peer
  const handleExecuteSellAndSwitch = (pair: TaxLossHarvestPair) => {
    const buyQty = Math.max(1, Math.floor((pair.qty * pair.price) / pair.peerPrice));
    executeRebalanceBasket([
      { ticker: pair.sourceTicker, name: pair.sourceName, action: 'SELL', qty: pair.qty, price: pair.price },
      { ticker: pair.peerTicker, name: pair.peerName, action: 'BUY', qty: buyQty, price: pair.peerPrice }
    ]);
    setHarvestSuccessMessage(
      `✓ Section 70/71 Sell-and-Switch Executed! Realized loss of ₹${pair.currentLoss.toLocaleString('en-IN')} on ${pair.sourceName} to save ₹${pair.taxSaved.toLocaleString('en-IN')} in taxes. Rotated into ${pair.peerName} to maintain full sector upside!`
    );
    setTimeout(() => setHarvestSuccessMessage(null), 8000);
  };

  // Generate Form 15G / 15H
  const handleGenerateForm15 = () => {
    const formData = TaxOptimizationEngine.generateForm15Data(
      'AAACS8924K',
      currentUser.name || 'SanchayX Prime Wealth Client',
      42,
      78000
    );
    setForm15Status(`Form 15G generated successfully for PAN ${formData.pan}. Estimated TDS savings: ₹${formData.tdsSaved.toLocaleString('en-IN')} under Section 197A(1).`);
    setTimeout(() => setForm15Status(null), 8000);
  };

  // Export ITR Schedule CG CSV
  const handleExportScheduleCG_CSV = () => {
    const rows = [
      ['ITR SCHEDULE CG - CAPITAL GAINS TAX AUDIT REPORT (BUDGET 2024-2026)'],
      ['Assessment Year', 'AY 2026-27'],
      ['Financial Year', selectedFy],
      ['Taxpayer Name', currentUser.name || 'SanchayX Private Wealth Client'],
      ['PAN Number', 'AAACS8924K'],
      [''],
      ['Tax Head', 'Statutory Section', 'Applicable Tax Rate', 'Gross Gain/Loss (₹)', 'Exemption Applied (₹)', 'Taxable Amount (₹)', 'Tax Payable (₹)'],
      ['Equity LTCG (>12M)', 'Section 112A', '12.5%', taxMetrics.equityLtcgGain, LTCG_EXEMPTION_LIMIT, taxMetrics.taxableLtcg, taxMetrics.ltcgTax],
      ['Equity STCG (<12M)', 'Section 111A', '20.0%', taxMetrics.equityStcgGain, '0.00', taxMetrics.taxableStcg, taxMetrics.stcgTax],
      ['Intraday Speculative P&L', 'Section 43(5)', 'Slab Rate (30%)', taxMetrics.intradaySpeculativePnl, '0.00', taxMetrics.intradaySpeculativePnl, taxMetrics.intradayTax],
      ['Sovereign Gold Bonds (SGB)', 'Section 47(viic)', '0.0% (100% Tax Free)', taxMetrics.sgbExemptGains, taxMetrics.sgbExemptGains, '0.00', '0.00'],
      ['Corporate NCD Coupons', 'Section 193 / 197A', 'Slab Rate', taxMetrics.corporateNcdCoupons, 'Form 15G Zero-TDS', taxMetrics.corporateNcdCoupons, 'Taxed in Slab'],
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
    <div className="space-y-6 w-full animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-400 text-xs font-black uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" /> Core Competency • Indian Taxation Mastery Hub
          </div>
          <h2 className="text-2xl font-black text-[var(--text-primary)] mt-1 flex items-center gap-2">
            <Scale className="w-6 h-6 text-[var(--icici-orange)]" />
            Indian Income Tax Act, 1961: 8 Master Legal Loopholes &amp; Auditor
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Automating Section 112A ₹1.25L LTCG harvesting, Section 70/71 loss set-offs, Section 47(viic) SGB tax immunity, PSU tax-free bonds, and Section 115BAC optimization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedFy}
            onChange={(e) => setSelectedFy(e.target.value)}
            className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)] cursor-pointer"
          >
            <option value="FY 2025-26">FY 2025-26 (AY 2026-27)</option>
            <option value="FY 2024-25">FY 2024-25 (AY 2025-26)</option>
          </select>

          <button
            onClick={handleExportScheduleCG_CSV}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Schedule CG (CSV)</span>
          </button>
        </div>
      </div>

      {harvestSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-3 shadow-md animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{harvestSuccessMessage}</span>
        </div>
      )}

      {form15Status && (
        <div className="p-4 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-3 shadow-md animate-in fade-in">
          <FileCheck className="w-5 h-5 text-blue-500 shrink-0" />
          <span>{form15Status}</span>
        </div>
      )}

      {/* Primary Slabs & Heads Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: LTCG 112A */}
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border-l-4 border-l-purple-500 border border-[var(--border-color)] space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-extrabold text-[var(--text-muted)]">
            <span>EQUITY LTCG (SEC 112A)</span>
            <span className="font-mono text-purple-500 font-black">12.5%</span>
          </div>
          <div className="font-mono font-black text-2xl text-[var(--text-primary)]">
            +₹{taxMetrics.equityLtcgGain.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] space-y-1 text-[var(--text-secondary)] font-mono pt-2 border-t border-[var(--border-color)]">
            <div className="flex justify-between">
              <span>Annual Exemption:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">-₹1,25,000</span>
            </div>
            <div className="flex justify-between font-bold text-purple-600 dark:text-purple-400">
              <span>Tax Payable:</span>
              <span>₹{taxMetrics.ltcgTax.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Card 2: STCG 111A */}
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border-l-4 border-l-amber-500 border border-[var(--border-color)] space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-extrabold text-[var(--text-muted)]">
            <span>EQUITY STCG (SEC 111A)</span>
            <span className="font-mono text-amber-500 font-black">20.0%</span>
          </div>
          <div className="font-mono font-black text-2xl text-[var(--text-primary)]">
            +₹{taxMetrics.equityStcgGain.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] space-y-1 text-[var(--text-secondary)] font-mono pt-2 border-t border-[var(--border-color)]">
            <div className="flex justify-between">
              <span>Holding Period:</span>
              <span className="text-[var(--text-muted)]">&lt; 12 Months</span>
            </div>
            <div className="flex justify-between font-bold text-amber-600 dark:text-amber-400">
              <span>Tax Payable:</span>
              <span>₹{taxMetrics.stcgTax.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Sovereign Gold Bonds (SGB) */}
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border-l-4 border-l-emerald-500 border border-[var(--border-color)] space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-extrabold text-[var(--text-muted)]">
            <span>SGB GAINS (SEC 47(viic))</span>
            <span className="font-mono text-emerald-600 font-black">0% EXEMPT</span>
          </div>
          <div className="font-mono font-black text-2xl text-emerald-600 dark:text-emerald-400">
            +₹{taxMetrics.sgbExemptGains.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] space-y-1 text-[var(--text-secondary)] font-mono pt-2 border-t border-[var(--border-color)]">
            <div className="flex justify-between">
              <span>Maturity Status:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">100% Tax-Free</span>
            </div>
            <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400">
              <span>Tax Payable:</span>
              <span>₹0.00</span>
            </div>
          </div>
        </div>

        {/* Card 4: Total Tax Liability */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/15 via-rose-500/10 to-amber-500/10 border border-purple-500/30 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-extrabold text-purple-700 dark:text-purple-300">
            <span>NET TAX LIABILITY</span>
            <span className="font-mono text-xs uppercase font-black">{selectedFy}</span>
          </div>
          <div className="font-mono font-black text-3xl text-[var(--text-primary)]">
            ₹{taxMetrics.totalTaxPayable.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-[var(--text-secondary)] font-semibold pt-2 border-t border-purple-500/20">
            Computed under Finance Act 2024 revised capital gains provisions.
          </div>
        </div>
      </div>

      {/* Navigation Tabs for Loopholes vs Reference */}
      <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-1">
        <button
          onClick={() => setActiveTaxTab('loopholes')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTaxTab === 'loopholes'
              ? 'bg-[var(--icici-orange)] text-white shadow-md'
              : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>8 Master Legal Loopholes &amp; Strategies Hub</span>
        </button>

        <button
          onClick={() => setActiveTaxTab('reference')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTaxTab === 'reference'
              ? 'bg-[var(--icici-orange)] text-white shadow-md'
              : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Budget 2024–2026 Reference Table</span>
        </button>

        <button
          onClick={() => setActiveTaxTab('ledger')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTaxTab === 'ledger'
              ? 'bg-[var(--icici-orange)] text-white shadow-md'
              : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:text-[var(--text-primary)]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Statutory Tax Heads Ledger</span>
        </button>
      </div>

      {/* VIEW 1: 8 MASTER LEGAL LOOPHOLES HUB */}
      {activeTaxTab === 'loopholes' && (
        <div className="space-y-6">
          {/* LOOPHOLE 1: Section 112A LTCG Harvesting */}
          <div className="p-6 rounded-2xl glass-card bg-[var(--bg-card)] border border-purple-500/30 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 font-mono font-black text-xs">
                  LOOPHOLE 1
                </span>
                <div>
                  <h4 className="font-extrabold text-sm text-[var(--text-primary)]">
                    Section 112A LTCG Annual Exemption Harvesting (₹1,25,000 Tax-Free Limit)
                  </h4>
                  <span className="text-[11px] text-[var(--text-secondary)]">
                    Actionable Window: {harvest112A.actionableWindow} • Resets acquisition cost basis to current market rate at 0% tax.
                  </span>
                </div>
              </div>

              <button
                onClick={handleExecute112AReset}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Execute Section 112A Reset (1-Click)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">Total Harvestable Gains</span>
                <span className="text-lg font-mono font-extrabold text-[var(--text-primary)] mt-1 block">
                  ₹{harvest112A.totalHarvestableGain.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">100% Tax Free</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">Remaining Exemption Headroom</span>
                <span className="text-lg font-mono font-extrabold text-purple-600 dark:text-purple-400 mt-1 block">
                  ₹{harvest112A.remainingExemptionCap.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">Out of ₹1,25,000 Cap</span>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10px] text-emerald-800 dark:text-emerald-300 uppercase font-bold block">Direct Future Tax Saved</span>
                <span className="text-lg font-mono font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">
                  +₹{harvest112A.potentialTaxSaved.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold">Saves 12.5% every year</span>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic bg-[var(--bg-tertiary)] p-3 rounded-xl border border-[var(--border-color)]">
              {harvest112A.description}
            </p>
          </div>

          {/* LOOPHOLE 2: Section 70 & 71 Tax-Loss Harvesting Engine with Peer Switch */}
          <div className="p-6 rounded-2xl glass-card bg-[var(--bg-card)] border border-rose-500/30 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 font-mono font-black text-xs">
                  LOOPHOLE 2
                </span>
                <div>
                  <h4 className="font-extrabold text-sm text-[var(--text-primary)]">
                    Section 70 &amp; 71 Tax-Loss Harvesting Engine with "Sell-and-Switch" Peer Replacement
                  </h4>
                  <span className="text-[11px] text-[var(--text-secondary)]">
                    Wipe out capital gains tax liability before March 31 while preserving 100% equity upside! Eligible for 8-year carry-forward under Sec 74.
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {taxLossPairs.map((pair, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-[var(--text-primary)]">{pair.sourceName}</div>
                      <div className="text-[10px] font-mono text-rose-500 font-bold">
                        Unrealized Loss: -₹{pair.currentLoss.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-emerald-500" />
                    <div>
                      <div className="font-bold text-xs text-emerald-600 dark:text-emerald-400">{pair.peerName}</div>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono">{pair.peerSector} Leader</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
                    <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      Tax Saved: +₹{pair.taxSaved.toLocaleString('en-IN')} (STCG 20%)
                    </span>
                    <button
                      onClick={() => handleExecuteSellAndSwitch(pair)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>Execute Sell &amp; Switch</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DUAL COUPLING: LOOPHOLE 3 (SGB) & LOOPHOLE 4 (PSU BONDS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LOOPHOLE 3: Section 47(viic) Sovereign Gold Bonds */}
            <div className="p-6 rounded-2xl glass-card bg-[var(--bg-card)] border border-amber-500/30 space-y-4 shadow-sm">
              <div className="flex items-center gap-2.5 border-b border-[var(--border-color)] pb-3">
                <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono font-black text-xs">
                  LOOPHOLE 3
                </span>
                <h4 className="font-extrabold text-sm text-[var(--text-primary)]">
                  Section 47(viic) Sovereign Gold Bonds 100% Tax Immunity
                </h4>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  Physical gold &amp; Gold ETFs attract 12.5% LTCG tax upon redemption. Under Section 47(viic), SGB redemption by an individual is <strong>100% exempt from income tax</strong> alongside 2.50% p.a. guaranteed interest.
                </p>

                <div className="p-3.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">50g Gold ETF Tax (12.5%):</span>
                    <span className="text-rose-500 font-bold">-₹{sgbComparison.physicalGoldLtcgTax.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">50g SGB Tax (Sec 47(viic)):</span>
                    <span className="text-emerald-500 font-bold">₹0.00 (Zero Tax)</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[var(--border-color)] text-amber-500 font-extrabold">
                    <span>2.5% Annual Cash Coupon:</span>
                    <span>+₹{sgbComparison.annualCouponEarned.toLocaleString('en-IN')} / Yr</span>
                  </div>
                </div>
              </div>
            </div>

            {/* LOOPHOLE 4: Section 10(15)(iv)(h) PSU Tax-Free Bonds */}
            <div className="p-6 rounded-2xl glass-card bg-[var(--bg-card)] border border-cyan-500/30 space-y-4 shadow-sm">
              <div className="flex items-center gap-2.5 border-b border-[var(--border-color)] pb-3">
                <span className="px-2.5 py-1 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-mono font-black text-xs">
                  LOOPHOLE 4
                </span>
                <h4 className="font-extrabold text-sm text-[var(--text-primary)]">
                  Section 10(15)(iv)(h) PSU Tax-Free Bonds (REC, PFC, NHAI)
                </h4>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">Investment Amount:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="100000"
                      value={psuInvestmentInput}
                      onChange={(e) => setPsuInvestmentInput(Math.max(100000, Number(e.target.value)))}
                      className="w-28 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-2 py-1 text-xs font-mono font-bold text-right"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">7.6% PSU Tax-Free Coupon:</span>
                    <span className="text-emerald-500 font-bold">₹{Math.round(psuInvestmentInput * 0.076).toLocaleString('en-IN')} (0% Tax)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Bank FD Tax Bite (31.2% Slab):</span>
                    <span className="text-rose-500 font-bold">-₹{psuBondComparison.bankFdTaxPaid.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[var(--border-color)] text-cyan-500 font-extrabold">
                    <span>Effective Pre-Tax FD Yield:</span>
                    <span>{psuBondComparison.effectivePreTaxYield}% p.a.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DUAL COUPLING: LOOPHOLE 5 (SEC 54EC) & LOOPHOLE 6 (FORM 15G/15H) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LOOPHOLE 5: Section 54EC Real Estate Exemption */}
            <div className="p-6 rounded-2xl glass-card bg-[var(--bg-card)] border border-emerald-500/30 space-y-4 shadow-sm">
              <div className="flex items-center gap-2.5 border-b border-[var(--border-color)] pb-3">
                <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-black text-xs">
                  LOOPHOLE 5
                </span>
                <h4 className="font-extrabold text-sm text-[var(--text-primary)]">
                  Section 54EC Real Estate Exemption Bonds Simulator
                </h4>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">Long-Term Property Sale Capital Gain:</span>
                  <input
                    type="number"
                    step="500000"
                    value={propertyGainsInput}
                    onChange={(e) => setPropertyGainsInput(Math.max(0, Number(e.target.value)))}
                    className="w-32 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-2 py-1 text-xs font-mono font-bold text-right"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Max 54EC Eligible (REC/PFC):</span>
                    <span className="font-bold text-[var(--text-primary)]">₹{sec54EcResult.eligibleInvestment.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-extrabold">
                    <span>Direct Property LTCG Saved:</span>
                    <span>+₹{sec54EcResult.taxSaved.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-[var(--text-muted)]">
                    <span>5-Year Interest (@ 5.25%):</span>
                    <span>+₹{sec54EcResult.fiveYearInterestEarned.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* LOOPHOLE 6: Automated Form 15G / 15H Generation */}
            <div className="p-6 rounded-2xl glass-card bg-[var(--bg-card)] border border-blue-500/30 space-y-4 shadow-sm">
              <div className="flex items-center gap-2.5 border-b border-[var(--border-color)] pb-3">
                <span className="px-2.5 py-1 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 font-mono font-black text-xs">
                  LOOPHOLE 6
                </span>
                <h4 className="font-extrabold text-sm text-[var(--text-primary)]">
                  Automated Form 15G / 15H Generation (Stop 10% TDS)
                </h4>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  Banks &amp; corporate bond issuers deduct 10% TDS under Section 194A/193 if annual interest exceeds ₹40,000 (₹50,000 for seniors). Generate a pre-filled, compliant declaration to prevent TDS upfront.
                </p>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                  <div>
                    <div className="font-bold text-[var(--text-primary)]">Form 15G (&lt; 60 Yrs) / 15H (Senior)</div>
                    <div className="text-[10px] text-emerald-600 font-bold font-mono">Stops ₹7,800 TDS on NCD Coupons</div>
                  </div>

                  <button
                    onClick={handleGenerateForm15}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Pre-Filled Form</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* DUAL COUPLING: LOOPHOLE 7 (SEC 80C/80CCD) & LOOPHOLE 8 (SEC 115BAC OPTIMIZER) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LOOPHOLE 7: Section 80C & 80CCD(1B) Strategic Routing */}
            <div className="p-6 rounded-2xl glass-card bg-[var(--bg-card)] border border-teal-500/30 space-y-4 shadow-sm">
              <div className="flex items-center gap-2.5 border-b border-[var(--border-color)] pb-3">
                <span className="px-2.5 py-1 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400 font-mono font-black text-xs">
                  LOOPHOLE 7
                </span>
                <h4 className="font-extrabold text-sm text-[var(--text-primary)]">
                  Section 80C &amp; 80CCD(1B) Strategic Deduction Routing
                </h4>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span>ELSS 3-Yr Lock-in (Sec 80C):</span>
                    <span className="font-bold text-[var(--text-primary)]">₹{deductionRouting.elssAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>NPS Tier-1 Equity (Sec 80CCD(1B)):</span>
                    <span className="font-bold text-[var(--text-primary)]">₹{deductionRouting.npsTier1Amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[var(--border-color)] text-emerald-600 dark:text-emerald-400 font-black">
                    <span>Direct Tax Saved (31.2% Bracket):</span>
                    <span>+₹{deductionRouting.directTaxSaved.toLocaleString('en-IN')} / Yr</span>
                  </div>
                </div>
                <div className="text-[11px] text-[var(--text-muted)] font-mono">
                  10-Year Compounded Wealth Corpus (@ 15% CAGR): ₹{deductionRouting.wealthCreationPotential10Yr.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* LOOPHOLE 8: Section 115BAC New vs Old Tax Regime Optimization */}
            <div className="p-6 rounded-2xl glass-card bg-[var(--bg-card)] border border-orange-500/30 space-y-4 shadow-sm">
              <div className="flex items-center gap-2.5 border-b border-[var(--border-color)] pb-3">
                <span className="px-2.5 py-1 rounded-xl bg-orange-500/20 text-orange-600 dark:text-orange-400 font-mono font-black text-xs">
                  LOOPHOLE 8
                </span>
                <h4 className="font-extrabold text-sm text-[var(--text-primary)]">
                  Section 115BAC New vs Old Regime Optimization
                </h4>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] block">Gross Annual Salary (₹)</label>
                    <input
                      type="number"
                      step="100000"
                      value={grossSalaryInput}
                      onChange={(e) => setGrossSalaryInput(Math.max(100000, Number(e.target.value)))}
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-2 py-1 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] block">Claimable Deductions (80C, 80D, HRA)</label>
                    <input
                      type="number"
                      step="25000"
                      value={oldDeductionsInput}
                      onChange={(e) => setOldDeductionsInput(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-2 py-1 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span>New Regime Tax (₹75k Std Ded):</span>
                    <span className="font-bold text-[var(--text-primary)]">₹{regimeComparison.newRegimeTax.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Old Regime Tax (With Deductions):</span>
                    <span className="font-bold text-[var(--text-primary)]">₹{regimeComparison.oldRegimeTax.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[var(--border-color)] font-extrabold text-emerald-600 dark:text-emerald-400">
                    <span>Recommended Regime:</span>
                    <span>{regimeComparison.optimalRegime.replace('_', ' ')} (Save ₹{regimeComparison.taxDifference.toLocaleString('en-IN')})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: BUDGET 2024-2026 REFERENCE TABLE */}
      {activeTaxTab === 'reference' && (
        <div className="p-6 rounded-2xl glass-card bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-sm">
          <div className="border-b border-[var(--border-color)] pb-3">
            <h4 className="font-extrabold text-base text-[var(--text-primary)] flex items-center gap-2">
              <Scale className="w-5 h-5 text-[var(--icici-orange)]" />
              Comprehensive Indian Capital Gains Tax Rate Reference Table (Budget 2024–2026)
            </h4>
            <span className="text-xs text-[var(--text-secondary)]">
              Audited statutory reference according to the Income Tax Act, 1961 as amended by Finance Act 2024
            </span>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="fin-table">
              <thead>
                <tr>
                  <th>Asset Class &amp; Instrument</th>
                  <th>Holding Period for LTCG</th>
                  <th>Short-Term Capital Gains (STCG)</th>
                  <th>Long-Term Capital Gains (LTCG)</th>
                  <th>Statutory Reference</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-bold text-[var(--text-primary)]">Listed Indian Equities &amp; Equity MFs</td>
                  <td className="font-mono text-xs">&gt; 12 Months</td>
                  <td className="font-mono font-bold text-amber-500">Flat 20.0%</td>
                  <td className="font-mono font-bold text-purple-500">12.5% on gains exceeding ₹1.25 Lakh</td>
                  <td className="font-mono text-[11px] text-[var(--text-muted)]">Section 111A / 112A</td>
                </tr>
                <tr>
                  <td className="font-bold text-[var(--text-primary)]">Sovereign Gold Bonds (SGB - RBI)</td>
                  <td className="font-mono text-xs">Held to Maturity (8 Years)</td>
                  <td className="font-mono text-xs">Slab Rate (if sold &lt; 12M)</td>
                  <td className="font-mono font-black text-emerald-600 dark:text-emerald-400">100% TAX-FREE (0% Tax)</td>
                  <td className="font-mono text-[11px] text-emerald-600 font-bold">Section 47(viic)</td>
                </tr>
                <tr>
                  <td className="font-bold text-[var(--text-primary)]">PSU Tax-Free Bonds (REC, PFC, NHAI)</td>
                  <td className="font-mono text-xs">Any Tenor (Annual Coupons)</td>
                  <td className="font-mono font-black text-emerald-600 dark:text-emerald-400">Coupon is 100% Tax-Free</td>
                  <td className="font-mono font-black text-emerald-600 dark:text-emerald-400">Coupon is 100% Tax-Free</td>
                  <td className="font-mono text-[11px] text-emerald-600 font-bold">Section 10(15)(iv)(h)</td>
                </tr>
                <tr>
                  <td className="font-bold text-[var(--text-primary)]">Corporate NCDs &amp; Bank FDs</td>
                  <td className="font-mono text-xs">Interest Income</td>
                  <td className="font-mono text-xs">Taxed at Investor's Slab</td>
                  <td className="font-mono text-xs">Taxed at Investor's Slab (TDS avoided via 15G/15H)</td>
                  <td className="font-mono text-[11px] text-[var(--text-muted)]">Section 194A / 193</td>
                </tr>
                <tr>
                  <td className="font-bold text-[var(--text-primary)]">Section 54EC Capital Gains Bonds</td>
                  <td className="font-mono text-xs">5 Years Mandatory Lock-in</td>
                  <td className="text-xs text-[var(--text-muted)]">Not Applicable</td>
                  <td className="font-mono font-black text-emerald-600 dark:text-emerald-400">100% Exempt up to ₹50,00,000</td>
                  <td className="font-mono text-[11px] text-emerald-600 font-bold">Section 54EC</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: STATUTORY TAX HEADS LEDGER */}
      {activeTaxTab === 'ledger' && (
        <div className="p-6 rounded-2xl glass-card bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-sm">
          <div className="border-b border-[var(--border-color)] pb-3">
            <h4 className="font-extrabold text-base text-[var(--text-primary)]">
              Formal ITR Schedule CG Computation Ledger ({selectedFy})
            </h4>
            <span className="text-xs text-[var(--text-secondary)]">
              Line-by-line itemized ledger matching Income Tax Department e-filing specifications
            </span>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="fin-table">
              <thead>
                <tr>
                  <th>Income Head / Security</th>
                  <th>Section</th>
                  <th>Applicable Rate</th>
                  <th>Realized Capital Flow</th>
                  <th>Exemption Applied</th>
                  <th>Tax Payable</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-bold text-[var(--text-primary)]">Equity LTCG Delivery</td>
                  <td className="font-mono text-purple-500 font-bold">Section 112A</td>
                  <td className="font-mono">12.5%</td>
                  <td className="font-mono font-bold">+₹{taxMetrics.equityLtcgGain.toLocaleString('en-IN')}</td>
                  <td className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">-₹1,25,000</td>
                  <td className="font-mono font-black text-purple-600 dark:text-purple-400">₹{taxMetrics.ltcgTax.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td className="font-bold text-[var(--text-primary)]">Equity STCG Delivery</td>
                  <td className="font-mono text-amber-500 font-bold">Section 111A</td>
                  <td className="font-mono">20.0%</td>
                  <td className="font-mono font-bold">+₹{taxMetrics.equityStcgGain.toLocaleString('en-IN')}</td>
                  <td className="font-mono text-[var(--text-muted)]">₹0.00</td>
                  <td className="font-mono font-black text-amber-600 dark:text-amber-400">₹{taxMetrics.stcgTax.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td className="font-bold text-[var(--text-primary)]">Intraday Speculative P&amp;L</td>
                  <td className="font-mono text-blue-500 font-bold">Section 43(5)</td>
                  <td className="font-mono">Slab Rate (30%)</td>
                  <td className="font-mono font-bold">+₹{taxMetrics.intradaySpeculativePnl.toLocaleString('en-IN')}</td>
                  <td className="font-mono text-[var(--text-muted)]">₹0.00</td>
                  <td className="font-mono font-black text-blue-600 dark:text-blue-400">₹{taxMetrics.intradayTax.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td className="font-bold text-[var(--text-primary)]">Sovereign Gold Bonds (SGB)</td>
                  <td className="font-mono text-emerald-600 font-bold">Section 47(viic)</td>
                  <td className="font-mono text-emerald-600">0.0% (Exempt)</td>
                  <td className="font-mono font-bold">+₹{taxMetrics.sgbExemptGains.toLocaleString('en-IN')}</td>
                  <td className="font-mono text-emerald-600 font-bold">100% Tax Free</td>
                  <td className="font-mono font-black text-emerald-600">₹0.00</td>
                </tr>
                <tr className="bg-[var(--bg-tertiary)] font-bold">
                  <td colSpan={5} className="text-right uppercase tracking-wider text-xs">Total Net Capital Gains Tax Payable:</td>
                  <td className="font-mono font-black text-base text-[var(--icici-orange)]">₹{taxMetrics.totalTaxPayable.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CapitalGainsTaxAuditor;
