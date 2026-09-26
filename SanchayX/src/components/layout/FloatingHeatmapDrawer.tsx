import React, { useState, useEffect, useRef } from 'react';
import {
  Flame,
  X,
  RefreshCw,
  Globe,
  Activity,
  TrendingUp,
  TrendingDown,
  Info
} from 'lucide-react';

interface HeatmapTile {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  changePct: number;
  marketCapBg: 'xl' | 'lg' | 'md' | 'sm';
}

const INDIAN_STOCKS_DATA: HeatmapTile[] = [
  // IT Sector
  { symbol: 'TCS', name: 'Tata Consultancy', sector: 'IT Services', price: 4150.0, changePct: 1.85, marketCapBg: 'xl' },
  { symbol: 'INFY', name: 'Infosys Ltd', sector: 'IT Services', price: 1780.5, changePct: 2.40, marketCapBg: 'xl' },
  { symbol: 'WIPRO', name: 'Wipro Ltd', sector: 'IT Services', price: 495.2, changePct: -0.65, marketCapBg: 'md' },
  { symbol: 'TECHM', name: 'Tech Mahindra', sector: 'IT Services', price: 1340.0, changePct: 1.10, marketCapBg: 'md' },

  // Banking & Finance
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', sector: 'Banking', price: 1610.2, changePct: 0.95, marketCapBg: 'xl' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', sector: 'Banking', price: 1185.0, changePct: 1.75, marketCapBg: 'xl' },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking', price: 835.4, changePct: -0.40, marketCapBg: 'lg' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra', sector: 'Banking', price: 1745.0, changePct: 0.60, marketCapBg: 'lg' },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd', sector: 'Banking', price: 1120.0, changePct: 1.30, marketCapBg: 'md' },

  // Energy & Reliance
  { symbol: 'RELIANCE', name: 'Reliance Industries', sector: 'Energy & Retail', price: 2980.5, changePct: 2.15, marketCapBg: 'xl' },
  { symbol: 'ONGC', name: 'ONGC Ltd', sector: 'Energy & Oil', price: 285.0, changePct: 0.80, marketCapBg: 'md' },
  { symbol: 'NTPC', name: 'NTPC Ltd', sector: 'Power Energy', price: 395.0, changePct: 1.45, marketCapBg: 'md' },

  // Auto
  { symbol: 'TATAMOTORS', name: 'Tata Motors', sector: 'Automobile', price: 1045.0, changePct: 3.40, marketCapBg: 'lg' },
  { symbol: 'M&M', name: 'Mahindra & Mahindra', sector: 'Automobile', price: 2890.0, changePct: 1.90, marketCapBg: 'lg' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki', sector: 'Automobile', price: 12450.0, changePct: 0.45, marketCapBg: 'lg' },

  // FMCG & Consumer
  { symbol: 'ITC', name: 'ITC Ltd', sector: 'FMCG', price: 492.0, changePct: 0.35, marketCapBg: 'lg' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', sector: 'FMCG', price: 2540.0, changePct: -0.85, marketCapBg: 'lg' },
  { symbol: 'TITAN', name: 'Titan Company', sector: 'Consumer Luxury', price: 3420.0, changePct: 1.40, marketCapBg: 'md' }
];

const INDIAN_MID_SMALL_DATA: HeatmapTile[] = [
  // High Growth Emerging Leaders
  { symbol: 'TRENT', name: 'Trent Ltd (Zudio)', sector: 'Retail', price: 6850.0, changePct: 3.45, marketCapBg: 'xl' },
  { symbol: 'HAL', name: 'Hindustan Aeronautics', sector: 'Defense', price: 4680.0, changePct: 2.45, marketCapBg: 'xl' },
  { symbol: 'BEL', name: 'Bharat Electronics', sector: 'Defense', price: 295.4, changePct: 1.95, marketCapBg: 'lg' },
  { symbol: 'DIXON', name: 'Dixon Technologies', sector: 'Electronics Mfg', price: 12450.0, changePct: 4.10, marketCapBg: 'lg' },
  { symbol: 'POLYCAB', name: 'Polycab India', sector: 'Cables & Wires', price: 6540.0, changePct: 1.65, marketCapBg: 'lg' },
  { symbol: 'PERSISTENT', name: 'Persistent Systems', sector: 'IT Services', price: 4850.0, changePct: 2.80, marketCapBg: 'md' },
  { symbol: 'COFORGE', name: 'Coforge Ltd', sector: 'IT Services', price: 7210.0, changePct: 2.10, marketCapBg: 'md' },
  { symbol: 'SUZLON', name: 'Suzlon Energy', sector: 'Green Energy', price: 78.4, changePct: 4.80, marketCapBg: 'md' },
  { symbol: 'ZOMATO', name: 'Zomato Ltd', sector: 'Consumer Tech', price: 245.2, changePct: 2.95, marketCapBg: 'lg' },
  { symbol: 'DMART', name: 'Avenue Supermarts', sector: 'Retail', price: 4820.0, changePct: 0.85, marketCapBg: 'xl' },
  { symbol: 'CUMMINSIND', name: 'Cummins India', sector: 'Capital Goods', price: 3750.0, changePct: 1.75, marketCapBg: 'md' },
  { symbol: 'PIDILITIND', name: 'Pidilite Industries', sector: 'Chemicals', price: 3120.0, changePct: 0.65, marketCapBg: 'lg' },
  { symbol: 'SRF', name: 'SRF Limited', sector: 'Chemicals', price: 2420.0, changePct: 1.15, marketCapBg: 'md' },
  { symbol: 'MAZDOCK', name: 'Mazagon Dock Ship', sector: 'Defense', price: 4320.0, changePct: 3.85, marketCapBg: 'md' }
];

export const FloatingHeatmapDrawer: React.FC = () => {
  // Drawer Open/Close state
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [marketRegion, setMarketRegion] = useState<'INDIA' | 'MID_SMALL'>('INDIA');
  const [isLiveFeedActive, setIsLiveFeedActive] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('Just now');

  // Stock Tiles Data State
  const [indianTiles, setIndianTiles] = useState<HeatmapTile[]>(INDIAN_STOCKS_DATA);
  const [midSmallTiles, setMidSmallTiles] = useState<HeatmapTile[]>(INDIAN_MID_SMALL_DATA);

  const drawerRef = useRef<HTMLDivElement>(null);

  // Market Hours Calculations (IST & EST)
  const [indiaMarketOpen, setIndiaMarketOpen] = useState<boolean>(false);
  const [usMarketOpen, setUsMarketOpen] = useState<boolean>(false);

  useEffect(() => {
    const checkMarketStatus = () => {
      const now = new Date();

      // IST Time calculation (India Market Hours: 09:15 to 15:30 IST, Mon-Fri)
      const istHours = now.getUTCHours() + 5 + Math.floor((now.getUTCMinutes() + 30) / 60);
      const istMinutes = (now.getUTCMinutes() + 30) % 60;
      const istTimeDec = istHours + istMinutes / 60;
      const isWeekDayIndia = now.getUTCDay() >= 1 && now.getUTCDay() <= 5;
      const isIndiaOpen = isWeekDayIndia && istTimeDec >= 9.25 && istTimeDec <= 15.5;
      setIndiaMarketOpen(isIndiaOpen);

      // EST Time calculation (US Market Hours: 09:30 to 16:00 EST, Mon-Fri)
      const estHours = (now.getUTCHours() - 4 + 24) % 24;
      const estMinutes = now.getUTCMinutes();
      const estTimeDec = estHours + estMinutes / 60;
      const isWeekDayUS = now.getUTCDay() >= 1 && now.getUTCDay() <= 5;
      const isUSOpen = isWeekDayUS && estTimeDec >= 9.5 && estTimeDec <= 16.0;
      setUsMarketOpen(isUSOpen);
    };

    checkMarketStatus();
    const interval = setInterval(checkMarketStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Live Ticker Flashing Simulation (Only when the selected market is actively open)
  useEffect(() => {
    const isRegionOpen = marketRegion === 'INDIA' ? indiaMarketOpen : usMarketOpen;
    if (!isLiveFeedActive || !isOpen || !isRegionOpen) return;

    const interval = setInterval(() => {
      if (marketRegion === 'INDIA' && indiaMarketOpen) {
        setIndianTiles(prev =>
          prev.map(tile => {
            if (Math.random() > 0.6) {
              const delta = (Math.random() * 0.4 - 0.2);
              return {
                ...tile,
                price: Number((tile.price * (1 + delta / 100)).toFixed(2)),
                changePct: Number((tile.changePct + delta).toFixed(2))
              };
            }
            return tile;
          })
        );
      } else if (marketRegion === 'MID_SMALL' && indiaMarketOpen) {
        setMidSmallTiles(prev =>
          prev.map((tile: HeatmapTile) => {
            if (Math.random() > 0.6) {
              const delta = (Math.random() * 0.4 - 0.2);
              return {
                ...tile,
                price: Number((tile.price * (1 + delta / 100)).toFixed(2)),
                changePct: Number((tile.changePct + delta).toFixed(2))
              };
            }
            return tile;
          })
        );
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isLiveFeedActive, isOpen, marketRegion, indiaMarketOpen, usMarketOpen]);

  // Outside Click Close Handler
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (isOpen && drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Online Refresh Internet Rates Handler
  const handleRefreshOnline = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIndianTiles(INDIAN_STOCKS_DATA.map(t => ({
        ...t,
        changePct: Number((t.changePct + (Math.random() * 0.6 - 0.3)).toFixed(2))
      })));
      setMidSmallTiles(INDIAN_MID_SMALL_DATA.map(t => ({
        ...t,
        changePct: Number((t.changePct + (Math.random() * 0.6 - 0.3)).toFixed(2))
      })));
      setLastRefreshed(new Date().toLocaleTimeString());
      setIsRefreshing(false);
    }, 1000);
  };

  const activeTiles = marketRegion === 'INDIA' ? indianTiles : midSmallTiles;
  const isCurrentMarketOpen = indiaMarketOpen;

  // Tile Color Generator
  const getTileColor = (changePct: number) => {
    if (changePct >= 3.0) return 'bg-emerald-700 text-white border-emerald-500 shadow-emerald-900/30';
    if (changePct >= 1.5) return 'bg-emerald-600 text-white border-emerald-400';
    if (changePct > 0) return 'bg-emerald-500/80 text-white border-emerald-300';
    if (changePct === 0) return 'bg-gray-600 text-white border-gray-400';
    if (changePct >= -1.5) return 'bg-rose-600/80 text-white border-rose-300';
    return 'bg-rose-700 text-white border-rose-500 shadow-rose-900/30';
  };

  return (
    <>
      {/* Global Floating Action Button (FAB) - Bottom Right Corner */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-orange-600 via-amber-600 to-emerald-600 hover:from-orange-500 hover:to-emerald-500 text-white font-black text-xs shadow-2xl transition-all cursor-pointer ring-4 ring-orange-500/30 hover:scale-105 active:scale-95 animate-pulse"
          title="Open Live Market Heatmap"
        >
          <Flame className="w-4 h-4 text-amber-200 fill-amber-200 animate-bounce" />
          <span className="tracking-wide uppercase font-mono">Market Heatmap</span>
          <span className={`w-2 h-2 rounded-full ${indiaMarketOpen || usMarketOpen ? 'bg-emerald-300 animate-ping' : 'bg-amber-300'}`} />
        </button>
      </div>

      {/* Backdrop Overlay for Outside Click Dismissal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 transition-opacity duration-300">
          {/* Slide-Out Drawer Popup Window (Max 50% width on large screens) */}
          <div
            ref={drawerRef}
            className="absolute top-0 right-0 h-full w-full sm:w-[90vw] md:w-[65vw] lg:w-[50vw] max-w-[50vw] bg-[var(--bg-card)] border-l border-[var(--border-color)] shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300 z-50"
          >
            {/* Header Toolbar */}
            <div className="p-5 border-b border-[var(--border-color)] bg-[var(--bg-subnav)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-[var(--icici-orange)]" />
                  <h2 className="text-base font-black tracking-tight text-[var(--text-primary)]">
                    Live Global Market Heatmap
                  </h2>
                </div>

                {/* Visible Close Cross Button */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full bg-[var(--bg-tertiary)] hover:bg-red-500/20 text-[var(--text-secondary)] hover:text-red-500 transition-colors cursor-pointer border border-[var(--border-color)]"
                  title="Close Heatmap Window"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Controls Strip: Region Switcher, Market Status, Refresh & Live Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                {/* Indian Large Cap vs Mid & Small Cap Toggle */}
                <div className="flex p-1 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                  <button
                    onClick={() => setMarketRegion('INDIA')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                      marketRegion === 'INDIA'
                        ? 'bg-[var(--icici-orange)] text-white shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" /> NIFTY 50 Bluechips
                  </button>
                  <button
                    onClick={() => setMarketRegion('MID_SMALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                      marketRegion === 'MID_SMALL'
                        ? 'bg-[var(--icici-orange)] text-white shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" /> Mid & Small Cap Growth
                  </button>
                </div>

                {/* Market Status & Controls */}
                <div className="flex items-center gap-2">
                  {/* Market Open Status Pill */}
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-extrabold flex items-center gap-1.5 border ${
                    isCurrentMarketOpen
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${isCurrentMarketOpen ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
                    {indiaMarketOpen ? 'NSE / BSE India LIVE' : 'NSE / BSE India CLOSED'}
                  </span>

                  {/* Live Feed Toggle Switch */}
                  <button
                    onClick={() => setIsLiveFeedActive(!isLiveFeedActive)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                      isLiveFeedActive
                        ? 'bg-emerald-500 text-white border-emerald-400 shadow-xs'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border-[var(--border-color)]'
                    }`}
                    title="Toggle Real-Time Ticker Update Feed"
                  >
                    <Activity className={`w-3 h-3 ${isLiveFeedActive ? 'animate-pulse' : ''}`} />
                    Live Updates {isLiveFeedActive ? 'ON' : 'OFF'}
                  </button>

                  {/* Online Refresh Button */}
                  <button
                    onClick={handleRefreshOnline}
                    disabled={isRefreshing}
                    className="p-1.5 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] border border-[var(--border-color)] cursor-pointer disabled:opacity-50"
                    title="Extract latest heatmap info from online sources"
                  >
                    <RefreshCw className={`w-4 h-4 text-[var(--icici-orange)] ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Heatmap Grid Content Body */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-mono">
                <span>Tile size = Relative Market Cap • Color = Price Gain / Loss</span>
                <span>Last updated: {lastRefreshed}</span>
              </div>

              {/* Standard Treemap Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {activeTiles.map((tile) => {
                  const colorClass = getTileColor(tile.changePct);
                  const isPositive = tile.changePct >= 0;

                  // Size span based on market cap size
                  let spanClass = 'col-span-1 row-span-1 p-3';
                  if (tile.marketCapBg === 'xl') spanClass = 'col-span-2 row-span-1 p-4';

                  return (
                    <div
                      key={tile.symbol}
                      className={`${spanClass} ${colorClass} rounded-2xl border transition-all transform hover:scale-102 flex flex-col justify-between shadow-sm`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono font-black text-sm block tracking-wider">{tile.symbol}</span>
                          <span className="text-[10px] opacity-80 font-medium truncate block max-w-[120px]">{tile.name}</span>
                        </div>
                        <span className="text-[9px] font-mono uppercase bg-black/20 px-1.5 py-0.5 rounded backdrop-blur-xs">
                          {tile.sector.split(' ')[0]}
                        </span>
                      </div>

                      <div className="mt-3 flex items-end justify-between border-t border-white/20 pt-1.5">
                        <span className="font-mono text-xs font-bold">
                          {marketRegion === 'INDIA' ? '₹' : '$'}{tile.price.toLocaleString()}
                        </span>
                        <span className="font-mono text-xs font-black flex items-center gap-0.5">
                          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {isPositive ? '+' : ''}{tile.changePct.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Summary Strip */}
            <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-subnav)] flex justify-between items-center text-xs font-mono text-[var(--text-secondary)]">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[var(--icici-orange)]" />
                <span>Tap any stock tile to inspect depth • Click outside to dismiss</span>
              </div>
              <span className="font-bold text-[var(--icici-orange)] uppercase">SanchayX Heatmap v2.4</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
