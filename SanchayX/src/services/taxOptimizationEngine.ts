/**
 * SanchayX Indian Taxation Mastery Engine
 * Implements the 8 Master Legal Loopholes & Strategies under the Indian Income Tax Act, 1961
 * (Incorporating Finance Act 2024 revisions)
 */

export interface TaxExemptionHarvestResult {
  eligibleHoldings: {
    ticker: string;
    name: string;
    qty: number;
    ltp: number;
    unrealizedGain: number;
    harvestableGain: number;
    recommendedHarvestQty: number;
  }[];
  totalHarvestableGain: number;
  remainingExemptionCap: number; // Out of ₹1,25,000
  potentialTaxSaved: number; // 12.5% on harvestable gain
  actionableWindow: string; // "March 20 – March 28"
  description: string;
}

export interface TaxLossHarvestPair {
  sourceTicker: string;
  sourceName: string;
  currentLoss: number;
  qty: number;
  price: number;
  peerTicker: string;
  peerName: string;
  peerPrice: number;
  peerSector: string;
  taxSaved: number;
  holdingType: 'STCG' | 'LTCG';
  section74CarryForwardYears: number;
}

export interface SgbTaxComparison {
  goldPriceGrams: number;
  grams: number;
  holdingYears: number;
  physicalGoldLtcgTax: number; // 12.5% LTCG
  sgbCapitalGainsTax: number; // 0% under Sec 47(viic)
  annualCouponEarned: number; // 2.5% p.a.
  netTaxAdvantage: number;
}

export interface PsuBondYieldComparison {
  investmentAmount: number;
  investorTaxBracket: number; // e.g. 0.30 or 0.39
  psuCouponRate: number; // 7.5%
  bankFdRate: number; // 7.5%
  psuTaxPaid: number; // ₹0
  bankFdTaxPaid: number;
  effectivePreTaxYield: number; // Equivalent pre-tax FD yield
  annualSavings: number;
}

export interface Sec54EcSimulation {
  propertySaleGains: number;
  eligibleInvestment: number; // Max ₹50,00,000
  taxSaved: number; // 12.5% LTCG saved
  couponRate: number; // ~5.25% p.a.
  tenorYears: number; // 5 years
  fiveYearInterestEarned: number;
}

export interface Form15GData {
  formType: 'Form 15G' | 'Form 15H';
  pan: string;
  fullName: string;
  financialYear: string;
  assessmentYear: string;
  status: 'Individual' | 'Senior Citizen (60+)';
  estimatedInterestIncome: number;
  estimatedTotalIncome: number;
  tdsSaved: number;
  declarationSection: string;
}

export interface DeductionRoutingSummary {
  elssAmount: number; // ₹1,50,000 (Sec 80C)
  npsTier1Amount: number; // ₹50,000 (Sec 80CCD(1B))
  totalDeductionsClaimed: number; // ₹2,00,000
  marginalTaxBracket: number; // 30%
  directTaxSaved: number; // ₹62,400 (including 4% cess)
  wealthCreationPotential10Yr: number; // Compound wealth at 15% p.a.
}

export interface RegimeComparisonResult {
  grossAnnualIncome: number;
  newRegimeStandardDeduction: number;
  newRegimeTax: number;
  oldRegimeStandardDeduction: number;
  oldRegimeDeductions: number; // 80C + 80D + HRA + Home loan
  oldRegimeTax: number;
  optimalRegime: 'NEW_REGIME' | 'OLD_REGIME';
  taxDifference: number;
  recommendation: string;
}

// 1. Peer map for Section 70/71 Sell-and-Switch tax loss harvesting
export const INDIAN_PEER_REPLACEMENT_MAP: Record<string, { ticker: string; name: string; sector: string }> = {
  'TATAMOTORS.NS': { ticker: 'M&M.NS', name: 'Mahindra & Mahindra Ltd', sector: 'Automobile' },
  'MARUTI.NS': { ticker: 'BAJAJ-AUTO.NS', name: 'Bajaj Auto Ltd', sector: 'Automobile' },
  'HDFCBANK.NS': { ticker: 'ICICIBANK.NS', name: 'ICICI Bank Ltd', sector: 'Banking' },
  'SBIN.NS': { ticker: 'BANKBARODA.NS', name: 'Bank of Baroda', sector: 'Banking' },
  'KOTAKBANK.NS': { ticker: 'AXISBANK.NS', name: 'Axis Bank Ltd', sector: 'Banking' },
  'TCS.NS': { ticker: 'INFY.NS', name: 'Infosys Ltd', sector: 'Information Technology' },
  'WIPRO.NS': { ticker: 'HCLTECH.NS', name: 'HCL Technologies Ltd', sector: 'Information Technology' },
  'RELIANCE.NS': { ticker: 'ONGC.NS', name: 'Oil & Natural Gas Corp', sector: 'Energy' },
  'NTPC.NS': { ticker: 'POWERGRID.NS', name: 'Power Grid Corp', sector: 'Utilities' },
  'SUNPHARMA.NS': { ticker: 'DRREDDY.NS', name: "Dr. Reddy's Laboratories", sector: 'Pharma' },
  'CIPLA.NS': { ticker: 'LUPIN.NS', name: 'Lupin Ltd', sector: 'Pharma' },
  'ITC.NS': { ticker: 'HINDUNILVR.NS', name: 'Hindustan Unilever Ltd', sector: 'FMCG' },
  'TATASTEEL.NS': { ticker: 'JSWSTEEL.NS', name: 'JSW Steel Ltd', sector: 'Metals' },
  'LT.NS': { ticker: 'SIEMENS.NS', name: 'Siemens Ltd', sector: 'Capital Goods' },
  'PIDILITIND.NS': { ticker: 'SRF.NS', name: 'SRF Ltd', sector: 'Chemicals' }
};

export class TaxOptimizationEngine {
  public static readonly LTCG_EXEMPTION_LIMIT_2024 = 125000; // ₹1.25 Lakh (Budget 2024)
  public static readonly LTCG_TAX_RATE = 0.125; // 12.5%
  public static readonly STCG_TAX_RATE = 0.20; // 20.0%

  /**
   * LOOPHOLE 1: Section 112A LTCG Annual Exemption Harvesting
   * Identifies holdings with unrealized LTCG profits and proposes selling and
   * re-purchasing between March 20-28 to reset acquisition cost basis at 0% tax.
   */
  public static calculateSection112AHarvesting(
    holdings: { ticker: string; name: string; qty: number; ltp: number; avgCost: number; holdingPeriodDays?: number }[]
  ): TaxExemptionHarvestResult {
    const eligibleHoldings: TaxExemptionHarvestResult['eligibleHoldings'] = [];
    let accumulatedGain = 0;

    for (const h of holdings) {
      // Considered Long Term if held > 365 days (or fallback proxy)
      const isLtcg = (h.holdingPeriodDays || 400) > 365;
      const unrealizedGain = (h.ltp - h.avgCost) * h.qty;

      if (isLtcg && unrealizedGain > 500) {
        const remainingCap = Math.max(0, this.LTCG_EXEMPTION_LIMIT_2024 - accumulatedGain);
        const harvestable = Math.min(unrealizedGain, remainingCap);

        if (harvestable > 0) {
          const gainPerShare = Math.max(1, h.ltp - h.avgCost);
          const recQty = Math.min(h.qty, Math.ceil(harvestable / gainPerShare));

          eligibleHoldings.push({
            ticker: h.ticker,
            name: h.name,
            qty: h.qty,
            ltp: h.ltp,
            unrealizedGain,
            harvestableGain: harvestable,
            recommendedHarvestQty: recQty
          });

          accumulatedGain += harvestable;
          if (accumulatedGain >= this.LTCG_EXEMPTION_LIMIT_2024) break;
        }
      }
    }

    const totalHarvestable = Math.min(accumulatedGain, this.LTCG_EXEMPTION_LIMIT_2024);
    const taxSaved = Math.round(totalHarvestable * this.LTCG_TAX_RATE);

    return {
      eligibleHoldings,
      totalHarvestableGain: totalHarvestable,
      remainingExemptionCap: Math.max(0, this.LTCG_EXEMPTION_LIMIT_2024 - totalHarvestable),
      potentialTaxSaved: taxSaved,
      actionableWindow: 'March 20 – March 28',
      description: `Sell up to ₹${totalHarvestable.toLocaleString('en-IN')} of unrealized LTCG profits and re-buy on the same/next day. Resets cost basis to current market price at 0% tax, legally saving ₹${taxSaved.toLocaleString('en-IN')} in future capital gains taxes.`
    };
  }

  /**
   * LOOPHOLE 2: Section 70 & 71 Tax-Loss Harvesting Engine with Peer Switch
   * Scans demat holdings for temporary unrealized losses before March 31.
   * Matches losing holding to an industry peer for simultaneous Sell-and-Switch.
   */
  public static calculateTaxLossHarvestingPairs(
    holdings: { ticker: string; name: string; qty: number; ltp: number; avgCost: number; holdingPeriodDays?: number }[]
  ): TaxLossHarvestPair[] {
    const pairs: TaxLossHarvestPair[] = [];

    for (const h of holdings) {
      const pnl = (h.ltp - h.avgCost) * h.qty;
      if (pnl < -1000) {
        const loss = Math.abs(pnl);
        const isLtcg = (h.holdingPeriodDays || 200) > 365;
        const taxRate = isLtcg ? this.LTCG_TAX_RATE : this.STCG_TAX_RATE;
        const taxSaved = Math.round(loss * taxRate);

        const cleanTicker = h.ticker.toUpperCase();
        const peer = INDIAN_PEER_REPLACEMENT_MAP[cleanTicker] || {
          ticker: 'NIFTYBEES.NS',
          name: 'Nippon India Nifty 50 ETF',
          sector: 'Broad Market Equity'
        };

        pairs.push({
          sourceTicker: h.ticker,
          sourceName: h.name,
          currentLoss: loss,
          qty: h.qty,
          price: h.ltp,
          peerTicker: peer.ticker,
          peerName: peer.name,
          peerPrice: h.ltp * 1.02,
          peerSector: peer.sector,
          taxSaved,
          holdingType: isLtcg ? 'LTCG' : 'STCG',
          section74CarryForwardYears: 8
        });
      }
    }

    return pairs;
  }

  /**
   * LOOPHOLE 3: Section 47(viic) Sovereign Gold Bonds 100% Tax Immunity
   */
  public static calculateSgbTaxBenefit(grams: number, curRatePerGram = 7200, years = 8): SgbTaxComparison {
    const totalInvested = grams * curRatePerGram;
    // Assume 10% p.a. gold appreciation
    const futureGoldPrice = totalInvested * Math.pow(1.10, years);
    const capitalGain = futureGoldPrice - totalInvested;

    // Physical gold / ETF: 12.5% LTCG tax
    const physicalGoldTax = Math.round(capitalGain * this.LTCG_TAX_RATE);
    // SGB: 0% tax under Section 47(viic)
    const sgbTax = 0;

    const annualCoupon = Math.round(totalInvested * 0.025); // 2.5% p.a.

    return {
      goldPriceGrams: curRatePerGram,
      grams,
      holdingYears: years,
      physicalGoldLtcgTax: physicalGoldTax,
      sgbCapitalGainsTax: sgbTax,
      annualCouponEarned: annualCoupon,
      netTaxAdvantage: physicalGoldTax
    };
  }

  /**
   * LOOPHOLE 4: Section 10(15)(iv)(h) PSU Tax-Free Bonds
   */
  public static calculatePsuTaxFreeBondYield(
    amount: number,
    investorTaxBracket = 0.312, // 30% slab + 4% cess
    couponRate = 0.076 // 7.6% p.a.
  ): PsuBondYieldComparison {
    const psuTax = 0; // 100% exempt under Sec 10(15)(iv)(h)

    // Regular bank FD at same 7.6%
    const fdInterest = amount * couponRate;
    const fdTaxPaid = fdInterest * investorTaxBracket;

    // Effective pre-tax yield required on a taxable instrument to match tax-free yield
    const effectivePreTaxYield = Number(((couponRate / (1 - investorTaxBracket)) * 100).toFixed(2));

    return {
      investmentAmount: amount,
      investorTaxBracket,
      psuCouponRate: couponRate * 100,
      bankFdRate: couponRate * 100,
      psuTaxPaid: psuTax,
      bankFdTaxPaid: Math.round(fdTaxPaid),
      effectivePreTaxYield,
      annualSavings: Math.round(fdTaxPaid)
    };
  }

  /**
   * LOOPHOLE 5: Section 54EC Capital Gains Exemption Bonds
   */
  public static calculateSec54EcExemption(propertyGains: number): Sec54EcSimulation {
    const maxEligible = Math.min(propertyGains, 5000000); // Section 54EC limit: ₹50 Lakhs
    const taxSaved = Math.round(maxEligible * this.LTCG_TAX_RATE);
    const couponRate = 5.25; // 5.25% p.a.
    const fiveYearInterest = Math.round(maxEligible * (couponRate / 100) * 5);

    return {
      propertySaleGains: propertyGains,
      eligibleInvestment: maxEligible,
      taxSaved,
      couponRate,
      tenorYears: 5,
      fiveYearInterestEarned: fiveYearInterest
    };
  }

  /**
   * LOOPHOLE 6: Automated Form 15G / 15H Generation
   */
  public static generateForm15Data(
    pan: string,
    fullName: string,
    age: number,
    estimatedInterest: number,
    fy = 'FY 2025-26',
    ay = 'AY 2026-27'
  ): Form15GData {
    const isSenior = age >= 60;
    const tdsSaved = Math.round(estimatedInterest * 0.10); // 10% TDS under 194A

    return {
      formType: isSenior ? 'Form 15H' : 'Form 15G',
      pan,
      fullName,
      financialYear: fy,
      assessmentYear: ay,
      status: isSenior ? 'Senior Citizen (60+)' : 'Individual',
      estimatedInterestIncome: estimatedInterest,
      estimatedTotalIncome: estimatedInterest + 350000,
      tdsSaved,
      declarationSection: isSenior ? 'Section 197A(1) / 197A(1A) / 197A(1C)' : 'Section 197A(1)'
    };
  }

  /**
   * LOOPHOLE 7: Section 80C & 80CCD(1B) Strategic Deduction Routing
   */
  public static calculateDeductionRouting(marginalTaxRate = 0.312): DeductionRoutingSummary {
    const elss = 150000;
    const nps = 50000;
    const totalDeductions = elss + nps;
    const directTaxSaved = Math.round(totalDeductions * marginalTaxRate);

    // Wealth potential compounding at 15% CAGR over 10 years for ₹2L annual contribution
    let corpus = 0;
    for (let yr = 1; yr <= 10; yr++) {
      corpus = (corpus + totalDeductions) * 1.15;
    }

    return {
      elssAmount: elss,
      npsTier1Amount: nps,
      totalDeductionsClaimed: totalDeductions,
      marginalTaxBracket: marginalTaxRate * 100,
      directTaxSaved,
      wealthCreationPotential10Yr: Math.round(corpus)
    };
  }

  /**
   * LOOPHOLE 8: Section 115BAC New vs Old Tax Regime Optimization (Budget 2024)
   */
  public static compareTaxRegimes(
    grossIncome: number,
    claimableOldDeductions = 325000 // 80C (1.5L) + 80D (25k) + HRA/Interest (1.5L)
  ): RegimeComparisonResult {
    // 1. New Regime (Section 115BAC - Budget 2024 revisions)
    // Standard deduction = ₹75,000
    const newStandardDeduction = 75000;
    const newTaxableIncome = Math.max(0, grossIncome - newStandardDeduction);
    let newTax = 0;

    // Slabs:
    // 0 - 3L: 0%
    // 3L - 7L: 5% (₹20,000)
    // 7L - 10L: 10% (₹30,000)
    // 10L - 12L: 15% (₹30,000)
    // 12L - 15L: 20% (₹60,000)
    // > 15L: 30%
    if (newTaxableIncome <= 700000) {
      newTax = 0; // Section 87A rebate makes tax zero up to ₹7 Lakhs taxable
    } else {
      if (newTaxableIncome > 1500000) {
        newTax += (newTaxableIncome - 1500000) * 0.30 + 140000;
      } else if (newTaxableIncome > 1200000) {
        newTax += (newTaxableIncome - 1200000) * 0.20 + 80000;
      } else if (newTaxableIncome > 1000000) {
        newTax += (newTaxableIncome - 1000000) * 0.15 + 50000;
      } else if (newTaxableIncome > 700000) {
        newTax += (newTaxableIncome - 700000) * 0.10 + 20000;
      } else if (newTaxableIncome > 300000) {
        newTax += (newTaxableIncome - 300000) * 0.05;
      }
      newTax = newTax * 1.04; // 4% Health & Education Cess
    }

    // 2. Old Regime
    // Standard deduction = ₹50,000
    const oldStandardDeduction = 50000;
    const oldTaxableIncome = Math.max(0, grossIncome - oldStandardDeduction - claimableOldDeductions);
    let oldTax = 0;

    // Slabs:
    // 0 - 2.5L: Nil
    // 2.5L - 5L: 5%
    // 5L - 10L: 20%
    // > 10L: 30%
    if (oldTaxableIncome <= 500000) {
      oldTax = 0; // Section 87A rebate up to ₹5 Lakhs
    } else {
      if (oldTaxableIncome > 1000000) {
        oldTax += (oldTaxableIncome - 1000000) * 0.30 + 112500;
      } else if (oldTaxableIncome > 500000) {
        oldTax += (oldTaxableIncome - 500000) * 0.20 + 12500;
      } else if (oldTaxableIncome > 250000) {
        oldTax += (oldTaxableIncome - 250000) * 0.05;
      }
      oldTax = oldTax * 1.04; // 4% Cess
    }

    const optimal = newTax <= oldTax ? 'NEW_REGIME' : 'OLD_REGIME';
    const diff = Math.abs(Math.round(newTax - oldTax));

    return {
      grossAnnualIncome: grossIncome,
      newRegimeStandardDeduction: newStandardDeduction,
      newRegimeTax: Math.round(newTax),
      oldRegimeStandardDeduction: oldStandardDeduction,
      oldRegimeDeductions: claimableOldDeductions,
      oldRegimeTax: Math.round(oldTax),
      optimalRegime: optimal,
      taxDifference: diff,
      recommendation: optimal === 'NEW_REGIME'
        ? `The New Tax Regime (Section 115BAC) saves ₹${diff.toLocaleString('en-IN')} more tax thanks to the enhanced ₹75,000 standard deduction and lower 10-15% middle slab rates.`
        : `The Old Tax Regime saves ₹${diff.toLocaleString('en-IN')} more tax because your deductions (₹${claimableOldDeductions.toLocaleString('en-IN')}) exceed the breakeven threshold of ₹3.75 Lakhs.`
    };
  }
}
