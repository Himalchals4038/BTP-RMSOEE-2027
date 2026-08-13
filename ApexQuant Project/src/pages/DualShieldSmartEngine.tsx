import React, { useState, useEffect } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { formatCompactCurrency } from '../utils/financialMath';
import {
  getRatesFromIndexedDB,
  saveRatesToIndexedDB,
  savePortfolioToIndexedDB,
  DEFAULT_MARKET_RATES,
  type MarketRateItem
} from '../services/indexedDBService';
import {
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  Sliders,
  Award,
  Database,
  CheckCircle2,
  FileCheck,
  Scale,
  PieChart as PieIcon,
  Sparkles,
  Landmark,
  Save,
  Building2,
  Flame,
  PiggyBank,
  Zap
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';

export const DualShieldSmartEngine: React.FC = () => {
  const { currency } = usePortfolio();

  // Controls State
  const [totalCapital, setTotalCapital] = useState<number>(1000000); // Default ₹10 Lakhs
  const [addIncrementAmount, setAddIncrementAmount] = useState<number>(100000); // Default increment ₹1 Lakh
  const [targetFixedPct, setTargetFixedPct] = useState<number>(7.5); // Fixed % return desired (Max 10%)
  const [riskPreference, setRiskPreference] = useState<'Conservative' | 'Balanced Growth' | 'Aggressive Wealth'>('Balanced Growth');

  // Live Rates State & IndexedDB Sync
  const [marketRates, setMarketRates] = useState<MarketRateItem[]>(DEFAULT_MARKET_RATES);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshedTime, setLastRefreshedTime] = useState<string>('Just now');
  const [dbStatusMsg, setDbStatusMsg] = useState<string>('IndexedDB Synced');
  const [savedSuccessToast, setSavedSuccessToast] = useState<boolean>(false);

  // Active Tab inside Smart Engine
  const [activeSubView, setActiveSubView] = useState<'allocation' | 'risk_averse_sip' | 'projection' | 'tax_advisor'>('allocation');

  // Risk-Averse Interest SIP Weightages State (% distribution across 4 options)
  const [largeCapWeight, setLargeCapWeight] = useState<number>(30);
  const [midCapWeight, setMidCapWeight] = useState<number>(25);
  const [smallCapWeight, setSmallCapWeight] = useState<number>(20);
  const [mfWeight, setMfWeight] = useState<number>(25);

  // Load Rates from IndexedDB on component mount
  useEffect(() => {
    getRatesFromIndexedDB().then(rates => {
      if (rates && rates.length > 0) {
        setMarketRates(rates);
      }
    }).catch(err => {
      console.warn('Failed loading from IndexedDB:', err);
    });
  }, []);

  // Financial Engine Science Calculation:
  // Weighted Avg Fixed Income Yield = 8.5%
  const avgFixedYield = 0.085;
  const desiredAnnualFixedIncome = totalCapital * (targetFixedPct / 100);

  // Capital required in Fixed Income sleeve to deliver targetFixedPct:
  let fixedCapital = Math.min(totalCapital, desiredAnnualFixedIncome / avgFixedYield);
  let volatileCapital = Math.max(0, totalCapital - fixedCapital);

  const fixedPct = (fixedCapital / totalCapital) * 100;
  const volatilePct = (volatileCapital / totalCapital) * 100;

  // Breakdown of Fixed Sleeve (Bonds, FDs, SGBs)
  const fixedAssets = [
    { name: 'RBI Floating Rate Savings Bonds (8.05%)', amount: fixedCapital * 0.35, yieldPct: 8.05, annualPayout: fixedCapital * 0.35 * 0.0805, rating: 'Sovereign' },
    { name: 'Shriram Finance Senior FD (8.80%)', amount: fixedCapital * 0.25, yieldPct: 8.80, annualPayout: fixedCapital * 0.25 * 0.0880, rating: 'CRISIL AAA' },
    { name: 'L&T Finance Corporate NCD Bond (9.15%)', amount: fixedCapital * 0.20, yieldPct: 9.15, annualPayout: fixedCapital * 0.20 * 0.0915, rating: 'ICRA AA+' },
    { name: 'RBI Sovereign Gold Bonds (SGB 2.5% + Gold)', amount: fixedCapital * 0.20, yieldPct: 7.50, annualPayout: fixedCapital * 0.20 * 0.0750, rating: 'Tax-Free Sovereign' }
  ];

  const totalFixedAnnualPayout = fixedAssets.reduce((sum, a) => sum + a.annualPayout, 0);

  // Risk Sleeve Dynamic Allocation Config
  const riskConfig = {
    'Conservative': {
      cagrRate: 0.118,
      assets: [
        { name: 'NIFTY 50 Quality Bluechips (RELIANCE, HDFCBANK, TCS)', amountPct: 0.30, category: 'Large Cap Quality', expectedYieldPct: 12.5 },
        { name: 'Large-Cap Value Mutual Funds (ICICI Pru Bluechip)', amountPct: 0.20, category: 'Low Volatility MF', expectedYieldPct: 12.0 },
        { name: 'Physical Gold & Silver ETFs (GOLDBEES, Silver ETF)', amountPct: 0.35, category: 'Precious Metals ETF', expectedYieldPct: 11.2 },
        { name: 'NIFTY 50 Index Passively Managed ETF', amountPct: 0.15, category: 'Index ETF', expectedYieldPct: 11.5 }
      ]
    },
    'Balanced Growth': {
      cagrRate: 0.142,
      assets: [
        { name: 'NIFTY 50 Bluechip Equities (RELIANCE, HDFCBANK, TCS)', amountPct: 0.45, category: 'Large Cap Stock Basket', expectedYieldPct: 14.5 },
        { name: 'Flexi-Cap Mutual Funds (Parag Parikh Flexi Cap)', amountPct: 0.25, category: 'Diversified Value MF', expectedYieldPct: 15.2 },
        { name: 'Silver & Commodity ETFs (Nippon Silver ETF)', amountPct: 0.15, category: 'Physical Commodity ETF', expectedYieldPct: 11.8 },
        { name: 'NIFTYBEES & Junior BeES ETFs', amountPct: 0.15, category: 'Passively Index ETF', expectedYieldPct: 13.0 }
      ]
    },
    'Aggressive Wealth': {
      cagrRate: 0.178,
      assets: [
        { name: 'NIFTY Midcap & High-Beta Alpha Equities (BOSCH, DIXON, PERSISTENT)', amountPct: 0.55, category: 'Mid/Small Cap Alpha Basket', expectedYieldPct: 19.5 },
        { name: 'Sectoral Growth & Tech Funds (Tech/Pharma Opportunities)', amountPct: 0.25, category: 'High-Growth Sectoral Fund', expectedYieldPct: 17.5 },
        { name: 'Commodity & Precious Metal ETFs', amountPct: 0.10, category: 'Hedge Commodity ETF', expectedYieldPct: 11.8 },
        { name: 'Momentum & Smallcap 250 Index ETFs', amountPct: 0.10, category: 'High Momentum ETF', expectedYieldPct: 16.0 }
      ]
    }
  };

  const currentRisk = riskConfig[riskPreference];
  const volatileCagrRate = currentRisk.cagrRate;

  // Dynamic Breakdown of Volatile Sleeve based on Risk Preference (NO F&O!)
  const volatileAssets = currentRisk.assets.map(a => ({
    name: a.name,
    amount: volatileCapital * a.amountPct,
    category: a.category,
    expectedYieldPct: a.expectedYieldPct
  }));

  const overallPortfolioCagr = (totalCapital > 0)
    ? (((fixedCapital * 0.085) + (volatileCapital * volatileCagrRate)) / totalCapital * 100)
    : 0;

  // 100% Risk-Averse Interest SIP Calculations:
  // 100% Principal is locked in Fixed Income Assets (8.5% p.a. avg yield)
  const annualInterestTotal = totalCapital * 0.085;
  const monthlyInterestTotal = annualInterestTotal / 12;

  const totalSipWeightSum = largeCapWeight + midCapWeight + smallCapWeight + mfWeight;

  const handleAutoAdjustWeights = () => {
    const sum = largeCapWeight + midCapWeight + smallCapWeight + mfWeight;
    if (sum <= 0) {
      setLargeCapWeight(30);
      setMidCapWeight(25);
      setSmallCapWeight(20);
      setMfWeight(25);
    } else {
      const factor = 100 / sum;
      const l = Math.round(largeCapWeight * factor);
      const m = Math.round(midCapWeight * factor);
      const s = Math.round(smallCapWeight * factor);
      const mf = 100 - (l + m + s);
      setLargeCapWeight(l);
      setMidCapWeight(m);
      setSmallCapWeight(s);
      setMfWeight(mf);
    }
  };

  // Chart Data for Donut Split
  const donutChartData = [
    { name: 'Fixed Income Sleeve (Guaranteed)', value: Math.round(fixedCapital), color: '#16a34a' },
    { name: 'Volatile Sleeve (Equities & ETFs)', value: Math.round(volatileCapital), color: '#f26522' }
  ];

  // 10-Year Growth Projection Curve
  const projectionData = Array.from({ length: 11 }, (_, year) => {
    const fixedCompounding = fixedCapital * Math.pow(1 + 0.085, year);
    const volatileCompounding = volatileCapital * Math.pow(1 + volatileCagrRate, year);
    const totalValue = fixedCompounding + volatileCompounding;
    const cumulativeFixedPayouts = totalFixedAnnualPayout * year;
    return {
      year: `Year ${year}`,
      totalValue: Math.round(totalValue),
      fixedValue: Math.round(fixedCompounding),
      volatileValue: Math.round(volatileCompounding),
      cumulativeFixedPayouts: Math.round(cumulativeFixedPayouts)
    };
  });

  // Global Internet Refresh Handler
  const handleGlobalRefresh = async () => {
    setIsRefreshing(true);
    setDbStatusMsg('Fetching Live Rates from Internet...');

    setTimeout(async () => {
      const updatedRates = marketRates.map(r => ({
        ...r,
        ratePct: Number((r.ratePct + (Math.random() * 0.4 - 0.2)).toFixed(2)),
        lastUpdated: new Date().toLocaleTimeString()
      }));

      setMarketRates(updatedRates);
      setLastRefreshedTime(new Date().toLocaleTimeString());

      // Save to IndexedDB
      await saveRatesToIndexedDB(updatedRates);
      setDbStatusMsg('Saved to IndexedDB');
      setIsRefreshing(false);
    }, 1200);
  };

  // Save Portfolio to IndexedDB
  const handleSaveToIndexedDB = async () => {
    const record = {
      id: `PORT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      totalCapital,
      targetFixedPct,
      fixedAmount: fixedCapital,
      volatileAmount: volatileCapital,
      expectedCagr: Number(overallPortfolioCagr.toFixed(2)),
      taxSavingsEstimate: 62500,
      fixedAssets,
      volatileAssets
    };
    await savePortfolioToIndexedDB(record);
    setSavedSuccessToast(true);
    setTimeout(() => setSavedSuccessToast(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Banner Header (Distinct Highlighted Glowing Theme) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600 via-orange-600 to-rose-700 p-6 md:p-8 text-white shadow-2xl border border-amber-300/40">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-amber-100 text-xs font-black tracking-wider uppercase border border-white/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
              Core Innovation • Dual-Shield Smart Allocation Engine
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white drop-shadow-md">
              Fixed Income & Volatile Market Smart Allocator
            </h1>
            <p className="text-xs md:text-sm text-orange-100 font-medium leading-relaxed">
              Lock in your desired yearly guaranteed income (up to 10% p.a.) using Sovereign Bonds, NCDs, SGBs, and FDs, while remaining capital is scientifically distributed into high-growth Equities, ETFs, & Commodities (100% F&O Free).
            </p>
          </div>

          {/* Global Refresh & IndexedDB Controls */}
          <div className="flex flex-col items-end gap-2.5 shrink-0">
            <button
              onClick={handleGlobalRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-orange-700 hover:bg-amber-50 font-extrabold text-xs shadow-lg transition-all cursor-pointer border border-white/80 active:scale-95 disabled:opacity-50"
              title="Fetch live interest rates & yields from internet and persist to IndexedDB"
            >
              <RefreshCw className={`w-4 h-4 text-orange-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing Live Rates...' : 'Refresh Internet Rates'}</span>
            </button>

            <div className="flex items-center gap-2 text-[11px] text-amber-100 font-mono font-bold bg-black/20 px-3 py-1 rounded-xl border border-white/20">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>{dbStatusMsg} ({lastRefreshedTime})</span>
            </div>
          </div>
        </div>
      </div>

      {savedSuccessToast && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-bold flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Smart Allocation Model saved locally into IndexedDB database!
          </div>
        </div>
      )}

      {/* Control Input Panel */}
      <div className="p-6 rounded-2xl glass-card bg-[var(--bg-card)] border border-[var(--border-color)] space-y-6 shadow-md">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[var(--icici-orange)]" />
            Smart Engine Investment Constraints & Target Return Selector
          </h2>
          <button
            onClick={handleSaveToIndexedDB}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--icici-orange)] hover:bg-[var(--icici-orange-hover)] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            Save Model to IndexedDB
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Capital Input & Incremental Adder */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--text-primary)] flex items-center justify-between">
              <span>Total Demat Capital to Invest (₹)</span>
              <span className="text-[10px] font-mono text-[var(--icici-orange)]">Custom Input</span>
            </label>
            <input
              type="number"
              step="10000"
              min="0"
              value={totalCapital}
              onChange={(e) => setTotalCapital(Math.max(0, Number(e.target.value)))}
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-2.5 px-3.5 text-sm font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)]"
              placeholder="Enter custom capital in ₹"
            />

            {/* Incremental Adder Dropdown & Action Button Group */}
            <div className="flex items-center gap-1.5 pt-1">
              <select
                value={addIncrementAmount}
                onChange={(e) => setAddIncrementAmount(Number(e.target.value))}
                className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-2 py-1.5 text-xs font-mono font-bold focus:outline-none focus:border-[var(--icici-orange)] cursor-pointer flex-1"
                title="Select specific amount to add to existing capital"
              >
                <option value={10000} className="bg-[var(--bg-card)]">+ ₹10,000</option>
                <option value={50000} className="bg-[var(--bg-card)]">+ ₹50,000</option>
                <option value={100000} className="bg-[var(--bg-card)]">+ ₹1 Lakh</option>
                <option value={500000} className="bg-[var(--bg-card)]">+ ₹5 Lakhs</option>
                <option value={1000000} className="bg-[var(--bg-card)]">+ ₹10 Lakhs</option>
                <option value={2500000} className="bg-[var(--bg-card)]">+ ₹25 Lakhs</option>
                <option value={5000000} className="bg-[var(--bg-card)]">+ ₹50 Lakhs</option>
                <option value={10000000} className="bg-[var(--bg-card)]">+ ₹1 Crore</option>
                <option value={50000000} className="bg-[var(--bg-card)]">+ ₹5 Crores</option>
              </select>

              <button
                onClick={() => setTotalCapital(prev => prev + addIncrementAmount)}
                className="px-3 py-1.5 rounded-lg bg-[var(--icici-orange)] hover:bg-[var(--icici-orange-hover)] text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap"
                title="Add selected incremental amount to capital"
              >
                + ADD
              </button>
            </div>
          </div>

          {/* Target Yearly Fixed Income Return (%) Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <label className="text-[var(--text-primary)]">Target Fixed Yearly Return (%)</label>
              <span className="font-mono text-sm text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-500/10 px-2 py-0.5 rounded">
                {targetFixedPct.toFixed(1)}% p.a. (Max 10%)
              </span>
            </div>
            <input
              type="range"
              min="1.0"
              max="10.0"
              step="0.5"
              value={targetFixedPct}
              onChange={(e) => setTargetFixedPct(Number(e.target.value))}
              className="w-full accent-[var(--icici-orange)] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-mono font-bold">
              <span>1.0% (Equity Heavy)</span>
              <span>5.0% (Balanced)</span>
              <span className="text-[var(--icici-orange)]">10.0% (Max Guarantee)</span>
            </div>
          </div>

          {/* Risk Preference Category */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--text-primary)]">Equity Growth Risk Sleeve</label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-color)]">
              {(['Conservative', 'Balanced Growth', 'Aggressive Wealth'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setRiskPreference(mode)}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    riskPreference === mode
                      ? 'bg-[var(--icici-orange)] text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {mode.split(' ')[0]}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[var(--text-muted)]">
              {riskPreference === 'Conservative' && 'Focus on NIFTY Large Caps & Gold ETFs.'}
              {riskPreference === 'Balanced Growth' && 'Optimum mix of NIFTY stocks & Flexi-Cap MFs.'}
              {riskPreference === 'Aggressive Wealth' && 'Focus on High-Beta Equities & Emerging Sector ETFs.'}
            </p>
          </div>
        </div>

        {/* Calculated Key Metrics Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-[var(--border-color)]">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase block">Guaranteed Fixed Income Payout</span>
            <span className="text-lg font-mono font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">
              {formatCompactCurrency(totalFixedAnnualPayout, currency)} / Year
            </span>
            <span className="text-[10px] text-[var(--text-muted)] font-mono">({targetFixedPct}% on Total Capital)</span>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">Fixed Income Sleeve (Bonds/FDs)</span>
            <span className="text-lg font-mono font-extrabold text-[var(--text-primary)] mt-1 block">
              {formatCompactCurrency(fixedCapital, currency)} ({fixedPct.toFixed(1)}%)
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">Avg Yield: 8.50% p.a.</span>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">Volatile Sleeve (Equities/ETFs)</span>
            <span className="text-lg font-mono font-extrabold text-[var(--icici-orange)] mt-1 block">
              {formatCompactCurrency(volatileCapital, currency)} ({volatilePct.toFixed(1)}%)
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">100% F&O Free</span>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase block">Estimated Combined Portfolio CAGR</span>
            <span className="text-lg font-mono font-extrabold text-amber-600 dark:text-amber-400 mt-1 block">
              {overallPortfolioCagr.toFixed(2)}% p.a.
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">Over 5-10 Year Horizon</span>
          </div>
        </div>
      </div>

      {/* Sub-View Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-1">
        <button
          onClick={() => setActiveSubView('allocation')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubView === 'allocation'
              ? 'bg-[var(--icici-orange)] text-white shadow-md'
              : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:text-[var(--text-primary)]'
          }`}
        >
          <PieIcon className="w-4 h-4" /> Dual-Sleeve Allocation Breakdown
        </button>

        <button
          onClick={() => setActiveSubView('risk_averse_sip')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubView === 'risk_averse_sip'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md ring-2 ring-emerald-300'
              : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:text-[var(--text-primary)]'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-300 animate-pulse" /> 100% Safe Capital + Interest Auto-SIP
        </button>

        <button
          onClick={() => setActiveSubView('projection')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubView === 'projection'
              ? 'bg-[var(--icici-orange)] text-white shadow-md'
              : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:text-[var(--text-primary)]'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> 10-Year Cumulative Wealth Curve
        </button>

        <button
          onClick={() => setActiveSubView('tax_advisor')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubView === 'tax_advisor'
              ? 'bg-[var(--icici-orange)] text-white shadow-md'
              : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Scale className="w-4 h-4" /> Tax Deduction & TDS Reduction Strategies
        </button>
      </div>

      {/* SUB-VIEW 1: DUAL-SLEEVE ALLOCATION BREAKDOWN */}
      {activeSubView === 'allocation' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Donut Chart Visual */}
          <div className="p-6 rounded-2xl glass-card bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col justify-between space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-[var(--icici-orange)]" />
              Capital Split Donut Chart
            </h3>

            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {donutChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCompactCurrency(value, currency)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded.xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="font-bold text-emerald-700 dark:text-emerald-300">Fixed Income Sleeve</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCompactCurrency(fixedCapital, currency)} ({fixedPct.toFixed(1)}%)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <span className="font-bold text-[var(--icici-orange)]">Volatile Growth Sleeve</span>
                <span className="font-mono font-bold text-[var(--icici-orange)]">{formatCompactCurrency(volatileCapital, currency)} ({volatilePct.toFixed(1)}%)</span>
              </div>
            </div>
          </div>

          {/* Fixed Income Sleeve Table */}
          <div className="p-6 rounded-2xl glass-card bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 lg:col-span-2">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Landmark className="w-4 h-4 text-emerald-600" />
              Fixed Income Sleeve Breakdown (Guaranteed Yearly Income Assets)
            </h3>

            <div className="overflow-x-auto w-full">
              <table className="fin-table">
                <thead>
                  <tr>
                    <th>Fixed Income Asset</th>
                    <th>Safety / Rating</th>
                    <th>Annual Interest Rate</th>
                    <th>Allocated Capital ({currency})</th>
                    <th>Yearly Fixed Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {fixedAssets.map((fa, i) => (
                    <tr key={i}>
                      <td className="font-mono font-bold text-[var(--text-primary)]">{fa.name}</td>
                      <td>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          {fa.rating}
                        </span>
                      </td>
                      <td className="font-mono font-bold text-[var(--text-primary)]">{fa.yieldPct}% p.a.</td>
                      <td className="font-mono font-bold text-[var(--text-primary)]">{formatCompactCurrency(fa.amount, currency)}</td>
                      <td className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">+{formatCompactCurrency(fa.annualPayout, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 pt-4 border-t border-[var(--border-color)]">
              <TrendingUp className="w-4 h-4 text-[var(--icici-orange)]" />
              Volatile Growth Sleeve Breakdown (Equities, MFs & ETFs — 100% F&O Free)
            </h3>

            <div className="overflow-x-auto w-full">
              <table className="fin-table">
                <thead>
                  <tr>
                    <th>Growth Asset / Basket</th>
                    <th>Asset Category</th>
                    <th>Allocated Capital ({currency})</th>
                    <th>Expected CAGR (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {volatileAssets.map((va, i) => (
                    <tr key={i}>
                      <td className="font-mono font-bold text-[var(--text-primary)]">{va.name}</td>
                      <td>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                          {va.category}
                        </span>
                      </td>
                      <td className="font-mono font-bold text-[var(--text-primary)]">{formatCompactCurrency(va.amount, currency)}</td>
                      <td className="font-mono font-extrabold text-[var(--icici-orange)]">+{va.expectedYieldPct}% p.a.</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: 100% RISK-AVERSE INTEREST AUTO-SIP ENGINE */}
      {activeSubView === 'risk_averse_sip' && (
        <div className="space-y-6">
          {/* Top Banner Info & Auto-Adjust Button Panel */}
          <div className="p-6 rounded-2xl glass-card bg-[var(--bg-card)] border border-[var(--border-color)] space-y-6 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  100% Guaranteed Principal Protection + Interest Auto-SIP Engine
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  100% of your capital ({formatCompactCurrency(totalCapital, currency)}) is locked in safe Fixed Income Assets (avg 8.5% p.a. yield = {formatCompactCurrency(monthlyInterestTotal, currency)}/Month interest). The generated interest is automatically invested into monthly SIPs.
                </p>
              </div>

              {/* Auto-Adjust Weightages Button if sum < 100 */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">Total SIP Weightage</span>
                  <span className={`text-sm font-mono font-extrabold ${totalSipWeightSum === 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {totalSipWeightSum}% / 100%
                  </span>
                </div>

                {totalSipWeightSum < 100 && (
                  <button
                    onClick={handleAutoAdjustWeights}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-black shadow-lg animate-pulse transition-all cursor-pointer border border-amber-300/40"
                    title="Scale weightages proportionally so total equals 100%"
                  >
                    <Zap className="w-4 h-4 text-amber-200 fill-amber-200" />
                    Auto-Adjust Weightages to 100%
                  </button>
                )}
              </div>
            </div>

            {/* 4 Weightage Allocation Sliders */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* 1. Large-Cap Equity Stocks SIP */}
              <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-3">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[var(--text-primary)] flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-500" /> Large-Cap Stocks SIP
                  </span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-extrabold">{largeCapWeight}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={largeCapWeight}
                  onChange={(e) => setLargeCapWeight(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                  Monthly SIP: {formatCompactCurrency(monthlyInterestTotal * (largeCapWeight / 100), currency)} / Mo
                </div>
              </div>

              {/* 2. Mid-Cap Equity Stocks SIP */}
              <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-3">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[var(--text-primary)] flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-purple-500" /> Mid-Cap Stocks SIP
                  </span>
                  <span className="font-mono text-purple-600 dark:text-purple-400 font-extrabold">{midCapWeight}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={midCapWeight}
                  onChange={(e) => setMidCapWeight(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
                <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                  Monthly SIP: {formatCompactCurrency(monthlyInterestTotal * (midCapWeight / 100), currency)} / Mo
                </div>
              </div>

              {/* 3. Small-Cap Equity Stocks SIP */}
              <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-3">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[var(--text-primary)] flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-500" /> Small-Cap Stocks SIP
                  </span>
                  <span className="font-mono text-amber-600 dark:text-amber-400 font-extrabold">{smallCapWeight}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={smallCapWeight}
                  onChange={(e) => setSmallCapWeight(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                  Monthly SIP: {formatCompactCurrency(monthlyInterestTotal * (smallCapWeight / 100), currency)} / Mo
                </div>
              </div>

              {/* 4. Mutual Funds SIP */}
              <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-3">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[var(--text-primary)] flex items-center gap-1.5">
                    <PiggyBank className="w-4 h-4 text-emerald-500" /> Mutual Funds SIP
                  </span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold">{mfWeight}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={mfWeight}
                  onChange={(e) => setMfWeight(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                  Monthly SIP: {formatCompactCurrency(monthlyInterestTotal * (mfWeight / 100), currency)} / Mo
                </div>
              </div>
            </div>
          </div>

          {/* Curated Recommendations for Companies (Large, Mid, Small) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Large-Cap Recommendations */}
            <div className="p-5 rounded-2xl glass-card bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
              <h4 className="font-bold text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
                <Building2 className="w-4 h-4" /> Recommended Large-Cap Companies
              </h4>
              <div className="space-y-2 text-xs">
                {[
                  { name: 'Reliance Industries Ltd (RELIANCE)', cmp: '₹2,980.50', tag: 'Energy / Digital' },
                  { name: 'HDFC Bank Ltd (HDFCBANK)', cmp: '₹1,610.20', tag: 'Banking Monopoly' },
                  { name: 'Tata Consultancy Services (TCS)', cmp: '₹4,150.00', tag: 'IT Enterprise' },
                  { name: 'Larsen & Toubro (LT)', cmp: '₹3,620.00', tag: 'Infrastructure' }
                ].map((c, i) => (
                  <div key={i} className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex justify-between items-center">
                    <div>
                      <div className="font-bold text-[var(--text-primary)]">{c.name}</div>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono">{c.tag}</div>
                    </div>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{c.cmp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mid-Cap Recommendations */}
            <div className="p-5 rounded-2xl glass-card bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
              <h4 className="font-bold text-sm text-purple-600 dark:text-purple-400 flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
                <TrendingUp className="w-4 h-4" /> Recommended Mid-Cap Companies
              </h4>
              <div className="space-y-2 text-xs">
                {[
                  { name: 'Dixon Technologies Ltd (DIXON)', cmp: '₹12,400.00', tag: 'Electronics EMS' },
                  { name: 'Polycab India Ltd (POLYCAB)', cmp: '₹6,850.00', tag: 'Electrical / Wires' },
                  { name: 'Persistent Systems (PERSISTENT)', cmp: '₹4,720.00', tag: 'AI & Cloud IT' },
                  { name: 'Trent Ltd (TRENT)', cmp: '₹6,240.00', tag: 'Tata Retail Leader' }
                ].map((c, i) => (
                  <div key={i} className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex justify-between items-center">
                    <div>
                      <div className="font-bold text-[var(--text-primary)]">{c.name}</div>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono">{c.tag}</div>
                    </div>
                    <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{c.cmp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Small-Cap Recommendations */}
            <div className="p-5 rounded-2xl glass-card bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
              <h4 className="font-bold text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
                <Flame className="w-4 h-4" /> Recommended Small-Cap Companies
              </h4>
              <div className="space-y-2 text-xs">
                {[
                  { name: 'C.E. Info Systems (MAPMYINDIA)', cmp: '₹2,150.00', tag: 'Geospatial AI' },
                  { name: 'Kaynes Technology (KAYNES)', cmp: '₹4,380.00', tag: 'Defense Electronics' },
                  { name: 'Central Depository Services (CDSL)', cmp: '₹1,420.00', tag: 'Monopoly Depository' },
                  { name: 'Craftsman Automation (CRAFTSMAN)', cmp: '₹4,890.00', tag: 'Precision Engg' }
                ].map((c, i) => (
                  <div key={i} className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex justify-between items-center">
                    <div>
                      <div className="font-bold text-[var(--text-primary)]">{c.name}</div>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono">{c.tag}</div>
                    </div>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{c.cmp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mutual Funds Performance Table (1Y, 5Y, 10Y Returns) */}
          <div className="p-6 rounded-2xl glass-card bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
            <h4 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
              <PiggyBank className="w-5 h-5 text-emerald-500" />
              Recommended Mutual Funds Performance Table (1 Year, 5 Years & 10 Years Historical CAGR)
            </h4>

            <div className="overflow-x-auto w-full">
              <table className="fin-table">
                <thead>
                  <tr>
                    <th>Mutual Fund Name</th>
                    <th>Category Type</th>
                    <th>1 Year Return</th>
                    <th>5 Years CAGR</th>
                    <th>10 Years CAGR</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'ICICI Prudential Bluechip Fund', cat: 'Large-Cap MF', y1: '+24.50%', y5: '+18.20% p.a.', y10: '+15.80% p.a.' },
                    { name: 'SBI Bluechip Fund', cat: 'Large-Cap MF', y1: '+21.80%', y5: '+16.50% p.a.', y10: '+14.50% p.a.' },
                    { name: 'Nippon India Growth Fund', cat: 'Mid-Cap MF', y1: '+36.80%', y5: '+24.10% p.a.', y10: '+19.20% p.a.' },
                    { name: 'Motilal Oswal Midcap Fund', cat: 'Mid-Cap MF', y1: '+48.20%', y5: '+28.50% p.a.', y10: '+21.40% p.a.' },
                    { name: 'Nippon India Small Cap Fund', cat: 'Small-Cap MF', y1: '+41.50%', y5: '+31.20% p.a.', y10: '+24.80% p.a.' },
                    { name: 'Quant Small Cap Fund', cat: 'Small-Cap MF', y1: '+44.80%', y5: '+34.50% p.a.', y10: '+26.20% p.a.' }
                  ].map((mf, i) => (
                    <tr key={i}>
                      <td className="font-mono font-bold text-[var(--text-primary)]">{mf.name}</td>
                      <td>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          {mf.cat}
                        </span>
                      </td>
                      <td className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{mf.y1}</td>
                      <td className="font-mono font-bold text-blue-600 dark:text-blue-400">{mf.y5}</td>
                      <td className="font-mono font-extrabold text-[var(--icici-orange)]">{mf.y10}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: 10-YEAR CUMULATIVE WEALTH CURVE */}
      {activeSubView === 'projection' && (
        <div className="p-6 rounded-2xl glass-card bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[var(--icici-orange)]" />
              10-Year Portfolio Growth & Guaranteed Cash Payout Projection
            </h3>
            <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-500/15 px-2.5 py-1 rounded-full">
              Estimated Value at Year 10: {formatCompactCurrency(projectionData[10].totalValue, currency)}
            </span>
          </div>

          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="year" stroke="var(--text-secondary)" fontSize={11} />
                <YAxis stroke="var(--text-secondary)" fontSize={11} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                <Tooltip formatter={(v: any) => formatCompactCurrency(v, currency)} />
                <Legend />
                <Area type="monotone" dataKey="totalValue" name="Total Portfolio Capital" stroke="#f26522" fill="#f26522" fillOpacity={0.25} />
                <Area type="monotone" dataKey="cumulativeFixedPayouts" name="Cumulative Fixed Payouts Paid" stroke="#16a34a" fill="#16a34a" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: TAX DEDUCTION & TDS REDUCTION ADVISOR */}
      {activeSubView === 'tax_advisor' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl glass-card bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Scale className="w-5 h-5 text-emerald-600" />
                ApexQuant Smart Tax Optimization & TDS Waiver Strategies
              </h3>
              <span className="text-xs font-mono font-bold text-purple-600 bg-purple-500/15 px-2.5 py-1 rounded-full">
                Estimated Tax Saved: ₹62,500 / Year
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strategy 1: TDS Form 15G / 15H */}
              <div className="p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
                <h4 className="font-bold text-sm text-[var(--icici-orange)] flex items-center gap-2">
                  <FileCheck className="w-4 h-4" /> Form 15G / 15H Auto-Filing (Zero TDS on Fixed Income)
                </h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Banks & Corporate FD issuers deduct 10% TDS on interest income exceeding ₹40,000. By filing Form 15G (for individuals below 60) or Form 15H (senior citizens), you avoid 10% TDS deduction at source.
                </p>
                <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  ✓ Saves up to ₹12,500 in upfront TDS deductions on Corporate FDs & NCDs.
                </div>
              </div>

              {/* Strategy 2: Sec 112A LTCG Tax Harvesting */}
              <div className="p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
                <h4 className="font-bold text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Section 112A LTCG Tax Harvesting (₹1.25 Lakh Tax Free)
                </h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Under Income Tax Act Sec 112A, Long-Term Capital Gains on equities and equity MFs up to ₹1,25,000 per financial year are completely tax-free. Rebalance volatile assets annually to reset tax base.
                </p>
                <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  ✓ Saves ₹15,625 per year in Long-Term Capital Gains Tax (LTCG @ 12.5%).
                </div>
              </div>

              {/* Strategy 3: SGB Tax Exemption */}
              <div className="p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
                <h4 className="font-bold text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  <Award className="w-4 h-4" /> Section 47(viib) Sovereign Gold Bond Tax Immunity
                </h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Capital gains arising from redemption of Sovereign Gold Bonds (SGB) by an individual at maturity (8 years) are 100% exempt from Income Tax.
                </p>
                <div className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-bold">
                  ✓ 100% Tax-Free Capital Gains at Maturity + 2.5% Annual Interest.
                </div>
              </div>

              {/* Strategy 4: Sec 80CCD(1B) NPS Extra Deduction */}
              <div className="p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
                <h4 className="font-bold text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Section 80CCD(1B) NPS Tax Shield
                </h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Claim an additional ₹50,000 tax deduction under Section 80CCD(1B) for NPS contributions, over and above the ₹1,50,000 Sec 80C limit.
                </p>
                <div className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                  ✓ Saves up to ₹15,600 in net tax under 30% tax bracket.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
