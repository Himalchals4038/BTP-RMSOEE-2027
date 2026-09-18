import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

export interface UseVirtualScrollOptions {
  totalItems: number;
  rowHeight: number;
  viewportHeight: number;
  overscan?: number;
}

/**
 * Custom hook implementing the SanchayX Table Virtualizer Pattern:
 * Mounted DOM Rows = (Viewport Height / Row Height) + 4 (Overscan Buffer)
 * Constant O(1) DOM footprint for 60 FPS rendering of 50,000+ rows.
 */
export function useVirtualScroll({
  totalItems,
  rowHeight,
  viewportHeight,
  overscan = 2
}: UseVirtualScrollOptions) {
  const [scrollTop, setScrollTop] = useState<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number | null>(null);

  const handleScroll = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    rafIdRef.current = requestAnimationFrame(() => {
      if (scrollRef.current) {
        setScrollTop(scrollRef.current.scrollTop);
      }
    });
  }, []);

  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  const { visibleStartIndex, visibleEndIndex, topPadding, bottomPadding } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const end = Math.min(totalItems, Math.ceil((scrollTop + viewportHeight) / rowHeight) + overscan);
    const top = start * rowHeight;
    const bottom = Math.max(0, (totalItems - end) * rowHeight);

    return {
      visibleStartIndex: start,
      visibleEndIndex: end,
      topPadding: top,
      bottomPadding: bottom
    };
  }, [scrollTop, totalItems, rowHeight, viewportHeight, overscan]);

  return {
    scrollRef,
    handleScroll,
    visibleStartIndex,
    visibleEndIndex,
    topPadding,
    bottomPadding,
    totalHeight: totalItems * rowHeight
  };
}

export interface VirtualTableProps<T> {
  items: T[];
  rowHeight?: number;
  viewportHeight?: number;
  overscan?: number;
  renderHeader: () => React.ReactNode;
  renderRow: (item: T, index: number) => React.ReactNode;
  emptyState?: React.ReactNode;
  className?: string;
  tableClassName?: string;
  keyExtractor: (item: T, index: number) => string | number;
}

/**
 * Windowed Virtual Table component for high-frequency ledgers
 * Replaces full physical HTML table mounting with virtualized O(1) DOM rows.
 */
export function VirtualTable<T>({
  items,
  rowHeight = 48,
  viewportHeight = 420,
  overscan = 2,
  renderHeader,
  renderRow,
  emptyState,
  className = '',
  tableClassName = 'fin-table',
  keyExtractor
}: VirtualTableProps<T>) {
  const totalItems = items.length;

  const {
    scrollRef,
    handleScroll,
    visibleStartIndex,
    visibleEndIndex,
    topPadding,
    bottomPadding
  } = useVirtualScroll({
    totalItems,
    rowHeight,
    viewportHeight,
    overscan
  });

  if (totalItems === 0) {
    return emptyState ? <>{emptyState}</> : null;
  }

  const visibleRows = items.slice(visibleStartIndex, visibleEndIndex);

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      style={{ maxHeight: `${viewportHeight}px`, height: `${viewportHeight}px` }}
      className={`overflow-x-auto overflow-y-auto w-full relative select-none-scroll ${className}`}
    >
      <table className={tableClassName}>
        <thead className="sticky top-0 z-20 bg-[var(--bg-tertiary)] shadow-xs">
          {renderHeader()}
        </thead>
        <tbody>
          {/* Top spacer for virtualized travel */}
          {topPadding > 0 && (
            <tr style={{ height: `${topPadding}px`, border: 'none', background: 'transparent' }}>
              <td colSpan={100} style={{ padding: 0, height: `${topPadding}px`, border: 'none' }} />
            </tr>
          )}

          {/* Visible DOM rows (typically 12 - 18 rows max) */}
          {visibleRows.map((item, idx) => {
            const actualIndex = visibleStartIndex + idx;
            return (
              <React.Fragment key={keyExtractor(item, actualIndex)}>
                {renderRow(item, actualIndex)}
              </React.Fragment>
            );
          })}

          {/* Bottom spacer for virtualized travel */}
          {bottomPadding > 0 && (
            <tr style={{ height: `${bottomPadding}px`, border: 'none', background: 'transparent' }}>
              <td colSpan={100} style={{ padding: 0, height: `${bottomPadding}px`, border: 'none' }} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
