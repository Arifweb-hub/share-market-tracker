import { Candle } from '../types/market';

/**
 * Calculate Simple Moving Average (SMA)
 */
export function calculateSMA(data: number[], period: number): number[] {
  const result: number[] = new Array(data.length).fill(NaN);
  if (data.length < period) return result;

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  result[period - 1] = sum / period;

  for (let i = period; i < data.length; i++) {
    sum += data[i] - data[i - period];
    result[i] = sum / period;
  }
  return result;
}

/**
 * Calculate Exponential Moving Average (EMA)
 */
export function calculateEMA(data: number[], period: number): number[] {
  const result: number[] = new Array(data.length).fill(NaN);
  if (data.length < period) return result;

  const multiplier = 2 / (period + 1);

  // Initial SMA as first EMA
  let initialSum = 0;
  for (let i = 0; i < period; i++) {
    initialSum += data[i];
  }
  let prevEMA = initialSum / period;
  result[period - 1] = prevEMA;

  for (let i = period; i < data.length; i++) {
    const currentEMA = (data[i] - prevEMA) * multiplier + prevEMA;
    result[i] = currentEMA;
    prevEMA = currentEMA;
  }
  return result;
}

/**
 * Calculate Relative Strength Index (RSI) - 14 default
 */
export function calculateRSI(closes: number[], period: number = 14): number[] {
  const result: number[] = new Array(closes.length).fill(NaN);
  if (closes.length <= period) return result;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  result[period] = avgLoss === 0 ? 100 : 100 - (100 / (1 + (avgGain / avgLoss)));

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      result[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      result[i] = 100 - (100 / (1 + rs));
    }
  }

  return result;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export interface MACDResult {
  macdLine: number[];
  signalLine: number[];
  histogram: number[];
}

export function calculateMACD(
  closes: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult {
  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);

  const macdLine: number[] = new Array(closes.length).fill(NaN);
  for (let i = 0; i < closes.length; i++) {
    if (!isNaN(fastEMA[i]) && !isNaN(slowEMA[i])) {
      macdLine[i] = fastEMA[i] - slowEMA[i];
    }
  }

  // Calculate signal line as EMA of macdLine
  const validMacdIndices = macdLine.map((val, idx) => ({ val, idx })).filter(item => !isNaN(item.val));
  const validMacd = validMacdIndices.map(item => item.val);
  const validSignal = calculateEMA(validMacd, signalPeriod);

  const signalLine: number[] = new Array(closes.length).fill(NaN);
  validMacdIndices.forEach((item, index) => {
    signalLine[item.idx] = validSignal[index];
  });

  const histogram: number[] = new Array(closes.length).fill(NaN);
  for (let i = 0; i < closes.length; i++) {
    if (!isNaN(macdLine[i]) && !isNaN(signalLine[i])) {
      histogram[i] = macdLine[i] - signalLine[i];
    }
  }

  return { macdLine, signalLine, histogram };
}

/**
 * Calculate VWAP (Intraday Volume-Weighted Average Price)
 */
export function calculateVWAP(candles: Candle[]): number[] {
  const result: number[] = new Array(candles.length).fill(NaN);
  let cumTypicalVolume = 0;
  let cumVolume = 0;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const typicalPrice = (c.high + c.low + c.close) / 3;
    const vol = c.volume > 0 ? c.volume : 1;

    cumTypicalVolume += typicalPrice * vol;
    cumVolume += vol;

    result[i] = cumTypicalVolume / cumVolume;
  }

  return result;
}

/**
 * Calculate Bollinger Bands
 */
export interface BollingerBands {
  upper: number[];
  middle: number[];
  lower: number[];
}

export function calculateBollingerBands(
  closes: number[],
  period: number = 20,
  stdDevMultiplier: number = 2
): BollingerBands {
  const middle = calculateSMA(closes, period);
  const upper: number[] = new Array(closes.length).fill(NaN);
  const lower: number[] = new Array(closes.length).fill(NaN);

  for (let i = period - 1; i < closes.length; i++) {
    let sumSquares = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sumSquares += Math.pow(closes[j] - middle[i], 2);
    }
    const stdDev = Math.sqrt(sumSquares / period);
    upper[i] = middle[i] + stdDevMultiplier * stdDev;
    lower[i] = middle[i] - stdDevMultiplier * stdDev;
  }

  return { upper, middle, lower };
}

/**
 * Calculate Average True Range (ATR)
 */
export function calculateATR(candles: Candle[], period: number = 14): number[] {
  const result: number[] = new Array(candles.length).fill(NaN);
  if (candles.length < 2) return result;

  const tr: number[] = [candles[0].high - candles[0].low];
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    const trueRange = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    tr.push(trueRange);
  }

  let atrSum = 0;
  for (let i = 0; i < period && i < tr.length; i++) {
    atrSum += tr[i];
  }
  result[period - 1] = atrSum / period;

  for (let i = period; i < tr.length; i++) {
    result[i] = (result[i - 1] * (period - 1) + tr[i]) / period;
  }

  return result;
}

/**
 * Calculate Pivot Points (Standard / Classic & Fibonacci)
 */
export interface PivotPoints {
  pivot: number;
  r1: number;
  r2: number;
  r3: number;
  s1: number;
  s2: number;
  s3: number;
  fibR1: number;
  fibR2: number;
  fibR3: number;
  fibS1: number;
  fibS2: number;
  fibS3: number;
}

export function calculatePivotPoints(high: number, low: number, close: number): PivotPoints {
  const pivot = (high + low + close) / 3;
  const range = high - low;

  // Classic
  const r1 = 2 * pivot - low;
  const s1 = 2 * pivot - high;
  const r2 = pivot + range;
  const s2 = pivot - range;
  const r3 = high + 2 * (pivot - low);
  const s3 = low - 2 * (high - pivot);

  // Fibonacci
  const fibR1 = pivot + 0.382 * range;
  const fibR2 = pivot + 0.618 * range;
  const fibR3 = pivot + 1.0 * range;
  const fibS1 = pivot - 0.382 * range;
  const fibS2 = pivot - 0.618 * range;
  const fibS3 = pivot - 1.0 * range;

  return { pivot, r1, r2, r3, s1, s2, s3, fibR1, fibR2, fibR3, fibS1, fibS2, fibS3 };
}

/**
 * Calculate Support and Resistance clusters from price action
 */
export function calculateSupportResistance(candles: Candle[]): { supports: number[]; resistances: number[] } {
  if (candles.length < 5) return { supports: [], resistances: [] };

  const swingLows: number[] = [];
  const swingHighs: number[] = [];

  for (let i = 2; i < candles.length - 2; i++) {
    const cur = candles[i];
    // Swing High
    if (
      cur.high > candles[i - 1].high &&
      cur.high > candles[i - 2].high &&
      cur.high > candles[i + 1].high &&
      cur.high > candles[i + 2].high
    ) {
      swingHighs.push(cur.high);
    }
    // Swing Low
    if (
      cur.low < candles[i - 1].low &&
      cur.low < candles[i - 2].low &&
      cur.low < candles[i + 1].low &&
      cur.low < candles[i + 2].low
    ) {
      swingLows.push(cur.low);
    }
  }

  const latestClose = candles[candles.length - 1].close;

  // Filter resistances above current price and supports below current price
  const resistances = Array.from(new Set(swingHighs.filter(h => h > latestClose)))
    .sort((a, b) => a - b)
    .slice(0, 3);

  const supports = Array.from(new Set(swingLows.filter(l => l < latestClose)))
    .sort((a, b) => b - a)
    .slice(0, 3);

  return { supports, resistances };
}
