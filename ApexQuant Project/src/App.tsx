import React from 'react';
import { PortfolioProvider, usePortfolio } from './context/PortfolioContext';
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import { ExecutiveDashboard } from './pages/ExecutiveDashboard';
import { PortfolioBuilder } from './pages/PortfolioBuilder';
import { EfficientFrontierPage } from './pages/EfficientFrontier';
import { BacktesterPage } from './pages/Backtester';
import { MarketExplorerPage } from './pages/MarketExplorer';
import { DocumentationPage } from './pages/Documentation';
import { DualShieldSmartEngine } from './pages/DualShieldSmartEngine';
import { SafeInvestmentEngine } from './pages/SafeInvestmentEngine';
import { ShieldCheck, Cpu } from 'lucide-react';

import { ICICIQuickSubView } from './components/layout/ICICIQuickSubView';
import { UserAuthModal } from './components/layout/UserAuthModal';
import { FloatingHeatmapDrawer } from './components/layout/FloatingHeatmapDrawer';
import { FloatingAIChatbot } from './components/layout/FloatingAIChatbot';

const MainContent: React.FC = () => {
  const { activeTab, activeSubTab, setActiveSubTab } = usePortfolio();

  return (
    <main className="w-full max-w-[1700px] mx-auto min-h-[calc(100vh-140px)] relative">
      {activeTab === 'dashboard' && <ExecutiveDashboard />}
      {activeTab === 'builder' && <PortfolioBuilder />}
      {activeTab === 'smart_engine' && <DualShieldSmartEngine />}
      {activeTab === 'safe_investment' && <SafeInvestmentEngine />}
      {activeTab === 'frontier' && <EfficientFrontierPage />}
      {activeTab === 'backtest' && <BacktesterPage />}
      {activeTab === 'explorer' && <MarketExplorerPage />}
      {activeTab === 'docs' && <DocumentationPage />}

      {/* ICICI Direct Responsive Trading Console Modal */}
      {activeSubTab && (
        <ICICIQuickSubView
          subTab={activeSubTab}
          onClose={() => setActiveSubTab(null)}
        />
      )}

      {/* User Login, Password Reset, Edit Profile & Switch User Modal */}
      <UserAuthModal />

      {/* Floating Global Market Heatmap Drawer (Accessible from all pages) */}
      <FloatingHeatmapDrawer />

      {/* Floating Free AI Chatbot Widget (Bottom Left Corner, Accessible from all pages) */}
      <FloatingAIChatbot />
    </main>
  );
};

export function App() {
  return (
    <PortfolioProvider>
      <div className="w-full min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] flex flex-col font-sans transition-colors duration-200">
        {/* ICICI Direct Style Top Header */}
        <Header />

        {/* Dual-Ribbon Navigation Bar */}
        <Navigation />

        {/* Module Content */}
        <div className="flex-1 w-full max-w-[1750px] mx-auto">
          <MainContent />
        </div>

        {/* Institutional Office Footer */}
        <footer className="border-t border-[var(--border-color)] bg-[var(--bg-card)] px-6 py-4 mt-8 text-xs text-[var(--text-secondary)] w-full">
          <div className="max-w-[1750px] mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[var(--icici-orange)]" />
              <span className="font-semibold text-[var(--text-primary)]">ApexQuant Direct OS</span>
              <span>— Institutional Portfolio & Quantitative Trading Platform</span>
            </div>
            <div className="flex items-center gap-4 text-[var(--text-muted)]">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-emerald)]" /> Markowitz MPT & Risk Engine
              </span>
              <span>•</span>
              <span>NSE India / US Equity / Crypto / Commodities / Forex</span>
              <span>•</span>
              <span className="font-mono">v2.5 Office Edition</span>
            </div>
          </div>
        </footer>
      </div>
    </PortfolioProvider>
  );
}

export default App;
