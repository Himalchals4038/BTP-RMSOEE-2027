import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Asset, KRIMetrics, PortfolioConstraints, BacktestConfig, BacktestResult } from '../types/portfolio';
import type { CurrencyCode } from '../utils/financialMath';
import { INITIAL_ASSET_CATALOG } from '../services/mockData';
import { PortfolioApiService, setApiMode } from '../services/api';

import {
  getMarketHoursStatus,
  getLiveMarketQuotes,
  fetchLatestQuotes,
  type LiveMarketQuote,
  type MarketSessionStatus
} from '../services/liveMarketService';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
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
  chatbotQuery: string | null;
  askChatbot: (query: string) => void;
  clearChatbotQuery: () => void;
  isLiveApi: boolean;
  isLoading: boolean;
  backtestResult: BacktestResult | null;
  theme: 'light' | 'dark';
  currentUser: UserProfile;
  activeUserModal: 'login' | 'reset_password' | 'edit_profile' | 'switch_user' | null;
  setActiveUserModal: (modal: 'login' | 'reset_password' | 'edit_profile' | 'switch_user' | null) => void;
  loginUser: (userId: string, pass?: string, customName?: string) => void;
  loginDemoUser: (accountType: 'Institutional Prime' | 'Retail HNI' | 'Sandbox Demo') => void;
  signUpUser: (data: { name: string; email: string; phone?: string; accountType?: 'Institutional Prime' | 'Retail HNI' | 'Sandbox Demo' }) => void;
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
  // Live Market & Exchange Hours API
  marketHours: {
    india: MarketSessionStatus;
    us: MarketSessionStatus;
    commodity: MarketSessionStatus;
    crypto: MarketSessionStatus;
  };
  liveMarketQuotes: Record<string, LiveMarketQuote>;
  isMarketDataLoading: boolean;
  refreshMarketData: () => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('sanchayx_theme') || localStorage.getItem('apexquant_theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const savedSession = localStorage.getItem('sanchayx_is_logged_in') || localStorage.getItem('apexquant_is_logged_in');
    const savedProfile = localStorage.getItem('sanchayx_user_profile') || localStorage.getItem('apexquant_user_profile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        return {
          ...parsed,
          isLoggedIn: savedSession === 'true'
        };
      } catch {
        // fallback
      }
    }
    return {
      id: '8512437145',
      name: 'SanchayX Trader',
      email: 'trader@sanchayx.io',
      phone: '+91 98765 43210',
      accountType: 'Institutional Prime',
      kycStatus: 'Verified',
      dpId: '1208160009482100',
      isLoggedIn: savedSession === 'true'
    };
  });

  const [activeUserModal, setActiveUserModal] = useState<'login' | 'reset_password' | 'edit_profile' | 'switch_user' | null>(null);
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSET_CATALOG);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [activeSubTab, setActiveSubTab] = useState<string | null>(null);
  const [benchmark, setBenchmark] = useState<'SP500' | 'NIFTY50'>('NIFTY50');
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [selectedDocTerm, setSelectedDocTerm] = useState<string>('Modern Portfolio Theory');
  const [chatbotQuery, setChatbotQuery] = useState<string | null>(null);
  const [isLiveApi, setIsLiveApi] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  
  // Real Market Hours & Live Market Quotes State
  const [marketHours, setMarketHours] = useState(getMarketHoursStatus);
  const [liveMarketQuotes, setLiveMarketQuotes] = useState<Record<string, LiveMarketQuote>>(getLiveMarketQuotes);
  const [isMarketDataLoading, setIsMarketDataLoading] = useState<boolean>(false);

  useEffect(() => {
    // Initial sync of real-world quotes & IndexedDB cache
    refreshMarketData();

    // Keep market hours status and live rates synchronized every 10 seconds
    const interval = setInterval(() => {
      setMarketHours(getMarketHoursStatus());
      setLiveMarketQuotes(getLiveMarketQuotes());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const refreshMarketData = async () => {
    setIsMarketDataLoading(true);
    try {
      const latest = await fetchLatestQuotes();
      setLiveMarketQuotes(latest);
      setMarketHours(getMarketHoursStatus());
    } finally {
      setIsMarketDataLoading(false);
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('sanchayx_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const loginUser = (userId: string, _pass?: string, customName?: string) => {
    setCurrentUser(prev => {
      const updated: UserProfile = {
        ...prev,
        id: userId || prev.id || '8512437145',
        name: customName || prev.name || 'SanchayX Trader',
        isLoggedIn: true
      };
      localStorage.setItem('sanchayx_is_logged_in', 'true');
      localStorage.setItem('sanchayx_user_profile', JSON.stringify(updated));
      return updated;
    });
    setActiveUserModal(null);
  };

  const loginDemoUser = (accountType: 'Institutional Prime' | 'Retail HNI' | 'Sandbox Demo') => {
    let profile: UserProfile;
    if (accountType === 'Institutional Prime') {
      profile = {
        id: 'INST-994821',
        name: 'SanchayX Institutional Alpha',
        email: 'alpha@sanchayx.io',
        phone: '+91 98111 22334',
        accountType: 'Institutional Prime',
        kycStatus: 'Verified',
        dpId: '1208160009482100',
        isLoggedIn: true
      };
    } else if (accountType === 'Retail HNI') {
      profile = {
        id: 'HNI-772154',
        name: 'Suresh Mehta (HNI)',
        email: 'suresh.mehta@investor.in',
        phone: '+91 98222 33445',
        accountType: 'Retail HNI',
        kycStatus: 'Verified',
        dpId: '1208160007721540',
        isLoggedIn: true
      };
    } else {
      profile = {
        id: 'SBX-104928',
        name: 'Beginner Quant Sandbox',
        email: 'sandbox@sanchayx.io',
        phone: '+91 98333 44556',
        accountType: 'Sandbox Demo',
        kycStatus: 'Verified',
        dpId: '1208160001049280',
        isLoggedIn: true
      };
    }
    setCurrentUser(profile);
    localStorage.setItem('sanchayx_is_logged_in', 'true');
    localStorage.setItem('sanchayx_user_profile', JSON.stringify(profile));
    setActiveUserModal(null);
  };

  const signUpUser = (data: { name: string; email: string; phone?: string; accountType?: 'Institutional Prime' | 'Retail HNI' | 'Sandbox Demo' }) => {
    const randomId = 'SX' + Math.floor(100000 + Math.random() * 900000);
    const randomDp = '12081600' + Math.floor(10000000 + Math.random() * 90000000);
    const newProfile: UserProfile = {
      id: randomId,
      name: data.name || 'New Quant Trader',
      email: data.email || 'trader@sanchayx.io',
      phone: data.phone || '+91 99999 88888',
      accountType: data.accountType || 'Retail HNI',
      kycStatus: 'Verified',
      dpId: randomDp,
      isLoggedIn: true
    };
    setCurrentUser(newProfile);
    localStorage.setItem('sanchayx_is_logged_in', 'true');
    localStorage.setItem('sanchayx_user_profile', JSON.stringify(newProfile));
    setActiveUserModal(null);
  };

  const logoutUser = () => {
    setCurrentUser(prev => ({
      ...prev,
      isLoggedIn: false
    }));
    localStorage.setItem('sanchayx_is_logged_in', 'false');
    setActiveUserModal(null);
  };

  const updateUserProfile = (profileUpdate: Partial<UserProfile>) => {
    setCurrentUser(prev => {
      const updated = { ...prev, ...profileUpdate };
      localStorage.setItem('sanchayx_user_profile', JSON.stringify(updated));
      return updated;
    });
    setActiveUserModal(null);
  };

  const switchUserAccount = (accountType: 'Institutional Prime' | 'Retail HNI' | 'Sandbox Demo') => {
    setCurrentUser(prev => {
      const updated = { ...prev, accountType };
      localStorage.setItem('sanchayx_user_profile', JSON.stringify(updated));
      return updated;
    });
    setActiveUserModal(null);
  };

  const [constraints, setConstraints] = useState<PortfolioConstraints>({
    volatilityCap: 15,
    maxCryptoExposure: 0,
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

  // Run the initial backtest once on mount using default assets and benchmark.
  // This is intentionally run only once — subsequent changes are handled by
  // the asset/benchmark-aware useEffect above (line 297).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    PortfolioApiService.runBacktest(assets, {
      startDate: '2020-01-01',
      endDate: '2026-08-01',
      initialCapital: 10000,
      monthlyContribution: 500,
      rebalanceStrategy: 'quarterly',
      benchmark
    }).then(res => setBacktestResult(res));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const askChatbot = (query: string) => {
    setChatbotQuery(query);
  };

  const clearChatbotQuery = () => {
    setChatbotQuery(null);
  };

  const openDocForAsset = (term: string) => {
    setSelectedDocTerm(term);
    askChatbot(`Tell me more about ${term} stock & financial terminology`);
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
        chatbotQuery,
        askChatbot,
        clearChatbotQuery,
        isLiveApi,
        isLoading,
        backtestResult,
        theme,
        currentUser,
        activeUserModal,
        setActiveUserModal,
        loginUser,
        loginDemoUser,
        signUpUser,
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
        exportReportCSV,
        marketHours,
        liveMarketQuotes,
        isMarketDataLoading,
        refreshMarketData
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

// oxlint-disable-next-line only-export-components -- usePortfolio is intentionally co-located with PortfolioProvider in a single-file context pattern.
export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) throw new Error('usePortfolio must be used within PortfolioProvider');
  return context;
};
