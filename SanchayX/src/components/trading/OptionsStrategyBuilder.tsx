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
  BarChart3,
  ShieldAlert,
  TrendingUp,
  Zap
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
  aggregatePortfolioGreeks,
  calculateDeltaNeutralHedge,
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
  marginBenefit?: string;
  generateLegs: (spot: number) => OptionLeg[];
}

export const OptionsStrategyBuilder: React.FC = () => {
  const { placeOrder } = useTradingSimulation();
  const { theme } = usePortfolio();

  // Underlying selection
  const [underlying, setUnderlying] = useState<string>('NIFTY 50');
  const [spotPrice, setSpotPrice] = useState<number>(23346.40);
  
  // Interactive Sensibull-Grade Sliders: Days to Expiry & India VIX
  const [daysToExpiry, setDaysToExpiry] = useState<number>(7); // 1 to 30 DTE
  const [ivPct, setIvPct] = useState<number>(13.8); // 9.0% to 35.0% India VIX
  const [targetDte, setTargetDte] = useState<number>(0); // T+0 today
  const [executionMessage, setExecutionMessage] = useState<string | null>(null);

  // Default lot size
  const lotSize = underlying.includes('BANK') ? 15 : 25;

  // Pre-built Institutional Strategy Templates
  const templates: StrategyTemplate[] = useMemo(() => [
    {
      name: 'Bull Call Spread',
      description: 'Buy ATM Call + Sell OTM Call. Defined risk & capped profit for moderate upside.',
      category: 'Bullish',
      icon: '📈',
      marginBenefit: '₹32,500 (78% Margin Relief)',
      generateLegs: (spot) => {
        const atm = Math.round(spot / 50) * 50;
        const otm = atm + 150;
        const atmGreeks = calculateBlackScholesGreeks(spot, atm, daysToExpiry / 365, 0.065, ivPct / 100, true);
        const otmGreeks = calculateBlackScholesGreeks(spot, otm, daysToExpiry / 365, 0.065, ivPct / 100, true);
        return [
          { id: 'leg_1', strike: atm, type: 'CE', action: 'BUY', lots: 1, lotSize, entryPrice: atmGreeks.price, iv: ivPct, expiryDate: `${daysToExpiry} DTE` },
          { id: 'leg_2', strike: otm, type: 'CE', action: 'SELL', lots: 1, lotSize, entryPrice: otmGreeks.price, iv: ivPct, expiryDate: `${daysToExpiry} DTE` }
        ];
      }
    },
    {
      name: 'Iron Condor',
      description: 'Sell OTM Put + Buy Far OTM Put + Sell OTM Call + Buy Far OTM Call. Non-directional range income.',
      category: 'Neutral',
      icon: '🦅',
      marginBenefit: '₹48,200 (68% Margin Relief)',
      generateLegs: (spot) => {
        const base = Math.round(spot / 50) * 50;
        const putSell = base - 150;
        const putBuy = base - 300;
        const callSell = base + 150;
        const callBuy = base + 300;

        const pSellG = calculateBlackScholesGreeks(spot, putSell, daysToExpiry / 365, 0.065, ivPct / 100, false);
        const pBuyG = calculateBlackScholesGreeks(spot, putBuy, daysToExpiry / 365, 0.065, ivPct / 100, false);
        const cSellG = calculateBlackScholesGreeks(spot, callSell, daysToExpiry / 365, 0.065, ivPct / 100, true);
        const cBuyG = calculateBlackScholesGreeks(spot, callBuy, daysToExpiry / 365, 0.065, ivPct / 100, true);

        return [
          { id: 'leg_1', strike: putBuy, type: 'PE', action: 'BUY', lots: 1, lotSize, entryPrice: pBuyG.price, iv: ivPct + 0.5, expiryDate: `${daysToExpiry} DTE` },
          { id: 'leg_2', strike: putSell, type: 'PE', action: 'SELL', lots: 1, lotSize, entryPrice: pSellG.price, iv: ivPct, expiryDate: `${daysToExpiry} DTE` },
          { id: 'leg_3', strike: callSell, type: 'CE', action: 'SELL', lots: 1, lotSize, entryPrice: cSellG.price, iv: ivPct - 0.3, expiryDate: `${daysToExpiry} DTE` },
          { id: 'leg_4', strike: callBuy, type: 'CE', action: 'BUY', lots: 1, lotSize, entryPrice: cBuyG.price, iv: ivPct + 0.2, expiryDate: `${daysToExpiry} DTE` }
        ];
      }
    },
    {
      name: 'Short Straddle',
      description: 'Sell ATM Call + Sell ATM Put. Aggressive theta decay harvesting with high premium capture.',
      category: 'Neutral',
      icon: '🎯',
      marginBenefit: '₹1,45,000 (Defined Capital)',
      generateLegs: (spot) => {
        const atm = Math.round(spot / 50) * 50;
        const cG = calculateBlackScholesGreeks(spot, atm, daysToExpiry / 365, 0.065, ivPct / 100, true);
        const pG = calculateBlackScholesGreeks(spot, atm, daysToExpiry / 365, 0.065, ivPct / 100, false);
        return [
          { id: 'leg_1', strike: atm, type: 'CE', action: 'SELL', lots: 1, lotSize, entryPrice: cG.price, iv: ivPct, expiryDate: `${daysToExpiry} DTE` },
          { id: 'leg_2', strike: atm, type: 'PE', action: 'SELL', lots: 1, lotSize, entryPrice: pG.price, iv: ivPct, expiryDate: `${daysToExpiry} DTE` }
        ];
      }
    },
    {
      name: 'Jade Lizard',
      description: 'Sell OTM Put + Bear Call Spread (Sell OTM CE + Buy Far OTM CE). Zero upside risk credit strategy.',
      category: 'Bullish',
      icon: '🦎',
      marginBenefit: '₹55,000 (62% Margin Relief)',
      generateLegs: (spot) => {
        const base = Math.round(spot / 50) * 50;
        const putSell = base - 200;
        const callSell = base + 150;
        const callBuy = base + 250;

        const pSellG = calculateBlackScholesGreeks(spot, putSell, daysToExpiry / 365, 0.065, ivPct / 100, false);
        const cSellG = calculateBlackScholesGreeks(spot, callSell, daysToExpiry / 365, 0.065, ivPct / 100, true);
        const cBuyG = calculateBlackScholesGreeks(spot, callBuy, daysToExpiry / 365, 0.065, ivPct / 100, true);

        return [
          { id: 'leg_1', strike: putSell, type: 'PE', action: 'SELL', lots: 1, lotSize, entryPrice: pSellG.price, iv: ivPct + 0.4, expiryDate: `${daysToExpiry} DTE` },
          { id: 'leg_2', strike: callSell, type: 'CE', action: 'SELL', lots: 1, lotSize, entryPrice: cSellG.price, iv: ivPct, expiryDate: `${daysToExpiry} DTE` },
          { id: 'leg_3', strike: callBuy, type: 'CE', action: 'BUY', lots: 1, lotSize, entryPrice: cBuyG.price, iv: ivPct + 0.3, expiryDate: `${daysToExpiry} DTE` }
        ];
      }
    },
    {
      name: 'Bear Put Spread',
      description: 'Buy ATM Put + Sell OTM Put. Moderately bearish with lower net premium cost.',
      category: 'Bearish',
      icon: '📉',
      marginBenefit: '₹34,000 (76% Margin Relief)',
      generateLegs: (spot) => {
        const atm = Math.round(spot / 50) * 50;
        const otm = atm - 150;
        const atmG = calculateBlackScholesGreeks(spot, atm, daysToExpiry / 365, 0.065, ivPct / 100, false);
        const otmG = calculateBlackScholesGreeks(spot, otm, daysToExpiry / 365, 0.065, ivPct / 100, false);
        return [
          { id: 'leg_1', strike: atm, type: 'PE', action: 'BUY', lots: 1, lotSize, entryPrice: atmG.price, iv: ivPct, expiryDate: `${daysToExpiry} DTE` },
          { id: 'leg_2', strike: otm, type: 'PE', action: 'SELL', lots: 1, lotSize, entryPrice: otmG.price, iv: ivPct, expiryDate: `${daysToExpiry} DTE` }
        ];
      }
    }
  ], [lotSize, daysToExpiry, ivPct]);

  // Active strategy legs state
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>('Bull Call Spread');
  const [legs, setLegs] = useState<OptionLeg[]>(() => templates[0].generateLegs(23346.40));

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
  }, [legs, spotPrice, daysToExpiry, targetDte, lotSize, ivPct]);

  // Aggregate Portfolio-Level Greeks for Institutional Sentinel
  const portfolioGreeks = useMemo(() => {
    return aggregatePortfolioGreeks(legs, spotPrice, daysToExpiry, 0.065, ivPct);
  }, [legs, spotPrice, daysToExpiry, ivPct]);

  // Calculate Automated Delta-Neutral Rebalance Recommendation
  const deltaHedgeRec = useMemo(() => {
    return calculateDeltaNeutralHedge(portfolioGreeks.netDelta, spotPrice, daysToExpiry, lotSize, ivPct);
  }, [portfolioGreeks.netDelta, spotPrice, daysToExpiry, lotSize, ivPct]);

  // 1-Click Automated Delta Neutralize
  const handleDeltaNeutralize = () => {
    if (!deltaHedgeRec || deltaHedgeRec.status === 'NEUTRAL' || deltaHedgeRec.recommendedLots <= 0) return;
    const g = calculateBlackScholesGreeks(
      spotPrice,
      deltaHedgeRec.recommendedStrike,
      daysToExpiry / 365,
      0.065,
      ivPct / 100,
      deltaHedgeRec.recommendedType === 'CE'
    );
    const hedgeLeg: OptionLeg = {
      id: `hedge_leg_${Date.now()}`,
      strike: deltaHedgeRec.recommendedStrike,
      type: deltaHedgeRec.recommendedType,
      action: deltaHedgeRec.recommendedAction,
      lots: deltaHedgeRec.recommendedLots,
      lotSize,
      entryPrice: g.price,
      iv: ivPct,
      expiryDate: `${daysToExpiry} DTE`
    };
    setLegs(prev => [...prev, hedgeLeg]);
    soundService.playExecutionChime();
    setExecutionMessage(`Delta hedge successfully injected: ${deltaHedgeRec.recommendedAction} ${deltaHedgeRec.recommendedLots} lot(s) of ${deltaHedgeRec.recommendedStrike} ${deltaHedgeRec.recommendedType}. Portfolio delta neutralized!`);
    setTimeout(() => setExecutionMessage(null), 5000);
  };

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

  const isDeltaExposed = Math.abs(portfolioGreeks.netDelta) > 0.15;

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
                const newSpot = u === 'NIFTY 50' ? 23346.40 : 49850.20;
                setSpotPrice(newSpot);
                setLegs(templates[0].generateLegs(Math.round(newSpot / 50) * 50));
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

      {/* Automated Delta-Neutral Sentinel Alert Banner */}
      {isDeltaExposed && deltaHedgeRec && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-purple-500/15 border-2 border-amber-500/40 flex flex-wrap items-center justify-between gap-4 shadow-md animate-pulse">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  DELTA-NEUTRAL SENTINEL ACTIVE
                </span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold">
                  |ΣΔ| = {Math.abs(portfolioGreeks.netDelta)} &gt; 0.15 Limit
                </span>
              </div>
              <p className="text-xs text-[var(--text-primary)] font-semibold mt-1">
                {deltaHedgeRec.description}
              </p>
            </div>
          </div>

          <button
            onClick={handleDeltaNeutralize}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all shrink-0 hover:scale-105"
          >
            <Zap className="w-4 h-4" />
            1-Click Delta Neutralize
          </button>
        </div>
      )}

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
                  {tpl.marginBenefit && (
                    <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold mt-1 block">
                      {tpl.marginBenefit}
                    </span>
                  )}
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
                Sensibull™ grade visual payoff curve with interactive Expiry & India VIX sliders
              </span>
            </div>

            {/* Interactive Sliders: Target Date, India VIX, Expiry */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {/* Target Date Slider */}
              <div className="flex items-center gap-2 bg-[var(--bg-tertiary)] px-2.5 py-1 rounded-xl border border-[var(--border-color)]">
                <span className="font-bold text-[var(--text-muted)] flex items-center gap-1 text-[11px]">
                  <Clock className="w-3 h-3" /> Target:
                </span>
                <input
                  type="range"
                  min="0"
                  max={daysToExpiry}
                  value={targetDte}
                  onChange={(e) => setTargetDte(Number(e.target.value))}
                  className="w-16 accent-[var(--icici-orange)] cursor-pointer"
                />
                <span className="font-mono font-extrabold text-[var(--icici-orange)] text-[11px]">
                  {targetDte === 0 ? 'T+0' : `T+${targetDte}d`}
                </span>
              </div>

              {/* India VIX Slider */}
              <div className="flex items-center gap-2 bg-[var(--bg-tertiary)] px-2.5 py-1 rounded-xl border border-[var(--border-color)]">
                <span className="font-bold text-[var(--text-muted)] flex items-center gap-1 text-[11px]">
                  <TrendingUp className="w-3 h-3 text-purple-500" /> VIX:
                </span>
                <input
                  type="range"
                  min="9"
                  max="35"
                  step="0.1"
                  value={ivPct}
                  onChange={(e) => setIvPct(Number(e.target.value))}
                  className="w-16 accent-purple-500 cursor-pointer"
                />
                <span className="font-mono font-extrabold text-purple-600 dark:text-purple-400 text-[11px]">
                  {ivPct}%
                </span>
              </div>

              {/* Expiry Slider */}
              <div className="flex items-center gap-2 bg-[var(--bg-tertiary)] px-2.5 py-1 rounded-xl border border-[var(--border-color)]">
                <span className="font-bold text-[var(--text-muted)] text-[11px]">
                  Expiry:
                </span>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={daysToExpiry}
                  onChange={(e) => {
                    const newDte = Number(e.target.value);
                    setDaysToExpiry(newDte);
                    if (targetDte > newDte) setTargetDte(newDte);
                  }}
                  className="w-16 accent-emerald-500 cursor-pointer"
                />
                <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-[11px]">
                  {daysToExpiry} DTE
                </span>
              </div>
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

          {/* Net Portfolio Greeks Barometer */}
          <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-[var(--text-primary)] flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-500" />
                Net Portfolio Greeks Barometer
              </h4>
              <span className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full ${
                !isDeltaExposed
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse'
              }`}>
                {!isDeltaExposed ? 'DELTA NEUTRAL' : 'DIRECTIONAL SKEW'}
              </span>
            </div>

            <div className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-tertiary)] p-2 rounded-lg border border-[var(--border-color)] flex items-center justify-between">
              <span>ΣΔ = ∑ w_i × Δ_i</span>
              <span>ΣΘ = ∑ w_i × Θ_i</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-[var(--text-secondary)] block">Net Delta (ΣΔ)</span>
                  <span className="text-[9px] text-[var(--text-muted)]">Directional Bias</span>
                </div>
                <span className={`font-mono font-black text-xs ${!isDeltaExposed ? 'text-emerald-500' : 'text-amber-500 font-extrabold'}`}>
                  {portfolioGreeks.netDelta > 0 ? '+' : ''}{portfolioGreeks.netDelta}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-[var(--text-secondary)] block">Net Gamma (ΣΓ)</span>
                  <span className="text-[9px] text-[var(--text-muted)]">Curvature / Accel</span>
                </div>
                <span className="font-mono font-black text-xs text-[var(--text-primary)]">{portfolioGreeks.netGamma}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-[var(--text-secondary)] block">Daily Theta (ΣΘ)</span>
                  <span className="text-[9px] text-[var(--text-muted)]">Time Decay Yield</span>
                </div>
                <span className={`font-mono font-black text-xs ${portfolioGreeks.netTheta >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {portfolioGreeks.netTheta >= 0 ? '+' : ''}₹{portfolioGreeks.netTheta}/day
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-[var(--text-secondary)] block">Net Vega (Σν)</span>
                  <span className="text-[9px] text-[var(--text-muted)]">Per 1% IV Move</span>
                </div>
                <span className="font-mono font-black text-xs text-blue-400">₹{portfolioGreeks.netVega}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] flex items-center justify-between">
              <span className="font-semibold text-blue-700 dark:text-blue-300">Spread Margin Benefit:</span>
              <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400">~65% SEBI Reduction</span>
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

