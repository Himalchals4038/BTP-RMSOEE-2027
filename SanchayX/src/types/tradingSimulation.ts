export type OrderAction = 'BUY' | 'SELL';
export type ProductType = 'Delivery (CNC)' | 'Intraday (MIS)' | 'F&O Options' | 'MTF Margin';
export type OrderType = 'Market Order' | 'Limit Order' | 'Stop-Loss (SL)' | 'SL-Market (SL-M)';
export type OrderStatus = 'EXECUTED' | 'PENDING' | 'CANCELLED' | 'REJECTED';

export interface StatutoryCharges {
  brokerage: number;
  stt: number;
  exchangeFee: number;
  sebiFee: number;
  stampDuty: number;
  gst: number;
  totalCharges: number;
}

export interface SimulatedOrder {
  id: string;
  time: string;
  ticker: string;
  name: string;
  action: OrderAction;
  product: ProductType;
  orderType: OrderType;
  qty: number;
  price: number;
  triggerPrice?: number;
  status: OrderStatus;
  rejectionReason?: string;
}

export interface SimulatedTrade {
  id: string;
  orderId: string;
  time: string;
  ticker: string;
  name: string;
  action: OrderAction;
  product: ProductType;
  qty: number;
  price: number;
  charges: StatutoryCharges;
  netValue: number;
}

export interface SimulatedPosition {
  ticker: string;
  name: string;
  product: ProductType;
  action: OrderAction;
  qty: number;
  avgBuyPrice: number;
  ltp: number;
  pnl: number;
  pnlPct: number;
  marginBlocked: number;
  status: 'OPEN' | 'CLOSED';
  isMarginCall?: boolean;
}

export interface DematHolding {
  ticker: string;
  name: string;
  category: 'Equity' | 'SGB' | 'Corporate Bond' | 'NCD';
  qty: number;
  avgCost: number;
  ltp: number;
  currentValue: number;
  investedValue: number;
  pnl: number;
  pnlPct: number;
  settlementStatus: 'T+1 Settlement' | 'Settled Demat';
  pledgedStatus: 'Unpledged' | 'Pledged (Collateral)';
  pledgedQty?: number;
  couponRatePct?: number;
  nextCouponDate?: string;
  accruedInterest?: number;
}

export interface UserWallet {
  availableMargin: number;
  usedMargin: number;
  cashBalance: number;
  autoSweepBalance: number;
  asbaBlockedLien: number;
  dematCollateral: number;
}

export interface IpoApplication {
  id: string;
  ipoId: string;
  ipoName: string;
  category: string;
  lotSize: number;
  shares: number;
  bidPrice: number;
  amountBlocked: number;
  status: 'BLOCKED_ASBA' | 'ALLOTTED' | 'REFUNDED_UNBLOCKED';
  applicationTime: string;
  gmp: string;
  allotmentDate: string;
  sharesAllotted?: number;
  listingGain?: number;
  subscriptionMultiple?: string;
}

export interface FamilyTaxProfile {
  id: string;
  memberName: string;
  relationship: 'Primary' | 'Spouse' | 'Parent' | 'Student Child (18+)' | 'Senior Citizen Grandparent';
  pan: string;
  taxSlabPct: number; // 0, 5, 20, 30
  isSeniorCitizen: boolean;
  eligible15G: boolean;
  eligible15H: boolean;
  allocatedBondPrincipal: number;
  annualInterestEarned: number;
  tdsSaved: number;
  formFiled: 'None' | 'Form 15G Submitted' | 'Form 15H Submitted';
}

export interface MarketDepthEntry {
  price: number;
  orders: number;
  qty: number;
  isUserOrder?: boolean;
}

export interface MarketDepth {
  symbol: string;
  bids: MarketDepthEntry[];
  asks: MarketDepthEntry[];
  totalBidQty: number;
  totalAskQty: number;
  ltp: number;
}

export interface PreTradeImpactAnalysis {
  orderValue: number;
  requiredMargin: number;
  charges: StatutoryCharges;
  totalDebitRequired: number;
  freeCashRemaining: number;
  collateralUtilizationPct: number;
  currentVaR95: number;
  projectedVaR95: number;
  currentSharpe: number;
  projectedSharpe: number;
  slippagePct: number;
  estimatedSlippageCost: number;
}
