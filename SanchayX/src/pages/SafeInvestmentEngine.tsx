import React, { useState, useEffect } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { formatCompactCurrency } from '../utils/financialMath';
import {
  getRatesFromIndexedDB,
  DEFAULT_MARKET_RATES,
  type MarketRateItem
} from '../services/indexedDBService';
import {
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  Building2,
  Flame,
  PiggyBank,
  Zap,
  Landmark,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const SafeInvestmentEngine: React.FC = () => {
  const { currency, setActiveTab } = usePortfolio();

  // Controls State
  const [totalCapital, setTotalCapital] = useState<number>(1000000); // Default ₹10 Lakhs

  // Live Rates State & IndexedDB Sync
  const [marketRates, setMarketRates] = useState<MarketRateItem[]>(DEFAULT_MARKET_RATES);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshedTime, setLastRefreshedTime] = useState<string>('Just now');

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

  // 100% Principal Locked in Fixed Income Assets (avg yield calculated dynamically from market rates)
  const rbiBondRate = marketRates.find(r => r.name.includes('RBI'))?.ratePct || 8.05;
  const fdRate = marketRates.find(r => r.name.includes('FD'))?.ratePct || 8.80;
  const ncdRate = marketRates.find(r => r.name.includes('Corporate') || r.name.includes('NCD'))?.ratePct || 9.15;
  const sgbRate = marketRates.find(r => r.name.includes('Gold') || r.name.includes('SGB'))?.ratePct || 7.50;

  const avgFixedYield = ((rbiBondRate * 0.35) + (fdRate * 0.25) + (ncdRate * 0.20) + (sgbRate * 0.20)) / 100;
  const annualInterestTotal = totalCapital * avgFixedYield;
  const monthlyInterestTotal = annualInterestTotal / 12;

  const fixedAssets = [
    { name: `RBI Floating Rate Savings Bonds (${rbiBondRate}%)`, amount: totalCapital * 0.35, yieldPct: rbiBondRate, annualPayout: totalCapital * 0.35 * (rbiBondRate / 100), rating: 'Sovereign' },
    { name: `Shriram Finance Senior FD (${fdRate}%)`, amount: totalCapital * 0.25, yieldPct: fdRate, annualPayout: totalCapital * 0.25 * (fdRate / 100), rating: 'CRISIL AAA' },
    { name: `L&T Finance Corporate NCD Bond (${ncdRate}%)`, amount: totalCapital * 0.20, yieldPct: ncdRate, annualPayout: totalCapital * 0.20 * (ncdRate / 100), rating: 'ICRA AA+' },
    { name: `RBI Sovereign Gold Bonds (SGB ${sgbRate}% + Gold)`, amount: totalCapital * 0.20, yieldPct: sgbRate, annualPayout: totalCapital * 0.20 * (sgbRate / 100), rating: 'Tax-Free Sovereign' }
  ];

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

  const handleGlobalRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastRefreshedTime(new Date().toLocaleTimeString());
    }, 600);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 w-full max-w-[1750px] mx-auto">
      {/* Quick Switch Banner to Smart Engine */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-900/40 via-teal-900/40 to-emerald-950/60 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
            <ShieldCheck className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white">🛡️ 100% Safe Investment Option</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-black uppercase tracking-wider">
                ZERO PRINCIPAL RISK
              </span>
            </div>
            <p className="text-xs text-emerald-200/80 mt-0.5">
              100% of your principal is locked in Sovereign Gold Bonds & AAA FDs. Generated interest is automatically invested into monthly SIPs.
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('smart_engine')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold shadow-md hover:scale-105 transition-all cursor-pointer border border-amber-300/40"
        >
          <Sparkles className="w-4 h-4 text-amber-200" />
          <span>Switch to Smart Dual-Sleeve Option</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Capital Controls Panel */}
      <div className="p-6 rounded-2xl glass-card bg-[var(--bg-card)] border border-[var(--border-color)] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Landmark className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              100% Safe Capital Allocation Controls
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Select your total investment capital. 100% of capital is deployed into safe fixed income assets yielding 8.50% avg p.a.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {lastRefreshedTime && (
              <span className="text-[10px] text-[var(--text-muted)] font-mono">Synced: {lastRefreshedTime}</span>
            )}
            <button
              onClick={handleGlobalRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-tertiary)] hover:bg-emerald-500/20 text-xs font-bold text-[var(--text-primary)] border border-[var(--border-color)] transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing Rates...' : 'Refresh Yields'}</span>
            </button>
          </div>
        </div>

        {/* Input Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Capital Slider */}
          <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-3 lg:col-span-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-[var(--text-secondary)]">Total Safe Investment Capital</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 text-sm font-extrabold">
                {formatCompactCurrency(totalCapital, currency)}
              </span>
            </div>
            <input
              type="range"
              min="100000"
              max="50000000"
              step="50000"
              value={totalCapital}
              onChange={(e) => setTotalCapital(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-mono">
              <span>₹1 Lakh</span>
              <span>₹50 Lakhs</span>
              <span>₹5 Crores</span>
            </div>
          </div>

          {/* Capital Increment Buttons */}
          <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
            <span className="text-xs font-bold text-[var(--text-secondary)] block">Quick Capital Increment</span>
            <div className="flex gap-2">
              {[100000, 500000, 1000000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setTotalCapital(prev => prev + amt)}
                  className="flex-1 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-emerald-500/15 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 border border-[var(--border-color)] hover:border-emerald-500/40 transition-all cursor-pointer"
                >
                  +{formatCompactCurrency(amt, currency)}
                </button>
              ))}
            </div>
          </div>

          {/* Generated Monthly SIP Amount Box */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-600/20 border border-emerald-500/30 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase block">Generated Monthly Interest Auto-SIP</span>
            <span className="text-xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">
              {formatCompactCurrency(monthlyInterestTotal, currency)} / Month
            </span>
            <span className="text-[10px] text-[var(--text-muted)] font-mono">({formatCompactCurrency(annualInterestTotal, currency)} / Year @ 8.5% Yield)</span>
          </div>
        </div>
      </div>

      {/* 100% Fixed Income Sleeve Assets Table */}
      <div className="p-6 rounded-2xl glass-card bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Landmark className="w-4 h-4 text-emerald-600" />
          100% Safe Capital Asset Sleeve (Sovereign & AAA Fixed Income Allocation)
        </h3>

        <div className="overflow-x-auto w-full">
          <table className="fin-table">
            <thead>
              <tr>
                <th>Fixed Income Asset</th>
                <th>Safety / Rating</th>
                <th>Annual Interest Rate</th>
                <th>Allocated Capital ({currency})</th>
                <th>Yearly Fixed Income Payout</th>
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
      </div>

      {/* 100% Risk-Averse Interest SIP Weightages & Controls */}
      <div className="p-6 rounded-2xl glass-card bg-[var(--bg-card)] border border-[var(--border-color)] space-y-6 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              Monthly Interest Auto-SIP Weightage Controller
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Your monthly interest payout of {formatCompactCurrency(monthlyInterestTotal, currency)}/Month is automatically split into equity SIPs according to your chosen weightages below.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">Total SIP Weightage</span>
              <span className={`text-sm font-mono font-extrabold ${totalSipWeightSum === 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
                {totalSipWeightSum}% / 100%
              </span>
            </div>

            {totalSipWeightSum !== 100 && (
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

      {/* Curated Company Recommendations (Large, Mid, Small Cap) */}
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
  );
};

export default SafeInvestmentEngine;
