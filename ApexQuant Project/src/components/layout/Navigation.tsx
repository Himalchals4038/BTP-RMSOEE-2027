import React from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import {
  LayoutDashboard,
  Sliders,
  TrendingUp,
  LineChart,
  Globe,
  BookOpen
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab } = usePortfolio();

  const navItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'builder', label: 'Portfolio Allocator', icon: Sliders },
    { id: 'frontier', label: 'Efficient Frontier & Heatmap', icon: TrendingUp },
    { id: 'backtest', label: 'Strategy Backtester', icon: LineChart },
    { id: 'explorer', label: 'Market Explorer', icon: Globe },
    { id: 'docs', label: 'Financial Docs & Wiki', icon: BookOpen }
  ];

  return (
    <nav className="w-full border-b border-slate-800 bg-slate-950/60 px-6 py-2">
      <div className="max-w-[1700px] mx-auto flex items-center justify-between overflow-x-auto gap-2">
        <div className="flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-md shadow-blue-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 font-mono shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>QUANT ENGINE ACTIVE</span>
        </div>
      </div>
    </nav>
  );
};
