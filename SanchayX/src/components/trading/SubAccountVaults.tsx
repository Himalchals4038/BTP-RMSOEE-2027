import React, { useState, useMemo } from 'react';
import {
  Vault,
  ShieldCheck,
  Target,
  ArrowRightLeft,
  Plus,
  TrendingUp,
  RefreshCw,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  PieChart as PieIcon,
  Layers,
  Trash2,
  X,
  Coins
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from 'recharts';
import { useTradingSimulation } from '../../context/TradingSimulationContext';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCompactCurrency } from '../../utils/financialMath';
import { soundService } from '../../services/soundService';

export interface GoalVault {
  id: string;
  name: string;
  category: 'RETIREMENT' | 'ALPHA' | 'EDUCATION' | 'WEALTH_CREATION' | 'CUSTOM';
  targetAmount: number;
  targetYear: number;
  allocatedCash: number;
  allocatedHoldingsValue: number;
  isRingFenced: boolean; // Immune to intraday margin calls
  targetAllocation: {
    equity: number; // percentage
    debt: number;   // percentage
    gold: number;   // percentage
    cash: number;   // percentage
  };
  actualAllocation: {
    equity: number;
    debt: number;
    gold: number;
    cash: number;
  };
  historicalSharpe: number;
  maxDrawdownPct: number;
  cagrPct: number;
  taggedHoldings: { ticker: string; name: string; qty: number; value: number; type: 'EQUITY' | 'BOND' | 'GOLD' }[];
}

const INITIAL_VAULTS: GoalVault[] = [
  {
    id: 'vault-retire-2045',
    name: 'Retirement Corpus (Target 2045)',
    category: 'RETIREMENT',
    targetAmount: 25000000,
    targetYear: 2045,
    allocatedCash: 250000,
    allocatedHoldingsValue: 1250000,
    isRingFenced: true,
    targetAllocation: { equity: 30, debt: 55, gold: 10, cash: 5 },
    actualAllocation: { equity: 36, debt: 48, gold: 11, cash: 5 },
    historicalSharpe: 1.84,
    maxDrawdownPct: 6.4,
    cagrPct: 12.8,
    taggedHoldings: [
      { ticker: 'GOI-738-2027', name: '7.38% GS 2027 Sovereign Bond', qty: 500, value: 512000, type: 'BOND' },
      { ticker: 'NHAI-820-2029', name: 'NHAI 8.20% Tax Free Bond', qty: 250, value: 278000, type: 'BOND' },
      { ticker: 'SGB-2028-IV', name: 'Sovereign Gold Bond 2.5% 2028', qty: 25, value: 185000, type: 'GOLD' },
      { ticker: 'HDFCBANK.NS', name: 'HDFC Bank Ltd', qty: 150, value: 247500, type: 'EQUITY' },
      { ticker: 'ITC.NS', name: 'ITC Ltd', qty: 600, value: 277500, type: 'EQUITY' }
    ]
  },
  {
    id: 'vault-alpha-trading',
    name: 'Short-Term Alpha Trading (MIS & F&O)',
    category: 'ALPHA',
    targetAmount: 5000000,
    targetYear: 2027,
    allocatedCash: 650000,
    allocatedHoldingsValue: 480000,
    isRingFenced: false,
    targetAllocation: { equity: 70, debt: 0, gold: 0, cash: 30 },
    actualAllocation: { equity: 65, debt: 0, gold: 0, cash: 35 },
    historicalSharpe: 2.12,
    maxDrawdownPct: 14.8,
    cagrPct: 22.4,
    taggedHoldings: [
      { ticker: 'RELIANCE.NS', name: 'Reliance Industries Ltd', qty: 120, value: 312000, type: 'EQUITY' },
      { ticker: 'TATAMOTORS.NS', name: 'Tata Motors Ltd', qty: 180, value: 168000, type: 'EQUITY' }
    ]
  },
  {
    id: 'vault-edu-2035',
    name: "Children's Global Education (Target 2035)",
    category: 'EDUCATION',
    targetAmount: 10000000,
    targetYear: 2035,
    allocatedCash: 120000,
    allocatedHoldingsValue: 840000,
    isRingFenced: true,
    targetAllocation: { equity: 40, debt: 45, gold: 10, cash: 5 },
    actualAllocation: { equity: 41, debt: 43, gold: 11, cash: 5 },
    historicalSharpe: 1.68,
    maxDrawdownPct: 5.1,
    cagrPct: 11.2,
    taggedHoldings: [
      { ticker: 'PFC-830-2031', name: 'Power Finance Corp 8.30% Bond', qty: 350, value: 362000, type: 'BOND' },
      { ticker: 'TCS.NS', name: 'Tata Consultancy Services', qty: 85, value: 345000, type: 'EQUITY' },
      { ticker: 'SGB-2029-I', name: 'Sovereign Gold Bond 2.5% 2029', qty: 18, value: 133000, type: 'GOLD' }
    ]
  }
];

const COLORS = {
  equity: '#3b82f6', // Blue
  debt: '#10b981',   // Emerald
  gold: '#f59e0b',   // Amber
  cash: '#8b5cf6'    // Violet
};

export const SubAccountVaults: React.FC = () => {
  const { wallet } = useTradingSimulation();
  const { currency } = usePortfolio();

  const [vaults, setVaults] = useState<GoalVault[]>(INITIAL_VAULTS);
  const [selectedVaultId, setSelectedVaultId] = useState<string>(INITIAL_VAULTS[0].id);

  // Transfer Cash Modal State
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [transferType, setTransferType] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT');
  const [transferAmount, setTransferAmount] = useState<number>(50000);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Create Vault Modal State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newVaultName, setNewVaultName] = useState<string>('');
  const [newVaultCategory, setNewVaultCategory] = useState<GoalVault['category']>('WEALTH_CREATION');
  const [newVaultTarget, setNewVaultTarget] = useState<number>(5000000);
  const [newVaultYear, setNewVaultYear] = useState<number>(2032);
  const [newVaultEquity, setNewVaultEquity] = useState<number>(50);
  const [newVaultDebt, setNewVaultDebt] = useState<number>(40);
  const [newVaultGold, setNewVaultGold] = useState<number>(10);

  const selectedVault = useMemo(() => {
    return vaults.find(v => v.id === selectedVaultId) || vaults[0];
  }, [vaults, selectedVaultId]);

  // Aggregate Vault Stats
  const aggregateStats = useMemo(() => {
    const totalPartitionedCash = vaults.reduce((acc, v) => acc + v.allocatedCash, 0);
    const totalPartitionedHoldings = vaults.reduce((acc, v) => acc + v.allocatedHoldingsValue, 0);
    const totalPartitionedValue = totalPartitionedCash + totalPartitionedHoldings;
    const unpartitionedCash = Math.max(0, wallet.cashBalance - totalPartitionedCash);
    const ringFencedValue = vaults
      .filter(v => v.isRingFenced)
      .reduce((acc, v) => acc + v.allocatedCash + v.allocatedHoldingsValue, 0);

    return {
      totalPartitionedValue,
      totalPartitionedCash,
      totalPartitionedHoldings,
      unpartitionedCash,
      ringFencedValue,
      vaultCount: vaults.length
    };
  }, [vaults, wallet.cashBalance]);

  // Toggle Ring-Fence
  const handleToggleRingFence = (vaultId: string) => {
    setVaults(prev => prev.map(v => {
      if (v.id === vaultId) {
        const nextState = !v.isRingFenced;
        soundService.playSuccess();
        return { ...v, isRingFenced: nextState };
      }
      return v;
    }));
  };

  // Rebalance Vault
  const handleRebalanceVault = (vaultId: string) => {
    setVaults(prev => prev.map(v => {
      if (v.id === vaultId) {
        soundService.playSuccess();
        return {
          ...v,
          actualAllocation: { ...v.targetAllocation }
        };
      }
      return v;
    }));
    setActionSuccessMsg(`Vault "${selectedVault.name}" rebalanced to 100% target asset weights.`);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  // Transfer Cash between Main Margin & Vault
  const handleExecuteTransfer = () => {
    if (transferAmount <= 0) return;

    if (transferType === 'DEPOSIT') {
      if (transferAmount > aggregateStats.unpartitionedCash) {
        alert('Insufficient free unpartitioned cash in wallet margin.');
        return;
      }
      setVaults(prev => prev.map(v => {
        if (v.id === selectedVaultId) {
          return { ...v, allocatedCash: v.allocatedCash + transferAmount };
        }
        return v;
      }));
      setActionSuccessMsg(`Transferred ${currency} ${transferAmount.toLocaleString()} to ${selectedVault.name}.`);
    } else {
      if (transferAmount > selectedVault.allocatedCash) {
        alert('Cannot withdraw more than allocated vault cash.');
        return;
      }
      setVaults(prev => prev.map(v => {
        if (v.id === selectedVaultId) {
          return { ...v, allocatedCash: v.allocatedCash - transferAmount };
        }
        return v;
      }));
      setActionSuccessMsg(`Withdrew ${currency} ${transferAmount.toLocaleString()} back to Free Trading Margin.`);
    }

    soundService.playSuccess();
    setShowTransferModal(false);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  // Create Custom Vault
  const handleCreateVault = () => {
    if (!newVaultName.trim()) return;
    const totalPct = newVaultEquity + newVaultDebt + newVaultGold;
    const cashPct = Math.max(0, 100 - totalPct);

    const newVault: GoalVault = {
      id: `vault-custom-${Date.now()}`,
      name: newVaultName,
      category: newVaultCategory,
      targetAmount: newVaultTarget,
      targetYear: newVaultYear,
      allocatedCash: 50000,
      allocatedHoldingsValue: 0,
      isRingFenced: true,
      targetAllocation: {
        equity: newVaultEquity,
        debt: newVaultDebt,
        gold: newVaultGold,
        cash: cashPct
      },
      actualAllocation: {
        equity: newVaultEquity,
        debt: newVaultDebt,
        gold: newVaultGold,
        cash: cashPct
      },
      historicalSharpe: 1.75,
      maxDrawdownPct: 7.2,
      cagrPct: 13.5,
      taggedHoldings: []
    };

    setVaults(prev => [...prev, newVault]);
    setSelectedVaultId(newVault.id);
    setShowCreateModal(false);
    setNewVaultName('');
    soundService.playSuccess();
    setActionSuccessMsg(`Created Goal Vault "${newVault.name}".`);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  // Delete Vault
  const handleDeleteVault = (vaultId: string) => {
    if (vaults.length <= 1) return;
    setVaults(prev => prev.filter(v => v.id !== vaultId));
    if (selectedVaultId === vaultId) {
      setSelectedVaultId(vaults[0].id);
    }
    soundService.playOrderCancel();
  };

  // Selected Vault Valuation & Drift
  const selectedVaultValuation = selectedVault.allocatedCash + selectedVault.allocatedHoldingsValue;
  const progressPct = Math.min(100, Math.round((selectedVaultValuation / selectedVault.targetAmount) * 100));

  const driftStatus = useMemo(() => {
    const equityDrift = Math.abs(selectedVault.actualAllocation.equity - selectedVault.targetAllocation.equity);
    const debtDrift = Math.abs(selectedVault.actualAllocation.debt - selectedVault.targetAllocation.debt);
    const goldDrift = Math.abs(selectedVault.actualAllocation.gold - selectedVault.targetAllocation.gold);
    const maxDrift = Math.max(equityDrift, debtDrift, goldDrift);

    return {
      maxDrift,
      isMisaligned: maxDrift >= 5.0,
      equityDrift: selectedVault.actualAllocation.equity - selectedVault.targetAllocation.equity
    };
  }, [selectedVault]);

  const allocationPieData = [
    { name: 'Equities', value: selectedVault.actualAllocation.equity, color: COLORS.equity },
    { name: 'Fixed Income & Bonds', value: selectedVault.actualAllocation.debt, color: COLORS.debt },
    { name: 'Sovereign Gold', value: selectedVault.actualAllocation.gold, color: COLORS.gold },
    { name: 'Cash & Sweeps', value: selectedVault.actualAllocation.cash, color: COLORS.cash }
  ].filter(d => d.value > 0);

  const comparisonBarData = [
    { asset: 'Equity', Target: selectedVault.targetAllocation.equity, Actual: selectedVault.actualAllocation.equity },
    { asset: 'Debt', Target: selectedVault.targetAllocation.debt, Actual: selectedVault.actualAllocation.debt },
    { asset: 'Gold', Target: selectedVault.targetAllocation.gold, Actual: selectedVault.actualAllocation.gold },
    { asset: 'Cash', Target: selectedVault.targetAllocation.cash, Actual: selectedVault.actualAllocation.cash }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Vault className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-[var(--text-primary)]">
                Multi-Goal Sub-Account Vaults
              </h2>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                Institutional Partitioning
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Partition portfolio capital into goal-dedicated virtual vaults with independent Sharpe, Max Drawdown, and SEBI-compliant Ring-Fenced liquidation immunity.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>Create Goal Vault</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTransferType('DEPOSIT');
              setShowTransferModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Internal Capital Transfer</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {actionSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMsg(null)}
            className="text-emerald-400 hover:text-emerald-200 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* High-Level Institutional Capital Health Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-1 shadow-xs">
          <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            Total Partitioned Capital
          </span>
          <div className="text-xl font-black font-mono text-[var(--text-primary)]">
            {currency} {aggregateStats.totalPartitionedValue.toLocaleString()}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]">
            <span>{aggregateStats.vaultCount} Active Goal Vaults</span>
            <span className="text-emerald-400 font-bold">100% Solvency</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-1 shadow-xs">
          <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            Free Unpartitioned Margin
          </span>
          <div className="text-xl font-black font-mono text-[var(--text-primary)]">
            {currency} {aggregateStats.unpartitionedCash.toLocaleString()}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]">
            <span>Available for Intraday MIS</span>
            <span className="text-indigo-400 font-bold">Liquid</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-1 shadow-xs">
          <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Ring-Fenced Protected Corpus
          </span>
          <div className="text-xl font-black font-mono text-emerald-400">
            {currency} {aggregateStats.ringFencedValue.toLocaleString()}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]">
            <span>SEBI Margin Immunity</span>
            <span className="text-emerald-400 font-bold">100% Safe</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-1 shadow-xs">
          <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-blue-400" />
            Overall Goal Completion
          </span>
          <div className="text-xl font-black font-mono text-[var(--text-primary)]">
            {Math.round((aggregateStats.totalPartitionedValue / 40000000) * 100)}%
          </div>
          <div className="text-[10px] text-[var(--text-muted)] flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]">
            <span>Target: ₹4.00 Cr Across Vaults</span>
            <span className="text-blue-400 font-bold">On Track</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Vault Selector Tabs & Active Vault Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Vault List Cards */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--text-secondary)] px-1">
            <span>SELECT GOAL VAULT</span>
            <span>{vaults.length} VAULTS</span>
          </div>

          <div className="space-y-3">
            {vaults.map(v => {
              const isSelected = v.id === selectedVaultId;
              const vValuation = v.allocatedCash + v.allocatedHoldingsValue;
              const vProgress = Math.min(100, Math.round((vValuation / v.targetAmount) * 100));

              return (
                <div
                  key={v.id}
                  onClick={() => setSelectedVaultId(v.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-[var(--bg-card)] border-indigo-500 shadow-md ring-1 ring-indigo-500/30'
                      : 'bg-[var(--bg-card)]/70 border-[var(--border-color)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-[var(--text-primary)]">
                          {v.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] mt-1">
                        <span className="px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] font-bold text-[var(--text-secondary)]">
                          Target: {v.targetYear}
                        </span>
                        <span>Sharpe: <strong className="text-indigo-400 font-mono">{v.historicalSharpe}</strong></span>
                        <span>MDD: <strong className="text-rose-400 font-mono">-{v.maxDrawdownPct}%</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleRingFence(v.id);
                        }}
                        title={v.isRingFenced ? 'Ring-Fenced: Protected against margin calls' : 'Unprotected: Exposed to intraday liquidation'}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          v.isRingFenced
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            : 'bg-zinc-500/10 border-zinc-500/20 text-[var(--text-muted)]'
                        }`}
                      >
                        {v.isRingFenced ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>

                      {vaults.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteVault(v.id);
                          }}
                          className="p-1.5 rounded-lg hover:bg-rose-500/20 text-[var(--text-muted)] hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-muted)]">Corpus Valuation:</span>
                      <span className="font-mono font-black text-[var(--text-primary)]">
                        {currency} {vValuation.toLocaleString()}
                      </span>
                    </div>

                    <div className="w-full bg-[var(--bg-tertiary)] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${vProgress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono">
                      <span>Goal Target: {formatCompactCurrency(v.targetAmount)}</span>
                      <span className="font-bold text-indigo-400">{vProgress}% Funded</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Vault Detailed Breakdown */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Vault Header Card */}
          <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-md space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-black text-[var(--text-primary)]">
                    {selectedVault.name}
                  </h3>
                  {selectedVault.isRingFenced ? (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> RING-FENCED IMMUNE
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> UNPROTECTED POOL
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Goal Horizon: Year {selectedVault.targetYear} • Compound Annual Growth Rate (CAGR): <span className="font-bold text-emerald-400">+{selectedVault.cagrPct}%</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRebalanceVault(selectedVault.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] transition-all cursor-pointer shadow-2xs"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                  <span>One-Click Rebalance</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTransferType('DEPOSIT');
                    setShowTransferModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Funds</span>
                </button>
              </div>
            </div>

            {/* Financial Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] space-y-1">
                <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Total Valuation</span>
                <div className="text-base font-black font-mono text-[var(--text-primary)]">
                  {currency} {selectedVaultValuation.toLocaleString()}
                </div>
                <div className="text-[10px] text-indigo-400 font-bold">{progressPct}% of Goal</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] space-y-1">
                <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Sharpe Ratio</span>
                <div className="text-base font-black font-mono text-emerald-400">
                  {selectedVault.historicalSharpe.toFixed(2)}
                </div>
                <div className="text-[10px] text-[var(--text-muted)]">Risk-Adjusted Alpha</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] space-y-1">
                <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Max Historical Drawdown</span>
                <div className="text-base font-black font-mono text-rose-400">
                  -{selectedVault.maxDrawdownPct.toFixed(1)}%
                </div>
                <div className="text-[10px] text-[var(--text-muted)]">Peak-to-Trough VaR</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] space-y-1">
                <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Allocation Drift</span>
                <div className={`text-base font-black font-mono ${driftStatus.isMisaligned ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {driftStatus.maxDrift.toFixed(1)}%
                </div>
                <div className="text-[10px] font-bold">
                  {driftStatus.isMisaligned ? (
                    <span className="text-amber-400">Rebalance Needed</span>
                  ) : (
                    <span className="text-emerald-400">Optimally Balanced</span>
                  )}
                </div>
              </div>
            </div>

            {/* Asset Allocation Graphs: Donut Chart + Target vs Actual Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Donut Chart */}
              <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] space-y-2">
                <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                  <PieIcon className="w-3.5 h-3.5 text-indigo-400" />
                  Actual Asset Breakdown
                </span>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={allocationPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={4}
                      >
                        {allocationPieData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--bg-card)',
                          borderColor: 'var(--border-color)',
                          borderRadius: '8px',
                          fontSize: '11px'
                        }}
                        formatter={(value: any) => [`${value}%`, 'Weight']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />
                    <span className="text-[var(--text-secondary)]">Equity: <strong className="font-mono text-[var(--text-primary)]">{selectedVault.actualAllocation.equity}%</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                    <span className="text-[var(--text-secondary)]">Debt: <strong className="font-mono text-[var(--text-primary)]">{selectedVault.actualAllocation.debt}%</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
                    <span className="text-[var(--text-secondary)]">Gold: <strong className="font-mono text-[var(--text-primary)]">{selectedVault.actualAllocation.gold}%</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-violet-500 inline-block" />
                    <span className="text-[var(--text-secondary)]">Cash: <strong className="font-mono text-[var(--text-primary)]">{selectedVault.actualAllocation.cash}%</strong></span>
                  </div>
                </div>
              </div>

              {/* Target vs Actual Comparison Bar */}
              <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] space-y-2">
                <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                  Target vs Actual Drift Check
                </span>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="asset" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--bg-card)',
                          borderColor: 'var(--border-color)',
                          borderRadius: '8px',
                          fontSize: '11px'
                        }}
                        formatter={(val: any) => [`${val}%`, '']}
                      />
                      <Bar dataKey="Target" fill="#64748b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Actual" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-4 text-[10px] text-[var(--text-secondary)]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-slate-500 inline-block" />
                    <span>Target Weight (%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" />
                    <span>Actual Weight (%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tagged Holdings Table */}
          <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-400" />
                Tagged Instruments & Depository Assets ({selectedVault.taggedHoldings.length})
              </h4>
              <span className="text-[11px] text-[var(--text-muted)] font-mono">
                Allocated Cash: {currency} {selectedVault.allocatedCash.toLocaleString()}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[10px] font-black text-[var(--text-secondary)] uppercase">
                    <th className="py-2.5 px-3">Instrument</th>
                    <th className="py-2.5 px-3">Asset Class</th>
                    <th className="py-2.5 px-3 text-right">Units</th>
                    <th className="py-2.5 px-3 text-right">Valuation</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] font-mono">
                  {selectedVault.taggedHoldings.map((h, idx) => (
                    <tr key={`${h.ticker}-${idx}`} className="hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-[var(--text-primary)]">{h.name}</div>
                        <div className="text-[10px] text-[var(--text-muted)] font-mono">{h.ticker}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          h.type === 'EQUITY' ? 'bg-blue-500/15 text-blue-400' :
                          h.type === 'BOND' ? 'bg-emerald-500/15 text-emerald-400' :
                          'bg-amber-500/15 text-amber-400'
                        }`}>
                          {h.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-[var(--text-primary)]">{h.qty.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-[var(--text-primary)]">
                        {currency} {h.value.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-sans font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Earmarked
                        </span>
                      </td>
                    </tr>
                  ))}
                  {selectedVault.taggedHoldings.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-[var(--text-muted)] font-sans">
                        No individual depository instruments tagged to this vault yet. Free vault cash is available for systematic allocation.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Internal Capital Transfer */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[var(--text-primary)]">
                    Internal Sub-Account Capital Transfer
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)]">Zero-friction transfer without depository tax trigger</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTransferType('DEPOSIT')}
                  className={`flex-1 py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                    transferType === 'DEPOSIT'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-color)]'
                  }`}
                >
                  Deposit to Vault
                </button>
                <button
                  type="button"
                  onClick={() => setTransferType('WITHDRAW')}
                  className={`flex-1 py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                    transferType === 'WITHDRAW'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-color)]'
                  }`}
                >
                  Withdraw to Free Cash
                </button>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[var(--text-secondary)]">Target Vault:</span>
                  <strong className="text-[var(--text-primary)]">{selectedVault.name}</strong>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[var(--text-secondary)]">Available Free Margin:</span>
                  <strong className="font-mono text-emerald-400">{currency} {aggregateStats.unpartitionedCash.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[var(--text-secondary)]">Current Vault Cash:</span>
                  <strong className="font-mono text-indigo-400">{currency} {selectedVault.allocatedCash.toLocaleString()}</strong>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase">Transfer Amount ({currency})</label>
                <input
                  type="number"
                  min="1000"
                  step="5000"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(Number(e.target.value))}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-sm font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-2">
                {[10000, 50000, 100000, 250000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTransferAmount(amt)}
                    className="flex-1 py-1 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    +{formatCompactCurrency(amt)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteTransfer}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md cursor-pointer"
              >
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Create Goal Vault */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[var(--text-primary)]">
                    Create New Sub-Account Goal Vault
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)]">Custom target amount, horizon, and target asset weights</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase">Vault Name / Purpose</label>
                <input
                  type="text"
                  placeholder="e.g., Dream Villa 2038 / Startup Capital"
                  value={newVaultName}
                  onChange={(e) => setNewVaultName(e.target.value)}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase">Goal Category</label>
                <select
                  value={newVaultCategory}
                  onChange={(e) => setNewVaultCategory(e.target.value as GoalVault['category'])}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
                >
                  <option value="RETIREMENT">Retirement (Long-Term Capital Preservation)</option>
                  <option value="ALPHA">Alpha Trading (High-Beta Momentum)</option>
                  <option value="EDUCATION">Education / Children's Fund</option>
                  <option value="WEALTH_CREATION">General Wealth Creation</option>
                  <option value="CUSTOM">Custom Objective</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase">Target Goal Amount ({currency})</label>
                  <input
                    type="number"
                    value={newVaultTarget}
                    onChange={(e) => setNewVaultTarget(Number(e.target.value))}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase">Target Horizon Year</label>
                  <input
                    type="number"
                    value={newVaultYear}
                    onChange={(e) => setNewVaultYear(Number(e.target.value))}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1 border-t border-[var(--border-subtle)]">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-[var(--text-secondary)] uppercase">Target Asset Allocation</span>
                  <span className="font-mono text-indigo-400">Total: {newVaultEquity + newVaultDebt + newVaultGold}% (Cash: {Math.max(0, 100 - (newVaultEquity + newVaultDebt + newVaultGold))}%)</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-blue-400 font-bold">Equities %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newVaultEquity}
                      onChange={(e) => setNewVaultEquity(Number(e.target.value))}
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-[var(--text-primary)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-emerald-400 font-bold">Bonds/Debt %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newVaultDebt}
                      onChange={(e) => setNewVaultDebt(Number(e.target.value))}
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-[var(--text-primary)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-amber-400 font-bold">Gold/SGB %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newVaultGold}
                      onChange={(e) => setNewVaultGold(Number(e.target.value))}
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-[var(--text-primary)]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateVault}
                disabled={!newVaultName.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-all shadow-md cursor-pointer"
              >
                Create Vault
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubAccountVaults;
