const fs = require('fs');
const path = require('path');

const niftyDir = path.join(__dirname, '../NIFTY Stock Data');
const spDir = path.join(__dirname, '../S&P 500 Stock Data');

function formatCompanyName(symbol, isNifty) {
  const cleanSym = symbol.replace('.NS', '').replace('_', ' ').trim();
  const map = {
    'ADANIENT': 'Adani Enterprises Ltd',
    'ADANIPORTS': 'Adani Ports & Special Economic Zone',
    'ADANIGREEN': 'Adani Green Energy Ltd',
    'ADANIPOWER': 'Adani Power Ltd',
    'ADANIENSOL': 'Adani Energy Solutions Ltd',
    'AMBUJACEM': 'Ambuja Cements Ltd',
    'ACC': 'ACC Ltd',
    'RELIANCE': 'Reliance Industries Ltd',
    'HDFCBANK': 'HDFC Bank Ltd',
    'ICICIBANK': 'ICICI Bank Ltd',
    'TCS': 'Tata Consultancy Services',
    'INFY': 'Infosys Ltd',
    'BHARTIARTL': 'Bharti Airtel Ltd',
    'ITC': 'ITC Ltd',
    'LT': 'Larsen & Toubro Ltd',
    'SBIN': 'State Bank of India',
    'TATAMOTORS': 'Tata Motors Ltd',
    'M_M': 'Mahindra & Mahindra Ltd',
    'M_MFIN': 'Mahindra & Mahindra Financial Services',
    'KOTAKBANK': 'Kotak Mahindra Bank',
    'AXISBANK': 'Axis Bank Ltd',
    'HINDUNILVR': 'Hindustan Unilever Ltd',
    'TITAN': 'Titan Company Ltd',
    'SUNPHARMA': 'Sun Pharmaceutical Ltd',
    'ASIANPAINT': 'Asian Paints Ltd',
    'BAJFINANCE': 'Bajaj Finance Ltd',
    'MARUTI': 'Maruti Suzuki India Ltd',
    'NTPC': 'NTPC Ltd',
    'ONGC': 'Oil & Natural Gas Corp',
    'WIPRO': 'Wipro Ltd',
    'TECHM': 'Tech Mahindra Ltd',
    'ZOMATO': 'Zomato Ltd',
    'DMART': 'Avenue Supermarts (DMart)',
    'SWIGGY': 'Swiggy Ltd',
    'PAYTM': 'One97 Communications (Paytm)',
    'JIOFIN': 'Jio Financial Services'
  };

  if (map[cleanSym]) return map[cleanSym];
  return cleanSym + (isNifty ? ' Ltd' : ' Inc');
}

function parseCsvStock(filePath, symbol, isNifty) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) return null;

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const closeIdx = headers.findIndex(h => h === 'close' || h === 'adj close' || h.includes('close'));
    const highIdx = headers.findIndex(h => h === 'high' || h.includes('high'));
    const lowIdx = headers.findIndex(h => h === 'low' || h.includes('low'));

    const lastLine = lines[lines.length - 1].split(',');
    const prevLine = lines.length > 2 ? lines[lines.length - 2].split(',') : lastLine;

    let price = parseFloat(lastLine[closeIdx !== -1 ? closeIdx : 4]);
    if (isNaN(price) || price === 0) {
      price = parseFloat(lastLine[1]);
    }
    if (isNaN(price)) price = 100.0;

    let prevPrice = parseFloat(prevLine[closeIdx !== -1 ? closeIdx : 4]);
    if (isNaN(prevPrice) || prevPrice === 0) prevPrice = price;

    const changePct = prevPrice > 0 ? Number((((price - prevPrice) / prevPrice) * 100).toFixed(2)) : 0.5;
    const high52 = parseFloat(lastLine[highIdx !== -1 ? highIdx : 2]) || price * 1.25;
    const low52 = parseFloat(lastLine[lowIdx !== -1 ? lowIdx : 3]) || price * 0.75;

    const cleanSym = symbol.replace('.csv', '').trim();
    let formattedTicker = cleanSym;
    if (isNifty) {
      if (!formattedTicker.endsWith('.NS')) {
        formattedTicker = `${formattedTicker.replace('_', '.')}.NS`;
      }
    }

    const companyName = formatCompanyName(cleanSym, isNifty);

    return {
      ticker: formattedTicker,
      name: companyName,
      index: isNifty ? 'NIFTY 50' : 'S&P 500',
      sector: isNifty ? 'NSE Equity' : 'US Equity',
      price: Number(price.toFixed(2)),
      changePct,
      high52: Number(high52.toFixed(2)),
      low52: Number(low52.toFixed(2)),
      lastUpdated: new Date().toLocaleTimeString()
    };
  } catch (err) {
    console.error('Failed processing:', symbol, err);
    return null;
  }
}

const niftyStocks = [];
if (fs.existsSync(niftyDir)) {
  const files = fs.readdirSync(niftyDir).filter(f => f.endsWith('.csv'));
  files.forEach(f => {
    const symbol = path.basename(f, '.csv');
    const item = parseCsvStock(path.join(niftyDir, f), symbol, true);
    if (item) niftyStocks.push(item);
  });
}

const spStocks = [];
if (fs.existsSync(spDir)) {
  const files = fs.readdirSync(spDir).filter(f => f.endsWith('.csv'));
  files.forEach(f => {
    const symbol = path.basename(f, '.csv');
    const item = parseCsvStock(path.join(spDir, f), symbol, false);
    if (item) spStocks.push(item);
  });
}

console.log(`Parsed ${niftyStocks.length} NIFTY stocks and ${spStocks.length} S&P 500 stocks.`);

const allStocks = [...niftyStocks, ...spStocks];

const targetPath = path.join(__dirname, '../ApexQuant Project/src/services/stocksMasterDataset.json');
fs.writeFileSync(targetPath, JSON.stringify(allStocks, null, 2));
console.log(`Saved ${allStocks.length} stocks to ${targetPath}`);
