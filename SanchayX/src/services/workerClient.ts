import type { Asset, FrontierPoint, CorrelationMatrixData } from '../types/portfolio';
import { generateEfficientFrontier, computeCorrelationMatrix } from '../utils/financialMath';

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
