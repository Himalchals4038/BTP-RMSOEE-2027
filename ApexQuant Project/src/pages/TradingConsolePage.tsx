import React, { useState, useEffect, useMemo } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { formatCompactCurrency } from '../utils/financialMath';
import type { IPONFORecord } from '../services/indexedDBService';
import { getIposFromIndexedDB, DEFAULT_IPO_CATALOG } from '../services/indexedDBService';
import { fetchLiveIpoNfoData } from '../services/ipoService';
import type { BondFDItem } from '../services/bondsExtendedDataset';
import { INDIAN_BONDS_CATALOG, US_BONDS_CATALOG } from '../services/bondsExtendedDataset';
import {
  ShoppingCart,
  TrendingUp,
  Clock,
  CheckCircle2,
  Download,
  FileSpreadsheet,
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
  Shield,
  Search,
  ChevronRight,
  BarChart3,
  Info,
  Calendar,
  Percent,
  X,
  Filter
} from 'lucide-react';

export const TradingConsolePage: React.FC = () => {
  const { assets, currency, activeSubTab, exportReportCSV, exportReportPDF } = usePortfolio();

  // Active sub-section on the dedicated page (defaults to 'place_order' if activeSubTab is null)
  const activeTabId = activeSubTab || 'place_order';

  const sectionLabels: Record<string, string> = {
    place_order: 'Place Order',
    open_positions: 'Open Positions',
    order_book: 'Order Book',
    trade_book: 'Trade Book',
    funds: 'Funds & Liquidity',
    demat_holdings: 'Demat Holdings',
    gold: 'Sovereign Gold',
    ipo: 'IPO & NFO',
    fd_bonds: 'FD & Bonds',
    insurance: 'Insurance',
    nps: 'NPS Pension',
    reports: 'Tax & P&L Reports',
    loans: 'Loans Against Shares',
    smart_tools: 'Smart Tools',
    services: 'Account Services'
  };

  // State for Place Order Form
  const [orderAction, setOrderAction] = useState<'BUY' | 'SELL'>('BUY');
  const [selectedAsset, setSelectedAsset] = useState<string>(assets[0]?.ticker || 'RELIANCE.NS');
  const [exchange, setExchange] = useState<string>('NSE — National Stock Exchange');
  const [productType, setProductType] = useState<string>('Delivery (CNC)');
  const [orderType, setOrderType] = useState<string>('Limit Order');
  const [quantity, setQuantity] = useState<number>(100);
  const [price, setPrice] = useState<number>(2450);
  const [triggerPrice, setTriggerPrice] = useState<number>(2420);
  const [orderPlacedSuccess, setOrderPlacedSuccess] = useState<boolean>(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState<string>('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState<boolean>(false);

  // Helper to handle selecting asset and auto-routing appropriate Exchange
  const handleSelectAsset = (assetTicker: string) => {
    setSelectedAsset(assetTicker);
    const found = assets.find(a => a.ticker === assetTicker);
    if (found) {
      setPrice(found.price);
      if (found.category === 'Crypto') {
        setExchange('Binance Exchange');
      } else if (found.currency === '$' || found.market.includes('NASDAQ') || found.market.includes('NYSE')) {
        setExchange('NYSE — New York Stock Exchange');
      } else {
        setExchange('NSE — National Stock Exchange');
      }
    }
    setIsSearchDropdownOpen(false);
  };

  // State for Add Funds
  const [addFundsAmount, setAddFundsAmount] = useState<number>(50000);
  const [fundSuccessMsg, setFundSuccessMsg] = useState<boolean>(false);
  const [availableMargin, setAvailableMargin] = useState<number>(485000);

  // State for Live Refreshing IPOs & Market Selector (Strictly Separate Indian vs US Tabs)
  const [selectedIpoMarket, setSelectedIpoMarket] = useState<'Indian' | 'US'>('Indian');
  const [isIpoRefreshing, setIsIpoRefreshing] = useState(false);
  const [ipoLastUpdated, setIpoLastUpdated] = useState<string>('Just now');
  const [ipoAppliedMsg, setIpoAppliedMsg] = useState<string | null>(null);
  const [ipoList, setIpoList] = useState<IPONFORecord[]>(DEFAULT_IPO_CATALOG);

  useEffect(() => {
    let isMounted = true;
    getIposFromIndexedDB().then(data => {
      if (isMounted) setIpoList(data);
    });
    return () => { isMounted = false; };
  }, []);

  const displayedIpoList = useMemo(() => {
    if (selectedIpoMarket === 'US') {
      return ipoList.filter(i => i.market === 'US (NYSE/NASDAQ)');
    }
    return ipoList.filter(i => i.market === 'Indian (NSE/BSE)');
  }, [ipoList, selectedIpoMarket]);

  const handleRefreshIpoData = async () => {
    setIsIpoRefreshing(true);
    try {
      const updatedData = await fetchLiveIpoNfoData(selectedIpoMarket);
      setIpoList(updatedData);
      setIpoLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.warn('Error refreshing IPO data:', err);
    } finally {
      setIsIpoRefreshing(false);
    }
  };

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

  // State for Sovereign Gold Purchase & Tradeable SGB Tranches
  const [sgbGrams, setSgbGrams] = useState<number>(10);
  const [goldSuccessMsg, setGoldSuccessMsg] = useState<boolean>(false);
  const [selectedSgbDetail, setSelectedSgbDetail] = useState<any | null>(null);

  const tradeableSgbList = [
    {
      id: 'sgb-2019-20-v',
      symbol: 'SGB2708',
      trancheName: 'Sovereign Gold Bond 2019-20 Series V',
      isin: 'IN0020190396',
      issuePrice: 3790,
      currentPrice: 7245,
      change24h: 0.65,
      interestRate: 2.50,
      yieldToMaturity: 8.25,
      maturityDate: '27 August 2027',
      nextCouponDate: '27 August 2026',
      tenorRemaining: '1 Year 0 Months',
      taxStatus: '100% Capital Gains Tax-Free at Maturity (Sec 47(viib))',
      exchange: 'BSE & NSE Listed',
      volume24h: '4,820 Grams',
      sovereignRating: 'Sovereign (Govt of India Guarantee)'
    },
    {
      id: 'sgb-2020-21-iv',
      symbol: 'SGB2807',
      trancheName: 'Sovereign Gold Bond 2020-21 Series IV',
      isin: 'IN0020200112',
      issuePrice: 4852,
      currentPrice: 7210,
      change24h: 0.42,
      interestRate: 2.50,
      yieldToMaturity: 8.10,
      maturityDate: '21 July 2028',
      nextCouponDate: '21 July 2027',
      tenorRemaining: '1 Year 11 Months',
      taxStatus: '100% Capital Gains Tax-Free at Maturity (Sec 47(viib))',
      exchange: 'BSE & NSE Listed',
      volume24h: '3,150 Grams',
      sovereignRating: 'Sovereign (Govt of India Guarantee)'
    },
    {
      id: 'sgb-2021-22-v',
      symbol: 'SGB2910',
      trancheName: 'Sovereign Gold Bond 2021-22 Series V',
      isin: 'IN0020210236',
      issuePrice: 4791,
      currentPrice: 7185,
      change24h: 0.80,
      interestRate: 2.50,
      yieldToMaturity: 8.35,
      maturityDate: '25 October 2029',
      nextCouponDate: '25 October 2026',
      tenorRemaining: '3 Years 2 Months',
      taxStatus: '100% Capital Gains Tax-Free at Maturity (Sec 47(viib))',
      exchange: 'BSE & NSE Listed',
      volume24h: '6,210 Grams',
      sovereignRating: 'Sovereign (Govt of India Guarantee)'
    },
    {
      id: 'sgb-2022-23-iii',
      symbol: 'SGB3012',
      trancheName: 'Sovereign Gold Bond 2022-23 Series III',
      isin: 'IN0020220185',
      issuePrice: 5409,
      currentPrice: 7150,
      change24h: 0.35,
      interestRate: 2.50,
      yieldToMaturity: 8.45,
      maturityDate: '27 December 2030',
      nextCouponDate: '27 December 2026',
      tenorRemaining: '4 Years 4 Months',
      taxStatus: '100% Capital Gains Tax-Free at Maturity (Sec 47(viib))',
      exchange: 'BSE & NSE Listed',
      volume24h: '5,400 Grams',
      sovereignRating: 'Sovereign (Govt of India Guarantee)'
    },
    {
      id: 'sgb-2023-24-iv',
      symbol: 'SGB3202',
      trancheName: 'Sovereign Gold Bond 2023-24 Series IV',
      isin: 'IN0020230242',
      issuePrice: 6263,
      currentPrice: 7120,
      change24h: 0.55,
      interestRate: 2.50,
      yieldToMaturity: 8.60,
      maturityDate: '21 February 2032',
      nextCouponDate: '21 February 2027',
      tenorRemaining: '5 Years 6 Months',
      taxStatus: '100% Capital Gains Tax-Free at Maturity (Sec 47(viib))',
      exchange: 'BSE & NSE Listed',
      volume24h: '8,950 Grams',
      sovereignRating: 'Sovereign (Govt of India Guarantee)'
    }
  ];

  // State for Wint Wealth Style Bonds & FDs Platform
  const [selectedBondMarket, setSelectedBondMarket] = useState<'Indian' | 'US'>('Indian');
  const [bondSearchQuery, setBondSearchQuery] = useState<string>('');
  const [bondMinYtm, setBondMinYtm] = useState<number>(0);
  const [bondMinCoupon, setBondMinCoupon] = useState<number>(0);
  const [bondTenorFilter, setBondTenorFilter] = useState<'ALL' | 'SHORT' | 'MEDIUM' | 'LONG'>('ALL');
  const [bondTypeFilter, setBondTypeFilter] = useState<string>('ALL');
  const [bondRatingFilter, setBondRatingFilter] = useState<string>('ALL');
  const [selectedBondDetail, setSelectedBondDetail] = useState<BondFDItem | null>(null);

  // Filtered bond list according to sidebar control parameters
  const filteredBondList = useMemo(() => {
    const rawCatalog = selectedBondMarket === 'Indian' ? INDIAN_BONDS_CATALOG : US_BONDS_CATALOG;
    return rawCatalog.filter(item => {
      // 1. Search Query
      if (bondSearchQuery.trim() !== '') {
        const query = bondSearchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesIssuer = item.issuer.toLowerCase().includes(query);
        const matchesIsin = item.isin.toLowerCase().includes(query);
        if (!matchesName && !matchesIssuer && !matchesIsin) return false;
      }
      // 2. Min YTM
      if (item.ytmPct < bondMinYtm) return false;
      // 3. Min Coupon
      if (item.couponRatePct < bondMinCoupon) return false;
      // 4. Tenor Filter
      if (bondTenorFilter === 'SHORT' && item.tenorYears > 2) return false;
      if (bondTenorFilter === 'MEDIUM' && (item.tenorYears <= 2 || item.tenorYears > 5)) return false;
      if (bondTenorFilter === 'LONG' && item.tenorYears <= 5) return false;
      // 5. Type Filter
      if (bondTypeFilter !== 'ALL' && item.category !== bondTypeFilter) return false;
      // 6. Rating Filter
      if (bondRatingFilter !== 'ALL' && item.creditRating !== bondRatingFilter) return false;

      return true;
    });
  }, [selectedBondMarket, bondSearchQuery, bondMinYtm, bondMinCoupon, bondTenorFilter, bondTypeFilter, bondRatingFilter]);

  // Group filtered bonds by rating categories: AAA, AA, A, BBB, BB
  const groupedBondsByRating = useMemo(() => {
    const ratings: Array<'AAA' | 'AA' | 'A' | 'BBB' | 'BB'> = ['AAA', 'AA', 'A', 'BBB', 'BB'];
    const groups: Record<string, BondFDItem[]> = {};

    ratings.forEach(rating => {
      const matched = filteredBondList.filter(item => item.creditRating === rating);
      if (matched.length > 0) {
        groups[rating] = matched;
      }
    });

    return groups;
  }, [filteredBondList]);

  // State for ICICI Direct & NSDL CRA Inspired NPS Pension Portal
  const [npsActiveTier, setNpsActiveTier] = useState<'TIER_1' | 'TIER_2'>('TIER_1');
  const [npsSelectedPfm, setNpsSelectedPfm] = useState<string>('ICICI Prudential Pension Funds Management Co.');
  const [npsAllocationMode, setNpsAllocationMode] = useState<'ACTIVE' | 'AUTO'>('ACTIVE');
  const [npsEquityPct, setNpsEquityPct] = useState<number>(50);
  const [npsCorpDebtPct, setNpsCorpDebtPct] = useState<number>(30);
  const [npsGovtSecPct, setNpsGovtSecPct] = useState<number>(20);
  const [npsAltAssetsPct, setNpsAltAssetsPct] = useState<number>(0);
  const [npsAutoChoiceOption, setNpsAutoChoiceOption] = useState<'LC-75' | 'LC-50' | 'LC-25'>('LC-75');

  // NPS Retirement Pension Calculator State
  const [npsCalcAge, setNpsCalcAge] = useState<number>(28);
  const [npsCalcMonthlyContrib, setNpsCalcMonthlyContrib] = useState<number>(10000);
  const [npsCalcExpectedReturn, setNpsCalcExpectedReturn] = useState<number>(12);
  const [npsCalcAnnuityRatio, setNpsCalcAnnuityRatio] = useState<number>(40);

  // NPS Contribution & Action Notifications
  const [npsContribSuccessMsg, setNpsContribSuccessMsg] = useState<boolean>(false);
  const [npsPfmSwitchSuccessMsg, setNpsPfmSwitchSuccessMsg] = useState<boolean>(false);
  const [npsContribModalOpen, setNpsContribModalOpen] = useState<boolean>(false);
  const [npsContribAmountInput, setNpsContribAmountInput] = useState<number>(10000);

  // NPS Pension Fund Managers (PFMs) Dataset
  const npsPfmList = [
    { name: 'ICICI Prudential Pension Funds Management Co.', code: 'ICICI', return1Y: 16.40, return3Y: 15.10, return5Y: 14.85, aumCr: 142500, rating: '5-Star Rated' },
    { name: 'HDFC Pension Management Co.', code: 'HDFC', return1Y: 16.80, return3Y: 15.25, return5Y: 14.92, aumCr: 168200, rating: '5-Star Rated' },
    { name: 'SBI Pension Funds', code: 'SBI', return1Y: 15.90, return3Y: 14.60, return5Y: 14.20, aumCr: 315000, rating: 'Largest AUM' },
    { name: 'Kotak Mahindra Pension Fund', code: 'KOTAK', return1Y: 16.10, return3Y: 14.80, return5Y: 14.55, aumCr: 92400, rating: 'Consistent Pick' },
    { name: 'UTI Retirement Solutions', code: 'UTI', return1Y: 15.75, return3Y: 14.30, return5Y: 14.15, aumCr: 85100, rating: 'Govt Choice' },
    { name: 'Axis Pension Fund', code: 'AXIS', return1Y: 15.50, return3Y: 14.10, return5Y: 13.90, aumCr: 28600, rating: 'Growth Pick' },
    { name: 'LIC Pension Fund', code: 'LIC', return1Y: 15.20, return3Y: 14.00, return5Y: 13.80, aumCr: 112000, rating: 'PSU Trust' }
  ];

  // NPS Retirement Calculator Output Calculations
  const npsCalcResult = useMemo(() => {
    const yearsToRetire = Math.max(1, 60 - npsCalcAge);
    const months = yearsToRetire * 12;
    const monthlyRate = npsCalcExpectedReturn / 100 / 12;
    
    const totalPrincipal = npsCalcMonthlyContrib * months;
    const futureValue = npsCalcMonthlyContrib * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    
    const lumpSumPct = 100 - npsCalcAnnuityRatio;
    const lumpSumAmount = futureValue * (lumpSumPct / 100);
    const annuityCapital = futureValue * (npsCalcAnnuityRatio / 100);
    const estMonthlyPension = (annuityCapital * 0.065) / 12; // ~6.5% p.a. annuity yield
    
    return {
      yearsToRetire,
      totalPrincipal,
      futureValue,
      lumpSumPct,
      lumpSumAmount,
      annuityCapital,
      estMonthlyPension
    };
  }, [npsCalcAge, npsCalcMonthlyContrib, npsCalcExpectedReturn, npsCalcAnnuityRatio]);

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

  const filteredAssets = assets.filter(a =>
    a.ticker.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
    a.name.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
    a.category.toLowerCase().includes(orderSearchQuery.toLowerCase())
  );

  const getExchangeOptions = () => {
    if (selectedAssetObj.category === 'Crypto') {
      return [
        { id: 'Binance Exchange', label: 'Binance Exchange (Crypto Spot & Derivatives)' },
        { id: 'Binance Spot', label: 'Binance Spot Trading' },
        { id: 'Binance Futures', label: 'Binance USDS-M Futures' },
        { id: 'Coinbase Global', label: 'Coinbase Global Pro' }
      ];
    } else if (selectedAssetObj.currency === '$' || selectedAssetObj.market.includes('NASDAQ') || selectedAssetObj.market.includes('NYSE')) {
      return [
        { id: 'NYSE — New York Stock Exchange', label: 'NYSE — New York Stock Exchange' },
        { id: 'NASDAQ — US Tech Market', label: 'NASDAQ — US Tech Market' },
        { id: 'CBOE — US Options', label: 'CBOE — US Equity Options' }
      ];
    } else {
      return [
        { id: 'NSE — National Stock Exchange', label: 'NSE — National Stock Exchange' },
        { id: 'BSE — Bombay Stock Exchange', label: 'BSE — Bombay Stock Exchange' },
        { id: 'NFO — National Futures & Options', label: 'NFO — Derivatives (Futures & Options)' },
        { id: 'MCX — Multi Commodity Exchange', label: 'MCX — Commodity Derivatives' }
      ];
    }
  };

  const exchangeOptions = getExchangeOptions();

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Page Header Banner */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-medium">
              <span>ApexQuant OS</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span>Trading Console</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[var(--icici-orange)] font-bold capitalize">
                {sectionLabels[activeTabId] || 'Dedicated View'}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-[var(--text-primary)] flex items-center gap-2.5">
              <BarChart3 className="w-7 h-7 text-[var(--icici-orange)]" />
              ApexQuant Institutional Trading Console
            </h1>
            <p className="text-xs text-[var(--text-secondary)] font-medium">
              Multi-asset order execution, real-time portfolio positions, exchange order audit logs, and wealth management services.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportReportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs border border-emerald-500/30 transition-all cursor-pointer shadow-xs"
              title="Download Excel Report"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Excel Export</span>
            </button>
            <button
              onClick={exportReportPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/15 hover:bg-rose-600/25 text-rose-600 dark:text-rose-400 font-extrabold text-xs border border-rose-500/30 transition-all cursor-pointer shadow-xs"
              title="Download PDF Report"
            >
              <Download className="w-4 h-4 text-rose-500" />
              <span>PDF Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Page Card Body */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xl">
        {/* SECTION 1: PLACE ORDER */}
        {activeTabId === 'place_order' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
              <div>
                <h3 className="text-lg font-extrabold flex items-center gap-2 text-[var(--text-primary)]">
                  <ShoppingCart className="w-5 h-5 text-[var(--icici-orange)]" />
                  Multi-Asset Order Entry Form
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">Direct Market Access (DMA) to NSE, BSE, NYSE, NASDAQ & Crypto Exchanges</p>
              </div>

              <div className="flex items-center gap-1 bg-[var(--bg-tertiary)] p-1 rounded-xl border border-[var(--border-color)]">
                <button
                  onClick={() => setOrderAction('BUY')}
                  className={`px-5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    orderAction === 'BUY'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  BUY ORDER
                </button>
                <button
                  onClick={() => setOrderAction('SELL')}
                  className={`px-5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    orderAction === 'SELL'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  SELL ORDER
                </button>
              </div>
            </div>

            {orderPlacedSuccess && (
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2.5 animate-bounce">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                Order Placed Successfully! Sent to Exchange ({exchange}) matching engine. View in Order Book.
              </div>
            )}

            <form onSubmit={handlePlaceOrderSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Searchable Security Selector */}
                <div className="space-y-1.5 relative">
                  <label className="text-xs font-bold text-[var(--text-primary)]">Search & Select Security / Instrument</label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Type ticker or name (e.g. BTC, RELIANCE, AAPL, SGB)..."
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
                      {filteredAssets.length > 0 ? (
                        filteredAssets.map(a => (
                          <div
                            key={a.ticker}
                            onClick={() => handleSelectAsset(a.ticker)}
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
                              <span className="text-[11px] text-[var(--text-secondary)] block truncate max-w-[220px]">{a.name}</span>
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
                          No matching security found for "{orderSearchQuery}"
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Exchange Segment */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-primary)]">Exchange Platform</label>
                  <select
                    value={exchange}
                    onChange={(e) => setExchange(e.target.value)}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-2.5 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)]"
                  >
                    {exchangeOptions.map(ex => (
                      <option key={ex.id} value={ex.id} className="bg-[var(--bg-card)]">
                        {ex.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Product Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-primary)]">Product Type</label>
                  <select
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-2.5 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)]"
                  >
                    <option value="Delivery (CNC)">Delivery (CNC) — Cash & Carry</option>
                    <option value="Intraday (MIS)">Intraday (MIS) — Margin Intraday</option>
                    <option value="MTF (Margin)">MTF — Margin Trading Facility (4x Leverage)</option>
                    <option value="F&O Carry">F&O Derivatives Carry-Forward</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                {/* Order Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-primary)]">Order Type</label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value)}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-2.5 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)]"
                  >
                    <option value="Limit Order">Limit Order</option>
                    <option value="Market Order">Market Order (LTP)</option>
                    <option value="Stop-Loss (SL)">Stop-Loss Limit (SL)</option>
                    <option value="SL-Market (SL-M)">Stop-Loss Market (SL-M)</option>
                  </select>
                </div>

                {/* Quantity */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-primary)]">Quantity (Shares/Lots)</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-2.5 text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)]"
                  />
                </div>

                {/* Price */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-primary)]">Order Price ({selectedAssetObj.currency})</label>
                  <input
                    type="number"
                    disabled={orderType === 'Market Order'}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-2.5 text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)] disabled:opacity-50"
                  />
                </div>

                {/* Trigger Price */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-primary)]">Trigger Price (for SL)</label>
                  <input
                    type="number"
                    disabled={!orderType.includes('SL')}
                    value={triggerPrice}
                    onChange={(e) => setTriggerPrice(Number(e.target.value))}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-2.5 text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)] disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Margin Summary */}
              <div className="p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-[var(--text-muted)] block text-[10px] font-bold uppercase">Estimated Order Value</span>
                  <span className="font-mono font-extrabold text-lg text-[var(--text-primary)]">
                    {formatCompactCurrency(estOrderVal, currency)}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block text-[10px] font-bold uppercase">Required Margin</span>
                  <span className="font-mono font-extrabold text-lg text-[var(--icici-orange)]">
                    {formatCompactCurrency(productType.includes('Intraday') ? estOrderVal * 0.2 : estOrderVal, currency)}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block text-[10px] font-bold uppercase">Available Margin Balance</span>
                  <span className="font-mono font-extrabold text-lg text-emerald-600 dark:text-emerald-400">
                    {formatCompactCurrency(availableMargin, currency)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-3.5 rounded-xl font-black text-sm text-white shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  orderAction === 'BUY'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                SUBMIT {orderAction} ORDER FOR {selectedAsset}
              </button>
            </form>
          </div>
        )}

        {/* SECTION 2: OPEN POSITIONS */}
        {(activeTabId === 'open_positions' || activeTabId === 'portfolio_summary') && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
              <div>
                <h3 className="text-lg font-extrabold flex items-center gap-2 text-[var(--text-primary)]">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  Live Intraday & F&O Open Positions
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">Real-time mark-to-market (MTM) position tracking and instant square-off execution</p>
              </div>
              <span className="text-xs font-mono text-[var(--text-muted)] font-bold bg-[var(--bg-tertiary)] px-3 py-1 rounded-full border border-[var(--border-color)]">
                4 Active Positions
              </span>
            </div>

            {/* MTM Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">TOTAL MTM P&L</div>
                <div className="text-2xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  +{formatCompactCurrency(16425, currency)} (+3.85%)
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">REALIZED P&L</div>
                <div className="text-2xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  +{formatCompactCurrency(4200, currency)}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">UNREALIZED P&L</div>
                <div className="text-2xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  +{formatCompactCurrency(12225, currency)}
                </div>
              </div>
            </div>

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
                          className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold cursor-pointer transition-colors"
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
        {activeTabId === 'order_book' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
              <div>
                <h3 className="text-lg font-extrabold flex items-center gap-2 text-[var(--text-primary)]">
                  <Clock className="w-5 h-5 text-[var(--icici-orange)]" />
                  Exchange Order Book & Audit Log
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">Complete order lifecycle audit, execution status, and pending limit orders</p>
              </div>
              <span className="text-xs font-mono text-[var(--text-muted)] font-bold bg-[var(--bg-tertiary)] px-3 py-1 rounded-full border border-[var(--border-color)]">
                Total Orders: {orderBook.length}
              </span>
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
        {activeTabId === 'trade_book' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
              <div>
                <h3 className="text-lg font-extrabold flex items-center gap-2 text-[var(--text-primary)]">
                  <FileText className="w-5 h-5 text-purple-500" />
                  Executed Trade Book & Contract Notes
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">Executed fill details, brokerage calculation, STT, and downloadable digital contract notes</p>
              </div>
              <button
                onClick={() => alert("Downloading Official Contract Note PDF...")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--icici-orange)] text-white text-xs font-bold hover:bg-[var(--icici-orange-hover)] transition-colors cursor-pointer shadow-md"
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
        {activeTabId === 'funds' && (
          <div className="space-y-6">
            <div className="border-b border-[var(--border-color)] pb-4">
              <h3 className="text-lg font-extrabold flex items-center gap-2 text-[var(--text-primary)]">
                <CreditCard className="w-5 h-5 text-[var(--icici-orange)]" />
                Funds & Margin Management Portal
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">Manage liquid trading balance, deposit via instant UPI, and view collateral margin</p>
            </div>

            {fundSuccessMsg && (
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-pulse">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                Funds Added Successfully via UPI Instant Transfer! Available margin updated.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">AVAILABLE MARGIN</div>
                <div className="text-2xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatCompactCurrency(availableMargin, currency)}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">USED MARGIN</div>
                <div className="text-2xl font-mono font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                  {formatCompactCurrency(125000, currency)}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">CASH BALANCE</div>
                <div className="text-2xl font-mono font-extrabold text-[var(--text-primary)] mt-1">
                  {formatCompactCurrency(310000, currency)}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">DEMAT COLLATERAL</div>
                <div className="text-2xl font-mono font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                  {formatCompactCurrency(300000, currency)}
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-4">
              <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[var(--icici-orange)]" />
                Instant UPI / NetBanking Deposit
              </h4>

              <form onSubmit={handleAddFundsSubmit} className="flex flex-wrap items-center gap-4">
                <input
                  type="number"
                  value={addFundsAmount}
                  onChange={(e) => setAddFundsAmount(Number(e.target.value))}
                  className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)] w-48"
                  placeholder="Amount in ₹"
                />
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[var(--icici-orange)] hover:bg-[var(--icici-orange-hover)] text-white font-extrabold text-xs shadow-md cursor-pointer transition-all"
                >
                  ADD FUNDS VIA UPI INSTANT
                </button>
              </form>
            </div>
          </div>
        )}

        {/* SECTION 6: DEMAT HOLDINGS */}
        {activeTabId === 'demat_holdings' && (
          <div className="space-y-6">
            <div className="border-b border-[var(--border-color)] pb-4">
              <h3 className="text-lg font-extrabold flex items-center gap-2 text-[var(--text-primary)]">
                <Building2 className="w-5 h-5 text-blue-500" />
                CDSL / NSDL Demat Holdings Statement
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">Verified depository holdings statement, valuation, and pledge margin benefits</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">INVESTED VALUE</div>
                <div className="text-2xl font-mono font-extrabold text-[var(--text-primary)] mt-1">
                  {formatCompactCurrency(1850000, currency)}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">CURRENT VALUE</div>
                <div className="text-2xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatCompactCurrency(2480000, currency)}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">OVERALL GAIN</div>
                <div className="text-2xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  +{formatCompactCurrency(630000, currency)} (+34.05%)
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">DAY P&L</div>
                <div className="text-2xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  +{formatCompactCurrency(12400, currency)}
                </div>
              </div>
            </div>

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
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)]">
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
        {activeTabId === 'gold' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
              <div>
                <h3 className="text-lg font-extrabold flex items-center gap-2 text-[var(--text-primary)]">
                  <Coins className="w-5 h-5 text-amber-500" />
                  Sovereign Gold Bonds (SGB) & 24K Digital Gold Portal
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">RBI Sovereign Gold Bonds, MMTC-PAMP 24K Gold SIP, and Gold ETF (GOLDBEES)</p>
              </div>
              <span className="text-xs font-mono font-bold text-amber-600 bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/30">
                Live 24K Gold: ₹7,245 / Gram (+0.65%)
              </span>
            </div>

            {goldSuccessMsg && (
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-bounce">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                SGB Subscription Application Submitted! Discount of ₹50/gram applied. View in Demat statement.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/30 space-y-2.5">
                <div className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" /> RBI Sovereign Gold Bonds (SGB)
                </div>
                <div className="text-3xl font-mono font-black text-amber-600 dark:text-amber-400">
                  2.50% p.a.
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Fixed annual interest paid semi-annually + 100% Tax-Free capital gains at maturity.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2.5">
                <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" /> 24K Pure Digital Gold SIP
                </div>
                <div className="text-3xl font-mono font-black text-[var(--text-primary)]">
                  ₹500 / Month
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Accumulate 99.9% pure 24K MMTC-PAMP gold with zero storage cost.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2.5">
                <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-500" /> Gold ETF (GOLDBEES)
                </div>
                <div className="text-3xl font-mono font-black text-[var(--text-primary)]">
                  ₹64.20
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Trade gold units instantly on NSE & BSE with high liquidity.
                </p>
              </div>
            </div>

            {goldSuccessMsg && (
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-bounce">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                SGB Primary Tranche Application Submitted! Discount of ₹50/gram applied. View in Demat holdings.
              </div>
            )}

            {/* Primary Tranche ASBA Subscription Card */}
            <div className="p-6 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-4">
              <h4 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                <Landmark className="w-4 h-4 text-[var(--icici-orange)]" />
                Subscribe to Sovereign Gold Bond Primary Issue (RBI ASBA)
              </h4>
              <div className="flex flex-wrap items-center gap-5 text-xs">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[var(--text-primary)]">Select Quantity (Grams)</label>
                  <input
                    type="number"
                    min="1"
                    value={sgbGrams}
                    onChange={(e) => setSgbGrams(Number(e.target.value))}
                    className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 font-mono font-bold text-[var(--text-primary)] w-36 focus:outline-none focus:border-[var(--icici-orange)]"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-[var(--text-muted)] block">Issue Price per Gram</span>
                  <span className="font-mono font-bold text-sm text-[var(--text-primary)]">₹7,195 (₹50 Online Discount)</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-[var(--text-muted)] block">Total Investment</span>
                  <span className="font-mono font-extrabold text-base text-[var(--icici-orange)]">₹{(sgbGrams * 7195).toLocaleString('en-IN')}</span>
                </div>
                <button
                  onClick={() => {
                    setGoldSuccessMsg(true);
                    setTimeout(() => setGoldSuccessMsg(false), 3500);
                  }}
                  className="ml-auto px-6 py-2.5 rounded-xl bg-[var(--icici-orange)] hover:bg-[var(--icici-orange-hover)] text-white font-extrabold text-xs shadow-md cursor-pointer transition-all"
                >
                  APPLY PRIMARY SGB VIA ASBA
                </button>
              </div>
            </div>

            {/* Secondary Market Tradeable SGB Table */}
            <div className="space-y-4 pt-4 border-t border-[var(--border-color)]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h4 className="font-extrabold text-base text-[var(--text-primary)] flex items-center gap-2">
                    <Coins className="w-5 h-5 text-amber-500" />
                    Tradeable Sovereign Gold Bonds (BSE & NSE Secondary Market)
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Real-time market trading prices for active SGB tranches. Click any tranche to view Maturation Date, YTM Yield, and Interest Rate.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-600 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Real-Time BSE/NSE Gold Feed: ₹7,245 / Gram</span>
                </div>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="fin-table">
                  <thead>
                    <tr>
                      <th>SGB Symbol</th>
                      <th>Tranche Name & ISIN</th>
                      <th>Real-Time Price (₹/g)</th>
                      <th>24h Change</th>
                      <th>Interest Rate</th>
                      <th>YTM Yield</th>
                      <th>Maturation Date</th>
                      <th>Details & Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tradeableSgbList.map(sgb => (
                      <tr 
                        key={sgb.id} 
                        onClick={() => setSelectedSgbDetail(sgb)}
                        className="hover:bg-[var(--bg-card-hover)] cursor-pointer transition-colors"
                      >
                        <td className="font-mono font-bold text-amber-600 dark:text-amber-400">
                          {sgb.symbol}
                        </td>
                        <td>
                          <div className="font-bold text-[var(--text-primary)] text-xs">{sgb.trancheName}</div>
                          <div className="text-[10px] text-[var(--text-muted)] font-mono">{sgb.isin} • {sgb.exchange}</div>
                        </td>
                        <td className="font-mono font-black text-sm text-[var(--text-primary)]">
                          ₹{sgb.currentPrice.toLocaleString()}
                        </td>
                        <td>
                          <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                            +{sgb.change24h}%
                          </span>
                        </td>
                        <td className="font-mono font-bold text-[var(--text-primary)]">
                          {sgb.interestRate}% p.a.
                        </td>
                        <td className="font-mono font-black text-amber-600 dark:text-amber-400">
                          {sgb.yieldToMaturity}% YTM
                        </td>
                        <td className="font-mono text-xs font-bold text-[var(--text-primary)]">
                          {sgb.maturityDate}
                        </td>
                        <td>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSgbDetail(sgb);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-bold transition-all border border-amber-500/30 cursor-pointer"
                          >
                            <Info className="w-3.5 h-3.5 text-amber-500" />
                            <span>View Yield & Maturation</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SGB Detailed Specification Popup Modal */}
            {selectedSgbDetail && (
              <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-6 relative overflow-hidden">
                  <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono font-black text-xs">
                          {selectedSgbDetail.symbol}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                          {selectedSgbDetail.sovereignRating}
                        </span>
                      </div>
                      <h3 className="text-lg font-extrabold text-[var(--text-primary)]">
                        {selectedSgbDetail.trancheName}
                      </h3>
                      <p className="text-xs font-mono text-[var(--text-muted)]">
                        ISIN: {selectedSgbDetail.isin} • Listed on {selectedSgbDetail.exchange}
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedSgbDetail(null)}
                      className="p-1.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* 4 Key Highlight Metric Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/30 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-500" /> Maturation Date
                      </span>
                      <div className="text-lg font-mono font-black text-amber-600 dark:text-amber-400">
                        {selectedSgbDetail.maturityDate}
                      </div>
                      <span className="text-[11px] font-semibold text-[var(--text-secondary)] block">
                        Tenor Remaining: {selectedSgbDetail.tenorRemaining}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 border border-emerald-500/30 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                        <Percent className="w-3.5 h-3.5 text-emerald-500" /> Yield to Maturity (YTM)
                      </span>
                      <div className="text-lg font-mono font-black text-emerald-600 dark:text-emerald-400">
                        {selectedSgbDetail.yieldToMaturity}% p.a.
                      </div>
                      <span className="text-[11px] font-semibold text-[var(--text-secondary)] block">
                        Annual Interest + Gold Capital Gain
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-1">
                      <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-500" /> Coupon Interest Rate
                      </span>
                      <div className="text-lg font-mono font-extrabold text-[var(--text-primary)]">
                        {selectedSgbDetail.interestRate}% p.a.
                      </div>
                      <span className="text-[11px] font-semibold text-[var(--text-secondary)] block">
                        Paid Semi-Annually (Next: {selectedSgbDetail.nextCouponDate})
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-1">
                      <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-blue-500" /> Market Trading Price
                      </span>
                      <div className="text-lg font-mono font-extrabold text-[var(--text-primary)]">
                        ₹{selectedSgbDetail.currentPrice.toLocaleString()} / g
                      </div>
                      <span className="text-[11px] font-semibold text-[var(--text-secondary)] block">
                        Original Issue: ₹{selectedSgbDetail.issuePrice.toLocaleString()} / g
                      </span>
                    </div>
                  </div>

                  {/* Sovereign Tax Exemption Notice */}
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs font-semibold space-y-1">
                    <div className="font-extrabold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-500" />
                      100% Tax-Free Sovereign Guarantee
                    </div>
                    <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
                      {selectedSgbDetail.taxStatus}. Backed 100% by the Reserve Bank of India (RBI) on behalf of the Government of India.
                    </p>
                  </div>

                  {/* Footer Action Buttons */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-[var(--text-muted)] font-mono font-semibold">
                      24h Trading Volume: {selectedSgbDetail.volume24h}
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedSgbDetail(null)}
                        className="px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] text-xs font-bold transition-all cursor-pointer"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSgbDetail(null);
                          handleSelectAsset('SGB-GOLD.NS');
                        }}
                        className="px-6 py-2.5 rounded-xl bg-[var(--icici-orange)] hover:bg-[var(--icici-orange-hover)] text-white text-xs font-extrabold transition-all shadow-md cursor-pointer"
                      >
                        Place Secondary Market Buy Order
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION 8: IPO & NFO */}
        {activeTabId === 'ipo' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
              <div>
                <h3 className="text-lg font-extrabold flex items-center gap-2 text-[var(--text-primary)]">
                  <Rocket className="w-5 h-5 text-[var(--icici-orange)]" />
                  Indian & US Market IPO / NFO Platform
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Real-time Internet Data Stream • Stored in IndexedDB • Live Grey Market Premium (GMP)
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Strictly Separate Market Segment Tabs */}
                <div className="flex items-center gap-1.5 bg-[var(--bg-tertiary)] p-1.5 rounded-2xl border border-[var(--border-color)]">
                  <button
                    onClick={() => setSelectedIpoMarket('Indian')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      selectedIpoMarket === 'Indian'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md ring-2 ring-emerald-500/30'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
                    }`}
                  >
                    <span>🇮🇳</span>
                    <span>Indian Market (NSE/BSE & NFO)</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono bg-emerald-500/20 text-emerald-300">
                      {ipoList.filter(i => i.market === 'Indian (NSE/BSE)').length}
                    </span>
                  </button>
                  <button
                    onClick={() => setSelectedIpoMarket('US')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      selectedIpoMarket === 'US'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md ring-2 ring-blue-500/30'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
                    }`}
                  >
                    <span>🇺🇸</span>
                    <span>US Market (NYSE/NASDAQ & FPO)</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono bg-blue-500/20 text-blue-300">
                      {ipoList.filter(i => i.market === 'US (NYSE/NASDAQ)').length}
                    </span>
                  </button>
                </div>

                {/* Refresh Live Button */}
                <button
                  onClick={handleRefreshIpoData}
                  disabled={isIpoRefreshing}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:border-[var(--icici-orange)] text-xs font-bold text-[var(--text-primary)] transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  title="Fetch live IPO metrics from internet & store in database"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[var(--icici-orange)] ${isIpoRefreshing ? 'animate-spin' : ''}`} />
                  <span>{isIpoRefreshing ? 'Fetching Internet Data...' : 'Refresh Live Data'}</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">({ipoLastUpdated})</span>
                </button>
              </div>
            </div>

            {ipoAppliedMsg && (
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-bounce">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                {ipoAppliedMsg}
              </div>
            )}

            <div className="overflow-x-auto w-full">
              <table className="fin-table">
                <thead>
                  <tr>
                    <th>Company / Issue Name</th>
                    <th>Market Segment</th>
                    <th>Price Band</th>
                    <th>Lot Size</th>
                    <th>Subscription</th>
                    <th>Grey Market Premium (GMP)</th>
                    <th>Rating</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedIpoList.length > 0 ? (
                    displayedIpoList.map(ipo => (
                      <tr key={ipo.id}>
                        <td className="font-mono font-bold text-[var(--text-primary)]">
                          <div className="flex items-center gap-2">
                            <span>{ipo.market.includes('Indian') ? '🇮🇳' : '🇺🇸'}</span>
                            <span>{ipo.name}</span>
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)] font-sans mt-0.5">
                            {ipo.category} • {ipo.dates}
                          </div>
                        </td>
                        <td>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            ipo.market.includes('Indian')
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                              : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                          }`}>
                            {ipo.exchange || ipo.market}
                          </span>
                        </td>
                        <td className="font-mono font-bold text-[var(--text-primary)]">{ipo.priceBand}</td>
                        <td className="text-xs font-semibold text-[var(--text-secondary)]">{ipo.lotSize}</td>
                        <td className="font-mono font-bold text-blue-600 dark:text-blue-400">{ipo.subMultiple}</td>
                        <td className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{ipo.gmp}</td>
                        <td>
                          <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                            {ipo.rating}
                          </span>
                        </td>
                        <td>
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                            ipo.status === 'OPEN FOR BIDDING'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : ipo.status === 'LISTED'
                              ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          }`}>
                            {ipo.status}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleApplyIpo(ipo.name)}
                            className={`px-3.5 py-1.5 rounded-lg text-white text-xs font-bold cursor-pointer transition-colors shadow-xs ${
                              ipo.market.includes('US')
                                ? 'bg-blue-600 hover:bg-blue-700'
                                : 'bg-[var(--icici-orange)] hover:bg-[var(--icici-orange-hover)]'
                            }`}
                          >
                            {ipo.market.includes('US') ? 'Pre-Order IPO' : 'Apply ASBA'}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-xs font-bold text-[var(--text-muted)]">
                        No IPO or NFO offerings found for {selectedIpoMarket} market. Click "Refresh Live Data" to fetch online feeds.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 9: FD & BONDS MARKETPLACE (Wint Wealth Style) */}
        {activeTabId === 'fd_bonds' && (
          <div className="space-y-6">
            {/* Header with Market Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
              <div>
                <h3 className="text-lg font-extrabold flex items-center gap-2 text-[var(--text-primary)]">
                  <Landmark className="w-5 h-5 text-amber-500" />
                  Bonds, NCDs & Corporate FDs Marketplace
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Publicly traded NCDs, Corporate FDs, and Treasuries categorized by Credit Ratings (AAA to BB) with live market traded prices.
                </p>
              </div>

              {/* Strictly Separate Market Tabs */}
              <div className="flex items-center gap-1.5 bg-[var(--bg-tertiary)] p-1.5 rounded-2xl border border-[var(--border-color)]">
                <button
                  onClick={() => setSelectedBondMarket('Indian')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    selectedBondMarket === 'Indian'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md ring-2 ring-emerald-500/30'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
                  }`}
                >
                  <span>🇮🇳</span>
                  <span>Indian Bonds & FDs (BSE/NSE)</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono bg-emerald-500/20 text-emerald-300">
                    {INDIAN_BONDS_CATALOG.length}
                  </span>
                </button>

                <button
                  onClick={() => setSelectedBondMarket('US')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    selectedBondMarket === 'US'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md ring-2 ring-blue-500/30'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
                  }`}
                >
                  <span>🇺🇸</span>
                  <span>US Treasuries & Bonds (FINRA/NYSE)</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono bg-blue-500/20 text-blue-300">
                    {US_BONDS_CATALOG.length}
                  </span>
                </button>
              </div>
            </div>

            {/* Layout: Sidebar Filter Module + Category Grouped Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* SIDEBAR FILTER & SEARCH MODULE */}
              <div className="lg:col-span-1 p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-5 h-fit sticky top-4">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                  <h4 className="font-extrabold text-sm text-[var(--text-primary)] flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[var(--icici-orange)]" />
                    Filter & Search
                  </h4>
                  <button
                    onClick={() => {
                      setBondSearchQuery('');
                      setBondMinYtm(0);
                      setBondMinCoupon(0);
                      setBondTenorFilter('ALL');
                      setBondTypeFilter('ALL');
                      setBondRatingFilter('ALL');
                    }}
                    className="text-[11px] font-bold text-[var(--icici-orange)] hover:underline cursor-pointer"
                  >
                    Reset All
                  </button>
                </div>

                {/* Search Bar for Company / Issuer Name */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                    Search Issuer / Company
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={bondSearchQuery}
                      onChange={(e) => setBondSearchQuery(e.target.value)}
                      placeholder="Search L&T, Shriram, Treasury..."
                      className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)]"
                    />
                  </div>
                </div>

                {/* Rating Filter Pills */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                    Credit Rating
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {['ALL', 'AAA', 'AA', 'A', 'BBB', 'BB'].map(r => (
                      <button
                        key={r}
                        onClick={() => setBondRatingFilter(r)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          bondRatingFilter === r
                            ? 'bg-[var(--icici-orange)] text-white'
                            : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {r === 'ALL' ? 'All Ratings' : r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* YTM Yield Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold uppercase tracking-wider text-[var(--text-muted)]">Min Yield (YTM)</span>
                    <span className="font-mono font-extrabold text-[var(--icici-orange)]">{bondMinYtm}% p.a.</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="14"
                    step="0.5"
                    value={bondMinYtm}
                    onChange={(e) => setBondMinYtm(Number(e.target.value))}
                    className="w-full accent-[var(--icici-orange)] cursor-pointer"
                  />
                </div>

                {/* Coupon Interest Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold uppercase tracking-wider text-[var(--text-muted)]">Min Coupon Rate</span>
                    <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">{bondMinCoupon}% p.a.</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="14"
                    step="0.5"
                    value={bondMinCoupon}
                    onChange={(e) => setBondMinCoupon(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                {/* Tenor / Expiration Horizon */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                    Maturity Horizon
                  </label>
                  <div className="grid grid-cols-2 gap-1">
                    {[
                      { id: 'ALL', label: 'All Horizons' },
                      { id: 'SHORT', label: '< 2 Years' },
                      { id: 'MEDIUM', label: '2 – 5 Years' },
                      { id: 'LONG', label: '> 5 Years' }
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => setBondTenorFilter(t.id as any)}
                        className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          bondTenorFilter === t.id
                            ? 'bg-amber-500 text-white'
                            : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)]'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Instrument Category Filter */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                    Instrument Type
                  </label>
                  <select
                    value={bondTypeFilter}
                    onChange={(e) => setBondTypeFilter(e.target.value)}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2 text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)]"
                  >
                    <option value="ALL">All Instrument Types</option>
                    <option value="Government Bond">Government Bonds & G-Secs</option>
                    <option value="Secured NCD">Secured Corporate NCDs</option>
                    <option value="Corporate FD">Corporate Fixed Deposits</option>
                    <option value="Tax-Free Bond">100% Tax-Free Bonds</option>
                    <option value="US Treasury">US Treasuries & T-Bills</option>
                    <option value="US Corporate Bond">US Corporate Bonds</option>
                    <option value="High Yield Note">High Yield Debt Notes</option>
                  </select>
                </div>
              </div>

              {/* CATEGORIZED INSTRUMENT CARDS (Top 2-3 Per Rating Tier) */}
              <div className="lg:col-span-3 space-y-6">
                {Object.keys(groupedBondsByRating).length > 0 ? (
                  (Object.keys(groupedBondsByRating) as Array<'AAA' | 'AA' | 'A' | 'BBB' | 'BB'>).map(rating => (
                    <div key={rating} className="space-y-3">
                      {/* Rating Tier Header */}
                      <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
                        <span className={`px-3 py-1 rounded-lg text-xs font-mono font-black ${
                          rating === 'AAA' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' :
                          rating === 'AA' ? 'bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30' :
                          rating === 'A' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30' :
                          rating === 'BBB' ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30' :
                          'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                        }`}>
                          {rating} RATED
                        </span>
                        <h4 className="font-extrabold text-sm text-[var(--text-primary)]">
                          {rating === 'AAA' ? 'Highest Safety Tier (Institutional & Sovereign)' :
                           rating === 'AA' ? 'High Safety Tier (Top Corporate Debt)' :
                           rating === 'A' ? 'Adequate Safety Tier (Above Market Average)' :
                           rating === 'BBB' ? 'Moderate Risk Tier (Higher Yields)' :
                           'Speculative High Yield Tier (Max Income)'}
                        </h4>
                        <span className="ml-auto text-[11px] font-mono text-[var(--text-muted)] font-semibold">
                          Showing Top {Math.min(3, groupedBondsByRating[rating].length)} of {groupedBondsByRating[rating].length}
                        </span>
                      </div>

                      {/* Top 2-3 Cards for this Rating Tier */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {groupedBondsByRating[rating].slice(0, 3).map(bond => (
                          <div 
                            key={bond.id}
                            onClick={() => setSelectedBondDetail(bond)}
                            className="p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:border-[var(--icici-orange)] hover:shadow-lg transition-all cursor-pointer space-y-4 group relative overflow-hidden"
                          >
                            {/* Card Top: Issuer & Badges */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                                  {bond.category}
                                </span>
                                <h5 className="font-extrabold text-sm text-[var(--text-primary)] group-hover:text-[var(--icici-orange)] transition-colors">
                                  {bond.name}
                                </h5>
                                <div className="text-[11px] font-semibold text-[var(--text-secondary)]">
                                  {bond.issuer}
                                </div>
                              </div>

                              <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-black bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] shrink-0">
                                {bond.agencyRating}
                              </span>
                            </div>

                            {/* Key Highlights Metrics */}
                            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                              <div>
                                <span className="text-[9px] font-bold uppercase text-[var(--text-muted)] block">YTM YIELD</span>
                                <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                                  {bond.ytmPct}% p.a.
                                </span>
                              </div>
                              <div>
                                <span className="text-[9px] font-bold uppercase text-[var(--text-muted)] block">COUPON</span>
                                <span className="font-mono font-extrabold text-xs text-[var(--text-primary)]">
                                  {bond.couponRatePct}%
                                </span>
                              </div>
                              <div>
                                <span className="text-[9px] font-bold uppercase text-[var(--text-muted)] block">MATURITY</span>
                                <span className="font-mono font-bold text-xs text-[var(--text-primary)]">
                                  {bond.tenorYears} Yrs
                                </span>
                              </div>
                            </div>

                            {/* Traded Price & Action Bar */}
                            <div className="flex items-center justify-between pt-1 text-xs">
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-semibold text-[var(--text-muted)] block">
                                  Market Traded Price ({bond.exchange})
                                </span>
                                <span className="font-mono font-black text-sm text-[var(--text-primary)]">
                                  {bond.currency}{bond.tradedPrice.toLocaleString()}
                                </span>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedBondDetail(bond);
                                }}
                                className="px-4 py-2 rounded-xl bg-[var(--icici-orange)] hover:bg-[var(--icici-orange-hover)] text-white font-extrabold text-xs transition-all shadow-xs cursor-pointer"
                              >
                                Inspect & Buy
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-3">
                    <ShieldAlert className="w-10 h-10 text-[var(--text-muted)] mx-auto" />
                    <h4 className="font-bold text-sm text-[var(--text-primary)]">No Fixed Income Instruments Match Filter Criteria</h4>
                    <p className="text-xs text-[var(--text-secondary)]">Try clearing company search query or lowering minimum yield/coupon thresholds.</p>
                  </div>
                )}
              </div>

            </div>

            {/* WINT WEALTH STYLE BOND DETAIL POPUP MODAL */}
            {selectedBondDetail && (
              <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-6 relative overflow-hidden">
                  <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-[var(--icici-orange)]/20 text-[var(--icici-orange)] font-mono font-black text-xs">
                          {selectedBondDetail.creditRating} RATED
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                          {selectedBondDetail.agencyRating}
                        </span>
                      </div>
                      <h3 className="text-lg font-extrabold text-[var(--text-primary)]">
                        {selectedBondDetail.name}
                      </h3>
                      <p className="text-xs font-mono text-[var(--text-muted)]">
                        ISIN: {selectedBondDetail.isin} • Listed on {selectedBondDetail.exchange}
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedBondDetail(null)}
                      className="p-1.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Highlight Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 border border-emerald-500/30 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                        <Percent className="w-3.5 h-3.5 text-emerald-500" /> Yield to Maturity (YTM)
                      </span>
                      <div className="text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400">
                        {selectedBondDetail.ytmPct}% p.a.
                      </div>
                      <span className="text-[11px] font-semibold text-[var(--text-secondary)] block">
                        Annual Effective Internal Rate of Return
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-1">
                      <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-500" /> Coupon Interest Rate
                      </span>
                      <div className="text-2xl font-mono font-extrabold text-[var(--text-primary)]">
                        {selectedBondDetail.couponRatePct}% p.a.
                      </div>
                      <span className="text-[11px] font-semibold text-[var(--text-secondary)] block">
                        Payout: {selectedBondDetail.payoutFrequency}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-1">
                      <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-500" /> Maturity Date
                      </span>
                      <div className="text-base font-mono font-bold text-[var(--text-primary)]">
                        {selectedBondDetail.maturityDate}
                      </div>
                      <span className="text-[11px] font-semibold text-[var(--text-secondary)] block">
                        Tenor: {selectedBondDetail.tenorYears} Years
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-1">
                      <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 text-amber-500" /> Market Traded Price
                      </span>
                      <div className="text-base font-mono font-bold text-[var(--text-primary)]">
                        {selectedBondDetail.currency}{selectedBondDetail.tradedPrice.toLocaleString()}
                      </div>
                      <span className="text-[11px] font-semibold text-[var(--text-secondary)] block">
                        Face Value: {selectedBondDetail.currency}{selectedBondDetail.faceValue.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Summary & Guarantee Notice */}
                  <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs space-y-2">
                    <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      Structure & Tax Treatment
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                      {selectedBondDetail.summary}
                    </p>
                    <div className="text-[10px] font-mono text-[var(--text-muted)]">
                      Tax Status: {selectedBondDetail.taxStatus}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs font-mono font-bold text-[var(--text-primary)]">
                      Min Investment: {selectedBondDetail.currency}{selectedBondDetail.minInvestment.toLocaleString()}
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedBondDetail(null)}
                        className="px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] text-xs font-bold transition-all cursor-pointer"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => {
                          setSelectedBondDetail(null);
                          handleSelectAsset('RELIANCE.NS');
                        }}
                        className="px-6 py-2.5 rounded-xl bg-[var(--icici-orange)] hover:bg-[var(--icici-orange-hover)] text-white text-xs font-extrabold transition-all shadow-md cursor-pointer"
                      >
                        Place Secondary Order
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION 10: NATIONAL PENSION SYSTEM (NPS) PORTAL */}
        {activeTabId === 'nps' && (
          <div className="space-y-6">
            {/* Header & e-PRAN Summary Banner */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
              <div>
                <h3 className="text-lg font-extrabold flex items-center gap-2 text-[var(--text-primary)]">
                  <Award className="w-5 h-5 text-[var(--icici-orange)]" />
                  National Pension System (NPS) Portal (CRA & ICICI Direct Integrated)
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Protean eGov / NSDL CRA Registered Account • Tier-I Mandatory Pension & Tier-II Voluntary Savings
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setNpsContribModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[var(--icici-orange)] hover:bg-[var(--icici-orange-hover)] text-white text-xs font-extrabold shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>D-Remit Instant Contribution</span>
                </button>

                <button
                  onClick={() => alert("Downloading e-PRAN & Master Statement of Transaction (SOT) PDF...")}
                  className="px-4 py-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:border-[var(--icici-orange)] text-xs font-bold text-[var(--text-primary)] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4 text-[var(--icici-orange)]" />
                  <span>e-PRAN & SOT PDF</span>
                </button>
              </div>
            </div>

            {npsContribSuccessMsg && (
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-bounce">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                NPS Contribution of ₹{npsContribAmountInput.toLocaleString()} Successfully Allocated to {npsActiveTier}! Same-Day T+0 NAV Applied.
              </div>
            )}

            {npsPfmSwitchSuccessMsg && (
              <div className="p-4 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-300 text-xs font-bold flex items-center gap-2 animate-pulse">
                <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0" />
                Pension Fund Manager Switched to {npsSelectedPfm}! Change request submitted to NSDL/Protean CRA.
              </div>
            )}

            {/* Virtual e-PRAN Card Banner */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/30 text-white shadow-2xl relative overflow-hidden space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono font-black text-xs tracking-wider border border-amber-500/30">
                      PRAN: 110189240192
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      PROTEAN / NSDL CRA VERIFIED
                    </span>
                  </div>
                  <h4 className="text-xl font-extrabold tracking-tight text-white">
                    VERIFIED DEMAT SUBSCRIBER
                  </h4>
                  <div className="text-xs text-amber-200/80 font-mono">
                    Registered PFM: <span className="font-bold text-amber-400">{npsSelectedPfm}</span>
                  </div>
                </div>

                {/* Sec 80CCD Tax Savings Badge */}
                <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs space-y-1">
                  <div className="font-extrabold text-amber-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    Section 80CCD(1B) Tax Exemption
                  </div>
                  <p className="text-[11px] text-amber-100/80">
                    Claimed <span className="font-bold text-white">₹50,000 Extra Deduction</span> (Saves ₹15,600/year in 30% slab).
                  </p>
                </div>
              </div>

              {/* Tier Valuation Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-amber-500/20">
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-amber-500/20">
                  <span className="text-[10px] font-bold text-amber-300/70 uppercase block">TIER-I PENSION VALUATION</span>
                  <div className="text-2xl font-mono font-black text-amber-400 mt-0.5">₹6,45,000</div>
                  <span className="text-[10px] font-semibold text-emerald-400 block">XIRR: +14.85% p.a.</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-amber-500/20">
                  <span className="text-[10px] font-bold text-amber-300/70 uppercase block">TIER-II LIQUID VALUATION</span>
                  <div className="text-2xl font-mono font-black text-white mt-0.5">₹1,85,000</div>
                  <span className="text-[10px] font-semibold text-amber-300/80 block">Zero Lock-in (Instant Withdrawal)</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-amber-500/20">
                  <span className="text-[10px] font-bold text-amber-300/70 uppercase block">TOTAL NPS WEALTH</span>
                  <div className="text-2xl font-mono font-black text-emerald-400 mt-0.5">₹8,30,000</div>
                  <span className="text-[10px] font-semibold text-amber-300/80 block">Total Tax Saved: ₹1,42,000</span>
                </div>
              </div>
            </div>

            {/* Tier Selector Bar */}
            <div className="flex items-center gap-2 bg-[var(--bg-tertiary)] p-1.5 rounded-2xl border border-[var(--border-color)]">
              <button
                onClick={() => setNpsActiveTier('TIER_1')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  npsActiveTier === 'TIER_1'
                    ? 'bg-[var(--icici-orange)] text-white shadow-md'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Tier-I Account (Mandatory Pension & Tax Saver)</span>
              </button>

              <button
                onClick={() => setNpsActiveTier('TIER_2')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  npsActiveTier === 'TIER_2'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Coins className="w-4 h-4" />
                <span>Tier-II Account (Voluntary Investment & Instant Withdrawal)</span>
              </button>
            </div>

            {/* RETIREMENT PENSION & WEALTH ACCUMULATION CALCULATOR */}
            <div className="p-6 rounded-3xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <div>
                  <h4 className="font-extrabold text-base text-[var(--text-primary)] flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[var(--icici-orange)]" />
                    NPS Retirement Pension & Tax Wealth Calculator
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Estimate retirement corpus at age 60, 60% tax-free lump sum, and guaranteed monthly pension income.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30">
                  Target Age: 60 Years ({npsCalcResult.yearsToRetire} Years Remaining)
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Calculator Input Controls */}
                <div className="space-y-4">
                  {/* Slider 1: Age */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[var(--text-primary)]">Current Subscriber Age</span>
                      <span className="font-mono font-extrabold text-[var(--icici-orange)]">{npsCalcAge} Years</span>
                    </div>
                    <input
                      type="range"
                      min="18"
                      max="55"
                      value={npsCalcAge}
                      onChange={(e) => setNpsCalcAge(Number(e.target.value))}
                      className="w-full accent-[var(--icici-orange)] cursor-pointer"
                    />
                  </div>

                  {/* Slider 2: Monthly Contribution */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[var(--text-primary)]">Monthly Contribution</span>
                      <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">₹{npsCalcMonthlyContrib.toLocaleString()} / month</span>
                    </div>
                    <input
                      type="range"
                      min="1000"
                      max="50000"
                      step="1000"
                      value={npsCalcMonthlyContrib}
                      onChange={(e) => setNpsCalcMonthlyContrib(Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                  </div>

                  {/* Slider 3: Expected Return */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[var(--text-primary)]">Expected Return (CAGR %)</span>
                      <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400">{npsCalcExpectedReturn}% p.a.</span>
                    </div>
                    <input
                      type="range"
                      min="8"
                      max="15"
                      step="0.5"
                      value={npsCalcExpectedReturn}
                      onChange={(e) => setNpsCalcExpectedReturn(Number(e.target.value))}
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                  </div>

                  {/* Slider 4: Annuity Ratio */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[var(--text-primary)]">Annuity Purchase Ratio (Min 40%)</span>
                      <span className="font-mono font-extrabold text-amber-600 dark:text-amber-400">{npsCalcAnnuityRatio}% Annuity</span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="100"
                      step="5"
                      value={npsCalcAnnuityRatio}
                      onChange={(e) => setNpsCalcAnnuityRatio(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Calculator Result Output Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 border border-emerald-500/30 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300 block">TOTAL MATURITY CORPUS</span>
                    <div className="text-xl font-mono font-black text-emerald-600 dark:text-emerald-400">
                      ₹{Math.round(npsCalcResult.futureValue).toLocaleString('en-IN')}
                    </div>
                    <span className="text-[10px] font-semibold text-[var(--text-secondary)] block">
                      Total Invested: ₹{Math.round(npsCalcResult.totalPrincipal).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-1">
                    <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">60% TAX-FREE LUMP SUM</span>
                    <div className="text-xl font-mono font-black text-[var(--text-primary)]">
                      ₹{Math.round(npsCalcResult.lumpSumAmount).toLocaleString('en-IN')}
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-600 block">
                      100% Tax-Free Cash Out at 60
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-1">
                    <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">40% ANNUITY CAPITAL</span>
                    <div className="text-xl font-mono font-black text-amber-600 dark:text-amber-400">
                      ₹{Math.round(npsCalcResult.annuityCapital).toLocaleString('en-IN')}
                    </div>
                    <span className="text-[10px] font-semibold text-[var(--text-secondary)] block">
                      Generates Monthly Pension
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/30 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300 block">EST. MONTHLY PENSION</span>
                    <div className="text-xl font-mono font-black text-amber-600 dark:text-amber-400">
                      ₹{Math.round(npsCalcResult.estMonthlyPension).toLocaleString('en-IN')} / mo
                    </div>
                    <span className="text-[10px] font-semibold text-[var(--text-secondary)] block">
                      Lifetime Pension Income
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* PENSION FUND MANAGER (PFM) COMPARISON TABLE */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h4 className="font-extrabold text-base text-[var(--text-primary)] flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-500" />
                    Pension Fund Manager (PFM) Performance & One-Click Switch
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Compare historical CAGR returns across registered CRA Pension Fund Managers. Switch PFM anytime with zero charges.
                  </p>
                </div>

                <div className="text-xs font-mono font-bold text-[var(--text-primary)] bg-[var(--bg-tertiary)] px-3 py-1.5 rounded-xl border border-[var(--border-color)]">
                  Active PFM: <span className="text-[var(--icici-orange)]">{npsSelectedPfm}</span>
                </div>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="fin-table">
                  <thead>
                    <tr>
                      <th>Pension Fund Manager (PFM)</th>
                      <th>1Y Return</th>
                      <th>3Y CAGR</th>
                      <th>5Y CAGR</th>
                      <th>Total AUM (₹ Cr)</th>
                      <th>Rating & Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {npsPfmList.map(pfm => (
                      <tr 
                        key={pfm.code}
                        className={`hover:bg-[var(--bg-card-hover)] transition-colors ${
                          npsSelectedPfm === pfm.name ? 'bg-amber-500/10' : ''
                        }`}
                      >
                        <td>
                          <div className="font-bold text-[var(--text-primary)] text-xs flex items-center gap-2">
                            {pfm.name}
                            {npsSelectedPfm === pfm.name && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500 text-white">
                                ACTIVE
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+{pfm.return1Y}%</td>
                        <td className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+{pfm.return3Y}%</td>
                        <td className="font-mono font-black text-sm text-[var(--icici-orange)]">+{pfm.return5Y}% p.a.</td>
                        <td className="font-mono text-xs text-[var(--text-primary)]">₹{pfm.aumCr.toLocaleString()} Cr</td>
                        <td>
                          <button
                            onClick={() => {
                              setNpsSelectedPfm(pfm.name);
                              setNpsPfmSwitchSuccessMsg(true);
                              setTimeout(() => setNpsPfmSwitchSuccessMsg(false), 3500);
                            }}
                            disabled={npsSelectedPfm === pfm.name}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                              npsSelectedPfm === pfm.name
                                ? 'bg-emerald-600 text-white'
                                : 'bg-[var(--icici-orange)] hover:bg-[var(--icici-orange-hover)] text-white shadow-xs'
                            }`}
                          >
                            {npsSelectedPfm === pfm.name ? 'Current PFM' : 'Switch to PFM'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ASSET ALLOCATION CONTROL (ACTIVE vs AUTO CHOICE) */}
            <div className="p-6 rounded-3xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
                <div>
                  <h4 className="font-extrabold text-base text-[var(--text-primary)] flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-purple-500" />
                    Asset Allocation Choice (Active Choice vs Auto Choice Lifecycle)
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Customize weights across Equity (E), Corporate Debt (C), Govt Securities (G), and Alternative Assets (A).
                  </p>
                </div>

                {/* Allocation Mode Selector */}
                <div className="flex items-center gap-1.5 bg-[var(--bg-card)] p-1.5 rounded-2xl border border-[var(--border-color)]">
                  <button
                    onClick={() => setNpsAllocationMode('ACTIVE')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      npsAllocationMode === 'ACTIVE'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    Active Choice (Custom %)
                  </button>
                  <button
                    onClick={() => setNpsAllocationMode('AUTO')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      npsAllocationMode === 'AUTO'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    Auto Choice (Lifecycle Funds)
                  </button>
                </div>
              </div>

              {npsAllocationMode === 'ACTIVE' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {/* Equity E */}
                    <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[var(--text-primary)]">Scheme E (Equity)</span>
                        <span className="font-mono font-black text-[var(--icici-orange)]">{npsEquityPct}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="75"
                        value={npsEquityPct}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setNpsEquityPct(val);
                          const rem = 100 - val;
                          setNpsCorpDebtPct(Math.round(rem * 0.6));
                          setNpsGovtSecPct(Math.round(rem * 0.4));
                        }}
                        className="w-full accent-[var(--icici-orange)] cursor-pointer"
                      />
                      <span className="text-[10px] text-[var(--text-muted)] block">Max 75% Equity limit</span>
                    </div>

                    {/* Corporate Debt C */}
                    <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[var(--text-primary)]">Scheme C (Corporate Bonds)</span>
                        <span className="font-mono font-black text-blue-600 dark:text-blue-400">{npsCorpDebtPct}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={npsCorpDebtPct}
                        onChange={(e) => setNpsCorpDebtPct(Number(e.target.value))}
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                      <span className="text-[10px] text-[var(--text-muted)] block">High grade corporate debt</span>
                    </div>

                    {/* Govt Sec G */}
                    <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[var(--text-primary)]">Scheme G (Govt Sec)</span>
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">{npsGovtSecPct}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={npsGovtSecPct}
                        onChange={(e) => setNpsGovtSecPct(Number(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                      <span className="text-[10px] text-[var(--text-muted)] block">Sovereign G-Secs</span>
                    </div>

                    {/* Alt Assets A */}
                    <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[var(--text-primary)]">Scheme A (Alt Assets)</span>
                        <span className="font-mono font-black text-purple-600 dark:text-purple-400">{npsAltAssetsPct}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        value={npsAltAssetsPct}
                        onChange={(e) => setNpsAltAssetsPct(Number(e.target.value))}
                        className="w-full accent-purple-500 cursor-pointer"
                      />
                      <span className="text-[10px] text-[var(--text-muted)] block">REITs / AIFs (Max 5%)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono font-bold text-[var(--text-primary)] bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border-color)]">
                    <span>Total Allocation Split: {npsEquityPct + npsCorpDebtPct + npsGovtSecPct + npsAltAssetsPct}%</span>
                    <button
                      onClick={() => alert("Active Choice Asset Allocation Saved & Submitted to Protean CRA!")}
                      className="px-4 py-1.5 rounded-lg bg-[var(--icici-orange)] text-white text-xs font-extrabold hover:bg-[var(--icici-orange-hover)] transition-all cursor-pointer"
                    >
                      Save Active Choice Allocation
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div 
                    onClick={() => setNpsAutoChoiceOption('LC-75')}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                      npsAutoChoiceOption === 'LC-75'
                        ? 'bg-amber-500/15 border-amber-500 shadow-md ring-2 ring-amber-500/30'
                        : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-amber-500/50'
                    }`}
                  >
                    <div className="font-extrabold text-sm text-[var(--text-primary)] flex items-center justify-between">
                      <span>LC-75 Aggressive Lifecycle</span>
                      <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-600 px-2 py-0.5 rounded">
                        Max Equity 75%
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      Starts with 75% equity allocation up to age 35, gradually reducing equity by 2% each year.
                    </p>
                  </div>

                  <div 
                    onClick={() => setNpsAutoChoiceOption('LC-50')}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                      npsAutoChoiceOption === 'LC-50'
                        ? 'bg-emerald-500/15 border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
                        : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-emerald-500/50'
                    }`}
                  >
                    <div className="font-extrabold text-sm text-[var(--text-primary)] flex items-center justify-between">
                      <span>LC-50 Moderate Lifecycle</span>
                      <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-600 px-2 py-0.5 rounded">
                        Max Equity 50%
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      Default balanced auto allocation choice with 50% equity cap up to age 35.
                    </p>
                  </div>

                  <div 
                    onClick={() => setNpsAutoChoiceOption('LC-25')}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                      npsAutoChoiceOption === 'LC-25'
                        ? 'bg-blue-500/15 border-blue-500 shadow-md ring-2 ring-blue-500/30'
                        : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-blue-500/50'
                    }`}
                  >
                    <div className="font-extrabold text-sm text-[var(--text-primary)] flex items-center justify-between">
                      <span>LC-25 Conservative Lifecycle</span>
                      <span className="text-[10px] font-mono font-bold bg-blue-500/20 text-blue-600 px-2 py-0.5 rounded">
                        Max Equity 25%
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      Low-volatility conservative lifecycle fund capping equity at 25% for maximum capital protection.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* D-REMIT CONTRIBUTION MODAL */}
            {npsContribModalOpen && (
              <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
                  <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                    <h4 className="font-extrabold text-base text-[var(--text-primary)] flex items-center gap-2">
                      <Plus className="w-5 h-5 text-[var(--icici-orange)]" />
                      NPS D-Remit Contribution
                    </h4>
                    <button
                      onClick={() => setNpsContribModalOpen(false)}
                      className="p-1 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-[var(--text-primary)]">Select Target Tier Account</label>
                      <select
                        value={npsActiveTier}
                        onChange={(e) => setNpsActiveTier(e.target.value as any)}
                        className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-2.5 font-bold text-[var(--text-primary)]"
                      >
                        <option value="TIER_1">Tier-I Account (Tax-Saving Pension)</option>
                        <option value="TIER_2">Tier-II Account (Voluntary Liquid)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-[var(--text-primary)]">Contribution Amount (₹)</label>
                      <input
                        type="number"
                        min="500"
                        step="500"
                        value={npsContribAmountInput}
                        onChange={(e) => setNpsContribAmountInput(Number(e.target.value))}
                        className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-2.5 font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)]"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-200">
                      <strong>Same-Day NAV:</strong> Contributions received before 9:30 AM via D-Remit get same-day T+0 NAV allocation directly from Trustee Bank (Axis Bank NPS).
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => setNpsContribModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setNpsContribModalOpen(false);
                        setNpsContribSuccessMsg(true);
                        setTimeout(() => setNpsContribSuccessMsg(false), 4000);
                      }}
                      className="px-6 py-2 rounded-xl bg-[var(--icici-orange)] hover:bg-[var(--icici-orange-hover)] text-white text-xs font-extrabold shadow-md cursor-pointer transition-all"
                    >
                      PAY VIA UPI / D-REMIT
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* SECTION 11: LOANS & CREDIT */}
        {activeTabId === 'loans' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
              <div>
                <h3 className="text-lg font-extrabold flex items-center gap-2 text-[var(--text-primary)]">
                  <CreditCard className="w-5 h-5 text-[var(--icici-orange)]" />
                  Loan Against Shares (LAS) & Mutual Funds (LAMF)
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">Instant liquidity without selling portfolio stocks. Interest charged only on used limit.</p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/30">
                Instant Liquidity @ 9.5% p.a.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2.5">
                <h4 className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Loan Against Equity Shares
                </h4>
                <div className="text-2xl font-mono font-black text-[var(--text-primary)]">9.50% p.a.</div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">Pledge stocks without selling. Pay interest only on utilized amount.</p>
              </div>

              <div className="p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2.5">
                <h4 className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                  <PiggyBank className="w-4 h-4 text-blue-500" /> Loan Against Mutual Funds
                </h4>
                <div className="text-2xl font-mono font-black text-[var(--text-primary)]">9.25% p.a.</div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">Instant digital overdraft against equity and debt mutual fund folio units.</p>
              </div>

              <div className="p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2.5">
                <h4 className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" /> Pre-Approved Credit Line
                </h4>
                <div className="text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400">₹12,50,000</div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">Zero foreclosure charges & zero documentation for verified demat holders.</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-4">
              <h4 className="font-bold text-sm text-[var(--text-primary)]">Loan Against Shares Eligibility Calculator</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[var(--text-primary)]">Pledged Share Portfolio Value</label>
                  <input
                    type="number"
                    step="10000"
                    value={pledgeVal}
                    onChange={(e) => setPledgeVal(Number(e.target.value))}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2.5 font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--icici-orange)]"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-[var(--text-muted)] block">Eligible Overdraft Limit (80% LTV)</span>
                  <span className="font-mono font-extrabold text-lg text-emerald-600 dark:text-emerald-400">₹{(pledgeVal * 0.8).toLocaleString('en-IN')}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-[var(--text-muted)] block">Estimated Monthly Interest</span>
                  <span className="font-mono font-extrabold text-lg text-[var(--icici-orange)]">₹{Math.round((pledgeVal * 0.8 * 0.095) / 12).toLocaleString('en-IN')} / mo</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 10: FIXED DEPOSITS & BONDS */}
        {activeTabId === 'fd_bonds' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
              <div>
                <h3 className="text-lg font-extrabold flex items-center gap-2 text-[var(--text-primary)]">
                  <Landmark className="w-5 h-5 text-emerald-600" />
                  High Yield Fixed Deposits & Corporate Bonds
                </h3>
                <p className="text-xs text-[var(--text-muted)]">CRISIL AAA Rated FDs, Sovereign Govt Bonds, and High YTM Corporate NCDs</p>
              </div>

              <button
                onClick={handleRefreshFdData}
                disabled={isFdRefreshing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:border-[var(--icici-orange)] text-xs font-bold text-[var(--text-primary)] transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isFdRefreshing ? 'animate-spin' : ''}`} />
                <span>{isFdRefreshing ? 'Updating Live Rates...' : 'Refresh Yields & Interest Rates'}</span>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">({fdLastUpdated})</span>
              </button>
            </div>

            {fdInvestedMsg && (
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-bounce">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                {fdInvestedMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {fdList.map(fd => (
                <div key={fd.id} className="p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-[var(--text-primary)]">{fd.issuer}</h4>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                        {fd.type}
                      </span>
                    </div>
                    <span className="px-3 py-1 rounded font-mono font-extrabold text-xs bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      {fd.rating}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] font-bold block">Interest / Yield</span>
                      <span className="font-mono font-extrabold text-lg text-[var(--icici-orange)]">{fd.rate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] font-bold block">Tenure</span>
                      <span className="font-mono font-bold text-xs text-[var(--text-primary)]">{fd.tenure}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[var(--text-secondary)] font-medium">{fd.seniorBonus}</span>
                    <button
                      onClick={() => handleInvestFd(fd.issuer)}
                      className="px-4 py-2 rounded-xl bg-[var(--icici-orange)] hover:bg-[var(--icici-orange-hover)] text-white font-bold text-xs shadow-md cursor-pointer transition-all"
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
        {activeTabId === 'insurance' && (
          <div className="space-y-6">
            <div className="border-b border-[var(--border-color)] pb-4">
              <h3 className="text-lg font-extrabold flex items-center gap-2 text-[var(--text-primary)]">
                <ShieldAlert className="w-5 h-5 text-emerald-600" />
                Wealth Protection & Insurance Gateway
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">Institutional term life insurance, cashless family health cover, and demat fraud protection</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-3">
                <h4 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" /> Term Life Insurance
                </h4>
                <div className="text-xl font-mono font-extrabold text-[var(--text-primary)]">₹1 Crore Cover</div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">Starting @ ₹680/month. Tax exemption under Section 80C.</p>
                <button onClick={() => alert("Redirecting to Term Plan Quote...")} className="px-4 py-2 rounded-xl bg-[var(--icici-orange)] text-white text-xs font-bold cursor-pointer shadow-md">
                  Get Free Quote
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-3">
                <h4 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-rose-500" /> Family Health Insurance
                </h4>
                <div className="text-xl font-mono font-extrabold text-[var(--text-primary)]">₹10 Lakh Cover</div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">Cashless hospitalization in 10,000+ hospitals. Tax deduction u/s 80D.</p>
                <button onClick={() => alert("Redirecting to Health Plan Quote...")} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer shadow-md">
                  Explore Plans
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-3">
                <h4 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-500" /> Demat Cyber Fraud Shield
                </h4>
                <div className="text-xl font-mono font-extrabold text-[var(--text-primary)]">₹5 Lakh Coverage</div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">Protects demat account against unauthorized trades, phishing & OTP fraud.</p>
                <button onClick={() => alert("Cyber Fraud Shield Activated!")} className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold cursor-pointer shadow-md">
                  Activate @ ₹49/mo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 12: NPS PENSION */}
        {activeTabId === 'nps' && (
          <div className="space-y-6">
            <div className="border-b border-[var(--border-color)] pb-4">
              <h3 className="text-lg font-extrabold flex items-center gap-2 text-[var(--text-primary)]">
                <FileCheck className="w-5 h-5 text-amber-500" />
                National Pension System (NPS) Tier-I & Tier-II Portal
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">PFRDA regulated retirement wealth management with additional ₹50,000 tax deduction</p>
            </div>

            <div className="p-6 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-extrabold text-base text-[var(--text-primary)]">Save Additional ₹50,000 Tax u/s 80CCD(1B)</h4>
                  <p className="text-xs text-[var(--text-secondary)]">Over and above the ₹1.5 Lakh limit under Section 80C.</p>
                </div>
                <span className="px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono font-bold text-xs border border-amber-500/30">
                  10-Yr CAGR: 12.8%
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                  <span className="text-[var(--text-muted)] font-bold text-[10px] block uppercase">PRAN Pension Account</span>
                  <span className="font-mono font-bold text-sm text-[var(--text-primary)]">PRAN: 110184920184</span>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                  <span className="text-[var(--text-muted)] font-bold text-[10px] block uppercase">PFRDA Fund Manager</span>
                  <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">HDFC / ICICI Pru / SBI Pension</span>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                  <span className="text-[var(--text-muted)] font-bold text-[10px] block uppercase">Asset Mix</span>
                  <span className="font-mono font-bold text-xs text-[var(--text-primary)]">Equity 75% | Corp 15% | Govt 10%</span>
                </div>
              </div>

              <button onClick={() => alert("NPS Tier-I Contribution Portal Opened")} className="px-6 py-3 rounded-xl bg-[var(--icici-orange)] text-white text-xs font-extrabold shadow-md cursor-pointer hover:bg-[var(--icici-orange-hover)] transition-all">
                CONTRIBUTE TO NPS TIER-I
              </button>
            </div>
          </div>
        )}

        {/* SECTION 13: SMART TOOLS */}
        {activeTabId === 'smart_tools' && (
          <div className="space-y-6">
            <div className="border-b border-[var(--border-color)] pb-4">
              <h3 className="text-lg font-extrabold flex items-center gap-2 text-[var(--text-primary)]">
                <Zap className="w-5 h-5 text-amber-500" />
                ApexQuant Pro Smart Trading Tools
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">Option chain Greeks calculator, stock basket algorithms, and multi-asset quantitative tools</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-6 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-3">
                <h4 className="font-bold text-base text-[var(--icici-orange)] flex items-center gap-2">
                  <Sliders className="w-5 h-5" /> Option Chain & Greek Calculator
                </h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Compute implied volatility (IV), Delta, Gamma, Theta, and Vega for NIFTY, BANKNIFTY, and stock option strikes.
                </p>
                <button onClick={() => alert("Option Greeks Calculator Initialized")} className="px-4 py-2 rounded-xl bg-[var(--icici-orange)] text-white text-xs font-bold cursor-pointer shadow-md">
                  Open Option Chain Tool
                </button>
              </div>

              <div className="p-6 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-3">
                <h4 className="font-bold text-base text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" /> Stock Basket & Equity SIP
                </h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Create automated monthly SIP orders across diversified multi-asset stock baskets with automatic rebalancing.
                </p>
                <button onClick={() => alert("Equity SIP Creator Initialized")} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer shadow-md">
                  Create Stock Basket SIP
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 14: TAX & P&L REPORTS */}
        {activeTabId === 'reports' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
              <div>
                <h3 className="text-lg font-extrabold flex items-center gap-2 text-[var(--text-primary)]">
                  <FileText className="w-5 h-5 text-purple-500" />
                  Tax Statements & P&L Reports
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">Institutional capital gains statement (STCG/LTCG) and exportable ledger audit</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={exportReportCSV}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs border border-emerald-500/30 transition-all cursor-pointer shadow-xs"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  <span>Download Excel (CSV)</span>
                </button>
                <button
                  onClick={exportReportPDF}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600/15 hover:bg-rose-600/25 text-rose-600 dark:text-rose-400 font-extrabold text-xs border border-rose-500/30 transition-all cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4 text-rose-500" />
                  <span>Download PDF Report</span>
                </button>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-4">
              <h4 className="font-bold text-sm text-[var(--text-primary)]">FY 2025-26 Tax P&L Statement</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                  <span className="text-[var(--text-muted)] block text-[10px] font-bold uppercase">Short Term Capital Gains (STCG @ 20%)</span>
                  <span className="font-mono font-extrabold text-lg text-emerald-600 dark:text-emerald-400">+₹1,45,200.00</span>
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                  <span className="text-[var(--text-muted)] block text-[10px] font-bold uppercase">Long Term Capital Gains (LTCG @ 12.5%)</span>
                  <span className="font-mono font-extrabold text-lg text-emerald-600 dark:text-emerald-400">+₹4,85,000.00</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border border-purple-500/30 space-y-4">
              <div>
                <h4 className="font-extrabold text-sm text-[var(--text-primary)]">Download Instant Institutional Reports</h4>
                <p className="text-xs text-[var(--text-secondary)]">Export complete holdings, transaction history, and tax statements in Excel or PDF format.</p>
              </div>
              <div className="flex items-center gap-4 pt-1">
                <button
                  onClick={exportReportCSV}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Export Excel Spreadsheet (.csv)</span>
                </button>
                <button
                  onClick={exportReportPDF}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Institutional PDF Report (.pdf)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 15: SERVICES */}
        {activeTabId === 'services' && (
          <div className="space-y-6">
            <div className="border-b border-[var(--border-color)] pb-4">
              <h3 className="text-lg font-extrabold flex items-center gap-2 text-[var(--text-primary)]">
                <ShieldCheck className="w-5 h-5 text-blue-500" />
                Account Services & Corporate Actions
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">Linked bank account verification, CDSL depository profile, and regulatory KYC updates</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div className="p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
                <span className="font-bold text-sm text-[var(--text-primary)] block">Linked Bank Account</span>
                <span className="text-[var(--text-secondary)] font-mono block">HDFC Bank Ltd — A/C *******4821</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold block">Status: Verified & Active</span>
              </div>

              <div className="p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
                <span className="font-bold text-sm text-[var(--text-primary)] block">Demat DP Account ID</span>
                <span className="text-[var(--text-secondary)] font-mono block">CDSL DP ID: 1208160009482100</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold block">Status: CDSL Active</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradingConsolePage;
