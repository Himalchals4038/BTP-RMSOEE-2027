import React from 'react';
import { TradeJournalDashboard } from '../../components/trading/TradeJournalDashboard';
import { CapitalGainsTaxAuditor } from '../../components/trading/CapitalGainsTaxAuditor';

export const ReportsView: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* SECTION A: Institutional Trade Journal & Behavioral P&L Analytics */}
      <TradeJournalDashboard />

      {/* SECTION B: Budget 2024–2026 Capital Gains Tax Auditor & ITR Schedule CG Simulator */}
      <CapitalGainsTaxAuditor />
    </div>
  );
};
export default ReportsView;
