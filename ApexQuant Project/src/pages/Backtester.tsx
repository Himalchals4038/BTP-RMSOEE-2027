import React, { useState, useMemo } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import type { BacktestConfig } from '../types/portfolio';
import { formatCompactCurrency } from '../utils/financialMath';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import {
  LineChart as LineIcon,
  Play,
  TrendingUp,
  RotateCcw,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ListFilter
} from 'lucide-react';

export const BacktesterPage: React.FC = () => {
  const { benchmark, currency, runBacktest, backtestResult, isLoading } = usePortfolio();
  const [showAllTrades, setShowAllTrades] = useState<boolean>(false);

  const [config, setConfig] = useState<BacktestConfig>({
    startDate: '2020-01-01',
    endDate: '2026-08-01',
    initialCapital: 10000,
    monthlyContribution: 500,
    rebalanceStrategy: 'quarterly',
    benchmark
  });

  const handleRunSimulation = () => {
    runBacktest({ ...config, benchmark });
  };

  // Optimize trade table display
  const displayedTrades = useMemo(() => {
    if (!backtestResult || !backtestResult.trades) return [];
    return showAllTrades ? backtestResult.trades : backtestResult.trades.slice(0, 15);
  }, [backtestResult, showAllTrades]);

  return (
    <div className="p-6 space-y-6 w-full">
      {/* Top Banner & Strategy Parameters Configurator */}
      <div className="glass-card p-5 space-y-5 w-full">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <LineIcon className="w-5 h-5 text-emerald-400" />
              Historical Strategy Backtester & Weight Drift Simulator
            </h2>
            <p className="text-xs text-slate-400">
              Stress-test asset allocation through 2020 COVID Crash & 2022 Tech Downturn windows
            </p>
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            {isLoading ? 'Simulating Strategy...' : 'Run Backtest Engine'}
          </button>
        </div>

        {/* Inputs Form Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 pt-2 border-t border-slate-800 w-full">
          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Start Date</label>
            <input
              type="date"
              value={config.startDate}
              onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">End Date</label>
            <input
              type="date"
              value={config.endDate}
              onChange={(e) => setConfig({ ...config, endDate: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Initial Capital */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Initial Capital ({currency})</label>
            <input
              type="number"
              value={config.initialCapital}
              onChange={(e) => setConfig({ ...config, initialCapital: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Monthly DCA Contribution */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Monthly DCA ({currency})</label>
            <input
              type="number"
              value={config.monthlyContribution}
              onChange={(e) => setConfig({ ...config, monthlyContribution: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Rebalancing Strategy Options */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Rebalance Trigger</label>
            <select
              value={config.rebalanceStrategy}
              onChange={(e) => setConfig({ ...config, rebalanceStrategy: e.target.value as any })}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="none">1. Buy & Hold (No Rebalance)</option>
              <option value="monthly">2. Calendar Monthly</option>
              <option value="quarterly">3. Calendar Quarterly</option>
              <option value="annual">4. Calendar Annual</option>
              <option value="drift5">5. Target Weight Drift (&gt; 5%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Backtest Key Performance Summary Cards */}
      {backtestResult && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
          <div className="glass-card p-4 border-l-4 border-l-emerald-500">
            <div className="text-[11px] text-slate-400 font-semibold">FINAL PORTFOLIO VALUE</div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {formatCompactCurrency(backtestResult.finalValue, currency)}
            </div>
            <div className="text-[11px] text-emerald-400 font-semibold mt-1">
              CAGR: +{backtestResult.cagr}% / yr
            </div>
          </div>

          <div className="glass-card p-4 border-l-4 border-l-blue-500">
            <div className="text-[11px] text-slate-400 font-semibold">BENCHMARK ({benchmark}) FINAL</div>
            <div className="text-xl font-bold font-mono text-slate-300 mt-1">
              {formatCompactCurrency(backtestResult.finalBenchmarkValue || backtestResult.finalValue, currency)}
            </div>
            <div className="text-[11px] text-slate-400 font-semibold mt-1">
              Benchmark CAGR: +{backtestResult.benchmarkCagr}% / yr
            </div>
          </div>

          <div className="glass-card p-4 border-l-4 border-l-rose-500">
            <div className="text-[11px] text-slate-400 font-semibold">MAX DRAWDOWN %</div>
            <div className="text-xl font-bold font-mono text-rose-400 mt-1">
              -{backtestResult.maxDrawdown}%
            </div>
            <div className="text-[11px] text-slate-400 font-semibold mt-1">
              Bench MDD: -{backtestResult.benchmarkMaxDrawdown}%
            </div>
          </div>

          <div className="glass-card p-4 border-l-4 border-l-purple-500">
            <div className="text-[11px] text-slate-400 font-semibold">REBALANCING STATS</div>
            <div className="text-xl font-bold font-mono text-purple-400 mt-1">
              {backtestResult.totalRebalances} Trades
            </div>
            <div className="text-[11px] text-slate-400 font-semibold mt-1">
              Est. Turnover Cost: {formatCompactCurrency(backtestResult.totalTurnoverCost, currency)}
            </div>
          </div>
        </div>
      )}

      {/* Main Charts: Equity Curve & Drawdown Chart */}
      {backtestResult && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          {/* Equity Growth Curve */}
          <div className="glass-card p-5 space-y-3 w-full">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Portfolio Growth Equity Curve vs {benchmark} ({currency})
            </h3>

            <div className="h-[340px] min-h-[320px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={backtestResult.equityCurve}>
                  <defs>
                    <linearGradient id="colorPortEq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '11px' }}
                    formatter={(val: any) => [formatCompactCurrency(val, currency), '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Area type="monotone" dataKey="portfolioValue" name="Portfolio Value" stroke="#10b981" strokeWidth={2} fill="url(#colorPortEq)" isAnimationActive={false} />
                  <Area type="monotone" dataKey="benchmarkValue" name={`${benchmark} Benchmark`} stroke="#64748b" strokeWidth={1.5} strokeDasharray="3 3" fillOpacity={0} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Historical Drawdown % Chart */}
          <div className="glass-card p-5 space-y-3 w-full">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Peak-to-Trough Drawdown % Over Time
            </h3>

            <div className="h-[340px] min-h-[320px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={backtestResult.equityCurve}>
                  <defs>
                    <linearGradient id="colorDrawdown" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} domain={[-50, 0]} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '11px' }}
                    formatter={(val: any) => [`${val}%`, 'Drawdown']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Area type="monotone" dataKey="drawdown" name="Portfolio Drawdown" stroke="#ef4444" strokeWidth={1.5} fill="url(#colorDrawdown)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Rebalance Trade Execution Log Table */}
      {backtestResult && (
        <div className="glass-card p-5 space-y-4 w-full">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-purple-400" />
              Historic Rebalance Execution Log & Turnover Costs
            </h3>
            <div className="flex items-center gap-3 font-mono text-xs text-slate-400">
              <span>Total Orders: {backtestResult.trades.length}</span>
              {backtestResult.trades.length > 15 && (
                <button
                  onClick={() => setShowAllTrades(!showAllTrades)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <ListFilter className="w-3 h-3 text-blue-400" />
                  {showAllTrades ? 'Show Recent 15' : 'Show All Trades'}
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto max-h-80 overflow-y-auto w-full">
            <table className="fin-table">
              <thead>
                <tr>
                  <th>Execution Date</th>
                  <th>Asset</th>
                  <th>Action</th>
                  <th>Order Amount ({currency})</th>
                  <th>Target Wt (%)</th>
                  <th>Drift Wt (%)</th>
                  <th>Est. Cost ({currency})</th>
                </tr>
              </thead>
              <tbody>
                {displayedTrades.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-slate-500">
                      No rebalancing events triggered under selected strategy.
                    </td>
                  </tr>
                ) : (
                  displayedTrades.map(t => (
                    <tr key={t.id}>
                      <td className="font-mono text-xs text-slate-400">{t.date}</td>
                      <td>
                        <span className="font-bold font-mono text-white mr-1.5">{t.assetTicker}</span>
                        <span className="text-[11px] text-slate-400">{t.assetName}</span>
                      </td>
                      <td>
                        <span className={`inline-flex items-center gap-1 font-bold text-xs ${t.action === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {t.action === 'BUY' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          {t.action}
                        </span>
                      </td>
                      <td className="font-mono font-bold text-slate-100">{formatCompactCurrency(t.amount, currency)}</td>
                      <td className="font-mono text-slate-300">{t.targetWeight}%</td>
                      <td className="font-mono text-amber-400">{t.driftWeight}%</td>
                      <td className="font-mono text-slate-400">{formatCompactCurrency(t.estimatedCost, currency)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
