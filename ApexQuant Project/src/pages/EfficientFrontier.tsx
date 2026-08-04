import React, { useState, useEffect, useMemo } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import type { FrontierPoint, CorrelationMatrixData } from '../types/portfolio';
import { PortfolioApiService } from '../services/api';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  Legend
} from 'recharts';
import {
  PieChart as PieIcon,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';

export const EfficientFrontierPage: React.FC = () => {
  const { assets } = usePortfolio();
  const [frontierPoints, setFrontierPoints] = useState<FrontierPoint[]>([]);
  const [correlationData, setCorrelationData] = useState<CorrelationMatrixData | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<FrontierPoint | null>(null);

  useEffect(() => {
    let isMounted = true;
    PortfolioApiService.getEfficientFrontier(assets).then(points => {
      if (isMounted) setFrontierPoints(points);
    });

    PortfolioApiService.getCorrelationMatrix(assets).then(corr => {
      if (isMounted) setCorrelationData(corr);
    });

    return () => { isMounted = false; };
  }, [assets]);

  // Group frontier points by type for scatter plot rendering
  const simulatedData = useMemo(() => frontierPoints.filter(p => p.type === 'simulated'), [frontierPoints]);
  const singleAssetData = useMemo(() => frontierPoints.filter(p => p.type === 'single_asset'), [frontierPoints]);
  const maxSharpePoint = useMemo(() => frontierPoints.find(p => p.type === 'max_sharpe'), [frontierPoints]);
  const minVarPoint = useMemo(() => frontierPoints.find(p => p.type === 'min_variance'), [frontierPoints]);
  const userPoint = useMemo(() => frontierPoints.find(p => p.type === 'user_portfolio'), [frontierPoints]);

  const handlePointHover = (data: any) => {
    if (data && data.payload) {
      setHoveredPoint(data.payload as FrontierPoint);
    }
  };

  const getCorrelationColor = (val: number) => {
    if (val === 1.0) return 'bg-slate-800 text-slate-400';
    if (val > 0.6) return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
    if (val > 0.3) return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
    if (val > 0) return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
    return 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-bold';
  };

  return (
    <div className="p-6 space-y-6 w-full">
      {/* Top Banner */}
      <div className="glass-card p-5 flex flex-wrap items-center justify-between gap-4 w-full">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            Markowitz Efficient Frontier & Cross-Asset Correlation Heatmap
          </h2>
          <p className="text-xs text-slate-400">
            60+ Monte Carlo Simulated Portfolios on Risk-Return Coordinate Plane ($R_p$ vs $\sigma_p$)
          </p>
        </div>

        {/* Legend pills */}
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Max Sharpe
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Min Volatility
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Your Portfolio
          </span>
        </div>
      </div>

      {/* Main Grid: Scatter Plot + Selected Hover Weights Inspection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Scatter Chart (2 cols) */}
        <div className="lg:col-span-2 glass-card p-5 space-y-4 w-full">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Risk vs Expected Return Scatter Plot
            </h3>
            <span className="text-xs text-slate-400 font-mono">X: Risk Volatility (%) | Y: Ann. Return (%)</span>
          </div>

          <div className="h-[420px] min-h-[400px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                <XAxis
                  type="number"
                  dataKey="risk"
                  name="Risk Volatility"
                  unit="%"
                  stroke="#64748b"
                  fontSize={11}
                  domain={['dataMin - 2', 'dataMax + 2']}
                />
                <YAxis
                  type="number"
                  dataKey="return"
                  name="Annualized Return"
                  unit="%"
                  stroke="#64748b"
                  fontSize={11}
                  domain={['dataMin - 5', 'dataMax + 5']}
                />
                <ZAxis type="number" dataKey="sharpe" range={[50, 400]} />
                <Tooltip
                  content={({ payload }) => {
                    if (payload && payload.length) {
                      const data = payload[0].payload as FrontierPoint;
                      return (
                        <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-xl text-xs space-y-1 text-slate-100">
                          <div className="font-bold text-blue-400">{data.name}</div>
                          <div>Ann. Return: <span className="font-mono font-bold text-emerald-400">{data.return}%</span></div>
                          <div>Risk (Vol): <span className="font-mono font-bold text-amber-400">{data.risk}%</span></div>
                          <div>Sharpe Ratio: <span className="font-mono font-bold text-purple-400">{data.sharpe}</span></div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />

                {/* Simulated portfolios background points */}
                <Scatter
                  name="Simulated Portfolios"
                  data={simulatedData}
                  fill="#64748b"
                  fillOpacity={0.4}
                  onMouseOver={handlePointHover}
                />

                {/* Single Asset points */}
                <Scatter
                  name="Single Securities"
                  data={singleAssetData}
                  fill="#a855f7"
                  shape="circle"
                  onMouseOver={handlePointHover}
                />

                {/* Max Sharpe Point */}
                {maxSharpePoint && (
                  <Scatter
                    name="Max Sharpe Portfolio"
                    data={[maxSharpePoint]}
                    fill="#10b981"
                    shape="star"
                    onMouseOver={handlePointHover}
                  />
                )}

                {/* Min Variance Point */}
                {minVarPoint && (
                  <Scatter
                    name="Min Variance Portfolio"
                    data={[minVarPoint]}
                    fill="#3b82f6"
                    shape="diamond"
                    onMouseOver={handlePointHover}
                  />
                )}

                {/* User Portfolio Point */}
                {userPoint && (
                  <Scatter
                    name="Current User Portfolio"
                    data={[userPoint]}
                    fill="#f59e0b"
                    shape="circle"
                    onMouseOver={handlePointHover}
                  />
                )}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hovered Point Weight Inspector (1 col) */}
        <div className="glass-card p-5 space-y-4 flex flex-col justify-between w-full">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-purple-400" />
              Simulated Weights Inspector
            </h3>
            <p className="text-xs text-slate-400">Hover over any scatter point to view asset weights</p>
          </div>

          {hoveredPoint ? (
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="font-bold text-sm text-blue-400 flex items-center justify-between">
                <span>{hoveredPoint.name}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                  SR: {hoveredPoint.sharpe}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block">Return</span>
                  <span className="text-emerald-400 font-bold">{hoveredPoint.return}%</span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block">Volatility</span>
                  <span className="text-amber-400 font-bold">{hoveredPoint.risk}%</span>
                </div>
              </div>

              {hoveredPoint.weights && (
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <div className="text-xs font-semibold text-slate-300">Constituent Asset Weights:</div>
                  <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                    {Object.entries(hoveredPoint.weights).map(([ticker, w]) => (
                      <div key={ticker} className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-300">{ticker}</span>
                        <span className="text-emerald-400 font-bold">{w}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-60 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 flex items-center justify-center text-center p-4 text-xs text-slate-500">
              Hover mouse cursor over any portfolio coordinate in the chart to inspect mathematical asset weights.
            </div>
          )}

          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 leading-relaxed">
            <strong>MPT Insight:</strong> Portfolios on the upper boundary line dominate all lower points by offering maximum return for a given risk level.
          </div>
        </div>
      </div>

      {/* Cross-Asset Correlation Heatmap Section */}
      <div className="glass-card p-5 space-y-4 w-full">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            Cross-Asset Correlation Heatmap Matrix (-1.0 to +1.0)
          </h3>
          <p className="text-xs text-slate-400">
            Co-variance diversification matrix. Values &lt; 0 represent non-correlated hedges.
          </p>
        </div>

        {correlationData && (
          <div className="overflow-x-auto w-full">
            <table className="fin-table">
              <thead>
                <tr>
                  <th className="bg-slate-900 text-slate-400">Asset Ticker</th>
                  {correlationData.tickers.map(t => (
                    <th key={t} className="text-center bg-slate-900 font-mono font-bold text-slate-200">
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {correlationData.matrix.map((row, i) => (
                  <tr key={correlationData.tickers[i]}>
                    <td className="font-bold text-slate-200 font-mono bg-slate-900/50">
                      {correlationData.tickers[i]}
                    </td>
                    {row.map((val, j) => (
                      <td key={j} className="text-center font-mono">
                        <span className={`inline-block px-2.5 py-1 rounded text-xs ${getCorrelationColor(val)}`}>
                          {val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
