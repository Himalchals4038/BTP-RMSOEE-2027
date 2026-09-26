# Chapter 05: The Manual Demat Order Console & Self-Directed Account Features
## Retaining 100% Control: Delivery (CNC), Intraday (MIS), Level-2 DOM, Share Pledging, ASBA IPOs & Family Tax Portals

---

### 1. Introduction: Freedom of Self-Directed Investing

While SanchayX’s core innovation is its Semi-Automated Wealth Engine and Valuation Sentinels, we believe that an investor should **never be locked out of direct market access**. 

If you want to buy 100 shares of Reliance Industries, apply for an upcoming IPO like Tata Technologies or Swiggy, pledge existing Demat shares for instant liquidity, or buy a secondary Sovereign Gold Bond on your own terms, **the complete manual Demat order console remains 100% accessible at all times**.

SanchayX seamlessly marries the safety and guidance of a private wealth office with the speed and responsiveness of India's premier discount brokerages (like Zerodha Kite, ICICI Direct, and Groww).

---

### 2. Manual Order Types & Product Codes

When placing an order in the SanchayX Trading Console, you can configure your order across standard Indian market product codes:

```
┌────────────────────────────────────────────────────────┐
│             SANCHAYX DEMAT ORDER PLACEMENT             │
├────────────────────────────────────────────────────────┤
│  ACTION:  [ BUY ]   [ SELL ]                           │
│  PRODUCT: [ Delivery (CNC) ]   [ Intraday (MIS) ]      │
│  TYPE:    [ Market Order ]     [ Limit Order ]         │
│  QUANTITY: [ 100 ] SHARES      PRICE: ₹[ 1,612.40 ]    │
│                                                        │
│  MARGIN REQUIRED: ₹1,61,240    AVAILABLE: ₹12,40,000   │
│  STATUTORY CHARGES: ₹182.40 (STT: ₹161.20, SEBI: ₹1.6) │
│                                                        │
│  [ RESET ]                   [ PLACE INSTANT ORDER ]   │
└────────────────────────────────────────────────────────┘
```

#### 1. Delivery (CNC - Cash and Carry)
- **Purpose:** Long-term investing.
- **Settlement:** 100% upfront cash is debited. Shares are delivered directly into your Demat account under the T+1 rolling settlement cycle enforced by SEBI.
- **Safety:** CNC positions are never subject to mandatory end-of-day square-offs or broker margin calls. You own the underlying business shares.

#### 2. Intraday (MIS - Margin Intraday Square-off)
- **Purpose:** Day trading within the same market session (09:15 AM to 03:20 PM IST).
- **Leverage:** SanchayX provides 5x leverage (20% margin requirement).
- **SEBI Circuit Breaker Protection:** SanchayX includes an autonomous risk sentinel that triggers an emergency panic square-off if the broader market hits a 10%, 15%, or 20% lower circuit limit, protecting your capital from freeze traps.

#### 3. Order Execution Types
- **Market Order:** Instant execution at the best available offer/bid in the exchange book.
- **Limit Order:** The order rests in the exchange order book and executes only when the market touches your specified price or better.
- **Stop-Loss (SL) & SL-Market:** Automatically triggers a protective exit order if the asset price falls to your specified risk boundary.

---

### 3. Interactive Level-2 Market Depth (DOM)

SanchayX provides institutional-grade **Level-2 Market Depth (Depth of Market - DOM)** displaying the top 5 bids (buyers) and top 5 asks (sellers) updated in real time:

- **Bids (Buy Orders):** Shows the exact prices and quantities buyers are willing to pay.
- **Offers (Sell Orders):** Shows the exact prices and quantities sellers are offering.
- **Market Spread & Liquidity Depth:** SanchayX calculates the bid-ask spread and turnover velocity to ensure you never experience excessive slippage when deploying large capital (e.g., ₹25 Lakhs or ₹1 Crore).

---

### 4. Demat Share Pledging (Instant Collateral with SEBI 20% Haircut)

When an attractive market opportunity arises (for instance, a quality bluechip falls into undervalued territory during a temporary flash crash), you may not have immediate liquid cash ready in your bank account.

**SanchayX implements official SEBI-compliant Demat Share Pledging:**
- **How It Works:**
  - Instead of selling your long-term winning stocks (which would trigger capital gains taxes and lose your dividend rights), you can **pledge** your existing Demat shares with a single click.
  - SanchayX applies the statutory **20% SEBI haircut**:
    $$\text{Collateral Margin Created} = \text{Pledged Quantity} \times \text{Current LTP} \times 0.80$$
  - For example, pledging ₹10 Lakhs worth of HDFC Bank shares instantly generates **₹8,00,000 in trading and rebalancing margin**.
- **Dividends & Corporate Actions Retained:**
  - Even while your shares are pledged, you continue to receive 100% of all cash dividends, bonus shares, and stock splits directly into your account!
- **Instant Unpledging:**
  - Once your rebalancing transaction settles, you can unpledge your shares with zero lock-in penalties.

---

### 5. The ASBA IPO Application & Allotment Simulator

In India, applying for Initial Public Offerings (IPOs) through the **ASBA (Application Supported by Blocked Amount)** mechanism is a popular wealth creation strategy.

SanchayX integrates a comprehensive ASBA IPO portal:
1. **Blocked Lien in Savings Bank:** When you apply for an IPO, your funds **never leave your bank account**. SanchayX places the application amount in a "Blocked Lien" status. You continue earning bank interest on your money while awaiting allotment!
2. **Real-Time Grey Market Premium (GMP) Tracking:** Displays current market demand, issue price band, minimum lot size, and retail oversubscription multiples.
3. **Monte Carlo Allotment Lottery Simulation:** When the allotment date arrives, SanchayX executes a realistic probabilistic lottery based on actual retail subscription numbers:
   - **If Allotted:** Your blocked funds are permanently debited, and the newly issued equity shares are credited directly to your Demat statement with opening listing gains!
   - **If Not Allotted:** The bank lien is released immediately, and your full cash amount returns to your Available Margin without any delay.

---

### 6. Zero-TDS Multi-Family Member Tax Profile Management

Indian tax laws evaluate each individual taxpayer as a separate legal entity. A family that invests all its money under one person’s name (usually the primary earner) quickly enters the top 31.2% or 39% tax bracket.

**SanchayX allows you to manage investments across your entire family:**
- **Primary Earner Profile:** Focused on growth equities, 80C ELSS, and Section 112A annual harvesting.
- **Spouse Profile:** Ideal for conservative income, secondary SGB tranches, and separate ₹1.25 Lakh LTCG tax exemptions.
- **Elderly Parents / Senior Citizen Profile (Age 60+):** Eligible for **Form 15H** (zero TDS up to ₹50,000 interest) and higher Section 80TTB interest deductions.
- **HUF (Hindu Undivided Family) Profile:** Utilizes the separate basic exemption limit of ₹3,00,000 to legally divide family business and rental income.

By distributing wealth across multiple family profiles, SanchayX helps families legally save lakhs of rupees every year in combined income tax liabilities.

---

### 7. 7.1% Overnight Auto-Sweep Cash Management

Leaving uninvested cash idle in a regular Demat trading wallet or a zero-interest current account causes steady wealth erosion.

SanchayX integrates an **Overnight 7.1% Auto-Sweep Facility**:
- Any cash not actively deployed in stocks or bonds is automatically swept into RBI-approved overnight reverse repo securities and liquid sovereign funds at 03:30 PM every business day.
- It earns an annualized yield of **~7.1%**, credited daily to your ledger.
- The moment you click to execute an order or a rebalance mandate, the sweep breaks instantly in the background with zero lock-in and zero exit loads!

---

*Continue to [Chapter 06: De-Bloating & Pruning Quant & Crypto Report](./06_De_Bloating_and_Pruning_Quant_and_Crypto_Report.md) to review the code optimization audit.*
