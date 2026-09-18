import type { Asset, FrontierPoint, CorrelationMatrixData } from '../types/portfolio';
import { runStrategyBacktest } from '../utils/financialMath';

// Self-contained mathematical functions for worker thread
const RISK_FREE_RATE = 0.045; // 4.5% Risk-free rate

function computeSharpeRatio(expectedReturn: number, volatility: number): number {
  if (volatility <= 0) return 0;
  return (expectedReturn - RISK_FREE_RATE) / volatility;
}

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  if (type === 'CALC_FRONTIER') {
    const assets: Asset[] = payload.assets || [];
    const samples: number = payload.samples || 500;
    const activeAssets = assets.filter(a => a.weight > 0);
    const catalog = activeAssets.length >= 2 ? activeAssets : assets.slice(0, 8);

    const frontier: FrontierPoint[] = [];

    // Single asset baseline points
    catalog.forEach(a => {
      frontier.push({
        id: `asset_${a.ticker}`,
        name: `${a.ticker} (${a.name})`,
        return: Number(a.annualizedReturn.toFixed(2)),
        risk: Number(a.annualizedVol.toFixed(2)),
        sharpe: Number(computeSharpeRatio(a.annualizedReturn / 100, a.annualizedVol / 100).toFixed(2)),
        type: 'single_asset',
        weights: { [a.ticker]: 100 }
      });
    });

    // 500+ Monte Carlo samples
    for (let i = 0; i < samples; i++) {
      const rawWeights = catalog.map(() => Math.random());
      const sumRaw = rawWeights.reduce((a, b) => a + b, 0);
      const weights: Record<string, number> = {};

      let expectedRet = 0;
      let expectedVolSq = 0;

      catalog.forEach((a, idx) => {
        const w = (rawWeights[idx] / sumRaw);
        weights[a.ticker] = Number((w * 100).toFixed(1));
        expectedRet += w * (a.annualizedReturn / 100);
        expectedVolSq += (w * w) * Math.pow(a.annualizedVol / 100, 2);
      });

      // Diversification covariance term
      const diversificationBonus = Math.min(catalog.length * 0.0003, 0.0018);
      const expectedVol = Math.max(0.04, Math.sqrt(Math.max(0.0001, expectedVolSq - diversificationBonus)));

      const retPct = Number((expectedRet * 100).toFixed(2));
      const volPct = Number((expectedVol * 100).toFixed(2));
      const sharpe = Number(computeSharpeRatio(expectedRet, expectedVol).toFixed(2));

      frontier.push({
        id: `sim_${i}`,
        name: `Portfolio Simulation #${i + 1}`,
        return: retPct,
        risk: volPct,
        sharpe,
        type: 'simulated',
        weights
      });
    }

    // Identify Optimal Max Sharpe & Min Variance Portfolios
    const simulatedOnly = frontier.filter(p => p.type === 'simulated');
    if (simulatedOnly.length > 0) {
      const maxSharpe = simulatedOnly.reduce((max, p) => p.sharpe > max.sharpe ? p : max, simulatedOnly[0]);
      const minVar = simulatedOnly.reduce((min, p) => p.risk < min.risk ? p : min, simulatedOnly[0]);

      frontier.push({
        id: 'opt_max_sharpe',
        name: 'Max Sharpe Ratio Portfolio (Optimal Tangency)',
        return: maxSharpe.return,
        risk: maxSharpe.risk,
        sharpe: maxSharpe.sharpe,
        type: 'max_sharpe',
        weights: maxSharpe.weights
      });

      frontier.push({
        id: 'opt_min_var',
        name: 'Minimum Variance Portfolio (Lowest Volatility)',
        return: minVar.return,
        risk: minVar.risk,
        sharpe: minVar.sharpe,
        type: 'min_variance',
        weights: minVar.weights
      });
    }

    // Current User Portfolio
    const totalW = activeAssets.reduce((sum, a) => sum + a.weight, 0);
    if (totalW > 0) {
      let uRet = 0;
      let uVolSq = 0;
      const uWeights: Record<string, number> = {};

      activeAssets.forEach(a => {
        const w = a.weight / totalW;
        uWeights[a.ticker] = Number(a.weight.toFixed(1));
        uRet += w * (a.annualizedReturn / 100);
        uVolSq += (w * w) * Math.pow(a.annualizedVol / 100, 2);
      });

      const uVol = Math.sqrt(Math.max(0.0001, uVolSq));
      frontier.push({
        id: 'user_active_portfolio',
        name: 'Your Current Portfolio Allocation',
        return: Number((uRet * 100).toFixed(2)),
        risk: Number((uVol * 100).toFixed(2)),
        sharpe: Number(computeSharpeRatio(uRet, uVol).toFixed(2)),
        type: 'user_portfolio',
        weights: uWeights
      });
    }

    self.postMessage({ type: 'FRONTIER_RESULT', points: frontier });
  } else if (type === 'CALC_CORRELATION') {
    const assets: Asset[] = payload.assets || [];
    const activeAssets = assets.filter(a => a.weight > 0);
    const catalog = activeAssets.length >= 2 ? activeAssets : assets.slice(0, 6);
    const tickers = catalog.map(a => a.ticker);
    const n = tickers.length;

    const matrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(1.0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          matrix[i][j] = 1.0;
        } else {
          const catA = catalog[i].category;
          const catB = catalog[j].category;

          let corr = 0.45;
          if (catA === catB) corr = 0.72;
          if ((catA === 'Commodities' && catB === 'Bonds') || (catB === 'Commodities' && catA === 'Bonds')) corr = -0.15;
          if (catA === 'Forex' || catB === 'Forex') corr = 0.05;
          if (catalog[i].ticker.includes('GLD') || catalog[j].ticker.includes('GLD') || catalog[i].ticker.includes('SGB') || catalog[j].ticker.includes('SGB')) corr = -0.22;
          if (catalog[i].ticker.includes('10Y') || catalog[j].ticker.includes('10Y')) corr = -0.28;

          matrix[i][j] = Number(corr.toFixed(2));
        }
      }
    }

    const result: CorrelationMatrixData = {
      tickers,
      matrix
    };

    self.postMessage({ type: 'CORRELATION_RESULT', matrix: result });
  } else if (type === 'RUN_BACKTEST') {
    const { assets, history, config } = payload;
    const result = runStrategyBacktest(assets, history, config);
    self.postMessage({ type: 'BACKTEST_RESULT', result });
  }
};
