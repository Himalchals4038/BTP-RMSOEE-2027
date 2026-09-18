/**
 * SanchayX Institutional Black-Scholes Options Greeks Engine
 * Calculates European Option Pricing, Payoffs, and Second-Order Greeks:
 * Delta (Δ), Gamma (Γ), Theta (Θ), and Vega (V)
 */

// Standard normal cumulative distribution function (Abramowitz and Stegun approximation)
export function normalCDF(x: number): number {
  const b1 = 0.319381530;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;
  const c2 = 0.39894228; // 1 / sqrt(2 * PI)

  if (x >= 0.0) {
    const t = 1.0 / (1.0 + p * x);
    return (
      1.0 -
      c2 *
        Math.exp((-x * x) / 2.0) *
        t *
        (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1)
    );
  } else {
    const t = 1.0 / (1.0 - p * x);
    return (
      c2 *
      Math.exp((-x * x) / 2.0) *
      t *
      (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1)
    );
  }
}

// Standard normal probability density function
export function normalPDF(x: number): number {
  return (1.0 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
}

export interface OptionGreeks {
  price: number;
  delta: number;
  gamma: number;
  theta: number; // Daily theta decay (INR per day)
  vega: number;  // Per 1% change in IV
  d1: number;
  d2: number;
}

/**
 * Computes Black-Scholes Greeks for an individual option contract
 * @param S Current Underlying Spot Price (e.g., NIFTY 24500)
 * @param K Strike Price (e.g., 24600)
 * @param T Time to Expiration in years (e.g., 7 / 365)
 * @param r Risk-free Interest Rate (e.g., 0.065 for 6.5% RBI repo rate)
 * @param v Implied Volatility (e.g., 0.14 for 14% India VIX)
 * @param isCall true for Call (CE), false for Put (PE)
 */
export function calculateBlackScholesGreeks(
  S: number,
  K: number,
  T: number,
  r: number = 0.065,
  v: number = 0.14,
  isCall: boolean = true
): OptionGreeks {
  // Safety checks
  const safeT = Math.max(0.0001, T);
  const safeV = Math.max(0.01, v);
  const safeS = Math.max(0.01, S);
  const safeK = Math.max(0.01, K);

  const sqrtT = Math.sqrt(safeT);
  const d1 = (Math.log(safeS / safeK) + (r + (safeV * safeV) / 2.0) * safeT) / (safeV * sqrtT);
  const d2 = d1 - safeV * sqrtT;

  const pdfD1 = normalPDF(d1);
  const expTerm = Math.exp(-r * safeT);

  let price = 0;
  let delta = 0;
  let theta = 0;

  if (isCall) {
    price = safeS * normalCDF(d1) - safeK * expTerm * normalCDF(d2);
    delta = normalCDF(d1);
    // Theta in INR/day
    theta =
      (-(safeS * pdfD1 * safeV) / (2.0 * sqrtT) -
        r * safeK * expTerm * normalCDF(d2)) /
      365.0;
  } else {
    price = safeK * expTerm * normalCDF(-d2) - safeS * normalCDF(-d1);
    delta = normalCDF(d1) - 1.0;
    // Theta in INR/day
    theta =
      (-(safeS * pdfD1 * safeV) / (2.0 * sqrtT) +
        r * safeK * expTerm * normalCDF(-d2)) /
      365.0;
  }

  // Gamma and Vega are identical for Calls and Puts
  const gamma = pdfD1 / (safeS * safeV * sqrtT);
  const vega = (safeS * sqrtT * pdfD1 * 0.01); // 1% IV sensitivity

  return {
    price: Math.max(0.05, Number(price.toFixed(2))),
    delta: Number(delta.toFixed(3)),
    gamma: Number(gamma.toFixed(5)),
    theta: Number(theta.toFixed(2)),
    vega: Number(vega.toFixed(2)),
    d1: Number(d1.toFixed(3)),
    d2: Number(d2.toFixed(3))
  };
}

export type OptionType = 'CE' | 'PE';
export type LegAction = 'BUY' | 'SELL';

export interface OptionLeg {
  id: string;
  strike: number;
  type: OptionType;
  action: LegAction;
  lots: number;
  lotSize: number; // e.g. 25 for NIFTY, 15 for BANKNIFTY
  entryPrice: number;
  iv: number; // e.g. 14 (%)
  expiryDate: string;
}

export interface MultiLegStrategySummary {
  netPremium: number; // >0 is debit, <0 is credit
  maxProfit: number | 'Unlimited';
  maxLoss: number | 'Unlimited';
  breakEvens: number[];
  riskRewardRatio: string;
  pop: number; // Probability of Profit %
  totalDelta: number;
  totalGamma: number;
  totalTheta: number;
  totalVega: number;
}

/**
 * Calculates Payoff for a basket of option legs at expiration given an underlying price
 */
export function calculateLegPayoffAtExpiry(
  leg: OptionLeg,
  spotAtExpiry: number
): number {
  const totalQty = leg.lots * leg.lotSize;
  let intrinsic = 0;

  if (leg.type === 'CE') {
    intrinsic = Math.max(0, spotAtExpiry - leg.strike);
  } else {
    intrinsic = Math.max(0, leg.strike - spotAtExpiry);
  }

  const pnlPerShare = leg.action === 'BUY'
    ? intrinsic - leg.entryPrice
    : leg.entryPrice - intrinsic;

  return pnlPerShare * totalQty;
}

/**
 * Calculates Payoff before expiration (T+0 or target date) with time value
 */
export function calculateLegPayoffAtTargetDate(
  leg: OptionLeg,
  spotAtTarget: number,
  targetDaysRemaining: number,
  r: number = 0.065
): number {
  const totalQty = leg.lots * leg.lotSize;
  const T = targetDaysRemaining / 365.0;

  const greeks = calculateBlackScholesGreeks(
    spotAtTarget,
    leg.strike,
    T,
    r,
    leg.iv / 100.0,
    leg.type === 'CE'
  );

  const theoreticalPrice = greeks.price;
  const pnlPerShare = leg.action === 'BUY'
    ? theoreticalPrice - leg.entryPrice
    : leg.entryPrice - theoreticalPrice;

  return pnlPerShare * totalQty;
}
