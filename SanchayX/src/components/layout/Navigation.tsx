import React from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import {
  LayoutDashboard,
  Sliders,
  TrendingUp,
  LineChart,
  Globe,
  Sparkles,
  ShieldCheck,
  FileText
} from 'lucide-react';
import {
  NseBseEmblem,
  SovereignGoldCoin,
  SecuredBondShield,
  Level2DepthLadder,
  ZeroTdsCertificate,
  BankAutoSweepVault,
  IpoAllotmentLottery,
  CandlestickTerminal
} from '../icons/MarketIcons';

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, activeSubTab, setActiveSubTab } = usePortfolio();

  const mainNavItems = [
    { id: 'dashboard', label: 'Portfolio', icon: LayoutDashboard },
    { id: 'builder', label: 'Stocks & Allocation', icon: Sliders },
    { id: 'smart_engine', label: '🎯 Smart Investment Option', icon: Sparkles, isHighlighted: true, badge: 'SMART CORE', style: 'amber' },
    { id: 'safe_investment', label: '🛡️ 100% Safe Investment', icon: ShieldCheck, isHighlighted: true, badge: '100% SAFE', style: 'emerald' },
    { id: 'frontier', label: 'Mutual Funds & MPT', icon: TrendingUp },
    { id: 'backtest', label: 'Rebalance & Backtest', icon: LineChart },
    { id: 'explorer', label: 'Indian Markets & Discovery', icon: Globe }
  ];

  interface WorkspaceItem {
    id: string;
    label: string;
    icon: any;
    targetTab?: string;
    badge?: string;
  }

  interface WorkspaceGroup {
    id: string;
    label: string;
    tag: string;
    icon: any;
    color: string;
    items: WorkspaceItem[];
  }

  // 4 CONSOLIDATED INSTITUTIONAL WORKSPACES
  const workspaces: WorkspaceGroup[] = [
    {
      id: 'trading',
      label: 'Trading Console',
      tag: 'ACTIVE EXECUTION',
      icon: CandlestickTerminal,
      color: 'blue',
      items: [
        { id: 'place_order', label: 'Place Order', icon: Level2DepthLadder, targetTab: 'builder' },
        { id: 'order_book', label: 'Order Book', icon: NseBseEmblem, targetTab: 'builder' },
        { id: 'trade_book', label: 'Trade Book', icon: FileText, targetTab: 'builder' },
        { id: 'open_positions', label: 'Open Positions & MTM', icon: CandlestickTerminal, targetTab: 'builder' }
      ]
    },
    {
      id: 'debt',
      label: 'Debt & Demat',
      tag: 'LONG-TERM WEALTH',
      icon: SecuredBondShield,
      color: 'emerald',
      items: [
        { id: 'indian_bonds', label: 'Indian Bond Terminal', icon: SecuredBondShield, badge: 'NDS-OM', targetTab: 'builder' },
        { id: 'demat_holdings', label: 'Demat Holdings', icon: NseBseEmblem, targetTab: 'builder' },
        { id: 'gold', label: 'Sovereign Gold', icon: SovereignGoldCoin, badge: 'SGB', targetTab: 'safe_investment' },
        { id: 'fd_bonds', label: 'FD & Coupon Calendar', icon: SecuredBondShield, badge: '8.8%', targetTab: 'safe_investment' }
      ]
    },
    {
      id: 'primary',
      label: 'Primary Markets',
      tag: 'CAPITAL GROWTH',
      icon: IpoAllotmentLottery,
      color: 'amber',
      items: [
        { id: 'ipo', label: 'IPO & NFO ASBA', icon: IpoAllotmentLottery, badge: 'Hot', targetTab: 'explorer' },
        { id: 'sip_mandates', label: 'SIP Mandates', icon: BankAutoSweepVault, badge: 'AUTO', targetTab: 'safe_investment' },
        { id: 'portfolio_vaults', label: 'Goal Vaults', icon: BankAutoSweepVault, targetTab: 'builder' },
        { id: 'funds', label: 'Funds & Liquidity', icon: BankAutoSweepVault, targetTab: 'builder' }
      ]
    },
    {
      id: 'tax_reporting',
      label: 'Taxation & Reports',
      tag: 'LEGAL LOOPHOLES & XIRR',
      icon: ZeroTdsCertificate,
      color: 'purple',
      items: [
        { id: 'tax_auditor', label: 'Tax Auditor & Loopholes', icon: ZeroTdsCertificate, badge: 'Sec 112A/70', targetTab: 'builder' },
        { id: 'reports', label: 'Wealth Pitch-Deck (XIRR)', icon: FileText, badge: 'Deck PDF', targetTab: 'builder' }
      ]
    }
  ];

  // Auto-detect which workspace the current activeSubTab belongs to
  const activeWorkspaceId = React.useMemo(() => {
    if (!activeSubTab) return 'trading';
    for (const ws of workspaces) {
      if (ws.items.some(it => it.id === activeSubTab)) {
        return ws.id;
      }
    }
    return 'trading';
  }, [activeSubTab]);

  const [selectedWorkspace, setSelectedWorkspace] = React.useState<string>(activeWorkspaceId);

  React.useEffect(() => {
    if (activeSubTab) {
      for (const ws of workspaces) {
        if (ws.items.some(it => it.id === activeSubTab)) {
          setSelectedWorkspace(ws.id);
          break;
        }
      }
    }
  }, [activeSubTab]);

  const currentWorkspace = workspaces.find(w => w.id === selectedWorkspace) || workspaces[0];

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

      {/* STACK 2: Decluttered 4-Consolidated Workspaces Ribbon */}
      <div className="w-full bg-[var(--bg-tertiary)] py-1.5 px-4 lg:px-6 border-t border-[var(--border-subtle)]">
        <div className="max-w-[1750px] mx-auto flex flex-wrap items-center justify-between gap-2.5">
          {/* 4 Workspace Hub Selectors */}
          <div className="flex items-center gap-1 bg-[var(--bg-card)] p-0.5 rounded-xl border border-[var(--border-color)] shadow-2xs">
            {workspaces.map((ws) => {
              const isWsActive = selectedWorkspace === ws.id;
              const WsIcon = ws.icon;
              return (
                <button
                  key={ws.id}
                  onClick={() => {
                    setSelectedWorkspace(ws.id);
                    // When switching workspace, activate its first item if current sub-tab isn't in it
                    if (!ws.items.some(it => it.id === activeSubTab)) {
                      const first = ws.items[0];
                      setActiveSubTab(first.id);
                      if (first.targetTab) setActiveTab(first.targetTab);
                    }
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    isWsActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                  }`}
                >
                  <WsIcon className="w-3.5 h-3.5" />
                  <span>{ws.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Workspace Dedicated Tools (High-Density, Zero Overflow) */}
          <div className="flex items-center divide-x divide-[var(--border-subtle)] bg-[var(--bg-card)] px-1.5 py-0.5 rounded-xl border border-[var(--border-color)] shadow-2xs">
            {currentWorkspace.items.map((sItem) => {
              const isSubActive = activeSubTab === sItem.id;
              const Icon = sItem.icon;

              return (
                <button
                  key={sItem.id}
                  onClick={() => {
                    setActiveSubTab(sItem.id);
                    if (sItem.targetTab) setActiveTab(sItem.targetTab);
                  }}
                  className={`px-3 py-1 flex items-center gap-1.5 transition-colors cursor-pointer text-xs font-bold ${
                    isSubActive
                      ? 'text-blue-600 dark:text-blue-400 font-extrabold bg-blue-500/10 dark:bg-blue-500/20 rounded-md'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {Icon && <Icon className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? 'text-blue-600 dark:text-blue-400' : 'text-[var(--text-muted)]'}`} />}
                  <span>{sItem.label}</span>
                  {sItem.badge && (
                    <span className="text-[8.5px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-extrabold">
                      {sItem.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
