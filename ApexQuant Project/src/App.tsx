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
import { ShieldCheck, Cpu } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeTab } = usePortfolio();

  return (
    <main className="w-full max-w-[1700px] mx-auto min-h-[calc(100vh-140px)]">
      {activeTab === 'dashboard' && <ExecutiveDashboard />}
      {activeTab === 'builder' && <PortfolioBuilder />}
      {activeTab === 'frontier' && <EfficientFrontierPage />}
      {activeTab === 'backtest' && <BacktesterPage />}
      {activeTab === 'explorer' && <MarketExplorerPage />}
      {activeTab === 'docs' && <DocumentationPage />}
    </main>
  );
};

export function App() {
  return (
    <PortfolioProvider>
      <div className="w-full min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
        {/* Header */}
        <Header />

        {/* 6-Module Navigation Bar */}
        <Navigation />

        {/* Module Content */}
        <div className="flex-1 w-full">
          <MainContent />
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-800 bg-slate-950/80 px-6 py-4 mt-8 text-xs text-slate-500 w-full">
          <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span className="font-semibold text-slate-300">ApexQuant OS</span>
              <span>— Institutional Multi-Asset Portfolio Engineering Platform</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Markowitz MPT Engine</span>
              <span>•</span>
              <span>US Stock / NSE India / Crypto / Forex / Bonds</span>
              <span>•</span>
              <span className="font-mono">v2.5 Production</span>
            </div>
          </div>
        </footer>
      </div>
    </PortfolioProvider>
  );
}

export default App;
