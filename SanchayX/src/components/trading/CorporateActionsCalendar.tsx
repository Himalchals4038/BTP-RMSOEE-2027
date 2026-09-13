import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Coins,
  CheckCircle2
} from 'lucide-react';
import { useTradingSimulation } from '../../context/TradingSimulationContext';
import { usePortfolio } from '../../context/PortfolioContext';

interface CorporateActionItem {
  id: string;
  ticker: string;
  name: string;
  category: 'EQUITY_DIVIDEND' | 'SGB_COUPON' | 'BOND_INTEREST' | 'BONUS_SPLIT';
  actionType: string;
  ratePerUnit: number;
  rateLabel: string;
  exDate: string;
  recordDate: string;
  paymentDate: string;
  status: 'UPCOMING' | 'ANNOUNCED' | 'CREDITED';
}

const SCHEDULED_ACTIONS: CorporateActionItem[] = [
  {
    id: 'CA-001',
    ticker: 'TCS.NS',
    name: 'Tata Consultancy Services Ltd.',
    category: 'EQUITY_DIVIDEND',
    actionType: 'Interim Dividend',
    ratePerUnit: 28.0,
    rateLabel: '₹28.00 / Share (2800%)',
    exDate: '2026-10-14',
    recordDate: '2026-10-15',
    paymentDate: '2026-10-28',
    status: 'ANNOUNCED'
  },
  {
    id: 'CA-002',
    ticker: 'ITC.NS',
    name: 'ITC Limited',
    category: 'EQUITY_DIVIDEND',
    actionType: 'Interim Dividend',
    ratePerUnit: 6.25,
    rateLabel: '₹6.25 / Share (625%)',
    exDate: '2026-10-20',
    recordDate: '2026-10-21',
    paymentDate: '2026-11-05',
    status: 'UPCOMING'
  },
  {
    id: 'CA-003',
    ticker: 'SGB2028I',
    name: 'Sovereign Gold Bond 2028 Series I',
    category: 'SGB_COUPON',
    actionType: 'Semi-Annual Coupon',
    ratePerUnit: 77.5,
    rateLabel: '2.50% p.a. (₹77.50 / Unit)',
    exDate: '2026-10-01',
    recordDate: '2026-10-02',
    paymentDate: '2026-10-10',
    status: 'UPCOMING'
  },
  {
    id: 'CA-004',
    ticker: 'HDFCBANK.NS',
    name: 'HDFC Bank Ltd.',
    category: 'EQUITY_DIVIDEND',
    actionType: 'Special Dividend',
    ratePerUnit: 19.5,
    rateLabel: '₹19.50 / Share',
    exDate: '2026-11-03',
    recordDate: '2026-11-04',
    paymentDate: '2026-11-18',
    status: 'UPCOMING'
  },
  {
    id: 'CA-005',
    ticker: 'TATACAP-NCD-885',
    name: 'Tata Capital Financial Services 8.85%',
    category: 'BOND_INTEREST',
    actionType: 'Annual Coupon',
    ratePerUnit: 88.5,
    rateLabel: '8.85% p.a. (₹88.50 / Bond)',
    exDate: '2026-11-12',
    recordDate: '2026-11-13',
    paymentDate: '2026-11-25',
    status: 'UPCOMING'
  },
  {
    id: 'CA-006',
    ticker: 'RELIANCE.NS',
    name: 'Reliance Industries Limited',
    category: 'EQUITY_DIVIDEND',
    actionType: 'Final Dividend',
    ratePerUnit: 10.0,
    rateLabel: '₹10.00 / Share',
    exDate: '2026-11-28',
    recordDate: '2026-11-29',
    paymentDate: '2026-12-10',
    status: 'UPCOMING'
  },
  {
    id: 'CA-007',
    ticker: 'INFY.NS',
    name: 'Infosys Limited',
    category: 'BONUS_SPLIT',
    actionType: 'Stock Bonus Issue',
    ratePerUnit: 1,
    rateLabel: '1:1 Bonus Shares Allotment',
    exDate: '2026-12-05',
    recordDate: '2026-12-06',
    paymentDate: '2026-12-15',
    status: 'UPCOMING'
  }
];

export const CorporateActionsCalendar: React.FC = () => {
  const { dematHoldings, triggerCorporateAction } = useTradingSimulation();
  const { currency } = usePortfolio();

  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [creditedIds, setCreditedIds] = useState<Record<string, boolean>>({});

  // Compute matched holdings and expected yields
  const itemsWithHoldings = useMemo(() => {
    return SCHEDULED_ACTIONS.map(action => {
      // Find holding in Demat (Equity, SGB, Bond, NCD)
      let userQty = 0;
      const dematItem = dematHoldings.find(d => 
        d.ticker.toLowerCase() === action.ticker.toLowerCase() || 
        d.name.toLowerCase().includes(action.ticker.toLowerCase())
      );
      if (dematItem) {
        userQty += dematItem.qty;
      }

      const estimatedPayout = userQty * action.ratePerUnit;
      const isCredited = !!creditedIds[action.id];

      return {
        ...action,
        userQty,
        estimatedPayout,
        isCredited
      };
    });
  }, [dematHoldings, creditedIds]);

  const filteredItems = useMemo(() => {
    if (filterCategory === 'ALL') return itemsWithHoldings;
    return itemsWithHoldings.filter(item => item.category === filterCategory);
  }, [itemsWithHoldings, filterCategory]);

  const totalEligibleYield = useMemo(() => {
    return itemsWithHoldings.reduce((sum, item) => sum + (item.userQty > 0 && !item.isCredited ? item.estimatedPayout : 0), 0);
  }, [itemsWithHoldings]);

  const handleClaimYield = (item: typeof itemsWithHoldings[0]) => {
    if (item.userQty <= 0 || item.isCredited) return;

    triggerCorporateAction('DIVIDEND', item.ticker, item.estimatedPayout);
    setCreditedIds(prev => ({ ...prev, [item.id]: true }));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
        <div>
          <h3 className="text-lg font-black flex items-center gap-2 text-[var(--text-primary)]">
            <Calendar className="w-5 h-5 text-[var(--icici-orange)]" />
            Automated Corporate Actions & Yield Distribution Schedule
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Verified depository announcements: Quarterly dividends, semi-annual SGB interest & corporate bond coupon credits
          </p>
        </div>

        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-right">
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase block">
            Eligible Portfolio Yield
          </span>
          <span className="text-lg font-mono font-black text-emerald-600 dark:text-emerald-400">
            {currency}{totalEligibleYield.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-color)] pb-3">
        {[
          { id: 'ALL', label: 'All Actions' },
          { id: 'EQUITY_DIVIDEND', label: 'Equity Dividends' },
          { id: 'SGB_COUPON', label: 'Sovereign Gold (SGB)' },
          { id: 'BOND_INTEREST', label: 'Corporate Bonds (NCD)' },
          { id: 'BONUS_SPLIT', label: 'Bonus & Splits' }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilterCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterCategory === cat.id
                ? 'bg-[var(--icici-orange)] text-white shadow-sm'
                : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] border border-[var(--border-color)]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Corporate Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map(item => {
          const isEligible = item.userQty > 0;
          return (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition-all space-y-4 ${
                item.isCredited
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : isEligible
                  ? 'bg-[var(--bg-card)] border-[var(--icici-orange)]/40 shadow-md'
                  : 'bg-[var(--bg-tertiary)] border-[var(--border-color)]'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-sm text-[var(--text-primary)]">{item.ticker}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                      item.category === 'EQUITY_DIVIDEND' ? 'bg-blue-500/15 text-blue-500' :
                      item.category === 'SGB_COUPON' ? 'bg-amber-500/15 text-amber-500' :
                      item.category === 'BOND_INTEREST' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-purple-500/15 text-purple-500'
                    }`}>
                      {item.actionType}
                    </span>
                  </div>
                  <span className="text-xs text-[var(--text-secondary)] block font-medium mt-0.5">
                    {item.name}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 block">
                    {item.rateLabel}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">Rate per Unit</span>
                </div>
              </div>

              {/* Dates Timeline */}
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[11px] font-mono">
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block">Ex-Date</span>
                  <strong className="text-[var(--text-primary)]">{item.exDate}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block">Record Date</span>
                  <strong className="text-[var(--text-primary)]">{item.recordDate}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block">Payment Date</span>
                  <strong className="text-emerald-500">{item.paymentDate}</strong>
                </div>
              </div>

              {/* User Holding Eligibility & Auto-Credit */}
              <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block">Your Demat Holdings:</span>
                  <span className="text-xs font-mono font-bold text-[var(--text-primary)]">
                    {isEligible ? `${item.userQty.toLocaleString()} Units` : 'No units held'}
                  </span>
                </div>

                {isEligible ? (
                  item.isCredited ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-500">
                      <CheckCircle2 className="w-4 h-4" />
                      Credited to Wallet
                    </span>
                  ) : (
                    <button
                      onClick={() => handleClaimYield(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>Claim ₹{item.estimatedPayout.toFixed(2)}</span>
                    </button>
                  )
                ) : (
                  <span className="text-[10px] font-mono text-[var(--text-muted)] italic">
                    Buy in Demat to qualify
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
