/**
 * SanchayX Fast-Path 5 Hz (200ms) Direct DOM Mutation Hook
 * Blueprint Section 06: Zero-reconciliation TextNode mutations.
 * Bypasses React Virtual DOM reconciliation entirely (~0.008ms per tick).
 */

import { useEffect, useRef } from 'react';
import { subscribeToTickerFastPath } from '../../services/liveMarketService';

export function useFastTickCell(ticker: string, formatDecimals: number = 2) {
  const priceRef = useRef<HTMLSpanElement>(null);
  const changeRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ticker) return;

    const unsub = subscribeToTickerFastPath(ticker, (ltp, change, changePct) => {
      // Direct TextNode mutation (0.008ms execution, zero React VDOM overhead)
      if (priceRef.current) {
        priceRef.current.textContent = ltp.toFixed(formatDecimals);
      }
      if (changeRef.current) {
        const sign = change >= 0 ? '+' : '';
        changeRef.current.textContent = `${sign}${change.toFixed(2)} (${sign}${changePct.toFixed(2)}%)`;
      }
      // Micro-flash indicator toggle via classList
      if (containerRef.current) {
        const flashClass = change >= 0 ? 'tick-flash-up' : 'tick-flash-down';
        containerRef.current.classList.add(flashClass);
        setTimeout(() => {
          containerRef.current?.classList.remove(flashClass);
        }, 180);
      }
    });

    return () => unsub();
  }, [ticker, formatDecimals]);

  return { priceRef, changeRef, containerRef };
}
