import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  TrendingUp,
  AlertTriangle,
  Layers,
  ArrowRight,
  X
} from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { useTradingSimulation } from '../../context/TradingSimulationContext';

interface SpotlightSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectInstrument?: (ticker: string) => void;
  onNavigateTab?: (tabId: string) => void;
  onTriggerPanic?: () => void;
}

interface SearchItem {
  id: string;
  type: 'ASSET' | 'NAV' | 'ACTION';
  title: string;
  subtitle: string;
  category?: string;
  badge?: string;
  action: () => void;
}

export const SpotlightSearchModal: React.FC<SpotlightSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectInstrument,
  onNavigateTab,
  onTriggerPanic
}) => {
  const { assets, setActiveSubTab, setActiveTab } = usePortfolio();
  const { addFunds, panicSquareOffAllIntraday } = useTradingSimulation();

  const [query, setQuery] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build searchable items catalogue
  const allItems = useMemo<SearchItem[]>(() => {
    const items: SearchItem[] = [];

    // 1. Navigation items
    const consoleTabs = [
      { id: 'place_order', label: 'Place Order Form', sub: 'Direct Market Access DMA multi-asset entry' },
      { id: 'options_builder', label: 'Options Strategy Builder & Greeks', sub: 'Sensibull payoff curve, multi-leg spreads, Δ Γ Θ ν' },
      { id: 'sip_mandates', label: 'Systematic Investment Plans (SIP Mandates)', sub: 'Recurring bank sweeps & Rupee-Cost Averaging (RCA)' },
      { id: 'portfolio_vaults', label: 'Multi-Goal Sub-Account Vaults', sub: 'Retirement, Alpha & Education partitioned capital' },
      { id: 'tax_auditor', label: 'Capital Gains Tax Auditor (ITR Schedule CG)', sub: 'Budget 2024-26 Sec 112A/111A & Tax-Loss Harvesting' },
      { id: 'open_positions', label: 'Open Positions (MIS / MTF)', sub: 'Live MTM tracking, trailing SL & square-off' },
      { id: 'order_book', label: 'Order Book', sub: 'Pending limit, trigger & OCO orders' },
      { id: 'trade_book', label: 'Trade Book', sub: 'Audited execution history & contract notes' },
      { id: 'demat_holdings', label: 'CDSL / NSDL Demat Holdings', sub: 'Depository securities, collateral pledge' },
      { id: 'funds', label: 'Funds & Margin Liquidity', sub: 'Collateral headroom, instant UPI deposit' },
      { id: 'gold', label: 'Sovereign Gold Bonds (SGB)', sub: 'RBI 2.5% p.a. gold tranches & digital gold' },
      { id: 'indian_bonds', label: 'Indian Sovereign & Corporate Debt Terminal', sub: 'CCIL NDS-OM 5-Depth, Sovereign Yield Curve & Clean/Dirty pricing' },
      { id: 'ipo', label: 'IPO & NFO ASBA Portal', sub: 'Direct SEBI ASBA application & allotment lottery' },
      { id: 'fd_bonds', label: 'Fixed Deposits & Corporate NCDs', sub: 'AAA-rated corporate bonds with fixed yields' },
      { id: 'reports', label: 'Tax & P&L Statements', sub: 'Trade journal, GitHub heatmap, STCG & LTCG' },
      { id: 'smart_tools', label: 'Smart Portfolio Tools', sub: 'Rebalance basket, tax harvester & SIP simulator' }
    ];

    consoleTabs.forEach(tab => {
      items.push({
        id: `nav-${tab.id}`,
        type: 'NAV',
        title: tab.label,
        subtitle: tab.sub,
        badge: 'Navigation',
        action: () => {
          if (onNavigateTab) onNavigateTab(tab.id);
          else {
            setActiveTab('trading');
            setActiveSubTab(tab.id);
          }
          onClose();
        }
      });
    });

    // 2. Power actions
    items.push({
      id: 'action-panic',
      type: 'ACTION',
      title: 'Emergency Panic Square-Off All MIS Positions',
      subtitle: 'Instantly liquidates all intraday open positions at best market price',
      badge: 'Emergency [Shift+S]',
      action: () => {
        if (onTriggerPanic) onTriggerPanic();
        else panicSquareOffAllIntraday();
        onClose();
      }
    });

    items.push({
      id: 'action-funds-100k',
      type: 'ACTION',
      title: 'Quick Add Margin Funds (₹1,00,000)',
      subtitle: 'Instant simulated bank deposit to Trading Margin balance',
      badge: 'Funding',
      action: () => {
        addFunds(100000);
        onClose();
      }
    });

    // 3. Securities / Assets
    assets.forEach(asset => {
      items.push({
        id: `asset-${asset.ticker}`,
        type: 'ASSET',
        title: `${asset.ticker} — ${asset.name}`,
        subtitle: `${asset.currency}${asset.price.toLocaleString()} (${asset.change24h >= 0 ? '+' : ''}${asset.change24h}%)`,
        category: asset.category,
        badge: asset.category,
        action: () => {
          if (onSelectInstrument) onSelectInstrument(asset.ticker);
          if (onNavigateTab) onNavigateTab('place_order');
          else {
            setActiveTab('trading');
            setActiveSubTab('place_order');
          }
          onClose();
        }
      });
    });

    return items;
  }, [assets, onNavigateTab, onSelectInstrument, onTriggerPanic, setActiveSubTab, setActiveTab, addFunds, panicSquareOffAllIntraday, onClose]);

  // Filter items based on query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return allItems.slice(0, 10);
    const q = query.toLowerCase();
    return allItems
      .filter(i => i.title.toLowerCase().includes(q) || i.subtitle.toLowerCase().includes(q) || (i.category && i.category.toLowerCase().includes(q)))
      .slice(0, 12);
  }, [allItems, query]);

  // Key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20 p-4 animate-in fade-in duration-150">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col divide-y divide-[var(--border-subtle)]">
        {/* Search Input Bar */}
        <div className="flex items-center px-5 py-4 gap-3">
          <Search className="w-5 h-5 text-[var(--icici-orange)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a security (e.g. RELIANCE), command (e.g. Panic), or tab..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent text-sm font-bold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-muted)]">
              ESC to exit
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`p-3 rounded-2xl cursor-pointer transition-colors flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-[var(--icici-orange)]/15 border border-[var(--icici-orange)]/40 text-[var(--text-primary)]'
                      : 'hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${
                      item.type === 'ACTION' ? 'bg-rose-500/20 text-rose-500' :
                      item.type === 'NAV' ? 'bg-blue-500/20 text-blue-500' :
                      'bg-emerald-500/20 text-emerald-500'
                    }`}>
                      {item.type === 'ACTION' ? <AlertTriangle className="w-4 h-4" /> :
                       item.type === 'NAV' ? <Layers className="w-4 h-4" /> :
                       <TrendingUp className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-xs font-black text-[var(--text-primary)] flex items-center gap-2">
                        <span>{item.title}</span>
                        {item.badge && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-muted)] uppercase">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <ArrowRight className={`w-4 h-4 transition-transform ${isSelected ? 'translate-x-1 text-[var(--icici-orange)]' : 'text-transparent'}`} />
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-[var(--text-muted)] font-bold">
              No results found for "{query}"
            </div>
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="p-3 bg-[var(--bg-tertiary)] flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)] px-4">
          <div className="flex items-center gap-3">
            <span><strong>↑↓</strong> Navigate</span>
            <span><strong>↵</strong> Select</span>
            <span><strong>[B]</strong> Buy Order</span>
            <span><strong>[S]</strong> Sell Order</span>
            <span><strong>[Shift+S]</strong> Panic Square-Off</span>
          </div>
          <div>Bloomberg Terminal Mode</div>
        </div>
      </div>
    </div>
  );
};
