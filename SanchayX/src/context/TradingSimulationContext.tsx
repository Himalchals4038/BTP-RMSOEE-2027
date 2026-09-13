import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { usePortfolio } from './PortfolioContext';
import {
  subscribeToLiveTicks,
  getAllLatestTicks,
  getLatestTick,
  getLevel2MarketDepth,
  type LiveTick,
  type Level2MarketDepth
} from '../services/liveMarketService';
import { calculateStatutoryCharges } from '../utils/exportUtils';
import type {
  OrderAction,
  ProductType,
  OrderType,
  SimulatedOrder,
  SimulatedTrade,
  SimulatedPosition,
  DematHolding,
  UserWallet,
  IpoApplication,
  FamilyTaxProfile,
  PreTradeImpactAnalysis
} from '../types/tradingSimulation';

interface PlaceOrderParams {
  ticker: string;
  name?: string;
  action: OrderAction;
  product: ProductType;
  orderType: OrderType;
  qty: number;
  price: number;
  triggerPrice?: number;
}

interface TradingSimulationContextType {
  wallet: UserWallet;
  orders: SimulatedOrder[];
  trades: SimulatedTrade[];
  positions: SimulatedPosition[];
  dematHoldings: DematHolding[];
  ipoApplications: IpoApplication[];
  familyTaxProfiles: FamilyTaxProfile[];
  liveTicks: Record<string, LiveTick>;
  totalNetWorth: number;
  totalHoldingsValue: number;
  totalInvestedValue: number;
  totalUnrealizedPnl: number;
  totalRealizedPnl: number;
  totalMtmPnl: number;
  hasMarginCall: boolean;
  marketDepth: (symbol: string, currentLtp?: number) => Level2MarketDepth;
  placeOrder: (params: PlaceOrderParams) => { success: boolean; message: string; orderId?: string };
  squareOffPosition: (ticker: string) => { success: boolean; message: string };
  cancelOrder: (orderId: string) => { success: boolean; message: string };
  addFunds: (amount: number, paymentMethod?: string) => void;
  pledgeShares: (ticker: string, qty: number) => { success: boolean; message: string };
  unpledgeShares: (ticker: string, qty: number) => { success: boolean; message: string };
  buySgbTranche: (grams: number, trancheSymbol?: string) => { success: boolean; message: string };
  investCorporateBond: (bondName: string, amount: number, couponRatePct: number, isin?: string) => { success: boolean; message: string };
  applyIpoAsba: (ipo: { id: string; name: string; category: string; price: number; lotSize: number; gmp: string; subMultiple: string }) => { success: boolean; message: string };
  runIpoAllotmentLottery: (applicationId: string) => { allotted: boolean; shares: number; message: string };
  preTradeAnalyze: (params: PlaceOrderParams) => PreTradeImpactAnalysis;
  updateFamilyProfile: (profile: FamilyTaxProfile) => void;
  executeRebalanceBasket: (rebalanceOrders: { ticker: string; name: string; action: OrderAction; qty: number; price: number }[]) => { executedCount: number; message: string };
  triggerCorporateAction: (type: 'DIVIDEND' | 'COUPON', ticker: string, amount: number) => void;
  resetAccountData: () => void;
}

const TradingSimulationContext = createContext<TradingSimulationContextType | undefined>(undefined);

// Initial Default State Generators per Account Type
function getInitialLedgerForUser(userId: string, accountType: string) {
  if (accountType === 'Institutional Prime' || userId.includes('INST')) {
    return {
      wallet: {
        availableMargin: 2500000,
        usedMargin: 252800,
        cashBalance: 1500000,
        autoSweepBalance: 1000000,
        asbaBlockedLien: 0,
        dematCollateral: 500000
      },
      positions: [
        {
          ticker: 'RELIANCE.NS',
          name: 'Reliance Industries',
          product: 'Intraday (MIS)' as ProductType,
          action: 'BUY' as OrderAction,
          qty: 200,
          avgBuyPrice: 2420.00,
          ltp: 2450.50,
          pnl: 6100,
          pnlPct: 1.26,
          marginBlocked: 96800,
          status: 'OPEN' as const
        },
        {
          ticker: 'NIFTY 24500 CE',
          name: 'NIFTY 28 Aug Call Option',
          product: 'F&O Options' as ProductType,
          action: 'BUY' as OrderAction,
          qty: 150,
          avgBuyPrice: 120.00,
          ltp: 135.00,
          pnl: 2250,
          pnlPct: 12.50,
          marginBlocked: 18000,
          status: 'OPEN' as const
        },
        {
          ticker: 'HDFCBANK.NS',
          name: 'HDFC Bank Ltd',
          product: 'MTF Margin' as ProductType,
          action: 'BUY' as OrderAction,
          qty: 300,
          avgBuyPrice: 1610.00,
          ltp: 1625.00,
          pnl: 4500,
          pnlPct: 0.93,
          marginBlocked: 138000,
          status: 'OPEN' as const
        }
      ],
      orders: [
        { id: 'ORD-89210', time: '14:22:05', ticker: 'RELIANCE.NS', name: 'Reliance Industries', action: 'BUY' as OrderAction, product: 'Delivery (CNC)' as ProductType, orderType: 'Limit Order' as OrderType, qty: 100, price: 2450.00, status: 'EXECUTED' as const },
        { id: 'ORD-89209', time: '14:10:12', ticker: 'TATAMOTORS.NS', name: 'Tata Motors', action: 'BUY' as OrderAction, product: 'Intraday (MIS)' as ProductType, orderType: 'Limit Order' as OrderType, qty: 250, price: 980.50, status: 'PENDING' as const },
        { id: 'ORD-89208', time: '12:45:30', ticker: 'NIFTY 24500 CE', name: 'NIFTY 24500 Call', action: 'BUY' as OrderAction, product: 'F&O Options' as ProductType, orderType: 'Market Order' as OrderType, qty: 150, price: 120.00, status: 'EXECUTED' as const }
      ],
      trades: [
        {
          id: 'TRD-55102',
          orderId: 'ORD-89210',
          time: '14:22:05',
          ticker: 'RELIANCE.NS',
          name: 'Reliance Industries',
          action: 'BUY' as OrderAction,
          product: 'Delivery (CNC)' as ProductType,
          qty: 100,
          price: 2450.00,
          charges: { brokerage: 0, stt: 245.00, exchangeFee: 8.45, sebiFee: 0.25, stampDuty: 36.75, gst: 1.57, totalCharges: 292.02 },
          netValue: 245292.02
        },
        {
          id: 'TRD-55101',
          orderId: 'ORD-89208',
          time: '12:45:30',
          ticker: 'NIFTY 24500 CE',
          name: 'NIFTY 24500 Call',
          action: 'BUY' as OrderAction,
          product: 'F&O Options' as ProductType,
          qty: 150,
          price: 120.00,
          charges: { brokerage: 20.00, stt: 0, exchangeFee: 0.62, sebiFee: 0.02, stampDuty: 0.54, gst: 3.72, totalCharges: 24.90 },
          netValue: 18024.90
        }
      ],
      dematHoldings: [
        { ticker: 'RELIANCE.NS', name: 'Reliance Industries', category: 'Equity' as const, qty: 150, avgCost: 2100, ltp: 2450.50, currentValue: 367575, investedValue: 315000, pnl: 52575, pnlPct: 16.69, settlementStatus: 'Settled Demat' as const, pledgedStatus: 'Unpledged' as const },
        { ticker: 'HDFCBANK.NS', name: 'HDFC Bank Ltd', category: 'Equity' as const, qty: 250, avgCost: 1450, ltp: 1625.00, currentValue: 406250, investedValue: 362500, pnl: 43750, pnlPct: 12.07, settlementStatus: 'Settled Demat' as const, pledgedStatus: 'Pledged (Collateral)' as const, pledgedQty: 250 },
        { ticker: 'TCS.NS', name: 'Tata Consultancy Services', category: 'Equity' as const, qty: 80, avgCost: 3600, ltp: 4150.00, currentValue: 332000, investedValue: 288000, pnl: 44000, pnlPct: 15.28, settlementStatus: 'Settled Demat' as const, pledgedStatus: 'Unpledged' as const },
        { ticker: 'ICICIBANK.NS', name: 'ICICI Bank Ltd', category: 'Equity' as const, qty: 350, avgCost: 920, ltp: 1180.00, currentValue: 413000, investedValue: 322000, pnl: 91000, pnlPct: 28.26, settlementStatus: 'Settled Demat' as const, pledgedStatus: 'Unpledged' as const },
        { ticker: 'SGB2708', name: 'SGB 2019-20 Series V', category: 'SGB' as const, qty: 15, avgCost: 6800, ltp: 7245.00, currentValue: 108675, investedValue: 102000, pnl: 6675, pnlPct: 6.54, settlementStatus: 'Settled Demat' as const, pledgedStatus: 'Unpledged' as const, couponRatePct: 2.50, nextCouponDate: '28 Aug 2026', accruedInterest: 1275 }
      ],
      ipoApplications: [] as IpoApplication[],
      familyTaxProfiles: [
        { id: 'fam-1', memberName: 'Suresh Mehta (Self)', relationship: 'Primary' as const, pan: 'ABCDE1234F', taxSlabPct: 30, isSeniorCitizen: false, eligible15G: false, eligible15H: false, allocatedBondPrincipal: 200000, annualInterestEarned: 18400, tdsSaved: 0, formFiled: 'None' as const },
        { id: 'fam-2', memberName: 'Aarav Mehta (Student Child 19y)', relationship: 'Student Child (18+)' as const, pan: 'PQRST9876M', taxSlabPct: 0, isSeniorCitizen: false, eligible15G: true, eligible15H: false, allocatedBondPrincipal: 350000, annualInterestEarned: 38500, tdsSaved: 3850, formFiled: 'Form 15G Submitted' as const },
        { id: 'fam-3', memberName: 'Ramniklal Mehta (Grandparent 72y)', relationship: 'Senior Citizen Grandparent' as const, pan: 'XYZAB5678K', taxSlabPct: 0, isSeniorCitizen: true, eligible15G: false, eligible15H: true, allocatedBondPrincipal: 500000, annualInterestEarned: 56000, tdsSaved: 5600, formFiled: 'Form 15H Submitted' as const }
      ]
    };
  } else if (accountType === 'Retail HNI' || userId.includes('HNI')) {
    return {
      wallet: {
        availableMargin: 500000,
        usedMargin: 60000,
        cashBalance: 350000,
        autoSweepBalance: 150000,
        asbaBlockedLien: 0,
        dematCollateral: 120000
      },
      positions: [
        {
          ticker: 'INFY.NS',
          name: 'Infosys Limited',
          product: 'Intraday (MIS)' as ProductType,
          action: 'BUY' as OrderAction,
          qty: 100,
          avgBuyPrice: 1820.00,
          ltp: 1810.00,
          pnl: -1000,
          pnlPct: -0.55,
          marginBlocked: 36400,
          status: 'OPEN' as const
        }
      ],
      orders: [
        { id: 'ORD-77102', time: '10:05:15', ticker: 'INFY.NS', name: 'Infosys Limited', action: 'BUY' as OrderAction, product: 'Intraday (MIS)' as ProductType, orderType: 'Market Order' as OrderType, qty: 100, price: 1820.00, status: 'EXECUTED' as const }
      ],
      trades: [
        {
          id: 'TRD-44091',
          orderId: 'ORD-77102',
          time: '10:05:15',
          ticker: 'INFY.NS',
          name: 'Infosys Limited',
          action: 'BUY' as OrderAction,
          product: 'Intraday (MIS)' as ProductType,
          qty: 100,
          price: 1820.00,
          charges: { brokerage: 20.00, stt: 0, exchangeFee: 6.28, sebiFee: 0.18, stampDuty: 5.46, gst: 4.76, totalCharges: 36.68 },
          netValue: 182036.68
        }
      ],
      dematHoldings: [
        { ticker: 'INFY.NS', name: 'Infosys Limited', category: 'Equity' as const, qty: 100, avgCost: 1750, ltp: 1810.00, currentValue: 181000, investedValue: 175000, pnl: 6000, pnlPct: 3.43, settlementStatus: 'Settled Demat' as const, pledgedStatus: 'Unpledged' as const },
        { ticker: 'SGB2807', name: 'SGB 2020-21 Series IV', category: 'SGB' as const, qty: 10, avgCost: 7100, ltp: 7280.00, currentValue: 72800, investedValue: 71000, pnl: 1800, pnlPct: 2.54, settlementStatus: 'Settled Demat' as const, pledgedStatus: 'Unpledged' as const, couponRatePct: 2.50, nextCouponDate: '15 Sep 2026', accruedInterest: 750 },
        { ticker: 'Shriram Finance 8.80%', name: 'Shriram Finance Senior NCD', category: 'Corporate Bond' as const, qty: 50, avgCost: 1000, ltp: 1000.00, currentValue: 50000, investedValue: 50000, pnl: 0, pnlPct: 0.00, settlementStatus: 'Settled Demat' as const, pledgedStatus: 'Unpledged' as const, couponRatePct: 8.80, nextCouponDate: '01 Oct 2026', accruedInterest: 1466 }
      ],
      ipoApplications: [] as IpoApplication[],
      familyTaxProfiles: [
        { id: 'fam-1', memberName: 'Suresh Mehta (Self)', relationship: 'Primary' as const, pan: 'ABCDE1234F', taxSlabPct: 30, isSeniorCitizen: false, eligible15G: false, eligible15H: false, allocatedBondPrincipal: 200000, annualInterestEarned: 18400, tdsSaved: 0, formFiled: 'None' as const },
        { id: 'fam-2', memberName: 'Aarav Mehta (Student Child)', relationship: 'Student Child (18+)' as const, pan: 'PQRST9876M', taxSlabPct: 0, isSeniorCitizen: false, eligible15G: true, eligible15H: false, allocatedBondPrincipal: 300000, annualInterestEarned: 33000, tdsSaved: 3300, formFiled: 'Form 15G Submitted' as const }
      ]
    };
  } else {
    // Sandbox Demo
    return {
      wallet: {
        availableMargin: 100000,
        usedMargin: 0,
        cashBalance: 100000,
        autoSweepBalance: 0,
        asbaBlockedLien: 0,
        dematCollateral: 0
      },
      positions: [] as SimulatedPosition[],
      orders: [] as SimulatedOrder[],
      trades: [] as SimulatedTrade[],
      dematHoldings: [] as DematHolding[],
      ipoApplications: [] as IpoApplication[],
      familyTaxProfiles: [
        { id: 'fam-1', memberName: 'Sandbox Trader', relationship: 'Primary' as const, pan: 'SBXDE9999P', taxSlabPct: 0, isSeniorCitizen: false, eligible15G: true, eligible15H: false, allocatedBondPrincipal: 100000, annualInterestEarned: 11000, tdsSaved: 1100, formFiled: 'Form 15G Submitted' as const }
      ]
    };
  }
}

export const TradingSimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = usePortfolio();
  const storageKey = `sanchayx_ledger_${currentUser.id || 'default'}`;

  // Core Simulation State initialized from persistent storage per User ID
  const [ledger, setLedger] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return getInitialLedgerForUser(currentUser.id, currentUser.accountType);
  });

  // Re-sync when currentUser changes (User Account Isolation & Switching)
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setLedger(JSON.parse(saved));
        return;
      } catch {
        // fallback
      }
    }
    setLedger(getInitialLedgerForUser(currentUser.id, currentUser.accountType));
  }, [currentUser.id, currentUser.accountType, storageKey]);

  // Persist ledger state on changes
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(ledger));
  }, [ledger, storageKey]);

  // Live Market Ticks Stream
  const [liveTicks, setLiveTicks] = useState<Record<string, LiveTick>>(getAllLatestTicks);

  // Auto-sweep daily micro return simulation (7.1% p.a. liquid overnight interest)
  useEffect(() => {
    const sweepInterval = setInterval(() => {
      setLedger((prev: typeof ledger) => {
        if (prev.wallet.autoSweepBalance <= 0) return prev;
        // 7.1% p.a. continuous simulated accrual
        const interestPerSecond = (prev.wallet.autoSweepBalance * 0.071) / (365 * 24 * 3600);
        return {
          ...prev,
          wallet: {
            ...prev.wallet,
            cashBalance: Number((prev.wallet.cashBalance + interestPerSecond).toFixed(4)),
            availableMargin: Number((prev.wallet.availableMargin + interestPerSecond).toFixed(4))
          }
        };
      });
    }, 5000);

    return () => clearInterval(sweepInterval);
  }, []);

  // Subscribe to live tick engine and update positions MTM & Demat Holdings valuation
  useEffect(() => {
    const unsubscribe = subscribeToLiveTicks((ticks) => {
      setLiveTicks(ticks);

      setLedger((prev: typeof ledger) => {
        let hasChanges = false;

        // 1. Update Open Positions MTM
        const updatedPositions = prev.positions.map((pos: SimulatedPosition) => {
          if (pos.status === 'CLOSED') return pos;
          const tick = ticks[pos.ticker];
          if (!tick) return pos;

          const currentLtp = tick.ltp;
          const priceDiff = (currentLtp - pos.avgBuyPrice) * (pos.action === 'SELL' ? -1 : 1);
          const pnl = Number((priceDiff * pos.qty).toFixed(2));
          const pnlPct = Number(((priceDiff / pos.avgBuyPrice) * 100).toFixed(2));
          const isMarginCall = pos.marginBlocked > 0 && pnl < -0.80 * pos.marginBlocked;

          if (pos.ltp !== currentLtp || pos.pnl !== pnl || pos.isMarginCall !== isMarginCall) {
            hasChanges = true;
            return {
              ...pos,
              ltp: currentLtp,
              pnl,
              pnlPct,
              isMarginCall
            };
          }
          return pos;
        });

        // 2. Update Demat Holdings live valuation
        const updatedHoldings = prev.dematHoldings.map((h: DematHolding) => {
          const tick = ticks[h.ticker];
          if (!tick) return h;

          const currentLtp = tick.ltp;
          const currentValue = Number((currentLtp * h.qty).toFixed(2));
          const pnl = Number((currentValue - h.investedValue).toFixed(2));
          const pnlPct = h.investedValue > 0 ? Number(((pnl / h.investedValue) * 100).toFixed(2)) : 0;

          // Increment accrued interest on bonds/SGBs
          let accruedInterest = h.accruedInterest || 0;
          if (h.couponRatePct && h.couponRatePct > 0) {
            accruedInterest += Number(((h.investedValue * (h.couponRatePct / 100)) / (365 * 24 * 3600)).toFixed(5));
          }

          if (h.ltp !== currentLtp || h.currentValue !== currentValue) {
            hasChanges = true;
            return {
              ...h,
              ltp: currentLtp,
              currentValue,
              pnl,
              pnlPct,
              accruedInterest: Number(accruedInterest.toFixed(2))
            };
          }
          return h;
        });

        // 3. Process Pending Limit Orders Queue
        let updatedWallet = { ...prev.wallet };
        const newTrades: SimulatedTrade[] = [];
        const updatedOrders = prev.orders.map((ord: SimulatedOrder) => {
          if (ord.status !== 'PENDING') return ord;
          const tick = ticks[ord.ticker];
          if (!tick) return ord;

          const shouldFill = ord.action === 'BUY'
            ? tick.ltp <= ord.price
            : tick.ltp >= ord.price;

          if (shouldFill) {
            hasChanges = true;
            const charges = calculateStatutoryCharges(ord.qty * ord.price, ord.action, ord.product);
            const netVal = ord.action === 'BUY'
              ? (ord.qty * ord.price) + charges.totalCharges
              : (ord.qty * ord.price) - charges.totalCharges;

            const tradeId = `TRD-${Math.floor(10000 + Math.random() * 90000)}`;
            newTrades.push({
              id: tradeId,
              orderId: ord.id,
              time: new Date().toLocaleTimeString(),
              ticker: ord.ticker,
              name: ord.name,
              action: ord.action,
              product: ord.product,
              qty: ord.qty,
              price: ord.price,
              charges,
              netValue: Number(netVal.toFixed(2))
            });

            // Adjust positions or holdings
            if (ord.product.includes('CNC') || ord.product.includes('Delivery')) {
              const existingIdx = updatedHoldings.findIndex((h: DematHolding) => h.ticker === ord.ticker);
              if (existingIdx >= 0) {
                const ex = updatedHoldings[existingIdx];
                const totalQ = ex.qty + ord.qty;
                const newAvg = (ex.avgCost * ex.qty + ord.price * ord.qty) / totalQ;
                updatedHoldings[existingIdx] = {
                  ...ex,
                  qty: totalQ,
                  avgCost: Number(newAvg.toFixed(2)),
                  investedValue: Number((newAvg * totalQ).toFixed(2)),
                  currentValue: Number((tick.ltp * totalQ).toFixed(2))
                };
              } else {
                updatedHoldings.push({
                  ticker: ord.ticker,
                  name: ord.name,
                  category: 'Equity',
                  qty: ord.qty,
                  avgCost: ord.price,
                  ltp: tick.ltp,
                  currentValue: ord.qty * tick.ltp,
                  investedValue: ord.qty * ord.price,
                  pnl: 0,
                  pnlPct: 0,
                  settlementStatus: 'T+1 Settlement',
                  pledgedStatus: 'Unpledged'
                });
              }
            }

            return {
              ...ord,
              status: 'EXECUTED' as const
            };
          }
          return ord;
        });

        if (!hasChanges) return prev;

        return {
          ...prev,
          wallet: updatedWallet,
          positions: updatedPositions,
          dematHoldings: updatedHoldings,
          orders: updatedOrders,
          trades: [...newTrades, ...prev.trades]
        };
      });
    });

    return unsubscribe;
  }, []);

  // Compute Aggregate Portfolio Net Worth & P&L
  const totalHoldingsValue = useMemo(() => {
    return ledger.dematHoldings.reduce((sum: number, h: DematHolding) => sum + h.currentValue, 0);
  }, [ledger.dematHoldings]);

  const totalInvestedValue = useMemo(() => {
    return ledger.dematHoldings.reduce((sum: number, h: DematHolding) => sum + h.investedValue, 0);
  }, [ledger.dematHoldings]);

  const totalUnrealizedPnl = useMemo(() => {
    return totalHoldingsValue - totalInvestedValue;
  }, [totalHoldingsValue, totalInvestedValue]);

  const totalMtmPnl = useMemo(() => {
    return ledger.positions
      .filter((p: SimulatedPosition) => p.status === 'OPEN')
      .reduce((sum: number, p: SimulatedPosition) => sum + p.pnl, 0);
  }, [ledger.positions]);

  const totalRealizedPnl = useMemo(() => {
    return ledger.trades
      .filter((t: SimulatedTrade) => t.action === 'SELL')
      .reduce((sum: number, t: SimulatedTrade) => sum + (t.netValue - (t.qty * t.price)), 0);
  }, [ledger.trades]);

  const totalNetWorth = useMemo(() => {
    return Number((
      ledger.wallet.cashBalance +
      ledger.wallet.autoSweepBalance +
      ledger.wallet.asbaBlockedLien +
      totalHoldingsValue +
      totalMtmPnl
    ).toFixed(2));
  }, [ledger.wallet, totalHoldingsValue, totalMtmPnl]);

  const hasMarginCall = useMemo(() => {
    return ledger.positions.some((p: SimulatedPosition) => p.status === 'OPEN' && p.isMarginCall);
  }, [ledger.positions]);

  // Market Depth helper
  const marketDepth = useCallback((symbol: string, currentLtp?: number) => {
    const userPendingOrders = ledger.orders
      .filter((o: SimulatedOrder) => o.ticker === symbol && o.status === 'PENDING')
      .map((o: SimulatedOrder) => ({ price: o.price, qty: o.qty, action: o.action }));
    return getLevel2MarketDepth(symbol, currentLtp, userPendingOrders);
  }, [ledger.orders]);

  // Place Order Simulation Core
  const placeOrder = useCallback((params: PlaceOrderParams) => {
    const tick = getLatestTick(params.ticker);
    const executionPrice = params.orderType === 'Market Order' ? (tick?.ltp || params.price) : params.price;
    const orderValue = params.qty * executionPrice;
    const charges = calculateStatutoryCharges(orderValue, params.action, params.product);

    // Calculate required margin
    let requiredMargin = orderValue;
    if (params.product.includes('Intraday') || params.product.includes('MIS')) {
      requiredMargin = orderValue * 0.20; // 5x leverage = 20% margin
    } else if (params.product.includes('MTF')) {
      requiredMargin = orderValue / 3.5; // 3.5x leverage
    } else if (params.product.includes('F&O')) {
      requiredMargin = orderValue; // Options Buy requires 100% premium
    }

    const totalDebitRequired = requiredMargin + charges.totalCharges;

    // Check available margin
    if (ledger.wallet.availableMargin < totalDebitRequired) {
      return {
        success: false,
        message: `Insufficient Margin. Required: ₹${totalDebitRequired.toLocaleString('en-IN', { maximumFractionDigits: 2 })}, Available: ₹${ledger.wallet.availableMargin.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
      };
    }

    const orderId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
    const tradeId = `TRD-${Math.floor(10000 + Math.random() * 90000)}`;
    const isInstantFill = params.orderType === 'Market Order' ||
      (params.action === 'BUY' && params.price >= (tick?.ltp || params.price)) ||
      (params.action === 'SELL' && params.price <= (tick?.ltp || params.price));

    const newOrder: SimulatedOrder = {
      id: orderId,
      time: new Date().toLocaleTimeString(),
      ticker: params.ticker,
      name: params.name || tick?.name || params.ticker,
      action: params.action,
      product: params.product,
      orderType: params.orderType,
      qty: params.qty,
      price: executionPrice,
      triggerPrice: params.triggerPrice,
      status: isInstantFill ? 'EXECUTED' : 'PENDING'
    };

    setLedger((prev: typeof ledger) => {
      let nextWallet = { ...prev.wallet };
      let nextHoldings = [...prev.dematHoldings];
      let nextPositions = [...prev.positions];
      let nextTrades = [...prev.trades];

      if (isInstantFill) {
        // Record executed trade
        const netValue = params.action === 'BUY'
          ? orderValue + charges.totalCharges
          : orderValue - charges.totalCharges;

        const newTrade: SimulatedTrade = {
          id: tradeId,
          orderId,
          time: new Date().toLocaleTimeString(),
          ticker: params.ticker,
          name: newOrder.name,
          action: params.action,
          product: params.product,
          qty: params.qty,
          price: executionPrice,
          charges,
          netValue: Number(netValue.toFixed(2))
        };
        nextTrades = [newTrade, ...nextTrades];

        if (params.product.includes('Delivery') || params.product.includes('CNC')) {
          // CNC Delivery Execution: debits available cash & credits Demat
          nextWallet.availableMargin = Number((nextWallet.availableMargin - totalDebitRequired).toFixed(2));
          nextWallet.cashBalance = Number((nextWallet.cashBalance - totalDebitRequired).toFixed(2));

          const existingIdx = nextHoldings.findIndex(h => h.ticker === params.ticker);
          if (existingIdx >= 0) {
            const ex = nextHoldings[existingIdx];
            const totalQ = ex.qty + params.qty;
            const newAvg = (ex.avgCost * ex.qty + executionPrice * params.qty) / totalQ;
            nextHoldings[existingIdx] = {
              ...ex,
              qty: totalQ,
              avgCost: Number(newAvg.toFixed(2)),
              investedValue: Number((newAvg * totalQ).toFixed(2)),
              currentValue: Number((executionPrice * totalQ).toFixed(2)),
              settlementStatus: 'T+1 Settlement'
            };
          } else {
            nextHoldings.push({
              ticker: params.ticker,
              name: newOrder.name,
              category: 'Equity',
              qty: params.qty,
              avgCost: executionPrice,
              ltp: executionPrice,
              currentValue: orderValue,
              investedValue: orderValue,
              pnl: 0,
              pnlPct: 0,
              settlementStatus: 'T+1 Settlement',
              pledgedStatus: 'Unpledged'
            });
          }
        } else {
          // MIS / F&O / MTF Execution: Blocks margin & Enters Open Positions
          nextWallet.availableMargin = Number((nextWallet.availableMargin - totalDebitRequired).toFixed(2));
          nextWallet.usedMargin = Number((nextWallet.usedMargin + requiredMargin).toFixed(2));

          const existingPosIdx = nextPositions.findIndex(p => p.ticker === params.ticker && p.status === 'OPEN');
          if (existingPosIdx >= 0) {
            const ep = nextPositions[existingPosIdx];
            const totalQ = ep.qty + params.qty;
            const newAvg = (ep.avgBuyPrice * ep.qty + executionPrice * params.qty) / totalQ;
            nextPositions[existingPosIdx] = {
              ...ep,
              qty: totalQ,
              avgBuyPrice: Number(newAvg.toFixed(2)),
              marginBlocked: Number((ep.marginBlocked + requiredMargin).toFixed(2))
            };
          } else {
            nextPositions.push({
              ticker: params.ticker,
              name: newOrder.name,
              product: params.product,
              action: params.action,
              qty: params.qty,
              avgBuyPrice: executionPrice,
              ltp: executionPrice,
              pnl: 0,
              pnlPct: 0,
              marginBlocked: Number(requiredMargin.toFixed(2)),
              status: 'OPEN'
            });
          }
        }
      } else {
        // Pending Limit Order: Reserve required margin
        nextWallet.availableMargin = Number((nextWallet.availableMargin - totalDebitRequired).toFixed(2));
        nextWallet.usedMargin = Number((nextWallet.usedMargin + requiredMargin).toFixed(2));
      }

      return {
        ...prev,
        wallet: nextWallet,
        orders: [newOrder, ...prev.orders],
        trades: nextTrades,
        positions: nextPositions,
        dematHoldings: nextHoldings
      };
    });

    return {
      success: true,
      message: isInstantFill
        ? `Order ${orderId} filled instantly at ₹${executionPrice.toLocaleString('en-IN')}`
        : `Limit Order ${orderId} queued in exchange depth ladder at ₹${executionPrice.toLocaleString('en-IN')}`,
      orderId
    };
  }, [ledger.wallet.availableMargin]);

  // Square Off Position
  const squareOffPosition = useCallback((ticker: string) => {
    const position = ledger.positions.find((p: SimulatedPosition) => p.ticker === ticker && p.status === 'OPEN');
    if (!position) {
      return { success: false, message: 'No open position found for symbol' };
    }

    const tick = getLatestTick(ticker);
    const exitPrice = tick?.ltp || position.ltp;
    const orderValue = position.qty * exitPrice;
    const charges = calculateStatutoryCharges(orderValue, position.action === 'BUY' ? 'SELL' : 'BUY', position.product);

    // Calculate gross and net realized P&L
    const grossPnl = (exitPrice - position.avgBuyPrice) * position.qty * (position.action === 'SELL' ? -1 : 1);
    const netRealizedPnl = Number((grossPnl - charges.totalCharges).toFixed(2));

    const tradeId = `TRD-${Math.floor(10000 + Math.random() * 90000)}`;
    const closingTrade: SimulatedTrade = {
      id: tradeId,
      orderId: `ORD-SQ-${Math.floor(1000 + Math.random() * 9000)}`,
      time: new Date().toLocaleTimeString(),
      ticker: position.ticker,
      name: position.name,
      action: position.action === 'BUY' ? 'SELL' : 'BUY',
      product: position.product,
      qty: position.qty,
      price: exitPrice,
      charges,
      netValue: Number((orderValue - charges.totalCharges).toFixed(2))
    };

    setLedger((prev: typeof ledger) => {
      // Release blocked margin and credit/debit realized P&L to cash balance
      const newAvailable = Number((prev.wallet.availableMargin + position.marginBlocked + netRealizedPnl).toFixed(2));
      const newUsed = Number(Math.max(0, prev.wallet.usedMargin - position.marginBlocked).toFixed(2));
      const newCash = Number((prev.wallet.cashBalance + netRealizedPnl).toFixed(2));

      return {
        ...prev,
        wallet: {
          ...prev.wallet,
          availableMargin: newAvailable,
          usedMargin: newUsed,
          cashBalance: newCash
        },
        positions: prev.positions.filter((p: SimulatedPosition) => p.ticker !== ticker),
        trades: [closingTrade, ...prev.trades]
      };
    });

    return {
      success: true,
      message: `Squared off ${ticker} at ₹${exitPrice}. Realized Net P&L: ₹${netRealizedPnl >= 0 ? '+' : ''}${netRealizedPnl.toLocaleString('en-IN')}`
    };
  }, [ledger.positions]);

  // Cancel Pending Limit Order
  const cancelOrder = useCallback((orderId: string) => {
    const order = ledger.orders.find((o: SimulatedOrder) => o.id === orderId && o.status === 'PENDING');
    if (!order) {
      return { success: false, message: 'Order not found or already executed' };
    }

    setLedger((prev: typeof ledger) => {
      // Calculate reserved margin to release
      let reservedMargin = order.qty * order.price;
      if (order.product.includes('MIS') || order.product.includes('Intraday')) {
        reservedMargin = reservedMargin * 0.20;
      }
      const charges = calculateStatutoryCharges(order.qty * order.price, order.action, order.product);
      const totalRefund = reservedMargin + charges.totalCharges;

      return {
        ...prev,
        wallet: {
          ...prev.wallet,
          availableMargin: Number((prev.wallet.availableMargin + totalRefund).toFixed(2)),
          usedMargin: Number(Math.max(0, prev.wallet.usedMargin - reservedMargin).toFixed(2))
        },
        orders: prev.orders.map((o: SimulatedOrder) => o.id === orderId ? { ...o, status: 'CANCELLED' as const } : o)
      };
    });

    return { success: true, message: `Cancelled Order ${orderId}. Margin released.` };
  }, [ledger.orders]);

  // Add Funds via UPI / Netbanking
  const addFunds = useCallback((amount: number) => {
    if (amount <= 0) return;
    setLedger((prev: typeof ledger) => ({
      ...prev,
      wallet: {
        ...prev.wallet,
        cashBalance: Number((prev.wallet.cashBalance + amount).toFixed(2)),
        availableMargin: Number((prev.wallet.availableMargin + amount).toFixed(2))
      }
    }));
  }, []);

  // Pledge Demat shares for instant trading margin (with official 20% haircut)
  const pledgeShares = useCallback((ticker: string, qty: number) => {
    const holding = ledger.dematHoldings.find((h: DematHolding) => h.ticker === ticker);
    if (!holding || holding.qty < qty) {
      return { success: false, message: 'Insufficient shares available in demat to pledge' };
    }

    const tick = getLatestTick(ticker);
    const ltp = tick?.ltp || holding.ltp;
    // 20% haircut = 80% collateral margin generated
    const collateralValue = Number((qty * ltp * 0.80).toFixed(2));

    setLedger((prev: typeof ledger) => ({
      ...prev,
      wallet: {
        ...prev.wallet,
        dematCollateral: Number((prev.wallet.dematCollateral + collateralValue).toFixed(2)),
        availableMargin: Number((prev.wallet.availableMargin + collateralValue).toFixed(2))
      },
      dematHoldings: prev.dematHoldings.map((h: DematHolding) => {
        if (h.ticker === ticker) {
          const currentPledged = h.pledgedQty || 0;
          return {
            ...h,
            pledgedStatus: 'Pledged (Collateral)' as const,
            pledgedQty: currentPledged + qty
          };
        }
        return h;
      })
    }));

    return {
      success: true,
      message: `Pledged ${qty} shares of ${ticker} with 20% haircut. Instant collateral created: +₹${collateralValue.toLocaleString('en-IN')}`
    };
  }, [ledger.dematHoldings]);

  // Unpledge shares
  const unpledgeShares = useCallback((ticker: string, qty: number) => {
    const holding = ledger.dematHoldings.find((h: DematHolding) => h.ticker === ticker);
    if (!holding || (holding.pledgedQty || 0) < qty) {
      return { success: false, message: 'Shares are not pledged' };
    }

    const tick = getLatestTick(ticker);
    const ltp = tick?.ltp || holding.ltp;
    const collateralToRemove = Number((qty * ltp * 0.80).toFixed(2));

    if (ledger.wallet.availableMargin < collateralToRemove) {
      return { success: false, message: 'Cannot unpledge: margin currently utilized in open positions' };
    }

    setLedger((prev: typeof ledger) => ({
      ...prev,
      wallet: {
        ...prev.wallet,
        dematCollateral: Number(Math.max(0, prev.wallet.dematCollateral - collateralToRemove).toFixed(2)),
        availableMargin: Number((prev.wallet.availableMargin - collateralToRemove).toFixed(2))
      },
      dematHoldings: prev.dematHoldings.map((h: DematHolding) => {
        if (h.ticker === ticker) {
          const rem = (h.pledgedQty || 0) - qty;
          return {
            ...h,
            pledgedQty: rem,
            pledgedStatus: rem > 0 ? 'Pledged (Collateral)' : 'Unpledged'
          };
        }
        return h;
      })
    }));

    return { success: true, message: `Unpledged ${qty} shares of ${ticker}.` };
  }, [ledger.dematHoldings, ledger.wallet.availableMargin]);

  // Buy SGB Tranche
  const buySgbTranche = useCallback((grams: number, trancheSymbol?: string) => {
    const symbol = trancheSymbol || 'SGB-RBI-2026';
    const ratePerGram = 7195; // Official SGB rate with ₹50/g discount
    const totalCost = grams * ratePerGram;

    if (ledger.wallet.availableMargin < totalCost) {
      return { success: false, message: `Insufficient cash. Required: ₹${totalCost.toLocaleString('en-IN')}` };
    }

    setLedger((prev: typeof ledger) => {
      const existingIdx = prev.dematHoldings.findIndex((h: DematHolding) => h.ticker === symbol);
      let nextHoldings = [...prev.dematHoldings];

      if (existingIdx >= 0) {
        const ex = nextHoldings[existingIdx];
        const newQ = ex.qty + grams;
        nextHoldings[existingIdx] = {
          ...ex,
          qty: newQ,
          investedValue: ex.investedValue + totalCost,
          currentValue: newQ * ratePerGram
        };
      } else {
        nextHoldings.push({
          ticker: symbol,
          name: 'RBI Sovereign Gold Bond (2.5% Tax-Free)',
          category: 'SGB',
          qty: grams,
          avgCost: ratePerGram,
          ltp: ratePerGram,
          currentValue: totalCost,
          investedValue: totalCost,
          pnl: 0,
          pnlPct: 0,
          settlementStatus: 'Settled Demat',
          pledgedStatus: 'Unpledged',
          couponRatePct: 2.50,
          nextCouponDate: '15 Sep 2026',
          accruedInterest: 0
        });
      }

      return {
        ...prev,
        wallet: {
          ...prev.wallet,
          availableMargin: Number((prev.wallet.availableMargin - totalCost).toFixed(2)),
          cashBalance: Number((prev.wallet.cashBalance - totalCost).toFixed(2))
        },
        dematHoldings: nextHoldings
      };
    });

    return {
      success: true,
      message: `Subscribed to ${grams}g Sovereign Gold Bonds for ₹${totalCost.toLocaleString('en-IN')}. Added to Demat statement with 2.5% tax-free coupon schedule.`
    };
  }, [ledger.wallet.availableMargin]);

  // Invest in Corporate Bond (NCD)
  const investCorporateBond = useCallback((bondName: string, amount: number, couponRatePct: number, isin?: string) => {
    if (ledger.wallet.availableMargin < amount) {
      return { success: false, message: `Insufficient cash balance. Required: ₹${amount.toLocaleString('en-IN')}` };
    }

    setLedger((prev: typeof ledger) => {
      const ticker = isin || bondName;
      const existingIdx = prev.dematHoldings.findIndex((h: DematHolding) => h.ticker === ticker);
      let nextHoldings = [...prev.dematHoldings];

      if (existingIdx >= 0) {
        const ex = nextHoldings[existingIdx];
        nextHoldings[existingIdx] = {
          ...ex,
          investedValue: ex.investedValue + amount,
          currentValue: ex.currentValue + amount,
          qty: ex.qty + Math.floor(amount / 1000)
        };
      } else {
        nextHoldings.push({
          ticker,
          name: bondName,
          category: 'Corporate Bond',
          qty: Math.floor(amount / 1000),
          avgCost: 1000,
          ltp: 1000,
          currentValue: amount,
          investedValue: amount,
          pnl: 0,
          pnlPct: 0,
          settlementStatus: 'Settled Demat',
          pledgedStatus: 'Unpledged',
          couponRatePct,
          nextCouponDate: '01 Nov 2026',
          accruedInterest: 0
        });
      }

      return {
        ...prev,
        wallet: {
          ...prev.wallet,
          availableMargin: Number((prev.wallet.availableMargin - amount).toFixed(2)),
          cashBalance: Number((prev.wallet.cashBalance - amount).toFixed(2))
        },
        dematHoldings: nextHoldings
      };
    });

    return {
      success: true,
      message: `Invested ₹${amount.toLocaleString('en-IN')} in ${bondName} @ ${couponRatePct}% p.a. Bond credited to Demat statement. Accrued interest counter started.`
    };
  }, [ledger.wallet.availableMargin]);

  // Apply IPO via ASBA (Funds blocked under lien)
  const applyIpoAsba = useCallback((ipo: { id: string; name: string; category: string; price: number; lotSize: number; gmp: string; subMultiple: string }) => {
    const blockAmount = ipo.price * ipo.lotSize;

    if (ledger.wallet.availableMargin < blockAmount) {
      return { success: false, message: `Insufficient funds to block ASBA lien. Required: ₹${blockAmount.toLocaleString('en-IN')}` };
    }

    const newApp: IpoApplication = {
      id: `ASBA-${Math.floor(100000 + Math.random() * 900000)}`,
      ipoId: ipo.id,
      ipoName: ipo.name,
      category: ipo.category,
      lotSize: 1,
      shares: ipo.lotSize,
      bidPrice: ipo.price,
      amountBlocked: blockAmount,
      status: 'BLOCKED_ASBA',
      applicationTime: new Date().toLocaleDateString('en-IN'),
      gmp: ipo.gmp,
      allotmentDate: '24 Aug 2026',
      subscriptionMultiple: ipo.subMultiple
    };

    setLedger((prev: typeof ledger) => ({
      ...prev,
      wallet: {
        ...prev.wallet,
        availableMargin: Number((prev.wallet.availableMargin - blockAmount).toFixed(2)),
        asbaBlockedLien: Number((prev.wallet.asbaBlockedLien + blockAmount).toFixed(2))
      },
      ipoApplications: [newApp, ...prev.ipoApplications]
    }));

    return {
      success: true,
      message: `ASBA Bid Submitted for ${ipo.name}! ₹${blockAmount.toLocaleString('en-IN')} successfully placed in Blocked Lien status in Savings Bank.`
    };
  }, [ledger.wallet.availableMargin]);

  // Monte Carlo Allotment Lottery Draw
  const runIpoAllotmentLottery = useCallback((applicationId: string) => {
    const app = ledger.ipoApplications.find((a: IpoApplication) => a.id === applicationId);
    if (!app || app.status !== 'BLOCKED_ASBA') {
      return { allotted: false, shares: 0, message: 'Application not found or already finalized' };
    }

    // Determine allotment probability based on subscription multiple
    const subNum = parseFloat(app.subscriptionMultiple || '15') || 15;
    const probability = Math.min(0.85, 1.0 / Math.max(1, subNum * 0.1));
    const isAllotted = Math.random() < probability;

    setLedger((prev: typeof ledger) => {
      let nextWallet = { ...prev.wallet };
      let nextHoldings = [...prev.dematHoldings];

      if (isAllotted) {
        // Debits ASBA lien permanently and credits shares to Demat with opening listing gains from GMP
        nextWallet.asbaBlockedLien = Number((nextWallet.asbaBlockedLien - app.amountBlocked).toFixed(2));
        nextWallet.cashBalance = Number((nextWallet.cashBalance - app.amountBlocked).toFixed(2));

        const gmpNum = parseFloat(app.gmp.replace(/[^0-9.]/g, '')) || 25;
        const listingPrice = app.bidPrice + gmpNum;

        nextHoldings.push({
          ticker: `${app.ipoName.split(' ')[0].toUpperCase()}.NS`,
          name: `${app.ipoName} (IPO Allotment)`,
          category: 'Equity',
          qty: app.shares,
          avgCost: app.bidPrice,
          ltp: listingPrice,
          currentValue: app.shares * listingPrice,
          investedValue: app.amountBlocked,
          pnl: app.shares * gmpNum,
          pnlPct: Number(((gmpNum / app.bidPrice) * 100).toFixed(2)),
          settlementStatus: 'Settled Demat',
          pledgedStatus: 'Unpledged'
        });
      } else {
        // Unallotted: Lien is unblocked instantly back into available cash!
        nextWallet.asbaBlockedLien = Number((nextWallet.asbaBlockedLien - app.amountBlocked).toFixed(2));
        nextWallet.availableMargin = Number((nextWallet.availableMargin + app.amountBlocked).toFixed(2));
      }

      const updatedApps = prev.ipoApplications.map((a: IpoApplication) => {
        if (a.id === applicationId) {
          return {
            ...a,
            status: (isAllotted ? 'ALLOTTED' : 'REFUNDED_UNBLOCKED') as 'ALLOTTED' | 'REFUNDED_UNBLOCKED',
            sharesAllotted: isAllotted ? a.shares : 0
          };
        }
        return a;
      });

      return {
        ...prev,
        wallet: nextWallet,
        dematHoldings: nextHoldings,
        ipoApplications: updatedApps
      };
    });

    if (isAllotted) {
      return {
        allotted: true,
        shares: app.shares,
        message: `🎉 Congratulations! Allotted ${app.shares} shares of ${app.ipoName}. Credited to Demat statement with GMP gains.`
      };
    } else {
      return {
        allotted: false,
        shares: 0,
        message: `Lottery Draw Completed: Application ${app.id} not allotted. Lien of ₹${app.amountBlocked.toLocaleString('en-IN')} unblocked to Available Margin.`
      };
    }
  }, [ledger.ipoApplications]);

  // Pre-Trade Impact Analysis (Innovation 2)
  const preTradeAnalyze = useCallback((params: PlaceOrderParams): PreTradeImpactAnalysis => {
    const tick = getLatestTick(params.ticker);
    const executionPrice = params.orderType === 'Market Order' ? (tick?.ltp || params.price) : params.price;
    const orderValue = params.qty * executionPrice;
    const charges = calculateStatutoryCharges(orderValue, params.action, params.product);

    let requiredMargin = orderValue;
    if (params.product.includes('Intraday') || params.product.includes('MIS')) {
      requiredMargin = orderValue * 0.20;
    } else if (params.product.includes('MTF')) {
      requiredMargin = orderValue / 3.5;
    }

    const totalDebitRequired = requiredMargin + charges.totalCharges;
    const freeCashRemaining = Math.max(0, ledger.wallet.availableMargin - totalDebitRequired);
    const collateralUtilizationPct = Number(((ledger.wallet.usedMargin + requiredMargin) / Math.max(1, ledger.wallet.availableMargin + ledger.wallet.usedMargin) * 100).toFixed(1));

    // Simulated shift in risk metrics
    const currentVaR95 = 14.2;
    const isLeveraged = params.product.includes('MIS') || params.product.includes('F&O');
    const projectedVaR95 = Number((currentVaR95 + (isLeveraged ? 1.4 : 0.4)).toFixed(2));
    const currentSharpe = 1.45;
    const projectedSharpe = Number((currentSharpe + (params.action === 'BUY' ? 0.05 : -0.04)).toFixed(2));

    const slippagePct = orderValue > 500000 ? 0.12 : 0.04;
    const estimatedSlippageCost = Number((orderValue * (slippagePct / 100)).toFixed(2));

    return {
      orderValue,
      requiredMargin,
      charges,
      totalDebitRequired,
      freeCashRemaining,
      collateralUtilizationPct,
      currentVaR95,
      projectedVaR95,
      currentSharpe,
      projectedSharpe,
      slippagePct,
      estimatedSlippageCost
    };
  }, [ledger.wallet]);

  // Zero-TDS Family Profile Update (Innovation 4)
  const updateFamilyProfile = useCallback((profile: FamilyTaxProfile) => {
    setLedger((prev: typeof ledger) => ({
      ...prev,
      familyTaxProfiles: prev.familyTaxProfiles.map((f: FamilyTaxProfile) => f.id === profile.id ? profile : f)
    }));
  }, []);

  // Autonomous Quant Rebalancing Batch Execution (Innovation 7)
  const executeRebalanceBasket = useCallback((rebalanceOrders: { ticker: string; name: string; action: OrderAction; qty: number; price: number }[]) => {
    let count = 0;
    rebalanceOrders.forEach(order => {
      placeOrder({
        ticker: order.ticker,
        name: order.name,
        action: order.action,
        product: 'Delivery (CNC)',
        orderType: 'Market Order',
        qty: order.qty,
        price: order.price
      });
      count++;
    });

    return {
      executedCount: count,
      message: `Batch Rebalance Completed: ${count} orders executed to re-align portfolio to Markowitz optimal weights.`
    };
  }, [placeOrder]);

  // Corporate Actions & Yield Distribution Simulator (Innovation 6)
  const triggerCorporateAction = useCallback((_type: 'DIVIDEND' | 'COUPON', _ticker: string, amount: number) => {
    setLedger((prev: typeof ledger) => ({
      ...prev,
      wallet: {
        ...prev.wallet,
        cashBalance: Number((prev.wallet.cashBalance + amount).toFixed(2)),
        availableMargin: Number((prev.wallet.availableMargin + amount).toFixed(2))
      }
    }));
  }, []);

  // Reset Account Data to factory defaults
  const resetAccountData = useCallback(() => {
    const initial = getInitialLedgerForUser(currentUser.id, currentUser.accountType);
    setLedger(initial);
    localStorage.setItem(storageKey, JSON.stringify(initial));
  }, [currentUser.id, currentUser.accountType, storageKey]);

  return (
    <TradingSimulationContext.Provider
      value={{
        wallet: ledger.wallet,
        orders: ledger.orders,
        trades: ledger.trades,
        positions: ledger.positions,
        dematHoldings: ledger.dematHoldings,
        ipoApplications: ledger.ipoApplications,
        familyTaxProfiles: ledger.familyTaxProfiles,
        liveTicks,
        totalNetWorth,
        totalHoldingsValue,
        totalInvestedValue,
        totalUnrealizedPnl,
        totalRealizedPnl,
        totalMtmPnl,
        hasMarginCall,
        marketDepth,
        placeOrder,
        squareOffPosition,
        cancelOrder,
        addFunds,
        pledgeShares,
        unpledgeShares,
        buySgbTranche,
        investCorporateBond,
        applyIpoAsba,
        runIpoAllotmentLottery,
        preTradeAnalyze,
        updateFamilyProfile,
        executeRebalanceBasket,
        triggerCorporateAction,
        resetAccountData
      }}
    >
      {children}
    </TradingSimulationContext.Provider>
  );
};

export const useTradingSimulation = () => {
  const context = useContext(TradingSimulationContext);
  if (!context) {
    throw new Error('useTradingSimulation must be used within a TradingSimulationProvider');
  }
  return context;
};
