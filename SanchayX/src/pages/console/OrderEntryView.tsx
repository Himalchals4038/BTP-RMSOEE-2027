import React, { useState } from 'react';
import {
  ShoppingCart,
  Search,
  Layers,
  BarChart2,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  GripVertical,
  ShieldAlert,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useTradingSimulation } from '../../context/TradingSimulationContext';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCompactCurrency } from '../../utils/financialMath';
import { InteractiveCandlestickChart } from '../../components/trading/InteractiveCandlestickChart';

interface OrderEntryViewProps {
  orderAction: 'BUY' | 'SELL';
  setOrderAction: (action: 'BUY' | 'SELL') => void;
  selectedAsset: string;
  setSelectedAsset: (ticker: string) => void;
  exchange: string;
  setExchange: (ex: string) => void;
  productType: string;
  setProductType: (pt: string) => void;
  orderType: string;
  setOrderType: (ot: string) => void;
  quantity: number;
  setQuantity: (q: number) => void;
  price: number;
  setPrice: (p: number) => void;
  triggerPrice: number;
  setTriggerPrice: (tp: number) => void;
  targetPrice: number;
  setTargetPrice: (tp: number) => void;
  stopLossPrice: number;
  setStopLossPrice: (sl: number) => void;
  trailingStopLoss: number;
  setTrailingStopLoss: (tsl: number) => void;
  icebergLegs: number;
  setIcebergLegs: (legs: number) => void;
  disclosedQty: number;
  setDisclosedQty: (dq: number) => void;
  handleSelectAsset: (ticker: string) => void;
  handlePlaceOrderSubmit: (e: React.FormEvent) => void;
  handlePreTradeAudit: () => void;
  orderFeedback: { type: 'success' | 'error'; message: string } | null;
  viewportMode: 'desktop' | 'mobile';
  filteredAssets: any[];
  selectedAssetObj: any;
  exchangeOptions: { id: string; label: string }[];
  l2Depth: {
    bids: { price: number; qty: number; orders: number }[];
    asks: { price: number; qty: number; orders: number }[];
    totalBidQty: number;
    totalAskQty: number;
  };
}

export const OrderEntryView: React.FC<OrderEntryViewProps> = ({
  orderAction,
  setOrderAction,
  selectedAsset,
  exchange,
  setExchange,
  productType,
  setProductType,
  orderType,
  setOrderType,
  quantity,
  setQuantity,
  price,
  setPrice,
  triggerPrice,
  setTriggerPrice,
  targetPrice,
  setTargetPrice,
  stopLossPrice,
  setStopLossPrice,
  trailingStopLoss,
  setTrailingStopLoss,
  icebergLegs,
  setIcebergLegs,
  disclosedQty,
  setDisclosedQty,
  handleSelectAsset,
  handlePlaceOrderSubmit,
  handlePreTradeAudit,
  orderFeedback,
  viewportMode,
  filteredAssets,
  selectedAssetObj,
  exchangeOptions,
  l2Depth
}) => {
  const {
    wallet,
    orders,
    cancelOrder,
    modifyOrderPrice,
    circuitBreakerState,
    triggerSimulatedCircuitBreaker,
    resetCircuitBreaker,
    sebiSnapshots,
    autoLiquidationAlert,
    dismissAutoLiquidation,
    panicSquareOffAllIntraday
  } = useTradingSimulation();
  const { currency } = usePortfolio();

  const [orderSearchQuery, setOrderSearchQuery] = useState<string>('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState<boolean>(false);
  const [activeRightTab, setActiveRightTab] = useState<'depth' | 'chart'>('chart');
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  const [dropTargetPrice, setDropTargetPrice] = useState<number | null>(null);
  const [dragModifyMessage, setDragModifyMessage] = useState<string | null>(null);

  // Institutional Smart Algo Slicing Parameters
  const [twapDuration, setTwapDuration] = useState<number>(10);
  const [twapSlices, setTwapSlices] = useState<number>(5);
  const [vwapSlices, setVwapSlices] = useState<number>(6);

  const searchedSecurities = React.useMemo(() => {
    if (!orderSearchQuery.trim()) return filteredAssets;
    const q = orderSearchQuery.toLowerCase().trim();
    return filteredAssets.filter(a =>
      a.ticker.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
    );
  }, [filteredAssets, orderSearchQuery]);

  const estOrderVal = quantity * price;

  // Find user's active pending orders for this ticker to mark on the L2 Ladder
  const userPendingOrders = orders.filter(
    o => o.ticker === selectedAsset && o.status === 'PENDING'
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
        <div>
          <h3 className="text-lg font-black flex items-center gap-2 text-[var(--text-primary)]">
            <ShoppingCart className="w-5 h-5 text-[var(--icici-orange)]" />
            Institutional DMA Multi-Asset Order Entry Console
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Direct Market Access to NSE, BSE, MCX with Bracket (BO), TWAP, VWAP & Stealth Iceberg Slicing
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[var(--bg-tertiary)] p-1 rounded-xl border border-[var(--border-color)]">
          <button
            type="button"
            onClick={() => setOrderAction('BUY')}
            className={`px-5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              orderAction === 'BUY'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            BUY ORDER [B]
          </button>
          <button
            type="button"
            onClick={() => setOrderAction('SELL')}
            className={`px-5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              orderAction === 'SELL'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            SELL ORDER [S]
          </button>
        </div>
      </div>

      {/* Auto-Liquidation 80% Maintenance Margin Call Alert */}
      {autoLiquidationAlert?.isActive && (
        <div className="p-4 rounded-2xl bg-rose-600/15 border-2 border-rose-500 flex flex-wrap items-center justify-between gap-4 animate-pulse">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  EMERGENCY AUTO-LIQUIDATION MARGIN CALL
                </span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-rose-500/20 text-rose-300 font-black">
                  Maintenance Margin {autoLiquidationAlert.maintenanceMarginPct}% (&lt;80% Limit)
                </span>
              </div>
              <p className="text-xs text-[var(--text-primary)] font-bold mt-1">
                Open intraday positions have incurred critical MTM losses (-₹{autoLiquidationAlert.mtmLoss.toLocaleString()}).
                Simulated auto square-off in{' '}
                <span className="font-mono text-sm text-rose-500 font-black">
                  {Math.floor(autoLiquidationAlert.remainingSeconds / 60)}:
                  {autoLiquidationAlert.remainingSeconds % 60 < 10 ? '0' : ''}
                  {autoLiquidationAlert.remainingSeconds % 60}
                </span>{' '}
                minutes!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => panicSquareOffAllIntraday()}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md cursor-pointer transition-all"
            >
              Panic Square-Off All MIS
            </button>
            <button
              onClick={() => dismissAutoLiquidation()}
              className="px-3 py-2 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)] cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* SEBI Circuit Breaker Sentinel Banner */}
      <div className={`p-4 rounded-2xl border transition-all ${
        circuitBreakerState.isHalted
          ? 'bg-rose-500/15 border-rose-500/50 shadow-md ring-2 ring-rose-500/30 animate-pulse'
          : 'bg-[var(--bg-card)] border-[var(--border-color)]'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${
              circuitBreakerState.isHalted ? 'bg-rose-500/20 text-rose-500' : 'bg-emerald-500/15 text-emerald-500'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-[var(--text-primary)]">
                  SEBI Index Circuit Breaker Sentinel
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.2 rounded font-extrabold ${
                  circuitBreakerState.isHalted
                    ? 'bg-rose-500 text-white'
                    : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                }`}>
                  {circuitBreakerState.marketPhase}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                {circuitBreakerState.reason} (NIFTY move: {circuitBreakerState.niftyMovePct}%)
              </p>
            </div>
          </div>

          {/* Interactive Simulation Controls */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[10px] font-bold text-[var(--text-muted)] mr-1">Simulate Halt:</span>
            <button
              type="button"
              onClick={() => triggerSimulatedCircuitBreaker(10)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 cursor-pointer"
            >
              10% (45m)
            </button>
            <button
              type="button"
              onClick={() => triggerSimulatedCircuitBreaker(15)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-500/30 cursor-pointer"
            >
              15% (45m)
            </button>
            <button
              type="button"
              onClick={() => triggerSimulatedCircuitBreaker(20)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-500/15 hover:bg-purple-500/25 text-purple-600 dark:text-purple-400 border border-purple-500/30 cursor-pointer"
            >
              20% (Day)
            </button>
            {circuitBreakerState.isHalted && (
              <button
                type="button"
                onClick={resetCircuitBreaker}
                className="px-3 py-1 rounded-lg text-[11px] font-black bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer ml-1 shadow-sm flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Resume
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SEBI 4-Time Intraday Peak Margin Snapshot Tracker */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--icici-orange)]" />
            <span className="text-xs font-black text-[var(--text-primary)]">
              SEBI 4-Time Intraday Peak Margin Snapshots (Mandate Audit)
            </span>
          </div>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">
            Captures random leverage snapshots (09:15–15:30 IST)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {sebiSnapshots.map((snap) => (
            <div
              key={snap.id}
              className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                snap.status === 'PENALTY_BREACH'
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-500'
                  : snap.status === 'WARNING'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-500'
                  : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-primary)]'
              }`}
            >
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-[var(--text-muted)]">{snap.timeStr}</span>
                <span className={`px-1.5 py-0.2 rounded font-black text-[9px] ${
                  snap.status === 'COMPLIANT'
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : snap.status === 'WARNING'
                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                    : 'bg-rose-500 text-white'
                }`}>
                  {snap.status}
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-0.5">
                <span className="font-extrabold text-xs">{snap.name.split(' ')[1]}</span>
                <span className="font-mono font-black text-xs">{snap.marginUtilizedPct}% Utilized</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Order Feedback Banner */}
      {orderFeedback && (
        <div className={`p-4 rounded-xl border text-xs font-bold flex items-center gap-2.5 animate-bounce ${
          orderFeedback.type === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
            : 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300'
        }`}>
          {orderFeedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
          )}
          <span>{orderFeedback.message}</span>
        </div>
      )}

      {/* Main Grid: Order Entry Form (Left) + Interactive Candlestick / Level-2 Depth (Right) */}
      <div className={`grid gap-6 ${viewportMode === 'mobile' ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-12'}`}>
        {/* Left Column: Form (5 cols on XL) */}
        <div className={viewportMode === 'mobile' ? 'w-full' : 'xl:col-span-5'}>
          <form onSubmit={handlePlaceOrderSubmit} className="space-y-4">
            {/* Searchable Security Selector */}
            <div className="space-y-1.5 relative">
              <label className="text-xs font-bold text-[var(--text-primary)]">Search & Select Security</label>
              <div className="relative">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Type ticker (e.g. RELIANCE, TCS, BTC)..."
                  value={isSearchDropdownOpen ? orderSearchQuery : `${selectedAssetObj.ticker} — ${selectedAssetObj.name}`}
                  onFocus={() => {
                    setOrderSearchQuery('');
                    setIsSearchDropdownOpen(true);
                  }}
                  onChange={(e) => {
                    setOrderSearchQuery(e.target.value);
                    setIsSearchDropdownOpen(true);
                  }}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl pl-9 pr-8 py-2.5 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)]"
                />
              </div>

              {isSearchDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 max-h-64 overflow-y-auto bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-2xl z-30 divide-y divide-[var(--border-subtle)]">
                  {searchedSecurities.length > 0 ? (
                    searchedSecurities.map(a => (
                      <div
                        key={a.ticker}
                        onClick={() => {
                          handleSelectAsset(a.ticker);
                          setIsSearchDropdownOpen(false);
                        }}
                        className={`p-3 hover:bg-[var(--bg-tertiary)] cursor-pointer flex items-center justify-between transition-colors ${
                          selectedAsset === a.ticker ? 'bg-[var(--bg-tertiary)] border-l-4 border-[var(--icici-orange)]' : ''
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-[var(--text-primary)]">{a.ticker}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                              a.category === 'Crypto' ? 'bg-amber-500/20 text-amber-500' :
                              a.category === 'Equities' ? 'bg-blue-500/20 text-blue-500' :
                              a.category === 'Bonds' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-purple-500/20 text-purple-500'
                            }`}>
                              {a.category}
                            </span>
                          </div>
                          <span className="text-[11px] text-[var(--text-secondary)] block truncate max-w-[200px]">{a.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-xs text-[var(--text-primary)] block">
                            {a.currency}{a.price.toLocaleString()}
                          </span>
                          <span className={`text-[10px] font-bold ${a.change24h >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {a.change24h >= 0 ? '+' : ''}{a.change24h}%
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-[var(--text-muted)] font-bold">
                      No matching security found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Exchange & Product Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-primary)]">Exchange</label>
                <select
                  value={exchange}
                  onChange={(e) => setExchange(e.target.value)}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-2 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)]"
                >
                  {exchangeOptions.map(ex => (
                    <option key={ex.id} value={ex.id} className="bg-[var(--bg-card)]">
                      {ex.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-primary)]">Product Type</label>
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-2 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)]"
                >
                  <option value="Delivery (CNC)">Delivery (CNC) — Cash & Carry</option>
                  <option value="Intraday (MIS)">Intraday (MIS) — 5x Leverage</option>
                  <option value="MTF (Margin)">MTF — Margin Trading (4x)</option>
                  <option value="F&O Carry">F&O Carry-Forward</option>
                </select>
              </div>
            </div>

            {/* Feature 2: Indian Broker Order Types */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[var(--text-primary)]">Order Type</label>
                <span className="text-[10px] font-mono text-[var(--icici-orange)] font-bold">
                  {orderType.includes('Bracket') ? 'Target + SL (OCO)' : orderType.includes('Cover') ? '10x Leverage' : orderType.includes('GTT') ? '365-Day Trigger' : orderType.includes('Iceberg') ? 'Sliced Legs' : 'Standard'}
                </span>
              </div>
              <select
                value={orderType}
                onChange={(e) => {
                  const val = e.target.value;
                  setOrderType(val);
                  if (val === 'Cover Order (CO)' || val === 'Bracket Order (BO)') {
                    setProductType('Intraday (MIS)');
                  }
                  if (val === 'Bracket Order (BO)') {
                    setTargetPrice(price + Math.round(price * 0.02));
                    setStopLossPrice(price - Math.round(price * 0.01));
                  } else if (val === 'Cover Order (CO)') {
                    setStopLossPrice(price - Math.round(price * 0.015));
                  }
                }}
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-2.5 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)]"
              >
                <option value="Limit Order">Limit Order</option>
                <option value="Market Order">Market Order (LTP)</option>
                <option value="Stop-Loss (SL)">Stop-Loss Limit (SL)</option>
                <option value="SL-Market (SL-M)">Stop-Loss Market (SL-M)</option>
                <option value="Bracket Order (BO)">Bracket Order (BO) — Target + Stop-Loss + Trailing SL</option>
                <option value="Cover Order (CO)">Cover Order (CO) — 10x Intraday Leverage</option>
                <option value="Good-Till-Triggered (GTT)">Good-Till-Triggered (GTT) — 365 Days Validity</option>
                <option value="Iceberg Order">Iceberg Order — Block Slicing</option>
                <option value="TWAP Order">TWAP Order — Institutional Time Slicing</option>
                <option value="VWAP Order">VWAP Order — Intraday Volume-Curve Slicing</option>
              </select>
            </div>

            {/* Qty & Price Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-primary)]">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-2 text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-primary)]">Order Price ({currency})</label>
                <input
                  type="number"
                  step="0.05"
                  disabled={orderType === 'Market Order'}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-2 text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)] disabled:opacity-50"
                />
              </div>
            </div>

            {/* Feature 2: Contextual Fields based on Order Type */}
            {/* 1. Stop-Loss Trigger */}
            {(orderType.includes('SL') || orderType.includes('GTT')) && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-500">Trigger Condition Price ({currency})</label>
                <input
                  type="number"
                  step="0.05"
                  value={triggerPrice}
                  onChange={(e) => setTriggerPrice(Number(e.target.value))}
                  className="w-full bg-[var(--bg-tertiary)] border border-amber-500/40 rounded-xl p-2 text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none"
                />
              </div>
            )}

            {/* 2. Bracket Order Fields */}
            {orderType === 'Bracket Order (BO)' && (
              <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-black text-purple-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Bracket Order OCO Target & Stop-Loss Legs</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-emerald-400 block">Target ({currency})</label>
                    <input
                      type="number"
                      step="0.05"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(Number(e.target.value))}
                      className="w-full bg-[var(--bg-card)] border border-emerald-500/40 rounded-lg p-1.5 text-xs font-mono font-bold text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-rose-400 block">Stop-Loss ({currency})</label>
                    <input
                      type="number"
                      step="0.05"
                      value={stopLossPrice}
                      onChange={(e) => setStopLossPrice(Number(e.target.value))}
                      className="w-full bg-[var(--bg-card)] border border-rose-500/40 rounded-lg p-1.5 text-xs font-mono font-bold text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-amber-400 block">Trailing SL (pts)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={trailingStopLoss}
                      onChange={(e) => setTrailingStopLoss(Number(e.target.value))}
                      className="w-full bg-[var(--bg-card)] border border-amber-500/40 rounded-lg p-1.5 text-xs font-mono font-bold text-[var(--text-primary)]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. Cover Order Stop-Loss Field */}
            {orderType === 'Cover Order (CO)' && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-rose-400">
                  <span>Mandatory Cover Stop-Loss (10x Leverage Active)</span>
                  <span className="text-[10px] font-mono">10% Upfront Margin</span>
                </div>
                <input
                  type="number"
                  step="0.05"
                  value={stopLossPrice}
                  onChange={(e) => setStopLossPrice(Number(e.target.value))}
                  placeholder="Stop-loss price..."
                  className="w-full bg-[var(--bg-card)] border border-rose-500/40 rounded-lg p-2 text-xs font-mono font-bold text-[var(--text-primary)]"
                />
              </div>
            )}

            {/* 4. Iceberg Order Legs */}
            {orderType === 'Iceberg Order' && (
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-blue-400">
                  <span>Iceberg Slicing Parameters</span>
                  <span className="text-[10px] font-mono">{icebergLegs} Legs ({Math.round(quantity / icebergLegs)} shares/leg)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-[var(--text-muted)] block">Number of Legs</label>
                    <input
                      type="number"
                      min="2"
                      max="10"
                      value={icebergLegs}
                      onChange={(e) => {
                        const legs = Math.max(2, Number(e.target.value));
                        setIcebergLegs(legs);
                        setDisclosedQty(Math.round(quantity / legs));
                      }}
                      className="w-full bg-[var(--bg-card)] border border-blue-500/40 rounded-lg p-1.5 text-xs font-mono font-bold text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[var(--text-muted)] block">Disclosed Qty per Leg</label>
                    <input
                      type="number"
                      min="1"
                      value={disclosedQty}
                      onChange={(e) => setDisclosedQty(Number(e.target.value))}
                      className="w-full bg-[var(--bg-card)] border border-blue-500/40 rounded-lg p-1.5 text-xs font-mono font-bold text-[var(--text-primary)]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 5. TWAP Order Parameters */}
            {orderType === 'TWAP Order' && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-amber-500">
                  <span>Institutional TWAP Execution Parameters</span>
                  <span className="text-[10px] font-mono">{twapSlices} Slices ({Math.max(1, Math.floor(quantity / twapSlices))} shares/slice)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-[var(--text-muted)] block">Total Duration</label>
                    <select
                      value={twapDuration}
                      onChange={(e) => setTwapDuration(Number(e.target.value))}
                      className="w-full bg-[var(--bg-card)] border border-amber-500/40 rounded-lg p-1.5 text-xs font-mono font-bold text-[var(--text-primary)]"
                    >
                      <option value="5">5 Minutes</option>
                      <option value="10">10 Minutes</option>
                      <option value="15">15 Minutes</option>
                      <option value="30">30 Minutes</option>
                      <option value="60">1 Hour</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[var(--text-muted)] block">Time Slices Count</label>
                    <select
                      value={twapSlices}
                      onChange={(e) => setTwapSlices(Number(e.target.value))}
                      className="w-full bg-[var(--bg-card)] border border-amber-500/40 rounded-lg p-1.5 text-xs font-mono font-bold text-[var(--text-primary)]"
                    >
                      <option value="3">3 Slices</option>
                      <option value="5">5 Slices (Default)</option>
                      <option value="10">10 Slices</option>
                      <option value="15">15 Slices</option>
                    </select>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-[var(--text-secondary)]">
                  Pace: 1 slice executed every {(twapDuration / twapSlices).toFixed(1)} mins to eliminate market impact.
                </div>
              </div>
            )}

            {/* 6. VWAP Order Parameters */}
            {orderType === 'VWAP Order' && (
              <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-purple-400">
                  <span>Institutional VWAP Volume-Curve Engine</span>
                  <span className="text-[10px] font-mono">{vwapSlices} Tranches</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-[var(--text-muted)] block">Volume Tranches</label>
                    <select
                      value={vwapSlices}
                      onChange={(e) => setVwapSlices(Number(e.target.value))}
                      className="w-full bg-[var(--bg-card)] border border-purple-500/40 rounded-lg p-1.5 text-xs font-mono font-bold text-[var(--text-primary)]"
                    >
                      <option value="4">4 Tranches</option>
                      <option value="6">6 Tranches (U-Curve)</option>
                      <option value="8">8 Tranches (Granular)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[var(--text-muted)] block">Initial Fill Size</label>
                    <div className="p-1.5 rounded-lg bg-[var(--bg-card)] border border-purple-500/30 font-mono font-bold text-xs text-purple-500">
                      {Math.round(quantity * 0.25)} shares (25%)
                    </div>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-[var(--text-secondary)]">
                  Shapes execution to track Indian exchange volume profile (heavy morning/closing weights).
                </div>
              </div>
            )}

            {/* Quick Quantity Presets */}
            <div className="flex items-center gap-1.5 text-xs pt-1">
              <span className="text-[10px] font-bold text-[var(--text-muted)]">Quick:</span>
              {[25, 50, 100, 250, 500].map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuantity(q)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                    quantity === q
                      ? 'bg-[var(--icici-orange)] text-white'
                      : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] border border-[var(--border-color)]'
                  }`}
                >
                  +{q}
                </button>
              ))}
            </div>

            {/* Margin Summary */}
            <div className="p-3.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-[var(--text-muted)] block text-[9px] font-bold uppercase">Order Value</span>
                <span className="font-mono font-extrabold text-sm text-[var(--text-primary)]">
                  {formatCompactCurrency(estOrderVal, currency)}
                </span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block text-[9px] font-bold uppercase">Required</span>
                <span className="font-mono font-extrabold text-sm text-[var(--icici-orange)]">
                  {formatCompactCurrency(
                    orderType === 'Cover Order (CO)' ? estOrderVal * 0.1 :
                    productType.includes('Intraday') ? estOrderVal * 0.2 : estOrderVal,
                    currency
                  )}
                </span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block text-[9px] font-bold uppercase">Margin Avail</span>
                <span className="font-mono font-extrabold text-sm text-emerald-500">
                  {formatCompactCurrency(wallet.availableMargin, currency)}
                </span>
              </div>
            </div>

            {/* Action Buttons: Pre-Trade Audit & Submit Order */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handlePreTradeAudit}
                className="py-3 px-3 rounded-xl font-black text-xs bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card-hover)] border-2 border-[var(--icici-orange)]/40 hover:border-[var(--icici-orange)] text-[var(--icici-orange)] shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>WHAT-IF AUDIT</span>
              </button>

              <button
                type="submit"
                className={`py-3 px-3 rounded-xl font-black text-xs text-white shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  orderAction === 'BUY'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>SUBMIT {orderAction}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: DMA Interactive Candlestick Engine & Level-2 Ladder (7 cols on XL) */}
        <div className={viewportMode === 'mobile' ? 'w-full' : 'xl:col-span-7 space-y-4'}>
          {/* View Switcher: Chart vs Level-2 Ladder */}
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
            <div className="flex items-center gap-1 bg-[var(--bg-tertiary)] p-0.5 rounded-xl border border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => setActiveRightTab('chart')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeRightTab === 'chart'
                    ? 'bg-[var(--icici-orange)] text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>DMA Candlestick & Indicators</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveRightTab('depth')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeRightTab === 'depth'
                    ? 'bg-[var(--icici-orange)] text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Interactive Level-2 Depth Ladder</span>
              </button>
            </div>

            <span className="text-[10px] font-mono font-bold text-[var(--text-muted)]">
              LTP: {currency}{selectedAssetObj.price.toFixed(2)}
            </span>
          </div>

          {/* View 1: Candlestick Chart Engine */}
          {activeRightTab === 'chart' && (
            <InteractiveCandlestickChart
              ticker={selectedAsset}
              basePrice={selectedAssetObj.price}
              currency={currency}
            />
          )}

          {/* View 2: Interactive Level-2 Ladder (Feature 3) */}
          {activeRightTab === 'depth' && (
            <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                <div>
                  <div className="text-xs font-black text-[var(--text-primary)] flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[var(--icici-orange)]" />
                    <span>Level-2 Virtual Ladder (Click rung to fill form)</span>
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)]">
                    Real-time liquidity depth with user order queue tags
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] block">Spread</span>
                  <div className="text-xs font-mono font-bold text-amber-500">
                    ₹{Math.max(0.05, ((l2Depth.asks[0]?.price || price) - (l2Depth.bids[0]?.price || price))).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Drag to modify instructions & feedback message */}
              {dragModifyMessage && (
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{dragModifyMessage}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-3 py-1.5 rounded-xl border border-[var(--border-subtle)]">
                <span className="flex items-center gap-1">
                  <GripVertical className="w-3 h-3 text-[var(--icici-orange)]" />
                  Drag <strong className="text-[var(--text-primary)]">YOURS</strong> tag up/down ladder to re-quote price
                </span>
                <span className="font-mono text-emerald-500 font-bold">Live Margin Validated</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* BIDS (BUYERS) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-emerald-600 dark:text-emerald-400 pb-1 border-b border-emerald-500/20">
                    <span>BUYERS</span>
                    <span>ORDERS / QTY</span>
                  </div>
                  <div className="space-y-1">
                    {l2Depth.bids.map((b, idx) => {
                      const depthPct = Math.min(100, Math.round((b.qty / (l2Depth.totalBidQty || 1)) * 100));
                      // Check if user has a pending order at this exact price
                      const matchingUserOrder = userPendingOrders.find(o => Math.abs(o.price - b.price) < 0.01 && o.action === 'BUY');
                      const isDropTarget = dropTargetPrice === b.price;

                      return (
                        <div
                          key={`bid-${idx}`}
                          onClick={() => {
                            setPrice(b.price);
                            setQuantity(b.qty);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDropTargetPrice(b.price);
                          }}
                          onDragLeave={() => {
                            if (dropTargetPrice === b.price) setDropTargetPrice(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const ordId = e.dataTransfer.getData('text/plain') || draggedOrderId;
                            if (ordId) {
                              const res = modifyOrderPrice(ordId, b.price);
                              setDragModifyMessage(res.message);
                              setTimeout(() => setDragModifyMessage(null), 4000);
                            }
                            setDraggedOrderId(null);
                            setDropTargetPrice(null);
                          }}
                          className={`relative p-1.5 rounded-lg hover:bg-emerald-500/15 cursor-pointer transition-all overflow-hidden flex items-center justify-between font-mono text-[11px] ${
                            isDropTarget ? 'ring-2 ring-emerald-400 bg-emerald-500/25 scale-[1.02]' : ''
                          }`}
                          title="Click to fill price & qty, or drop pending order here to modify price"
                        >
                          <div
                            className="absolute inset-y-0 left-0 bg-emerald-500/15 pointer-events-none transition-all duration-300"
                            style={{ width: `${depthPct}%` }}
                          />
                          <div className="flex items-center gap-1 relative z-10">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{b.price.toFixed(2)}</span>
                            {matchingUserOrder && (
                              <span
                                draggable={true}
                                onDragStart={(e) => {
                                  e.stopPropagation();
                                  e.dataTransfer.setData('text/plain', matchingUserOrder.id);
                                  setDraggedOrderId(matchingUserOrder.id);
                                }}
                                onDragEnd={() => {
                                  setDraggedOrderId(null);
                                  setDropTargetPrice(null);
                                }}
                                className="px-1.5 py-0.5 rounded text-[8px] font-black bg-blue-600 text-white flex items-center gap-0.5 cursor-grab active:cursor-grabbing shadow-xs select-none"
                                title="Drag to another rung or use +/- to amend price"
                              >
                                <GripVertical className="w-2.5 h-2.5 opacity-80" />
                                <span>YOURS ({matchingUserOrder.qty ?? matchingUserOrder.quantity})</span>
                                
                                {/* Micro Nudge Price Adjustment Buttons */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const res = modifyOrderPrice(matchingUserOrder.id, Number((matchingUserOrder.price + 0.50).toFixed(2)));
                                    setDragModifyMessage(res.message);
                                    setTimeout(() => setDragModifyMessage(null), 4000);
                                  }}
                                  className="ml-0.5 px-0.5 hover:bg-blue-700 rounded font-mono font-black text-[9px]"
                                  title="Nudge price +₹0.50"
                                >
                                  +
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const res = modifyOrderPrice(matchingUserOrder.id, Math.max(0.50, Number((matchingUserOrder.price - 0.50).toFixed(2))));
                                    setDragModifyMessage(res.message);
                                    setTimeout(() => setDragModifyMessage(null), 4000);
                                  }}
                                  className="px-0.5 hover:bg-blue-700 rounded font-mono font-black text-[9px]"
                                  title="Nudge price -₹0.50"
                                >
                                  -
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    cancelOrder(matchingUserOrder.id);
                                  }}
                                  className="hover:text-rose-200 cursor-pointer ml-0.5"
                                  title="Cancel your order at this level"
                                >
                                  ×
                                </button>
                              </span>
                            )}
                          </div>
                          <span className="text-[var(--text-primary)] relative z-10">{b.orders} / {b.qty.toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono font-bold text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)]">
                    <span>Total Bids:</span>
                    <span className="text-emerald-500">{l2Depth.totalBidQty.toLocaleString()}</span>
                  </div>
                </div>

                {/* ASKS (SELLERS) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-rose-600 dark:text-rose-400 pb-1 border-b border-rose-500/20">
                    <span>SELLERS</span>
                    <span>QTY / ORDERS</span>
                  </div>
                  <div className="space-y-1">
                    {l2Depth.asks.map((a, idx) => {
                      const depthPct = Math.min(100, Math.round((a.qty / (l2Depth.totalAskQty || 1)) * 100));
                      const matchingUserOrder = userPendingOrders.find(o => Math.abs(o.price - a.price) < 0.01 && o.action === 'SELL');
                      const isDropTarget = dropTargetPrice === a.price;

                      return (
                        <div
                          key={`ask-${idx}`}
                          onClick={() => {
                            setPrice(a.price);
                            setQuantity(a.qty);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDropTargetPrice(a.price);
                          }}
                          onDragLeave={() => {
                            if (dropTargetPrice === a.price) setDropTargetPrice(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const ordId = e.dataTransfer.getData('text/plain') || draggedOrderId;
                            if (ordId) {
                              const res = modifyOrderPrice(ordId, a.price);
                              setDragModifyMessage(res.message);
                              setTimeout(() => setDragModifyMessage(null), 4000);
                            }
                            setDraggedOrderId(null);
                            setDropTargetPrice(null);
                          }}
                          className={`relative p-1.5 rounded-lg hover:bg-rose-500/15 cursor-pointer transition-all overflow-hidden flex items-center justify-between font-mono text-[11px] ${
                            isDropTarget ? 'ring-2 ring-rose-400 bg-rose-500/25 scale-[1.02]' : ''
                          }`}
                          title="Click to fill price & qty, or drop pending order here to modify price"
                        >
                          <div
                            className="absolute inset-y-0 right-0 bg-rose-500/15 pointer-events-none transition-all duration-300"
                            style={{ width: `${depthPct}%` }}
                          />
                          <span className="text-[var(--text-primary)] relative z-10">{a.qty.toLocaleString()} / {a.orders}</span>
                          <div className="flex items-center gap-1 relative z-10">
                            {matchingUserOrder && (
                              <span
                                draggable={true}
                                onDragStart={(e) => {
                                  e.stopPropagation();
                                  e.dataTransfer.setData('text/plain', matchingUserOrder.id);
                                  setDraggedOrderId(matchingUserOrder.id);
                                }}
                                onDragEnd={() => {
                                  setDraggedOrderId(null);
                                  setDropTargetPrice(null);
                                }}
                                className="px-1.5 py-0.5 rounded text-[8px] font-black bg-purple-600 text-white flex items-center gap-0.5 cursor-grab active:cursor-grabbing shadow-xs select-none"
                                title="Drag to another rung or use +/- to amend price"
                              >
                                <GripVertical className="w-2.5 h-2.5 opacity-80" />
                                <span>YOURS ({matchingUserOrder.qty ?? matchingUserOrder.quantity})</span>
                                
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const res = modifyOrderPrice(matchingUserOrder.id, Number((matchingUserOrder.price + 0.50).toFixed(2)));
                                    setDragModifyMessage(res.message);
                                    setTimeout(() => setDragModifyMessage(null), 4000);
                                  }}
                                  className="ml-0.5 px-0.5 hover:bg-purple-700 rounded font-mono font-black text-[9px]"
                                  title="Nudge price +₹0.50"
                                >
                                  +
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const res = modifyOrderPrice(matchingUserOrder.id, Math.max(0.50, Number((matchingUserOrder.price - 0.50).toFixed(2))));
                                    setDragModifyMessage(res.message);
                                    setTimeout(() => setDragModifyMessage(null), 4000);
                                  }}
                                  className="px-0.5 hover:bg-purple-700 rounded font-mono font-black text-[9px]"
                                  title="Nudge price -₹0.50"
                                >
                                  -
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    cancelOrder(matchingUserOrder.id);
                                  }}
                                  className="hover:text-rose-200 cursor-pointer ml-0.5"
                                  title="Cancel your order at this level"
                                >
                                  ×
                                </button>
                              </span>
                            )}
                            <span className="font-bold text-rose-600 dark:text-rose-400">₹{a.price.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono font-bold text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)]">
                    <span>Total Asks:</span>
                    <span className="text-rose-500">{l2Depth.totalAskQty.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Buy vs Sell Pressure Bar */}
              <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-emerald-500">
                    Buy Pressure: {Math.round((l2Depth.totalBidQty / Math.max(1, l2Depth.totalBidQty + l2Depth.totalAskQty)) * 100)}%
                  </span>
                  <span className="text-rose-500">
                    Sell Pressure: {Math.round((l2Depth.totalAskQty / Math.max(1, l2Depth.totalBidQty + l2Depth.totalAskQty)) * 100)}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-rose-500/40 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{
                      width: `${(l2Depth.totalBidQty / Math.max(1, l2Depth.totalBidQty + l2Depth.totalAskQty)) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default OrderEntryView;
