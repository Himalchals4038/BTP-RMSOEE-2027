import React, { useState, useMemo } from 'react';
import {
  Layers,
  Sparkles,
  Activity,
  Plus,
  Trash2,
  Sliders,
  Send,
  Clock,
  Target,
  Flame,
  BarChart3
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Legend
} from 'recharts';
import {
  calculateBlackScholesGreeks,
  calculateLegPayoffAtExpiry,
  calculateLegPayoffAtTargetDate,
  type OptionLeg,
  type OptionType
} from '../../utils/blackScholes';
import { useTradingSimulation } from '../../context/TradingSimulationContext';
import { usePortfolio } from '../../context/PortfolioContext';
import { soundService } from '../../services/soundService';

interface StrategyTemplate {
  name: string;
  description: string;
  category: 'Bullish' | 'Bearish' | 'Neutral' | 'Volatile';
  icon: string;
  generateLegs: (spot: number) => OptionLeg[];
}

export const OptionsStrategyBuilder: React.FC = () => {
  const { placeOrder } = useTradingSimulation();
  const { theme } = usePortfolio();

  // Underlying selection
  const [underlying, setUnderlying] = useState<string>('NIFTY 50');
  const [spotPrice, setSpotPrice] = useState<number>(24520);
  const ivPct = 13.8; // India VIX %
  const daysToExpiry = 7;
  const [targetDte, setTargetDte] = useState<number>(0); // T+0 today
  const [executionMessage, setExecutionMessage] = useState<string | null>(null);

  // Default lot size
  const lotSize = underlying.includes('BANK') ? 15 : 25;

  // Pre-built Strategy Templates
  const templates: StrategyTemplate[] = useMemo(() => [
    {
      name: 'Bull Call Spread',
      description: 'Buy ATM Call + Sell OTM Call. Defined risk & capped profit for moderate upside.',
      category: 'Bullish',
      icon: '📈',
      generateLegs: (spot) => {
        const atm = Math.round(spot / 50) * 50;
        const otm = atm + 150;
        const atmGreeks = calculateBlackScholesGreeks(spot, atm, 7 / 365, 0.065, 0.138, true);
        const otmGreeks = calculateBlackScholesGreeks(spot, otm, 7 / 365, 0.065, 0.138, true);
        return [
          { id: 'leg_1', strike: atm, type: 'CE', action: 'BUY', lots: 1, lotSize, entryPrice: atmGreeks.price, iv: 13.8, expiryDate: '7 DTE' },
          { id: 'leg_2', strike: otm, type: 'CE', action: 'SELL', lots: 1, lotSize, entryPrice: otmGreeks.price, iv: 13.8, expiryDate: '7 DTE' }
        ];
      }
    },
    {
      name: 'Iron Condor',
      description: 'Sell OTM Put + Buy Far OTM Put + Sell OTM Call + Buy Far OTM Call. Non-directional range-bound income.',
      category: 'Neutral',
      icon: '🦅',
      generateLegs: (spot) => {
        const base = Math.round(spot / 50) * 50;
        const putSell = base - 150;
        const putBuy = base - 300;
        const callSell = base + 150;
        const callBuy = base + 300;

        const pSellG = calculateBlackScholesGreeks(spot, putSell, 7 / 365, 0.065, 0.138, false);
        const pBuyG = calculateBlackScholesGreeks(spot, putBuy, 7 / 365, 0.065, 0.138, false);
        const cSellG = calculateBlackScholesGreeks(spot, callSell, 7 / 365, 0.065, 0.138, true);
        const cBuyG = calculateBlackScholesGreeks(spot, callBuy, 7 / 365, 0.065, 0.138, true);

        return [
          { id: 'leg_1', strike: putBuy, type: 'PE', action: 'BUY', lots: 1, lotSize, entryPrice: pBuyG.price, iv: 14.5, expiryDate: '7 DTE' },
          { id: 'leg_2', strike: putSell, type: 'PE', action: 'SELL', lots: 1, lotSize, entryPrice: pSellG.price, iv: 14.0, expiryDate: '7 DTE' },
          { id: 'leg_3', strike: callSell, type: 'CE', action: 'SELL', lots: 1, lotSize, entryPrice: cSellG.price, iv: 13.5, expiryDate: '7 DTE' },
          { id: 'leg_4', strike: callBuy, type: 'CE', action: 'BUY', lots: 1, lotSize, entryPrice: cBuyG.price, iv: 14.0, expiryDate: '7 DTE' }
        ];
      }
    },
    {
      name: 'Long Straddle',
      description: 'Simultaneous Buy ATM Call + Buy ATM Put. High profit on massive breakout in either direction.',
      category: 'Volatile',
      icon: '💥',
      generateLegs: (spot) => {
        const atm = Math.round(spot / 50) * 50;
        const cG = calculateBlackScholesGreeks(spot, atm, 7 / 365, 0.065, 0.138, true);
        const pG = calculateBlackScholesGreeks(spot, atm, 7 / 365, 0.065, 0.138, false);
        return [
          { id: 'leg_1', strike: atm, type: 'CE', action: 'BUY', lots: 1, lotSize, entryPrice: cG.price, iv: 13.8, expiryDate: '7 DTE' },
          { id: 'leg_2', strike: atm, type: 'PE', action: 'BUY', lots: 1, lotSize, entryPrice: pG.price, iv: 14.0, expiryDate: '7 DTE' }
        ];
      }
    },
    {
      name: 'Long Strangle',
      description: 'Buy OTM Call + Buy OTM Put. Cheaper volatility play requiring larger momentum move.',
      category: 'Volatile',
      icon: '⚡',
      generateLegs: (spot) => {
        const base = Math.round(spot / 50) * 50;
        const putOtm = base - 200;
        const callOtm = base + 200;
        const cG = calculateBlackScholesGreeks(spot, callOtm, 7 / 365, 0.065, 0.138, true);
        const pG = calculateBlackScholesGreeks(spot, putOtm, 7 / 365, 0.065, 0.138, false);
        return [
          { id: 'leg_1', strike: callOtm, type: 'CE', action: 'BUY', lots: 1, lotSize, entryPrice: cG.price, iv: 13.5, expiryDate: '7 DTE' },
          { id: 'leg_2', strike: putOtm, type: 'PE', action: 'BUY', lots: 1, lotSize, entryPrice: pG.price, iv: 14.2, expiryDate: '7 DTE' }
        ];
      }
    },
    {
      name: 'Bear Put Spread',
      description: 'Buy ATM Put + Sell OTM Put. Moderately bearish with lower net premium cost.',
      category: 'Bearish',
      icon: '📉',
      generateLegs: (spot) => {
        const atm = Math.round(spot / 50) * 50;
        const otm = atm - 150;
        const atmG = calculateBlackScholesGreeks(spot, atm, 7 / 365, 0.065, 0.138, false);
        const otmG = calculateBlackScholesGreeks(spot, otm, 7 / 365, 0.065, 0.138, false);
        return [
          { id: 'leg_1', strike: atm, type: 'PE', action: 'BUY', lots: 1, lotSize, entryPrice: atmG.price, iv: 14.0, expiryDate: '7 DTE' },
          { id: 'leg_2', strike: otm, type: 'PE', action: 'SELL', lots: 1, lotSize, entryPrice: otmG.price, iv: 14.5, expiryDate: '7 DTE' }
        ];
      }
    }
  ], [lotSize]);

  // Active strategy legs state
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>('Bull Call Spread');
  const [legs, setLegs] = useState<OptionLeg[]>(() => templates[0].generateLegs(24520));

  const handleApplyTemplate = (tpl: StrategyTemplate) => {
    setSelectedTemplateName(tpl.name);
    setLegs(tpl.generateLegs(spotPrice));
    setExecutionMessage(null);
  };

  // Add Custom Leg
  const handleAddLeg = () => {
    const atm = Math.round(spotPrice / 50) * 50;
    const greeks = calculateBlackScholesGreeks(spotPrice, atm, daysToExpiry / 365, 0.065, ivPct / 100, true);
    const newLeg: OptionLeg = {
      id: `leg_${Date.now()}`,
      strike: atm,
      type: 'CE',
      action: 'BUY',
      lots: 1,
      lotSize,
      entryPrice: greeks.price,
      iv: ivPct,
      expiryDate: `${daysToExpiry} DTE`
    };
    setLegs([...legs, newLeg]);
    setSelectedTemplateName('Custom Strategy');
  };

  // Remove Leg
  const handleRemoveLeg = (id: string) => {
    setLegs(legs.filter(l => l.id !== id));
    setSelectedTemplateName('Custom Strategy');
  };

  // Update Leg Parameter
  const handleUpdateLeg = (id: string, updates: Partial<OptionLeg>) => {
    setLegs(legs.map(l => {
      if (l.id !== id) return l;
      const updated = { ...l, ...updates };
      // Recalculate theoretical price if strike or type changed
      if (updates.strike !== undefined || updates.type !== undefined) {
        const g = calculateBlackScholesGreeks(
          spotPrice,
          updated.strike,
          daysToExpiry / 365,
          0.065,
          updated.iv / 100,
          updated.type === 'CE'
        );
        updated.entryPrice = g.price;
      }
      return updated;
    }));
    setSelectedTemplateName('Custom Strategy');
  };

  // Payoff Curve Computation (50 points spanning ±4% around Spot)
  const { payoffPoints, summary } = useMemo(() => {
    if (legs.length === 0) {
      return {
        payoffPoints: [],
        summary: {
          netPremium: 0,
          maxProfit: 0,
          maxLoss: 0,
          breakEvens: [],
          riskRewardRatio: 'N/A',
          pop: 50,
          totalDelta: 0,
          totalGamma: 0,
          totalTheta: 0,
          totalVega: 0
        }
      };
    }

    const rangePct = 0.045; // ±4.5%
    const minSpot = Math.round(spotPrice * (1 - rangePct));
    const maxSpot = Math.round(spotPrice * (1 + rangePct));
    const step = Math.max(5, Math.round((maxSpot - minSpot) / 60));

    const points: Array<{
      spot: number;
      expiryPayoff: number;
      targetPayoff: number;
    }> = [];

    let minPayoff = Infinity;
    let maxPayoff = -Infinity;
    const breakEvens: number[] = [];

    let prevPayoff: number | null = null;

    const remainingDteTarget = Math.max(0.1, daysToExpiry - targetDte);

    for (let s = minSpot; s <= maxSpot; s += step) {
      let expPnl = 0;
      let tgtPnl = 0;

      legs.forEach(leg => {
        expPnl += calculateLegPayoffAtExpiry(leg, s);
        tgtPnl += calculateLegPayoffAtTargetDate(leg, s, remainingDteTarget);
      });

      points.push({
        spot: s,
        expiryPayoff: Math.round(expPnl),
        targetPayoff: Math.round(tgtPnl)
      });

      if (expPnl < minPayoff) minPayoff = expPnl;
      if (expPnl > maxPayoff) maxPayoff = expPnl;

      // Breakeven crossing check
      if (prevPayoff !== null) {
        if ((prevPayoff <= 0 && expPnl >= 0) || (prevPayoff >= 0 && expPnl <= 0)) {
          breakEvens.push(s);
        }
      }
      prevPayoff = expPnl;
    }

    // Net premium flow (>0 is debit, <0 is credit)
    let netPremium = 0;
    let totalDelta = 0;
    let totalGamma = 0;
    let totalTheta = 0;
    let totalVega = 0;

    legs.forEach(leg => {
      const legQty = leg.lots * leg.lotSize;
      const prem = leg.entryPrice * legQty;
      netPremium += leg.action === 'BUY' ? prem : -prem;

      const greeks = calculateBlackScholesGreeks(
        spotPrice,
        leg.strike,
        daysToExpiry / 365,
        0.065,
        leg.iv / 100,
        leg.type === 'CE'
      );

      const sign = leg.action === 'BUY' ? 1 : -1;
      totalDelta += sign * greeks.delta * legQty;
      totalGamma += sign * greeks.gamma * legQty;
      totalTheta += sign * greeks.theta * legQty;
      totalVega += sign * greeks.vega * legQty;
    });

    const isUnlimitedProfit = maxPayoff > 40000;
    const isUnlimitedLoss = minPayoff < -40000;

    const formattedMaxProfit: number | 'Unlimited' = isUnlimitedProfit ? 'Unlimited' : Math.round(maxPayoff);
    const formattedMaxLoss: number | 'Unlimited' = isUnlimitedLoss ? 'Unlimited' : Math.abs(Math.round(minPayoff));

    let rrRatio = 'N/A';
    if (typeof formattedMaxProfit === 'number' && typeof formattedMaxLoss === 'number' && formattedMaxLoss > 0) {
      rrRatio = `1 : ${(formattedMaxProfit / formattedMaxLoss).toFixed(2)}`;
    }

    // Probability of Profit estimate
    const pop = Math.min(85, Math.max(15, Math.round(52 + totalTheta * 0.05 - totalDelta * 0.02)));

    return {
      payoffPoints: points,
      summary: {
        netPremium: Math.round(netPremium),
        maxProfit: formattedMaxProfit,
        maxLoss: formattedMaxLoss,
        breakEvens,
        riskRewardRatio: rrRatio,
        pop,
        totalDelta: Number(totalDelta.toFixed(2)),
        totalGamma: Number(totalGamma.toFixed(4)),
        totalTheta: Number(totalTheta.toFixed(1)),
        totalVega: Number(totalVega.toFixed(1))
      }
    };
  }, [legs, spotPrice, daysToExpiry, targetDte, lotSize]);

  // Execute Entire Multi-Leg Basket directly in simulation engine
  const handleExecuteStrategyBasket = () => {
    let successCount = 0;
    legs.forEach((leg) => {
      const res = placeOrder({
        ticker: `${underlying} ${leg.strike} ${leg.type}`,
        action: leg.action,
        product: 'F&O Options',
        orderType: 'Market Order',
        qty: leg.lots * leg.lotSize,
        price: leg.entryPrice
      });
      if (res.success) successCount++;
    });

    soundService.playExecutionChime();
    setExecutionMessage(`Successfully executed ${successCount} of ${legs.length} option legs on simulated exchange!`);
    setTimeout(() => setExecutionMessage(null), 5000);
  };

  const axisColor = theme === 'dark' ? '#64748b' : '#94a3b8';
  const tooltipBg = theme === 'dark' ? '#0f172a' : '#ffffff';
  const tooltipBorder = theme === 'dark' ? '#1e293b' : '#e2e8f0';

  return (
    <div className="space-y-6 w-full">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
        <div>
          <h3 className="text-lg font-black flex items-center gap-2 text-[var(--text-primary)]">
            <Layers className="w-5 h-5 text-[var(--icici-orange)]" />
            Institutional Multi-Leg Options Strategy Builder & Payoff Visualizer
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Sensibull™ Greeks Model
            </span>
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Simulate Bull Spreads, Iron Condors, Straddles, and Black-Scholes Greeks with live payoff curves at Expiry and Target Date (T+0).
          </p>
        </div>

        {/* Underlying Selector & Live Spot Bar */}
        <div className="flex items-center gap-2 bg-[var(--bg-tertiary)] p-1.5 rounded-2xl border border-[var(--border-color)]">
          {['NIFTY 50', 'BANK NIFTY'].map(u => (
            <button
              key={u}
              onClick={() => {
                setUnderlying(u);
                const newSpot = u === 'NIFTY 50' ? 24520 : 51840;
                setSpotPrice(newSpot);
                setLegs(templates[0].generateLegs(newSpot));
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                underlying === u
                  ? 'bg-[var(--icici-orange)] text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {u}
            </button>
          ))}
          <div className="px-3 py-1 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
            Spot: ₹{spotPrice.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Pre-Built Strategy Templates Selector */}
      <div className="space-y-2">
        <label className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-amber-500" /> Pre-Built Strategy Templates
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {templates.map(tpl => {
            const isSelected = selectedTemplateName === tpl.name;
            return (
              <button
                key={tpl.name}
                onClick={() => handleApplyTemplate(tpl)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-br from-[var(--icici-orange)]/15 to-amber-500/10 border-[var(--icici-orange)] shadow-md ring-2 ring-[var(--icici-orange)]/30'
                    : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] hover:border-[var(--text-muted)]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-lg">{tpl.icon}</span>
                  <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                    tpl.category === 'Bullish' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                    tpl.category === 'Bearish' ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400' :
                    tpl.category === 'Neutral' ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400' :
                    'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                  }`}>
                    {tpl.category}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="font-extrabold text-xs text-[var(--text-primary)] block">{tpl.name}</span>
                  <span className="text-[10px] text-[var(--text-secondary)] line-clamp-2 mt-0.5">{tpl.description}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Interactive Payoff Visualizer & Metrics Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Payoff Curve (2 spans) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
            <div>
              <h4 className="font-extrabold text-sm text-[var(--text-primary)] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                Payoff Diagram at Expiry vs Target Date (T+{targetDte})
              </h4>
              <span className="text-[11px] text-[var(--text-secondary)]">
                Interactive P&L curve across underlying spot price rungs
              </span>
            </div>

            {/* Target Date Slider (0 to DTE) */}
            <div className="flex items-center gap-3 text-xs bg-[var(--bg-tertiary)] px-3 py-1.5 rounded-xl border border-[var(--border-color)]">
              <span className="font-bold text-[var(--text-muted)] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Target Date:
              </span>
              <input
                type="range"
                min="0"
                max={daysToExpiry}
                value={targetDte}
                onChange={(e) => setTargetDte(Number(e.target.value))}
                className="w-24 accent-[var(--icici-orange)] cursor-pointer"
              />
              <span className="font-mono font-extrabold text-[var(--icici-orange)]">
                {targetDte === 0 ? 'Today (T+0)' : `T+${targetDte} Days`}
              </span>
            </div>
          </div>

          {/* Payoff Chart Canvas */}
          <div className="h-[340px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={payoffPoints}>
                <XAxis
                  dataKey="spot"
                  stroke={axisColor}
                  fontSize={10}
                  tickFormatter={(val) => `₹${val}`}
                />
                <YAxis
                  stroke={axisColor}
                  fontSize={10}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, fontSize: '11px' }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, '']}
                  labelFormatter={(label) => `Spot Price: ₹${label}`}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {/* Zero Profit Horizontal Baseline */}
                <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
                {/* Current Spot Vertical Pin */}
                <ReferenceLine x={spotPrice} stroke="#f97316" strokeDasharray="4 4" label={{ value: 'LIVE SPOT', position: 'top', fill: '#f97316', fontSize: 10 }} />
                {/* Expiry Payoff (Blue/Emerald) */}
                <Line
                  type="monotone"
                  dataKey="expiryPayoff"
                  name="Payoff at Expiry"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={false}
                />
                {/* Target Date Payoff (Orange/Amber) */}
                <Line
                  type="monotone"
                  dataKey="targetPayoff"
                  name={`Payoff on T+${targetDte}`}
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Breakeven and Spot Slider Row */}
          <div className="pt-2 border-t border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--text-muted)]">Break-Even Points:</span>
              {summary.breakEvens.length > 0 ? (
                summary.breakEvens.map(be => (
                  <span key={be} className="px-2 py-0.5 rounded font-mono font-extrabold bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)]">
                    ₹{be.toLocaleString()}
                  </span>
                ))
              ) : (
                <span className="text-[var(--text-secondary)] font-semibold">None (Always profitable or loss)</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase">Estimated POP:</span>
              <span className="px-2 py-0.5 rounded font-mono font-black text-xs bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                {summary.pop}%
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Strategy Financial Highlights & Greeks Card */}
        <div className="space-y-4">
          {/* Key P&L Summary Metrics Card */}
          <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-sm">
            <h4 className="font-extrabold text-sm text-[var(--text-primary)] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-[var(--icici-orange)]" /> Strategy Risk Profile
              </span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                summary.netPremium >= 0
                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              }`}>
                {summary.netPremium >= 0 ? 'NET DEBIT' : 'NET CREDIT'}
              </span>
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">MAX PROFIT</span>
                <span className="font-mono font-black text-base text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  {summary.maxProfit === 'Unlimited' ? 'Unlimited' : `+₹${summary.maxProfit.toLocaleString()}`}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">MAX LOSS</span>
                <span className="font-mono font-black text-base text-rose-600 dark:text-rose-400 mt-0.5 block">
                  {summary.maxLoss === 'Unlimited' ? 'Unlimited' : `-₹${summary.maxLoss.toLocaleString()}`}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">RISK / REWARD</span>
                <span className="font-mono font-extrabold text-xs text-[var(--text-primary)] mt-0.5 block">
                  {summary.riskRewardRatio}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">FUNDS NEEDED</span>
                <span className="font-mono font-extrabold text-xs text-[var(--text-primary)] mt-0.5 block">
                  ₹{Math.abs(summary.netPremium).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Execute Basket Button */}
            <button
              onClick={handleExecuteStrategyBasket}
              className="w-full py-3 rounded-xl bg-[var(--icici-orange)] hover:bg-[var(--icici-orange-hover)] text-white font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              Execute Multi-Leg Strategy ({legs.length} Legs)
            </button>

            {executionMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-in fade-in">
                {executionMessage}
              </div>
            )}
          </div>

          {/* Portfolio Second-Order Greeks Summary */}
          <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3 shadow-sm">
            <h4 className="font-extrabold text-sm text-[var(--text-primary)] flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-500" />
              Net Black-Scholes Greeks
            </h4>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[var(--text-secondary)]">Delta (Δ):</span>
                <span className="font-mono font-black text-xs text-[var(--text-primary)]">{summary.totalDelta}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[var(--text-secondary)]">Gamma (Γ):</span>
                <span className="font-mono font-black text-xs text-[var(--text-primary)]">{summary.totalGamma}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[var(--text-secondary)]">Theta (Θ):</span>
                <span className={`font-mono font-black text-xs ${summary.totalTheta >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {summary.totalTheta >= 0 ? '+' : ''}₹{summary.totalTheta}/day
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[var(--text-secondary)]">Vega (V):</span>
                <span className="font-mono font-black text-xs text-blue-400">₹{summary.totalVega}/%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Leg Basket Configuration Table */}
      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
          <div>
            <h4 className="font-extrabold text-sm text-[var(--text-primary)] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[var(--icici-orange)]" />
              Active Option Strategy Legs ({legs.length})
            </h4>
            <span className="text-[11px] text-[var(--text-secondary)]">
              Edit strikes, actions, lots, and theoretical Black-Scholes entry premiums
            </span>
          </div>

          <button
            onClick={handleAddLeg}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs font-extrabold text-[var(--text-primary)] transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4 text-emerald-500" />
            Add Leg
          </button>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="fin-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Option Type</th>
                <th>Strike Price</th>
                <th>Lots (Qty)</th>
                <th>Entry Premium</th>
                <th>Implied Vol (IV)</th>
                <th>Delta (Δ)</th>
                <th>Theta (Θ/day)</th>
                <th>Remove</th>
              </tr>
            </thead>
            <tbody>
              {legs.map((leg) => {
                const greeks = calculateBlackScholesGreeks(
                  spotPrice,
                  leg.strike,
                  daysToExpiry / 365,
                  0.065,
                  leg.iv / 100,
                  leg.type === 'CE'
                );

                return (
                  <tr key={leg.id}>
                    <td>
                      <button
                        onClick={() => handleUpdateLeg(leg.id, { action: leg.action === 'BUY' ? 'SELL' : 'BUY' })}
                        className={`px-3 py-1 rounded-lg font-black text-xs cursor-pointer uppercase transition-colors ${
                          leg.action === 'BUY'
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {leg.action}
                      </button>
                    </td>

                    <td>
                      <div className="flex items-center gap-1">
                        {(['CE', 'PE'] as OptionType[]).map(t => (
                          <button
                            key={t}
                            onClick={() => handleUpdateLeg(leg.id, { type: t })}
                            className={`px-2 py-0.5 rounded text-[11px] font-black cursor-pointer ${
                              leg.type === t
                                ? 'bg-[var(--icici-orange)] text-white'
                                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)]'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </td>

                    <td>
                      <input
                        type="number"
                        step="50"
                        value={leg.strike}
                        onChange={(e) => handleUpdateLeg(leg.id, { strike: Number(e.target.value) })}
                        className="w-24 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-2 py-1 font-mono font-extrabold text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)]"
                      />
                    </td>

                    <td>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={leg.lots}
                          onChange={(e) => handleUpdateLeg(leg.id, { lots: Math.max(1, Number(e.target.value)) })}
                          className="w-14 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-2 py-1 font-mono font-bold text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)]"
                        />
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">({leg.lots * leg.lotSize} Qty)</span>
                      </div>
                    </td>

                    <td className="font-mono font-bold text-[var(--text-primary)]">
                      ₹{leg.entryPrice.toFixed(2)}
                    </td>

                    <td>
                      <span className="font-mono text-xs text-[var(--text-secondary)]">{leg.iv}%</span>
                    </td>

                    <td className="font-mono text-xs text-blue-400">
                      {(leg.action === 'BUY' ? greeks.delta : -greeks.delta).toFixed(3)}
                    </td>

                    <td className="font-mono text-xs text-amber-500">
                      {(leg.action === 'BUY' ? greeks.theta : -greeks.theta).toFixed(1)}
                    </td>

                    <td>
                      <button
                        onClick={() => handleRemoveLeg(leg.id)}
                        disabled={legs.length <= 1}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/15 disabled:opacity-30 cursor-pointer transition-colors"
                        title="Delete Leg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OptionsStrategyBuilder;

