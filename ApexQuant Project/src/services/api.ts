import type { Asset, KRIMetrics, FrontierPoint, CorrelationMatrixData, BacktestConfig, BacktestResult } from '../types/portfolio';
import { INITIAL_ASSET_CATALOG, generateHistoricalPrices, type HistoricalDataPoint } from './mockData';
import { computeKRIMetrics, optimizeWeights, generateEfficientFrontier, computeCorrelationMatrix, runStrategyBacktest } from '../utils/financialMath';

let isLiveApiMode = false;
let historicalDataCache: HistoricalDataPoint[] | null = null;

export function getHistoricalPrices(): HistoricalDataPoint[] {
  if (!historicalDataCache) {
    historicalDataCache = generateHistoricalPrices();
  }
  return historicalDataCache;
}

export function setApiMode(liveMode: boolean) {
  isLiveApiMode = liveMode;
}

export function getApiMode(): boolean {
  return isLiveApiMode;
}

// Service API wrapper calls
export const PortfolioApiService = {
  // Fetch asset catalog with optional live endpoint emulation
  async getAssets(): Promise<Asset[]> {
    if (isLiveApiMode) {
      await new Promise(res => setTimeout(res, 600));
    }
    return [...INITIAL_ASSET_CATALOG];
  },

  // Calculate or fetch KRIs
  async getKRIMetrics(assets: Asset[], benchmark: string = 'SP500'): Promise<KRIMetrics> {
    if (isLiveApiMode) {
      await new Promise(res => setTimeout(res, 300));
    }
    const history = getHistoricalPrices();
    return computeKRIMetrics(assets, history, benchmark);
  },

  // Trigger quantitative optimization
  async optimizePortfolio(
    assets: Asset[],
    mode: 'max_sharpe' | 'min_variance' | 'equal_weight' | 'risk_parity'
  ): Promise<Record<string, number>> {
    if (isLiveApiMode) {
      await new Promise(res => setTimeout(res, 400));
    }
    return optimizeWeights(assets, mode);
  },

  // Generate Efficient Frontier scatter plot data
  async getEfficientFrontier(assets: Asset[]): Promise<FrontierPoint[]> {
    if (isLiveApiMode) {
      await new Promise(res => setTimeout(res, 500));
    }
    return generateEfficientFrontier(assets);
  },

  // Compute Cross-Asset Correlation Matrix
  async getCorrelationMatrix(assets: Asset[]): Promise<CorrelationMatrixData> {
    if (isLiveApiMode) {
      await new Promise(res => setTimeout(res, 300));
    }
    return computeCorrelationMatrix(assets);
  },

  // Run Strategy Backtest simulator
  async runBacktest(assets: Asset[], config: BacktestConfig): Promise<BacktestResult> {
    if (isLiveApiMode) {
      await new Promise(res => setTimeout(res, 700));
    }
    const history = getHistoricalPrices();
    return runStrategyBacktest(assets, history, config);
  }
};
