import React, { useEffect, useRef } from 'react';
import type { Level2MarketDepth } from '../../services/liveMarketService';

interface CanvasDepthQueueProps {
  depth: Level2MarketDepth;
  width?: number;
  height?: number;
}

/**
 * Pillar 5: HTML5 Canvas 2D Level-2 Order Book Depth Queue
 * Renders 5-depth bid/ask queues via GPU-accelerated draw calls.
 */
export const CanvasDepthQueue: React.FC<CanvasDepthQueueProps> = ({
  depth,
  width = 300,
  height = 140
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const maxBidQty = Math.max(...depth.bids.map(b => b.qty), 1);
    const maxAskQty = Math.max(...depth.asks.map(a => a.qty), 1);
    const maxQty = Math.max(maxBidQty, maxAskQty);

    const rowHeight = (height - 24) / 5;
    const halfWidth = width / 2;

    // Header labels
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#64748B';
    ctx.fillText('BIDS (BUY)', 8, 14);
    ctx.textAlign = 'right';
    ctx.fillText('ASKS (SELL)', width - 8, 14);
    ctx.textAlign = 'left';

    // Draw rows
    for (let i = 0; i < 5; i++) {
      const y = 22 + i * rowHeight;
      const bid = depth.bids[i];
      const ask = depth.asks[i];

      // Draw Bid (Left)
      if (bid) {
        const barWidth = (bid.qty / maxQty) * (halfWidth - 16);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
        ctx.fillRect(halfWidth - 8 - barWidth, y, barWidth, rowHeight - 2);

        ctx.font = '10px monospace';
        ctx.fillStyle = '#10B981';
        ctx.fillText(`₹${bid.price.toFixed(2)}`, 8, y + rowHeight - 6);

        ctx.fillStyle = '#94A3B8';
        ctx.textAlign = 'right';
        ctx.fillText(`${bid.qty}`, halfWidth - 12, y + rowHeight - 6);
        ctx.textAlign = 'left';
      }

      // Draw Ask (Right)
      if (ask) {
        const barWidth = (ask.qty / maxQty) * (halfWidth - 16);
        ctx.fillStyle = 'rgba(244, 63, 94, 0.15)';
        ctx.fillRect(halfWidth + 8, y, barWidth, rowHeight - 2);

        ctx.font = '10px monospace';
        ctx.fillStyle = '#CBD5E1';
        ctx.fillText(`${ask.qty}`, halfWidth + 12, y + rowHeight - 6);

        ctx.fillStyle = '#F43F5E';
        ctx.textAlign = 'right';
        ctx.fillText(`₹${ask.price.toFixed(2)}`, width - 8, y + rowHeight - 6);
        ctx.textAlign = 'left';
      }
    }
  }, [depth, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: `${width}px`, height: `${height}px` }}
      className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)]"
    />
  );
};

export default CanvasDepthQueue;
