import React, { useState } from 'react';
import { X, ShieldCheck, Smartphone, AlertTriangle } from 'lucide-react';
import type { IPONFORecord } from '../../services/indexedDBService';
import { useTradingSimulation } from '../../context/TradingSimulationContext';

interface AsbaUpiMandateModalProps {
  ipo: IPONFORecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
}

export const AsbaUpiMandateModal: React.FC<AsbaUpiMandateModalProps> = ({
  ipo,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { applyIpoAsba } = useTradingSimulation();

  const [upiId, setUpiId] = useState<string>('investor@okhdfcbank');
  const [numLots, setNumLots] = useState<number>(1);
  const [investorCategory, setInvestorCategory] = useState<'RETAIL' | 'HNI'>('RETAIL');
  const [isCutoff, setIsCutoff] = useState<boolean>(true);
  const [customBidPrice, setCustomBidPrice] = useState<number>(ipo?.maxPrice || 60);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !ipo) return null;

  const lotShares = ipo.lotShares || 250;
  const cutoffPrice = ipo.maxPrice || 60;
  const effectivePrice = isCutoff ? cutoffPrice : (customBidPrice || cutoffPrice);
  const totalShares = numLots * lotShares;
  const totalBlockAmount = totalShares * effectivePrice;

  const upiSuffixes = ['@okhdfcbank', '@okicici', '@oksbi', '@paytm', '@ybl'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!upiId || !upiId.includes('@')) {
      setErrorMsg('Please provide a valid Virtual Payment Address (e.g. yourname@okhdfcbank)');
      return;
    }

    if (totalBlockAmount > 200000 && investorCategory === 'RETAIL') {
      setErrorMsg('Retail Category (RII) bid limit is ₹2,00,000. Switch to HNI / NII or reduce lots.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const res = applyIpoAsba({
        id: ipo.id,
        name: ipo.name,
        category: ipo.category,
        price: effectivePrice,
        lotSize: totalShares,
        gmp: ipo.gmp,
        subMultiple: ipo.retailMultiple || ipo.subMultiple
      });

      setIsSubmitting(false);

      if (res.success) {
        if (onSuccess) {
          onSuccess(res.message);
        }
        onClose();
      } else {
        setErrorMsg(res.message);
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-500" />
            <div>
              <h3 className="text-sm font-extrabold text-[var(--text-primary)]">
                ASBA Virtual UPI 2.0 Mandate
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)]">
                SEBI e-Mandate Block Lien Application
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Issue Summary Banner */}
          <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-xs text-[var(--text-primary)]">{ipo.name}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                {ipo.category}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-[var(--text-muted)] block text-[10px]">Price Band</span>
                <span className="font-mono font-bold text-[var(--text-primary)]">{ipo.priceBand}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block text-[10px]">Lot Size</span>
                <span className="font-mono font-bold text-[var(--text-primary)]">{lotShares} Shares</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block text-[10px]">Live GMP</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{ipo.gmp}</span>
              </div>
            </div>
          </div>

          {/* Investor Category Selector */}
          <div>
            <label className="text-[11px] font-bold uppercase text-[var(--text-muted)] block mb-1.5">
              Investor Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setInvestorCategory('RETAIL')}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  investorCategory === 'RETAIL'
                    ? 'bg-[var(--icici-orange)] text-white border-[var(--icici-orange)] shadow-xs'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-color)]'
                }`}
              >
                Retail (RII &le; ₹2 Lakh)
              </button>
              <button
                type="button"
                onClick={() => setInvestorCategory('HNI')}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  investorCategory === 'HNI'
                    ? 'bg-[var(--icici-orange)] text-white border-[var(--icici-orange)] shadow-xs'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-color)]'
                }`}
              >
                HNI / NII (&gt; ₹2 Lakh)
              </button>
            </div>
          </div>

          {/* Number of Lots */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase text-[var(--text-muted)] block mb-1">
                Number of Lots
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max={investorCategory === 'RETAIL' ? 13 : 50}
                  value={numLots}
                  onChange={(e) => setNumLots(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs font-mono font-bold text-[var(--text-primary)]"
                />
              </div>
              <span className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5 block">
                Total: {totalShares} shares
              </span>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-[var(--text-muted)] block mb-1">
                Bid Price (₹)
              </label>
              <div className="space-y-1">
                <input
                  type="number"
                  disabled={isCutoff}
                  value={isCutoff ? cutoffPrice : customBidPrice}
                  onChange={(e) => setCustomBidPrice(parseFloat(e.target.value) || cutoffPrice)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs font-mono font-bold text-[var(--text-primary)] disabled:opacity-60"
                />
                <label className="flex items-center gap-1.5 cursor-pointer pt-0.5">
                  <input
                    type="checkbox"
                    checked={isCutoff}
                    onChange={(e) => setIsCutoff(e.target.checked)}
                    className="accent-[var(--icici-orange)]"
                  />
                  <span className="text-[10px] font-bold text-[var(--text-secondary)]">Apply at Cut-off (₹{cutoffPrice})</span>
                </label>
              </div>
            </div>
          </div>

          {/* Virtual UPI ID input with quick bank tags */}
          <div>
            <label className="text-[11px] font-bold uppercase text-[var(--text-muted)] block mb-1">
              Virtual Payment Address (UPI ID)
            </label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="e.g. yourname@okhdfcbank"
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs font-mono font-bold text-[var(--text-primary)]"
            />
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] text-[var(--text-muted)]">Suggested:</span>
              {upiSuffixes.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    const prefix = upiId.split('@')[0] || 'investor';
                    setUpiId(`${prefix}${s}`);
                  }}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] border border-[var(--border-color)] cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Total Block Lien Amount */}
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300">
                TOTAL ASBA LIEN AMOUNT
              </div>
              <div className="text-xl font-mono font-black text-emerald-600 dark:text-emerald-400">
                ₹{totalBlockAmount.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="text-right text-[10px] text-[var(--text-muted)]">
              <div>{numLots} Lot(s) &times; {lotShares} Shares</div>
              <div>@ ₹{effectivePrice}/share</div>
            </div>
          </div>

          {/* Regulatory guarantee notice */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-[var(--bg-tertiary)] text-[11px] text-[var(--text-secondary)]">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              <strong>ASBA Guarantee:</strong> Funds remain in your bank account earning interest. SEBI electronic lottery draw will debit ₹{totalBlockAmount.toLocaleString('en-IN')} only if allotted, else the lien is released automatically.
            </span>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md cursor-pointer disabled:opacity-50"
            >
              <Smartphone className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting Mandate...' : `Authorize & Block ₹${totalBlockAmount.toLocaleString('en-IN')}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AsbaUpiMandateModal;
