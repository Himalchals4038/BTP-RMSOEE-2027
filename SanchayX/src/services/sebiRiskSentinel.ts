/**
 * SEBI Regulatory Compliance & Risk Management Sentinel
 * - Intraday Peak Margin Snapshot Engine (4 random snapshots between 09:15 and 15:30 IST)
 * - Exchange-Wide Index Circuit Breaker & Trading Halt Simulator (10%, 15%, 20%)
 * - Auto-Liquidation Margin Call Sentinel (80% maintenance margin threshold with 5-minute square-off countdown)
 * - Institutional TWAP & VWAP Order Slicing Engine
 */

export interface SebiMarginSnapshot {
  id: string;
  name: string; // e.g. "Snapshot T1 (10:18 AM)"
  timestamp: number;
  timeStr: string;
  marginUtilizedPct: number;
  availableMargin: number;
  marginUsed: number;
  status: 'COMPLIANT' | 'WARNING' | 'PENALTY_BREACH';
  penaltyAmount?: number;
}

export interface CircuitBreakerState {
  isHalted: boolean;
  triggerLevel: 0 | 10 | 15 | 20;
  niftyMovePct: number;
  haltStartTime: number | null;
  haltDurationMinutes: number;
  remainingHaltSeconds: number;
  marketPhase: 'OPEN' | 'COOLING_HALT' | 'PRE_OPEN_AUCTION' | 'CLOSED';
  reason: string;
}

export interface AutoLiquidationAlert {
  isActive: boolean;
  maintenanceMarginPct: number;
  remainingSeconds: number;
  mtmLoss: number;
  squareOffExecuted: boolean;
}

// Generate the 4 official SEBI intraday margin snapshot windows
export function generateInitialSebiSnapshots(availableMargin: number, marginUsed: number): SebiMarginSnapshot[] {
  const total = Math.max(1, availableMargin + marginUsed);
  const currentUtilPct = Math.min(120, Number(((marginUsed / total) * 100).toFixed(1)));

  return [
    {
      id: 'snap_t1',
      name: 'Snapshot T1 (Morning Session)',
      timestamp: Date.now() - 3600000 * 3,
      timeStr: '10:14 AM',
      marginUtilizedPct: Math.min(100, Math.max(15, currentUtilPct * 0.7)),
      availableMargin: availableMargin * 1.2,
      marginUsed: marginUsed * 0.7,
      status: 'COMPLIANT'
    },
    {
      id: 'snap_t2',
      name: 'Snapshot T2 (Midday Peak)',
      timestamp: Date.now() - 3600000 * 2,
      timeStr: '11:42 AM',
      marginUtilizedPct: Math.min(100, Math.max(25, currentUtilPct * 0.85)),
      availableMargin: availableMargin * 1.1,
      marginUsed: marginUsed * 0.85,
      status: 'COMPLIANT'
    },
    {
      id: 'snap_t3',
      name: 'Snapshot T3 (European Ingestion)',
      timestamp: Date.now() - 3600000,
      timeStr: '01:28 PM',
      marginUtilizedPct: currentUtilPct,
      availableMargin,
      marginUsed,
      status: currentUtilPct > 95 ? 'WARNING' : 'COMPLIANT'
    },
    {
      id: 'snap_t4',
      name: 'Snapshot T4 (Pre-Close Volatility)',
      timestamp: Date.now(),
      timeStr: '02:50 PM',
      marginUtilizedPct: currentUtilPct,
      availableMargin,
      marginUsed,
      status: currentUtilPct > 100 ? 'PENALTY_BREACH' : currentUtilPct > 90 ? 'WARNING' : 'COMPLIANT',
      penaltyAmount: currentUtilPct > 100 ? Math.round((marginUsed * (currentUtilPct - 100)) / 100 * 0.005) : 0
    }
  ];
}

/**
 * Checks for SEBI Index Circuit Breaker based on NIFTY move
 */
export function evaluateCircuitBreaker(
  currentNifty: number,
  niftyPrevClose: number = 23346.40
): CircuitBreakerState {
  const movePct = ((currentNifty - niftyPrevClose) / niftyPrevClose) * 100;
  const absMove = Math.abs(movePct);

  if (absMove >= 20.0) {
    return {
      isHalted: true,
      triggerLevel: 20,
      niftyMovePct: Number(movePct.toFixed(2)),
      haltStartTime: Date.now(),
      haltDurationMinutes: 60,
      remainingHaltSeconds: 3600,
      marketPhase: 'COOLING_HALT',
      reason: `SEBI Level 3 Circuit Breaker (20% Index Move: ${movePct.toFixed(2)}%). Trading halted for remainder of day.`
    };
  } else if (absMove >= 15.0) {
    return {
      isHalted: true,
      triggerLevel: 15,
      niftyMovePct: Number(movePct.toFixed(2)),
      haltStartTime: Date.now(),
      haltDurationMinutes: 45,
      remainingHaltSeconds: 2700,
      marketPhase: 'COOLING_HALT',
      reason: `SEBI Level 2 Circuit Breaker (15% Index Move: ${movePct.toFixed(2)}%). 45-minute cooling halt with pre-open auction.`
    };
  } else if (absMove >= 10.0) {
    return {
      isHalted: true,
      triggerLevel: 10,
      niftyMovePct: Number(movePct.toFixed(2)),
      haltStartTime: Date.now(),
      haltDurationMinutes: 45,
      remainingHaltSeconds: 2700,
      marketPhase: 'COOLING_HALT',
      reason: `SEBI Level 1 Circuit Breaker (10% Index Move: ${movePct.toFixed(2)}%). 45-minute exchange-wide cooling halt initiated.`
    };
  }

  return {
    isHalted: false,
    triggerLevel: 0,
    niftyMovePct: Number(movePct.toFixed(2)),
    haltStartTime: null,
    haltDurationMinutes: 0,
    remainingHaltSeconds: 0,
    marketPhase: 'OPEN',
    reason: 'Normal Market Operations'
  };
}

/**
 * TWAP (Time-Weighted Average Price) Slicing Engine
 * Slices large orders evenly across intervals to eliminate market impact.
 */
export interface TwapSlice {
  sliceNumber: number;
  totalSlices: number;
  qty: number;
  targetPrice: number;
  scheduledTimeStr: string;
  isExecuted: boolean;
}

export function generateTwapSlices(
  totalQty: number,
  slicesCount: number = 5,
  durationMinutes: number = 10,
  basePrice: number = 100
): TwapSlice[] {
  const slices: TwapSlice[] = [];
  const baseSliceQty = Math.floor(totalQty / slicesCount);
  let remaining = totalQty;
  const intervalMs = (durationMinutes * 60 * 1000) / slicesCount;
  const now = Date.now();

  for (let i = 0; i < slicesCount; i++) {
    const isLast = i === slicesCount - 1;
    const sliceQty = isLast ? remaining : baseSliceQty;
    remaining -= sliceQty;

    const time = new Date(now + i * intervalMs);
    slices.push({
      sliceNumber: i + 1,
      totalSlices: slicesCount,
      qty: sliceQty,
      targetPrice: basePrice,
      scheduledTimeStr: time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isExecuted: i === 0 // first slice fires immediately
    });
  }

  return slices;
}

/**
 * VWAP (Volume-Weighted Average Price) Slicing Engine
 * Weights slices along the institutional U-shaped intraday volume curve.
 */
export function generateVwapSlices(
  totalQty: number,
  slicesCount: number = 6,
  basePrice: number = 100
): TwapSlice[] {
  // Typical institutional intraday volume U-curve weights: Morning rush (25%), Midday lull (10-12%), Closing rally (28%)
  const uCurveWeights = [0.25, 0.15, 0.10, 0.10, 0.15, 0.25];
  const normalizedWeights = uCurveWeights.slice(0, slicesCount);
  const sumWeights = normalizedWeights.reduce((a, b) => a + b, 0);

  const slices: TwapSlice[] = [];
  let remaining = totalQty;
  const now = Date.now();
  const intervalMs = 2 * 60 * 1000; // 2 minutes per slice

  for (let i = 0; i < slicesCount; i++) {
    const weight = normalizedWeights[i] / sumWeights;
    const isLast = i === slicesCount - 1;
    const sliceQty = isLast ? remaining : Math.round(totalQty * weight);
    remaining -= sliceQty;

    const time = new Date(now + i * intervalMs);
    slices.push({
      sliceNumber: i + 1,
      totalSlices: slicesCount,
      qty: sliceQty,
      targetPrice: basePrice,
      scheduledTimeStr: time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isExecuted: i === 0
    });
  }

  return slices;
}
