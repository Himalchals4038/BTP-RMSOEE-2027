import React, { memo, useEffect, useRef, useState } from 'react';
import { useLiveTickerPrice } from '../../context/TradingSimulationContext';

interface LivePriceCellProps {
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
  showChangeColor = true
}) => {
  const tick = useLiveTickerPrice(ticker);
  const price = tick?.ltp ?? fallbackPrice ?? initialPrice ?? 0;
  const prevPriceRef = useRef<number>(price);
  const [flashClass, setFlashClass] = useState<string>('');

  useEffect(() => {
    if (showChangeColor && price !== prevPriceRef.current) {
      if (price > prevPriceRef.current) {
        setFlashClass('text-emerald-500 bg-emerald-500/10 transition-all duration-300');
      } else {
        setFlashClass('text-rose-500 bg-rose-500/10 transition-all duration-300');
      }
      prevPriceRef.current = price;

      const timer = setTimeout(() => {
        setFlashClass('');
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [price, showChangeColor]);

  return (
    <span className={`inline-block px-1.5 py-0.5 rounded font-mono font-bold ${flashClass || className}`}>
      {prefix}{price.toFixed(formatDecimals)}
    </span>
  );
});

LivePriceCell.displayName = 'LivePriceCell';
