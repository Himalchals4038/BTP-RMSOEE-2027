import React, { useState, useEffect, useRef } from 'react';
import {
  Cpu,
  TrendingUp,
  FileText,
  Download,
  Terminal,
  Zap
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import { VisualRuleBuilder } from '../components/algo/VisualRuleBuilder';
import {
  type AlgoStrategy,
  type AlgoAuditSignal,
  type AlgoBacktestReport,
  INSTITUTIONAL_ALGO_TEMPLATES,
  evaluateLiveTickForStrategy,
  runAlgoWalkForwardBacktest
} from '../services/algoExecutionService';
import { useTradingSimulation, subscribeToTicker } from '../context/TradingSimulationContext';
import { usePortfolio } from '../context/PortfolioContext';
import { soundService } from '../services/soundService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const AlgoStudioPage: React.FC = () => {
  const { placeOrder } = useTradingSimulation();
  const { theme } = usePortfolio();

  // Active Strategy Configuration
  const [strategy, setStrategy] = useState<AlgoStrategy>(() => INSTITUTIONAL_ALGO_TEMPLATES[0]);

  // Microsecond Execution Audit Signals Log
  const [auditSignals, setAuditSignals] = useState<AlgoAuditSignal[]>([]);
  const lastPriceRef = useRef<number>(23346.40);

  // 5-Year Walk-Forward Backtest Report
  const [backtestReport, setBacktestReport] = useState<AlgoBacktestReport>(() =>
    runAlgoWalkForwardBacktest(INSTITUTIONAL_ALGO_TEMPLATES[0])
  );
  const [isBacktesting, setIsBacktesting] = useState<boolean>(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const reportContainerRef = useRef<HTMLDivElement>(null);

  // Live 5 Hz Ingestion Pipeline: Evaluate Strategy on every tick
  useEffect(() => {
    if (!strategy.isActive) return;

    const unsub = subscribeToTicker(strategy.ticker, (tick) => {
      const evaluation = evaluateLiveTickForStrategy(strategy, tick.ltp, lastPriceRef.current);
      lastPriceRef.current = tick.ltp;

      if (evaluation.triggered && evaluation.signal) {
        const sig = evaluation.signal;
        setAuditSignals(prev => [sig, ...prev.slice(0, 39)]);

        // Auto-submit order into simulated DMA engine
        const res = placeOrder({
          ticker: strategy.ticker,
          action: strategy.action,
          product: strategy.product,
          orderType: strategy.orderType,
          qty: strategy.quantity,
          price: tick.ltp,
          targetPrice: tick.ltp * (1 + strategy.targetProfitPct / 100),
          stopLossPrice: tick.ltp * (1 - strategy.stopLossPct / 100)
        });

        if (res.success) {
          soundService.playExecutionChime();
        }
      }
    });

    return unsub;
  }, [strategy, placeOrder]);

  const handleRunBacktest = () => {
    setIsBacktesting(true);
    setTimeout(() => {
      const report = runAlgoWalkForwardBacktest(strategy);
      setBacktestReport(report);
      setIsBacktesting(false);
      soundService.playExecutionChime();
    }, 400);
  };

  // Export PDF Audit Report
  const handleExportPdfReport = async () => {
    if (!reportContainerRef.current) return;
    try {
      setExportMessage('Generating Institutional PDF Audit Report...');
      const canvas = await html2canvas(reportContainerRef.current, {
        scale: 1.5,
        backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`SanchayX_Algo_Audit_${strategy.name.replace(/\s+/g, '_')}.pdf`);
      setExportMessage('PDF Report exported successfully!');
      setTimeout(() => setExportMessage(null), 4000);
    } catch (err) {
      console.error('PDF export error:', err);
      setExportMessage('Failed to export PDF report.');
      setTimeout(() => setExportMessage(null), 4000);
    }
  };

  const axisColor = theme === 'dark' ? '#64748b' : '#94a3b8';

  return (
    <div className="space-y-6 w-full max-w-[1750px] mx-auto" ref={reportContainerRef}>
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2 text-[var(--text-primary)]">
            <Cpu className="w-6 h-6 text-[var(--icici-orange)]" />
            Visual Rule-Based Algorithmic Trading Studio & Sandbox
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <Zap className="w-3 h-3" /> 5 Hz Microsecond Execution
            </span>
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            No-code quantitative block composer, walk-forward 5-year historical backtester, and automated paper-trading sandbox.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportPdfReport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] cursor-pointer shadow-xs transition-all"
          >
            <Download className="w-4 h-4 text-[var(--icici-orange)]" />
            Export PDF Audit
          </button>
        </div>
      </div>

      {exportMessage && (
        <div className="p-3 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-bold">
          {exportMessage}
        </div>
      )}

      {/* Visual Rule Builder Component */}
      <VisualRuleBuilder
        strategy={strategy}
        onUpdateStrategy={setStrategy}
        onRunBacktest={handleRunBacktest}
      />

      {/* Grid: 5-Year Equity Curve & Live Microsecond Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Walk-Forward Equity Curve (2 columns) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
            <div>
              <h4 className="font-extrabold text-sm text-[var(--text-primary)] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                5-Year Walk-Forward Backtest Equity Curve vs NIFTY 50
              </h4>
              <span className="text-[11px] text-[var(--text-secondary)]">
                Walk-forward out-of-sample simulation computing Sharpe, Sortino, and Maximum Drawdown
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isBacktesting && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30 animate-pulse">
                  Evaluating 5Y Walk-Forward...
                </span>
              )}
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Capital Growth:</span>
              <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                +{backtestReport.totalReturnPct}%
              </span>
            </div>
          </div>

          {/* Key Quantitative Backtest Ratios */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">SHARPE RATIO</span>
              <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {backtestReport.sharpeRatio}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">SORTINO RATIO</span>
              <span className="font-mono font-black text-sm text-purple-600 dark:text-purple-400 mt-0.5 block">
                {backtestReport.sortinoRatio}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">WIN RATE</span>
              <span className="font-mono font-black text-sm text-blue-600 dark:text-blue-400 mt-0.5 block">
                {backtestReport.winRatePct}%
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">PROFIT FACTOR</span>
              <span className="font-mono font-black text-sm text-[var(--text-primary)] mt-0.5 block">
                {backtestReport.profitFactor}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">MAX DRAWDOWN</span>
              <span className="font-mono font-black text-sm text-rose-600 dark:text-rose-400 mt-0.5 block">
                -{backtestReport.maxDrawdownPct}%
              </span>
            </div>
          </div>

          {/* Equity Chart Canvas */}
          <div className="h-[320px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={backtestReport.equityCurve}>
                <XAxis dataKey="date" stroke={axisColor} fontSize={10} tickFormatter={(d) => d.slice(2, 7)} />
                <YAxis stroke={axisColor} fontSize={10} tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, '']}
                  labelFormatter={(l) => `Date: ${l}`}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line
                  type="monotone"
                  dataKey="equity"
                  name="Algo Strategy Equity"
                  stroke="#10b981"
                  strokeWidth={2.2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="benchmark"
                  name="NIFTY 50 Baseline"
                  stroke="#64748b"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Microsecond Audit Signal Log (1 column) */}
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <h4 className="font-extrabold text-sm text-[var(--text-primary)] flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[var(--icici-orange)]" />
                Live Microsecond Signal Log
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                5 Hz Active
              </span>
            </div>

            <div className="space-y-2 mt-3 max-h-[380px] overflow-y-auto pr-1">
              {auditSignals.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--text-muted)] font-bold bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-subtle)]">
                  Waiting for 5 Hz live tick triggers... Ensure strategy is deployed.
                </div>
              ) : (
                auditSignals.map((sig) => (
                  <div
                    key={sig.id}
                    className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs space-y-1 hover:border-[var(--icici-orange)] transition-colors"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-[var(--text-muted)]">{sig.microsecondStr}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                        +{sig.latencyMicros}μs
                      </span>
                    </div>
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-[var(--text-primary)]">{sig.ticker}</span>
                      <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black">
                        {sig.action} @ ₹{sig.price}
                      </span>
                    </div>
                    <div className="text-[10px] text-[var(--text-secondary)] truncate">
                      {sig.triggerCondition}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--border-color)] text-[11px] font-mono text-[var(--text-muted)] flex items-center justify-between">
            <span>Audit Trail Latency:</span>
            <span className="text-emerald-500 font-bold">&lt; 0.45 ms</span>
          </div>
        </div>
      </div>

      {/* Historical Walk-Forward Trade Journal Table */}
      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <h4 className="font-extrabold text-sm text-[var(--text-primary)] flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" />
            Walk-Forward Historical Trade Journal ({backtestReport.totalTrades} Executions)
          </h4>
          <span className="text-xs font-mono text-[var(--text-muted)]">
            Displaying latest 30 trades with microsecond entry/exit timestamps
          </span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="fin-table">
            <thead>
              <tr>
                <th>Trade ID</th>
                <th>Entry Date</th>
                <th>Exit Date</th>
                <th>Action</th>
                <th>Entry Price</th>
                <th>Exit Price</th>
                <th>Net P&L</th>
                <th>Return %</th>
                <th>Exit Trigger</th>
              </tr>
            </thead>
            <tbody>
              {backtestReport.trades.map((trd) => (
                <tr key={trd.id}>
                  <td className="font-mono text-xs text-[var(--text-muted)]">{trd.id}</td>
                  <td className="font-mono text-xs">{trd.entryDate}</td>
                  <td className="font-mono text-xs">{trd.exitDate}</td>
                  <td>
                    <span className="px-2 py-0.5 rounded font-black text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      {trd.action}
                    </span>
                  </td>
                  <td className="font-mono">₹{trd.entryPrice.toFixed(2)}</td>
                  <td className="font-mono">₹{trd.exitPrice.toFixed(2)}</td>
                  <td className={`font-mono font-bold ${trd.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {trd.pnl >= 0 ? '+' : ''}₹{trd.pnl.toLocaleString()}
                  </td>
                  <td className={`font-mono font-bold ${trd.pnlPct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {trd.pnlPct >= 0 ? '+' : ''}{trd.pnlPct}%
                  </td>
                  <td className="text-xs text-[var(--text-secondary)]">{trd.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
