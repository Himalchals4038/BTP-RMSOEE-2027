import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Maximize2,
  Minimize2,
  Layers,
  Brain,
  Sparkles,
  FileText,
  X
} from 'lucide-react';
import { useTradingSimulation, subscribeToTicker } from '../../context/TradingSimulationContext';

interface CandlestickData {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SebiCorporateFiling {
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

export interface AiSentimentAnalysis {
  score: number; // e.g. +0.78
  label: 'Very Bullish' | 'Bullish' | 'Neutral' | 'Bearish' | 'Very Bearish';
  confidence: number; // percentage e.g. 92
  sentimentDriver: string;
  institutionalFlow: 'Accumulation' | 'Distribution' | 'Neutral';
}

interface InteractiveCandlestickChartProps {
  ticker: string;
  basePrice?: number;
  currency?: string;
  className?: string;
}

type Timeframe = '1m' | '5m' | '15m' | '1h' | '1D';

// Deterministic baseline candle generator
function generateInitialCandles(ticker: string, basePrice: number, timeframe: Timeframe): CandlestickData[] {
  const data: CandlestickData[] = [];
  const count = 60;
  let currentPrice = Math.max(10, basePrice);
  const now = Date.now();
  const intervalMinutes = timeframe === '1m' ? 1 : timeframe === '5m' ? 5 : timeframe === '15m' ? 15 : timeframe === '1h' ? 60 : 1440;
  const intervalMs = intervalMinutes * 60 * 1000;

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
}

// Generate deterministic institutional SEBI Corporate Filings for the active ticker
function generateSebiFilings(ticker: string, candleCount: number): SebiCorporateFiling[] {
  const cleanTicker = ticker.replace('.NS', '').replace('.BO', '');
  const filings: SebiCorporateFiling[] = [];

  if (candleCount < 20) return filings;

  // Index 1: Dividend declaration ~20% of candles
  const idxDiv = Math.floor(candleCount * 0.22);
  filings.push({
    id: `${cleanTicker}-DIV`,
    candleIndex: idxDiv,
    type: 'DIVIDEND',
    badge: 'D',
    title: 'Interim Dividend Corporate Action',
    regSection: 'SEBI (LODR) Regulation 43 & Schedule III',
    date: '18 Sep 2026',
    details: `Board declared Interim Dividend of ₹16.50 per equity share. Record date set for depository entitlement verification.`,
    promoterOrEntity: 'Board of Directors Audit Committee',
    impact: 'Bullish',
    changePct: '+2.8% Yield Impact'
  });

  // Index 2: SEBI SAST Insider Acquisition ~55% of candles
  const idxSast = Math.floor(candleCount * 0.55);
  filings.push({
    id: `${cleanTicker}-SAST`,
    candleIndex: idxSast,
    type: 'SAST_INSIDER',
    badge: 'S',
    title: 'SEBI SAST Reg 29(2) Promoter Stake Disclosure',
    regSection: 'SEBI (Substantial Acquisition of Shares & Takeovers) 2011, Reg 29(2)',
    date: '19 Sep 2026',
    details: `Promoter & Promoter Group acquired 145,000 equity shares via open market purchase. Shareholding increased from 51.12% to 51.34%. Zero encumbrances.`,
    promoterOrEntity: 'Promoter Family Holding Trust',
    impact: 'Bullish',
    changePct: '+0.22% Net Stake Addition'
  });

  // Index 3: Quarterly Earnings Announcement ~82% of candles
  const idxEarn = Math.floor(candleCount * 0.82);
  filings.push({
    id: `${cleanTicker}-EARN`,
    candleIndex: idxEarn,
    type: 'EARNINGS',
    badge: 'E',
    title: 'Q3 FY26 Audited Financial Results',
    regSection: 'SEBI (LODR) Regulation 33 - Financial Disclosures',
    date: '20 Sep 2026',
    details: `Net Profit jumped 18.6% YoY with EBITDA margins expanding 95 bps. Strong institutional order book expansion reported.`,
    promoterOrEntity: 'Chief Financial Officer & Statutory Auditor',
    impact: 'Bullish',
    changePct: '+18.6% Net PAT Growth'
  });

  return filings;
}

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
  const [showSebiFilings, setShowSebiFilings] = useState<boolean>(true);
  const [selectedFiling, setSelectedFiling] = useState<SebiCorporateFiling | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [hoveredCandle, setHoveredCandle] = useState<CandlestickData | null>(null);

  const [candles, setCandles] = useState<CandlestickData[]>(() =>
    generateInitialCandles(ticker, basePrice, timeframe)
  );
  const [liveLtp, setLiveLtp] = useState<number>(() => {
    const init = generateInitialCandles(ticker, basePrice, timeframe);
    return init.length > 0 ? init[init.length - 1].close : basePrice;
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rsiCanvasRef = useRef<HTMLCanvasElement>(null);

  // Sync historical baseline on ticker, basePrice, or timeframe change
  useEffect(() => {
    const init = generateInitialCandles(ticker, basePrice, timeframe);
    setCandles(init);
    setLiveLtp(init.length > 0 ? init[init.length - 1].close : basePrice);
  }, [ticker, basePrice, timeframe]);

  // Connect to 5 Hz fast live tick stream to dynamically mutate the active candle and wicks
  useEffect(() => {
    const unsubscribe = subscribeToTicker(ticker, (tick) => {
      const tickPrice = tick?.ltp;
      if (typeof tickPrice !== 'number') return;
      setLiveLtp(tickPrice);

      setCandles(prev => {
        if (prev.length === 0) return prev;
        const lastIdx = prev.length - 1;
        const last = prev[lastIdx];

        const newClose = tickPrice;
        const newHigh = Math.max(last.high, newClose);
        const newLow = Math.min(last.low, newClose);
        const newVolume = last.volume + (tick.volume ? Math.max(1, Math.floor(tick.volume / 100)) : 12);

        const updatedLast: CandlestickData = {
          ...last,
          close: newClose,
          high: newHigh,
          low: newLow,
          volume: newVolume
        };

        const updated = [...prev];
        updated[lastIdx] = updatedLast;
        return updated;
      });
    });

    return unsubscribe;
  }, [ticker]);

  // Corporate Filings for this ticker
  const sebiFilings = useMemo(() => {
    return generateSebiFilings(ticker, candles.length);
  }, [ticker, candles.length]);

  // Real-time AI Sentiment Analyzer
  const aiSentiment: AiSentimentAnalysis = useMemo(() => {
    if (candles.length < 5) {
      return {
        score: 0.72,
        label: 'Bullish',
        confidence: 88,
        sentimentDriver: 'Promoter SAST Accumulation & FII Inflows',
        institutionalFlow: 'Accumulation'
      };
    }
    const recent = candles.slice(-10);
    const gains = recent.filter(c => c.close >= c.open).length;
    const ratio = gains / recent.length;
    const score = Number((ratio * 1.4 - 0.45).toFixed(2));
    const clampedScore = Math.max(-0.95, Math.min(0.95, score));

    let label: AiSentimentAnalysis['label'] = 'Neutral';
    if (clampedScore > 0.4) label = 'Very Bullish';
    else if (clampedScore > 0.1) label = 'Bullish';
    else if (clampedScore < -0.4) label = 'Very Bearish';
    else if (clampedScore < -0.1) label = 'Bearish';

    return {
      score: clampedScore,
      label,
      confidence: Math.round(85 + Math.abs(clampedScore) * 12),
      sentimentDriver: clampedScore >= 0
        ? 'SEBI SAST Promoter Buying + Q3 Margin Expansion'
        : 'Macro Supply Overhead + Resistance at VWAP',
      institutionalFlow: clampedScore > 0.2 ? 'Accumulation' : clampedScore < -0.2 ? 'Distribution' : 'Neutral'
    };
  }, [candles]);

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
    let cumulativeTPV = 0;
    let cumulativeVol = 0;
    return candles.map(c => {
      const typicalPrice = (c.high + c.low + c.close) / 3;
      cumulativeTPV += typicalPrice * c.volume;
      cumulativeVol += c.volume;
      return cumulativeVol > 0 ? cumulativeTPV / cumulativeVol : c.close;
    });
  }, [candles]);

  // Calculate 14-period RSI
  const rsiValues = useMemo(() => {
    if (candles.length < 15) return [];
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
    const paddingTop = 28;
    const paddingBottom = 40;
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Price bounds
    let minPrice = Math.min(...candles.map(c => c.low));
    let maxPrice = Math.max(...candles.map(c => c.high));
    const priceMargin = (maxPrice - minPrice) * 0.12 || 1;
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

    for (let i = 0; i <= gridLines; i++) {
      const price = minPrice + ((maxPrice - minPrice) / gridLines) * i;
      const y = getY(price);

      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - paddingRight, y);
      ctx.stroke();

      ctx.fillStyle = 'rgba(148, 163, 184, 0.65)';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText(price.toFixed(2), width - paddingRight + 6, y + 3);
    }

    // Draw Volume Bars at bottom
    candles.forEach((c, idx) => {
      const x = paddingLeft + idx * candleSpacing + candleSpacing / 2;
      const vHeight = (c.volume / maxVolume) * volumeHeight;
      const y = height - paddingBottom - vHeight;
      const isUp = c.close >= c.open;

      ctx.fillStyle = isUp ? 'rgba(16, 185, 129, 0.22)' : 'rgba(239, 68, 68, 0.22)';
      ctx.fillRect(x - candleWidth / 2, y, candleWidth, vHeight);
    });

    // Draw Candlesticks (Wicks & Bodies)
    candles.forEach((c, idx) => {
      const x = paddingLeft + idx * candleSpacing + candleSpacing / 2;
      const yOpen = getY(c.open);
      const yClose = getY(c.close);
      const yHigh = getY(c.high);
      const yLow = getY(c.low);
      const isUp = c.close >= c.open;
      const color = isUp ? '#10b981' : '#ef4444';

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
    if (showEMA20) drawLine(ema20, '#06b6d4', 1.5);
    if (showEMA50) drawLine(ema50, '#f59e0b', 1.5);
    if (showEMA200) drawLine(ema200, '#a855f7', 1.5);

    // Draw VWAP
    if (showVWAP) drawLine(vwapSeries, '#eab308', 1.8, true);

    // Draw SEBI Corporate Filings Markers directly above candle peaks
    if (showSebiFilings) {
      sebiFilings.forEach(f => {
        if (f.candleIndex >= 0 && f.candleIndex < candles.length) {
          const candle = candles[f.candleIndex];
          const x = paddingLeft + f.candleIndex * candleSpacing + candleSpacing / 2;
          const yCandleHigh = getY(candle.high);
          const badgeY = Math.max(paddingTop - 10, yCandleHigh - 16);

          // Connecting indicator stem
          ctx.strokeStyle = f.type === 'EARNINGS' ? '#10b981' : f.type === 'DIVIDEND' ? '#06b6d4' : '#f97316';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(x, yCandleHigh);
          ctx.lineTo(x, badgeY + 8);
          ctx.stroke();
          ctx.setLineDash([]);

          // Badge Circle with drop shadow
          ctx.beginPath();
          ctx.arc(x, badgeY, 9, 0, Math.PI * 2);
          ctx.fillStyle = f.type === 'EARNINGS' ? '#10b981' : f.type === 'DIVIDEND' ? '#06b6d4' : '#f97316';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Symbol Text
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(f.badge, x, badgeY);
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
        }
      });
    }

    // Draw Active Order Lines
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
          ctx.fillRect(width - paddingRight + 2, y - 9, 60, 18);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px "JetBrains Mono", monospace';
          ctx.fillText(`${o.action} ${o.qty ?? o.quantity}`, width - paddingRight + 6, y + 3);
        }

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

    // Time Axis at Bottom
    ctx.fillStyle = 'rgba(148, 163, 184, 0.65)';
    ctx.font = '9px "JetBrains Mono", monospace';
    const step = Math.max(1, Math.floor(candles.length / 6));
    for (let i = 0; i < candles.length; i += step) {
      const c = candles[i];
      const x = paddingLeft + i * candleSpacing + candleSpacing / 2;
      ctx.fillText(c.time, x - 12, height - 10);
    }
  }, [
    candles,
    ema20,
    ema50,
    ema200,
    vwapSeries,
    showEMA20,
    showEMA50,
    showEMA200,
    showVWAP,
    showOrderLines,
    showSebiFilings,
    sebiFilings,
    activeOrders,
    activePosition
  ]);

  // Render RSI Sub-panel canvas
  useEffect(() => {
    const canvas = rsiCanvasRef.current;
    if (!canvas || !showRSI || rsiValues.length === 0) return;

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
    const chartWidth = width - paddingLeft - paddingRight;

    const getRsiY = (rsi: number) => {
      return height - (rsi / 100) * height;
    };

    // Draw Overbought (70) and Oversold (30) zones
    const y70 = getRsiY(70);
    const y30 = getRsiY(30);

    ctx.fillStyle = 'rgba(236, 72, 153, 0.05)';
    ctx.fillRect(paddingLeft, y70, chartWidth, y30 - y70);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);

    // 70 line
    ctx.beginPath();
    ctx.moveTo(paddingLeft, y70);
    ctx.lineTo(width - paddingRight, y70);
    ctx.stroke();

    // 30 line
    ctx.beginPath();
    ctx.moveTo(paddingLeft, y30);
    ctx.lineTo(width - paddingRight, y30);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw RSI Line
    const candleSpacing = chartWidth / candles.length;
    ctx.strokeStyle = '#ec4899';
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

  // Mouse move handler for HUD and SEBI Filing hover inspection
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

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const paddingLeft = 10;
    const paddingRight = 65;
    const chartWidth = rect.width - paddingLeft - paddingRight;
    const candleSpacing = chartWidth / candles.length;

    const index = Math.floor((mouseX - paddingLeft) / candleSpacing);
    const matchedFiling = sebiFilings.find(f => Math.abs(f.candleIndex - index) <= 1);
    if (matchedFiling) {
      setSelectedFiling(matchedFiling);
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
      {/* Top Header: Controls, Ticker, AI Sentinel Score HUD, Timeframes */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
        {/* Ticker, LTP & AI Sentinel Score Badge */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono font-extrabold text-sm text-[var(--text-primary)]">{ticker}</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              5 Hz LIVE
            </span>
            <span className="font-mono text-xs font-black text-[var(--text-primary)] px-2 py-0.5 rounded bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
              {currency}{liveLtp.toFixed(2)}
            </span>
          </div>

          {/* AI Sentinel Sentiment Barometer */}
          <div
            className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border text-xs font-mono font-bold transition-all shadow-sm ${
              aiSentiment.score >= 0
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
            }`}
            title={`AI Sentiment Score: ${aiSentiment.score > 0 ? '+' : ''}${aiSentiment.score} | Confidence: ${aiSentiment.confidence}%\nDriver: ${aiSentiment.sentimentDriver}`}
          >
            <Brain className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              AI: {aiSentiment.score > 0 ? '+' : ''}{aiSentiment.score} ({aiSentiment.label})
            </span>
            <span className="text-[10px] opacity-75 font-normal">
              {aiSentiment.confidence}% Conf
            </span>
            <span className={`w-2 h-2 rounded-full ${aiSentiment.score >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
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

            {/* SEBI Filings Overlay Toggle */}
            <button
              type="button"
              onClick={() => setShowSebiFilings(!showSebiFilings)}
              className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                showSebiFilings
                  ? 'bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-orange-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-muted)]'
              }`}
              title="Toggle SEBI Corporate Filings ([E] Earnings, [D] Dividend, [S] SAST Insider)"
            >
              <FileText className="w-3 h-3" />
              <span>SEBI Filings ({sebiFilings.length})</span>
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
          onClick={handleCanvasClick}
          onMouseLeave={handleMouseLeave}
          className="w-full flex-1 cursor-crosshair block"
          style={{ minHeight: isFullscreen ? '450px' : '260px' }}
        />

        {/* Selected SEBI Regulatory Disclosure Modal / Inspection Card */}
        {selectedFiling && (
          <div className="absolute top-3 left-3 right-3 sm:left-auto sm:right-3 sm:w-96 p-4 rounded-2xl bg-[var(--bg-card)]/95 backdrop-blur-md border border-[var(--border-color)] shadow-2xl z-20 space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                  selectedFiling.type === 'EARNINGS' ? 'bg-emerald-500' : selectedFiling.type === 'DIVIDEND' ? 'bg-cyan-500' : 'bg-orange-500'
                }`}>
                  {selectedFiling.badge}
                </span>
                <div>
                  <h5 className="font-bold text-xs text-[var(--text-primary)] leading-tight">{selectedFiling.title}</h5>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">{selectedFiling.date}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFiling(null)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] font-mono text-[11px] text-[var(--text-secondary)]">
                <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase">REGULATORY SECTION</div>
                <div className="text-[var(--text-primary)] font-bold mt-0.5">{selectedFiling.regSection}</div>
              </div>

              <div className="text-[var(--text-secondary)] leading-relaxed">
                {selectedFiling.details}
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-[var(--border-color)] text-[11px]">
                <span className="text-[var(--text-muted)]">Source: {selectedFiling.promoterOrEntity}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {selectedFiling.changePct || selectedFiling.impact}
                </span>
              </div>
            </div>
          </div>
        )}

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

      {/* Legend & SEBI Filing Indicators Footer */}
      <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-[var(--text-muted)] border-t border-[var(--border-color)] pt-2 gap-2">
        <div className="flex flex-wrap items-center gap-4">
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

          {showSebiFilings && (
            <div className="flex items-center gap-2 border-l border-[var(--border-color)] pl-3">
              <span className="text-[var(--text-muted)]">SEBI Filings:</span>
              <button
                type="button"
                onClick={() => setSelectedFiling(sebiFilings.find(f => f.type === 'EARNINGS') || null)}
                className="flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white font-bold text-[8px] flex items-center justify-center">E</span>
                <span>Earnings</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedFiling(sebiFilings.find(f => f.type === 'DIVIDEND') || null)}
                className="flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span className="w-3.5 h-3.5 rounded-full bg-cyan-500 text-white font-bold text-[8px] flex items-center justify-center">D</span>
                <span>Dividend</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedFiling(sebiFilings.find(f => f.type === 'SAST_INSIDER') || null)}
                className="flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span className="w-3.5 h-3.5 rounded-full bg-orange-500 text-white font-bold text-[8px] flex items-center justify-center">S</span>
                <span>SAST Reg 29/31</span>
              </button>
            </div>
          )}

          {showOrderLines && (
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-blue-500 inline-block"></span>
              <span>Active Orders</span>
            </div>
          )}
        </div>
        <div className="text-[var(--text-muted)] flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>AI Sentinel DMA & Regulatory Filing Engine</span>
        </div>
      </div>
    </div>
  );
};

export default InteractiveCandlestickChart;
