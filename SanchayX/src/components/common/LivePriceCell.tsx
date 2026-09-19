import React, { memo } from 'react';
import { useFastTickCell } from '../trading/useFastTickCell';

export interface LivePriceCellProps {
  ticker: string;
  fallbackPrice?: number;
  initialPrice?: number;
  formatDecimals?: number;
  prefix?: string;
  className?: string;
  showChangeColor?: boolean;
}

export const LivePriceCell: React.FC<LivePriceCellProps> = memo(({
  ticker,
  fallbackPrice,
  initialPrice,
  formatDecimals = 2,
  prefix = '₹',
  className = '',
}) => {
  const seedPrice = initialPrice ?? fallbackPrice ?? 0;
  const { priceRef, containerRef } = useFastTickCell(ticker, formatDecimals);

  return (
    <span
      ref={containerRef}
      className={`inline-block px-1.5 py-0.5 rounded font-mono font-bold tabular-nums transition-colors duration-150 ${className}`}
    >
      <span className="text-[var(--text-muted)] text-[11px] font-sans mr-0.5">{prefix}</span>
      <span ref={priceRef} className="tabular-nums">
        {seedPrice > 0 ? seedPrice.toFixed(formatDecimals) : '---'}
      </span>
    </span>
  );
});

LivePriceCell.displayName = 'LivePriceCell';

