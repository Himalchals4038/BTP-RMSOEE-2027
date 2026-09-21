import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Play,
  Pause,
  TrendingUp,
  ArrowRight,
  Layers,
  Flame
} from 'lucide-react';
import {
  type AlgoStrategy,
  type AlgoRule,
  type AlgoIndicator,
  type AlgoOperator,
  INSTITUTIONAL_ALGO_TEMPLATES
} from '../../services/algoExecutionService';

interface VisualRuleBuilderProps {
  strategy: AlgoStrategy;
  onUpdateStrategy: (updated: AlgoStrategy) => void;
  onRunBacktest: () => void;
}

const INDICATOR_OPTIONS: AlgoIndicator[] = [
  'Supertrend (10,3)',
  'RSI (14)',
  'EMA Cross (9/21)',
  'EMA Cross (20/50)',
  'VWAP',
  'Bollinger Bands (20,2)',
  'MACD (12,26,9)',
  'Volume Breakout (>2.5x)'
];

const OPERATOR_OPTIONS: AlgoOperator[] = [
  'Crosses Above',
  'Crosses Below',
  '>',
  '<',
  '>=',
  '<=',
  'Upper Band Break',
  'Lower Band Bounce'
];

export const VisualRuleBuilder: React.FC<VisualRuleBuilderProps> = ({
  strategy,
  onUpdateStrategy,
  onRunBacktest
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(strategy.id);

  const handleAddRule = () => {
    const newRule: AlgoRule = {
      id: `rule_${Date.now()}`,
      indicator: 'RSI (14)',
      operator: '>',
      thresholdValue: 50,
      logicalGate: 'AND'
    };
    onUpdateStrategy({
      ...strategy,
      rules: [...strategy.rules, newRule]
    });
  };

  const handleRemoveRule = (ruleId: string) => {
    onUpdateStrategy({
      ...strategy,
      rules: strategy.rules.filter(r => r.id !== ruleId)
    });
  };

  const handleUpdateRule = (ruleId: string, updates: Partial<AlgoRule>) => {
    onUpdateStrategy({
      ...strategy,
      rules: strategy.rules.map(r => (r.id === ruleId ? { ...r, ...updates } : r))
    });
  };

  const handleApplyTemplate = (tpl: AlgoStrategy) => {
    setSelectedTemplateId(tpl.id);
    onUpdateStrategy({ ...tpl, id: `strat_${Date.now()}` });
  };

  return (
    <div className="space-y-6 w-full">
      {/* Preset Strategy Catalog Bar */}
      <div className="space-y-2">
        <label className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-amber-500" />
          Institutional PineScript Rule Templates
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {INSTITUTIONAL_ALGO_TEMPLATES.map(tpl => {
            const isSelected = selectedTemplateId === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleApplyTemplate(tpl)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-br from-[var(--icici-orange)]/15 to-amber-500/10 border-[var(--icici-orange)] ring-2 ring-[var(--icici-orange)]/30 shadow-sm'
                    : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] hover:border-[var(--text-muted)]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[var(--text-primary)] block line-clamp-1">{tpl.name}</span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      {tpl.stats?.winRatePct}% Win
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--text-secondary)] line-clamp-2 mt-1 block">
                    {tpl.description}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)] mt-2 pt-2 border-t border-[var(--border-subtle)]">
                  <span>{tpl.ticker}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Sharpe: {tpl.stats?.sharpe}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Rule Block Composer */}
      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
          <div>
            <h4 className="font-extrabold text-sm text-[var(--text-primary)] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[var(--icici-orange)]" />
              Visual Quantitative Logic Blocks (Scratch / PineScript Composer)
            </h4>
            <span className="text-[11px] text-[var(--text-secondary)]">
              Chain indicators, cross conditions, and logical gates without writing raw code
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddRule}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs font-extrabold text-[var(--text-primary)] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-500" />
              Add Condition Block
            </button>

            <button
              type="button"
              onClick={() => onUpdateStrategy({ ...strategy, isActive: !strategy.isActive })}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black shadow-sm cursor-pointer transition-all ${
                strategy.isActive
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)]'
              }`}
            >
              {strategy.isActive ? (
                <>
                  <Pause className="w-3.5 h-3.5 animate-spin" /> Live 5 Hz Engine Active
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-500" /> Deploy Live Sandbox
                </>
              )}
            </button>
          </div>
        </div>

        {/* Condition Blocks Chain */}
        <div className="space-y-3">
          {strategy.rules.map((rule, idx) => (
            <div key={rule.id} className="space-y-2">
              {idx > 0 && (
                <div className="flex items-center justify-center">
                  <div className="px-3 py-0.5 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[10px] font-black uppercase text-[var(--icici-orange)]">
                    {rule.logicalGate} GATE
                  </div>
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3 shadow-2xs hover:border-[var(--icici-orange)]/50 transition-all">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-extrabold bg-[var(--icici-orange)] text-white">
                    RULE #{idx + 1}
                  </span>
                  <span className="text-xs font-bold text-[var(--text-muted)]">WHEN</span>
                </div>

                {/* Indicator Dropdown */}
                <select
                  value={rule.indicator}
                  onChange={(e) => handleUpdateRule(rule.id, { indicator: e.target.value as AlgoIndicator })}
                  className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-2.5 py-1.5 text-xs font-black text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)]"
                >
                  {INDICATOR_OPTIONS.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>

                {/* Operator Dropdown */}
                <select
                  value={rule.operator}
                  onChange={(e) => handleUpdateRule(rule.id, { operator: e.target.value as AlgoOperator })}
                  className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)]"
                >
                  {OPERATOR_OPTIONS.map(op => (
                    <option key={op} value={op}>{op}</option>
                  ))}
                </select>

                {/* Threshold Input */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-[var(--text-muted)]">VALUE:</span>
                  <input
                    type="number"
                    step="0.1"
                    value={rule.thresholdValue}
                    onChange={(e) => handleUpdateRule(rule.id, { thresholdValue: Number(e.target.value) })}
                    className="w-20 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)]"
                  />
                </div>

                {/* Gate Toggle (AND / OR) */}
                {idx > 0 && (
                  <select
                    value={rule.logicalGate}
                    onChange={(e) => handleUpdateRule(rule.id, { logicalGate: e.target.value as 'AND' | 'OR' })}
                    className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-2 py-1 text-[11px] font-black text-[var(--icici-orange)]"
                  >
                    <option value="AND">AND</option>
                    <option value="OR">OR</option>
                  </select>
                )}

                {/* Remove Rule Button */}
                {strategy.rules.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveRule(rule.id)}
                    className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action Trigger Block (THEN) */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md font-mono text-[10px] font-extrabold bg-emerald-600 text-white">
              THEN EXECUTE
            </span>
            <ArrowRight className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-extrabold text-[var(--text-primary)]">
              Auto-Submit {strategy.action} {strategy.quantity} shares of {strategy.ticker} ({strategy.orderType})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onRunBacktest}
              className="px-4 py-2 rounded-xl bg-[var(--icici-orange)] hover:bg-[var(--icici-orange-hover)] text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Audit 5-Year Backtest
            </button>
          </div>
        </div>

        {/* Strategy Execution Risk Parameters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
            <span className="text-[10px] font-bold text-[var(--text-muted)] block">TARGET SECURITY</span>
            <input
              type="text"
              value={strategy.ticker}
              onChange={(e) => onUpdateStrategy({ ...strategy, ticker: e.target.value })}
              className="w-full bg-transparent font-mono font-black text-xs text-[var(--text-primary)] mt-1 focus:outline-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
            <span className="text-[10px] font-bold text-[var(--text-muted)] block">QUANTITY</span>
            <input
              type="number"
              min="1"
              value={strategy.quantity}
              onChange={(e) => onUpdateStrategy({ ...strategy, quantity: Number(e.target.value) })}
              className="w-full bg-transparent font-mono font-black text-xs text-[var(--text-primary)] mt-1 focus:outline-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
            <span className="text-[10px] font-bold text-[var(--text-muted)] block">STOP-LOSS (% RISK)</span>
            <input
              type="number"
              step="0.1"
              value={strategy.stopLossPct}
              onChange={(e) => onUpdateStrategy({ ...strategy, stopLossPct: Number(e.target.value) })}
              className="w-full bg-transparent font-mono font-black text-xs text-rose-500 mt-1 focus:outline-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
            <span className="text-[10px] font-bold text-[var(--text-muted)] block">TARGET PROFIT (% REWARD)</span>
            <input
              type="number"
              step="0.1"
              value={strategy.targetProfitPct}
              onChange={(e) => onUpdateStrategy({ ...strategy, targetProfitPct: Number(e.target.value) })}
              className="w-full bg-transparent font-mono font-black text-xs text-emerald-500 mt-1 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
