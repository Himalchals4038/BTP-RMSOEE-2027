import React, { useState } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { CURRENCY_MAP } from '../../utils/financialMath';
import type { CurrencyCode } from '../../utils/financialMath';
import {
  TrendingUp,
  Radio,
  Globe,
  Coins,
  Search,
  Sun,
  Moon,
  ChevronDown,
  HelpCircle,
  UserCheck,
  RefreshCw,
  User,
  KeyRound,
  ShieldCheck,
  LogOut,
  X
} from 'lucide-react';

import {
  getStocksFromIndexedDB,
  type StockItemRecord
} from '../../services/indexedDBService';

export const Header: React.FC = () => {
  const {
    benchmark,
    setBenchmark,
    currency,
    setCurrency,
    isLiveApi,
    toggleApiMode,
    theme,
    toggleTheme,
    setActiveTab,
    setActiveSubTab,
    currentUser,
    setActiveUserModal,
    logoutUser
  } = usePortfolio();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [stocksMasterList, setStocksMasterList] = useState<StockItemRecord[]>([]);

  // Load stocks master list from IndexedDB on component mount
  React.useEffect(() => {
    getStocksFromIndexedDB().then(data => {
      if (data && data.length > 0) {
        setStocksMasterList(data);
      }
    }).catch(err => {
      console.warn('Failed loading stocks from IndexedDB:', err);
    });
  }, []);

  const cleanQuery = searchQuery.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  const quickSearchResults = stocksMasterList.filter(item => {
    if (!cleanQuery) return false;
    const cleanTicker = item.ticker.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanName = item.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanSector = item.sector.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanIndex = item.index.toLowerCase().replace(/[^a-z0-9]/g, '');

    return (
      cleanTicker.includes(cleanQuery) ||
      cleanName.includes(cleanQuery) ||
      cleanSector.includes(cleanQuery) ||
      cleanIndex.includes(cleanQuery)
    );
  });

  return (
    <header className="glass-header sticky top-0 z-40 px-4 lg:px-6 py-2.5 flex flex-col gap-2 w-full text-white shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 max-w-[1750px] mx-auto w-full">
        {/* Brand Identity - ICICI Direct Style */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-9 h-9 rounded-full bg-white text-[#d32f2f] flex items-center justify-center font-black text-xl italic shadow-md border-2 border-orange-400 shrink-0">
              i
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-white italic drop-shadow-sm">
                  Apex<span className="text-amber-200 font-normal">Quant</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/20 text-white border border-white/30 tracking-wider">
                  DIRECT
                </span>
              </div>
              <p className="text-[10px] text-orange-100 font-medium tracking-wide">INSTITUTIONAL QUANT OS</p>
            </div>
          </div>

          {/* 2-Line Block Layout for Index Tickers (NIFTY 50 & S&P 500) */}
          <div className="hidden xl:flex items-center gap-2.5 ml-3 border-l border-white/20 pl-3">
            {/* NIFTY 50 2-Line Block Pill */}
            <div className="bg-white/95 dark:bg-slate-900 rounded-lg px-3 py-1 text-slate-900 dark:text-white shadow-md border border-white/40 flex flex-col justify-center leading-tight min-w-[140px]">
              <div className="flex items-center justify-between gap-2 text-xs font-black">
                <span className="text-[10px] text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">NIFTY 50</span>
                <span className="font-mono text-xs font-extrabold text-slate-900 dark:text-white">24,520.40</span>
              </div>
              <div className="flex items-center justify-end gap-1 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>+185.30 (+0.76%)</span>
              </div>
            </div>

            {/* S&P 500 2-Line Block Pill */}
            <div className="bg-white/95 dark:bg-slate-900 rounded-lg px-3 py-1 text-slate-900 dark:text-white shadow-md border border-white/40 flex flex-col justify-center leading-tight min-w-[140px]">
              <div className="flex items-center justify-between gap-2 text-xs font-black">
                <span className="text-[10px] text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">S&P 500</span>
                <span className="font-mono text-xs font-extrabold text-slate-900 dark:text-white">5,540.20</span>
              </div>
              <div className="flex items-center justify-end gap-1 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>+32.10 (+0.58%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Expanded Relative Search Bar (Accessible NIFTY 50 & S&P 500 Stocks) */}
        <div className="relative flex-1 max-w-sm sm:max-w-md md:max-w-lg lg:max-w-[440px] mx-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search NIFTY 50 & S&P 500 Stocks, Funds, Indices..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              onBlur={() => setTimeout(() => setShowSearchDropdown(false), 250)}
              className="w-full bg-black/25 hover:bg-black/35 text-white placeholder-orange-100/80 border border-white/40 rounded-xl py-2 pl-3.5 pr-9 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-300 focus:bg-black/50 transition-all shadow-inner"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="w-4 h-4 rounded-full bg-white text-[#d32f2f] hover:bg-orange-100 font-extrabold flex items-center justify-center absolute right-2.5 top-2.5 shadow-xs cursor-pointer"
                title="Clear Search"
              >
                <X className="w-3 h-3 stroke-[3]" />
              </button>
            ) : (
              <Search className="w-4 h-4 text-orange-100 absolute right-2.5 top-2.5 pointer-events-none" />
            )}
          </div>

          {/* Expanded Autocomplete Search Results with IndexedDB Stock Master */}
          {showSearchDropdown && quickSearchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 py-1 overflow-hidden max-h-80 overflow-y-auto">
              <div className="px-3 py-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span>Matching NIFTY 50 & S&P 500 Assets ({quickSearchResults.length})</span>
                <span className="text-[9px] text-emerald-500 font-mono">IndexedDB Ready</span>
              </div>
              {quickSearchResults.map((res) => (
                <div
                  key={res.ticker}
                  onMouseDown={() => {
                    setActiveSubTab('place_order');
                    setSearchQuery('');
                  }}
                  className="px-3.5 py-2 text-xs hover:bg-orange-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between transition-colors border-b border-slate-50 dark:border-slate-800/50 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-orange-500/15 text-[var(--icici-orange)] font-mono border border-orange-500/30">
                      {res.index}
                    </span>
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <span className="font-mono">{res.ticker}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">({res.name})</span>
                      </div>
                      <div className="text-[10px] text-slate-400">{res.sector}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-bold text-slate-900 dark:text-white">
                      {res.index === 'NIFTY 50' ? '₹' : '$'}{res.price.toLocaleString()}
                    </div>
                    <div className={`font-mono text-[10px] font-bold ${res.changePct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {res.changePct >= 0 ? '+' : ''}{res.changePct.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Controls & Quick Actions */}
        <div className="flex items-center flex-wrap gap-2">

          {/* Currency Dropdown Pill */}
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-black/20 border border-white/30 text-xs font-semibold text-white">
            <Coins className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="bg-transparent text-amber-200 font-mono font-bold focus:outline-none cursor-pointer w-[68px] text-xs"
              title="Change Currency"
            >
              {Object.values(CURRENCY_MAP).map(c => (
                <option key={c.code} value={c.code} className="bg-slate-900 text-slate-200 font-sans py-1">
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Benchmark Selector */}
          <div className="hidden md:flex items-center gap-1 bg-black/20 border border-white/30 rounded px-2 py-1 text-xs">
            <Globe className="w-3.5 h-3.5 text-orange-200" />
            <select
              value={benchmark}
              onChange={(e) => setBenchmark(e.target.value as 'SP500' | 'NIFTY50')}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              <option value="SP500" className="bg-slate-900 text-slate-200">S&P 500</option>
              <option value="NIFTY50" className="bg-slate-900 text-slate-200">NIFTY 50</option>
            </select>
          </div>

          {/* API Mode Pill */}
          <button
            onClick={toggleApiMode}
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
              isLiveApi
                ? 'bg-white text-emerald-700 shadow-sm font-bold'
                : 'bg-black/20 border border-white/30 text-orange-100 hover:bg-black/30'
            }`}
            title="Toggle between Live API Pipeline and Offline Sandbox Data Engine"
          >
            <Radio className={`w-3.5 h-3.5 ${isLiveApi ? 'animate-pulse text-emerald-600' : 'text-orange-200'}`} />
            {isLiveApi ? 'Live API' : 'Sandbox'}
          </button>

          {/* Theme Toggle Button (Light/Dark Switcher) */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/20 hover:bg-white/30 border border-white/40 text-xs font-bold text-white transition-all cursor-pointer shadow-xs"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-3.5 h-3.5 text-amber-200" />
                <span className="hidden sm:inline">Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Light</span>
              </>
            )}
          </button>

          {/* User Profile Badge & Dropdown (ICICI Direct Style) */}
          <div className="relative flex items-center gap-1.5 pl-1">
            <button 
              onClick={() => setActiveTab('docs')}
              className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer"
              title="Help & Wiki"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>

            <div
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white text-slate-900 text-xs font-bold shadow-sm cursor-pointer hover:bg-orange-50 transition-all select-none"
            >
              <span className="w-5 h-5 rounded-full bg-[#d32f2f] text-white flex items-center justify-center text-[10px] font-black">
                {currentUser.isLoggedIn ? currentUser.name.substring(0, 2).toUpperCase() : 'G'}
              </span>
              <span className="text-[11px] font-mono font-bold hidden sm:inline">
                {currentUser.isLoggedIn ? currentUser.id : 'Guest'}
              </span>
              <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
            </div>

            {/* Profile Dropdown Menu */}
            {showProfileDropdown && (
              <div 
                onMouseLeave={() => setShowProfileDropdown(false)}
                className="absolute right-0 top-full mt-2 w-72 bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-50 py-2 overflow-hidden animate-in fade-in duration-150"
              >
                {/* User Header Info Card */}
                <div className="px-4 py-3 bg-[var(--icici-gradient)] text-white border-b border-orange-400/20">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-white text-[#d32f2f] flex items-center justify-center font-black text-xs shadow-xs">
                      {currentUser.name.substring(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <div className="font-extrabold text-xs tracking-tight">{currentUser.name}</div>
                      <div className="text-[10px] text-orange-100 font-mono">ID: {currentUser.id}</div>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10px] bg-white/20 px-2 py-1 rounded-md font-bold">
                    <span>{currentUser.accountType}</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white">{currentUser.kycStatus}</span>
                  </div>
                </div>

                {/* Dropdown Options List */}
                <div className="py-1 text-xs divide-y divide-[var(--border-color)]">
                  <div className="py-1">
                    {!currentUser.isLoggedIn ? (
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false);
                          setActiveUserModal('login');
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-[var(--bg-card-hover)] flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold transition-colors cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4 text-emerald-500" />
                        User Login / Sign In
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false);
                          setActiveUserModal('switch_user');
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-[var(--bg-card-hover)] flex items-center gap-2 text-[var(--icici-orange)] font-bold transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4 text-[var(--icici-orange)]" />
                        Switch Trading Account / User
                      </button>
                    )}
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        setActiveUserModal('edit_profile');
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-[var(--bg-card-hover)] flex items-center gap-2 text-[var(--text-primary)] font-medium transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4 text-blue-500" />
                      Edit Profile & KYC Details
                    </button>

                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        setActiveUserModal('reset_password');
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-[var(--bg-card-hover)] flex items-center gap-2 text-[var(--text-primary)] font-medium transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4 text-amber-500" />
                      Reset / Change Password
                    </button>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        alert("2FA Security Verification Enabled. Session Device Authenticated.");
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-[var(--bg-card-hover)] flex items-center gap-2 text-[var(--text-primary)] font-medium transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      2FA & Security Settings
                    </button>
                  </div>

                  {currentUser.isLoggedIn && (
                    <div className="pt-1">
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false);
                          logoutUser();
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        Logout Session
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
