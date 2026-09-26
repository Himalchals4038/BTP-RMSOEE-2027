# Chapter 06: Codebase De-Bloating & Asset Focus Transformation
## Removing Speculative Derivatives, WebAssembly Kernels, and Foreign Volatility to Center SanchayX on Indian Wealth

---

### 1. Architectural Rationale: The Case for De-Bloating

Software systems that attempt to be "everything for everyone" inevitably end up being clumsy, slow, and dangerous for their primary users. 

In early experimental iterations of SanchayX, speculative algorithmic quant trading modules, PineScript-style rule builders, complex Options Greeks calculators, and foreign asset trackers (cryptocurrencies like Bitcoin and US equities like Apple and Tesla) were introduced.

However, a serious architectural review in alignment with our master directive revealed that these speculative components were actively undermining the core mission of SanchayX:
1. **Severe Retail Risk:** SEBI’s landmark study revealed that **93% of individual retail traders in equity derivatives lose money**, suffering net average losses of ₹1.25 Lakh per person. Providing options strategy builders and speculative quant modules contradicts our core pledge of **Capital Preservation (मूलधन सुरक्षा)**.
2. **Computational Bloat:** WebAssembly (WASM) binaries and algorithmic CPU polling loops slowed down page load times, added 300+ KB of binary overhead, and complicated continuous production bundling.
3. **Foreign Currency & Regulatory Friction:** Non-Indian assets (US tech stocks, US Treasuries, and cryptocurrencies) introduced complex cross-border tax issues (LRS limits, 20% TCS deductions, IRS W-8BEN forms) and volatile regulatory uncertainty.

To transform SanchayX into India's premier **Semi-Automated Private Wealth Operating System**, all speculative quant tools and foreign assets have been cleanly excised from the codebase.

---

### 2. Comprehensive De-Bloating & Pruning Master Table

Below is the audited record of every removed module, specific file, and the resulting performance optimization:

| Module Category | Excised Files & Code Artifacts | Architectural Rationale & Optimization Impact |
| :--- | :--- | :--- |
| **Quant Algorithmic Trading** | `src/pages/AlgoStudioPage.tsx`<br>`src/components/algo/VisualRuleBuilder.tsx`<br>`src/services/algoExecutionService.ts`<br>`src/components/algo/` (Folder) | • Removes high-frequency algorithmic speculation and PineScript-like block builders.<br>• Eliminates unnecessary CPU polling loops.<br>• Simplifies main navigation ribbon to focus purely on Indian Wealth. |
| **Options Greeks & Payoff Curves** | `src/components/trading/OptionsStrategyBuilder.tsx`<br>`src/utils/blackScholes.ts` | • Removes retail F&O speculative derivatives where 93% of retail traders lose money (SEBI study).<br>• Cleans up complex Black-Scholes Greeks (Delta, Gamma, Theta, Vega) and payoff chart calculations. |
| **WebAssembly (WASM) Quant Engine** | `src/wasm/sanchayx_quant.wasm`<br>`src/wasm/wasmQuantEngine.ts`<br>`scripts/build_sanchayx_quant_wasm.cjs`<br>`src/wasm/` (Folder) | • Eliminates 300+ KB of binary WASM overhead and C/Rust build script dependencies.<br>• Converted portfolio math (Sharpe ratio, MPT) to lightweight, zero-dependency pure TypeScript in web workers.<br>• Accelerates Vite production bundling to under 1.5 seconds. |
| **Crypto & 24/7 Digital Assets** | Purged CoinGecko API calls, Bitcoin (BTC), Ethereum (ETH), and Binance exchange references across all mock catalogs and live feeds. | • Eliminates volatile, unregulated non-Indian digital assets.<br>• Replaces crypto allocation with RBI Sovereign Gold Bonds (SGB), securing 100% tax-free capital gains and 2.50% annual interest. |
| **US & Foreign Equity Markets** | Removed NYSE/NASDAQ stocks (AAPL, MSFT, TSLA, NVDA, S&P 500) and US Treasuries from `bondsExtendedDataset.ts`. | • Focuses 100% on the Indian regulatory framework, Indian corporate taxation, and Indian currency (₹ INR) cash flows.<br>• Eliminates USD/INR exchange rate depreciation risk and RBI LRS friction. |

---

### 3. Verification & Performance Benchmarks

Following the complete excision of these speculative modules:
- **Zero-Error Strict TypeScript Build:** Running `npm run build` (`tsc -b && vite build`) executes cleanly with **zero TypeScript errors and zero bundling warnings**.
- **Bundle Build Time:** The production build completes in just **1.44 seconds**.
- **Navigation Purity:** The main navigation ribbon is streamlined into six intuitive, wealth-focused workspaces:
  1. **Dual-Shield Smart Engine** (Semi-Automated Capital Allocator & 100% Safe Interest SIP)
  2. **Manual Trading Console** (Demat Place Order, Level-2 Depth, Pledging & ASBA IPOs)
  3. **Valuation Sentinels** (20-Year Historical Multiples & 1-Click Mandate Authorization)
  4. **Tax Auditor & Loopholes** (8 Master Indian Tax Loopholes & Schedule CG Generator)
  5. **Wealth Pitch-Deck** (Executive 6-Slide Corporate PDF Reports & Newton-Raphson XIRR)
  6. **Institutional Portfolio Hub** (Family Office Net Worth & Stress-Test Simulator)

---

### 4. Conclusion: A Platform Built for Real Indian Wealth

By pruning speculative distractions, SanchayX stands as an uncluttered, high-speed, dependable financial sanctuary for Indian investors. Every line of code remaining in SanchayX is dedicated to one single objective: **safely growing and preserving your personal wealth under Indian law.**

---
*End of SanchayX Master Feature Documentation • IIT Kharagpur BTP*
