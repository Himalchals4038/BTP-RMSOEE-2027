import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  X,
  Minus,
  Plus,
  Crosshair,
  Pencil,
  Trash2,
  Camera
} from 'lucide-react';
import { subscribeToTicker } from '../../context/TradingSimulationContext';
import {
  generateRealisticCandles,
  getStockMetadata,
  type StockMetadata20Yr
} from '../../services/indianMarketSimulationEngine';

// ═══════════════════════════════════════════════════════════════════════════════
// DATA STRUCTURES
// ═══════════════════════════════════════════════════════════════════════════════

export interface CandlestickBar {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SebiFilingMarker {
  id: string;
  candleIndex: number;
  type: 'EARNINGS' | 'DIVIDEND' | 'SAST_INSIDER';
  badge: 'E' | 'D' | 'S';
  title: string;
  regSection: string;
  date: string;
  details: string;
  promoterOrEntity: string;
  impact: 'Bullish' | 'Neutral' | 'Bearish';
  changePct?: string;
}

export interface TradeSignal {
  candleIndex: number;
  type: 'BUY' | 'SELL';
  price: number;
}

export type ChartTimeframe = '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1D' | '1W';
export type ChartType = 'candles' | 'heikin_ashi' | 'hollow' | 'ohlc_bars' | 'line' | 'area' | 'baseline';
export type DrawingToolType = 'none' | 'trendline' | 'horizontal' | 'fibonacci' | 'rectangle' | 'measure';

interface DrawingObject {
  id: string;
  type: DrawingToolType;
  points: { x: number; y: number; price: number; candleIdx: number }[];
  color: string;
}

interface TradingViewChartProps {
  ticker: string;
  basePrice?: number;
  currency?: string;
  exchange?: string;
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// REALISTIC 20-YEAR INSPIRED INDIAN MARKET SIMULATION ENGINE
// Anchors macro 1D/1W cycles to authentic 20-year NSE/BSE history (2004-2024),
// and intraday to Heston Stochastic Volatility + Merton Jump-Diffusion + U-Curve.
// ═══════════════════════════════════════════════════════════════════════════════

function generateHistoricalCandles(
  ticker: string,
  basePrice: number,
  timeframe: ChartTimeframe,
  count: number = 120
): CandlestickBar[] {
  return generateRealisticCandles(ticker, basePrice, timeframe, count);
}

// ═══════════════════════════════════════════════════════════════════════════════
// HEIKIN-ASHI TRANSFORMATION
// ═══════════════════════════════════════════════════════════════════════════════

function toHeikinAshi(candles: CandlestickBar[]): CandlestickBar[] {
  if (candles.length === 0) return [];
  const ha: CandlestickBar[] = [];

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const haClose = (c.open + c.high + c.low + c.close) / 4;
    const haOpen = i === 0
      ? (c.open + c.close) / 2
      : (ha[i - 1].open + ha[i - 1].close) / 2;
    const haHigh = Math.max(c.high, haOpen, haClose);
    const haLow = Math.min(c.low, haOpen, haClose);

    ha.push({
      time: c.time,
      timestamp: c.timestamp,
      open: Math.round(haOpen * 100) / 100,
      high: Math.round(haHigh * 100) / 100,
      low: Math.round(haLow * 100) / 100,
      close: Math.round(haClose * 100) / 100,
      volume: c.volume
    });
  }
  return ha;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INDICATOR MATH UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

function calcEMA(data: CandlestickBar[], period: number): (number | null)[] {
  const k = 2 / (period + 1);
  const series: (number | null)[] = [];
  let prev = data[0]?.close || 0;
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { series.push(null); continue; }
    if (i === period - 1) {
      prev = data.slice(0, period).reduce((a, c) => a + c.close, 0) / period;
      series.push(prev);
    } else {
      prev = data[i].close * k + prev * (1 - k);
      series.push(prev);
    }
  }
  return series;
}

function calcSMA(data: CandlestickBar[], period: number): (number | null)[] {
  const series: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { series.push(null); continue; }
    const sum = data.slice(i - period + 1, i + 1).reduce((a, c) => a + c.close, 0);
    series.push(sum / period);
  }
  return series;
}

function calcVWAP(data: CandlestickBar[]): number[] {
  let sumTPV = 0, sumVol = 0;
  return data.map(c => {
    const tp = (c.high + c.low + c.close) / 3;
    sumTPV += tp * c.volume;
    sumVol += c.volume;
    return sumVol > 0 ? sumTPV / sumVol : c.close;
  });
}

function calcBollinger(data: CandlestickBar[], period = 20, mult = 2): { upper: (number | null)[]; lower: (number | null)[]; middle: (number | null)[] } {
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];
  const middle: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { upper.push(null); lower.push(null); middle.push(null); continue; }
    const slice = data.slice(i - period + 1, i + 1).map(c => c.close);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
    const sd = Math.sqrt(variance);
    middle.push(mean);
    upper.push(mean + sd * mult);
    lower.push(mean - sd * mult);
  }
  return { upper, lower, middle };
}

function calcRSI(data: CandlestickBar[], period = 14): (number | null)[] {
  const rsi: (number | null)[] = [];
  if (data.length <= period) return data.map(() => null);
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = data[i].close - data[i - 1].close;
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  let avgGain = gains / period, avgLoss = losses / period;
  rsi.push(...Array(period).fill(null));
  rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    if (diff >= 0) { avgGain = (avgGain * (period - 1) + diff) / period; avgLoss = (avgLoss * (period - 1)) / period; }
    else { avgGain = (avgGain * (period - 1)) / period; avgLoss = (avgLoss * (period - 1) - diff) / period; }
    rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  }
  return rsi;
}

function calcMACD(data: CandlestickBar[], fastP = 12, slowP = 26, signalP = 9): { macd: (number | null)[]; signal: (number | null)[]; histogram: (number | null)[] } {
  const emaFast = calcEMA(data, fastP);
  const emaSlow = calcEMA(data, slowP);
  const macdLine: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (emaFast[i] !== null && emaSlow[i] !== null) {
      macdLine.push(emaFast[i]! - emaSlow[i]!);
    } else {
      macdLine.push(null);
    }
  }
  // Signal line = EMA of MACD
  const validMacd = macdLine.filter(v => v !== null) as number[];
  const signalLine: (number | null)[] = [];
  const histogram: (number | null)[] = [];
  let sigEma = validMacd.length > 0 ? validMacd[0] : 0;
  const sigK = 2 / (signalP + 1);
  let validCount = 0;

  for (let i = 0; i < data.length; i++) {
    if (macdLine[i] === null) {
      signalLine.push(null);
      histogram.push(null);
    } else {
      validCount++;
      if (validCount <= signalP) {
        if (validCount === signalP) {
          const slice = macdLine.slice(0, i + 1).filter(v => v !== null) as number[];
          sigEma = slice.slice(-signalP).reduce((a, b) => a + b, 0) / signalP;
        }
        signalLine.push(validCount >= signalP ? sigEma : null);
        histogram.push(validCount >= signalP ? macdLine[i]! - sigEma : null);
      } else {
        sigEma = macdLine[i]! * sigK + sigEma * (1 - sigK);
        signalLine.push(sigEma);
        histogram.push(macdLine[i]! - sigEma);
      }
    }
  }
  return { macd: macdLine, signal: signalLine, histogram };
}

function calcStochastic(data: CandlestickBar[], kPeriod = 14, dPeriod = 3): { k: (number | null)[]; d: (number | null)[] } {
  const kLine: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < kPeriod - 1) { kLine.push(null); continue; }
    const slice = data.slice(i - kPeriod + 1, i + 1);
    const high = Math.max(...slice.map(c => c.high));
    const low = Math.min(...slice.map(c => c.low));
    const range = high - low;
    kLine.push(range > 0 ? ((data[i].close - low) / range) * 100 : 50);
  }
  // %D = SMA of %K
  const dLine: (number | null)[] = [];
  for (let i = 0; i < kLine.length; i++) {
    if (i < kPeriod - 1 + dPeriod - 1 || kLine[i] === null) { dLine.push(null); continue; }
    const slice = kLine.slice(i - dPeriod + 1, i + 1).filter(v => v !== null) as number[];
    dLine.push(slice.length >= dPeriod ? slice.reduce((a, b) => a + b, 0) / dPeriod : null);
  }
  return { k: kLine, d: dLine };
}

function calcSupertrend(data: CandlestickBar[], period = 10, multiplier = 3): { trend: (number | null)[]; direction: ('up' | 'down' | null)[] } {
  const atr: number[] = [];
  const trend: (number | null)[] = [];
  const direction: ('up' | 'down' | null)[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      atr.push(data[i].high - data[i].low);
      trend.push(null);
      direction.push(null);
      continue;
    }
    const tr = Math.max(
      data[i].high - data[i].low,
      Math.abs(data[i].high - data[i - 1].close),
      Math.abs(data[i].low - data[i - 1].close)
    );

    if (i < period) {
      atr.push(tr);
      trend.push(null);
      direction.push(null);
      continue;
    }

    const currentAtr = i === period
      ? data.slice(0, period + 1).reduce((a, c, j) => {
          if (j === 0) return c.high - c.low;
          return a + Math.max(c.high - c.low, Math.abs(c.high - data[j-1].close), Math.abs(c.low - data[j-1].close));
        }, 0) / (period + 1)
      : (atr[i - 1] * (period - 1) + tr) / period;
    atr.push(currentAtr);

    const hl2 = (data[i].high + data[i].low) / 2;
    const upperBand = hl2 + multiplier * currentAtr;
    const lowerBand = hl2 - multiplier * currentAtr;

    const prevDir = direction[i - 1];
    const prevTrend = trend[i - 1];

    if (prevDir === 'up' || prevDir === null) {
      if (data[i].close < (prevTrend ?? lowerBand)) {
        trend.push(upperBand);
        direction.push('down');
      } else {
        trend.push(Math.max(lowerBand, prevTrend ?? lowerBand));
        direction.push('up');
      }
    } else {
      if (data[i].close > (prevTrend ?? upperBand)) {
        trend.push(lowerBand);
        direction.push('up');
      } else {
        trend.push(Math.min(upperBand, prevTrend ?? upperBand));
        direction.push('down');
      }
    }
  }

  return { trend, direction };
}

function calcPivotPoints(data: CandlestickBar[]): { pivot: number; r1: number; r2: number; r3: number; s1: number; s2: number; s3: number } | null {
  if (data.length < 2) return null;
  // Use second-to-last candle as previous period
  const prev = data[data.length - 2];
  const pivot = (prev.high + prev.low + prev.close) / 3;
  const r1 = 2 * pivot - prev.low;
  const s1 = 2 * pivot - prev.high;
  const r2 = pivot + (prev.high - prev.low);
  const s2 = pivot - (prev.high - prev.low);
  const r3 = prev.high + 2 * (pivot - prev.low);
  const s3 = prev.low - 2 * (prev.high - pivot);
  return { pivot, r1, r2, r3, s1, s2, s3 };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
  ticker,
  basePrice = 2458.50,
  currency = '₹',
  exchange = 'NSE',
  className = ''
}) => {
  // ── Core State ────────────────────────────────────────────────────────────
  const [timeframe, setTimeframe] = useState<ChartTimeframe>('5m');
  const [chartType, setChartType] = useState<ChartType>('candles');
  const [candles, setCandles] = useState<CandlestickBar[]>(() =>
    generateHistoricalCandles(ticker, basePrice, '5m', 120)
  );
  const [liveLtp, setLiveLtp] = useState<number>(() => {
    const init = generateHistoricalCandles(ticker, basePrice, '5m', 120);
    return init.length > 0 ? init[init.length - 1].close : basePrice;
  });
  const [tickDirection, setTickDirection] = useState<'UP' | 'DOWN' | 'FLAT'>('FLAT');

  // ── Indicator Toggles ─────────────────────────────────────────────────────
  const [showEMA9, setShowEMA9] = useState<boolean>(false);
  const [showEMA20, setShowEMA20] = useState<boolean>(true);
  const [showEMA50, setShowEMA50] = useState<boolean>(true);
  const [showEMA200, setShowEMA200] = useState<boolean>(false);
  const [showSMA20, setShowSMA20] = useState<boolean>(false);
  const [showVWAP, setShowVWAP] = useState<boolean>(false);
  const [showBollinger, setShowBollinger] = useState<boolean>(false);
  const [showSupertrend, setShowSupertrend] = useState<boolean>(false);
  const [showPivots, setShowPivots] = useState<boolean>(false);
  const [showSignals, setShowSignals] = useState<boolean>(true);
  const [showRSI, setShowRSI] = useState<boolean>(false);
  const [showMACD, setShowMACD] = useState<boolean>(false);
  const [showStochastic, setShowStochastic] = useState<boolean>(false);
  const [showSebiFilings, setShowSebiFilings] = useState<boolean>(true);
  const [showVolume, setShowVolume] = useState<boolean>(true);
  const [selectedFiling, setSelectedFiling] = useState<SebiFilingMarker | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [resizeEpoch, setResizeEpoch] = useState<number>(0);

  // 20-Year Indian Market Metadata (CAGR, 200-DMA, Valuation Sentinel)
  const stockMeta = useMemo<StockMetadata20Yr | null>(() => getStockMetadata(ticker), [ticker]);

  // Fullscreen Escape key listener & body scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  useEffect(() => {
    if (isFullscreen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isFullscreen]);

  // ResizeObserver to detect canvas/container dimension shifts instantly (especially on expand/collapse)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleResize = () => {
      setResizeEpoch(prev => prev + 1);
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(container);
    window.addEventListener('resize', handleResize);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [isFullscreen]);

  // ── Zoom & Pan ────────────────────────────────────────────────────────────
  const [candleWidth, setCandleWidth] = useState<number>(11);
  const [panOffset, setPanOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStartX, setDragStartX] = useState<number>(0);

  // ── Crosshair ─────────────────────────────────────────────────────────────
  const [crosshair, setCrosshair] = useState<{ x: number; y: number; candle: CandlestickBar | null } | null>(null);

  // ── Drawing Tools ─────────────────────────────────────────────────────────
  const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingToolType>('none');
  const [drawings, setDrawings] = useState<DrawingObject[]>([]);
  const [pendingDrawing, setPendingDrawing] = useState<DrawingObject | null>(null);
  const [showDrawingToolbar, setShowDrawingToolbar] = useState<boolean>(false);
  const [showIndicatorPanel, setShowIndicatorPanel] = useState<boolean>(false);
  const [showChartTypeMenu, setShowChartTypeMenu] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── Data Regeneration ─────────────────────────────────────────────────────
  useEffect(() => {
    const fresh = generateHistoricalCandles(ticker, basePrice, timeframe, 120);
    setCandles(fresh);
    const lastClose = fresh.length > 0 ? fresh[fresh.length - 1].close : basePrice;
    setLiveLtp(lastClose);
    setPanOffset(0);
  }, [ticker, basePrice, timeframe]);

  // ── Live Tick Stream (5 Hz) ───────────────────────────────────────────────
  useEffect(() => {
    let synced = false;
    const unsubscribe = subscribeToTicker(ticker, (tick) => {
      const price = tick?.ltp;
      if (typeof price !== 'number') return;

      if (!synced) {
        synced = true;
        setCandles(prev => {
          if (prev.length === 0) return prev;
          const lastClose = prev[prev.length - 1].close;
          if (Math.abs(price - lastClose) / lastClose > 0.02) {
            return generateHistoricalCandles(ticker, price, timeframe, 120);
          }
          return prev;
        });
      }

      setLiveLtp(prevPrice => {
        if (price > prevPrice) setTickDirection('UP');
        else if (price < prevPrice) setTickDirection('DOWN');
        return price;
      });

      setCandles(prev => {
        if (prev.length === 0) return prev;
        const lastIdx = prev.length - 1;
        const last = prev[lastIdx];
        const updatedLast: CandlestickBar = {
          ...last,
          close: price,
          high: Math.max(last.high, price),
          low: Math.min(last.low, price),
          volume: last.volume + (tick.volume ? Math.max(1, Math.floor(tick.volume / 100)) : 10)
        };
        const clone = [...prev];
        clone[lastIdx] = updatedLast;
        return clone;
      });
    });
    return unsubscribe;
  }, [ticker, timeframe]);

  // ══════════════════════════════════════════════════════════════════════════
  // FIX: Prevent page scroll when mouse wheel is inside chart canvas.
  // Uses native addEventListener with { passive: false } because React's
  // onWheel synthetic event cannot call preventDefault() on passive listeners.
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.deltaY < 0) {
        setCandleWidth(prev => Math.min(30, prev + 1.2));
      } else {
        setCandleWidth(prev => Math.max(4, prev - 1.2));
      }
    };

    canvas.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleNativeWheel);
    };
  }, []);

  // ── Display Data (apply Heikin-Ashi if needed) ────────────────────────────
  const displayCandles = useMemo(() => {
    if (chartType === 'heikin_ashi') return toHeikinAshi(candles);
    return candles;
  }, [candles, chartType]);

  // ── SEBI Corporate Filing Markers ─────────────────────────────────────────
  const sebiFilings: SebiFilingMarker[] = useMemo(() => {
    if (candles.length < 20) return [];
    return [
      {
        id: `${ticker}-DIV`, candleIndex: Math.floor(candles.length * 0.25),
        type: 'DIVIDEND', badge: 'D',
        title: 'Interim Dividend Entitlement', regSection: 'SEBI (LODR) Reg 43',
        date: '18 Sep 2026',
        details: 'Declared Interim Dividend of ₹16.50/share. Depository record entitlement active.',
        promoterOrEntity: 'Board Audit Committee', impact: 'Bullish', changePct: '+2.8% Dividend Yield'
      },
      {
        id: `${ticker}-SAST`, candleIndex: Math.floor(candles.length * 0.58),
        type: 'SAST_INSIDER', badge: 'S',
        title: 'SEBI SAST Reg 29(2) Promoter Stake Addition', regSection: 'SEBI SAST Reg 29(2)',
        date: '19 Sep 2026',
        details: 'Promoter family acquired 145,000 equity shares in open market. Zero pledge encumbrance.',
        promoterOrEntity: 'Promoter Family Trust', impact: 'Bullish', changePct: '+0.22% Net Stake'
      },
      {
        id: `${ticker}-EARN`, candleIndex: Math.floor(candles.length * 0.85),
        type: 'EARNINGS', badge: 'E',
        title: 'Q3 Financial Earnings Beat', regSection: 'SEBI (LODR) Reg 33',
        date: '20 Sep 2026',
        details: 'PAT expanded 18.6% YoY with EBITDA margins widening 95 bps.',
        promoterOrEntity: 'CFO & Statutory Auditors', impact: 'Bullish', changePct: '+18.6% PAT Growth'
      }
    ];
  }, [ticker, candles.length]);

  // ── BUY / SELL Swing Signals ──────────────────────────────────────────────
  const tradeSignals: TradeSignal[] = useMemo(() => {
    if (displayCandles.length < 10) return [];
    const signals: TradeSignal[] = [];
    let lastSigIdx = -10;
    for (let i = 3; i < displayCandles.length - 2; i++) {
      if (i - lastSigIdx < 6) continue;
      const c = displayCandles[i];
      const isSwingLow = c.low <= displayCandles[i-1].low && c.low <= displayCandles[i-2].low
                       && c.low < displayCandles[i+1].low && c.low < displayCandles[i+2].low;
      const isSwingHigh = c.high >= displayCandles[i-1].high && c.high >= displayCandles[i-2].high
                        && c.high > displayCandles[i+1].high && c.high > displayCandles[i+2].high;
      if (isSwingLow) { signals.push({ candleIndex: i, type: 'BUY', price: c.low }); lastSigIdx = i; }
      else if (isSwingHigh) { signals.push({ candleIndex: i, type: 'SELL', price: c.high }); lastSigIdx = i; }
    }
    return signals;
  }, [displayCandles]);

  // ── Computed Indicators ───────────────────────────────────────────────────
  const ema9 = useMemo(() => calcEMA(displayCandles, 9), [displayCandles]);
  const ema20 = useMemo(() => calcEMA(displayCandles, 20), [displayCandles]);
  const ema50 = useMemo(() => calcEMA(displayCandles, 50), [displayCandles]);
  const ema200 = useMemo(() => calcEMA(displayCandles, 200), [displayCandles]);
  const sma20 = useMemo(() => calcSMA(displayCandles, 20), [displayCandles]);
  const vwapSeries = useMemo(() => calcVWAP(displayCandles), [displayCandles]);
  const bollingerBands = useMemo(() => calcBollinger(displayCandles), [displayCandles]);
  const rsiSeries = useMemo(() => calcRSI(displayCandles), [displayCandles]);
  const macdData = useMemo(() => calcMACD(displayCandles), [displayCandles]);
  const stochData = useMemo(() => calcStochastic(displayCandles), [displayCandles]);
  const supertrendData = useMemo(() => calcSupertrend(displayCandles), [displayCandles]);
  const pivotData = useMemo(() => calcPivotPoints(displayCandles), [displayCandles]);

  // ── Active/Hovered OHLC for header ────────────────────────────────────────
  const activeCandle = crosshair?.candle || displayCandles[displayCandles.length - 1] || null;
  const candleChangeAmount = activeCandle ? activeCandle.close - activeCandle.open : 0;
  const candleChangePct = activeCandle && activeCandle.open > 0 ? (candleChangeAmount / activeCandle.open) * 100 : 0;

  // ══════════════════════════════════════════════════════════════════════════
  // CANVAS RENDERING ENGINE
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || displayCandles.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // TradingView Dark Theme Colors
    const bgDark = '#131722';
    const gridColor = '#1e222d';
    const textMuted = '#787b86';
    const tealBullish = '#089981';
    const redBearish = '#f23645';

    ctx.fillStyle = bgDark;
    ctx.fillRect(0, 0, width, height);

    // Layout calculations
    const padTop = 28;
    const padBottom = 28;
    const padRight = 74;
    const padLeft = 12;
    const chartW = width - padLeft - padRight;

    // Determine sub-panel heights
    const subPanelCount = (showRSI ? 1 : 0) + (showMACD ? 1 : 0) + (showStochastic ? 1 : 0);
    const subPanelH = subPanelCount > 0 ? Math.min(75, Math.floor((height * 0.25) / subPanelCount)) : 0;
    const subPanelTotalH = subPanelH * subPanelCount;
    const volumeH = showVolume ? 50 : 0;
    const subPanelGap = subPanelCount > 0 ? 8 : 0;
    const totalH = height - padTop - padBottom;
    const priceH = totalH - volumeH - subPanelTotalH - subPanelGap * subPanelCount - 10;

    // Visible candle slice
    const candleSpacing = candleWidth + 5;
    const maxVisibleCandles = Math.max(10, Math.floor(chartW / candleSpacing));
    const startIndex = Math.max(0, displayCandles.length - maxVisibleCandles - panOffset);
    const endIndex = Math.min(displayCandles.length, startIndex + maxVisibleCandles);
    const visibleCandles = displayCandles.slice(startIndex, endIndex);
    if (visibleCandles.length === 0) return;

    // Price range with breathing room
    let minPrice = Math.min(...visibleCandles.map(c => c.low));
    let maxPrice = Math.max(...visibleCandles.map(c => c.high));
    const rawRange = maxPrice - minPrice || 1;
    minPrice -= rawRange * 0.12;
    maxPrice += rawRange * 0.12;
    const maxVolume = Math.max(...visibleCandles.map(c => c.volume), 1);

    const getY = (price: number) => padTop + (1 - (price - minPrice) / (maxPrice - minPrice)) * priceH;
    const getX = (localIdx: number) => padLeft + localIdx * candleSpacing + candleWidth / 2;

    // ── 1. Grid Lines & Right Price Scale ──
    const priceSteps = 7;
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    for (let i = 0; i <= priceSteps; i++) {
      const p = minPrice + ((maxPrice - minPrice) / priceSteps) * i;
      const y = getY(p);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();
      ctx.fillStyle = textMuted;
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(p.toFixed(2), width - padRight + 8, y + 3.5);
    }
    ctx.setLineDash([]);

    // Right scale border
    ctx.strokeStyle = '#2a2e39';
    ctx.beginPath();
    ctx.moveTo(width - padRight, 0);
    ctx.lineTo(width - padRight, height);
    ctx.stroke();

    // ── 2. Pivot Point Levels ──
    if (showPivots && pivotData) {
      const pivotLevels = [
        { label: 'R3', price: pivotData.r3, color: '#ef4444' },
        { label: 'R2', price: pivotData.r2, color: '#f87171' },
        { label: 'R1', price: pivotData.r1, color: '#fca5a5' },
        { label: 'PP', price: pivotData.pivot, color: '#fbbf24' },
        { label: 'S1', price: pivotData.s1, color: '#86efac' },
        { label: 'S2', price: pivotData.s2, color: '#4ade80' },
        { label: 'S3', price: pivotData.s3, color: '#22c55e' },
      ];
      for (const lv of pivotLevels) {
        if (lv.price >= minPrice && lv.price <= maxPrice) {
          const y = getY(lv.price);
          ctx.strokeStyle = lv.color;
          ctx.lineWidth = 0.8;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(padLeft, y);
          ctx.lineTo(width - padRight, y);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = lv.color;
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(lv.label, padLeft + chartW - 4, y - 3);
        }
      }
    }

    // ── 3. Bollinger Bands Fill ──
    if (showBollinger) {
      ctx.fillStyle = 'rgba(0, 229, 255, 0.05)';
      ctx.beginPath();
      let firstUpper = true;
      visibleCandles.forEach((_, idx) => {
        const gIdx = startIndex + idx;
        const u = bollingerBands.upper[gIdx];
        if (u !== null) {
          const x = getX(idx);
          if (firstUpper) { ctx.moveTo(x, getY(u)); firstUpper = false; }
          else ctx.lineTo(x, getY(u));
        }
      });
      for (let idx = visibleCandles.length - 1; idx >= 0; idx--) {
        const gIdx = startIndex + idx;
        const l = bollingerBands.lower[gIdx];
        if (l !== null) ctx.lineTo(getX(idx), getY(l));
      }
      ctx.closePath();
      ctx.fill();

      drawLineSeries(ctx, visibleCandles, startIndex, bollingerBands.upper, '#00e5ff', 1.2, padLeft, candleSpacing, candleWidth, getY);
      drawLineSeries(ctx, visibleCandles, startIndex, bollingerBands.lower, '#00e5ff', 1.2, padLeft, candleSpacing, candleWidth, getY);
      drawLineSeries(ctx, visibleCandles, startIndex, bollingerBands.middle, '#00e5ff66', 0.8, padLeft, candleSpacing, candleWidth, getY);
    }

    // ── 4. Supertrend Overlay ──
    if (showSupertrend) {
      for (let idx = 1; idx < visibleCandles.length; idx++) {
        const gIdx = startIndex + idx;
        const prevGIdx = gIdx - 1;
        const val = supertrendData.trend[gIdx];
        const prevVal = supertrendData.trend[prevGIdx];
        const dir = supertrendData.direction[gIdx];
        if (val === null || prevVal === null || dir === null) continue;

        const x1 = getX(idx - 1);
        const y1 = getY(prevVal);
        const x2 = getX(idx);
        const y2 = getY(val);

        ctx.strokeStyle = dir === 'up' ? tealBullish : redBearish;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }

    // ── 5. Technical Overlay Lines: EMA / SMA / VWAP ──
    if (showEMA9) drawLineSeries(ctx, visibleCandles, startIndex, ema9, '#e91e63', 1.5, padLeft, candleSpacing, candleWidth, getY);
    if (showEMA20) drawLineSeries(ctx, visibleCandles, startIndex, ema20, '#ff9800', 1.8, padLeft, candleSpacing, candleWidth, getY);
    if (showEMA50) drawLineSeries(ctx, visibleCandles, startIndex, ema50, '#2962ff', 1.8, padLeft, candleSpacing, candleWidth, getY);
    if (showEMA200) drawLineSeries(ctx, visibleCandles, startIndex, ema200, '#00bcd4', 1.5, padLeft, candleSpacing, candleWidth, getY);
    if (showSMA20) drawLineSeries(ctx, visibleCandles, startIndex, sma20, '#9c27b0', 1.5, padLeft, candleSpacing, candleWidth, getY);
    if (showVWAP) drawLineSeries(ctx, visibleCandles, startIndex, vwapSeries, '#ab47bc', 1.8, padLeft, candleSpacing, candleWidth, getY);

    // ── 6. Draw Chart Content ──
    if (chartType === 'line' || chartType === 'area' || chartType === 'baseline') {
      // LINE / AREA / BASELINE rendering
      const baselinePrice = chartType === 'baseline'
        ? displayCandles[startIndex]?.close || displayCandles[0]?.close || basePrice
        : 0;

      ctx.beginPath();
      let started = false;
      visibleCandles.forEach((c, idx) => {
        const x = getX(idx);
        const y = getY(c.close);
        if (!started) { ctx.moveTo(x, y); started = true; }
        else ctx.lineTo(x, y);
      });

      if (chartType === 'area') {
        // Area fill
        const areaPath = new Path2D();
        visibleCandles.forEach((c, idx) => {
          const x = getX(idx);
          const y = getY(c.close);
          if (idx === 0) areaPath.moveTo(x, y);
          else areaPath.lineTo(x, y);
        });
        areaPath.lineTo(getX(visibleCandles.length - 1), padTop + priceH);
        areaPath.lineTo(getX(0), padTop + priceH);
        areaPath.closePath();

        const grad = ctx.createLinearGradient(0, padTop, 0, padTop + priceH);
        grad.addColorStop(0, 'rgba(41, 98, 255, 0.35)');
        grad.addColorStop(1, 'rgba(41, 98, 255, 0.02)');
        ctx.fillStyle = grad;
        ctx.fill(areaPath);
      }

      if (chartType === 'baseline') {
        // Two-tone fill: green above baseline, red below
        const blY = getY(baselinePrice);
        // Green above
        const abovePath = new Path2D();
        let aboveStarted = false;
        visibleCandles.forEach((c, idx) => {
          const x = getX(idx);
          const y = Math.min(getY(c.close), blY);
          if (!aboveStarted) { abovePath.moveTo(x, y); aboveStarted = true; }
          else abovePath.lineTo(x, y);
        });
        abovePath.lineTo(getX(visibleCandles.length - 1), blY);
        abovePath.lineTo(getX(0), blY);
        abovePath.closePath();
        ctx.fillStyle = 'rgba(8, 153, 129, 0.15)';
        ctx.fill(abovePath);

        // Red below
        const belowPath = new Path2D();
        let belowStarted = false;
        visibleCandles.forEach((c, idx) => {
          const x = getX(idx);
          const y = Math.max(getY(c.close), blY);
          if (!belowStarted) { belowPath.moveTo(x, y); belowStarted = true; }
          else belowPath.lineTo(x, y);
        });
        belowPath.lineTo(getX(visibleCandles.length - 1), blY);
        belowPath.lineTo(getX(0), blY);
        belowPath.closePath();
        ctx.fillStyle = 'rgba(242, 54, 69, 0.15)';
        ctx.fill(belowPath);

        // Baseline horizontal
        ctx.strokeStyle = '#787b86';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(padLeft, blY);
        ctx.lineTo(width - padRight, blY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Main line stroke
      ctx.strokeStyle = chartType === 'baseline' ? '#2962ff' : '#2962ff';
      ctx.lineWidth = 2;
      ctx.stroke();

    } else {
      // CANDLESTICK / HEIKIN-ASHI / HOLLOW / OHLC BARS
      visibleCandles.forEach((c, idx) => {
        const x = getX(idx);
        const yOpen = getY(c.open);
        const yClose = getY(c.close);
        const yHigh = getY(c.high);
        const yLow = getY(c.low);
        const isUp = c.close >= c.open;
        const color = isUp ? tealBullish : redBearish;

        const bodyTop = Math.min(yOpen, yClose);
        const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));

        if (chartType === 'ohlc_bars') {
          // OHLC Bar rendering (vertical line + left/right ticks)
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          // Vertical high-low line
          ctx.beginPath();
          ctx.moveTo(x, yHigh);
          ctx.lineTo(x, yLow);
          ctx.stroke();
          // Open tick (left)
          ctx.beginPath();
          ctx.moveTo(x - candleWidth * 0.4, yOpen);
          ctx.lineTo(x, yOpen);
          ctx.stroke();
          // Close tick (right)
          ctx.beginPath();
          ctx.moveTo(x, yClose);
          ctx.lineTo(x + candleWidth * 0.4, yClose);
          ctx.stroke();
        } else {
          // Wicks
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x, bodyTop);
          ctx.lineTo(x, yHigh);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x, bodyTop + bodyHeight);
          ctx.lineTo(x, yLow);
          ctx.stroke();

          if (chartType === 'hollow') {
            // Hollow: filled if bearish, hollow if bullish
            if (isUp) {
              ctx.strokeStyle = color;
              ctx.lineWidth = 1.5;
              ctx.strokeRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
            } else {
              ctx.fillStyle = color;
              ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
            }
          } else {
            // Standard solid candles (including Heikin-Ashi which is just transformed data)
            ctx.fillStyle = color;
            ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
            ctx.strokeStyle = color;
            ctx.strokeRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
          }
        }
      });
    }

    // ── 7. BUY / SELL Signals ──
    if (showSignals) {
      tradeSignals.forEach(sig => {
        if (sig.candleIndex >= startIndex && sig.candleIndex < endIndex) {
          const localIdx = sig.candleIndex - startIndex;
          const c = visibleCandles[localIdx];
          if (!c) return;
          const x = getX(localIdx);
          if (sig.type === 'BUY') {
            const y = getY(c.low) + 16;
            ctx.fillStyle = tealBullish;
            ctx.beginPath();
            ctx.roundRect(x - 16, y, 32, 16, 4);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y); ctx.lineTo(x, y - 4); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('BUY', x, y + 11.5);
          } else {
            const y = getY(c.high) - 22;
            ctx.fillStyle = redBearish;
            ctx.beginPath();
            ctx.roundRect(x - 18, y, 36, 16, 4);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(x - 4, y + 16); ctx.lineTo(x + 4, y + 16); ctx.lineTo(x, y + 20); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('SELL', x, y + 11.5);
          }
        }
      });
    }

    // ── 8. SEBI Corporate Filings ──
    if (showSebiFilings) {
      sebiFilings.forEach(f => {
        if (f.candleIndex >= startIndex && f.candleIndex < endIndex) {
          const localIdx = f.candleIndex - startIndex;
          const c = visibleCandles[localIdx];
          if (!c) return;
          const x = getX(localIdx);
          const y = getY(c.high) - 26;
          ctx.beginPath();
          ctx.arc(x, y, 7.5, 0, Math.PI * 2);
          ctx.fillStyle = f.type === 'EARNINGS' ? '#10b981' : f.type === 'DIVIDEND' ? '#06b6d4' : '#f59e0b';
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(f.badge, x, y + 3.2);
        }
      });
    }

    // ── 9. Volume Histogram ──
    if (showVolume) {
      const volTop = padTop + priceH + 6;
      ctx.strokeStyle = '#222631';
      ctx.beginPath();
      ctx.moveTo(padLeft, volTop);
      ctx.lineTo(padLeft + chartW, volTop);
      ctx.stroke();

      visibleCandles.forEach((c, idx) => {
        const x = getX(idx);
        const vH = (c.volume / maxVolume) * (volumeH - 8);
        const y = volTop + volumeH - vH;
        const isUp = c.close >= c.open;
        ctx.fillStyle = isUp ? 'rgba(8, 153, 129, 0.60)' : 'rgba(242, 54, 69, 0.60)';
        ctx.fillRect(x - candleWidth / 2, y, candleWidth, Math.max(1, vH));
      });
    }

    // ── 10. Sub-Panel Oscillators: RSI / MACD / Stochastic ──
    let currentSubTop = padTop + priceH + (showVolume ? volumeH + 6 : 0) + 8;

    const drawSubPanelBorder = (top: number, h: number, label: string) => {
      ctx.fillStyle = '#11141c';
      ctx.fillRect(padLeft, top, chartW, h);
      ctx.strokeStyle = '#2a2e39';
      ctx.strokeRect(padLeft, top, chartW, h);
      ctx.fillStyle = textMuted;
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(label, padLeft + 6, top + 12);
    };

    if (showRSI && subPanelH > 0) {
      drawSubPanelBorder(currentSubTop, subPanelH, `RSI (14): ${rsiSeries[rsiSeries.length - 1]?.toFixed(1) ?? '--'}`);
      const y70 = currentSubTop + subPanelH * 0.30;
      const y30 = currentSubTop + subPanelH * 0.70;
      ctx.strokeStyle = '#475569'; ctx.setLineDash([2, 2]); ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(padLeft, y70); ctx.lineTo(padLeft + chartW, y70); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(padLeft, y30); ctx.lineTo(padLeft + chartW, y30); ctx.stroke();
      ctx.setLineDash([]);
      // Overbought/oversold zones
      ctx.fillStyle = 'rgba(242, 54, 69, 0.06)';
      ctx.fillRect(padLeft, currentSubTop, chartW, subPanelH * 0.30);
      ctx.fillStyle = 'rgba(8, 153, 129, 0.06)';
      ctx.fillRect(padLeft, currentSubTop + subPanelH * 0.70, chartW, subPanelH * 0.30);

      ctx.fillStyle = textMuted; ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillText('70', width - padRight + 6, y70 + 3);
      ctx.fillText('30', width - padRight + 6, y30 + 3);

      ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 1.5; ctx.beginPath();
      let startedRsi = false;
      visibleCandles.forEach((_, idx) => {
        const val = rsiSeries[startIndex + idx];
        if (val !== null && val !== undefined) {
          const x = getX(idx);
          const y = currentSubTop + (1 - val / 100) * subPanelH;
          if (!startedRsi) { ctx.moveTo(x, y); startedRsi = true; }
          else ctx.lineTo(x, y);
        }
      });
      if (startedRsi) ctx.stroke();
      currentSubTop += subPanelH + subPanelGap;
    }

    if (showMACD && subPanelH > 0) {
      drawSubPanelBorder(currentSubTop, subPanelH, 'MACD (12, 26, 9)');
      // Find MACD range
      let macdMin = 0, macdMax = 0;
      visibleCandles.forEach((_, idx) => {
        const gIdx = startIndex + idx;
        const m = macdData.macd[gIdx]; const s = macdData.signal[gIdx]; const h = macdData.histogram[gIdx];
        if (m !== null) { macdMin = Math.min(macdMin, m); macdMax = Math.max(macdMax, m); }
        if (s !== null) { macdMin = Math.min(macdMin, s); macdMax = Math.max(macdMax, s); }
        if (h !== null) { macdMin = Math.min(macdMin, h); macdMax = Math.max(macdMax, h); }
      });
      const macdRange = macdMax - macdMin || 1;
      const getMacdY = (v: number) => currentSubTop + (1 - (v - macdMin) / macdRange) * subPanelH;

      // Zero line
      if (macdMin < 0 && macdMax > 0) {
        const zeroY = getMacdY(0);
        ctx.strokeStyle = '#475569'; ctx.setLineDash([2, 2]); ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(padLeft, zeroY); ctx.lineTo(padLeft + chartW, zeroY); ctx.stroke();
        ctx.setLineDash([]);
      }

      // Histogram bars
      visibleCandles.forEach((_, idx) => {
        const h = macdData.histogram[startIndex + idx];
        if (h === null) return;
        const x = getX(idx);
        const zeroY = getMacdY(0);
        const barY = getMacdY(h);
        ctx.fillStyle = h >= 0 ? 'rgba(8, 153, 129, 0.6)' : 'rgba(242, 54, 69, 0.6)';
        ctx.fillRect(x - candleWidth * 0.3, Math.min(zeroY, barY), candleWidth * 0.6, Math.abs(barY - zeroY));
      });

      // MACD line
      ctx.strokeStyle = '#2962ff'; ctx.lineWidth = 1.5; ctx.beginPath();
      let startedMacd = false;
      visibleCandles.forEach((_, idx) => {
        const val = macdData.macd[startIndex + idx];
        if (val !== null) {
          const x = getX(idx);
          if (!startedMacd) { ctx.moveTo(x, getMacdY(val)); startedMacd = true; }
          else ctx.lineTo(x, getMacdY(val));
        }
      });
      if (startedMacd) ctx.stroke();

      // Signal line
      ctx.strokeStyle = '#ff9800'; ctx.lineWidth = 1.2; ctx.beginPath();
      let startedSig = false;
      visibleCandles.forEach((_, idx) => {
        const val = macdData.signal[startIndex + idx];
        if (val !== null) {
          const x = getX(idx);
          if (!startedSig) { ctx.moveTo(x, getMacdY(val)); startedSig = true; }
          else ctx.lineTo(x, getMacdY(val));
        }
      });
      if (startedSig) ctx.stroke();
      currentSubTop += subPanelH + subPanelGap;
    }

    if (showStochastic && subPanelH > 0) {
      drawSubPanelBorder(currentSubTop, subPanelH, 'Stochastic (14, 3)');
      const y80 = currentSubTop + subPanelH * 0.20;
      const y20 = currentSubTop + subPanelH * 0.80;
      ctx.strokeStyle = '#475569'; ctx.setLineDash([2, 2]); ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(padLeft, y80); ctx.lineTo(padLeft + chartW, y80); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(padLeft, y20); ctx.lineTo(padLeft + chartW, y20); ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = textMuted; ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillText('80', width - padRight + 6, y80 + 3);
      ctx.fillText('20', width - padRight + 6, y20 + 3);

      // %K line
      ctx.strokeStyle = '#2962ff'; ctx.lineWidth = 1.5; ctx.beginPath();
      let startedK = false;
      visibleCandles.forEach((_, idx) => {
        const val = stochData.k[startIndex + idx];
        if (val !== null) {
          const x = getX(idx);
          const y = currentSubTop + (1 - val / 100) * subPanelH;
          if (!startedK) { ctx.moveTo(x, y); startedK = true; }
          else ctx.lineTo(x, y);
        }
      });
      if (startedK) ctx.stroke();

      // %D line
      ctx.strokeStyle = '#ff9800'; ctx.lineWidth = 1.2; ctx.beginPath();
      let startedD = false;
      visibleCandles.forEach((_, idx) => {
        const val = stochData.d[startIndex + idx];
        if (val !== null) {
          const x = getX(idx);
          const y = currentSubTop + (1 - val / 100) * subPanelH;
          if (!startedD) { ctx.moveTo(x, y); startedD = true; }
          else ctx.lineTo(x, y);
        }
      });
      if (startedD) ctx.stroke();
      currentSubTop += subPanelH + subPanelGap;
    }

    // ── 11. Right Y-Axis Live LTP Tag ──
    const latestCandle = displayCandles[displayCandles.length - 1];
    if (latestCandle) {
      const ltpY = getY(latestCandle.close);
      const isUp = latestCandle.close >= latestCandle.open;
      const tagBg = isUp ? tealBullish : redBearish;

      ctx.strokeStyle = tagBg; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(padLeft, ltpY); ctx.lineTo(width - padRight, ltpY); ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = tagBg;
      ctx.beginPath(); ctx.roundRect(width - padRight + 3, ltpY - 9, 68, 18, 4); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10.5px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(latestCandle.close.toFixed(2), width - padRight + 37, ltpY + 3.5);
    }

    // ── 12. Drawing Objects ──
    drawings.forEach(d => {
      if (d.type === 'horizontal' && d.points.length >= 1) {
        const y = getY(d.points[0].price);
        ctx.strokeStyle = d.color; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]);
        ctx.beginPath(); ctx.moveTo(padLeft, y); ctx.lineTo(width - padRight, y); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = d.color;
        ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(`${d.points[0].price.toFixed(2)}`, padLeft + 4, y - 4);
      }
      if (d.type === 'trendline' && d.points.length >= 2) {
        const y1 = getY(d.points[0].price);
        const y2 = getY(d.points[1].price);
        const x1 = getX(d.points[0].candleIdx - startIndex);
        const x2 = getX(d.points[1].candleIdx - startIndex);
        ctx.strokeStyle = d.color; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }
      if (d.type === 'fibonacci' && d.points.length >= 2) {
        const highP = Math.max(d.points[0].price, d.points[1].price);
        const lowP = Math.min(d.points[0].price, d.points[1].price);
        const range = highP - lowP;
        const fibs = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0];
        const fibColors = ['#787b86', '#f59e0b', '#22c55e', '#3b82f6', '#ef4444', '#a855f7', '#787b86'];
        fibs.forEach((fib, fi) => {
          const price = highP - range * fib;
          const y = getY(price);
          ctx.strokeStyle = fibColors[fi]; ctx.lineWidth = 0.8; ctx.setLineDash([4, 4]);
          ctx.beginPath(); ctx.moveTo(padLeft, y); ctx.lineTo(width - padRight, y); ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = fibColors[fi]; ctx.font = '9px "JetBrains Mono", monospace'; ctx.textAlign = 'right';
          ctx.fillText(`${(fib * 100).toFixed(1)}% — ${price.toFixed(2)}`, width - padRight - 4, y - 3);
        });
      }
      if (d.type === 'rectangle' && d.points.length >= 2) {
        const y1 = getY(d.points[0].price);
        const y2 = getY(d.points[1].price);
        const x1 = getX(d.points[0].candleIdx - startIndex);
        const x2 = getX(d.points[1].candleIdx - startIndex);
        ctx.fillStyle = 'rgba(41, 98, 255, 0.08)';
        ctx.fillRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
        ctx.strokeStyle = d.color; ctx.lineWidth = 1;
        ctx.strokeRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
      }
      if (d.type === 'measure' && d.points.length >= 2) {
        const y1 = getY(d.points[0].price);
        const y2 = getY(d.points[1].price);
        const x1 = getX(d.points[0].candleIdx - startIndex);
        const x2 = getX(d.points[1].candleIdx - startIndex);
        ctx.strokeStyle = '#787b86'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.setLineDash([]);
        const diff = d.points[1].price - d.points[0].price;
        const pct = (diff / d.points[0].price) * 100;
        const bars = Math.abs(d.points[1].candleIdx - d.points[0].candleIdx);
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        ctx.fillStyle = '#1e222d';
        ctx.beginPath(); ctx.roundRect(midX - 55, midY - 20, 110, 40, 6); ctx.fill();
        ctx.strokeStyle = '#2962ff'; ctx.strokeRect(midX - 55, midY - 20, 110, 40);
        ctx.fillStyle = diff >= 0 ? tealBullish : redBearish;
        ctx.font = 'bold 10px "JetBrains Mono", monospace'; ctx.textAlign = 'center';
        ctx.fillText(`${diff >= 0 ? '+' : ''}${diff.toFixed(2)} (${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%)`, midX, midY - 5);
        ctx.fillStyle = textMuted; ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillText(`${bars} bars`, midX, midY + 10);
      }
    });

    // ── 13. Pending Drawing (in-progress) ──
    if (pendingDrawing && pendingDrawing.points.length === 1 && crosshair) {
      const pt = pendingDrawing.points[0];
      const y1 = getY(pt.price);
      const x1 = getX(pt.candleIdx - startIndex);
      ctx.strokeStyle = '#2962ff'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(crosshair.x, crosshair.y); ctx.stroke();
      ctx.setLineDash([]);
    }

    // ── 14. Dynamic Mouse Crosshair ──
    if (crosshair && crosshair.candle) {
      const cx = crosshair.x;
      const cy = crosshair.y;
      ctx.strokeStyle = '#787b86'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, height - padBottom); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(padLeft, cy); ctx.lineTo(width - padRight, cy); ctx.stroke();
      ctx.setLineDash([]);

      // Price tag on right axis
      const crossPrice = minPrice + (1 - (cy - padTop) / priceH) * (maxPrice - minPrice);
      ctx.fillStyle = '#2962ff';
      ctx.beginPath(); ctx.roundRect(width - padRight + 3, cy - 9, 68, 18, 4); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px "JetBrains Mono", monospace'; ctx.textAlign = 'center';
      ctx.fillText(crossPrice.toFixed(2), width - padRight + 37, cy + 3.5);

      // Time tag on bottom
      ctx.fillStyle = '#363a45';
      ctx.beginPath(); ctx.roundRect(cx - 34, height - padBottom + 2, 68, 16, 4); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px "JetBrains Mono", monospace'; ctx.textAlign = 'center';
      ctx.fillText(crosshair.candle.time, cx, height - padBottom + 13);
    }

    // ── 15. Bottom X-Axis Time Labels ──
    const timeStep = Math.max(1, Math.floor(visibleCandles.length / 7));
    ctx.fillStyle = textMuted;
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    visibleCandles.forEach((c, idx) => {
      if (idx % timeStep === 0) {
        ctx.fillText(c.time, getX(idx), height - 8);
      }
    });

  }, [displayCandles, candleWidth, panOffset, crosshair, chartType,
      showEMA9, showEMA20, showEMA50, showEMA200, showSMA20, showVWAP,
      showBollinger, showSupertrend, showPivots, showSignals,
      showRSI, showMACD, showStochastic, showSebiFilings, showVolume,
      sebiFilings, tradeSignals,
      ema9, ema20, ema50, ema200, sma20, vwapSeries, bollingerBands,
      rsiSeries, macdData, stochData, supertrendData, pivotData,
      drawings, pendingDrawing, basePrice, isFullscreen, resizeEpoch]);

  // ══════════════════════════════════════════════════════════════════════════
  // MOUSE INTERACTION HANDLERS
  // ══════════════════════════════════════════════════════════════════════════

  const getCandleInfoAtMouse = useCallback((mouseX: number, rect: DOMRect) => {
    const padLeft = 12;
    const padRight = 74;
    const chartW = rect.width - padLeft - padRight;
    const candleSpacing = candleWidth + 5;
    const maxVisible = Math.max(10, Math.floor(chartW / candleSpacing));
    const startIndex = Math.max(0, displayCandles.length - maxVisible - panOffset);
    const relativeX = mouseX - padLeft;
    const candleIndexInView = Math.floor(relativeX / candleSpacing);
    const globalIndex = startIndex + candleIndexInView;
    return { startIndex, globalIndex, candleIndexInView, padLeft, padRight, candleSpacing, maxVisible };
  }, [candleWidth, panOffset, displayCandles.length]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDragging) {
      const deltaX = x - dragStartX;
      const candleSpacing = candleWidth + 5;
      const deltaCandles = Math.round(deltaX / candleSpacing);
      setPanOffset(prev => Math.max(0, Math.min(displayCandles.length - 15, prev - deltaCandles)));
      setDragStartX(x);
      return;
    }

    const { globalIndex, candleIndexInView, padLeft, padRight, candleSpacing } = getCandleInfoAtMouse(x, rect);

    if (globalIndex >= 0 && globalIndex < displayCandles.length && x >= padLeft && x <= rect.width - padRight) {
      const snappedX = padLeft + candleIndexInView * candleSpacing + candleWidth / 2;
      setCrosshair({
        x: snappedX,
        y: Math.max(20, Math.min(rect.height - 30, y)),
        candle: displayCandles[globalIndex]
      });
    } else {
      setCrosshair(null);
    }
  };

  const handleMouseLeave = () => {
    setCrosshair(null);
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const { startIndex, globalIndex, padLeft, candleSpacing } = getCandleInfoAtMouse(x, rect);

    // Check SEBI filing click
    const maxVisible = Math.max(10, Math.floor((rect.width - padLeft - 74) / candleSpacing));
    for (const f of sebiFilings) {
      if (f.candleIndex >= startIndex && f.candleIndex < startIndex + maxVisible) {
        const localIdx = f.candleIndex - startIndex;
        const markerX = padLeft + localIdx * candleSpacing + candleWidth / 2;
        if (Math.abs(x - markerX) < 12 && y < 100) {
          setSelectedFiling(f);
          return;
        }
      }
    }

    // Drawing tool click
    if (activeDrawingTool !== 'none' && globalIndex >= 0 && globalIndex < displayCandles.length) {
      const priceAtY = getPriceAtY(y, canvas);

      if (activeDrawingTool === 'horizontal') {
        const newDrawing: DrawingObject = {
          id: `draw-${Date.now()}`, type: 'horizontal', color: '#2962ff',
          points: [{ x, y, price: priceAtY, candleIdx: globalIndex }]
        };
        setDrawings(prev => [...prev, newDrawing]);
        setActiveDrawingTool('none');
        return;
      }

      if (!pendingDrawing) {
        setPendingDrawing({
          id: `draw-${Date.now()}`, type: activeDrawingTool, color: '#2962ff',
          points: [{ x, y, price: priceAtY, candleIdx: globalIndex }]
        });
      } else {
        const completed = {
          ...pendingDrawing,
          points: [...pendingDrawing.points, { x, y, price: priceAtY, candleIdx: globalIndex }]
        };
        setDrawings(prev => [...prev, completed]);
        setPendingDrawing(null);
        setActiveDrawingTool('none');
      }
      return;
    }

    setIsDragging(true);
    setDragStartX(x);
  };

  const handleMouseUp = () => { setIsDragging(false); };

  const getPriceAtY = (mouseY: number, canvas: HTMLCanvasElement): number => {
    const rect = canvas.getBoundingClientRect();
    const padTop = 28;
    const subPanelCount = (showRSI ? 1 : 0) + (showMACD ? 1 : 0) + (showStochastic ? 1 : 0);
    const subPanelH = subPanelCount > 0 ? Math.min(75, Math.floor((rect.height * 0.25) / subPanelCount)) : 0;
    const volumeH = showVolume ? 50 : 0;
    const subPanelGap = subPanelCount > 0 ? 8 : 0;
    const totalH = rect.height - padTop - 28;
    const priceH = totalH - volumeH - subPanelH * subPanelCount - subPanelGap * subPanelCount - 10;

    const candleSpacing = candleWidth + 5;
    const maxVisible = Math.max(10, Math.floor((rect.width - 12 - 74) / candleSpacing));
    const startIndex = Math.max(0, displayCandles.length - maxVisible - panOffset);
    const endIndex = Math.min(displayCandles.length, startIndex + maxVisible);
    const visibleCandles = displayCandles.slice(startIndex, endIndex);

    let minPrice = Math.min(...visibleCandles.map(c => c.low));
    let maxPrice = Math.max(...visibleCandles.map(c => c.high));
    const rawRange = maxPrice - minPrice || 1;
    minPrice -= rawRange * 0.12;
    maxPrice += rawRange * 0.12;

    return minPrice + (1 - (mouseY - padTop) / priceH) * (maxPrice - minPrice);
  };

  const handleResetZoom = () => { setCandleWidth(11); setPanOffset(0); };

  const handleScreenshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `SanchayX_${ticker}_${timeframe}_${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // ══════════════════════════════════════════════════════════════════════════
  // KEYBOARD SHORTCUTS (when fullscreen)
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isFullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
      if (e.key === 'r' || e.key === 'R') handleResetZoom();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isFullscreen]);

  // Chart type labels
  const chartTypeLabels: Record<ChartType, string> = {
    candles: 'Candlestick',
    heikin_ashi: 'Heikin-Ashi',
    hollow: 'Hollow Candles',
    ohlc_bars: 'OHLC Bars',
    line: 'Line',
    area: 'Area',
    baseline: 'Baseline'
  };

  const chartHeight = isFullscreen ? 'flex-1 w-full min-h-0' : 'h-[480px] w-full';

  // ══════════════════════════════════════════════════════════════════════════
  // JSX RENDER (Rendered via React Portal when Fullscreen to avoid parent CSS trapping)
  // ══════════════════════════════════════════════════════════════════════════
  const chartElement = (
    <div
      ref={containerRef}
      className={`bg-[#131722] font-sans flex flex-col ${
        isFullscreen
          ? 'fixed inset-0 z-[999999] w-screen h-screen p-3 sm:p-5 select-none animate-in fade-in duration-150 shadow-2xl'
          : 'relative rounded-2xl border border-[#1e222d] shadow-2xl overflow-hidden'
      } ${className}`}
    >
      {/* ════════ TOP HEADER BAR ════════ */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#131722] border-b border-[#1e222d] text-xs shrink-0">
        {/* Left: Security Info, 20-Year Statistics & OHLC Readout */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2">
            <span className="font-black text-white text-sm tracking-wide">{ticker}</span>

            {/* 20-Year Historical Anchors (CAGR, Valuation, 200-DMA) */}
            {stockMeta && (
              <div className="hidden md:flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#1e222d] text-emerald-400 border border-emerald-500/20" title="20-Year Historical Compound Annual Growth Rate (2004-2024)">
                  20Y CAGR {stockMeta.cagr20yr}%
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                  stockMeta.valuation === 'UNDERVALUED'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : stockMeta.valuation === 'OVERVALUED'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`} title="SEBI Valuation Sentinel Status">
                  {stockMeta.valuation}
                </span>
                <span className="text-[10px] text-[#787b86] font-mono hidden lg:inline">
                  • 200-DMA: ₹{stockMeta.dma200.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                </span>
              </div>
            )}

            {/* Chart Type Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => { setShowChartTypeMenu(!showChartTypeMenu); setShowIndicatorPanel(false); }}
                className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1e222d] text-blue-400 hover:text-white transition-all cursor-pointer flex items-center gap-1"
              >
                {chartTypeLabels[chartType]}
                <span className="text-[8px]">▼</span>
              </button>
              {showChartTypeMenu && (
                <div className="absolute top-full left-0 mt-1 bg-[#1e222d] border border-[#2a2e39] rounded-xl shadow-2xl z-50 w-44 py-1 animate-in fade-in duration-100">
                  {(Object.keys(chartTypeLabels) as ChartType[]).map(ct => (
                    <button
                      key={ct}
                      type="button"
                      onClick={() => { setChartType(ct); setShowChartTypeMenu(false); }}
                      className={`w-full text-left px-3 py-1.5 text-[11px] font-mono transition-all cursor-pointer ${
                        chartType === ct ? 'text-blue-400 bg-blue-500/10 font-bold' : 'text-[#787b86] hover:text-white hover:bg-[#2a2e39]'
                      }`}
                    >
                      {chartTypeLabels[ct]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1e222d] text-blue-400 font-bold">{timeframe}</span>
            <span className="text-[10px] text-[#787b86] font-mono">{exchange}</span>

            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#1e222d] font-mono text-[11px]">
              <span className="text-[#787b86]">LTP:</span>
              <span className={`font-bold ${tickDirection === 'UP' ? 'text-[#089981]' : tickDirection === 'DOWN' ? 'text-[#f23645]' : 'text-white'}`}>
                {currency}{liveLtp.toFixed(2)}
              </span>
              <span className={`w-2 h-2 rounded-full ${tickDirection === 'UP' ? 'bg-[#089981] animate-ping' : tickDirection === 'DOWN' ? 'bg-[#f23645] animate-ping' : 'bg-blue-400'}`} />
            </div>
          </div>

          {/* OHLC readout */}
          {activeCandle && (
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
              <span className="text-[#787b86]">O: <strong className="text-white">{currency}{activeCandle.open.toFixed(2)}</strong></span>
              <span className="text-[#787b86]">H: <strong className="text-white">{currency}{activeCandle.high.toFixed(2)}</strong></span>
              <span className="text-[#787b86]">L: <strong className="text-white">{currency}{activeCandle.low.toFixed(2)}</strong></span>
              <span className="text-[#787b86]">C: <strong className={candleChangeAmount >= 0 ? 'text-[#089981]' : 'text-[#f23645]'}>{currency}{activeCandle.close.toFixed(2)}</strong></span>
              <span className={`font-black ${candleChangeAmount >= 0 ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                {candleChangeAmount >= 0 ? `+${currency}${candleChangeAmount.toFixed(2)}` : `-${currency}${Math.abs(candleChangeAmount).toFixed(2)}`}
                ({candleChangePct >= 0 ? `+${candleChangePct.toFixed(2)}%` : `${candleChangePct.toFixed(2)}%`})
              </span>
              <span className="text-[#787b86] hidden sm:inline">Vol: <strong className="text-white">{(activeCandle.volume / 1000).toFixed(1)}K</strong></span>
            </div>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5">
          {/* Timeframe pills */}
          <div className="flex items-center bg-[#1e222d] p-0.5 rounded-lg">
            {(['1m', '3m', '5m', '15m', '30m', '1h', '4h', '1D', '1W'] as ChartTimeframe[]).map(tf => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  timeframe === tf ? 'bg-[#2962ff] text-white shadow-xs' : 'text-[#787b86] hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Indicators dropdown trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setShowIndicatorPanel(!showIndicatorPanel); setShowChartTypeMenu(false); }}
              className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                showIndicatorPanel ? 'bg-blue-600 text-white' : 'bg-[#1e222d] text-[#787b86] hover:text-white'
              }`}
            >
              Indicators ▼
            </button>

            {showIndicatorPanel && (
              <div className="absolute top-full right-0 mt-1 bg-[#1e222d] border border-[#2a2e39] rounded-xl shadow-2xl z-50 w-56 p-3 space-y-2 animate-in fade-in duration-100">
                <p className="text-[9px] uppercase font-black text-[#787b86] tracking-wider">Overlay Indicators</p>
                {[
                  { key: 'ema9', label: 'EMA 9', color: '#e91e63', state: showEMA9, setter: setShowEMA9 },
                  { key: 'ema20', label: 'EMA 20', color: '#ff9800', state: showEMA20, setter: setShowEMA20 },
                  { key: 'ema50', label: 'EMA 50', color: '#2962ff', state: showEMA50, setter: setShowEMA50 },
                  { key: 'ema200', label: 'EMA 200', color: '#00bcd4', state: showEMA200, setter: setShowEMA200 },
                  { key: 'sma20', label: 'SMA 20', color: '#9c27b0', state: showSMA20, setter: setShowSMA20 },
                  { key: 'vwap', label: 'VWAP', color: '#ab47bc', state: showVWAP, setter: setShowVWAP },
                  { key: 'bb', label: 'Bollinger Bands', color: '#00e5ff', state: showBollinger, setter: setShowBollinger },
                  { key: 'st', label: 'Supertrend', color: '#089981', state: showSupertrend, setter: setShowSupertrend },
                  { key: 'pp', label: 'Pivot Points', color: '#fbbf24', state: showPivots, setter: setShowPivots },
                ].map(ind => (
                  <button
                    key={ind.key}
                    type="button"
                    onClick={() => ind.setter(!ind.state)}
                    className={`w-full flex items-center justify-between px-2 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      ind.state ? 'bg-white/5' : 'hover:bg-white/5'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ind.state ? ind.color : '#3a3e49' }} />
                      <span className={ind.state ? 'text-white' : 'text-[#787b86]'}>{ind.label}</span>
                    </span>
                    <span className={`text-[9px] ${ind.state ? 'text-[#089981]' : 'text-[#787b86]'}`}>{ind.state ? 'ON' : 'OFF'}</span>
                  </button>
                ))}

                <p className="text-[9px] uppercase font-black text-[#787b86] tracking-wider pt-2">Sub-Panel Oscillators</p>
                {[
                  { key: 'rsi', label: 'RSI (14)', color: '#a855f7', state: showRSI, setter: setShowRSI },
                  { key: 'macd', label: 'MACD (12,26,9)', color: '#2962ff', state: showMACD, setter: setShowMACD },
                  { key: 'stoch', label: 'Stochastic (14,3)', color: '#ff9800', state: showStochastic, setter: setShowStochastic },
                ].map(ind => (
                  <button
                    key={ind.key}
                    type="button"
                    onClick={() => ind.setter(!ind.state)}
                    className={`w-full flex items-center justify-between px-2 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      ind.state ? 'bg-white/5' : 'hover:bg-white/5'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ind.state ? ind.color : '#3a3e49' }} />
                      <span className={ind.state ? 'text-white' : 'text-[#787b86]'}>{ind.label}</span>
                    </span>
                    <span className={`text-[9px] ${ind.state ? 'text-[#089981]' : 'text-[#787b86]'}`}>{ind.state ? 'ON' : 'OFF'}</span>
                  </button>
                ))}

                <p className="text-[9px] uppercase font-black text-[#787b86] tracking-wider pt-2">Overlays</p>
                {[
                  { key: 'signals', label: 'BUY/SELL Signals', state: showSignals, setter: setShowSignals },
                  { key: 'sebi', label: 'SEBI Filings', state: showSebiFilings, setter: setShowSebiFilings },
                  { key: 'volume', label: 'Volume Bars', state: showVolume, setter: setShowVolume },
                ].map(ind => (
                  <button
                    key={ind.key}
                    type="button"
                    onClick={() => ind.setter(!ind.state)}
                    className={`w-full flex items-center justify-between px-2 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      ind.state ? 'bg-white/5' : 'hover:bg-white/5'
                    }`}
                  >
                    <span className={ind.state ? 'text-white' : 'text-[#787b86]'}>{ind.label}</span>
                    <span className={`text-[9px] ${ind.state ? 'text-[#089981]' : 'text-[#787b86]'}`}>{ind.state ? 'ON' : 'OFF'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Drawing Tools */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDrawingToolbar(!showDrawingToolbar)}
              className={`p-1 rounded transition-colors cursor-pointer ${
                showDrawingToolbar || activeDrawingTool !== 'none' ? 'text-blue-400 bg-blue-500/15' : 'text-[#787b86] hover:text-white hover:bg-[#1e222d]'
              }`}
              title="Drawing Tools"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>

            {showDrawingToolbar && (
              <div className="absolute top-full right-0 mt-1 bg-[#1e222d] border border-[#2a2e39] rounded-xl shadow-2xl z-50 w-48 p-2 space-y-1 animate-in fade-in duration-100">
                <p className="text-[9px] uppercase font-black text-[#787b86] tracking-wider pb-1">Drawing Tools</p>
                {[
                  { type: 'trendline' as DrawingToolType, label: 'Trend Line', icon: '╲' },
                  { type: 'horizontal' as DrawingToolType, label: 'Horizontal Ray', icon: '—' },
                  { type: 'fibonacci' as DrawingToolType, label: 'Fibonacci Retracement', icon: 'Fib' },
                  { type: 'rectangle' as DrawingToolType, label: 'Rectangle Zone', icon: '▭' },
                  { type: 'measure' as DrawingToolType, label: 'Measure Tool', icon: '↕' },
                ].map(tool => (
                  <button
                    key={tool.type}
                    type="button"
                    onClick={() => {
                      setActiveDrawingTool(activeDrawingTool === tool.type ? 'none' : tool.type);
                      setPendingDrawing(null);
                      setShowDrawingToolbar(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      activeDrawingTool === tool.type ? 'bg-blue-500/15 text-blue-400' : 'text-[#787b86] hover:text-white hover:bg-[#2a2e39]'
                    }`}
                  >
                    <span className="w-5 text-center">{tool.icon}</span>
                    <span>{tool.label}</span>
                  </button>
                ))}
                {drawings.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setDrawings([]); setShowDrawingToolbar(false); }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-[10px] font-mono font-bold text-[#f23645] hover:bg-[#2a2e39] transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear All Drawings ({drawings.length})</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Zoom Controls */}
          <button type="button" onClick={() => setCandleWidth(prev => Math.min(30, prev + 2))}
            className="p-1 rounded text-[#787b86] hover:text-white hover:bg-[#1e222d] transition-colors cursor-pointer" title="Zoom In">
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => setCandleWidth(prev => Math.max(4, prev - 2))}
            className="p-1 rounded text-[#787b86] hover:text-white hover:bg-[#1e222d] transition-colors cursor-pointer" title="Zoom Out">
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={handleResetZoom}
            title="Reset Zoom & Pan [R]"
            className="p-1 rounded text-[#787b86] hover:text-white hover:bg-[#1e222d] transition-colors cursor-pointer">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={handleScreenshot}
            title="Save Chart Screenshot"
            className="p-1 rounded text-[#787b86] hover:text-white hover:bg-[#1e222d] transition-colors cursor-pointer">
            <Camera className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isFullscreen
                ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/40'
                : 'bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 border border-blue-500/30'
            }`}
            title={isFullscreen ? 'Exit Fullscreen Mode [Esc]' : 'Expand Chart to Institutional Fullscreen Mode [Esc to exit]'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="font-mono text-[11px] text-rose-400 font-bold">Exit Fullscreen [Esc]</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-mono text-[11px] text-blue-400 font-bold">Expand</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Active Drawing Tool Indicator */}
      {activeDrawingTool !== 'none' && (
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-600/10 border-b border-blue-500/20 text-[10px] font-mono text-blue-400">
          <Crosshair className="w-3 h-3" />
          <span>Active: <strong>{activeDrawingTool.replace('_', ' ').toUpperCase()}</strong> — Click points on chart to place. Press ESC or select again to cancel.</span>
          <button type="button" onClick={() => { setActiveDrawingTool('none'); setPendingDrawing(null); }}
            className="ml-auto text-[#787b86] hover:text-white cursor-pointer">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* ════════ MAIN INTERACTIVE CANVAS ════════ */}
      <div className={`relative w-full ${chartHeight} bg-[#131722] ${activeDrawingTool !== 'none' ? 'cursor-crosshair' : 'cursor-crosshair'}`}>
        <canvas
          ref={canvasRef}
          className="w-full h-full block select-none"
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />

        {/* Floating Brand Badge */}
        <div className="absolute bottom-2 left-3 pointer-events-none text-[9px] font-mono text-[#787b86]/70 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#089981] animate-ping" />
          <span>SanchayX Institutional Engine • 5 Hz Real-Time • {displayCandles.length} Bars</span>
        </div>

        {/* Fullscreen hotkey legend */}
        {isFullscreen && (
          <div className="absolute top-2 right-4 pointer-events-none text-[10px] font-mono text-emerald-400/80 bg-[#131722]/80 px-2 py-0.5 rounded border border-emerald-500/20">
            Esc or Expand button to exit fullscreen • Mouse wheel to zoom
          </div>
        )}
      </div>

      {/* ════════ SEBI Corporate Filing Modal ════════ */}
      {selectedFiling && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#1e222d] border border-blue-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-white">
            <div className="flex items-start justify-between border-b border-[#2a2e39] pb-3">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-black bg-blue-500/20 text-blue-400">
                  {selectedFiling.regSection}
                </span>
                <h3 className="text-base font-extrabold text-white">{selectedFiling.title}</h3>
                <p className="text-xs text-[#787b86] font-mono">
                  Date: {selectedFiling.date} • Impact: {selectedFiling.impact}
                </p>
              </div>
              <button type="button" onClick={() => setSelectedFiling(null)}
                className="p-1.5 rounded-full text-[#787b86] hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{selectedFiling.details}</p>
            <div className="p-3 rounded-xl bg-[#131722] border border-[#2a2e39] space-y-1 text-xs font-mono">
              <div className="flex justify-between text-[#787b86]">
                <span>Reporting Entity:</span>
                <strong className="text-white">{selectedFiling.promoterOrEntity}</strong>
              </div>
              {selectedFiling.changePct && (
                <div className="flex justify-between text-[#787b86]">
                  <span>Quantitative Impact:</span>
                  <strong className="text-[#089981]">{selectedFiling.changePct}</strong>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <button type="button" onClick={() => setSelectedFiling(null)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer shadow-md transition-all">
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isFullscreen && typeof document !== 'undefined') {
    return createPortal(chartElement, document.body);
  }

  return chartElement;
};

// Helper to draw a line series on the canvas
function drawLineSeries(
  ctx: CanvasRenderingContext2D,
  visibleCandles: CandlestickBar[],
  startIndex: number,
  series: (number | null)[],
  color: string,
  lineWidth: number,
  padLeft: number,
  candleSpacing: number,
  candleWidth: number,
  getY: (price: number) => number
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  let started = false;
  visibleCandles.forEach((_, idx) => {
    const val = series[startIndex + idx];
    if (val !== null && val !== undefined) {
      const x = padLeft + idx * candleSpacing + candleWidth / 2;
      const y = getY(val);
      if (!started) { ctx.moveTo(x, y); started = true; }
      else ctx.lineTo(x, y);
    }
  });
  if (started) ctx.stroke();
}

export default TradingViewChart;
