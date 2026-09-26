import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Activity,
  Info,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import {
  SOVEREIGN_YIELD_CURVE_BENCHMARKS,
  calculateYieldCurveDynamics
} from '../../services/bondPricingEngine';
import type { YieldCurveTenorPoint } from '../../services/bondPricingEngine';

interface YieldCurveChartProps {
  onSelectTenor?: (point: YieldCurveTenorPoint) => void;
  selectedTenor?: string;
  className?: string;
}

export const YieldCurveChart: React.FC<YieldCurveChartProps> = ({
  onSelectTenor,
  selectedTenor,
  className = ''
}) => {
  const [showComparison, setShowComparison] = useState<boolean>(true);
  const [hoveredPoint, setHoveredPoint] = useState<YieldCurveTenorPoint | null>(null);

  const dynamics = useMemo(() => calculateYieldCurveDynamics(), []);
  const points = SOVEREIGN_YIELD_CURVE_BENCHMARKS;

  // Chart dimensions & scaling
  const width = 760;
  const height = 280;
  const padLeft = 55;
  const padRight = 35;
  const padTop = 30;
  const padBottom = 45;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // Min and max yields for scaling
  const allYields = [
    ...points.map(p => p.yieldPct),
    ...(showComparison ? points.map(p => p.prevMonthYieldPct) : []),
    dynamics.rbiRepoRate
  ];
  const minYield = Math.floor(Math.min(...allYields) * 10) / 10 - 0.2;
  const maxYield = Math.ceil(Math.max(...allYields) * 10) / 10 + 0.2;

  const getY = (yieldVal: number) => {
    const fraction = (yieldVal - minYield) / (maxYield - minYield);
    return padTop + (1 - fraction) * chartH;
  };

  const getX = (idx: number) => {
    return padLeft + (idx / (points.length - 1)) * chartW;
  };

  // Build SVG path strings
  const livePath = points.reduce((acc, p, idx) => {
    const x = getX(idx);
    const y = getY(p.yieldPct);
    return idx === 0 ? `M ${x},${y}` : `${acc} L ${x},${y}`;
  }, '');

  const compPath = points.reduce((acc, p, idx) => {
    const x = getX(idx);
    const y = getY(p.prevMonthYieldPct);
    return idx === 0 ? `M ${x},${y}` : `${acc} L ${x},${y}`;
  }, '');

  const areaGradientPath = `${livePath} L ${getX(points.length - 1)},${padTop + chartH} L ${getX(0)},${padTop + chartH} Z`;

  // Horizontal grid lines
  const gridSteps = 5;
  const gridLines = [];
  for (let i = 0; i <= gridSteps; i++) {
    const val = minYield + ((maxYield - minYield) / gridSteps) * i;
    gridLines.push({
      val: Number(val.toFixed(2)),
      y: getY(val)
    });
  }

  return (
    <div className={`p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm space-y-4 ${className}`}>
      {/* Top Header & Curve Dynamics Barometer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-extrabold text-[var(--text-primary)]">
              Indian Sovereign Benchmark Yield Curve (3M – 30Y)
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25">
              RBI Sovereign Benchmarks
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            CCIL NDS-OM sovereign yield curve across money markets, dated G-Secs & ultra-long debt
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Curve Status Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
            <span className="text-[10px] text-[var(--text-muted)] uppercase font-black">Curve Slope:</span>
            <span className={`text-xs font-black flex items-center gap-1 ${
              dynamics.curveShape === 'NORMAL_STEEPENING'
                ? 'text-emerald-600 dark:text-emerald-400'
                : dynamics.curveShape === 'FLATTENING'
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}>
              <Activity className="w-3.5 h-3.5" />
              {dynamics.curveShape === 'NORMAL_STEEPENING' ? 'Normal Steepening' : dynamics.curveShape}
            </span>
          </div>

          {/* Toggle Comparison Mode */}
          <button
            type="button"
            onClick={() => setShowComparison(!showComparison)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              showComparison
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>1M Ago Baseline</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Cards: 10Y-2Y Spread, 10Y-3M Spread, RBI Repo Rate */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">10Y – 2Y Sovereign Spread</span>
            <div className="text-base font-black font-mono text-[var(--text-primary)] flex items-center gap-1 mt-0.5">
              <span>+{dynamics.slope10Y2Y} bps</span>
              <ArrowUpRight className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <span className="text-[9px] px-2 py-0.5 rounded font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            Healthy Slope
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">10Y – 3M Term Premium</span>
            <div className="text-base font-black font-mono text-[var(--text-primary)] flex items-center gap-1 mt-0.5">
              <span>+{dynamics.slope10Y3M} bps</span>
              <ArrowUpRight className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <span className="text-[9px] px-2 py-0.5 rounded font-black bg-blue-500/15 text-blue-600 dark:text-blue-400">
            Positive Carry
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">RBI Repo Policy Rate</span>
            <div className="text-base font-black font-mono text-amber-600 dark:text-amber-400 mt-0.5">
              {dynamics.rbiRepoRate.toFixed(2)}%
            </div>
          </div>
          <span className="text-[9px] px-2 py-0.5 rounded font-black bg-amber-500/15 text-amber-600 dark:text-amber-400">
            Spread: +{dynamics.benchmarkSpread} bps
          </span>
        </div>
      </div>

      {/* SVG Yield Curve Canvas */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none overflow-visible"
        >
          <defs>
            <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Background Grid & Yield Labels */}
          {gridLines.map((g, idx) => (
            <g key={`grid-${idx}`}>
              <line
                x1={padLeft}
                y1={g.y}
                x2={width - padRight}
                y2={g.y}
                stroke="currentColor"
                strokeOpacity="0.10"
                strokeDasharray="4 4"
              />
              <text
                x={padLeft - 8}
                y={g.y + 4}
                textAnchor="end"
                className="text-[10px] font-mono fill-[var(--text-muted)] font-bold"
              >
                {g.val.toFixed(2)}%
              </text>
            </g>
          ))}

          {/* RBI Repo Rate Reference Line */}
          <line
            x1={padLeft}
            y1={getY(dynamics.rbiRepoRate)}
            x2={width - padRight}
            y2={getY(dynamics.rbiRepoRate)}
            stroke="#f59e0b"
            strokeOpacity="0.6"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          <text
            x={width - padRight}
            y={getY(dynamics.rbiRepoRate) - 6}
            textAnchor="end"
            className="text-[9px] font-mono font-black fill-amber-500"
          >
            RBI Repo (6.50%)
          </text>

          {/* Area fill under live curve */}
          <path d={areaGradientPath} fill="url(#curveGradient)" />

          {/* Comparison Line (1 Month Ago) */}
          {showComparison && (
            <path
              d={compPath}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
              strokeDasharray="4 4"
              strokeOpacity="0.75"
            />
          )}

          {/* Live Yield Curve Line */}
          <path
            d={livePath}
            fill="none"
            stroke="#2563eb"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Tenor Points */}
          {points.map((p, idx) => {
            const x = getX(idx);
            const y = getY(p.yieldPct);
            const isSelected = selectedTenor === p.tenor;
            const isHovered = hoveredPoint?.tenor === p.tenor;

            return (
              <g
                key={p.tenor}
                className="cursor-pointer transition-transform"
                onClick={() => onSelectTenor?.(p)}
                onMouseEnter={() => setHoveredPoint(p)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Outer halo on hover/select */}
                {(isSelected || isHovered) && (
                  <circle
                    cx={x}
                    y={y}
                    r="12"
                    fill="#2563eb"
                    fillOpacity="0.25"
                    className="animate-pulse"
                  />
                )}

                {/* Point dot */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected || isHovered ? '6' : '4.5'}
                  fill={isSelected ? '#2563eb' : '#ffffff'}
                  stroke="#2563eb"
                  strokeWidth="3"
                />

                {/* Yield label right above point */}
                <text
                  x={x}
                  y={y - 12}
                  textAnchor="middle"
                  className="text-[11px] font-mono font-black fill-[var(--text-primary)]"
                >
                  {p.yieldPct.toFixed(2)}%
                </text>

                {/* X-Axis Tenor Label */}
                <text
                  x={x}
                  y={padTop + chartH + 20}
                  textAnchor="middle"
                  className={`text-xs font-black ${
                    isSelected
                      ? 'fill-blue-600'
                      : 'fill-[var(--text-primary)] hover:fill-blue-500'
                  }`}
                >
                  {p.tenor}
                </text>

                <text
                  x={x}
                  y={padTop + chartH + 34}
                  textAnchor="middle"
                  className="text-[9px] font-mono fill-[var(--text-muted)] uppercase"
                >
                  {p.tenor.includes('M') ? 'T-Bill' : 'G-Sec'}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Floating Tooltip */}
        {hoveredPoint && (
          <div className="absolute top-2 right-4 bg-[var(--bg-tertiary)] border border-blue-500/40 rounded-xl p-3 shadow-xl pointer-events-none text-xs space-y-1 animate-in fade-in duration-100 z-10">
            <div className="font-extrabold text-[var(--text-primary)] flex items-center justify-between gap-4">
              <span>{hoveredPoint.label}</span>
              <span className="font-mono text-blue-600 dark:text-blue-400 font-black">{hoveredPoint.yieldPct.toFixed(2)}% YTM</span>
            </div>
            <div className="text-[10px] text-[var(--text-muted)] font-mono">
              ISIN: {hoveredPoint.isin}
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[var(--border-color)]">
              <span className="text-[var(--text-secondary)]">1M Change:</span>
              <span className={`font-mono font-bold ${hoveredPoint.changeBps >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {hoveredPoint.changeBps >= 0 ? `+${hoveredPoint.changeBps}` : hoveredPoint.changeBps} bps
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--text-secondary)]">NDS-OM Volume:</span>
              <span className="font-mono font-bold text-[var(--text-primary)]">₹{hoveredPoint.volumeCr.toLocaleString()} Cr</span>
            </div>
          </div>
        )}
      </div>

      {/* Legend & Macro Analysis Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2 border-t border-[var(--border-color)]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-secondary)]">
            <span className="w-3 h-1 bg-blue-600 rounded-full inline-block"></span>
            <span>Live Sovereign Curve</span>
          </div>
          {showComparison && (
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-muted)]">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-slate-400 inline-block"></span>
              <span>1 Month Ago Baseline</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-500">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-amber-500 inline-block"></span>
            <span>RBI Repo (6.50%)</span>
          </div>
        </div>

        <div className="text-[11px] text-[var(--text-muted)] font-medium flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span>Click any tenor dot to inspect underlying benchmark security</span>
        </div>
      </div>
    </div>
  );
};

export default YieldCurveChart;
