import React, { useState } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCompactCurrency } from '../../utils/financialMath';
import {
  X,
  ShoppingCart,
  TrendingUp,
  Clock,
  CheckCircle2,
  Download,
  Sliders,
  ShieldCheck,
  Zap,
  RefreshCw,
  Plus,
  Building2,
  FileText,
  CreditCard,
  Coins,
  ShieldAlert,
  HeartPulse,
  Award,
  Sparkles,
  PiggyBank,
  FileCheck,
  Rocket,
  Landmark,
  Shield
} from 'lucide-react';

interface Props {
  subTab: string;
  onClose: () => void;
}

export const ICICIQuickSubView: React.FC<Props> = ({ subTab, onClose }) => {
  const { assets, currency } = usePortfolio();

  // State for Place Order Form
  const [orderAction, setOrderAction] = useState<'BUY' | 'SELL'>('BUY');
  const [selectedAsset, setSelectedAsset] = useState<string>(assets[0]?.ticker || 'RELIANCE.NS');
  const [exchange, setExchange] = useState<string>('NSE');
  const [productType, setProductType] = useState<string>('Delivery (CNC)');
  const [orderType, setOrderType] = useState<string>('Limit Order');
  const [quantity, setQuantity] = useState<number>(100);
  const [price, setPrice] = useState<number>(2450);
  const [triggerPrice, setTriggerPrice] = useState<number>(2420);
  const [orderPlacedSuccess, setOrderPlacedSuccess] = useState<boolean>(false);

  // State for Add Funds Modal inside Funds section
  const [addFundsAmount, setAddFundsAmount] = useState<number>(50000);
  const [fundSuccessMsg, setFundSuccessMsg] = useState<boolean>(false);
  const [availableMargin, setAvailableMargin] = useState<number>(485000);

  // State for Live Refreshing IPOs
  const [isIpoRefreshing, setIsIpoRefreshing] = useState(false);
  const [ipoLastUpdated, setIpoLastUpdated] = useState<string>('Just now');
  const [ipoAppliedMsg, setIpoAppliedMsg] = useState<string | null>(null);
  const [ipoList, setIpoList] = useState([
    {
      id: 'ipo-1',
      name: 'Swiggy Limited',
      category: 'Mainboard IPO',
      dates: '13 Aug - 16 Aug 2026',
      priceBand: '₹371 - ₹390',
      lotSize: '38 Shares (₹14,820)',
      subMultiple: '34.8x',
      gmp: '+₹145 (+37.1%)',
      status: 'OPEN FOR BIDDING',
      rating: 'High Growth / Subscribe'
    },
    {
      id: 'ipo-2',
      name: 'Hyundai Motor India Ltd',
      category: 'Mainboard IPO',
      dates: '20 Aug - 24 Aug 2026',
      priceBand: '₹1,860 - ₹1,960',
      lotSize: '7 Shares (₹13,720)',
      subMultiple: '18.4x',
      gmp: '+₹310 (+15.8%)',
      status: 'OPEN FOR BIDDING',
      rating: 'Institutional Choice'
    },
    {
      id: 'ipo-3',
      name: 'Bajaj Housing Finance Ltd',
      category: 'Mainboard IPO',
      dates: '28 Aug - 31 Aug 2026',
      priceBand: '₹66 - ₹70',
      lotSize: '214 Shares (₹14,980)',
      subMultiple: '65.2x',
      gmp: '+₹52 (+74.2%)',
      status: 'UPCOMING',
      rating: 'Blockbuster Demand'
    },
    {
      id: 'ipo-4',
      name: 'Brainbees Solutions (FirstCry)',
      category: 'Mainboard IPO',
      dates: '02 Sep - 05 Sep 2026',
      priceBand: '₹440 - ₹465',
      lotSize: '32 Shares (₹14,880)',
      subMultiple: '12.1x',
      gmp: '+₹65 (+13.9%)',
      status: 'UPCOMING',
      rating: 'Retail Pick'
    }
  ]);

  // State for Live Refreshing FD & Bonds
  const [isFdRefreshing, setIsFdRefreshing] = useState(false);
  const [fdLastUpdated, setFdLastUpdated] = useState<string>('Just now');
  const [fdInvestedMsg, setFdInvestedMsg] = useState<string | null>(null);
  const [fdList] = useState([
    {
      id: 'fd-1',
      issuer: 'Shriram Finance Fixed Deposit',
      type: 'Corporate FD',
      rating: 'CRISIL AAA',
      tenure: '36 to 60 Months',
      rate: '8.80% p.a.',
      seniorBonus: '+0.50% Senior Citizen',
      payout: 'Monthly / Annual / Cumulative'
    },
    {
      id: 'fd-2',
      issuer: 'RBI Floating Rate Savings Bond',
      type: 'Sovereign Govt Bond',
      rating: 'Sovereign (Govt of India)',
      tenure: '7 Years Lock-in',
      rate: '8.05% p.a.',
      seniorBonus: 'Taxable at Slab Rate',
      payout: 'Semi-Annual Coupon'
    },
    {
      id: 'fd-3',
      issuer: 'HDFC Bank Senior Deposit',
      type: 'Bank FD',
      rating: 'CARE AAA',
      tenure: '15 to 35 Months',
      rate: '7.75% p.a.',
      seniorBonus: '+0.50% Extra Yield',
      payout: 'Quarterly Reinvestment'
    },
    {
      id: 'fd-4',
      issuer: 'L&T Finance Secured NCD Bond',
      type: 'Corporate Bond (NCD)',
      rating: 'ICRA AA+',
      tenure: '3 Years (Listed NSE)',
      rate: '9.15% YTM',
      seniorBonus: 'Tradable in Demat',
      payout: 'Annual Interest'
    }
  ]);

  // State for Sovereign Gold Purchase
  const [sgbGrams, setSgbGrams] = useState<number>(10);
  const [goldSuccessMsg, setGoldSuccessMsg] = useState<boolean>(false);

  // State for Loan Against Shares Calculator
  const [pledgeVal, setPledgeVal] = useState<number>(500000);

  // Mock Position Data
  const [positions, setPositions] = useState([
    { ticker: 'RELIANCE.NS', name: 'Reliance Industries', product: 'MIS Intraday', qty: 200, buyPrice: 2420, ltp: 2450.5, pnl: 6100, pnlPct: 1.26 },
    { ticker: 'NIFTY 24500 CE', name: 'NIFTY 28 Aug Call Option', product: 'F&O Options', qty: 150, buyPrice: 120, ltp: 165.5, pnl: 6825, pnlPct: 37.9 },
    { ticker: 'HDFCBANK.NS', name: 'HDFC Bank Ltd', product: 'MTF Margin', qty: 300, buyPrice: 1610, ltp: 1625, pnl: 4500, pnlPct: 0.93 },
    { ticker: 'INFY.NS', name: 'Infosys Limited', product: 'Delivery (CNC)', qty: 100, buyPrice: 1820, ltp: 1810, pnl: -1000, pnlPct: -0.55 }
  ]);

  // Mock Order Book Data
  const [orderBook, setOrderBook] = useState([
    { id: 'ORD-89210', time: '14:22:05', ticker: 'RELIANCE.NS', action: 'BUY', product: 'Delivery (CNC)', qty: 100, price: 2450.00, status: 'EXECUTED' },
    { id: 'ORD-89209', time: '14:10:12', ticker: 'TATAMOTORS.NS', action: 'BUY', product: 'MIS Intraday', qty: 250, price: 980.50, status: 'PENDING' },
    { id: 'ORD-89208', time: '12:45:30', ticker: 'NIFTY 24500 CE', action: 'BUY', product: 'F&O Options', qty: 150, price: 120.00, status: 'EXECUTED' },
    { id: 'ORD-89207', time: '11:15:00', ticker: 'HDFCBANK.NS', action: 'SELL', product: 'MTF Margin', qty: 100, price: 1630.00, status: 'CANCELLED' }
  ]);

  // Mock Trade Book Data
  const tradeBook = [
    { id: 'TRD-55102', time: '14:22:05', ticker: 'RELIANCE.NS', action: 'BUY', qty: 100, price: 2450.00, brokerage: 45.20, netValue: 245045.20 },
    { id: 'TRD-55101', time: '12:45:30', ticker: 'NIFTY 24500 CE', action: 'BUY', qty: 150, price: 120.00, brokerage: 20.00, netValue: 18020.00 },
    { id: 'TRD-55099', time: '10:05:15', ticker: 'INFY.NS', action: 'BUY', qty: 100, price: 1820.00, brokerage: 36.40, netValue: 182036.40 }
  ];

  // Mock Demat Holdings
  const dematHoldings = [
    { ticker: 'RELIANCE.NS', name: 'Reliance Industries', qty: 150, avgCost: 2100, ltp: 2450.50, val: 367575, pnl: 52575, pnlPct: 16.69, pledged: 'Unpledged' },
    { ticker: 'HDFCBANK.NS', name: 'HDFC Bank Ltd', qty: 250, avgCost: 1450, ltp: 1625.00, val: 406250, pnl: 43750, pnlPct: 12.07, pledged: 'Pledged (₹3L)' },
    { ticker: 'TCS.NS', name: 'Tata Consultancy Services', qty: 80, avgCost: 3600, ltp: 4150.00, val: 332000, pnl: 44000, pnlPct: 15.28, pledged: 'Unpledged' },
    { ticker: 'ICICIBANK.NS', name: 'ICICI Bank Ltd', qty: 350, avgCost: 920, ltp: 1180.00, val: 413000, pnl: 91000, pnlPct: 28.26, pledged: 'Unpledged' }
  ];

  const handlePlaceOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderPlacedSuccess(true);
    const newOrder = {
      id: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
      time: new Date().toLocaleTimeString(),
      ticker: selectedAsset,
      action: orderAction,
      product: productType,
      qty: quantity,
      price: price,
      status: 'EXECUTED'
    };
    setOrderBook([newOrder, ...orderBook]);
    setTimeout(() => setOrderPlacedSuccess(false), 4000);
  };

  const handleSquareOff = (ticker: string) => {
    setPositions(positions.filter(p => p.ticker !== ticker));
  };

  const handleAddFundsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAvailableMargin(prev => prev + Number(addFundsAmount));
    setFundSuccessMsg(true);
    setTimeout(() => setFundSuccessMsg(false), 3000);
  };

  const handleRefreshIpoData = () => {
    setIsIpoRefreshing(true);
    setTimeout(() => {
      setIpoList(prev => prev.map(ipo => ({
        ...ipo,
        subMultiple: `${(parseFloat(ipo.subMultiple) + (Math.random() * 1.5)).toFixed(1)}x`,
        gmp: `+₹${Math.floor(100 + Math.random() * 200)} (+${(15 + Math.random() * 30).toFixed(1)}%)`
      })));
      setIpoLastUpdated(new Date().toLocaleTimeString());
      setIsIpoRefreshing(false);
    }, 1000);
  };

  const handleRefreshFdData = () => {
    setIsFdRefreshing(true);
    setTimeout(() => {
      setFdLastUpdated(new Date().toLocaleTimeString());
      setIsFdRefreshing(false);
    }, 1000);
  };

  const handleApplyIpo = (ipoName: string) => {
    setIpoAppliedMsg(`ASBA Bid Submitted for ${ipoName}! Application Ref: ASBA-${Math.floor(100000 + Math.random() * 900000)}`);
    setTimeout(() => setIpoAppliedMsg(null), 4000);
  };

  const handleInvestFd = (issuer: string) => {
    setFdInvestedMsg(`FD Deposit Application initiated for ${issuer}! Order ID: FD-${Math.floor(100000 + Math.random() * 900000)}`);
    setTimeout(() => setFdInvestedMsg(null), 4000);
  };

  const selectedAssetObj = assets.find(a => a.ticker === selectedAsset) || assets[0];
  const estOrderVal = quantity * price;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 lg:p-6 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="glass-card bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Modal Header Bar */}
        <div className="bg-[var(--icici-gradient)] text-white px-5 py-3.5 rounded-t-2xl flex items-center justify-between sticky top-0 z-20 shadow-md">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-white text-[#d32f2f] font-black text-lg flex items-center justify-center italic shadow-sm shrink-0">
              i
            </span>
            <div>
              <h2 className="text-base font-extrabold uppercase tracking-wide italic text-white drop-shadow-xs">
                ApexQuant Trading Console
              </h2>
              <p className="text-xs text-amber-200 font-bold tracking-wide mt-0.5 drop-shadow-xs">
                Institutional Order Execution & Account Services
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white text-[#d32f2f] hover:bg-orange-100 shadow-md font-bold transition-all cursor-pointer flex items-center justify-center border border-white/50"
            title="Close Console"
            aria-label="Close"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Console Body Content depending on subTab */}
        <div className="p-5 space-y-6 flex-1">
          {/* SECTION 1: PLACE ORDER */}
          {subTab === 'place_order' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <h3 className="text-base font-bold flex items-center gap-2 text-[var(--text-primary)]">
                  <ShoppingCart className="w-5 h-5 text-[var(--icici-orange)]" />
                  Equity & F&O Order Entry Form
                </h3>
                <div className="flex items-center gap-1 bg-[var(--bg-tertiary)] p-1 rounded-lg border border-[var(--border-color)]">
                  <button
                    onClick={() => setOrderAction('BUY')}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      orderAction === 'BUY'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    BUY ORDER
                  </button>
                  <button
                    onClick={() => setOrderAction('SELL')}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      orderAction === 'SELL'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    SELL ORDER
                  </button>
                </div>
              </div>

              {orderPlacedSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-bounce">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  Order Placed Successfully! Sent to Exchange ({exchange}) matching engine. View in Order Book.
                </div>
              )}

              <form onSubmit={handlePlaceOrderSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Symbol Selector */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--text-primary)]">Select Security / Instrument</label>
                    <select
                      value={selectedAsset}
                      onChange={(e) => {
                        setSelectedAsset(e.target.value);
                        const found = assets.find(a => a.ticker === e.target.value);
                        if (found) setPrice(found.price);
                      }}
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-2 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)]"
                    >
                      {assets.map(a => (
                        <option key={a.ticker} value={a.ticker} className="bg-[var(--bg-card)]">
                          {a.ticker} — {a.name} ({a.currency}{a.price})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Exchange */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--text-primary)]">Exchange Segment</label>
                    <select
                      value={exchange}
                      onChange={(e) => setExchange(e.target.value)}
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-2 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)]"
                    >
                      <option value="NSE">NSE — National Stock Exchange</option>
                      <option value="BSE">BSE — Bombay Stock Exchange</option>
                      <option value="NFO">NFO — National Futures & Options</option>
                      <option value="MCX">MCX — Multi Commodity Exchange</option>
                      <option value="NASDAQ">NASDAQ — US Market</option>
                    </select>
                  </div>

                  {/* Product Type */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--text-primary)]">Product Type</label>
                    <select
                      value={productType}
                      onChange={(e) => setProductType(e.target.value)}
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-2 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)]"
                    >
                      <option value="Delivery (CNC)">Delivery (CNC) — Cash & Carry</option>
                      <option value="Intraday (MIS)">Intraday (MIS) — Margin Intraday</option>
                      <option value="MTF (Margin)">MTF — Margin Trading Facility (4x Leverage)</option>
                      <option value="F&O Carry">F&O Derivatives Carry-Forward</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Order Type */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--text-primary)]">Order Type</label>
                    <select
                      value={orderType}
                      onChange={(e) => setOrderType(e.target.value)}
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-2 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)]"
                    >
                      <option value="Limit Order">Limit Order</option>
                      <option value="Market Order">Market Order (LTP)</option>
                      <option value="Stop-Loss (SL)">Stop-Loss Limit (SL)</option>
                      <option value="SL-Market (SL-M)">Stop-Loss Market (SL-M)</option>
                    </select>
                  </div>

                  {/* Quantity */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--text-primary)]">Quantity (Shares/Lots)</label>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-2 text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)]"
                    />
                  </div>

                  {/* Price */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--text-primary)]">Order Price ({selectedAssetObj.currency})</label>
                    <input
                      type="number"
                      disabled={orderType === 'Market Order'}
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-2 text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)] disabled:opacity-50"
                    />
                  </div>

                  {/* Trigger Price */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--text-primary)]">Trigger Price (for SL)</label>
                    <input
                      type="number"
                      disabled={!orderType.includes('SL')}
                      value={triggerPrice}
                      onChange={(e) => setTriggerPrice(Number(e.target.value))}
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-2 text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)] disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Margin & Required Capital Summary */}
                <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[var(--text-muted)] block text-[10px] font-bold uppercase">Estimated Order Value</span>
                    <span className="font-mono font-bold text-base text-[var(--text-primary)]">
                      {formatCompactCurrency(estOrderVal, currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block text-[10px] font-bold uppercase">Required Margin</span>
                    <span className="font-mono font-bold text-base text-[var(--icici-orange)]">
                      {formatCompactCurrency(productType.includes('Intraday') ? estOrderVal * 0.2 : estOrderVal, currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block text-[10px] font-bold uppercase">Available Margin Balance</span>
                    <span className="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">
                      {formatCompactCurrency(availableMargin, currency)}
                    </span>
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  className={`w-full py-3 rounded-xl font-extrabold text-sm text-white shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    orderAction === 'BUY'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  SUBMIT {orderAction} ORDER FOR {selectedAsset}
                </button>
              </form>
            </div>
          )}

          {/* SECTION 2: OPEN POSITIONS */}
          {(subTab === 'open_positions' || subTab === 'portfolio_summary') && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <h3 className="text-base font-bold flex items-center gap-2 text-[var(--text-primary)]">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  Live Intraday & F&O Open Positions
                </h3>
                <span className="text-xs font-mono text-[var(--text-muted)] font-bold">4 Active Positions</span>
              </div>

              {/* MTM Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">TOTAL MTM P&L</div>
                  <div className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    +{formatCompactCurrency(16425, currency)} (+3.85%)
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                  <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">REALIZED P&L</div>
                  <div className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    +{formatCompactCurrency(4200, currency)}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                  <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">UNREALIZED P&L</div>
                  <div className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    +{formatCompactCurrency(12225, currency)}
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto w-full">
                <table className="fin-table">
                  <thead>
                    <tr>
                      <th>Instrument / Symbol</th>
                      <th>Product</th>
                      <th>Net Qty</th>
                      <th>Avg Buy Price</th>
                      <th>LTP</th>
                      <th>MTM P&L ({currency})</th>
                      <th>P&L %</th>
                      <th>Quick Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map(p => (
                      <tr key={p.ticker}>
                        <td className="font-mono font-bold text-[var(--text-primary)]">
                          {p.ticker}
                          <div className="text-[10px] text-[var(--text-muted)] font-sans">{p.name}</div>
                        </td>
                        <td>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                            {p.product}
                          </span>
                        </td>
                        <td className="font-mono font-bold text-[var(--text-primary)]">{p.qty}</td>
                        <td className="font-mono text-[var(--text-secondary)]">₹{p.buyPrice}</td>
                        <td className="font-mono font-bold text-[var(--text-primary)]">₹{p.ltp}</td>
                        <td className={`font-mono font-bold ${p.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {p.pnl >= 0 ? '+' : ''}{formatCompactCurrency(p.pnl, currency)}
                        </td>
                        <td className={`font-mono font-bold ${p.pnlPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {p.pnlPct >= 0 ? '+' : ''}{p.pnlPct}%
                        </td>
                        <td>
                          <button
                            onClick={() => handleSquareOff(p.ticker)}
                            className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer transition-colors"
                          >
                            Square Off
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 3: ORDER BOOK */}
          {subTab === 'order_book' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <h3 className="text-base font-bold flex items-center gap-2 text-[var(--text-primary)]">
                  <Clock className="w-5 h-5 text-[var(--icici-orange)]" />
                  Exchange Order Book & Audit Log
                </h3>
                <span className="text-xs font-mono text-[var(--text-muted)] font-bold">Total Orders: {orderBook.length}</span>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="fin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Time</th>
                      <th>Symbol</th>
                      <th>Type</th>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Price ({currency})</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderBook.map(o => (
                      <tr key={o.id}>
                        <td className="font-mono text-xs text-[var(--text-muted)]">{o.id}</td>
                        <td className="font-mono text-xs text-[var(--text-secondary)]">{o.time}</td>
                        <td className="font-mono font-bold text-[var(--text-primary)]">{o.ticker}</td>
                        <td>
                          <span className={`font-bold text-xs ${o.action === 'BUY' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {o.action}
                          </span>
                        </td>
                        <td className="text-xs text-[var(--text-secondary)]">{o.product}</td>
                        <td className="font-mono font-bold text-[var(--text-primary)]">{o.qty}</td>
                        <td className="font-mono font-bold text-[var(--text-primary)]">₹{o.price}</td>
                        <td>
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                            o.status === 'EXECUTED'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : o.status === 'PENDING'
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                              : 'bg-slate-500/15 text-slate-500 border border-slate-500/30'
                          }`}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 4: TRADE BOOK */}
          {subTab === 'trade_book' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <h3 className="text-base font-bold flex items-center gap-2 text-[var(--text-primary)]">
                  <FileText className="w-5 h-5 text-purple-500" />
                  Executed Trade Book & Contract Notes
                </h3>
                <button
                  onClick={() => alert("Downloading Official Contract Note PDF...")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--icici-orange)] text-white text-xs font-bold hover:bg-[var(--icici-orange-hover)] transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Download Contract Note PDF
                </button>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="fin-table">
                  <thead>
                    <tr>
                      <th>Trade Ref ID</th>
                      <th>Time</th>
                      <th>Symbol</th>
                      <th>Type</th>
                      <th>Executed Qty</th>
                      <th>Executed Price</th>
                      <th>Brokerage & STT</th>
                      <th>Net Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tradeBook.map(tb => (
                      <tr key={tb.id}>
                        <td className="font-mono text-xs text-[var(--text-muted)]">{tb.id}</td>
                        <td className="font-mono text-xs text-[var(--text-secondary)]">{tb.time}</td>
                        <td className="font-mono font-bold text-[var(--text-primary)]">{tb.ticker}</td>
                        <td className="font-bold text-xs text-emerald-600 dark:text-emerald-400">{tb.action}</td>
                        <td className="font-mono font-bold text-[var(--text-primary)]">{tb.qty}</td>
                        <td className="font-mono text-[var(--text-secondary)]">₹{tb.price}</td>
                        <td className="font-mono text-[var(--text-muted)]">₹{tb.brokerage}</td>
                        <td className="font-mono font-bold text-[var(--text-primary)]">{formatCompactCurrency(tb.netValue, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 5: FUNDS & LIQUIDITY */}
          {subTab === 'funds' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <h3 className="text-base font-bold flex items-center gap-2 text-[var(--text-primary)]">
                  <CreditCard className="w-5 h-5 text-[var(--icici-orange)]" />
                  Funds & Margin Management Portal
                </h3>
              </div>

              {fundSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-pulse">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  Funds Added Successfully via UPI Instant Transfer! Available margin updated.
                </div>
              )}

              {/* Fund Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                  <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">AVAILABLE MARGIN</div>
                  <div className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {formatCompactCurrency(availableMargin, currency)}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                  <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">USED MARGIN</div>
                  <div className="text-xl font-mono font-bold text-amber-600 dark:text-amber-400 mt-1">
                    {formatCompactCurrency(125000, currency)}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                  <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">CASH BALANCE</div>
                  <div className="text-xl font-mono font-bold text-[var(--text-primary)] mt-1">
                    {formatCompactCurrency(310000, currency)}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                  <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">DEMAT COLLATERAL</div>
                  <div className="text-xl font-mono font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {formatCompactCurrency(300000, currency)}
                  </div>
                </div>
              </div>

              {/* Add Funds Form */}
              <div className="p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-3">
                <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[var(--icici-orange)]" />
                  Instant UPI / NetBanking Deposit
                </h4>

                <form onSubmit={handleAddFundsSubmit} className="flex flex-wrap items-center gap-3">
                  <input
                    type="number"
                    value={addFundsAmount}
                    onChange={(e) => setAddFundsAmount(Number(e.target.value))}
                    className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)] w-44"
                    placeholder="Amount in ₹"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[var(--icici-orange)] hover:bg-[var(--icici-orange-hover)] text-white font-bold text-xs shadow-md cursor-pointer transition-all"
                  >
                    ADD FUNDS VIA UPI INSTANT
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* SECTION 6: DEMAT HOLDINGS */}
          {subTab === 'demat_holdings' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <h3 className="text-base font-bold flex items-center gap-2 text-[var(--text-primary)]">
                  <Building2 className="w-5 h-5 text-blue-500" />
                  CDSL / NSDL Demat Holdings Statement
                </h3>
              </div>

              {/* Holdings Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                  <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">INVESTED VALUE</div>
                  <div className="text-xl font-mono font-bold text-[var(--text-primary)] mt-1">
                    {formatCompactCurrency(1850000, currency)}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                  <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">CURRENT VALUE</div>
                  <div className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {formatCompactCurrency(2480000, currency)}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">OVERALL GAIN</div>
                  <div className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    +{formatCompactCurrency(630000, currency)} (+34.05%)
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                  <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">DAY P&L</div>
                  <div className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    +{formatCompactCurrency(12400, currency)}
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto w-full">
                <table className="fin-table">
                  <thead>
                    <tr>
                      <th>Stock Symbol</th>
                      <th>Demat Qty</th>
                      <th>Avg Cost</th>
                      <th>LTP</th>
                      <th>Current Value ({currency})</th>
                      <th>Overall P&L</th>
                      <th>Pledge Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dematHoldings.map(dh => (
                      <tr key={dh.ticker}>
                        <td className="font-mono font-bold text-[var(--text-primary)]">
                          {dh.ticker}
                          <div className="text-[10px] text-[var(--text-muted)] font-sans">{dh.name}</div>
                        </td>
                        <td className="font-mono font-bold text-[var(--text-primary)]">{dh.qty}</td>
                        <td className="font-mono text-[var(--text-secondary)]">₹{dh.avgCost}</td>
                        <td className="font-mono font-bold text-[var(--text-primary)]">₹{dh.ltp}</td>
                        <td className="font-mono font-bold text-[var(--text-primary)]">{formatCompactCurrency(dh.val, currency)}</td>
                        <td className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          +{formatCompactCurrency(dh.pnl, currency)} ({dh.pnlPct}%)
                        </td>
                        <td>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                            {dh.pledged}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 7: SOVEREIGN GOLD & ETF */}
          {subTab === 'gold' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <h3 className="text-base font-bold flex items-center gap-2 text-[var(--text-primary)]">
                  <Coins className="w-5 h-5 text-amber-500" />
                  Sovereign Gold Bonds (SGB) & 24K Digital Gold Portal
                </h3>
                <span className="text-xs font-mono font-bold text-amber-600 bg-amber-500/15 px-2.5 py-1 rounded-full">
                  Live 24K Gold: ₹7,245 / Gram (+0.65%)
                </span>
              </div>

              {goldSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-bounce">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  SGB Subscription Application Submitted! Discount of ₹50/gram applied. View in Demat statement.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/30 space-y-2">
                  <div className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-500" /> RBI Sovereign Gold Bonds (SGB)
                  </div>
                  <div className="text-2xl font-mono font-extrabold text-amber-600 dark:text-amber-400">
                    2.50% p.a.
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Fixed annual interest paid semi-annually + 100% Tax-Free capital gains at maturity.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
                  <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" /> 24K Pure Digital Gold SIP
                  </div>
                  <div className="text-2xl font-mono font-extrabold text-[var(--text-primary)]">
                    ₹500 / Month
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Accumulate 99.9% pure 24K MMTC-PAMP gold with zero storage cost.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
                  <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-500" /> Gold ETF (GOLDBEES)
                  </div>
                  <div className="text-2xl font-mono font-extrabold text-[var(--text-primary)]">
                    ₹64.20
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Trade gold units instantly on NSE & BSE with high liquidity.
                  </p>
                </div>
              </div>

              {/* SGB Application Box */}
              <div className="p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-4">
                <h4 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-[var(--icici-orange)]" />
                  Subscribe to Sovereign Gold Bond Tranche (RBI Issue)
                </h4>
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[var(--text-primary)]">Select Quantity (Grams)</label>
                    <input
                      type="number"
                      min="1"
                      value={sgbGrams}
                      onChange={(e) => setSgbGrams(Number(e.target.value))}
                      className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-3 py-2 font-mono font-bold text-[var(--text-primary)] w-36 focus:outline-none focus:border-[var(--icici-orange)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-[var(--text-muted)] block">Issue Price per Gram</span>
                    <span className="font-mono font-bold text-sm text-[var(--text-primary)]">₹7,195 (₹50 Online Discount)</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-[var(--text-muted)] block">Total Investment</span>
                    <span className="font-mono font-bold text-sm text-[var(--icici-orange)]">₹{(sgbGrams * 7195).toLocaleString('en-IN')}</span>
                  </div>
                  <button
                    onClick={() => {
                      setGoldSuccessMsg(true);
                      setTimeout(() => setGoldSuccessMsg(false), 3500);
                    }}
                    className="ml-auto px-5 py-2.5 rounded-xl bg-[var(--icici-orange)] hover:bg-[var(--icici-orange-hover)] text-white font-bold text-xs shadow-md cursor-pointer transition-all"
                  >
                    APPLY SGB VIA ASBA UPI
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 8: IPO & NFO */}
          {subTab === 'ipo' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2 text-[var(--text-primary)]">
                    <Rocket className="w-5 h-5 text-[var(--icici-orange)]" />
                    Mainboard & SME IPO Bidding Platform
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">ASBA Online UPI IPO Applications & Live Grey Market Premium (GMP)</p>
                </div>

                {/* Embedded Live Refresh Button */}
                <button
                  onClick={handleRefreshIpoData}
                  disabled={isIpoRefreshing}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:border-[var(--icici-orange)] text-xs font-bold text-[var(--text-primary)] transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  title="Click to fetch live IPO subscriptions and GMP updates"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[var(--icici-orange)] ${isIpoRefreshing ? 'animate-spin' : ''}`} />
                  <span>{isIpoRefreshing ? 'Updating Live IPO Data...' : 'Refresh Live IPO Data'}</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">({ipoLastUpdated})</span>
                </button>
              </div>

              {ipoAppliedMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-bounce">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  {ipoAppliedMsg}
                </div>
              )}

              {/* Live IPOs Table */}
              <div className="overflow-x-auto w-full">
                <table className="fin-table">
                  <thead>
                    <tr>
                      <th>Company / Issue Name</th>
                      <th>Price Band</th>
                      <th>Lot Size</th>
                      <th>Subscription Multiplier</th>
                      <th>Grey Market Premium (GMP)</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ipoList.map(ipo => (
                      <tr key={ipo.id}>
                        <td className="font-mono font-bold text-[var(--text-primary)]">
                          {ipo.name}
                          <div className="text-[10px] text-[var(--text-muted)] font-sans">{ipo.category} • {ipo.dates}</div>
                        </td>
                        <td className="font-mono font-bold text-[var(--text-primary)]">{ipo.priceBand}</td>
                        <td className="text-xs font-semibold text-[var(--text-secondary)]">{ipo.lotSize}</td>
                        <td className="font-mono font-bold text-blue-600 dark:text-blue-400">{ipo.subMultiple}</td>
                        <td className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{ipo.gmp}</td>
                        <td>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ipo.status === 'OPEN FOR BIDDING'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          }`}>
                            {ipo.status}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleApplyIpo(ipo.name)}
                            className="px-3 py-1 rounded bg-[var(--icici-orange)] hover:bg-[var(--icici-orange-hover)] text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
                          >
                            Apply ASBA
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 9: LOANS & CREDIT */}
          {subTab === 'loans' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <h3 className="text-base font-bold flex items-center gap-2 text-[var(--text-primary)]">
                  <CreditCard className="w-5 h-5 text-[var(--icici-orange)]" />
                  Loan Against Shares (LAS) & Mutual Funds (LAMF)
                </h3>
                <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-500/15 px-2.5 py-1 rounded-full">
                  Instant Liquidity @ 9.5% p.a.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
                  <h4 className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Loan Against Equity Shares
                  </h4>
                  <div className="text-xl font-mono font-extrabold text-[var(--text-primary)]">9.50% p.a.</div>
                  <p className="text-[11px] text-[var(--text-secondary)]">Pledge stocks without selling. Pay interest only on utilized amount.</p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
                  <h4 className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                    <PiggyBank className="w-4 h-4 text-blue-500" /> Loan Against Mutual Funds
                  </h4>
                  <div className="text-xl font-mono font-extrabold text-[var(--text-primary)]">9.25% p.a.</div>
                  <p className="text-[11px] text-[var(--text-secondary)]">Instant digital overdraft against equity and debt mutual fund folio units.</p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
                  <h4 className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" /> Pre-Approved Credit Line
                  </h4>
                  <div className="text-xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400">₹12,50,000</div>
                  <p className="text-[11px] text-[var(--text-secondary)]">Zero foreclosure charges & zero documentation for verified demat holders.</p>
                </div>
              </div>

              {/* LAS Calculator Box */}
              <div className="p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-3">
                <h4 className="font-bold text-sm text-[var(--text-primary)]">Loan Against Shares Eligibility Calculator</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[var(--text-primary)]">Pledged Share Portfolio Value</label>
                    <input
                      type="number"
                      step="10000"
                      value={pledgeVal}
                      onChange={(e) => setPledgeVal(Number(e.target.value))}
                      className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2 font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-[var(--text-muted)] block">Eligible Overdraft Limit (80% LTV)</span>
                    <span className="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">₹{(pledgeVal * 0.8).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-[var(--text-muted)] block">Estimated Monthly Interest</span>
                    <span className="font-mono font-bold text-base text-[var(--icici-orange)]">₹{Math.round((pledgeVal * 0.8 * 0.095) / 12).toLocaleString('en-IN')} / mo</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 10: FIXED DEPOSITS & BONDS */}
          {subTab === 'fd_bonds' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2 text-[var(--text-primary)]">
                    <Landmark className="w-5 h-5 text-emerald-600" />
                    High Yield Fixed Deposits & Corporate Bonds
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">CRISIL AAA Rated FDs, Sovereign Govt Bonds, and High YTM Corporate NCDs</p>
                </div>

                {/* Embedded Live Refresh Button */}
                <button
                  onClick={handleRefreshFdData}
                  disabled={isFdRefreshing}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:border-[var(--icici-orange)] text-xs font-bold text-[var(--text-primary)] transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  title="Click to fetch live FD rates and bond yields"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isFdRefreshing ? 'animate-spin' : ''}`} />
                  <span>{isFdRefreshing ? 'Updating Live Rates...' : 'Refresh Yields & Interest Rates'}</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">({fdLastUpdated})</span>
                </button>
              </div>

              {fdInvestedMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-bounce">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  {fdInvestedMsg}
                </div>
              )}

              {/* FD & Bonds Data Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fdList.map(fd => (
                  <div key={fd.id} className="p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-3 shadow-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-[var(--text-primary)]">{fd.issuer}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                          {fd.type}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded font-mono font-extrabold text-xs bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        {fd.rating}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] font-bold block">Interest / Yield</span>
                        <span className="font-mono font-extrabold text-base text-[var(--icici-orange)]">{fd.rate}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] font-bold block">Tenure</span>
                        <span className="font-mono font-bold text-xs text-[var(--text-primary)]">{fd.tenure}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-xs">
                      <span className="text-[11px] text-[var(--text-secondary)] font-medium">{fd.seniorBonus}</span>
                      <button
                        onClick={() => handleInvestFd(fd.issuer)}
                        className="px-3.5 py-1.5 rounded-lg bg-[var(--icici-orange)] hover:bg-[var(--icici-orange-hover)] text-white font-bold text-xs shadow-xs cursor-pointer transition-all"
                      >
                        Book FD / Bond
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 11: INSURANCE */}
          {subTab === 'insurance' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <h3 className="text-base font-bold flex items-center gap-2 text-[var(--text-primary)]">
                  <ShieldAlert className="w-5 h-5 text-emerald-600" />
                  Wealth Protection & Insurance Gateway
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
                  <h4 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-500" /> Term Life Insurance
                  </h4>
                  <div className="text-lg font-mono font-extrabold text-[var(--text-primary)]">₹1 Crore Cover</div>
                  <p className="text-xs text-[var(--text-secondary)]">Starting @ ₹680/month. Tax exemption under Section 80C.</p>
                  <button onClick={() => alert("Redirecting to Term Plan Quote...")} className="px-3 py-1.5 rounded-lg bg-[var(--icici-orange)] text-white text-xs font-bold cursor-pointer">
                    Get Free Quote
                  </button>
                </div>

                <div className="p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
                  <h4 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-rose-500" /> Family Health Insurance
                  </h4>
                  <div className="text-lg font-mono font-extrabold text-[var(--text-primary)]">₹10 Lakh Cover</div>
                  <p className="text-xs text-[var(--text-secondary)]">Cashless hospitalization in 10,000+ hospitals. Tax deduction u/s 80D.</p>
                  <button onClick={() => alert("Redirecting to Health Plan Quote...")} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer">
                    Explore Plans
                  </button>
                </div>

                <div className="p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
                  <h4 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-500" /> Demat Cyber Fraud Shield
                  </h4>
                  <div className="text-lg font-mono font-extrabold text-[var(--text-primary)]">₹5 Lakh Coverage</div>
                  <p className="text-xs text-[var(--text-secondary)]">Protects demat account against unauthorized trades, phishing & OTP fraud.</p>
                  <button onClick={() => alert("Cyber Fraud Shield Activated!")} className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold cursor-pointer">
                    Activate @ ₹49/mo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 12: NPS PENSION */}
          {subTab === 'nps' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <h3 className="text-base font-bold flex items-center gap-2 text-[var(--text-primary)]">
                  <FileCheck className="w-5 h-5 text-amber-500" />
                  National Pension System (NPS) Tier-I & Tier-II Portal
                </h3>
              </div>

              <div className="p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-[var(--text-primary)]">Save Additional ₹50,000 Tax u/s 80CCD(1B)</h4>
                    <p className="text-xs text-[var(--text-secondary)]">Over and above the ₹1.5 Lakh limit under Section 80C.</p>
                  </div>
                  <span className="px-3 py-1 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono font-bold text-xs">
                    10-Yr CAGR: 12.8%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                    <span className="text-[var(--text-muted)] font-bold text-[10px] block uppercase">PRAN Pension Account</span>
                    <span className="font-mono font-bold text-sm text-[var(--text-primary)]">PRAN: 110184920184</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                    <span className="text-[var(--text-muted)] font-bold text-[10px] block uppercase">PFRDA Fund Manager</span>
                    <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">HDFC / ICICI Pru / SBI Pension</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                    <span className="text-[var(--text-muted)] font-bold text-[10px] block uppercase">Asset Mix</span>
                    <span className="font-mono font-bold text-xs text-[var(--text-primary)]">Equity 75% | Corp 15% | Govt 10%</span>
                  </div>
                </div>

                <button onClick={() => alert("NPS Tier-I Contribution Portal Opened")} className="px-5 py-2.5 rounded-xl bg-[var(--icici-orange)] text-white text-xs font-bold shadow-md cursor-pointer hover:bg-[var(--icici-orange-hover)] transition-all">
                  CONTRIBUTE TO NPS TIER-I
                </button>
              </div>
            </div>
          )}

          {/* SECTION 13: SMART TOOLS */}
          {subTab === 'smart_tools' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <h3 className="text-base font-bold flex items-center gap-2 text-[var(--text-primary)]">
                  <Zap className="w-5 h-5 text-amber-500" />
                  ApexQuant Pro Smart Trading Tools
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
                  <h4 className="font-bold text-sm text-[var(--icici-orange)] flex items-center gap-2">
                    <Sliders className="w-4 h-4" /> Option Chain & Greek Calculator
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    Compute implied volatility (IV), Delta, Gamma, Theta, and Vega for NIFTY, BANKNIFTY, and stock option strikes.
                  </p>
                  <button onClick={() => alert("Option Greeks Calculator Initialized")} className="px-3 py-1.5 rounded-lg bg-[var(--icici-orange)] text-white text-xs font-bold cursor-pointer">
                    Open Option Chain Tool
                  </button>
                </div>

                <div className="p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
                  <h4 className="font-bold text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Stock Basket & Equity SIP
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    Create automated monthly SIP orders across diversified multi-asset stock baskets with automatic rebalancing.
                  </p>
                  <button onClick={() => alert("Equity SIP Creator Initialized")} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer">
                    Create Stock Basket SIP
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 14: REPORTS */}
          {subTab === 'reports' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <h3 className="text-base font-bold flex items-center gap-2 text-[var(--text-primary)]">
                  <FileText className="w-5 h-5 text-purple-500" />
                  Tax Statements & P&L Reports
                </h3>
              </div>

              <div className="p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-3">
                <h4 className="font-bold text-sm text-[var(--text-primary)]">FY 2025-26 Tax P&L Statement</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                    <span className="text-[var(--text-muted)] block text-[10px] font-bold uppercase">Short Term Capital Gains (STCG @ 20%)</span>
                    <span className="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">+₹1,45,200.00</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                    <span className="text-[var(--text-muted)] block text-[10px] font-bold uppercase">Long Term Capital Gains (LTCG @ 12.5%)</span>
                    <span className="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">+₹4,85,000.00</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 15: SERVICES */}
          {subTab === 'services' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <h3 className="text-base font-bold flex items-center gap-2 text-[var(--text-primary)]">
                  <ShieldCheck className="w-5 h-5 text-blue-500" />
                  Account Services & Corporate Actions
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-1">
                  <span className="font-bold text-sm text-[var(--text-primary)] block">Linked Bank Account</span>
                  <span className="text-[var(--text-secondary)] font-mono block">HDFC Bank Ltd — A/C *******4821</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold block">Status: Verified & Active</span>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-1">
                  <span className="font-bold text-sm text-[var(--text-primary)] block">Demat DP Account ID</span>
                  <span className="text-[var(--text-secondary)] font-mono block">CDSL DP ID: 1208160009482100</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold block">Status: CDSL Active</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
