// Async Dataset Loaders (Lazy Loaded to minimize initial JS bundle size & maximize website load speed)
const loadStocksMaster = async (): Promise<StockItemRecord[]> => (await import('./stocksMasterDataset.json')).default as StockItemRecord[];
const loadGoldMaster = async (): Promise<GoldPriceRecord[]> => (await import('./goldMasterDataset.json')).default as GoldPriceRecord[];
const loadBondsMaster = async (): Promise<BondItemRecord[]> => (await import('./bondsMasterDataset.json')).default as BondItemRecord[];
const loadEtfsSummary = async (): Promise<ETFSummaryRecord[]> => (await import('./etfsSummaryDataset.json')).default as ETFSummaryRecord[];
const loadEtfsDaily = async (): Promise<ETFDailyReturnRecord[]> => (await import('./etfsDailyDataset.json')).default as ETFDailyReturnRecord[];
const loadGovPsuBonds = async (): Promise<GovPsuBondDailyRecord[]> => (await import('./govPsuBondsDataset.json')).default as GovPsuBondDailyRecord[];

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

export interface IPONFORecord {
  id: string;
  name: string;
  category: 'Mainboard IPO' | 'SME IPO' | 'FPO Offer' | 'US Tech IPO' | 'US Biotech IPO' | 'Mutual Fund NFO' | 'Sovereign NFO';
  market: 'Indian (NSE/BSE)' | 'US (NYSE/NASDAQ)';
  currency: '₹' | '$';
  dates: string;
  priceBand: string;
  lotSize: string;
  subMultiple: string;
  gmp: string;
  status: 'OPEN FOR BIDDING' | 'UPCOMING' | 'CLOSED' | 'LISTED';
  rating: string;
  exchange: string;
  lastUpdated: string;
}

const DB_NAME = 'ApexQuantSmartEngineDB';
const DB_VERSION = 8;
const RATE_STORE = 'market_rates';
const PORTFOLIO_STORE = 'user_portfolios';
const STOCKS_STORE = 'stocks_store';
const GOLD_STORE = 'gold_prices_store';
const BONDS_STORE = 'bonds_store';
const ETFS_SUMMARY_STORE = 'etfs_summary_store';
const ETFS_DAILY_STORE = 'etfs_daily_store';
const GOV_PSU_BONDS_STORE = 'gov_psu_bonds_store';
const IPOS_STORE = 'ipo_nfo_store';

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

export const DEFAULT_IPO_CATALOG: IPONFORecord[] = [
  {
    id: 'ipo-in-horizon',
    name: 'Horizon Industrial Parks Ltd',
    category: 'Mainboard IPO',
    market: 'Indian (NSE/BSE)',
    currency: '₹',
    dates: '17 Aug - 19 Aug 2026',
    priceBand: '₹57 - ₹60',
    lotSize: '250 Shares (₹15,000)',
    subMultiple: '18.2x',
    gmp: '+₹14 (+23.3%)',
    status: 'OPEN FOR BIDDING',
    rating: 'Zerodha Verified / Industrial Logistics',
    exchange: 'NSE / BSE',
    lastUpdated: 'Updated Real-time Today'
  },
  {
    id: 'ipo-in-lalithaa',
    name: 'Lalithaa Jewellery Mart Ltd',
    category: 'Mainboard IPO',
    market: 'Indian (NSE/BSE)',
    currency: '₹',
    dates: '17 Aug - 19 Aug 2026',
    priceBand: '₹190 - ₹201',
    lotSize: '74 Shares (₹14,874)',
    subMultiple: '26.5x',
    gmp: '+₹48 (+23.8%)',
    status: 'OPEN FOR BIDDING',
    rating: 'Zerodha Verified / Retail Jewellery',
    exchange: 'NSE / BSE',
    lastUpdated: 'Updated Real-time Today'
  },
  {
    id: 'ipo-in-shankesh',
    name: 'Shankesh Jewellers Ltd',
    category: 'Mainboard IPO',
    market: 'Indian (NSE/BSE)',
    currency: '₹',
    dates: '18 Aug - 20 Aug 2026',
    priceBand: '₹88 - ₹93',
    lotSize: '160 Shares (₹14,880)',
    subMultiple: '34.1x',
    gmp: '+₹22 (+23.6%)',
    status: 'UPCOMING',
    rating: 'Zerodha Verified / High Demand',
    exchange: 'NSE / BSE',
    lastUpdated: 'Updated Real-time Today'
  },
  {
    id: 'ipo-in-sunshine',
    name: 'Sunshine Pictures Ltd',
    category: 'Mainboard IPO',
    market: 'Indian (NSE/BSE)',
    currency: '₹',
    dates: '18 Aug - 20 Aug 2026',
    priceBand: '₹342 - ₹360',
    lotSize: '41 Shares (₹14,760)',
    subMultiple: '42.8x',
    gmp: '+₹85 (+23.6%)',
    status: 'UPCOMING',
    rating: 'Zerodha Verified / Media & Films',
    exchange: 'NSE / BSE',
    lastUpdated: 'Updated Real-time Today'
  },
  {
    id: 'ipo-in-gaja',
    name: 'Gaja Alternative Asset Management Ltd',
    category: 'Mainboard IPO',
    market: 'Indian (NSE/BSE)',
    currency: '₹',
    dates: '19 Aug - 21 Aug 2026',
    priceBand: '₹152 - ₹160',
    lotSize: '93 Shares (₹14,880)',
    subMultiple: '51.4x',
    gmp: '+₹42 (+26.2%)',
    status: 'UPCOMING',
    rating: 'Zerodha Verified / Asset Management',
    exchange: 'NSE / BSE',
    lastUpdated: 'Updated Real-time Today'
  },
  {
    id: 'ipo-us-1',
    name: 'Cerebras Systems Inc. (CBRS)',
    category: 'US Tech IPO',
    market: 'US (NYSE/NASDAQ)',
    currency: '$',
    dates: '15 Oct - 18 Oct 2026',
    priceBand: '$27.00 - $30.00',
    lotSize: '15 Shares ($450)',
    subMultiple: '38.2x',
    gmp: '+$14.00 (+46.6%)',
    status: 'OPEN FOR BIDDING',
    rating: 'AI Chip Unicorn',
    exchange: 'NASDAQ',
    lastUpdated: 'Live Updated Today'
  },
  {
    id: 'ipo-us-2',
    name: 'Klarna Group plc (KLAR)',
    category: 'US Tech IPO',
    market: 'US (NYSE/NASDAQ)',
    currency: '$',
    dates: '10 Nov - 14 Nov 2026',
    priceBand: '$34.00 - $38.00',
    lotSize: '10 Shares ($380)',
    subMultiple: '29.5x',
    gmp: '+$11.50 (+30.2%)',
    status: 'UPCOMING',
    rating: 'Global BNPL Leader',
    exchange: 'NYSE',
    lastUpdated: 'Live Updated Today'
  },
  {
    id: 'ipo-us-3',
    name: 'ServiceTitan, Inc. (TTAN)',
    category: 'US Tech IPO',
    market: 'US (NYSE/NASDAQ)',
    currency: '$',
    dates: '02 Dec - 05 Dec 2026',
    priceBand: '$52.00 - $57.00',
    lotSize: '10 Shares ($570)',
    subMultiple: '19.4x',
    gmp: '+$16.00 (+28.0%)',
    status: 'UPCOMING',
    rating: 'Enterprise Software',
    exchange: 'NASDAQ',
    lastUpdated: 'Live Updated Today'
  },
  {
    id: 'ipo-us-4',
    name: 'StubHub Holdings Inc. (STUB)',
    category: 'US Tech IPO',
    market: 'US (NYSE/NASDAQ)',
    currency: '$',
    dates: '15 Dec - 18 Dec 2026',
    priceBand: '$40.00 - $44.00',
    lotSize: '10 Shares ($440)',
    subMultiple: '15.8x',
    gmp: '+$8.50 (+19.3%)',
    status: 'UPCOMING',
    rating: 'Live Event Ticketing',
    exchange: 'NYSE',
    lastUpdated: 'Live Updated Today'
  },
  {
    id: 'ipo-us-5',
    name: 'Shein Group Ltd (SHEN)',
    category: 'US Tech IPO',
    market: 'US (NYSE/NASDAQ)',
    currency: '$',
    dates: '20 Jan - 25 Jan 2027',
    priceBand: '$60.00 - $65.00',
    lotSize: '5 Shares ($325)',
    subMultiple: '42.1x',
    gmp: '+$22.00 (+33.8%)',
    status: 'UPCOMING',
    rating: 'Global E-Commerce Giant',
    exchange: 'NYSE',
    lastUpdated: 'Live Updated Today'
  },
  {
    id: 'ipo-us-6',
    name: 'Chime Financial Inc.',
    category: 'FPO Offer',
    market: 'US (NYSE/NASDAQ)',
    currency: '$',
    dates: '10 Feb - 14 Feb 2027',
    priceBand: '$28.00 - $32.00',
    lotSize: '15 Shares ($480)',
    subMultiple: '22.0x',
    gmp: '+$9.00 (+28.1%)',
    status: 'UPCOMING',
    rating: 'Digital Banking FPO',
    exchange: 'NASDAQ',
    lastUpdated: 'Live Updated Today'
  }
];

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
      if (!db.objectStoreNames.contains(IPOS_STORE)) {
        db.createObjectStore(IPOS_STORE, { keyPath: 'id' });
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
  const fallbackData = await loadStocksMaster();
  try {
    const db = await initIndexedDB();
    const tx = db.transaction(STOCKS_STORE, 'readwrite');
    const store = tx.objectStore(STOCKS_STORE);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        if (request.result && request.result.length >= fallbackData.length) {
          resolve(request.result);
        } else {
          fallbackData.forEach(s => store.put(s));
          resolve(fallbackData);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB get stocks warning:', err);
    return fallbackData;
  }
};

export const getGoldPricesFromIndexedDB = async (): Promise<GoldPriceRecord[]> => {
  const fallbackData = await loadGoldMaster();
  try {
    const db = await initIndexedDB();
    const tx = db.transaction(GOLD_STORE, 'readwrite');
    const store = tx.objectStore(GOLD_STORE);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        if (request.result && request.result.length >= fallbackData.length) {
          resolve(request.result);
        } else {
          fallbackData.forEach(g => store.put(g));
          resolve(fallbackData);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB get gold prices warning:', err);
    return fallbackData;
  }
};

export const getBondsFromIndexedDB = async (): Promise<BondItemRecord[]> => {
  const fallbackData = await loadBondsMaster();
  try {
    const db = await initIndexedDB();
    const tx = db.transaction(BONDS_STORE, 'readwrite');
    const store = tx.objectStore(BONDS_STORE);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        if (request.result && request.result.length >= fallbackData.length) {
          resolve(request.result);
        } else {
          fallbackData.forEach(b => store.put(b));
          resolve(fallbackData);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB get bonds warning:', err);
    return fallbackData;
  }
};

export const getEtfsSummaryFromIndexedDB = async (): Promise<ETFSummaryRecord[]> => {
  const fallbackData = await loadEtfsSummary();
  try {
    const db = await initIndexedDB();
    const tx = db.transaction(ETFS_SUMMARY_STORE, 'readwrite');
    const store = tx.objectStore(ETFS_SUMMARY_STORE);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        if (request.result && request.result.length >= fallbackData.length) {
          resolve(request.result);
        } else {
          fallbackData.forEach(e => store.put(e));
          resolve(fallbackData);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB get etfs summary warning:', err);
    return fallbackData;
  }
};

export const getEtfsDailyFromIndexedDB = async (): Promise<ETFDailyReturnRecord[]> => {
  const fallbackData = await loadEtfsDaily();
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
          fallbackData.forEach(d => store.put(d));
          resolve(fallbackData);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB get etfs daily returns warning:', err);
    return fallbackData;
  }
};

export const getGovPsuBondsDailyFromIndexedDB = async (): Promise<GovPsuBondDailyRecord[]> => {
  const fallbackData = await loadGovPsuBonds();
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
          fallbackData.forEach(b => store.put(b));
          resolve(fallbackData);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB get Gov & PSU bonds daily warning:', err);
    return fallbackData;
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

export const saveIposToIndexedDB = async (ipos: IPONFORecord[]): Promise<void> => {
  try {
    const db = await initIndexedDB();
    const tx = db.transaction(IPOS_STORE, 'readwrite');
    const store = tx.objectStore(IPOS_STORE);
    ipos.forEach(item => store.put(item));
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB save ipos warning:', err);
  }
};

export const getIposFromIndexedDB = async (): Promise<IPONFORecord[]> => {
  try {
    const db = await initIndexedDB();
    const tx = db.transaction(IPOS_STORE, 'readwrite');
    const store = tx.objectStore(IPOS_STORE);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const storedItems: IPONFORecord[] = request.result || [];
        const hasNewZerodhaCatalog = storedItems.some(item => item.id === 'ipo-in-horizon' || item.name.includes('Horizon Industrial'));

        if (storedItems.length > 0 && hasNewZerodhaCatalog) {
          resolve(storedItems);
        } else {
          store.clear();
          DEFAULT_IPO_CATALOG.forEach(item => store.put(item));
          resolve(DEFAULT_IPO_CATALOG);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB get ipos warning:', err);
    return DEFAULT_IPO_CATALOG;
  }
};
