import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Asset, KRIMetrics, PortfolioConstraints, BacktestConfig, BacktestResult } from '../types/portfolio';
import type { CurrencyCode } from '../utils/financialMath';
import { INITIAL_ASSET_CATALOG } from '../services/mockData';
import { PortfolioApiService, setApiMode } from '../services/api';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  accountType: 'Institutional Prime' | 'Retail HNI' | 'Sandbox Demo';
  kycStatus: 'Verified' | 'Pending' | 'Not Verified';
  dpId: string;
  isLoggedIn: boolean;
}

interface PortfolioContextType {
  assets: Asset[];
  kri: KRIMetrics;
  constraints: PortfolioConstraints;
  activeTab: string;
  activeSubTab: string | null;
  benchmark: 'SP500' | 'NIFTY50';
  currency: CurrencyCode;
  selectedDocTerm: string;
  isLiveApi: boolean;
  isLoading: boolean;
  backtestResult: BacktestResult | null;
  theme: 'light' | 'dark';
  currentUser: UserProfile;
  activeUserModal: 'login' | 'reset_password' | 'edit_profile' | 'switch_user' | null;
  setActiveUserModal: (modal: 'login' | 'reset_password' | 'edit_profile' | 'switch_user' | null) => void;
  loginUser: (userId: string, pass: string) => void;
  logoutUser: () => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  switchUserAccount: (accountType: 'Institutional Prime' | 'Retail HNI' | 'Sandbox Demo') => void;
  toggleTheme: () => void;
  setActiveTab: (tab: string) => void;
  setActiveSubTab: (subTab: string | null) => void;
  setBenchmark: (bench: 'SP500' | 'NIFTY50') => void;
  setCurrency: (curr: CurrencyCode) => void;
  openDocForAsset: (term: string) => void;
  toggleApiMode: () => void;
  updateAssetWeight: (ticker: string, newWeight: number) => void;
  toggleAssetLock: (ticker: string) => void;
  normalizeWeights: () => void;
  addAssetToPortfolio: (asset: Asset) => void;
  removeAssetFromPortfolio: (ticker: string) => void;
  applyOptimization: (mode: 'max_sharpe' | 'min_variance' | 'equal_weight' | 'risk_parity') => Promise<void>;
  updateConstraints: (newConstraints: Partial<PortfolioConstraints>) => void;
  runBacktest: (config: BacktestConfig) => Promise<void>;
  exportReportPDF: () => void;
  exportReportCSV: () => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('apexquant_theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: '8512437145',
    name: 'ApexQuant Trader',
    email: 'trader@apexquant.io',
    accountType: 'Institutional Prime',
    kycStatus: 'Verified',
    dpId: '1208160009482100',
    isLoggedIn: true
  });

  const [activeUserModal, setActiveUserModal] = useState<'login' | 'reset_password' | 'edit_profile' | 'switch_user' | null>(null);
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSET_CATALOG);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [activeSubTab, setActiveSubTab] = useState<string | null>(null);
  const [benchmark, setBenchmark] = useState<'SP500' | 'NIFTY50'>('NIFTY50');
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [selectedDocTerm, setSelectedDocTerm] = useState<string>('Modern Portfolio Theory');
  const [isLiveApi, setIsLiveApi] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('apexquant_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const loginUser = (userId: string) => {
    setCurrentUser(prev => ({
      ...prev,
      id: userId || '8512437145',
      isLoggedIn: true
    }));
    setActiveUserModal(null);
  };

  const logoutUser = () => {
    setCurrentUser(prev => ({
      ...prev,
      isLoggedIn: false
    }));
    setActiveUserModal(null);
  };

  const updateUserProfile = (profileUpdate: Partial<UserProfile>) => {
    setCurrentUser(prev => ({
      ...prev,
      ...profileUpdate
    }));
    setActiveUserModal(null);
  };

  const switchUserAccount = (accountType: 'Institutional Prime' | 'Retail HNI' | 'Sandbox Demo') => {
    setCurrentUser(prev => ({
      ...prev,
      accountType
    }));
    setActiveUserModal(null);
  };

  const [constraints, setConstraints] = useState<PortfolioConstraints>({
    volatilityCap: 15,
    maxCryptoExposure: 20,
    minEquityExposure: 40,
    riskMode: 'Balanced'
  });

  const [kri, setKri] = useState<KRIMetrics>({
    totalValue: 250000,
    totalGainLoss24h: 2450.50,
    totalGainLoss24hPct: 0.98,
    sharpeRatio: 1.45,
    sortinoRatio: 1.82,
    var95Historical: 14.2,
    var95Parametric: 13.8,
    var99Historical: 21.5,
    var99Parametric: 20.8,
    maxDrawdown: 18.4,
    portfolioBeta: 1.05,
    portfolioAlpha: 4.8,
    evaluationBadge: 'Good'
  });

  useEffect(() => {
    let isMounted = true;
    PortfolioApiService.getKRIMetrics(assets, benchmark).then(metrics => {
      if (isMounted) setKri(metrics);
    });
    return () => { isMounted = false; };
  }, [assets, benchmark]);

  useEffect(() => {
    PortfolioApiService.runBacktest(assets, {
      startDate: '2020-01-01',
      endDate: '2026-08-01',
      initialCapital: 10000,
      monthlyContribution: 500,
      rebalanceStrategy: 'quarterly',
      benchmark
    }).then(res => setBacktestResult(res));
  }, []);

  const openDocForAsset = (term: string) => {
    setSelectedDocTerm(term);
    setActiveTab('docs');
  };

  const toggleApiMode = () => {
    const nextMode = !isLiveApi;
    setIsLiveApi(nextMode);
    setApiMode(nextMode);
  };

  const updateAssetWeight = (ticker: string, newWeight: number) => {
    setAssets(prev => prev.map(a => a.ticker === ticker ? { ...a, weight: Math.max(0, Math.min(100, newWeight)) } : a));
  };

  const toggleAssetLock = (ticker: string) => {
    setAssets(prev => prev.map(a => a.ticker === ticker ? { ...a, isLocked: !a.isLocked } : a));
  };

  const normalizeWeights = () => {
    setAssets(prev => {
      const lockedSum = prev.filter(a => a.isLocked).reduce((sum, a) => sum + a.weight, 0);
      const unlocked = prev.filter(a => !a.isLocked);
      const unlockedCurrentSum = unlocked.reduce((sum, a) => sum + a.weight, 0);

      const targetUnlockedSum = Math.max(0, 100 - lockedSum);
      if (unlockedCurrentSum === 0) return prev;

      return prev.map(a => {
        if (a.isLocked) return a;
        const normalizedW = (a.weight / unlockedCurrentSum) * targetUnlockedSum;
        return { ...a, weight: Number(normalizedW.toFixed(2)) };
      });
    });
  };

  const addAssetToPortfolio = (newAsset: Asset) => {
    setAssets(prev => {
      const exists = prev.some(a => a.ticker === newAsset.ticker);
      if (exists) {
        return prev.map(a => a.ticker === newAsset.ticker ? { ...a, weight: a.weight > 0 ? a.weight : 10 } : a);
      }
      return [...prev, { ...newAsset, weight: 10 }];
    });
  };

  const removeAssetFromPortfolio = (ticker: string) => {
    setAssets(prev => prev.map(a => a.ticker === ticker ? { ...a, weight: 0 } : a));
  };

  const applyOptimization = async (mode: 'max_sharpe' | 'min_variance' | 'equal_weight' | 'risk_parity') => {
    setIsLoading(true);
    try {
      const optimizedWeights = await PortfolioApiService.optimizePortfolio(assets, mode);
      setAssets(prev => prev.map(a => {
        if (optimizedWeights[a.ticker] !== undefined) {
          return { ...a, weight: optimizedWeights[a.ticker] };
        }
        return a;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const updateConstraints = (newConstraints: Partial<PortfolioConstraints>) => {
    setConstraints(prev => ({ ...prev, ...newConstraints }));
  };

  const runBacktest = async (config: BacktestConfig) => {
    setIsLoading(true);
    try {
      const result = await PortfolioApiService.runBacktest(assets, config);
      setBacktestResult(result);
    } finally {
      setIsLoading(false);
    }
  };

  const exportReportPDF = async () => {
    const { exportPortfolioToPDF } = await import('../utils/exportUtils');
    exportPortfolioToPDF(assets, kri, backtestResult || undefined);
  };

  const exportReportCSV = async () => {
    const { exportPortfolioToCSV } = await import('../utils/exportUtils');
    exportPortfolioToCSV(assets, kri, backtestResult || undefined);
  };

  return (
    <PortfolioContext.Provider
      value={{
        assets,
        kri,
        constraints,
        activeTab,
        activeSubTab,
        benchmark,
        currency,
        selectedDocTerm,
        isLiveApi,
        isLoading,
        backtestResult,
        theme,
        currentUser,
        activeUserModal,
        setActiveUserModal,
        loginUser,
        logoutUser,
        updateUserProfile,
        switchUserAccount,
        toggleTheme,
        setActiveTab,
        setActiveSubTab,
        setBenchmark,
        setCurrency,
        openDocForAsset,
        toggleApiMode,
        updateAssetWeight,
        toggleAssetLock,
        normalizeWeights,
        addAssetToPortfolio,
        removeAssetFromPortfolio,
        applyOptimization,
        updateConstraints,
        runBacktest,
        exportReportPDF,
        exportReportCSV
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) throw new Error('usePortfolio must be used within PortfolioProvider');
  return context;
};
