# ApexQuant OS — Multi-Asset Portfolio Engineering & Risk Intelligence Engine

ApexQuant OS is an institutional-grade quantitative portfolio optimization, risk analytics, and strategy backtesting web platform built with React 19, TypeScript, Vite, Recharts, and TailwindCSS.

---

## Key Modules & Features

### 1. Executive Dashboard (`ExecutiveDashboard.tsx`)
- **Key Risk Indicators (KRIs)**: Real-time net worth tracking, Sharpe ratio, Sortino ratio, 1-Day 95% / 99% Value at Risk (VaR), Maximum Drawdown %, Portfolio Beta, and Jensen's Alpha.
- **Asset Allocation Visualizer**: Interactive Donut chart breakdown by category (Equities, High-Yield Bonds, Cryptocurrencies, ETFs, Commodities, Forex).
- **Historical Equity Performance vs Benchmark**: Dual-line growth curve comparing portfolio returns against S&P 500 or NIFTY 50.

### 2. Interactive Portfolio Allocator (`PortfolioBuilder.tsx`)
- **Modern Portfolio Theory (MPT) Optimizers**:
  1. **Max Sharpe Ratio**: Solves weights to maximize risk-adjusted return per unit of volatility.
  2. **Minimum Variance**: Solves weights to minimize portfolio variance.
  3. **Risk Parity Weighting**: Equalizes risk contribution from each asset class.
  4. **Equal Weight (1/N)**: Uniform capital allocation.
- **Interactive Asset Cards**: Weight sliders (0–100%), asset locking toggle (excludes locked assets from auto-normalization), deletion controls, embedded 30-day price sparklines, and direct Wikipedia documentation links.
- **Exposure Boundary Constraints**: Volatility caps, maximum crypto exposure limits, and minimum equity thresholds.

### 3. Efficient Frontier & Correlation Matrix (`EfficientFrontier.tsx`)
- **Monte Carlo Simulation Engine**: Generates 50+ simulated portfolios to plot the Markowitz Efficient Frontier curve.
- **Cross-Asset Correlation Heatmap Matrix**: Interactive matrix highlighting asset diversification benefits and negative correlations (e.g., Gold & Sovereign Debt vs Equities).

### 4. Historical Strategy Backtester (`Backtester.tsx`)
- **Stress-Test Engine**: Simulates asset allocation performance through historical windows (2020 COVID Crash, 2022 Tech Downturn).
- **Rebalance Trigger Options**: Buy & Hold, Monthly Calendar, Quarterly Calendar, Annual Calendar, and Target Weight Drift (> 5%).
- **Peak-to-Trough Drawdown Analysis**: Tracks portfolio drawdown % over time and details trade execution turnover costs.

### 5. Market Explorer & API Monitor (`MarketExplorer.tsx`)
- **Multi-Asset Securities Catalog**: Displays prices, 24h change %, annualized volatility, beta, and weights.
- **REST API Connection Monitor**: Tracks endpoint latency and toggles between Live API feeds and Offline Sandbox data.

### 6. Financial Knowledge Hub & Wikipedia REST API (`Documentation.tsx`)
- **Wikipedia REST API Integration**: Live encyclopedic search fetching summaries, thumbnails, and direct Wikipedia article links for any stock, crypto, bond, or financial term.
- **Quantitative Finance Reference Manual**: Detailed explanations of MPT, Sharpe, Sortino, VaR, High-Yield Debt, Beta, and Alpha.

---

## Asset Class Catalog

- **Equities (US & India)**: NVIDIA (`NVDA`), Apple (`AAPL`), Microsoft (`MSFT`), Amazon (`AMZN`), Alphabet (`GOOGL`), Meta (`META`), Tesla (`TSLA`), AMD (`AMD`), Berkshire Hathaway (`BRK-B`), JPMorgan (`JPM`), HDFC Bank (`HDFCBANK.NS`), Reliance Industries (`RELIANCE.NS`), ICICI Bank (`ICICIBANK.NS`), TCS (`TCS.NS`), Infosys (`INFY.NS`), Bharti Airtel (`BHARTIARTL.NS`), ITC (`ITC.NS`), SBI (`SBIN.NS`), L&T (`LT.NS`), Trent (`TRENT.NS`).
- **High-Yield & Sovereign Debt**: iShares $ High Yield Corporate Bond (`HYG`), US High Yield Speculative Corporate Bond (`JUNK-HY`), Piramal Finance High Yield Bond (`PIRAMAL-HY`), India 10Y Sovereign G-Sec (`IN10Y.NS`), HDFC Bank AAA Corporate Bond (`HDFC-AAA`).
- **Cryptocurrencies**: Bitcoin (`BTC`), Ethereum (`ETH`), Solana (`SOL`), Binance Coin (`BNB`), TRON (`TRX`), Dogecoin (`DOGE`), Cosmos (`ATOM`), Ripple (`XRP`), Cardano (`ADA`), Avalanche (`AVAX`), Polkadot (`DOT`), Chainlink (`LINK`).
- **ETFs**: iShares Semiconductor (`SOXX`), Invesco QQQ (`QQQ`), Schwab US Dividend (`SCHD`), Vanguard Real Estate (`VNQ`), iShares Russell 2000 (`IWM`), SPDR S&P 500 (`SPY`), Nippon Nifty BeES (`NIFTYBEES.NS`).
- **Commodities**: WTI Crude Oil (`USO`), Silver (`SLV`), Copper (`CPER`), Agriculture (`DBA`), Gold (`GLD`).
- **Forex Pairs**: `GBP/USD`, `USD/JPY`, `USD/INR`, `AUD/USD`, `USD/CAD`, `EUR/USD`.

---

## Multi-Currency Support

Supports 8 major global currencies:
1. **USD ($)** — US Dollar
2. **INR (₹)** — Indian Rupee (with Lakh & Crore formatting)
3. **EUR (€)** — Euro
4. **GBP (£)** — British Pound
5. **JPY (¥)** — Japanese Yen
6. **AUD (A$)** — Australian Dollar
7. **RMB (¥)** — Chinese Renminbi
8. **MXN (Mex$)** — Mexican Peso

---

## Tech Stack & Architecture

- **Core**: React 19, TypeScript 6.0, Vite 8.2
- **Styling**: TailwindCSS v4
- **Charts**: Recharts
- **Icons**: Lucide React
- **PDF & CSV Exports**: jsPDF, html2canvas
- **Data Integrations**: Wikipedia REST API (`https://en.wikipedia.org/api/rest_v1/page/summary/`)

---

## Getting Started

### Installation

```bash
# Clone or navigate to directory
cd "d:\IIT Kharagpur\4th Year\BTP\ApexQuant Project"

# Install dependencies
npm install
```

### Development Server

```bash
npm run dev
```

### Production Build

```bash
npm run build
```
