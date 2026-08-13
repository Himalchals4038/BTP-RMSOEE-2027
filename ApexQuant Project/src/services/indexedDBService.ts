import stocksMasterJson from './stocksMasterDataset.json';

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

const DB_NAME = 'ApexQuantSmartEngineDB';
const DB_VERSION = 2;
const RATE_STORE = 'market_rates';
const PORTFOLIO_STORE = 'user_portfolios';
const STOCKS_STORE = 'stocks_store';

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
          // Re-seed IndexedDB with complete 698 stock master dataset
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
