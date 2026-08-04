export type AssetCategory = 'Equities' | 'ETFs' | 'Crypto' | 'Forex' | 'Commodities' | 'Bonds';

export interface Asset {
  id: string;
  ticker: string;
  name: string;
  category: AssetCategory;
  market: string;
  price: number;
  change24h: number;
  change24hAmount: number;
  annualizedReturn: number;
  annualizedVol: number;
  beta: number;
  weight: number; // 0 - 100 percentage
  isLocked?: boolean;
  color: string;
  currency: '$' | '₹';
}

export interface KRIMetrics {
  totalValue: number;
  totalGainLoss24h: number;
  totalGainLoss24hPct: number;
  sharpeRatio: number;
  sortinoRatio: number;
  var95Historical: number;
  var95Parametric: number;
  var99Historical: number;
  var99Parametric: number;
  maxDrawdown: number;
  portfolioBeta: number;
  portfolioAlpha: number;
  evaluationBadge: 'Poor' | 'Moderate' | 'Good' | 'Excellent';
}

export interface PortfolioConstraints {
  volatilityCap: number;
  maxCryptoExposure: number;
  minEquityExposure: number;
  riskMode: 'Conservative' | 'Balanced' | 'Aggressive' | 'Custom Volatility';
}

export interface FrontierPoint {
  id: string;
  name: string;
  return: number;
  risk: number;
  sharpe: number;
  type: 'simulated' | 'max_sharpe' | 'min_variance' | 'user_portfolio' | 'single_asset';
  weights?: Record<string, number>;
}

export interface CorrelationMatrixData {
  tickers: string[];
  matrix: number[][];
}

export interface BacktestConfig {
  startDate: string;
  endDate: string;
  initialCapital: number;
  monthlyContribution: number;
  rebalanceStrategy: 'none' | 'monthly' | 'quarterly' | 'annual' | 'drift5';
  benchmark: 'SP500' | 'NIFTY50';
}

export interface EquityCurvePoint {
  date: string;
  portfolioValue: number;
  benchmarkValue: number;
  drawdown: number;
  benchmarkDrawdown: number;
}

export interface RebalanceTrade {
  id: string;
  date: string;
  assetTicker: string;
  assetName: string;
  action: 'BUY' | 'SELL';
  amount: number;
  targetWeight: number;
  driftWeight: number;
  estimatedCost: number;
}

export interface BacktestResult {
  equityCurve: EquityCurvePoint[];
  trades: RebalanceTrade[];
  cagr: number;
  benchmarkCagr: number;
  maxDrawdown: number;
  benchmarkMaxDrawdown: number;
  sharpeRatio: number;
  totalRebalances: number;
  totalTurnoverCost: number;
  finalValue: number;
  finalBenchmarkValue: number;
  totalInvested: number;
}
