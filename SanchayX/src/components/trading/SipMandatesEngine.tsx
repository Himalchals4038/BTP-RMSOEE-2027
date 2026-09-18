import React, { useState, useMemo } from 'react';
import {
  Coins,
  Repeat,
  Play,
  Pause,
  Plus,
  Trash2,
  TrendingUp,
  Landmark,
  CheckCircle2,
  Calendar,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import { useTradingSimulation } from '../../context/TradingSimulationContext';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCompactCurrency } from '../../utils/financialMath';
import { soundService } from '../../services/soundService';

export interface SipMandate {
  id: string;
  ticker: string;
  name: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly';
  dayOfMonth: number;
  installmentAmount: number;
  totalInvested: number;
  accumulatedUnits: number;
  avgNav: number;
  currentNav: number;
  status: 'ACTIVE' | 'PAUSED';
  nextRunDate: string;
  startDate: string;
}

export interface SipExecutionRecord {
  id: string;
  mandateId: string;
  date: string;
  ticker: string;
  amountDebited: number;
  nav: number;
  unitsCredited: number;
}

export const SipMandatesEngine: React.FC = () => {
  const { wallet, placeOrder } = useTradingSimulation();
  const { currency, theme } = usePortfolio();

  // Active Mandates State
  const [mandates, setMandates] = useState<SipMandate[]>([
    {
      id: 'SIP-MANDATE-101',
      ticker: 'NIFTYBEES.NS',
      name: 'Nippon India Nifty 50 BeES ETF',
      frequency: 'Monthly',
      dayOfMonth: 5,
      installmentAmount: 10000,
      totalInvested: 120000,
      accumulatedUnits: 512,
      avgNav: 234.37,
      currentNav: 254.20,
      status: 'ACTIVE',
      nextRunDate: '05-Oct-2026',
      startDate: '05-Oct-2025'
    },
    {
      id: 'SIP-MANDATE-102',
      ticker: 'GOLDBEES.NS',
      name: 'Nippon India Gold ETF BeES',
      frequency: 'Monthly',
      dayOfMonth: 10,
      installmentAmount: 5000,
      totalInvested: 60000,
      accumulatedUnits: 88,
      avgNav: 681.81,
      currentNav: 742.50,
      status: 'ACTIVE',
      nextRunDate: '10-Oct-2026',
      startDate: '10-Oct-2025'
    },
    {
      id: 'SIP-MANDATE-103',
      ticker: 'AAA_CORP_BOND',
      name: 'HDFC / L&T AAA Corporate Bond Basket',
      frequency: 'Monthly',
      dayOfMonth: 15,
      installmentAmount: 15000,
      totalInvested: 90000,
      accumulatedUnits: 90,
      avgNav: 1000.00,
      currentNav: 1045.00,
      status: 'ACTIVE',
      nextRunDate: '15-Oct-2026',
      startDate: '15-Apr-2026'
    }
  ]);

  // Execution History Ledger
  const [executionHistory, setExecutionHistory] = useState<SipExecutionRecord[]>([
    {
      id: 'EXEC-9921',
      mandateId: 'SIP-MANDATE-101',
      date: '05-Sep-2026',
      ticker: 'NIFTYBEES.NS',
      amountDebited: 10000,
      nav: 252.10,
      unitsCredited: 39.66
    },
    {
      id: 'EXEC-9920',
      mandateId: 'SIP-MANDATE-102',
      date: '10-Sep-2026',
      ticker: 'GOLDBEES.NS',
      amountDebited: 5000,
      nav: 738.40,
      unitsCredited: 6.77
    },
    {
      id: 'EXEC-9919',
      mandateId: 'SIP-MANDATE-103',
      date: '15-Sep-2026',
      ticker: 'AAA_CORP_BOND',
      amountDebited: 15000,
      nav: 1040.00,
      unitsCredited: 14.42
    }
  ]);

  // Form State for creating a new SIP mandate
  const [newTicker, setNewTicker] = useState<string>('NIFTYBEES.NS');
  const [newFrequency, setNewFrequency] = useState<'Daily' | 'Weekly' | 'Monthly'>('Monthly');
  const [newAmount, setNewAmount] = useState<number>(5000);
  const [newDay, setNewDay] = useState<number>(5);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Available instruments for retail banking SIP
  const sipInstruments = [
    { ticker: 'NIFTYBEES.NS', name: 'Nippon India Nifty 50 BeES ETF', nav: 254.20, cat: 'Large Cap Index' },
    { ticker: 'GOLDBEES.NS', name: 'Nippon India Gold ETF BeES', nav: 742.50, cat: 'Sovereign Bullion' },
    { ticker: 'SETFNIF50.NS', name: 'SBI Nifty 50 ETF', nav: 255.10, cat: 'Sovereign Index' },
    { ticker: 'JUNIORBEES.NS', name: 'Nippon India Nifty Next 50 ETF', nav: 680.40, cat: 'Mid Cap Alpha' },
    { ticker: 'AAA_CORP_BOND', name: 'HDFC / L&T AAA Corporate Bond Basket', nav: 1045.00, cat: 'Fixed Income' }
  ];

  // Create New Mandate
  const handleCreateMandate = (e: React.FormEvent) => {
    e.preventDefault();
    const inst = sipInstruments.find(i => i.ticker === newTicker) || sipInstruments[0];
    const newMandate: SipMandate = {
      id: `SIP-MANDATE-${Math.floor(100 + Math.random() * 900)}`,
      ticker: inst.ticker,
      name: inst.name,
      frequency: newFrequency,
      dayOfMonth: newDay,
      installmentAmount: newAmount,
      totalInvested: 0,
      accumulatedUnits: 0,
      avgNav: inst.nav,
      currentNav: inst.nav,
      status: 'ACTIVE',
      nextRunDate: `${newDay < 10 ? '0' : ''}${newDay}-Oct-2026`,
      startDate: new Date().toLocaleDateString('en-GB')
    };

    setMandates([newMandate, ...mandates]);
    soundService.playExecutionChime();
    setSuccessBanner(`Recurring SIP mandate registered successfully for ${inst.name} (₹${newAmount.toLocaleString()}/${newFrequency})!`);
    setTimeout(() => setSuccessBanner(null), 5000);
  };

  // Toggle Pause/Resume
  const handleToggleStatus = (id: string) => {
    setMandates(mandates.map(m => {
      if (m.id !== id) return m;
      const nextStatus = m.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      return { ...m, status: nextStatus };
    }));
  };

  // Delete Mandate
  const handleDeleteMandate = (id: string) => {
    setMandates(mandates.filter(m => m.id !== id));
  };

  // Simulate Instantaneous Execution Run (Debit Bank Auto-Sweep -> Credit Demat Units)
  const handleTriggerRun = (mandate: SipMandate) => {
    const inst = sipInstruments.find(i => i.ticker === mandate.ticker) || sipInstruments[0];
    const unitsPurchased = Number((mandate.installmentAmount / inst.nav).toFixed(2));

    // Execute Demat order placement in simulation context
    placeOrder({
      ticker: mandate.ticker,
      action: 'BUY',
      product: 'Delivery (CNC)',
      orderType: 'Market Order',
      qty: Math.max(1, Math.round(unitsPurchased)),
      price: inst.nav
    });

    // Update mandate running totals
    const newTotalInvested = mandate.totalInvested + mandate.installmentAmount;
    const newTotalUnits = mandate.accumulatedUnits + unitsPurchased;
    const newAvgNav = Number((newTotalInvested / newTotalUnits).toFixed(2));

    setMandates(mandates.map(m => {
      if (m.id !== mandate.id) return m;
      return {
        ...m,
        totalInvested: newTotalInvested,
        accumulatedUnits: Number(newTotalUnits.toFixed(2)),
        avgNav: newAvgNav
      };
    }));

    // Record execution event
    const newRecord: SipExecutionRecord = {
      id: `EXEC-${Math.floor(1000 + Math.random() * 9000)}`,
      mandateId: mandate.id,
      date: new Date().toLocaleDateString('en-GB'),
      ticker: mandate.ticker,
      amountDebited: mandate.installmentAmount,
      nav: inst.nav,
      unitsCredited: unitsPurchased
    };
    setExecutionHistory([newRecord, ...executionHistory]);

    soundService.playExecutionChime();
    setSuccessBanner(
      `Auto-Sweep Debit: ₹${mandate.installmentAmount.toLocaleString()} debited from Savings Bank Account. Credited +${unitsPurchased} units of ${mandate.ticker} @ NAV ₹${inst.nav.toFixed(2)} directly into Demat Holdings!`
    );
    setTimeout(() => setSuccessBanner(null), 6000);
  };

  // Rupee-Cost Averaging (RCA) Visualizer Simulation Data
  // Compares 12 months of periodic monthly SIP vs Lump-Sum at cycle peak
  const rcaChartData = useMemo(() => {
    const months = ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6', 'Month 7', 'Month 8', 'Month 9', 'Month 10', 'Month 11', 'Month 12'];
    // Volatile market cycle: drops 20% then recovers
    const navCycle = [250, 240, 220, 205, 195, 210, 225, 238, 252, 265, 274, 282];
    const monthlySip = 10000;
    const lumpSumCapital = 120000; // Invested at Month 1 peak (NAV = 250)
    const lumpSumUnits = lumpSumCapital / navCycle[0]; // 480 units

    let sipCumUnits = 0;
    let sipCumInvested = 0;

    return months.map((month, idx) => {
      const nav = navCycle[idx];
      sipCumInvested += monthlySip;
      const boughtUnits = monthlySip / nav;
      sipCumUnits += boughtUnits;

      const sipCurrentVal = Math.round(sipCumUnits * nav);
      const lumpSumVal = Math.round(lumpSumUnits * nav);
      const sipAvgNav = Number((sipCumInvested / sipCumUnits).toFixed(1));

      return {
        month,
        marketNav: nav,
        sipValue: sipCurrentVal,
        lumpSumValue: lumpSumVal,
        sipInvested: sipCumInvested,
        sipAvgNav
      };
    });
  }, []);

  const totalSipInvested = mandates.reduce((acc, m) => acc + m.totalInvested, 0);
  const totalSipCurrentVal = mandates.reduce((acc, m) => acc + (m.accumulatedUnits * m.currentNav), 0);
  const totalSipPnl = totalSipCurrentVal - totalSipInvested;

  const axisColor = theme === 'dark' ? '#64748b' : '#94a3b8';
  const tooltipBg = theme === 'dark' ? '#0f172a' : '#ffffff';
  const tooltipBorder = theme === 'dark' ? '#1e293b' : '#e2e8f0';

  return (
    <div className="space-y-6 w-full">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
        <div>
          <h3 className="text-lg font-black flex items-center gap-2 text-[var(--text-primary)]">
            <Coins className="w-5 h-5 text-emerald-500" />
            Systematic Investment Plan (SIP) & Recurring Mandates Engine
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Auto-Sweep Accrual
            </span>
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Automated wealth creation via NPCI standing mandates into NIFTYBEES, GOLDBEES, and AAA corporate bonds. Debits auto-sweep savings and accrues Demat units at prevailing market NAVs.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[var(--bg-tertiary)] px-4 py-2 rounded-2xl border border-[var(--border-color)]">
          <Landmark className="w-4 h-4 text-[var(--icici-orange)]" />
          <div className="text-xs">
            <span className="text-[10px] text-[var(--text-muted)] font-bold block uppercase">Bank Auto-Sweep Balance</span>
            <span className="font-mono font-black text-sm text-[var(--text-primary)]">
              {formatCompactCurrency(wallet.autoSweepBalance, currency)}
            </span>
          </div>
        </div>
      </div>

      {successBanner && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Summary Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-1 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-[var(--text-muted)]">ACTIVE SIP MANDATES</span>
          <div className="text-2xl font-mono font-black text-[var(--text-primary)]">
            {mandates.filter(m => m.status === 'ACTIVE').length} Mandates
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] font-medium block">
            Monthly Debit Commitment: ₹{mandates.reduce((acc, m) => acc + (m.status === 'ACTIVE' ? m.installmentAmount : 0), 0).toLocaleString()}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-1 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-[var(--text-muted)]">TOTAL SIP ACCUMULATED CAPITAL</span>
          <div className="text-2xl font-mono font-black text-[var(--text-primary)]">
            {formatCompactCurrency(totalSipCurrentVal, currency)}
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] font-medium block">
            Cost Basis: {formatCompactCurrency(totalSipInvested, currency)}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 border border-emerald-500/30 space-y-1 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300">WEALTH GENERATED (P&L)</span>
          <div className="text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400">
            +{formatCompactCurrency(totalSipPnl, currency)}
          </div>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold block">
            +{((totalSipPnl / (totalSipInvested || 1)) * 100).toFixed(2)}% Absolute Growth
          </span>
        </div>
      </div>

      {/* Rupee-Cost Averaging (RCA) Demonstration Chart */}
      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
          <div>
            <h4 className="font-extrabold text-sm text-[var(--text-primary)] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Rupee-Cost Averaging (RCA) Alpha Visualizer: Periodic SIP vs Lump-Sum
            </h4>
            <span className="text-[11px] text-[var(--text-secondary)]">
              Demonstrating how periodic investments systematically accumulate more units during market dips and deliver superior alpha upon recovery.
            </span>
          </div>
          <div className="px-3 py-1 rounded-full text-[10px] font-mono font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            +17.5% RCA Outperformance
          </div>
        </div>

        <div className="h-[320px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rcaChartData}>
              <defs>
                <linearGradient id="colorSip" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke={axisColor} fontSize={10} />
              <YAxis stroke={axisColor} fontSize={10} tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, fontSize: '11px' }}
                formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, '']}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Area type="monotone" dataKey="sipValue" name="Periodic SIP Portfolio Value" stroke="#10b981" strokeWidth={2.5} fill="url(#colorSip)" isAnimationActive={false} />
              <Line type="monotone" dataKey="lumpSumValue" name="Lump-Sum Investment Timing" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="sipInvested" name="Cumulative Capital Deposited" stroke={axisColor} strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[var(--border-color)] text-xs">
          <div className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
            <span className="text-[10px] font-bold text-[var(--text-muted)] block">FINAL SIP VALUE (RCA)</span>
            <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">₹1,58,400</span>
            <span className="text-[10px] text-[var(--text-secondary)] block mt-0.5">Average Acquired NAV: ₹218.40</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
            <span className="text-[10px] font-bold text-[var(--text-muted)] block">FINAL LUMP-SUM VALUE</span>
            <span className="font-mono font-extrabold text-sm text-[var(--text-primary)]">₹1,34,800</span>
            <span className="text-[10px] text-[var(--text-secondary)] block mt-0.5">Peak Inception NAV: ₹250.00</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
            <span className="text-[10px] font-bold text-[var(--text-muted)] block">RCA DIP ADVANTAGE</span>
            <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">+82 Extra Units</span>
            <span className="text-[10px] text-[var(--text-secondary)] block mt-0.5">Accumulated during corrections</span>
          </div>
        </div>
      </div>

      {/* Active Mandates Table & Registration Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Mandates List (2 spans) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <h4 className="font-extrabold text-sm text-[var(--text-primary)] flex items-center gap-2">
              <Repeat className="w-4 h-4 text-[var(--icici-orange)]" />
              Active Simulated SIP Mandates ({mandates.length})
            </h4>
            <span className="text-[11px] text-[var(--text-muted)] font-mono">
              Auto-deducted from bank savings
            </span>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="fin-table">
              <thead>
                <tr>
                  <th>Mandate ID / Ticker</th>
                  <th>Schedule</th>
                  <th>Installment</th>
                  <th>Accumulated</th>
                  <th>Avg NAV</th>
                  <th>Status</th>
                  <th>Trigger / Actions</th>
                </tr>
              </thead>
              <tbody>
                {mandates.map(m => (
                  <tr key={m.id}>
                    <td>
                      <span className="font-mono font-extrabold text-xs text-[var(--text-primary)] block">{m.ticker}</span>
                      <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[150px] block">{m.name}</span>
                    </td>
                    <td>
                      <span className="text-xs font-bold text-[var(--text-primary)] block">{m.frequency}</span>
                      <span className="text-[10px] text-[var(--text-secondary)] font-mono">Day {m.dayOfMonth}</span>
                    </td>
                    <td className="font-mono font-bold text-[var(--text-primary)]">
                      ₹{m.installmentAmount.toLocaleString()}
                    </td>
                    <td>
                      <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 block">
                        {m.accumulatedUnits} Units
                      </span>
                      <span className="font-mono text-[10px] text-[var(--text-muted)]">
                        (Val: ₹{Math.round(m.accumulatedUnits * m.currentNav).toLocaleString()})
                      </span>
                    </td>
                    <td className="font-mono text-xs text-[var(--text-secondary)]">
                      ₹{m.avgNav.toFixed(2)}
                    </td>
                    <td>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        m.status === 'ACTIVE'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleTriggerRun(m)}
                          disabled={m.status === 'PAUSED'}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-extrabold text-[10px] transition-all cursor-pointer shadow-xs flex items-center gap-1"
                          title="Simulate instant execution run"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>Run Now</span>
                        </button>
                        <button
                          onClick={() => handleToggleStatus(m.id)}
                          className="p-1 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] border border-[var(--border-color)] cursor-pointer"
                          title={m.status === 'ACTIVE' ? 'Pause mandate' : 'Resume mandate'}
                        >
                          {m.status === 'ACTIVE' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-500" />}
                        </button>
                        <button
                          onClick={() => handleDeleteMandate(m.id)}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/15 cursor-pointer"
                          title="Cancel mandate"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create New SIP Mandate Card (1 span) */}
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-sm">
          <div className="border-b border-[var(--border-color)] pb-3">
            <h4 className="font-extrabold text-sm text-[var(--text-primary)] flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-500" />
              Setup New Recurring Mandate
            </h4>
            <span className="text-[11px] text-[var(--text-secondary)]">
              Link automated debits to your Auto-Sweep account
            </span>
          </div>

          <form onSubmit={handleCreateMandate} className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-[var(--text-primary)]">Select Wealth Instrument</label>
              <select
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value)}
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-2 font-bold text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)]"
              >
                {sipInstruments.map(i => (
                  <option key={i.ticker} value={i.ticker}>
                    {i.ticker} — {i.name} (₹{i.nav})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-[var(--text-primary)]">Frequency</label>
                <select
                  value={newFrequency}
                  onChange={(e) => setNewFrequency(e.target.value as any)}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-2 font-bold text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)]"
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly (Monday)</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--text-primary)]">Debit Date</label>
                <select
                  value={newDay}
                  onChange={(e) => setNewDay(Number(e.target.value))}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-2 font-bold text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)]"
                >
                  {[1, 5, 10, 15, 20, 25].map(d => (
                    <option key={d} value={d}>{d}th of Month</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[var(--text-primary)]">Installment Amount ({currency})</label>
              <input
                type="number"
                step="500"
                min="500"
                value={newAmount}
                onChange={(e) => setNewAmount(Number(e.target.value))}
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-2 font-mono font-bold text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)]"
              />
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[11px] text-[var(--text-secondary)] space-y-1">
              <div className="flex items-center gap-1 font-bold text-[var(--text-primary)]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                NPCI E-Mandate Authorization
              </div>
              <p>Simulated debits occur via Bank NACH Auto-Sweep directly crediting depository units.</p>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[var(--icici-orange)] hover:bg-[var(--icici-orange-hover)] text-white font-extrabold text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Repeat className="w-4 h-4" />
              Register Recurring SIP Mandate
            </button>
          </form>
        </div>
      </div>

      {/* SIP Execution Audit Log */}
      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3 shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <h4 className="font-extrabold text-sm text-[var(--text-primary)] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-500" />
            SIP Execution Log & Demat Accrual Ledger
          </h4>
          <span className="text-[11px] text-[var(--text-muted)] font-mono">
            {executionHistory.length} Recorded Runs
          </span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="fin-table">
            <thead>
              <tr>
                <th>Execution ID</th>
                <th>Date</th>
                <th>Mandate Ref</th>
                <th>Instrument</th>
                <th>Amount Debited</th>
                <th>NAV Price</th>
                <th>Units Credited</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {executionHistory.map(h => (
                <tr key={h.id}>
                  <td className="font-mono text-xs text-[var(--text-muted)]">{h.id}</td>
                  <td className="font-mono text-xs text-[var(--text-secondary)]">{h.date}</td>
                  <td className="font-mono text-xs text-[var(--text-primary)] font-bold">{h.mandateId}</td>
                  <td className="font-mono font-bold text-[var(--text-primary)]">{h.ticker}</td>
                  <td className="font-mono font-bold text-rose-600 dark:text-rose-400">
                    -₹{h.amountDebited.toLocaleString()}
                  </td>
                  <td className="font-mono text-xs text-[var(--text-secondary)]">₹{h.nav.toFixed(2)}</td>
                  <td className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    +{h.unitsCredited} Units
                  </td>
                  <td>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      SUCCESS
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SipMandatesEngine;

