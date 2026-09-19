import React, { memo } from 'react';
import { useFastTickCell } from './useFastTickCell';

export interface LivePriceCellProps {
  ticker: string;
  initialPrice?: number;
  formatDecimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  showChange?: boolean;
}

/**
 * Institutional 5 Hz Zero-Reconciliation Live Price Cell
 * Directly mutates inner TextNodes on 200ms ticks without causing React component re-renders.
 */
export const LivePriceCell: React.FC<LivePriceCellProps> = memo(({
  ticker,
  initialPrice,
  formatDecimals = 2,
  prefix = '₹',
  suffix = '',
  className = '',
  showChange = false
}) => {
  const { priceRef, changeRef, containerRef } = useFastTickCell(ticker, formatDecimals);

  return (
    <div
      ref={containerRef}
      className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded font-mono font-bold tabular-nums transition-colors duration-150 ${className}`}
    >
      <span className="text-[var(--text-muted)] text-[11px] font-sans">{prefix}</span>
      <span ref={priceRef} className="tabular-nums">
        {initialPrice !== undefined ? initialPrice.toFixed(formatDecimals) : '---'}
      </span>
      {suffix && <span className="text-[var(--text-muted)] text-[11px] font-sans">{suffix}</span>}
      {showChange && (
        <span ref={changeRef} className="text-[11px] tabular-nums font-semibold ml-1">
          --
        </span>
      )}
    </div>
  );
});

LivePriceCell.displayName = 'LivePriceCell';
export default LivePriceCell;
