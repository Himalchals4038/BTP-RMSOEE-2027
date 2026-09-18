import React, { useState } from 'react';
import {
  Clock,
  Zap
} from 'lucide-react';
import { useTradingSimulation } from '../../context/TradingSimulationContext';
import { usePortfolio } from '../../context/PortfolioContext';
import { VirtualTable } from '../../components/common/VirtualTable';

export const OrderBookView: React.FC = () => {
  const { orders, cancelOrder } = useTradingSimulation();
  const { currency } = usePortfolio();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredOrders = orders.filter(o => {
    if (statusFilter === 'ALL') return true;
    return o.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
        <div>
          <h3 className="text-lg font-black flex items-center gap-2 text-[var(--text-primary)]">
            <Clock className="w-5 h-5 text-[var(--icici-orange)]" />
            Exchange Order Book & Audit Log
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1">
              <Zap className="w-3 h-3" /> Virtualized O(1) DOM
            </span>
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Complete order lifecycle audit: Bracket (BO), Cover (CO), GTT, Iceberg, and OCO target/stop-loss links
          </p>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 bg-[var(--bg-tertiary)] p-1 rounded-xl border border-[var(--border-color)] text-xs font-bold">
          {['ALL', 'PENDING', 'EXECUTED', 'CANCELLED'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                statusFilter === st ? 'bg-[var(--icici-orange)] text-white shadow-xs' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {st} ({st === 'ALL' ? orders.length : orders.filter(o => o.status === st).length})
            </button>
          ))}
        </div>
      </div>

      <VirtualTable
        items={filteredOrders}
        rowHeight={54}
        viewportHeight={460}
        keyExtractor={(o) => o.id}
        emptyState={
          <div className="p-8 text-center text-xs text-[var(--text-muted)] font-bold bg-[var(--bg-tertiary)] rounded-2xl border border-[var(--border-subtle)]">
            No orders found matching the filter "{statusFilter}".
          </div>
        }
        renderHeader={() => (
          <tr>
            <th>Order ID / Time</th>
            <th>Symbol</th>
            <th>Action</th>
            <th>Order Type</th>
            <th>Product</th>
            <th>Qty</th>
            <th>Order Price</th>
            <th>OCO Target / SL</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        )}
        renderRow={(o) => {
          const isBuy = o.action === 'BUY';
          return (
            <tr key={o.id}>
              <td>
                <span className="font-mono text-xs text-[var(--text-primary)] font-bold block">{o.id}</span>
                <span className="font-mono text-[10px] text-[var(--text-muted)]">{o.time}</span>
              </td>
              <td className="font-mono font-bold text-[var(--text-primary)]">{o.ticker}</td>
              <td>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  isBuy ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                }`}>
                  {o.action}
                </span>
              </td>
              <td>
                <span className="text-xs font-bold text-[var(--text-primary)] block">{o.orderType}</span>
                {o.isOcoTarget && (
                  <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1 py-0.2 rounded inline-block">
                    OCO Target Leg
                  </span>
                )}
                {o.isOcoStopLoss && (
                  <span className="text-[9px] font-bold text-rose-500 bg-rose-500/10 px-1 py-0.2 rounded inline-block">
                    OCO StopLoss Leg
                  </span>
                )}
              </td>
              <td className="text-xs text-[var(--text-secondary)]">{o.product}</td>
              <td className="font-mono font-bold text-[var(--text-primary)]">
                {o.qty}
                {o.disclosedQty && o.disclosedQty < o.qty && (
                  <span className="text-[9px] text-blue-400 block font-normal">
                    (Disclosed: {o.disclosedQty})
                  </span>
                )}
              </td>
              <td className="font-mono font-bold text-[var(--text-primary)]">
                {currency}{o.price?.toFixed(2)}
              </td>
              <td className="font-mono text-[11px]">
                {o.targetPrice || o.stopLossPrice ? (
                  <div className="space-y-0.5">
                    {o.targetPrice && <span className="text-emerald-500 block">Tgt: ₹{o.targetPrice.toFixed(2)}</span>}
                    {o.stopLossPrice && <span className="text-rose-500 block">SL: ₹{o.stopLossPrice.toFixed(2)}</span>}
                  </div>
                ) : (
                  <span className="text-[var(--text-muted)]">--</span>
                )}
              </td>
              <td>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                  o.status === 'EXECUTED'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : o.status === 'PENDING'
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                    : 'bg-slate-500/15 text-slate-500 border border-slate-500/30'
                }`}>
                  {o.status}
                </span>
              </td>
              <td>
                {o.status === 'PENDING' && (
                  <button
                    onClick={() => cancelOrder(o.id)}
                    className="px-2.5 py-1 rounded-md bg-rose-600/15 hover:bg-rose-600/25 text-rose-600 text-xs font-bold border border-rose-500/30 cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </td>
            </tr>
          );
        }}
      />
    </div>
  );
};
export default OrderBookView;
