import stocksMasterJson from './stocksMasterDataset.json';
import goldMasterJson from './goldMasterDataset.json';
import bondsMasterJson from './bondsMasterDataset.json';
import etfsSummaryJson from './etfsSummaryDataset.json';
import etfsDailyJson from './etfsDailyDataset.json';
import govPsuBondsJson from './govPsuBondsDataset.json';

export interface MarketRateItem {
  key: string;
  name: string;
  category: 'Fixed Income' | 'Bond' | 'FD' | 'SGB' | 'Equity ETF';
  ratePct: number;
  rating: string;
  lastUpdated: string;
}

export interface SmartPortfolioRecord {
  id: string;
  timestamp: string;
  totalCapital: number;
  targetFixedPct: number;
  fixedAmount: number;
  volatileAmount: number;
  expectedCagr: number;
  taxSavingsEstimate: number;
  fixedAssets: Array<{ name: string; amount: number; yieldPct: number; annualPayout: number }>;
  volatileAssets: Array<{ name: string; amount: number; category: string; expectedYieldPct: number }>;
}

export interface StockItemRecord {
  ticker: string;
  name: string;
  index: 'NIFTY 50' | 'S&P 500';
  sector: string;
  price: number;
  changePct: number;
  high52: number;
  low52: number;
  lastUpdated: string;
}

export interface GoldPriceRecord {
  date: string;
  priceUsdOz: number;
  priceInr10g: number;
  usdInrRate: number;
  dailyReturnPct: number;
}

export interface BondItemRecord {
  isin: string;
  issuer: string;
  issuerCategory: string;
  exchange: string;
  bondName: string;
  category: string;
  taxation: string;
  issueYear: number;
  maturityDate: string;
  tenorYears: number;
  couponRatePct: number;
  currentPriceInr: number;
  ytmPct: number;
  currentYieldPct: number;
  creditRating: string;
  faceValueInr: number;
}

export interface ETFSummaryRecord {
  symbol: string;
  name: string;
  category: string;
  exchange: string;
  firstTradedDate: string;
  latestTradedDate: string;
  totalTradingDays: number;
  latestPriceInr: number;
  high52Inr: number;
  low52Inr: number;
  cagr1y: number;
  cagr3y: number;
  cagr5y: number;
  cagr10y: number;
  cagrSinceInception: number;
}

export interface ETFDailyReturnRecord {
  date: string;
  symbol: string;
  name: string;
  category: string;
  openInr: number;
  highInr: number;
  lowInr: number;
  closeInr: number;
  dailyReturnPct: number;
}

export interface GovPsuBondDailyRecord {
  date: string;
  isin: string;
  bondName: string;
  issuerEntity: string;
  bondCategory: string;
  taxationTreatment: string;
  exchange: string;
  faceValueInr: number;
  couponRatePct: number;
  openPriceInr: number;
  highPriceInr: number;
  lowPriceInr: number;
  closePriceInr: number;
  averagePriceInr: number;
  ytmPct: number;
  currentYieldPct: number;
  annualizedTotalReturnPct: number;
  accruedInterestInr: number;
  maturityDate: string;
}

const DB_NAME = 'ApexQuantSmartEngineDB';
const DB_VERSION = 5;
const RATE_STORE = 'market_rates';
const PORTFOLIO_STORE = 'user_portfolios';
const STOCKS_STORE = 'stocks_store';
const GOLD_STORE = 'gold_prices_store';
const BONDS_STORE = 'bonds_store';
const ETFS_SUMMARY_STORE = 'etfs_summary_store';
const ETFS_DAILY_STORE = 'etfs_daily_store';
const GOV_PSU_BONDS_STORE = 'gov_psu_bonds_store';

export const DEFAULT_MARKET_RATES: MarketRateItem[] = [
  { key: 'rbi_bonds', name: 'RBI Floating Rate Savings Bond', category: 'Fixed Income', ratePct: 8.05, rating: 'Sovereign (Govt of India)', lastUpdated: new Date().toLocaleTimeString() },
  { key: 'sgb_gold', name: 'RBI Sovereign Gold Bond (SGB Tranche)', category: 'SGB', ratePct: 2.50, rating: 'Sovereign + Capital Gains Tax Free', lastUpdated: new Date().toLocaleTimeString() },
  { key: 'shriram_fd', name: 'Shriram Finance Senior FD', category: 'FD', ratePct: 8.80, rating: 'CRISIL AAA Rated', lastUpdated: new Date().toLocaleTimeString() },
  { key: 'lt_bond', name: 'L&T Finance Secured Corporate NCD', category: 'Bond', ratePct: 9.15, rating: 'ICRA AA+ Rated', lastUpdated: new Date().toLocaleTimeString() },
  { key: 'hdfc_fd', name: 'HDFC Bank Cumulative Fixed Deposit', category: 'FD', ratePct: 7.75, rating: 'CARE AAA Rated', lastUpdated: new Date().toLocaleTimeString() },
  { key: 'nifty_etf', name: 'NIFTY 50 Index ETF (NIFTYBEES)', category: 'Equity ETF', ratePct: 13.50, rating: 'NSE Quality Top 50', lastUpdated: new Date().toLocaleTimeString() },
  { key: 'flexi_mf', name: 'Parag Parikh Flexi Cap Fund', category: 'Equity ETF', ratePct: 15.20, rating: '5-Star Value Mutual Fund', lastUpdated: new Date().toLocaleTimeString() },
  { key: 'silver_etf', name: 'Nippon India Silver ETF', category: 'Equity ETF', ratePct: 11.80, rating: 'Physical Commodity ETF', lastUpdated: new Date().toLocaleTimeString() }
];

export const DEFAULT_STOCKS_DATA: StockItemRecord[] = stocksMasterJson as StockItemRecord[];
export const DEFAULT_GOLD_DATA: GoldPriceRecord[] = goldMasterJson as GoldPriceRecord[];
export const DEFAULT_BONDS_DATA: BondItemRecord[] = bondsMasterJson as BondItemRecord[];
export const DEFAULT_ETFS_SUMMARY_DATA: ETFSummaryRecord[] = etfsSummaryJson as ETFSummaryRecord[];
export const DEFAULT_ETFS_DAILY_DATA: ETFDailyReturnRecord[] = etfsDailyJson as ETFDailyReturnRecord[];
export const DEFAULT_GOV_PSU_BONDS_DATA: GovPsuBondDailyRecord[] = govPsuBondsJson as GovPsuBondDailyRecord[];

export const initIndexedDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(RATE_STORE)) {
        db.createObjectStore(RATE_STORE, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(PORTFOLIO_STORE)) {
        db.createObjectStore(PORTFOLIO_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STOCKS_STORE)) {
        db.createObjectStore(STOCKS_STORE, { keyPath: 'ticker' });
      }
      if (!db.objectStoreNames.contains(GOLD_STORE)) {
        db.createObjectStore(GOLD_STORE, { keyPath: 'date' });
      }
      if (!db.objectStoreNames.contains(BONDS_STORE)) {
        db.createObjectStore(BONDS_STORE, { keyPath: 'isin' });
      }
      if (!db.objectStoreNames.contains(ETFS_SUMMARY_STORE)) {
        db.createObjectStore(ETFS_SUMMARY_STORE, { keyPath: 'symbol' });
      }
      if (!db.objectStoreNames.contains(ETFS_DAILY_STORE)) {
        db.createObjectStore(ETFS_DAILY_STORE, { keyPath: ['symbol', 'date'] });
      }
      if (!db.objectStoreNames.contains(GOV_PSU_BONDS_STORE)) {
        db.createObjectStore(GOV_PSU_BONDS_STORE, { keyPath: ['isin', 'date'] });
      }
    };
  });
};

export const saveRatesToIndexedDB = async (rates: MarketRateItem[]): Promise<void> => {
  try {
    const db = await initIndexedDB();
    const tx = db.transaction(RATE_STORE, 'readwrite');
    const store = tx.objectStore(RATE_STORE);
    rates.forEach(item => store.put(item));
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB save rates warning:', err);
  }
};

export const getRatesFromIndexedDB = async (): Promise<MarketRateItem[]> => {
  try {
    const db = await initIndexedDB();
    const tx = db.transaction(RATE_STORE, 'readonly');
    const store = tx.objectStore(RATE_STORE);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        if (request.result && request.result.length > 0) {
          resolve(request.result);
        } else {
          resolve(DEFAULT_MARKET_RATES);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB get rates warning:', err);
    return DEFAULT_MARKET_RATES;
  }
};

export const saveStocksToIndexedDB = async (stocks: StockItemRecord[]): Promise<void> => {
  try {
    const db = await initIndexedDB();
    const tx = db.transaction(STOCKS_STORE, 'readwrite');
    const store = tx.objectStore(STOCKS_STORE);
    stocks.forEach(s => store.put(s));
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB save stocks warning:', err);
  }
};

export const getStocksFromIndexedDB = async (): Promise<StockItemRecord[]> => {
  try {
    const db = await initIndexedDB();
    const tx = db.transaction(STOCKS_STORE, 'readwrite');
    const store = tx.objectStore(STOCKS_STORE);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        if (request.result && request.result.length >= DEFAULT_STOCKS_DATA.length) {
          resolve(request.result);
        } else {
          DEFAULT_STOCKS_DATA.forEach(s => store.put(s));
          resolve(DEFAULT_STOCKS_DATA);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB get stocks warning:', err);
    return DEFAULT_STOCKS_DATA;
  }
};

export const getGoldPricesFromIndexedDB = async (): Promise<GoldPriceRecord[]> => {
  try {
    const db = await initIndexedDB();
    const tx = db.transaction(GOLD_STORE, 'readwrite');
    const store = tx.objectStore(GOLD_STORE);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        if (request.result && request.result.length >= DEFAULT_GOLD_DATA.length) {
          resolve(request.result);
        } else {
          DEFAULT_GOLD_DATA.forEach(g => store.put(g));
          resolve(DEFAULT_GOLD_DATA);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB get gold prices warning:', err);
    return DEFAULT_GOLD_DATA;
  }
};

export const getBondsFromIndexedDB = async (): Promise<BondItemRecord[]> => {
  try {
    const db = await initIndexedDB();
    const tx = db.transaction(BONDS_STORE, 'readwrite');
    const store = tx.objectStore(BONDS_STORE);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        if (request.result && request.result.length >= DEFAULT_BONDS_DATA.length) {
          resolve(request.result);
        } else {
          DEFAULT_BONDS_DATA.forEach(b => store.put(b));
          resolve(DEFAULT_BONDS_DATA);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB get bonds warning:', err);
    return DEFAULT_BONDS_DATA;
  }
};

export const getEtfsSummaryFromIndexedDB = async (): Promise<ETFSummaryRecord[]> => {
  try {
    const db = await initIndexedDB();
    const tx = db.transaction(ETFS_SUMMARY_STORE, 'readwrite');
    const store = tx.objectStore(ETFS_SUMMARY_STORE);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        if (request.result && request.result.length >= DEFAULT_ETFS_SUMMARY_DATA.length) {
          resolve(request.result);
        } else {
          DEFAULT_ETFS_SUMMARY_DATA.forEach(e => store.put(e));
          resolve(DEFAULT_ETFS_SUMMARY_DATA);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB get etfs summary warning:', err);
    return DEFAULT_ETFS_SUMMARY_DATA;
  }
};

export const getEtfsDailyFromIndexedDB = async (): Promise<ETFDailyReturnRecord[]> => {
  try {
    const db = await initIndexedDB();
    const tx = db.transaction(ETFS_DAILY_STORE, 'readwrite');
    const store = tx.objectStore(ETFS_DAILY_STORE);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        if (request.result && request.result.length > 0) {
          resolve(request.result);
        } else {
          DEFAULT_ETFS_DAILY_DATA.forEach(d => store.put(d));
          resolve(DEFAULT_ETFS_DAILY_DATA);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB get etfs daily returns warning:', err);
    return DEFAULT_ETFS_DAILY_DATA;
  }
};

export const getGovPsuBondsDailyFromIndexedDB = async (): Promise<GovPsuBondDailyRecord[]> => {
  try {
    const db = await initIndexedDB();
    const tx = db.transaction(GOV_PSU_BONDS_STORE, 'readwrite');
    const store = tx.objectStore(GOV_PSU_BONDS_STORE);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        if (request.result && request.result.length > 0) {
          resolve(request.result);
        } else {
          DEFAULT_GOV_PSU_BONDS_DATA.forEach(b => store.put(b));
          resolve(DEFAULT_GOV_PSU_BONDS_DATA);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB get Gov & PSU bonds daily warning:', err);
    return DEFAULT_GOV_PSU_BONDS_DATA;
  }
};

export const savePortfolioToIndexedDB = async (record: SmartPortfolioRecord): Promise<void> => {
  try {
    const db = await initIndexedDB();
    const tx = db.transaction(PORTFOLIO_STORE, 'readwrite');
    const store = tx.objectStore(PORTFOLIO_STORE);
    store.put(record);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB save portfolio warning:', err);
  }
};
