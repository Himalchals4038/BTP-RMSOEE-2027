import React, { useState, useMemo } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { getHistoricalPrices } from '../services/api';
import type { HistoricalDataPoint } from '../services/mockData';
import { formatCompactCurrency } from '../utils/financialMath';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import {
  ShieldAlert,
  TrendingUp,
  Activity,
  Award,
  DollarSign,
  PieChart as PieIcon,
  HelpCircle
} from 'lucide-react';

export const ExecutiveDashboard: React.FC = () => {
  const { kri, assets, benchmark, currency } = usePortfolio();
  const [timeframe, setTimeframe] = useState<'1M' | '6M' | '1Y' | '5Y' | 'Max'>('1Y');

  const history = useMemo(() => getHistoricalPrices(), []);
  const activeAssets = useMemo(() => assets.filter(a => a.weight > 0), [assets]);

  // Compute performance growth timeline points for portfolio vs benchmark
  const chartData = useMemo(() => {
    if (history.length === 0 || activeAssets.length === 0) return [];

    let sliceCount = 252; // Default 1Y
    if (timeframe === '1M') sliceCount = 21;
    if (timeframe === '6M') sliceCount = 126;
    if (timeframe === '5Y') sliceCount = 252 * 5;
    if (timeframe === 'Max') sliceCount = history.length;

    const dataSlice = history.slice(-Math.min(sliceCount, history.length));

    const totalWeight = activeAssets.reduce((sum, a) => sum + a.weight, 0) || 1;
    const firstRow = dataSlice[0];

    const initialPrices: Record<string, number> = {};
    activeAssets.forEach(a => {
      initialPrices[a.ticker] = (firstRow[a.ticker] as number) || 100;
    });
    const benchInitial = (firstRow[benchmark] as number) || 100;

    return dataSlice.map((row: HistoricalDataPoint) => {
      let pGrowth = 0;
      activeAssets.forEach(a => {
        const currP = (row[a.ticker] as number) || initialPrices[a.ticker];
        pGrowth += (a.weight / totalWeight) * (currP / initialPrices[a.ticker]);
      });

      const bCurrP = (row[benchmark] as number) || benchInitial;
      const bGrowth = bCurrP / benchInitial;

      return {
        date: row.date.substring(2),
        Portfolio: Number((pGrowth * 100).toFixed(2)),
        Benchmark: Number((bGrowth * 100).toFixed(2))
      };
    });
  }, [history, activeAssets, timeframe, benchmark]);

  // Individual Asset pie chart dataset (showing actual asset names on hover)
  const individualAssetData = useMemo(() => {
    const totalW = activeAssets.reduce((sum, a) => sum + a.weight, 0) || 1;
    return activeAssets.map(a => ({
      name: a.ticker,
      fullName: `${a.ticker} (${a.name})`,
      value: Number(((a.weight / totalW) * 100).toFixed(1)),
      rawWeight: a.weight,
      category: a.category,
      color: a.color
    }));
  }, [activeAssets]);

  const badgeColorClass = {
    'Poor': 'badge-crimson',
    'Moderate': 'badge-amber',
    'Good': 'badge-blue',
    'Excellent': 'badge-emerald'
  }[kri.evaluationBadge];

  return (
    <div className="p-6 space-y-6 w-full">
      {/* Top Banner: Total Portfolio Value & 24h PnL */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
        <div className="glass-card p-5 border-l-4 border-l-blue-500 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>TOTAL NET WORTH ({currency})</span>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold font-mono text-white">
              {formatCompactCurrency(kri.totalValue, currency)}
            </div>
            <div className={`text-xs font-semibold flex items-center gap-1 mt-1 ${kri.totalGainLoss24hPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              <TrendingUp className="w-3.5 h-3.5" />
              {kri.totalGainLoss24hPct >= 0 ? '+' : ''}{formatCompactCurrency(kri.totalGainLoss24h, currency)} ({kri.totalGainLoss24hPct}%) 24h
            </div>
          </div>
          <div className="text-[10px] text-slate-500">Live Multi-Asset Valuation</div>
        </div>

        {/* Sharpe Ratio KRI */}
        <div className="glass-card p-5 border-l-4 border-l-emerald-500 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span className="flex items-center gap-1">
              SHARPE RATIO
              <span className="cursor-pointer text-slate-500 hover:text-slate-300" title="Risk-adjusted return vs 4.5% Risk Free Rate">
                <HelpCircle className="w-3 h-3" />
              </span>
            </span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2 flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {kri.sharpeRatio}
            </div>
            <span className={badgeColorClass}>
              {kri.evaluationBadge}
            </span>
          </div>
          <div className="text-[10px] text-slate-400">
            Sortino: <span className="font-mono text-slate-200 font-bold">{kri.sortinoRatio}</span> (Downside Protection)
          </div>
        </div>

        {/* Value at Risk (VaR) KRI */}
        <div className="glass-card p-5 border-l-4 border-l-amber-500 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>VALUE AT RISK (VaR)</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-2">
            <div className="text-xl font-bold font-mono text-amber-400">
              {kri.var95Historical}% <span className="text-xs text-slate-400 font-normal">(95% Conf.)</span>
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              99% VaR: <span className="text-rose-400 font-bold">{kri.var99Historical}%</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-500">Historical & Parametric 1-Yr Horizon</div>
        </div>

        {/* Beta & Alpha vs Benchmark */}
        <div className="glass-card p-5 border-l-4 border-l-purple-500 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>BETA & ALPHA ({benchmark})</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="my-2 grid grid-cols-2 gap-2">
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Beta</div>
              <div className="text-lg font-bold font-mono text-slate-100">{kri.portfolioBeta}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Alpha</div>
              <div className={`text-lg font-bold font-mono ${kri.portfolioAlpha >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {kri.portfolioAlpha >= 0 ? '+' : ''}{kri.portfolioAlpha}%
              </div>
            </div>
          </div>
          <div className="text-[10px] text-slate-400">
            Max Drawdown (MDD): <span className="text-rose-400 font-bold font-mono">-{kri.maxDrawdown}%</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Performance Chart & Asset Allocation Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Performance Line Chart */}
        <div className="lg:col-span-2 glass-card p-5 space-y-4 w-full">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Portfolio Performance vs {benchmark} Index
              </h2>
              <p className="text-xs text-slate-400">Normalized Index Return Growth (Base 100)</p>
            </div>

            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 gap-1">
              {(['1M', '6M', '1Y', '5Y', 'Max'] as const).map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                    timeframe === tf
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[400px] min-h-[380px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorBench" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64748b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#64748b" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} domain={['auto', 'auto']} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  dataKey="Portfolio"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorPortfolio)"
                />
                <Area
                  type="monotone"
                  dataKey="Benchmark"
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#colorBench)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asset Allocation Donut Chart showing actual asset names on hover */}
        <div className="glass-card p-5 space-y-4 flex flex-col justify-between w-full">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-400" />
              Asset Allocation Breakdown
            </h2>
            <p className="text-xs text-slate-400">Hover over slices to see exact asset names & weight %</p>
          </div>

          <div className="h-[280px] min-h-[260px] w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={individualAssetData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {individualAssetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc'
                  }}
                  formatter={(val: any, name: any, item: any) => [
                    `${val}% Weight`,
                    item?.payload?.fullName || name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Asset Weight Legend list */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {activeAssets.map(asset => (
              <div key={asset.ticker} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: asset.color }} />
                  <span className="font-semibold text-slate-200">{asset.ticker}</span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{asset.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-100">{asset.weight}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
