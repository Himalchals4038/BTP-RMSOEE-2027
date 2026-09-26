# 07. TradingView-Grade Interactive Charting Engine

> SanchayX's live market charting engine — built from scratch using HTML5 Canvas — delivers institutional-quality technical analysis right inside your browser, without any third-party charting library dependency.

---

## What Problem Does This Solve?

If you've ever tried to analyse a stock on your broker's app, you know how frustrating it can be. The charts are tiny, the indicators are limited, and good luck trying to draw a trendline on a mobile screen. Most Indian retail investors end up switching between their broker app and TradingView just to get a decent chart view.

SanchayX brings the full power of a professional charting terminal directly into the trading console. No switching tabs, no separate subscriptions — everything you need to make informed decisions is right where you place your orders.

---

## Chart Types Available

SanchayX supports **7 chart rendering styles**, each suited for different analysis techniques:

| Chart Type | Best Used For | Description |
|---|---|---|
| **Candlestick** (Default) | Price action analysis | Classic Japanese candlestick bars showing Open, High, Low, Close with colour-coded bodies |
| **Heikin-Ashi** | Trend identification | Smoothed candlesticks that filter out market noise, making trends easier to spot |
| **Hollow Candles** | Momentum shifts | Bullish candles are hollow (outline only), bearish are filled — helps spot momentum reversals |
| **OHLC Bars** | Traditional technical analysis | Western-style bars with left tick (Open) and right tick (Close) |
| **Line** | Clean trend overview | Simple close-price line, removing all intraday noise |
| **Area** | Portfolio value tracking | Close-price line with gradient fill below, creating a visual wealth curve |
| **Baseline** | Relative performance | Two-tone area chart: green above the opening price, red below — instantly shows session direction |

---

## Technical Indicators — Comprehensive Suite

### Overlay Indicators (drawn on the price chart itself)

| Indicator | Parameters | What It Tells You |
|---|---|---|
| **EMA 9** | 9-period Exponential Moving Average | Ultra-short-term trend. Day traders use this for quick entry/exit signals |
| **EMA 20** | 20-period EMA | Short-term trend direction. When price is above EMA 20, momentum is bullish |
| **EMA 50** | 50-period EMA | Medium-term trend. Institutional traders watch this as a key support/resistance level |
| **EMA 200** | 200-period EMA | Long-term trend baseline. The "golden cross" (EMA 50 crossing above EMA 200) is a major bullish signal |
| **SMA 20** | 20-period Simple Moving Average | Equal-weighted average, useful for comparing against EMA to gauge trend acceleration |
| **VWAP** | Volume Weighted Average Price | Institutional benchmark price. If the stock is trading above VWAP, buyers are in control |
| **Bollinger Bands** | 20-period, 2 std dev | Volatility envelope. Price touching the upper band suggests overbought; lower band suggests oversold |
| **Supertrend** | Period 10, Multiplier 3 | Trend-following indicator that turns green in uptrend and red in downtrend. Very popular among Indian traders |
| **Pivot Points** | Classic floor pivots | Shows R1/R2/R3 resistance and S1/S2/S3 support levels calculated from the previous period's High, Low, Close |

### Sub-Panel Oscillators (drawn in separate panels below the price chart)

| Oscillator | Parameters | What It Tells You |
|---|---|---|
| **RSI (14)** | 14-period Relative Strength Index | Momentum oscillator ranging 0-100. Above 70 = overbought, Below 30 = oversold |
| **MACD (12, 26, 9)** | Moving Average Convergence Divergence | Trend and momentum indicator. Histogram bars show whether momentum is increasing or decreasing |
| **Stochastic (14, 3)** | %K and %D lines | Compares the closing price to the price range over 14 periods. Above 80 = overbought, Below 20 = oversold |

---

## Drawing Tools

When you click the pencil icon (✏️) in the toolbar, a drawing tools dropdown opens with the following options:

| Tool | How to Use | Purpose |
|---|---|---|
| **Trend Line** | Click two points on the chart | Draw diagonal support/resistance lines connecting swing highs or lows |
| **Horizontal Ray** | Click once at a price level | Mark a key support or resistance price level across the entire chart |
| **Fibonacci Retracement** | Click the swing high, then the swing low (or vice versa) | Automatically draws all major Fibonacci levels: 0%, 23.6%, 38.2%, 50%, 61.8%, 78.6%, 100% |
| **Rectangle Zone** | Click two opposite corners | Highlight a consolidation zone, demand zone, or supply zone |
| **Measure Tool** | Click start point, then end point | Shows the exact price change (in ₹ and %), plus the number of bars between the two points |

All drawings persist while you're on the chart. You can clear all drawings using the "Clear All Drawings" option in the drawing tools dropdown.

---

## Interaction Controls

### Mouse Controls
- **Scroll wheel** on the chart area → Zoom in/out (page scroll is completely blocked inside the chart region, so you won't accidentally scroll away)
- **Click and drag** → Pan left/right through historical candles
- **Mouse hover** → Precision crosshair with snapped OHLC readout in the header bar
- **Click on SEBI filing markers** (E/D/S circles) → Opens a detailed regulatory disclosure modal

### Toolbar Controls
- **Timeframes**: 1m, 3m, 5m, 15m, 30m, 1h, 4h, 1D, 1W — covering everything from scalping to position trading
- **Indicators dropdown**: Toggle any combination of overlay indicators and oscillators on/off
- **Chart Type dropdown**: Switch between all 7 chart styles instantly
- **Zoom +/–**: Fine-grained zoom control buttons
- **Reset (↺)**: Reset zoom and pan to show the latest candles
- **Screenshot (📷)**: Save the current chart view as a PNG image to your device
- **Maximize (⛶)**: Expand the chart to fullscreen for detailed analysis

### Keyboard Shortcuts (in Fullscreen Mode)
- **Esc** → Exit fullscreen
- **R** → Reset zoom and pan

---

## Fullscreen / Maximized Mode

Clicking the maximize button (or the ⛶ icon) expands the chart to fill nearly the entire screen with a dark backdrop. This is designed for serious technical analysis sessions where you need:

- A much taller canvas to see more price detail and oscillator panels
- All indicator panels visible simultaneously without scrolling
- Drawing tools used precisely on a larger surface area
- Fibonacci levels and pivot points readable with clear labels

In fullscreen mode, the chart height extends to `calc(100vh - 120px)`, giving you maximum real estate. Press **Esc** or click the minimize button to return to the inline view.

---

## 20-Year Indian Market Simulation Engine (Institutional Grade)

SanchayX's price simulation eliminates artificial linear trends and simplistic sine waves by integrating **20 years of real historical Indian market data (2004–2024)** across 1,000+ NSE/BSE listed equities:

1. **20-Year Macro Trajectory Anchoring (`1D` and `1W` timeframes)**:
   - Utilizes `top1000IndianStocksDataset.json` containing 81 real quarterly valuation milestones from Q1 2004 to Q1 2024 for 1,000 Indian corporations.
   - Accurately captures historic Indian market regimes: the 2004–2007 pre-GFC bull market, the 2008 Global Financial Crisis shock, the 2009–2019 compounding cycle, the March 2020 COVID crash, and the 2021–2024 post-pandemic rally.
   - Employs Brownian bridges and GARCH(1,1) volatility clustering to interpolate authentic daily sessions between real historical quarterly anchors.

2. **Intraday Stochastic Dynamics (`1m` to `4h` timeframes)**:
   - **Heston Stochastic Volatility Model**: Time-varying instantaneous variance with mean-reverting Cox-Ingersoll-Ross (CIR) dynamics.
   - **Merton Jump-Diffusion**: Poisson jump arrivals generating authentic fat-tailed return distributions (Student-t kurtosis) matching NSE order book realities.
   - **Indian Market U-Curve Session Seasonality**: 
     - **09:15 – 10:30 IST**: Opening surge, morning discovery, elevated volatility.
     - **11:30 – 13:30 IST**: Midday consolidation, low volume drift.
     - **14:30 – 15:30 IST**: Power hour closing momentum and square-off volume spikes.
   - **200-DMA & Psychological Support/Resistance Gravity**: Price exhibits natural mean-reverting gravitational pull toward the stock's actual 200-Day Moving Average and round-number psychological round levels (e.g., ₹100, ₹500, ₹1,000, ₹2,500).

---

## True Viewport Fullscreen Portal (`createPortal`)

To eliminate containing block traps where CSS `position: fixed` gets bounded by parent containers with CSS animations (`animate-in`), transforms, or grid layouts, SanchayX mounts the maximized chart directly onto `document.body` via React `createPortal`.

- **Direct DOM Body Mounting**: Guarantees full `100vw × 100vh` viewport coverage with `z-[999999]`.
- **Scroll Lock**: Automatically disables `document.body.style.overflow = 'hidden'` while in fullscreen.
- **Escape Key & Responsive Resize**: Listens to keyboard `Escape` to instantly restore view; triggers `ResizeObserver` on entry and exit to ensure zero-blur HTML5 Canvas scaling across ultra-wide and 4K displays.
- **20Y Performance Readout**: Displays the stock's verified 20-year CAGR, 200-DMA status, and valuation metric badge directly in the chart toolbar.

---

## Scroll Capture Fix (Technical Detail)

A common frustration with embedded charts is that when you try to zoom in/out using the mouse wheel, the entire page scrolls instead of the chart zooming. SanchayX solves this using a **native DOM event listener** with `{ passive: false }`:

```
canvas.addEventListener('wheel', handleNativeWheel, { passive: false });
```

This is necessary because React's synthetic `onWheel` event handler cannot call `preventDefault()` on passive listeners in modern browsers. The native listener intercepts the wheel event, prevents the default page scroll behaviour, and routes it to the chart's zoom handler instead.

The result: when your mouse cursor is inside the chart canvas, scrolling zooms the chart. When your cursor is outside, the page scrolls normally. Exactly how it should work.

---

## SEBI Corporate Filing Markers

Three types of regulatory markers appear directly on the candlestick chart:

- **E (Earnings)** — Green circle — Quarterly financial results under SEBI (LODR) Regulation 33
- **D (Dividend)** — Cyan circle — Dividend declarations under SEBI (LODR) Regulation 43
- **S (SAST Insider)** — Amber circle — Promoter stake changes under SEBI SAST Regulation 29(2)

Clicking any marker opens a detailed modal showing the regulatory section, filing date, impact assessment, reporting entity, and quantitative change percentage.

---

## How It Fits Into the Trading Console

The chart is integrated directly into the **Order Entry View** of the Trading Console. When you select any stock (e.g., HDFCBANK.NS, RELIANCE.NS, TCS.NS), the chart instantly regenerates with:
- Historical candles calibrated to that stock's price level
- Live 5 Hz tick stream updating the latest candle in real-time
- SEBI filing markers specific to that ticker

This means you can analyse the chart, draw your levels, check the RSI/MACD, and then immediately place your CNC or MIS order — all without leaving the screen.
