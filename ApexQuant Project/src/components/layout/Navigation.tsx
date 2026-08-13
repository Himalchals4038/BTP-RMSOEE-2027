import React from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import {
  LayoutDashboard,
  Sliders,
  TrendingUp,
  LineChart,
  Globe,
  BookOpen,
  Sparkles
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, activeSubTab, setActiveSubTab } = usePortfolio();

  const mainNavItems = [
    { id: 'dashboard', label: 'Portfolio', icon: LayoutDashboard },
    { id: 'builder', label: 'Stocks & Allocation', icon: Sliders },
    { id: 'smart_engine', label: '🎯 Dual-Shield Smart Engine', icon: Sparkles, isHighlighted: true },
    { id: 'frontier', label: 'Mutual Funds & MPT', icon: TrendingUp },
    { id: 'backtest', label: 'F&O Strategies', icon: LineChart },
    { id: 'explorer', label: 'Commodity & Markets', icon: Globe },
    { id: 'docs', label: 'Research & Wiki', icon: BookOpen }
  ];

  const secondaryNavItems = [
    { id: 'portfolio_summary', label: 'Portfolio', targetTab: 'dashboard' },
    { id: 'place_order', label: 'Place Order', targetTab: 'builder' },
    { id: 'open_positions', label: 'Open Positions', targetTab: 'dashboard' },
    { id: 'order_book', label: 'Order Book', targetTab: 'backtest' },
    { id: 'trade_book', label: 'Trade Book', targetTab: 'backtest' },
    { id: 'funds', label: 'Funds & Liquidity', targetTab: 'builder' },
    { id: 'demat_holdings', label: 'Demat Holdings', targetTab: 'builder' },
    { id: 'gold', label: 'Sovereign Gold', badge: 'SGB', targetTab: 'explorer' },
    { id: 'ipo', label: 'IPO & NFO', badge: 'Hot', targetTab: 'explorer' },
    { id: 'loans', label: 'Loans', targetTab: 'builder' },
    { id: 'fd_bonds', label: 'FD & Bonds', badge: '8.8%', targetTab: 'explorer' },
    { id: 'insurance', label: 'Insurance', targetTab: 'docs' },
    { id: 'nps', label: 'NPS Pension', targetTab: 'docs' },
    { id: 'smart_tools', label: 'Smart Tools', badge: 'Beta', targetTab: 'frontier' },
    { id: 'reports', label: 'Reports', targetTab: 'docs' },
    { id: 'services', label: 'Services', targetTab: 'docs' }
  ];

  return (
    <div className="w-full flex flex-col shadow-xs border-b border-[var(--border-color)]">
      {/* STACK 1: Primary Category Bar */}
      <nav className="w-full bg-[var(--bg-subnav)] transition-colors duration-200 border-b border-[var(--border-color)]">
        <div className="max-w-[1750px] mx-auto px-4 lg:px-6 flex items-center justify-center overflow-x-auto">
          <div className="flex items-center justify-center space-x-1 py-0.5">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id && !activeSubTab;

              if (item.isHighlighted) {
                const isSmartActive = activeTab === 'smart_engine';
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSubTab(null);
                      setActiveTab(item.id);
                    }}
                    className={`flex items-center gap-1.5 px-4 py-1.5 my-1.5 mx-1.5 rounded-full text-xs font-black transition-all whitespace-nowrap cursor-pointer shadow-md ${
                      isSmartActive
                        ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-600 text-white ring-2 ring-amber-300 shadow-orange-500/40 scale-105'
                        : 'bg-gradient-to-r from-amber-500/90 via-orange-500/90 to-emerald-600/90 hover:from-amber-500 hover:to-emerald-500 text-white border border-amber-300/50 hover:scale-105 animate-pulse'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 text-amber-200 animate-spin" />
                    <span>{item.label}</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-white text-orange-700 text-[9px] font-black uppercase tracking-wider shadow-2xs">
                      NEW CORE
                    </span>
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSubTab(null);
                    setActiveTab(item.id);
                  }}
                  className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all whitespace-nowrap cursor-pointer border-b-3 ${
                    isActive
                      ? 'border-[var(--icici-orange)] text-[var(--icici-orange)] bg-[var(--bg-subnav-active)] shadow-xs'
                      : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--icici-orange)]' : 'text-[var(--text-muted)]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* STACK 2: Secondary Quick-Ribbon Bar */}
      <div className="w-full bg-[var(--bg-tertiary)] py-1.5 px-4 lg:px-6 overflow-x-auto">
        <div className="max-w-[1750px] mx-auto flex items-center justify-center divide-x divide-[var(--border-subtle)] text-xs font-semibold text-[var(--text-secondary)] whitespace-nowrap">
          {secondaryNavItems.map((sItem) => {
            const isSubActive = activeSubTab === sItem.id;
            return (
              <button
                key={sItem.id}
                onClick={() => {
                  setActiveSubTab(sItem.id);
                  if (sItem.targetTab) setActiveTab(sItem.targetTab);
                }}
                className={`px-3 py-1 flex items-center gap-1 transition-colors cursor-pointer ${
                  isSubActive
                    ? 'text-[var(--icici-orange)] font-bold bg-[var(--bg-card)] rounded shadow-2xs border border-[var(--border-color)]'
                    : 'hover:text-[var(--text-primary)]'
                }`}
              >
                <span>{sItem.label}</span>
                {sItem.badge && (
                  <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.2 rounded font-extrabold">
                    {sItem.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
