import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Maximize2,
  Minimize2,
  Layers
} from 'lucide-react';
import { useTradingSimulation } from '../../context/TradingSimulationContext';

interface CandlestickData {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface InteractiveCandlestickChartProps {
  ticker: string;
  basePrice?: number;
  currency?: string;
  className?: string;
}

type Timeframe = '1m' | '5m' | '15m' | '1h' | '1D';

export const InteractiveCandlestickChart: React.FC<InteractiveCandlestickChartProps> = ({
  ticker,
  basePrice = 2500,
  currency = '₹',
  className = ''
}) => {
  const { orders, positions } = useTradingSimulation();
  const [timeframe, setTimeframe] = useState<Timeframe>('5m');
  const [showEMA20, setShowEMA20] = useState<boolean>(true);
  const [showEMA50, setShowEMA50] = useState<boolean>(true);
  const [showEMA200, setShowEMA200] = useState<boolean>(false);
  const [showVWAP, setShowVWAP] = useState<boolean>(true);
  const [showRSI, setShowRSI] = useState<boolean>(true);
  const [showOrderLines, setShowOrderLines] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [hoveredCandle, setHoveredCandle] = useState<CandlestickData | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rsiCanvasRef = useRef<HTMLCanvasElement>(null);

  // Generate deterministic synthetic candlestick data for this ticker & timeframe
  const candles = useMemo(() => {
    const data: CandlestickData[] = [];
    const count = 60;
    let currentPrice = Math.max(10, basePrice);
    const now = Date.now();
    const intervalMinutes = timeframe === '1m' ? 1 : timeframe === '5m' ? 5 : timeframe === '15m' ? 15 : timeframe === '1h' ? 60 : 1440;
    const intervalMs = intervalMinutes * 60 * 1000;

    // Seeded random walk
    let seed = 0;
    for (let i = 0; i < ticker.length; i++) {
      seed = (seed * 31 + ticker.charCodeAt(i)) % 10000;
    }

    const seededRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    for (let i = count - 1; i >= 0; i--) {
      const timeMs = now - i * intervalMs;
      const dateObj = new Date(timeMs);
      const timeStr = timeframe === '1D'
        ? dateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
        : dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

      const volatility = currentPrice * 0.007;
      const change = (seededRandom() - 0.49) * volatility * 2;
      const open = Math.round(currentPrice * 100) / 100;
      const close = Math.round(Math.max(1, open + change) * 100) / 100;
      const high = Math.round(Math.max(open, close) + seededRandom() * volatility * 1.2 * 100) / 100;
      const low = Math.round(Math.max(0.5, Math.min(open, close) - seededRandom() * volatility * 1.2) * 100) / 100;
      const volume = Math.floor(1000 + seededRandom() * 25000);

      data.push({
        time: timeStr,
        timestamp: timeMs,
        open,
        high,
        low,
        close,
        volume
      });

      currentPrice = close;
    }
    return data;
  }, [ticker, basePrice, timeframe]);

  // Calculate EMA indicator series
  const calculateEMA = useCallback((period: number) => {
    if (candles.length === 0) return [];
    const k = 2 / (period + 1);
    const emaValues: (number | null)[] = [];
    let prevEMA = candles[0].close;

    for (let i = 0; i < candles.length; i++) {
      if (i < period - 1) {
        emaValues.push(null);
      } else if (i === period - 1) {
        const sum = candles.slice(0, period).reduce((acc, c) => acc + c.close, 0);
        prevEMA = sum / period;
        emaValues.push(prevEMA);
      } else {
        prevEMA = candles[i].close * k + prevEMA * (1 - k);
        emaValues.push(prevEMA);
      }
    }
    return emaValues;
  }, [candles]);

  const ema20 = useMemo(() => calculateEMA(20), [calculateEMA]);
  const ema50 = useMemo(() => calculateEMA(50), [calculateEMA]);
  const ema200 = useMemo(() => calculateEMA(200), [calculateEMA]);

  // Calculate VWAP series
  const vwapSeries = useMemo(() => {
    let cumVol = 0;
    let cumVolPrice = 0;
    return candles.map(c => {
      const typicalPrice = (c.high + c.low + c.close) / 3;
      cumVol += c.volume;
      cumVolPrice += typicalPrice * c.volume;
      return cumVol === 0 ? c.close : cumVolPrice / cumVol;
    });
  }, [candles]);

  // Calculate RSI(14)
  const rsiValues = useMemo(() => {
    const period = 14;
    const rsi: (number | null)[] = [];
    let gains = 0;
    let losses = 0;

    for (let i = 0; i < candles.length; i++) {
      if (i === 0) {
        rsi.push(null);
        continue;
      }
      const diff = candles[i].close - candles[i - 1].close;
      const gain = diff > 0 ? diff : 0;
      const loss = diff < 0 ? Math.abs(diff) : 0;

      if (i <= period) {
        gains += gain;
        losses += loss;
        if (i === period) {
          const avgGain = gains / period;
          const avgLoss = losses / period;
          const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
          rsi.push(100 - 100 / (1 + rs));
        } else {
          rsi.push(null);
        }
      } else {
        gains = (gains * (period - 1) + gain) / period;
        losses = (losses * (period - 1) + loss) / period;
        const rs = losses === 0 ? 100 : gains / losses;
        rsi.push(100 - 100 / (1 + rs));
      }
    }
    return rsi;
  }, [candles]);

  // Filter orders related to this ticker
  const activeOrders = useMemo(() => {
    return orders.filter(o => o.ticker === ticker && o.status === 'PENDING');
  }, [orders, ticker]);

  const activePosition = useMemo(() => {
    return positions.find(p => p.ticker === ticker && p.status === 'OPEN');
  }, [positions, ticker]);

  // Render main candlestick chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Padding
    const paddingLeft = 10;
    const paddingRight = 65;
    const paddingTop = 25;
    const paddingBottom = 40;
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Price bounds
    let minPrice = Math.min(...candles.map(c => c.low));
    let maxPrice = Math.max(...candles.map(c => c.high));
    const priceMargin = (maxPrice - minPrice) * 0.1 || 1;
    minPrice -= priceMargin;
    maxPrice += priceMargin;

    // Volume bounds
    const maxVolume = Math.max(...candles.map(c => c.volume), 1);
    const volumeHeight = chartHeight * 0.22;

    const getY = (price: number) => {
      return paddingTop + (1 - (price - minPrice) / (maxPrice - minPrice)) * chartHeight;
    };

    const candleWidth = Math.max(3, (chartWidth / candles.length) * 0.7);
    const candleSpacing = chartWidth / candles.length;

    // Draw horizontal grid lines & price labels
    const gridLines = 5;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
    ctx.lineWidth = 1;
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.textAlign = 'left';

    for (let i = 0; i <= gridLines; i++) {
      const p = minPrice + (i / gridLines) * (maxPrice - minPrice);
      const y = getY(p);

      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - paddingRight, y);
      ctx.stroke();

      ctx.fillText(`${currency}${p.toFixed(2)}`, width - paddingRight + 6, y + 3);
    }

    // Draw volume bars at the bottom
    candles.forEach((c, idx) => {
      const x = paddingLeft + idx * candleSpacing + candleSpacing / 2;
      const isGreen = c.close >= c.open;
      const vHeight = (c.volume / maxVolume) * volumeHeight;
      const vY = height - paddingBottom - vHeight;

      ctx.fillStyle = isGreen ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)';
      ctx.fillRect(x - candleWidth / 2, vY, candleWidth, vHeight);
    });

    // Draw Candlesticks (Wicks and Bodies)
    candles.forEach((c, idx) => {
      const x = paddingLeft + idx * candleSpacing + candleSpacing / 2;
      const isGreen = c.close >= c.open;
      const color = isGreen ? '#10b981' : '#f43f5e';

      const yOpen = getY(c.open);
      const yClose = getY(c.close);
      const yHigh = getY(c.high);
      const yLow = getY(c.low);

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, yHigh);
      ctx.lineTo(x, yLow);
      ctx.stroke();

      // Body
      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));

      ctx.fillStyle = color;
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    });

    // Helper to draw indicator line
    const drawLine = (values: (number | null)[], strokeStyle: string, lineWidth = 1.5, dashed = false) => {
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      if (dashed) {
        ctx.setLineDash([4, 4]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.beginPath();
      let started = false;

      values.forEach((v, idx) => {
        if (v === null) return;
        const x = paddingLeft + idx * candleSpacing + candleSpacing / 2;
        const y = getY(v);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
      ctx.setLineDash([]);
    };

    // Draw EMAs
    if (showEMA20) drawLine(ema20, '#06b6d4', 1.5); // Cyan
    if (showEMA50) drawLine(ema50, '#f59e0b', 1.5); // Amber
    if (showEMA200) drawLine(ema200, '#a855f7', 1.5); // Purple

    // Draw VWAP
    if (showVWAP) drawLine(vwapSeries, '#eab308', 1.8, true); // Yellow dashed

    // Draw Order Lines (Feature 1: horizontal limit/SL overlay)
    if (showOrderLines) {
      activeOrders.forEach(o => {
        if (o.price && o.price >= minPrice && o.price <= maxPrice) {
          const y = getY(o.price);
          const isBuy = o.action === 'BUY';

          ctx.setLineDash([6, 4]);
          ctx.strokeStyle = isBuy ? '#3b82f6' : '#ec4899';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(paddingLeft, y);
          ctx.lineTo(width - paddingRight, y);
          ctx.stroke();
          ctx.setLineDash([]);

          // Badge
          ctx.fillStyle = isBuy ? '#3b82f6' : '#ec4899';
          ctx.fillStyle = isBuy ? '#3b82f6' : '#ec4899';
          ctx.fillRect(width - paddingRight + 2, y - 9, 60, 18);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px "JetBrains Mono", monospace';
          ctx.fillText(`${o.action} ${o.qty ?? o.quantity}`, width - paddingRight + 6, y + 3);
        }

        // Target / Stoploss overlay
        if (o.targetPrice && o.targetPrice >= minPrice && o.targetPrice <= maxPrice) {
          const y = getY(o.targetPrice);
          ctx.setLineDash([3, 3]);
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(paddingLeft, y);
          ctx.lineTo(width - paddingRight, y);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#10b981';
          ctx.fillRect(width - paddingRight + 2, y - 8, 55, 16);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 8px "JetBrains Mono", monospace';
          ctx.fillText(`TARGET`, width - paddingRight + 6, y + 3);
        }

        if (o.stopLossPrice && o.stopLossPrice >= minPrice && o.stopLossPrice <= maxPrice) {
          const y = getY(o.stopLossPrice);
          ctx.setLineDash([3, 3]);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(paddingLeft, y);
          ctx.lineTo(width - paddingRight, y);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#ef4444';
          ctx.fillRect(width - paddingRight + 2, y - 8, 55, 16);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 8px "JetBrains Mono", monospace';
          ctx.fillText(`STOPLOSS`, width - paddingRight + 6, y + 3);
        }
      });

      // Active Position entry price
      const posPrice = activePosition ? (activePosition.avgPrice ?? activePosition.avgBuyPrice) : 0;
      if (activePosition && posPrice >= minPrice && posPrice <= maxPrice) {
        const y = getY(posPrice);
        ctx.setLineDash([2, 4]);
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(paddingLeft, y);
        ctx.lineTo(width - paddingRight, y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#8b5cf6';
        ctx.fillRect(width - paddingRight + 2, y - 8, 62, 16);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px "JetBrains Mono", monospace';
        ctx.fillText(`POS ${activePosition.qty ?? activePosition.quantity}`, width - paddingRight + 6, y + 3);
      }
    }

    // Time Axis Labels
    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    const labelStep = Math.max(1, Math.floor(candles.length / 6));
    for (let i = 0; i < candles.length; i += labelStep) {
      const x = paddingLeft + i * candleSpacing + candleSpacing / 2;
      ctx.fillText(candles[i].time, x, height - 12);
    }
  }, [
    candles,
    timeframe,
    showEMA20,
    showEMA50,
    showEMA200,
    showVWAP,
    showOrderLines,
    activeOrders,
    activePosition,
    currency,
    ema20,
    ema50,
    ema200,
    vwapSeries
  ]);

  // Render RSI sub-panel
  useEffect(() => {
    if (!showRSI) return;
    const canvas = rsiCanvasRef.current;
    if (!canvas || candles.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);

    const paddingLeft = 10;
    const paddingRight = 65;
    const paddingTop = 8;
    const paddingBottom = 12;
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const getRsiY = (rsiVal: number) => {
      return paddingTop + (1 - rsiVal / 100) * chartHeight;
    };

    // Levels: 70 (Overbought), 50 (Neutral), 30 (Oversold)
    [70, 50, 30].forEach(level => {
      const y = getRsiY(level);
      ctx.strokeStyle = level === 50 ? 'rgba(148, 163, 184, 0.15)' : level === 70 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - paddingRight, y);
      ctx.stroke();

      ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${level}`, width - paddingRight + 6, y + 3);
    });
    ctx.setLineDash([]);

    // Draw RSI Line
    const candleSpacing = chartWidth / candles.length;
    ctx.strokeStyle = '#ec4899'; // Pink/Purple
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    let started = false;

    rsiValues.forEach((val, idx) => {
      if (val === null) return;
      const x = paddingLeft + idx * candleSpacing + candleSpacing / 2;
      const y = getRsiY(val);
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
  }, [rsiValues, candles.length, showRSI]);

  // Mouse move handler for HUD
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const paddingLeft = 10;
    const paddingRight = 65;
    const chartWidth = rect.width - paddingLeft - paddingRight;
    const candleSpacing = chartWidth / candles.length;

    const index = Math.floor((mouseX - paddingLeft) / candleSpacing);
    if (index >= 0 && index < candles.length) {
      setHoveredCandle(candles[index]);
    } else {
      setHoveredCandle(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredCandle(null);
  };

  const latestCandle = candles[candles.length - 1];
  const activeCandle = hoveredCandle || latestCandle;
  const isUp = activeCandle ? activeCandle.close >= activeCandle.open : true;

  return (
    <div
      ref={containerRef}
      className={`bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 shadow-xl flex flex-col gap-3 transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 overflow-hidden' : ''
      } ${className}`}
    >
      {/* Top Header: Controls, Ticker, Indicators, Timeframes */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
        {/* Ticker & OHLCV HUD */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono font-extrabold text-sm text-[var(--text-primary)]">{ticker}</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[var(--icici-orange)]/15 text-[var(--icici-orange)] uppercase">
              Live Feed
            </span>
          </div>

          {activeCandle && (
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-[var(--text-muted)]">O: <strong className="text-[var(--text-primary)]">{currency}{activeCandle.open.toFixed(2)}</strong></span>
              <span className="text-[var(--text-muted)]">H: <strong className="text-emerald-500">{currency}{activeCandle.high.toFixed(2)}</strong></span>
              <span className="text-[var(--text-muted)]">L: <strong className="text-rose-500">{currency}{activeCandle.low.toFixed(2)}</strong></span>
              <span className="text-[var(--text-muted)]">C: <strong className={isUp ? 'text-emerald-500' : 'text-rose-500'}>{currency}{activeCandle.close.toFixed(2)}</strong></span>
              <span className="text-[var(--text-muted)]">Vol: <strong className="text-[var(--text-primary)]">{activeCandle.volume.toLocaleString()}</strong></span>
            </div>
          )}
        </div>

        {/* Action Controls & Indicators */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe selector */}
          <div className="flex items-center bg-[var(--bg-tertiary)] p-0.5 rounded-lg border border-[var(--border-color)] text-[11px] font-mono font-bold">
            {(['1m', '5m', '15m', '1h', '1D'] as Timeframe[]).map(tf => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  timeframe === tf ? 'bg-[var(--icici-orange)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Indicator Toggles */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowEMA20(!showEMA20)}
              className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                showEMA20 ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-muted)]'
              }`}
              title="Exponential Moving Average (20 period)"
            >
              EMA 20
            </button>
            <button
              type="button"
              onClick={() => setShowEMA50(!showEMA50)}
              className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                showEMA50 ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-muted)]'
              }`}
              title="Exponential Moving Average (50 period)"
            >
              EMA 50
            </button>
            <button
              type="button"
              onClick={() => setShowEMA200(!showEMA200)}
              className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                showEMA200 ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-muted)]'
              }`}
              title="Exponential Moving Average (200 period)"
            >
              EMA 200
            </button>
            <button
              type="button"
              onClick={() => setShowVWAP(!showVWAP)}
              className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                showVWAP ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-muted)]'
              }`}
              title="Volume Weighted Average Price"
            >
              VWAP
            </button>
            <button
              type="button"
              onClick={() => setShowRSI(!showRSI)}
              className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                showRSI ? 'bg-pink-500/20 border-pink-500/50 text-pink-400' : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-muted)]'
              }`}
              title="Relative Strength Index (14)"
            >
              RSI
            </button>
            <button
              type="button"
              onClick={() => setShowOrderLines(!showOrderLines)}
              className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                showOrderLines ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-muted)]'
              }`}
              title="Show Limit & Stoploss Order Lines"
            >
              <Layers className="w-3 h-3" />
              <span>Orders</span>
            </button>
          </div>

          {/* Fullscreen toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] border border-[var(--border-color)] transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative w-full flex-1 min-h-[300px] flex flex-col">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full flex-1 cursor-crosshair block"
          style={{ minHeight: isFullscreen ? '450px' : '260px' }}
        />

        {/* RSI Sub-Panel */}
        {showRSI && (
          <div className="border-t border-[var(--border-color)]/60 pt-1 mt-1">
            <div className="flex items-center justify-between text-[10px] font-mono px-2 text-[var(--text-muted)]">
              <span className="font-bold text-pink-400">RSI (14)</span>
              <span>
                {rsiValues[rsiValues.length - 1] !== null
                  ? Number(rsiValues[rsiValues.length - 1]).toFixed(1)
                  : '--'}
              </span>
            </div>
            <canvas
              ref={rsiCanvasRef}
              className="w-full h-16 block cursor-crosshair"
            />
          </div>
        )}
      </div>

      {/* Legend Footer */}
      <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-[var(--text-muted)] border-t border-[var(--border-color)] pt-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-cyan-400 inline-block"></span>
            <span>EMA 20</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-amber-400 inline-block"></span>
            <span>EMA 50</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-yellow-400 inline-block border-b border-dashed border-yellow-400"></span>
            <span>VWAP</span>
          </div>
          {showOrderLines && (
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-blue-500 inline-block"></span>
              <span>Active Orders</span>
            </div>
          )}
        </div>
        <div className="text-[var(--text-muted)]">
          Real-time DMA Canvas Renderer
        </div>
      </div>
    </div>
  );
};
