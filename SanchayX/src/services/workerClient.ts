import type { Asset, FrontierPoint, CorrelationMatrixData, BacktestConfig, BacktestResult } from '../types/portfolio';
import type { HistoricalDataPoint } from '../services/mockData';
import { generateEfficientFrontier, computeCorrelationMatrix, runStrategyBacktest } from '../utils/financialMath';

let mathWorker: Worker | null = null;

function getMathWorker(): Worker | null {
  if (typeof window === 'undefined') return null;
  if (!mathWorker) {
    try {
      mathWorker = new Worker(
        new URL('../workers/portfolioMath.worker.ts', import.meta.url),
        { type: 'module' }
      );
    } catch (e) {
      console.warn('Web Worker initialization failed, falling back to main thread:', e);
      return null;
    }
  }
  return mathWorker;
}

export function calculateFrontierAsync(assets: Asset[], samples: number = 500): Promise<FrontierPoint[]> {
  return new Promise((resolve) => {
    const worker = getMathWorker();
    if (!worker) {
      // Fallback to main thread
      return resolve(generateEfficientFrontier(assets));
    }

    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'FRONTIER_RESULT') {
        worker.removeEventListener('message', handler);
        resolve(e.data.points);
      }
    };

    worker.addEventListener('message', handler);
    worker.postMessage({
      type: 'CALC_FRONTIER',
      payload: { assets, samples }
    });

    // Safety timeout fallback
    setTimeout(() => {
      worker.removeEventListener('message', handler);
      resolve(generateEfficientFrontier(assets));
    }, 3000);
  });
}

export function calculateCorrelationAsync(assets: Asset[]): Promise<CorrelationMatrixData> {
  return new Promise((resolve) => {
    const worker = getMathWorker();
    if (!worker) {
      return resolve(computeCorrelationMatrix(assets));
    }

    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'CORRELATION_RESULT') {
        worker.removeEventListener('message', handler);
        resolve(e.data.matrix);
      }
    };

    worker.addEventListener('message', handler);
    worker.postMessage({
      type: 'CALC_CORRELATION',
      payload: { assets }
    });

    setTimeout(() => {
      worker.removeEventListener('message', handler);
      resolve(computeCorrelationMatrix(assets));
    }, 2500);
  });
}

/**
 * Optimization 2: Offload 20-Year Historical Strategy Backtester to Web Worker
 * Offloads daily portfolio rebalances & drawdown simulations from main UI thread.
 */
export function runBacktestAsync(
  assets: Asset[],
  config: BacktestConfig,
  history: HistoricalDataPoint[]
): Promise<BacktestResult> {
  return new Promise((resolve) => {
    const worker = getMathWorker();
    if (!worker) {
      return resolve(runStrategyBacktest(assets, history, config));
    }

    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'BACKTEST_RESULT') {
        worker.removeEventListener('message', handler);
        resolve(e.data.result);
      }
    };

    worker.addEventListener('message', handler);
    worker.postMessage({
      type: 'RUN_BACKTEST',
      payload: { assets, history, config }
    });

    // Fallback if worker takes unexpectedly long
    setTimeout(() => {
      worker.removeEventListener('message', handler);
      resolve(runStrategyBacktest(assets, history, config));
    }, 4000);
  });
}

/**
 * Executes quantitative benchmark comparing WebAssembly vs JavaScript
 */
export function runWasmBenchmarkAsync(iterations: number = 10000): Promise<{
  wasmDurationMs: number;
  jsDurationMs: number;
  speedup: string;
  isWasmActive: boolean;
  iterations: number;
}> {
  return new Promise((resolve) => {
    const worker = getMathWorker();
    if (!worker) {
      // Fallback: import dynamic engine directly
      import('../wasm/wasmQuantEngine').then(({ runWasmBenchmark }) => {
        resolve(runWasmBenchmark(iterations));
      });
      return;
    }

    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'WASM_BENCHMARK_RESULT') {
        worker.removeEventListener('message', handler);
        resolve(e.data.result);
      }
    };

    worker.addEventListener('message', handler);
    worker.postMessage({
      type: 'RUN_WASM_BENCHMARK',
      payload: { iterations }
    });

    setTimeout(() => {
      worker.removeEventListener('message', handler);
      import('../wasm/wasmQuantEngine').then(({ runWasmBenchmark }) => {
        resolve(runWasmBenchmark(iterations));
      });
    }, 3000);
  });
}

