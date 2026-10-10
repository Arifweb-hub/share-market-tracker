import { OptionGreeks, OptionItem, StrikeRow, OptionChainData, MarketIndexSymbol } from '../types/market';

/**
 * Standard Normal Cumulative Distribution Function approximation (Abramowitz & Stegun)
 */
export function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x) / Math.SQRT2;

  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Standard Normal Probability Density Function
 */
export function normalPDF(x: number): number {
  return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
}

/**
 * Calculate Black-Scholes Option Price and Greeks
 * @param S Current underlying spot price
 * @param K Strike price
 * @param T Time to expiration in years
 * @param r Risk-free interest rate (e.g., 0.065 for 6.5% RBI repo rate)
 * @param sigma Implied Volatility (e.g., 0.15 for 15%)
 * @param type 'CE' (Call) or 'PE' (Put)
 */
export function calculateBlackScholes(
  S: number,
  K: number,
  T: number,
  r: number = 0.065,
  sigma: number = 0.15,
  type: 'CE' | 'PE'
): { price: number; greeks: OptionGreeks } {
  // Prevent division by zero or negative time
  const time = Math.max(T, 0.0001);
  const vol = Math.max(sigma, 0.01);

  const sqrtT = Math.sqrt(time);
  const d1 = (Math.log(S / K) + (r + 0.5 * vol * vol) * time) / (vol * sqrtT);
  const d2 = d1 - vol * sqrtT;

  const nd1 = normalCDF(d1);
  const nd2 = normalCDF(d2);
  const nPrimeD1 = normalPDF(d1);
  const expRT = Math.exp(-r * time);

  let price = 0;
  let delta = 0;
  let thetaYearly = 0;

  if (type === 'CE') {
    price = S * nd1 - K * expRT * nd2;
    delta = nd1;
    thetaYearly = -(S * vol * nPrimeD1) / (2 * sqrtT) - r * K * expRT * nd2;
  } else {
    const nMinusD1 = normalCDF(-d1);
    const nMinusD2 = normalCDF(-d2);
    price = K * expRT * nMinusD2 - S * nMinusD1;
    delta = nd1 - 1; // Or -nMinusD1
    thetaYearly = -(S * vol * nPrimeD1) / (2 * sqrtT) + r * K * expRT * nMinusD2;
  }

  // Ensure minimum tick value (intrinsic value if ITM)
  const intrinsic = type === 'CE' ? Math.max(0, S - K) : Math.max(0, K - S);
  price = Math.max(price, intrinsic, 0.05);

  const gamma = nPrimeD1 / (S * vol * sqrtT);
  const vega = (S * sqrtT * nPrimeD1) / 100; // per 1% change in IV
  const theta = thetaYearly / 365; // 1-day time decay in INR

  return {
    price: Number(price.toFixed(2)),
    greeks: {
      delta: Number(delta.toFixed(3)),
      gamma: Number(gamma.toFixed(5)),
      theta: Number(theta.toFixed(2)),
      vega: Number(vega.toFixed(2)),
    },
  };
}

/**
 * Generate full option chain for NIFTY or SENSEX around spot
 */
export function generateOptionChain(
  symbol: MarketIndexSymbol,
  spotPrice: number,
  baseIV: number = 14.5,
  daysToExpiry: number = 4
): OptionChainData {
  const step = symbol === 'NIFTY' ? 50 : 100;
  const atmStrike = Math.round(spotPrice / step) * step;
  const T = Math.max(daysToExpiry, 0.2) / 365;
  const r = 0.065; // 6.5% Indian risk-free rate

  // Expiry date formatting
  const expDate = new Date();
  expDate.setDate(expDate.getDate() + daysToExpiry);
  const formattedExpiry = expDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const nextWeekExp = new Date(expDate);
  nextWeekExp.setDate(nextWeekExp.getDate() + 7);
  const monthExp = new Date(expDate);
  monthExp.setDate(monthExp.getDate() + 21);

  const availableExpiries = [
    formattedExpiry,
    nextWeekExp.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    monthExp.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
  ];

  // Generate strikes from ATM - 20 steps to ATM + 20 steps
  const strikesCount = 18;
  const strikes: StrikeRow[] = [];

  let totalCallOI = 0;
  let totalPutOI = 0;
  let totalCallVol = 0;
  let totalPutVol = 0;

  for (let i = -strikesCount; i <= strikesCount; i++) {
    const strike = atmStrike + i * step;
    const isATM = strike === atmStrike;
    const moneyness = strike / spotPrice;

    // Volatility smile: OTM Puts have higher IV (skew), OTM Calls have slight uptick
    let callIV = baseIV + Math.max(0, (moneyness - 1) * 8);
    let putIV = baseIV + Math.max(0, (1 - moneyness) * 14);

    callIV = Math.max(10, Math.min(45, callIV));
    putIV = Math.max(10, Math.min(45, putIV));

    const callBS = calculateBlackScholes(spotPrice, strike, T, r, callIV / 100, 'CE');
    const putBS = calculateBlackScholes(spotPrice, strike, T, r, putIV / 100, 'PE');

    // Realistic Open Interest model: Higher OI near ATM and key round levels
    const distanceNorm = Math.abs(strike - atmStrike) / (step * 5);
    const roundLevelBoost = strike % (step * 5) === 0 ? 1.4 : 1.0;
    const baseOI = Math.round(Math.max(12000, 850000 * Math.exp(-0.5 * distanceNorm * distanceNorm) * roundLevelBoost));

    // Skew OI slightly: Calls heavy above ATM, Puts heavy below ATM (support/resistance)
    const callOI = Math.round(baseOI * (strike >= atmStrike ? 1.25 : 0.75));
    const putOI = Math.round(baseOI * (strike <= atmStrike ? 1.3 : 0.7));

    const callChgOI = Math.round(callOI * 0.08 * (strike > atmStrike ? 1 : -0.5));
    const putChgOI = Math.round(putOI * 0.09 * (strike < atmStrike ? 1 : -0.4));

    const callVol = Math.round(callOI * 1.8);
    const putVol = Math.round(putOI * 1.7);

    totalCallOI += callOI;
    totalPutOI += putOI;
    totalCallVol += callVol;
    totalPutVol += putVol;

    // Bid/Ask spread modeling with realistic market depth
    const callSpread = Math.max(0.05, Number((callBS.price * 0.008).toFixed(2)));
    const putSpread = Math.max(0.05, Number((putBS.price * 0.008).toFixed(2)));

    const callItem: OptionItem = {
      strike,
      optionType: 'CE',
      ltp: callBS.price,
      change: Number((callBS.price * 0.04 * (spotPrice >= strike ? 1 : -1)).toFixed(2)),
      changePercent: Number(((callBS.price * 0.04) / Math.max(1, callBS.price) * 100).toFixed(2)),
      bid: Number(Math.max(0.05, callBS.price - callSpread).toFixed(2)),
      ask: Number((callBS.price + callSpread).toFixed(2)),
      volume: callVol,
      openInterest: callOI,
      changeInOI: callChgOI,
      iv: Number(callIV.toFixed(2)),
      greeks: callBS.greeks,
      inTheMoney: spotPrice > strike,
    };

    const putItem: OptionItem = {
      strike,
      optionType: 'PE',
      ltp: putBS.price,
      change: Number((putBS.price * 0.04 * (spotPrice <= strike ? 1 : -1)).toFixed(2)),
      changePercent: Number(((putBS.price * 0.04) / Math.max(1, putBS.price) * 100).toFixed(2)),
      bid: Number(Math.max(0.05, putBS.price - putSpread).toFixed(2)),
      ask: Number((putBS.price + putSpread).toFixed(2)),
      volume: putVol,
      openInterest: putOI,
      changeInOI: putChgOI,
      iv: Number(putIV.toFixed(2)),
      greeks: putBS.greeks,
      inTheMoney: spotPrice < strike,
    };

    strikes.push({
      strike,
      call: callItem,
      put: putItem,
      isATM,
      distanceFromSpot: strike - spotPrice,
    });
  }

  // Calculate Max Pain: Strike with minimum cumulative payout for option buyers
  let minLoss = Infinity;
  let maxPainStrike = atmStrike;

  for (const s of strikes) {
    let currentLoss = 0;
    for (const other of strikes) {
      // Call buyers gain if spot > other.strike
      if (s.strike > other.strike) {
        currentLoss += (s.strike - other.strike) * other.call.openInterest;
      }
      // Put buyers gain if spot < other.strike
      if (s.strike < other.strike) {
        currentLoss += (other.strike - s.strike) * other.put.openInterest;
      }
    }
    if (currentLoss < minLoss) {
      minLoss = currentLoss;
      maxPainStrike = s.strike;
    }
  }

  const pcrOI = totalCallOI > 0 ? Number((totalPutOI / totalCallOI).toFixed(2)) : 1.0;
  const pcrVolume = totalCallVol > 0 ? Number((totalPutVol / totalCallVol).toFixed(2)) : 1.0;

  return {
    symbol,
    underlyingPrice: spotPrice,
    expiryDate: formattedExpiry,
    availableExpiries,
    strikes,
    atmStrike,
    pcrOI,
    pcrVolume,
    maxPain: maxPainStrike,
    totalCallOI,
    totalPutOI,
    lastUpdated: new Date().toLocaleTimeString('en-IN', { hour12: false }),
  };
}
