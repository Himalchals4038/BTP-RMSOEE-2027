# Master Thesis Project Layout & Roadmap
## Customizable Portfolio & Asset Management in Financial Market Instruments

---

## Executive Summary & Project Goal
* **Project Title (Suggested)**: *A Modular Framework and Web Application for Customizable Multi-Asset Portfolio Optimization, Risk Management, and Automated Rebalancing*
* **Primary Objective**: Design and implement a full-stack financial engineering platform that empowers users (retail investors, fund managers, or research analysts) to build, analyze, optimize, backtest, and visually track portfolios across diverse asset classes (Equities, ETFs, Crypto, Forex, Fixed Income/Bonds).
* **Key Deliverable**: An end-to-end interactive web application featuring custom allocation controls, real-time analytics, quantitative optimization algorithms, backtesting engines, and dynamic visual dashboards.

---

## Project Structure at a Glance (16-Week Semester Framework)

```
                    ┌─────────────────────────────────────────────────┐
                    │ Phase 1: Planning & Literature Review (W1 - W3) │
                    └────────────────────────┬────────────────────────┘
                                             │
                                             ▼
                    ┌─────────────────────────────────────────────────┐
                    │  Phase 2: Core Quant Engine & Data API (W4 - W7)│
                    └────────────────────────┬────────────────────────┘
                                             │
                                             ▼
                    ┌─────────────────────────────────────────────────┐
                    │ Phase 3: Interactive Web UI Development (W8-W12)│
                    └────────────────────────┬────────────────────────┘
                                             │
                                             ▼
                    ┌─────────────────────────────────────────────────┐
                    │ Phase 4: Testing, Backtesting & Paper (W13-W16) │
                    └─────────────────────────────────────────────────┘
```

---

## Section 1: Phase 1 — Research, Literature Review & Requirement Specification (Weeks 1 – 3)

### Goal
Establish theoretical foundations, define system requirements, select the tech stack, and design data schemas.

### Step-by-Step Approach

1. **Step 1.1: Financial & Quantitative Literature Review**
   * Review core portfolio management theories:
     * **Modern Portfolio Theory (MPT / Markowitz Mean-Variance Optimization)**: Efficient frontier, expected return, variance/covariance matrix.
     * **Black-Litterman Model**: Combining market equilibrium with custom user views/predictions.
     * **Risk Metrics**: Sharpe Ratio, Sortino Ratio, Value-at-Risk (VaR), Conditional VaR (CVaR), Maximum Drawdown (MDD), Beta, and Alpha.
     * **Asset Allocation Strategies**: Equal Weight (1/N), Risk Parity, Minimum Variance, Maximum Sharpe Ratio.

2. **Step 1.2: Scope & Asset Instrument Selection**
   * Define supported market instruments:
     * **Equities & ETFs**: US / Indian / Global stocks & ETFs (S&P 500, Nifty 50, NASDAQ).
     * **Cryptocurrencies**: BTC, ETH, SOL, Major Altcoins.
     * **Foreign Exchange (Forex)**: EUR/USD, USD/JPY, GBP/USD.
     * **Fixed Income / Commodities (Optional)**: Government Bonds, Gold, Crude Oil.

3. **Step 1.3: Define Customization Parameters**
   * Identify what makes the system *customizable*:
     * User-defined risk profiles (Conservative, Moderate, Aggressive, Custom Volatility Target).
     * Asset class exposure limits (e.g., Max 20% Crypto, Min 30% Equities).
     * Custom rebalancing triggers (Threshold drift e.g. 5%, calendar-based monthly/quarterly).
     * ESG / Sentiment filtering constraints.

4. **Step 1.4: System Architecture & Tech Stack Selection**
   * **Frontend**: React (Vite) / Next.js, TypeScript, Vanilla CSS / Tailwind CSS, Recharts / Lightweight Charts, Lucide Icons.
   * **Backend / Engine**: Python (FastAPI or Flask) — chosen for its rich ecosystem (`pandas`, `numpy`, `scipy`, `PyPortfolioOpt`, `yfinance`).
   * **Database**: PostgreSQL / TimescaleDB (for user profiles, saved portfolios, and historical price caching) or SQLite for local demo.
   * **Data Providers**: Free APIs (`yfinance`, Alpha Vantage, CoinGecko, FRED API).

### Phase 1 Deliverables
* Literature review summary section in thesis draft.
* System Requirements Specification (SRS) document.
* Initial Data Model / DB Schema & API selection matrix.

---

## Section 2: Phase 2 — Data Pipeline & Core Quantitative Engine (Weeks 4 – 7)

### Goal
Build the backend processing pipeline that fetches market data, calculates metrics, runs optimization algorithms, and generates rebalancing signals.

### Step-by-Step Approach

1. **Step 2.1: Multi-Asset Data Pipeline**
   * Build unified wrapper functions/connectors for market data:
     * Unified interface to query ticker historical daily OHLCV (Open, High, Low, Close, Volume) data.
     * Implement data normalization (handling missing dates, currency conversions for global assets).
     * Implement caching mechanism (Redis or DB) to respect API rate limits and speed up computation.

2. **Step 2.2: Portfolio Analytics Module**
   * Implement mathematical formulas in Python (`numpy`/`pandas`):
     * Daily return, log return, cumulative return.
     * Covariance matrix & Correlation matrix generation.
     * Annualized Volatility & Expected Annualized Return.
     * Risk Metrics:
       * **Sharpe Ratio**: $\frac{R_p - R_f}{\sigma_p}$
       * **Sortino Ratio**: $\frac{R_p - R_f}{\sigma_d}$ (downside deviation)
       * **Value at Risk (VaR)**: 95% and 99% confidence level (Parametric & Historical).
       * **Max Drawdown**: Peak-to-trough decline calculation.

3. **Step 2.3: Optimization & Custom Allocation Engine**
   * Implement portfolio optimization routines (using `scipy.optimize` or `PyPortfolioOpt`):
     * **Max Sharpe Ratio Portfolio**.
     * **Min Volatility Portfolio**.
     * **Target Volatility Portfolio** (User sets desired max annual risk e.g., 12%).
     * **Custom Constrained Optimization** (e.g., bounds $w_i \in [0.05, 0.40]$, sector cap $\sum w_{\text{tech}} \le 0.30$).
     * **Efficient Frontier Generator**: Compute 50–100 optimal portfolios across the risk-return spectrum.

4. **Step 2.4: Automated Rebalancing & Drift Detection Engine**
   * Logic to compare current portfolio holding weights $W_{current}$ against target weights $W_{target}$.
   * Calculate absolute drift: $D_i = |W_{current, i} - W_{target, i}|$.
   * Generate buy/sell recommendations required to return portfolio to target weights while minimizing transaction turnover.

### Phase 2 Deliverables
* Fully functional Python package/backend module with unit test suite (`pytest`).
* RESTful API endpoints for:
  * `/api/market-data?tickers=AAPL,BTC-USD,GLD`
  * `/api/analytics`
  * `/api/optimize`
  * `/api/rebalance`

---

## Section 3: Phase 3 — Web Application & Interactive UI Development (Weeks 8 – 12)

### Goal
Develop a polished, modern, highly interactive web UI that showcases the platform's customizability, visualizations, and analytics.

### Step-by-Step Approach

1. **Step 3.1: UI/UX Architecture & Layout**
   * Build a modular layout using modern financial dashboard aesthetics:
     * Dark / Light mode toggling with high-contrast data visualization.
     * Navigation bar: **Dashboard**, **Portfolio Builder**, **Optimization & Frontier**, **Backtesting Simulator**, **Market Explorer**.

2. **Step 3.2: Interactive Portfolio Builder Component**
   * Features:
     * Asset Search bar with multi-asset ticker autocomplete.
     * Dynamic Weight Sliders & Allocation Pie Chart (real-time updating).
     * Constraint Controls: Set min/max asset weights, risk tolerance slider, max drawdown limit.
     * Custom Benchmark selector (e.g. S&P 500, 60/40 Equity-Bond, BTC).

3. **Step 3.3: Analytics & Visualization Suite**
   * **Performance Chart**: Interactive line chart comparing portfolio growth vs benchmark over time (1M, 6M, 1Y, 5Y, All).
   * **Asset Distribution**: Nested Donut chart showing asset class breakdown (Stocks vs Crypto vs Forex vs Bonds) and individual asset weights.
   * **Correlation Matrix Heatmap**: Color-coded correlation grid highlighting portfolio diversification efficiency.
   * **Efficient Frontier Visualizer**: Scatter plot showing individual assets, current portfolio, and the optimal curve with interactive hover state.
   * **Risk & Metric Cards**: Displaying Sharpe Ratio, VaR, Max Drawdown, Beta, and Alpha with color-coded risk flags.

4. **Step 3.4: Strategy Backtester Module**
   * Interactive historical simulator allowing users to:
     * Pick historical date range (e.g. 2018 - 2024).
     * Choose rebalancing strategy (No rebalancing, Monthly, Quarterly, 5% Drift).
     * Set initial investment amount (e.g., $10,000) and monthly recurring contributions.
     * View detailed performance stats & drawdown charts over time.

5. **Step 3.5: Scenario Comparison & Export Functionality**
   * Allow users to save multiple custom portfolio configurations side-by-side.
   * Compare "Conservative", "Balanced", and "Aggressive Custom" portfolios on a unified comparison matrix.
   * Export summary reports as PDF / CSV.

### Phase 3 Deliverables
* Complete front-end web application connected to the backend API.
* Responsive, high-performance UI running locally via `npm run dev`.

---

## Section 4: Phase 4 — Testing, Evaluation, Thesis Writing & Defense (Weeks 13 – 16)

### Goal
Perform quantitative backtesting, system testing, complete the formal thesis paper, and prepare the final defense presentation.

### Step-by-Step Approach

1. **Step 4.1: Empirical Backtesting & Crash Stress Testing**
   * Test custom portfolio models under severe historical market stress events:
     * 2008 Financial Crisis.
     * March 2020 COVID-19 Market Crash.
     * 2022 Tech & Crypto Downturn.
   * Evaluate whether risk constraints (e.g., VaR caps, max drawdown limits, multi-asset diversification) successfully mitigated losses compared to unhedged single-asset portfolios.

2. **Step 4.2: System Performance & Usability Validation**
   * Measure API latency for portfolio optimization tasks.
   * Verify responsiveness across various screen resolutions.
   * Conduct usability testing with peers/advisors to refine UI workflows.

3. **Step 4.3: Thesis Paper Writing (Structure)**
   * **Chapter 1: Introduction**: Background, Problem Statement, Objectives, Contributions.
   * **Chapter 2: Literature Review**: Portfolio Theory, Machine Learning / Quant Methods in Asset Allocation, Modern Fintech Tools.
   * **Chapter 3: System Architecture & Design**: Pipeline architecture, API design, UX layout, Data models.
   * **Chapter 4: Methodology & Quantitative Formulations**: Mathematical models for optimization, risk metrics, and rebalancing algorithms.
   * **Chapter 5: Implementation Details**: Backend services, Frontend components, Visualization tools.
   * **Chapter 6: Results, Empirical Evaluation & Backtesting**: Comparative analysis of optimized portfolios vs benchmark index during normal & stress periods.
   * **Chapter 7: Discussion & Future Scope**: Limitations, prospective integration of AI/LLM financial sentiment, multi-currency live broker trading execution.
   * **Chapter 8: Conclusion**.

4. **Step 4.4: Presentation & Live Demo Preparation**
   * Prepare slide deck (15-20 slides) highlighting problem statement, architecture, key results, and live demo.
   * Record short demo video / backup walk-through in case of network issues during defense.

### Phase 4 Deliverables
* Final Bound / Digital Thesis Manuscript.
* Open-Source / Evaluated Codebase with README & Setup Guide.
* Live Web App Demo & Final Defense Slide Deck.

---

## Section 5: Matrix of Deliverables & Semester Timeline

| Week Range | Focus Area | Key Technical Tasks | Deliverables / Artifacts |
| :--- | :--- | :--- | :--- |
| **Weeks 1-3** | Planning & Theory | Literature review, SRS creation, Architecture design, API evaluation | Thesis Intro/Lit Review, Architecture Diagram |
| **Weeks 4-5** | Data Pipeline | Market data connectors, rate limiting, caching, price normalization | Data API Endpoints & DB Models |
| **Weeks 6-7** | Quant Engine | MPT optimization, Risk metrics (Sharpe, VaR), Rebalancing logic | Tested Python Backend (`pytest` covered) |
| **Weeks 8-9** | UI Foundations | UI component library, Layout setup, Portfolio Builder UI | Interactive Builder UI Prototype |
| **Weeks 10-11**| Visualizations | Recharts/Charts integration, Efficient Frontier & Correlation Heatmaps | Analytics & Dashboard Module |
| **Weeks 12** | Backtesting UI | Strategy simulator UI, Drift rebalance simulator, PDF/CSV export | Full Web Application Integration |
| **Weeks 13-14**| Evaluation | Historical crash stress testing, Latency benchmark, Usability fixes | Backtesting Data & Analysis Chapter |
| **Weeks 15-16**| Finalization | Thesis writing, Code refactoring, Presentation deck, Final Defense | Final Thesis Manuscript & Live App Demo |

---

## Section 6: Key Features Checklist for Maximum Academic & Technical Impact

> [!TIP]
> To score top grades in your thesis, ensure your project combines theoretical mathematical rigor with practical engineering quality:

1. **Multi-Asset Versatility**: Demonstrate how adding uncorrelated assets (e.g. Gold or Crypto) alters the Sharpe Ratio of traditional Equity/Bond portfolios.
2. **Dynamic User Constraints**: Allow non-technical users to set intuitive constraints (e.g. "I never want more than 15% volatility" or "Keep stock exposure above 60%").
3. **Interactive Visual Feedback**: Instantly show how moving a slider changes expected return, volatility, and historical drawdown.
4. **Transparent Rebalancing Cost/Drift Modeling**: Account for realistic transaction friction (slippage/commissions) in backtesting.
5. **Clean Code & Reproducibility**: Ensure your backend has automated unit tests and dockerized environment or clear installation steps.
