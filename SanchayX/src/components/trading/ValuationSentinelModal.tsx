import React, { useState } from 'react';
import { useTradingSimulation } from '../../context/TradingSimulationContext';
import { formatCompactCurrency } from '../../utils/financialMath';
import {
  ShieldCheck,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Scale,
  CheckCircle2,
  X,
  Sparkles,
  Landmark,
  FileCheck,
  AlertCircle
} from 'lucide-react';

export interface SentinelLeg {
  ticker: string;
  name: string;
  action: 'BUY' | 'SELL';
  qty: number;
  price: number;
  reason: string;
  metric?: string;
}

export interface RebalanceMandate {
  id: string;
  title: string;
  timestamp: string;
  totalRotationAmount: number;
  projectedTaxImpact: string;
  rationale: string;
  sourceLegs: SentinelLeg[]; // Overvalued assets being trimmed/sold
  targetLegs: SentinelLeg[]; // Undervalued quality assets being bought
}

interface ValuationSentinelModalProps {
  isOpen: boolean;
  onClose: () => void;
  mandate: RebalanceMandate | null;
  onExecuted?: () => void;
}

export const ValuationSentinelModal: React.FC<ValuationSentinelModalProps> = ({
  isOpen,
  onClose,
  mandate,
  onExecuted
}) => {
  const { executeRebalanceBasket } = useTradingSimulation();
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionSuccess, setExecutionSuccess] = useState(false);
  const [executionMessage, setExecutionMessage] = useState('');

  if (!isOpen || !mandate) return null;

  const handleConfirmAndExecute = async () => {
    setIsExecuting(true);
    try {
      const allOrders = [
        ...mandate.sourceLegs.map(leg => ({
          ticker: leg.ticker,
          name: leg.name,
          action: 'SELL' as const,
          qty: leg.qty,
          price: leg.price
        })),
        ...mandate.targetLegs.map(leg => ({
          ticker: leg.ticker,
          name: leg.name,
          action: 'BUY' as const,
          qty: leg.qty,
          price: leg.price
        }))
      ];

      const res = executeRebalanceBasket(allOrders);
      setExecutionSuccess(true);
      setExecutionMessage(res.message);

      setTimeout(() => {
        setIsExecuting(false);
        if (onExecuted) onExecuted();
      }, 1500);
    } catch {
      setIsExecuting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-[var(--bg-card)] border border-amber-500/40 shadow-2xl space-y-5 p-6 md:p-8">
        {/* Glow Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500">
              <ShieldCheck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-black tracking-wider uppercase text-amber-600 dark:text-amber-400">
                <Sparkles className="w-3 h-3" /> Permission-Gated Sentinel Engine
              </div>
              <h2 className="text-xl font-black text-[var(--text-primary)] mt-0.5">
                {mandate.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {executionSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 mx-auto flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="w-8 h-8 animate-bounce" />
            </div>
            <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              Mandate Executed Successfully!
            </h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-lg mx-auto leading-relaxed">
              {executionMessage}
            </p>
            <div className="text-[11px] font-mono text-[var(--text-muted)]">
              All trades settled instantly in your Demat account with statutory tax offsets recorded.
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
            >
              Back to Portfolio
            </button>
          </div>
        ) : (
          <>
            {/* Core Rationale & Summary Banner */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> 20-Year Historical Valuation Trigger
                </span>
                <span className="text-xs font-mono font-black text-[var(--icici-orange)]">
                  Total Rotation: {formatCompactCurrency(mandate.totalRotationAmount, 'INR')}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {mandate.rationale}
              </p>
            </div>

            {/* Rotation Legs: Source (Exit) -> Target (Accumulate) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Overvalued Trim Sleeve */}
              <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-rose-500/20 space-y-3">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                  <span className="text-xs font-bold text-rose-500 flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4" /> 1. Trim Overvalued Peak (SELL)
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-rose-500/10 text-rose-600 px-2 py-0.5 rounded font-bold">
                    P/E &gt; 2σ Peak
                  </span>
                </div>

                <div className="space-y-2">
                  {mandate.sourceLegs.map((leg, i) => (
                    <div key={i} className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-[var(--text-primary)]">{leg.name}</span>
                        <span className="font-mono font-bold text-rose-500">
                          SELL {leg.qty} @ ₹{leg.price.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)]">
                        <span>{leg.ticker}</span>
                        <span className="font-mono text-rose-600 font-semibold">{leg.metric}</span>
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)] italic">
                        {leg.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Undervalued Quality Accumulation Sleeve */}
              <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-emerald-500/20 space-y-3">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                  <span className="text-xs font-bold text-emerald-500 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" /> 2. Accumulate Quality Value (BUY)
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded font-bold">
                    ROCE &gt; 18%, D/E &lt; 0.5
                  </span>
                </div>

                <div className="space-y-2">
                  {mandate.targetLegs.map((leg, i) => (
                    <div key={i} className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-[var(--text-primary)]">{leg.name}</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          BUY {leg.qty} @ ₹{leg.price.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)]">
                        <span>{leg.ticker}</span>
                        <span className="font-mono text-emerald-600 font-semibold">{leg.metric}</span>
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)] italic">
                        {leg.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Projected Tax Impact & Legal Safeguards */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
              <Scale className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-300 block">
                  Projected Tax Impact: {mandate.projectedTaxImpact}
                </span>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  Leverages Section 112A annual exemption limit (₹1,25,000 LTCG zero-tax) combined with Section 70 short-term/long-term capital loss offsets, ensuring capital rotations do not cause unwanted tax leakage.
                </p>
              </div>
            </div>

            {/* Regulatory Safeguard Notice */}
            <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] bg-[var(--bg-tertiary)] p-2.5 rounded-xl border border-[var(--border-color)]">
              <Landmark className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                <strong>SEBI Mandate Compliance:</strong> SanchayX never initiates trades autonomously without explicit 1-click user authorization. Manual Demat trading console remains 100% accessible anytime.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                disabled={isExecuting}
                className="px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
              >
                Decline / Cancel
              </button>

              <button
                onClick={handleConfirmAndExecute}
                disabled={isExecuting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs shadow-xl transition-all cursor-pointer border border-emerald-400/40 active:scale-95 disabled:opacity-50"
              >
                {isExecuting ? (
                  <span>Executing Multi-Leg Basket...</span>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4 text-emerald-200" />
                    <span>CONFIRM &amp; EXECUTE MANDATE</span>
                    <ArrowRight className="w-4 h-4 text-emerald-200" />
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
