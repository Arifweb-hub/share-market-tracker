import React, { useState } from 'react';
import { Candle } from '../types/market';
import { Eye, EyeOff, Sliders } from 'lucide-react';
import {
  calculateEMA,
  calculateSMA,
  calculateRSI,
  calculateMACD,
  calculateVWAP,
  calculateBollingerBands,
  calculateATR,
  calculatePivotPoints,
  calculateSupportResistance,
} from '../utils/indicators';

interface TechnicalTableProps {
  candles: Candle[];
  spotPrice: number;
}

export const TechnicalIndicatorsTable: React.FC<TechnicalTableProps> = ({ candles, spotPrice }) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  if (candles.length < 20) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-slate-400">
        Loading historical indicators...
      </div>
    );
  }

  const closes = candles.map(c => c.close);
  const curClose = closes[closes.length - 1];

  const ema9 = calculateEMA(closes, 9);
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);
  const ema200 = calculateEMA(closes, 200);

  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);

  const rsi = calculateRSI(closes, 14);
  const curRSI = rsi[rsi.length - 1];

  const macd = calculateMACD(closes);
  const curMacdHist = macd.histogram[macd.histogram.length - 1];

  const vwap = calculateVWAP(candles);
  const curVWAP = vwap[vwap.length - 1];

  const bb = calculateBollingerBands(closes, 20, 2);
  const curBBUpper = bb.upper[bb.upper.length - 1];
  const curBBLower = bb.lower[bb.lower.length - 1];

  const atr = calculateATR(candles, 14);
  const curATR = atr[atr.length - 1];

  const highDay = Math.max(...candles.slice(-20).map(c => c.high));
  const lowDay = Math.min(...candles.slice(-20).map(c => c.low));
  const pivots = calculatePivotPoints(highDay, lowDay, curClose);
  const sr = calculateSupportResistance(candles);

  const getStatus = (condBull: boolean, condBear: boolean) => {
    if (condBull) return { text: 'Bullish', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
    if (condBear) return { text: 'Bearish', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30' };
    return { text: 'Neutral', color: 'bg-slate-700/40 text-slate-300 border-slate-700/60' };
  };

  const indicators = [
    {
      name: 'RSI (14)',
      value: curRSI.toFixed(1),
      status: getStatus(curRSI > 55, curRSI < 45),
      detail: curRSI > 70 ? 'Overbought' : curRSI < 30 ? 'Oversold' : 'Momentum Normal',
    },
    {
      name: 'MACD (12, 26, 9)',
      value: (curMacdHist || 0).toFixed(2),
      status: getStatus(curMacdHist > 0, curMacdHist < 0),
      detail: curMacdHist > 0 ? 'Histogram Positive' : 'Histogram Negative',
    },
    {
      name: 'Intraday VWAP',
      value: curVWAP.toFixed(1),
      status: getStatus(curClose > curVWAP, curClose < curVWAP),
      detail: curClose > curVWAP ? 'Trading Above VWAP' : 'Trading Below VWAP',
    },
    {
      name: 'EMA 20 vs EMA 50',
      value: `${(ema20[ema20.length - 1] || 0).toFixed(0)} / ${(ema50[ema50.length - 1] || 0).toFixed(0)}`,
      status: getStatus(
        (ema20[ema20.length - 1] || 0) > (ema50[ema50.length - 1] || 0),
        (ema20[ema20.length - 1] || 0) < (ema50[ema50.length - 1] || 0)
      ),
      detail: 'Short vs Medium Trend',
    },
    {
      name: 'Bollinger Bands (20, 2)',
      value: `${(curBBLower || 0).toFixed(0)} - ${(curBBUpper || 0).toFixed(0)}`,
      status: getStatus(curClose > (bb.middle[bb.middle.length - 1] || 0), curClose < (bb.middle[bb.middle.length - 1] || 0)),
      detail: 'Volatility Envelope',
    },
    {
      name: 'ATR (14)',
      value: (curATR || 0).toFixed(1),
      status: { text: 'Volatility', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
      detail: 'Average True Range',
    },
  ];

  if (isCollapsed) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-200">
            Multi-Factor Technical Indicators & Pivots (Spot: ₹{spotPrice.toLocaleString('en-IN')})
          </span>
          <span className="text-[10px] text-slate-500 font-mono">• Hidden</span>
        </div>
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 transition-colors cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Show Indicators</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <h3 className="text-xs sm:text-sm font-bold text-slate-100">
          Multi-Factor Technical Indicators & Pivots
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-mono">
            Spot: ₹{spotPrice.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
          </span>
          <button
            onClick={() => setIsCollapsed(true)}
            className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            title="Hide / Minimize Indicators"
          >
            <EyeOff className="w-3 h-3 text-slate-400" />
            <span className="hidden sm:inline">Hide</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* Core Indicators */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            Trend & Momentum Oscillators
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg divide-y divide-slate-800/60 font-mono">
            {indicators.map((ind, i) => (
              <div key={i} className="p-2 flex items-center justify-between">
                <div>
                  <span className="font-sans font-medium text-slate-200 block text-[11px]">{ind.name}</span>
                  <span className="text-[10px] text-slate-400">{ind.detail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-100 font-bold">{ind.value}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-sans font-semibold ${ind.status.color}`}>
                    {ind.status.text}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pivot Points Matrix */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            Classic & Fibonacci Pivot Levels
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 space-y-2 font-mono text-[11px]">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-rose-950/30 border border-rose-900/30 p-1.5 rounded">
                <span className="text-[10px] text-rose-400 block font-sans">Resistance 2 (R2)</span>
                <span className="text-rose-300 font-bold">{pivots.r2.toFixed(0)}</span>
              </div>
              <div className="bg-rose-950/20 border border-rose-900/30 p-1.5 rounded">
                <span className="text-[10px] text-rose-400 block font-sans">Resistance 1 (R1)</span>
                <span className="text-rose-300 font-bold">{pivots.r1.toFixed(0)}</span>
              </div>
              <div className="bg-sky-950/30 border border-sky-900/30 p-1.5 rounded">
                <span className="text-[10px] text-sky-400 block font-sans">Pivot Point (PP)</span>
                <span className="text-sky-300 font-bold">{pivots.pivot.toFixed(0)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-emerald-950/20 border border-emerald-900/30 p-1.5 rounded">
                <span className="text-[10px] text-emerald-400 block font-sans">Support 1 (S1)</span>
                <span className="text-emerald-300 font-bold">{pivots.s1.toFixed(0)}</span>
              </div>
              <div className="bg-emerald-950/30 border border-emerald-900/30 p-1.5 rounded">
                <span className="text-[10px] text-emerald-400 block font-sans">Support 2 (S2)</span>
                <span className="text-emerald-300 font-bold">{pivots.s2.toFixed(0)}</span>
              </div>
            </div>

            {/* Price Action Clusters */}
            <div className="pt-1 border-t border-slate-800 text-[10px] font-sans text-slate-400 flex items-center justify-between">
              <span>Dynamic Swing High Resistance:</span>
              <span className="font-mono text-rose-400 font-semibold">{sr.resistances[0] ? sr.resistances[0].toFixed(0) : 'None near'}</span>
            </div>
            <div className="text-[10px] font-sans text-slate-400 flex items-center justify-between">
              <span>Dynamic Swing Low Support:</span>
              <span className="font-mono text-emerald-400 font-semibold">{sr.supports[0] ? sr.supports[0].toFixed(0) : 'None near'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
