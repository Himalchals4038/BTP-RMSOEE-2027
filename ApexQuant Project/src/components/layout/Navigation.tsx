import React from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import {
  LayoutDashboard,
  Sliders,
  TrendingUp,
  LineChart,
  Globe,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Download,
  FileSpreadsheet
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, activeSubTab, setActiveSubTab, exportReportCSV, exportReportPDF } = usePortfolio();

  const mainNavItems = [
    { id: 'dashboard', label: 'Portfolio', icon: LayoutDashboard },
    { id: 'builder', label: 'Stocks & Allocation', icon: Sliders },
    { id: 'smart_engine', label: '🎯 Smart Investment Option', icon: Sparkles, isHighlighted: true, badge: 'SMART CORE', style: 'amber' },
    { id: 'safe_investment', label: '🛡️ 100% Safe Investment', icon: ShieldCheck, isHighlighted: true, badge: '100% SAFE', style: 'emerald' },
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
    { id: 'gold', label: 'Sovereign Gold', badge: 'SGB', targetTab: 'safe_investment' },
    { id: 'ipo', label: 'IPO & NFO', badge: 'Hot', targetTab: 'explorer' },
    { id: 'fd_bonds', label: 'FD & Bonds', badge: '8.8%', targetTab: 'safe_investment' },
    { id: 'insurance', label: 'Insurance', targetTab: 'docs' },
    { id: 'nps', label: 'NPS Pension', targetTab: 'docs' },
    { id: 'reports', label: 'Reports', targetTab: 'docs' }
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
                const isItemActive = activeTab === item.id && !activeSubTab;
                const isSafe = item.style === 'emerald';

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSubTab(null);
                      setActiveTab(item.id);
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 my-1.5 mx-1 rounded-full text-xs font-black transition-all whitespace-nowrap cursor-pointer shadow-md ${
                      isItemActive
                        ? isSafe
                          ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-green-700 text-white ring-2 ring-emerald-300 shadow-emerald-500/40 scale-105'
                          : 'bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-600 text-white ring-2 ring-amber-300 shadow-orange-500/40 scale-105'
                        : isSafe
                          ? 'bg-gradient-to-r from-emerald-700/90 via-teal-700/90 to-emerald-800/90 hover:from-emerald-600 hover:to-teal-600 text-white border border-emerald-300/50 hover:scale-105'
                          : 'bg-gradient-to-r from-amber-500/90 via-orange-500/90 to-emerald-600/90 hover:from-amber-500 hover:to-emerald-500 text-white border border-amber-300/50 hover:scale-105'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSafe ? 'text-emerald-200' : 'text-amber-200'} ${isItemActive ? 'animate-spin' : ''}`} />
                    <span>{item.label}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-2xs ${
                      isSafe ? 'bg-emerald-200 text-emerald-950' : 'bg-white text-orange-700'
                    }`}>
                      {item.badge}
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
            const isReports = sItem.id === 'reports';

            return (
              <React.Fragment key={sItem.id}>
                <button
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

                {/* Excel & PDF Download Buttons Placed Right Beside Reports Option */}
                {isReports && (
                  <div className="flex items-center gap-1.5 pl-2 pr-1 my-0.5">
                    <button
                      onClick={exportReportCSV}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] border border-emerald-500/30 transition-all cursor-pointer shadow-2xs"
                      title="Download Portfolio Report in Excel (CSV) Format"
                    >
                      <FileSpreadsheet className="w-3 h-3 text-emerald-500" />
                      <span>Excel</span>
                    </button>
                    <button
                      onClick={exportReportPDF}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-600/15 hover:bg-rose-600/25 text-rose-600 dark:text-rose-400 font-extrabold text-[10px] border border-rose-500/30 transition-all cursor-pointer shadow-2xs"
                      title="Download Institutional PDF Report"
                    >
                      <Download className="w-3 h-3 text-rose-500" />
                      <span>PDF</span>
                    </button>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
