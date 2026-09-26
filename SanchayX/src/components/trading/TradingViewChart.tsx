import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  X
} from 'lucide-react';
import { subscribeToTicker } from '../../context/TradingSimulationContext';

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

export type ChartTimeframe = '1m' | '5m' | '15m' | '1h' | '1D';

interface TradingViewChartProps {
  ticker: string;
  basePrice?: number;
  currency?: string;
  exchange?: string;
  className?: string;
}

// Deterministic baseline candle generator with realistic swing geometry (Images 1, 2, 3, 4)
function generateHistoricalCandles(ticker: string, basePrice: number, timeframe: ChartTimeframe, count: number = 65): CandlestickBar[] {
  const data: CandlestickBar[] = [];
  const targetPrice = Math.max(10, basePrice);
  const now = Date.now();
  const intervalMinutes = timeframe === '1m' ? 1 : timeframe === '5m' ? 5 : timeframe === '15m' ? 15 : timeframe === '1h' ? 60 : 1440;
  const intervalMs = intervalMinutes * 60 * 1000;

  // Stable seed from ticker
  let seed = 0;
  for (let i = 0; i < ticker.length; i++) {
    seed = (seed * 31 + ticker.charCodeAt(i)) % 10000;
  }
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  // Base volatility per candle (0.35% to 0.7% of target price)
  const baseVol = targetPrice * (timeframe === '1D' ? 0.012 : timeframe === '1h' ? 0.007 : 0.0045);

  // Generate smooth historical swing price points anchored backward from targetPrice
  const closes: number[] = [];
  let p = targetPrice;
  closes.unshift(p);

  for (let i = 1; i < count; i++) {
    // Natural swing wave (creates double bottoms, channels, and trend cycles like in user reference images)
    const wave = Math.sin((i / count) * Math.PI * 3.5) * baseVol * 1.1;
    const noise = (rand() - 0.49) * baseVol * 1.4;
    p = Math.max(targetPrice * 0.4, p - (wave + noise));
    closes.unshift(p);
  }

  // Build authentic candlesticks with correct Open, High, Low, Close, Volume
  for (let i = 0; i < count; i++) {
    const timeMs = now - (count - 1 - i) * intervalMs;
    const dateObj = new Date(timeMs);
    const timeStr = timeframe === '1D'
      ? dateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
      : dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

    // Open from previous candle's close
    const open = i === 0 ? Math.round(closes[0] * 100) / 100 : data[i - 1].close;
    const close = Math.round(closes[i] * 100) / 100;

    const bodySpread = Math.abs(close - open);
    const candleVol = Math.max(baseVol * 0.4, bodySpread * 0.7);

    // Realistic upper and lower wicks (10% to 50% of candle volatility)
    const upperWick = (rand() * 0.45 + 0.08) * candleVol;
    const lowerWick = (rand() * 0.45 + 0.08) * candleVol;

    // Guaranteed strictly: low < min(open, close) <= max(open, close) < high
    const high = Math.round((Math.max(open, close) + upperWick) * 100) / 100;
    const low = Math.round((Math.max(0.1, Math.min(open, close) - lowerWick)) * 100) / 100;
    const volume = Math.floor(8000 + rand() * 48000);

    data.push({
      time: timeStr,
      timestamp: timeMs,
      open,
      high,
      low,
      close,
      volume
    });
  }

  return data;
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
  ticker,
  basePrice = 2458.50,
  currency = '₹',
  exchange = 'NSE',
  className = ''
}) => {
  const [timeframe, setTimeframe] = useState<ChartTimeframe>('5m');
  const [candles, setCandles] = useState<CandlestickBar[]>(() =>
    generateHistoricalCandles(ticker, basePrice, '5m')
  );
  const [liveLtp, setLiveLtp] = useState<number>(() => {
    const init = generateHistoricalCandles(ticker, basePrice, '5m');
    return init.length > 0 ? init[init.length - 1].close : basePrice;
  });
  const [tickDirection, setTickDirection] = useState<'UP' | 'DOWN' | 'FLAT'>('FLAT');

  // Indicators toggle
  const [showEMA20, setShowEMA20] = useState<boolean>(true);
  const [showEMA50, setShowEMA50] = useState<boolean>(true);
  const [showVWAP, setShowVWAP] = useState<boolean>(false);
  const [showBollinger, setShowBollinger] = useState<boolean>(false);
  const [showSignals, setShowSignals] = useState<boolean>(true); // BUY & SELL tags from Image 2
  const [showRSI, setShowRSI] = useState<boolean>(false);         // RSI sub-panel from Image 4
  const [showSebiFilings, setShowSebiFilings] = useState<boolean>(true);
  const [selectedFiling, setSelectedFiling] = useState<SebiFilingMarker | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Zoom & Pan state (comfortable 11px default candle width)
  const [candleWidth, setCandleWidth] = useState<number>(11);
  const [panOffset, setPanOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStartX, setDragStartX] = useState<number>(0);

  // Mouse crosshair coordinate snapping
  const [crosshair, setCrosshair] = useState<{ x: number; y: number; candle: CandlestickBar | null } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Regenerate history on ticker, basePrice, or timeframe change
  useEffect(() => {
    const fresh = generateHistoricalCandles(ticker, basePrice, timeframe);
    setCandles(fresh);
    const lastClose = fresh.length > 0 ? fresh[fresh.length - 1].close : basePrice;
    setLiveLtp(lastClose);
    setPanOffset(0);
  }, [ticker, basePrice, timeframe]);

  // Connect to 5 Hz live tick stream
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
            return generateHistoricalCandles(ticker, price, timeframe);
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
  }, [ticker]);

  // Generate SEBI corporate filing markers
  const sebiFilings: SebiFilingMarker[] = useMemo(() => {
    if (candles.length < 20) return [];
    return [
      {
        id: `${ticker}-DIV`,
        candleIndex: Math.floor(candles.length * 0.25),
        type: 'DIVIDEND',
        badge: 'D',
        title: 'Interim Dividend Entitlement',
        regSection: 'SEBI (LODR) Reg 43',
        date: '18 Sep 2026',
        details: 'Declared Interim Dividend of ₹16.50/share. Depository record entitlement active.',
        promoterOrEntity: 'Board Audit Committee',
        impact: 'Bullish',
        changePct: '+2.8% Dividend Yield'
      },
      {
        id: `${ticker}-SAST`,
        candleIndex: Math.floor(candles.length * 0.58),
        type: 'SAST_INSIDER',
        badge: 'S',
        title: 'SEBI SAST Reg 29(2) Promoter Stake Addition',
        regSection: 'SEBI SAST Reg 29(2)',
        date: '19 Sep 2026',
        details: 'Promoter family acquired 145,000 equity shares in open market. Zero pledge encumbrance.',
        promoterOrEntity: 'Promoter Family Trust',
        impact: 'Bullish',
        changePct: '+0.22% Net Stake'
      },
      {
        id: `${ticker}-EARN`,
        candleIndex: Math.floor(candles.length * 0.85),
        type: 'EARNINGS',
        badge: 'E',
        title: 'Q3 Financial Earnings Beat',
        regSection: 'SEBI (LODR) Reg 33',
        date: '20 Sep 2026',
        details: 'PAT expanded 18.6% YoY with EBITDA margins widening 95 bps.',
        promoterOrEntity: 'CFO & Statutory Auditors',
        impact: 'Bullish',
        changePct: '+18.6% PAT Growth'
      }
    ];
  }, [ticker, candles.length]);

  // Calculate BUY & SELL Swing Signals (Image 2)
  const tradeSignals: TradeSignal[] = useMemo(() => {
    if (candles.length < 10) return [];
    const signals: TradeSignal[] = [];
    let lastSignalIdx = -10;

    for (let i = 3; i < candles.length - 2; i++) {
      if (i - lastSignalIdx < 5) continue;

      const c = candles[i];
      // Swing Low (local trough) -> BUY signal
      const isSwingLow =
        c.low <= candles[i - 1].low &&
        c.low <= candles[i - 2].low &&
        c.low < candles[i + 1].low &&
        c.low < candles[i + 2].low;

      // Swing High (local peak) -> SELL signal
      const isSwingHigh =
        c.high >= candles[i - 1].high &&
        c.high >= candles[i - 2].high &&
        c.high > candles[i + 1].high &&
        c.high > candles[i + 2].high;

      if (isSwingLow) {
        signals.push({ candleIndex: i, type: 'BUY', price: c.low });
        lastSignalIdx = i;
      } else if (isSwingHigh) {
        signals.push({ candleIndex: i, type: 'SELL', price: c.high });
        lastSignalIdx = i;
      }
    }
    return signals;
  }, [candles]);

  // Indicator Calculations: EMA 20, EMA 50, VWAP, Bollinger Bands, RSI
  const ema20 = useMemo(() => {
    const k = 2 / (20 + 1);
    const series: (number | null)[] = [];
    let prev = candles[0]?.close || 0;
    for (let i = 0; i < candles.length; i++) {
      if (i < 19) series.push(null);
      else if (i === 19) {
        prev = candles.slice(0, 20).reduce((a, c) => a + c.close, 0) / 20;
        series.push(prev);
      } else {
        prev = candles[i].close * k + prev * (1 - k);
        series.push(prev);
      }
    }
    return series;
  }, [candles]);

  const ema50 = useMemo(() => {
    const k = 2 / (50 + 1);
    const series: (number | null)[] = [];
    let prev = candles[0]?.close || 0;
    for (let i = 0; i < candles.length; i++) {
      if (i < 49) series.push(null);
      else if (i === 49) {
        prev = candles.slice(0, 50).reduce((a, c) => a + c.close, 0) / 50;
        series.push(prev);
      } else {
        prev = candles[i].close * k + prev * (1 - k);
        series.push(prev);
      }
    }
    return series;
  }, [candles]);

  const vwapSeries = useMemo(() => {
    let sumTPV = 0;
    let sumVol = 0;
    return candles.map(c => {
      const tp = (c.high + c.low + c.close) / 3;
      sumTPV += tp * c.volume;
      sumVol += c.volume;
      return sumVol > 0 ? sumTPV / sumVol : c.close;
    });
  }, [candles]);

  const bollingerBands = useMemo(() => {
    const period = 20;
    const upper: (number | null)[] = [];
    const lower: (number | null)[] = [];

    for (let i = 0; i < candles.length; i++) {
      if (i < period - 1) {
        upper.push(null);
        lower.push(null);
      } else {
        const slice = candles.slice(i - period + 1, i + 1).map(c => c.close);
        const mean = slice.reduce((a, b) => a + b, 0) / period;
        const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
        const stdDev = Math.sqrt(variance);
        upper.push(mean + stdDev * 2);
        lower.push(mean - stdDev * 2);
      }
    }
    return { upper, lower };
  }, [candles]);

  const rsiSeries = useMemo(() => {
    const period = 14;
    const rsi: (number | null)[] = [];
    if (candles.length <= period) return candles.map(() => null);

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const diff = candles[i].close - candles[i - 1].close;
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;
    let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi.push(...Array(period).fill(null));
    rsi.push(100 - 100 / (1 + rs));

    for (let i = period + 1; i < candles.length; i++) {
      const diff = candles[i].close - candles[i - 1].close;
      if (diff >= 0) {
        avgGain = (avgGain * (period - 1) + diff) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) - diff) / period;
      }
      rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi.push(100 - 100 / (1 + rs));
    }
    return rsi;
  }, [candles]);

  // Active or Hovered Candle for the Top OHLC Readout Header
  const activeCandle = crosshair?.candle || candles[candles.length - 1] || null;
  const candleChangeAmount = activeCandle ? activeCandle.close - activeCandle.open : 0;
  const candleChangePct = activeCandle && activeCandle.open > 0 ? (candleChangeAmount / activeCandle.open) * 100 : 0;

  // TradingView High-Fidelity Canvas Rendering Loop
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

    // TradingView Dark Canvas Theme
    const bgDark = '#131722';
    const gridColor = '#1e222d';
    const textMuted = '#787b86';
    const tealBullish = '#089981'; // Classic vibrant bullish green/teal
    const redBearish = '#f23645';  // Classic vibrant bearish crimson red

    ctx.fillStyle = bgDark;
    ctx.fillRect(0, 0, width, height);

    // Margins & Modular Layout
    const padTop = 26;
    const padBottom = 26;
    const padRight = 72; // Dedicated right price scale
    const padLeft = 10;
    const chartW = width - padLeft - padRight;
    const totalH = height - padTop - padBottom;

    // Split vertical space: Main Price (top), Volume (bottom), optional RSI (middle/bottom)
    const rsiH = showRSI ? 65 : 0;
    const volumeH = 50;
    const priceH = totalH - volumeH - (showRSI ? rsiH + 12 : 0) - 10;

    // Visible slice of candles based on zoom & pan
    const candleSpacing = candleWidth + 5;
    const maxVisibleCandles = Math.max(10, Math.floor(chartW / candleSpacing));
    const startIndex = Math.max(0, candles.length - maxVisibleCandles - panOffset);
    const endIndex = Math.min(candles.length, startIndex + maxVisibleCandles);
    const visibleCandles = candles.slice(startIndex, endIndex);

    if (visibleCandles.length === 0) return;

    // Min and max price within visible slice with 14% vertical breathing room
    let minPrice = Math.min(...visibleCandles.map(c => c.low));
    let maxPrice = Math.max(...visibleCandles.map(c => c.high));
    const rawRange = maxPrice - minPrice || 1;
    minPrice -= rawRange * 0.12;
    maxPrice += rawRange * 0.12;

    const maxVolume = Math.max(...visibleCandles.map(c => c.volume), 1);

    // Coordinate converters
    const getY = (price: number) => {
      return padTop + (1 - (price - minPrice) / (maxPrice - minPrice)) * priceH;
    };

    // 1. Draw Coordinate Grid & Right Price Scale
    const priceSteps = 6;
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);

    for (let i = 0; i <= priceSteps; i++) {
      const p = minPrice + ((maxPrice - minPrice) / priceSteps) * i;
      const y = getY(p);

      // Horizontal grid line
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();

      // Right Y-axis tick label
      ctx.fillStyle = textMuted;
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(p.toFixed(2), width - padRight + 8, y + 3.5);
    }
    ctx.setLineDash([]);

    // Vertical right scale boundary line
    ctx.strokeStyle = '#2a2e39';
    ctx.beginPath();
    ctx.moveTo(width - padRight, 0);
    ctx.lineTo(width - padRight, height);
    ctx.stroke();

    // 2. Draw Horizontal Support & Resistance Channel Bands (Image 1)
    const peakHigh = Math.max(...visibleCandles.map(c => c.high));
    const troughLow = Math.min(...visibleCandles.map(c => c.low));
    const yRes = getY(peakHigh);
    const ySup = getY(troughLow);

    ctx.fillStyle = 'rgba(56, 189, 248, 0.10)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1;
    ctx.fillRect(padLeft, yRes - 3, chartW, 6);
    ctx.strokeRect(padLeft, yRes - 3, chartW, 6);

    ctx.fillStyle = 'rgba(56, 189, 248, 0.10)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.fillRect(padLeft, ySup - 3, chartW, 6);
    ctx.strokeRect(padLeft, ySup - 3, chartW, 6);

    // 3. Draw Technical Overlay Indicators: Bollinger Bands, EMA 20, EMA 50, VWAP (Image 4)
    const drawLineSeries = (series: (number | null)[], color: string, lineWidth: number = 1.8) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      let started = false;

      visibleCandles.forEach((_, idx) => {
        const globalIdx = startIndex + idx;
        const val = series[globalIdx];
        if (val !== null && val !== undefined) {
          const x = padLeft + idx * candleSpacing + candleWidth / 2;
          const y = getY(val);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      });
      if (started) ctx.stroke();
    };

    // Bollinger Bands
    if (showBollinger) {
      drawLineSeries(bollingerBands.upper, '#00e5ff', 1.2);
      drawLineSeries(bollingerBands.lower, '#00e5ff', 1.2);
    }

    if (showEMA20) drawLineSeries(ema20, '#ff9800', 1.8);
    if (showEMA50) drawLineSeries(ema50, '#2962ff', 1.8);
    if (showVWAP) drawLineSeries(vwapSeries, '#ab47bc', 1.8);

    // 4. Draw Standard High-Fidelity Candlesticks (Images 1, 2, 3, 4)
    visibleCandles.forEach((c, idx) => {
      const x = padLeft + idx * candleSpacing + candleWidth / 2;
      const yOpen = getY(c.open);
      const yClose = getY(c.close);
      const yHigh = getY(c.high);
      const yLow = getY(c.low);
      const isUp = c.close >= c.open;
      const candleColor = isUp ? tealBullish : redBearish;

      const bodyTop = Math.min(yOpen, yClose);
      const bodyBottom = Math.max(yOpen, yClose);
      const bodyHeight = Math.max(2.5, bodyBottom - bodyTop);

      ctx.strokeStyle = candleColor;
      ctx.lineWidth = 1.5;

      // Upper Wick (shadow) extending from top of real body up to High
      ctx.beginPath();
      ctx.moveTo(x, bodyTop);
      ctx.lineTo(x, yHigh);
      ctx.stroke();

      // Lower Wick (shadow) extending from bottom of real body down to Low
      ctx.beginPath();
      ctx.moveTo(x, bodyTop + bodyHeight);
      ctx.lineTo(x, yLow);
      ctx.stroke();

      // Solid Real Body with clean rectangular shape
      ctx.fillStyle = candleColor;
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);

      // Crisp border outline
      ctx.strokeRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    });

    // 5. Draw BUY & SELL Trade Signal Badges (Image 2)
    if (showSignals) {
      tradeSignals.forEach(sig => {
        if (sig.candleIndex >= startIndex && sig.candleIndex < endIndex) {
          const localIdx = sig.candleIndex - startIndex;
          const c = visibleCandles[localIdx];
          if (!c) return;

          const x = padLeft + localIdx * candleSpacing + candleWidth / 2;

          if (sig.type === 'BUY') {
            const y = getY(c.low) + 14;
            // Green Pill
            ctx.fillStyle = '#089981';
            ctx.beginPath();
            ctx.roundRect(x - 16, y, 32, 16, 4);
            ctx.fill();

            // Tiny upward pointer
            ctx.beginPath();
            ctx.moveTo(x - 4, y);
            ctx.lineTo(x + 4, y);
            ctx.lineTo(x, y - 4);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('BUY', x, y + 11.5);
          } else {
            const y = getY(c.high) - 20;
            // Red Pill
            ctx.fillStyle = '#f23645';
            ctx.beginPath();
            ctx.roundRect(x - 18, y, 36, 16, 4);
            ctx.fill();

            // Tiny downward pointer
            ctx.beginPath();
            ctx.moveTo(x - 4, y + 16);
            ctx.lineTo(x + 4, y + 16);
            ctx.lineTo(x, y + 20);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('SELL', x, y + 11.5);
          }
        }
      });
    }

    // 6. Draw SEBI Corporate Filings Flags
    if (showSebiFilings) {
      sebiFilings.forEach(f => {
        if (f.candleIndex >= startIndex && f.candleIndex < endIndex) {
          const localIdx = f.candleIndex - startIndex;
          const c = visibleCandles[localIdx];
          if (!c) return;

          const x = padLeft + localIdx * candleSpacing + candleWidth / 2;
          const y = getY(c.high) - 24;

          ctx.beginPath();
          ctx.arc(x, y, 7.5, 0, Math.PI * 2);
          ctx.fillStyle = f.type === 'EARNINGS' ? '#10b981' : f.type === 'DIVIDEND' ? '#06b6d4' : '#f59e0b';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(f.badge, x, y + 3.2);
        }
      });
    }

    // 7. Draw RSI Sub-Panel (Image 4)
    if (showRSI) {
      const rsiTop = padTop + priceH + 12;
      ctx.fillStyle = '#11141c';
      ctx.fillRect(padLeft, rsiTop, chartW, rsiH);
      ctx.strokeStyle = '#2a2e39';
      ctx.strokeRect(padLeft, rsiTop, chartW, rsiH);

      // 70 and 30 Overbought/Oversold lines
      const y70 = rsiTop + rsiH * 0.30;
      const y30 = rsiTop + rsiH * 0.70;

      ctx.strokeStyle = '#475569';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(padLeft, y70);
      ctx.lineTo(padLeft + chartW, y70);
      ctx.moveTo(padLeft, y30);
      ctx.lineTo(padLeft + chartW, y30);
      ctx.stroke();
      ctx.setLineDash([]);

      // RSI labels on right scale
      ctx.fillStyle = textMuted;
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillText('70', width - padRight + 6, y70 + 3);
      ctx.fillText('30', width - padRight + 6, y30 + 3);

      // Draw RSI line
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let startedRsi = false;

      visibleCandles.forEach((_, idx) => {
        const globalIdx = startIndex + idx;
        const val = rsiSeries[globalIdx];
        if (val !== null && val !== undefined) {
          const x = padLeft + idx * candleSpacing + candleWidth / 2;
          const y = rsiTop + (1 - val / 100) * rsiH;
          if (!startedRsi) {
            ctx.moveTo(x, y);
            startedRsi = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      });
      if (startedRsi) ctx.stroke();

      const latestRsi = rsiSeries[rsiSeries.length - 1];
      ctx.fillStyle = '#a855f7';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.fillText(`RSI (14): ${latestRsi ? latestRsi.toFixed(1) : '--'}`, padLeft + 6, rsiTop + 12);
    }

    // 8. Draw Volume Histogram in Lower 50px Lane (Image 4)
    const volTop = height - padBottom - volumeH;
    ctx.strokeStyle = '#222631';
    ctx.beginPath();
    ctx.moveTo(padLeft, volTop);
    ctx.lineTo(padLeft + chartW, volTop);
    ctx.stroke();

    visibleCandles.forEach((c, idx) => {
      const x = padLeft + idx * candleSpacing + candleWidth / 2;
      const vH = (c.volume / maxVolume) * (volumeH - 8);
      const y = height - padBottom - vH;
      const isUp = c.close >= c.open;

      ctx.fillStyle = isUp ? 'rgba(8, 153, 129, 0.70)' : 'rgba(242, 54, 69, 0.70)';
      ctx.fillRect(x - candleWidth / 2, y, candleWidth, Math.max(1, vH));
    });

    // 9. Right Y-Axis Pulsing Live LTP Tag
    const latestCandle = candles[candles.length - 1];
    if (latestCandle) {
      const ltpY = getY(latestCandle.close);
      const isUp = latestCandle.close >= latestCandle.open;
      const tagBg = isUp ? tealBullish : redBearish;

      ctx.strokeStyle = tagBg;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(padLeft, ltpY);
      ctx.lineTo(width - padRight, ltpY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = tagBg;
      const pillH = 18;
      const pillW = 66;
      ctx.beginPath();
      ctx.roundRect(width - padRight + 3, ltpY - pillH / 2, pillW, pillH, 4);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10.5px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(latestCandle.close.toFixed(2), width - padRight + 3 + pillW / 2, ltpY + 3.5);
    }

    // 10. Dynamic Mouse Crosshair with Coordinate Snapping
    if (crosshair && crosshair.candle) {
      const cx = crosshair.x;
      const cy = crosshair.y;

      ctx.strokeStyle = '#787b86';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      // Vertical crosshair
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, height - padBottom);
      ctx.stroke();

      // Horizontal crosshair
      ctx.beginPath();
      ctx.moveTo(padLeft, cy);
      ctx.lineTo(width - padRight, cy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Price Tag on Right Y-Axis at mouse Y
      const crossPrice = minPrice + (1 - (cy - padTop) / priceH) * (maxPrice - minPrice);
      ctx.fillStyle = '#2962ff';
      ctx.beginPath();
      ctx.roundRect(width - padRight + 3, cy - 9, 66, 18, 4);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(crossPrice.toFixed(2), width - padRight + 3 + 33, cy + 3.5);

      // Time Tag on Bottom X-Axis
      ctx.fillStyle = '#363a45';
      ctx.beginPath();
      ctx.roundRect(cx - 32, height - padBottom + 2, 64, 16, 4);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(crosshair.candle.time, cx, height - padBottom + 13);
    }

    // 11. Bottom X-Axis Time Labels
    const timeStep = Math.max(1, Math.floor(visibleCandles.length / 6));
    ctx.fillStyle = textMuted;
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';

    visibleCandles.forEach((c, idx) => {
      if (idx % timeStep === 0) {
        const x = padLeft + idx * candleSpacing + candleWidth / 2;
        ctx.fillText(c.time, x, height - 8);
      }
    });

  }, [candles, candleWidth, panOffset, crosshair, showEMA20, showEMA50, showVWAP, showBollinger, showSignals, showRSI, showSebiFilings, sebiFilings, tradeSignals, ema20, ema50, vwapSeries, bollingerBands, rsiSeries]);

  // Mouse move handler for crosshairs & pan
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
      setPanOffset(prev => Math.max(0, Math.min(candles.length - 15, prev - deltaCandles)));
      setDragStartX(x);
      return;
    }

    const padLeft = 10;
    const padRight = 72;
    const chartW = rect.width - padLeft - padRight;
    const candleSpacing = candleWidth + 5;
    const maxVisible = Math.max(10, Math.floor(chartW / candleSpacing));
    const startIndex = Math.max(0, candles.length - maxVisible - panOffset);

    const relativeX = x - padLeft;
    const candleIndexInView = Math.floor(relativeX / candleSpacing);
    const globalIndex = startIndex + candleIndexInView;

    if (globalIndex >= 0 && globalIndex < candles.length && x >= padLeft && x <= rect.width - padRight) {
      const snappedX = padLeft + candleIndexInView * candleSpacing + candleWidth / 2;
      setCrosshair({
        x: snappedX,
        y: Math.max(20, Math.min(rect.height - 30, y)),
        candle: candles[globalIndex]
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

    const padLeft = 10;
    const padRight = 72;
    const chartW = rect.width - padLeft - padRight;
    const candleSpacing = candleWidth + 5;
    const maxVisible = Math.max(10, Math.floor(chartW / candleSpacing));
    const startIndex = Math.max(0, candles.length - maxVisible - panOffset);

    // Check if user clicked a SEBI filing marker
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

    setIsDragging(true);
    setDragStartX(x);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mouse wheel zoom in / zoom out
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setCandleWidth(prev => Math.min(26, prev + 1.2));
    } else {
      setCandleWidth(prev => Math.max(5, prev - 1.2));
    }
  };

  const handleResetZoom = () => {
    setCandleWidth(11);
    setPanOffset(0);
  };

  return (
    <div
      ref={containerRef}
      className={`relative rounded-2xl bg-[#131722] border border-[#1e222d] shadow-2xl overflow-hidden font-sans ${
        isFullscreen ? 'fixed inset-4 z-50 rounded-3xl' : ''
      } ${className}`}
    >
      {/* Top TradingView Real-Time Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#131722] border-b border-[#1e222d] text-xs">
        {/* Left: Security Info & Real-Time OHLC Readout */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-black text-white text-sm tracking-wide">
              {ticker}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#1e222d] text-blue-400 font-bold">
              {timeframe}
            </span>
            <span className="text-[10px] text-[#787b86] font-mono">
              {exchange}
            </span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#1e222d] font-mono text-[11px]">
              <span className="text-[#787b86]">LTP:</span>
              <span className={`font-bold ${tickDirection === 'UP' ? 'text-[#089981]' : tickDirection === 'DOWN' ? 'text-[#f23645]' : 'text-white'}`}>
                {currency}{liveLtp.toFixed(2)}
              </span>
              <span className={`w-2 h-2 rounded-full ${tickDirection === 'UP' ? 'bg-[#089981] animate-ping' : tickDirection === 'DOWN' ? 'bg-[#f23645] animate-ping' : 'bg-blue-400'}`} />
            </div>
          </div>

          {/* Dynamic OHLC Bar for Hovered / Active Tick */}
          {activeCandle && (
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
              <span className="text-[#787b86]">O: <strong className="text-white">{currency}{activeCandle.open.toFixed(2)}</strong></span>
              <span className="text-[#787b86]">H: <strong className="text-white">{currency}{activeCandle.high.toFixed(2)}</strong></span>
              <span className="text-[#787b86]">L: <strong className="text-white">{currency}{activeCandle.low.toFixed(2)}</strong></span>
              <span className="text-[#787b86]">C: <strong className={candleChangeAmount >= 0 ? 'text-[#089981]' : 'text-[#f23645]'}>{currency}{activeCandle.close.toFixed(2)}</strong></span>

              <span className={`font-black flex items-center gap-0.5 ${candleChangeAmount >= 0 ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                {candleChangeAmount >= 0 ? `+${currency}${candleChangeAmount.toFixed(2)}` : `-${currency}${Math.abs(candleChangeAmount).toFixed(2)}`}
                ({candleChangePct >= 0 ? `+${candleChangePct.toFixed(2)}%` : `${candleChangePct.toFixed(2)}%`})
              </span>

              <span className="text-[#787b86] hidden sm:inline">
                Vol: <strong className="text-white">{(activeCandle.volume / 1000).toFixed(1)}K</strong>
              </span>
            </div>
          )}
        </div>

        {/* Right: Timeframe Switcher & Indicator Controls */}
        <div className="flex items-center gap-2">
          {/* Timeframe Quick Pills */}
          <div className="flex items-center bg-[#1e222d] p-0.5 rounded-lg">
            {(['1m', '5m', '15m', '1h', '1D'] as ChartTimeframe[]).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                  timeframe === tf
                    ? 'bg-[#2962ff] text-white shadow-xs'
                    : 'text-[#787b86] hover:text-white'
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
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-black transition-all cursor-pointer ${
                showEMA20 ? 'bg-[#ff9800]/20 text-[#ff9800] border border-[#ff9800]/40' : 'text-[#787b86] hover:text-white'
              }`}
              title="20-period Exponential Moving Average"
            >
              EMA 20
            </button>
            <button
              type="button"
              onClick={() => setShowEMA50(!showEMA50)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-black transition-all cursor-pointer ${
                showEMA50 ? 'bg-[#2962ff]/20 text-[#2962ff] border border-[#2962ff]/40' : 'text-[#787b86] hover:text-white'
              }`}
              title="50-period Exponential Moving Average"
            >
              EMA 50
            </button>
            <button
              type="button"
              onClick={() => setShowVWAP(!showVWAP)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-black transition-all cursor-pointer ${
                showVWAP ? 'bg-[#ab47bc]/20 text-[#ab47bc] border border-[#ab47bc]/40' : 'text-[#787b86] hover:text-white'
              }`}
              title="Volume Weighted Average Price"
            >
              VWAP
            </button>
            <button
              type="button"
              onClick={() => setShowBollinger(!showBollinger)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-black transition-all cursor-pointer ${
                showBollinger ? 'bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/40' : 'text-[#787b86] hover:text-white'
              }`}
              title="Bollinger Bands (20, 2)"
            >
              BB
            </button>
            <button
              type="button"
              onClick={() => setShowSignals(!showSignals)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-black transition-all cursor-pointer ${
                showSignals ? 'bg-[#089981]/25 text-[#089981] border border-[#089981]/50' : 'text-[#787b86] hover:text-white'
              }`}
              title="BUY / SELL Trade Pivot Signals (Image 2)"
            >
              Signals
            </button>
            <button
              type="button"
              onClick={() => setShowRSI(!showRSI)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-black transition-all cursor-pointer ${
                showRSI ? 'bg-[#a855f7]/25 text-[#a855f7] border border-[#a855f7]/50' : 'text-[#787b86] hover:text-white'
              }`}
              title="RSI Oscillator Panel (Image 4)"
            >
              RSI
            </button>
            <button
              type="button"
              onClick={() => setShowSebiFilings(!showSebiFilings)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-black transition-all cursor-pointer ${
                showSebiFilings ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-[#787b86] hover:text-white'
              }`}
              title="SEBI Corporate Filings & Disclosures"
            >
              SEBI
            </button>
          </div>

          {/* Reset View & Fullscreen */}
          <button
            type="button"
            onClick={handleResetZoom}
            title="Reset Zoom & Pan to Latest [R]"
            className="p-1 rounded text-[#787b86] hover:text-white hover:bg-[#1e222d] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 rounded text-[#787b86] hover:text-white hover:bg-[#1e222d] transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div className="relative w-full h-[440px] bg-[#131722] cursor-crosshair">
        <canvas
          ref={canvasRef}
          className="w-full h-full block select-none"
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
        />

        {/* Floating Brand Badge */}
        <div className="absolute bottom-2 left-3 pointer-events-none text-[9px] font-mono text-[#787b86]/70 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#089981] animate-ping" />
          <span>TradingView Precision Engine • 5 Hz Live DMA</span>
        </div>
      </div>

      {/* SEBI Corporate Filing Modal Details */}
      {selectedFiling && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#1e222d] border border-blue-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-white">
            <div className="flex items-start justify-between border-b border-[#2a2e39] pb-3">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-black bg-blue-500/20 text-blue-400">
                  {selectedFiling.regSection}
                </span>
                <h3 className="text-base font-extrabold text-white">
                  {selectedFiling.title}
                </h3>
                <p className="text-xs text-[#787b86] font-mono">
                  Date: {selectedFiling.date} • Impact: {selectedFiling.impact}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFiling(null)}
                className="p-1.5 rounded-full text-[#787b86] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedFiling.details}
            </p>

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
              <button
                type="button"
                onClick={() => setSelectedFiling(null)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer shadow-md transition-all"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingViewChart;
