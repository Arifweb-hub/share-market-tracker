import React, { useState, useMemo } from 'react';
import { Candle, TradingSignal } from '../types/market';
import {
  calculateEMA,
  calculateSMA,
  calculateVWAP,
  calculateBollingerBands,
  calculateRSI,
  calculateMACD,
  calculateSupportResistance,
} from '../utils/indicators';
import { BarChart2, TrendingUp, Eye, EyeOff, Layers } from 'lucide-react';

interface InteractiveChartProps {
  candles: Candle[];
  symbol: string;
  signal?: TradingSignal | null;
  interval: string;
  onIntervalChange: (interval: string) => void;
  isLoading: boolean;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  candles,
  symbol,
  signal,
  interval,
  onIntervalChange,
  isLoading,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');
  const [showEMA, setShowEMA] = useState<boolean>(true);
  const [showVWAP, setShowVWAP] = useState<boolean>(true);
  const [showBollinger, setShowBollinger] = useState<boolean>(false);
  const [showSR, setShowSR] = useState<boolean>(true);
  const [activeSubChart, setActiveSubChart] = useState<'volume' | 'rsi' | 'macd'>('volume');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Compute indicators
  const closes = useMemo(() => candles.map(c => c.close), [candles]);

  const ema9 = useMemo(() => (showEMA ? calculateEMA(closes, 9) : []), [closes, showEMA]);
  const ema20 = useMemo(() => (showEMA ? calculateEMA(closes, 20) : []), [closes, showEMA]);
  const ema50 = useMemo(() => (showEMA ? calculateEMA(closes, 50) : []), [closes, showEMA]);
  const vwap = useMemo(() => (showVWAP ? calculateVWAP(candles) : []), [candles, showVWAP]);
  const bollinger = useMemo(
    () => (showBollinger ? calculateBollingerBands(closes, 20, 2) : null),
    [closes, showBollinger]
  );
  const rsi = useMemo(() => calculateRSI(closes, 14), [closes]);
  const macd = useMemo(() => calculateMACD(closes, 12, 26, 9), [closes]);
  const srLevels = useMemo(() => calculateSupportResistance(candles), [candles]);

  // Dimension & Scaling constants
  const width = 860;
  const mainHeight = 320;
  const subHeight = 90;
  const padding = { top: 20, right: 65, bottom: 25, left: 15 };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = mainHeight - padding.top - padding.bottom;

  // Calculate Price Range
  const { minPrice, maxPrice, priceRange } = useMemo(() => {
    if (candles.length === 0) return { minPrice: 100, maxPrice: 200, priceRange: 100 };
    let min = Math.min(...candles.map(c => c.low));
    let max = Math.max(...candles.map(c => c.high));

    // Pad range by 3% for clean margins
    const pad = (max - min) * 0.04 || 5;
    min -= pad;
    max += pad;
    return { minPrice: min, maxPrice: max, priceRange: max - min };
  }, [candles]);

  // Price to Y coordinate
  const getY = (val: number) => {
    if (priceRange === 0) return mainHeight / 2;
    return padding.top + plotHeight - ((val - minPrice) / priceRange) * plotHeight;
  };

  // Candle Index to X coordinate
  const count = candles.length;
  const candleStep = count > 1 ? plotWidth / (count - 1) : plotWidth;
  const getX = (idx: number) => padding.left + idx * candleStep;
  const candleBarWidth = Math.max(2, Math.min(10, candleStep * 0.65));

  // Current Hovered Candle
  const activeCandle = hoverIndex !== null && candles[hoverIndex] ? candles[hoverIndex] : candles[count - 1];

  // Volume scale
  const maxVol = useMemo(() => {
    if (candles.length === 0) return 1;
    return Math.max(...candles.map(c => c.volume)) * 1.15;
  }, [candles]);

  // Subchart Y calculation
  const getSubY = (val: number, min: number, max: number) => {
    const range = max - min || 1;
    return subHeight - 15 - ((val - min) / range) * (subHeight - 25);
  };

  if (isCollapsed) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <BarChart2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-200">
            {symbol} Interactive Candlestick Chart ({interval})
          </span>
          <span className="text-[10px] text-slate-500 font-mono">• Hidden</span>
        </div>
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 transition-colors cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Show Chart</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-sm flex flex-col gap-3">
      {/* Chart Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 text-xs">
            {['5m', '15m', '1h', '1d'].map(tf => (
              <button
                key={tf}
                onClick={() => onIntervalChange(tf)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  interval === tf
                    ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 text-xs">
            <button
              onClick={() => setChartType('candle')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                chartType === 'candle' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Candles
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                chartType === 'line' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Line
            </button>
          </div>

          {/* Indicator Toggles */}
          <div className="hidden lg:flex items-center gap-1.5 text-[11px]">
            <button
              onClick={() => setShowEMA(!showEMA)}
              className={`px-2 py-1 rounded border transition-colors ${
                showEMA
                  ? 'bg-blue-500/15 border-blue-500/30 text-blue-400 font-medium'
                  : 'bg-slate-800/40 border-slate-700/40 text-slate-500 hover:text-slate-300'
              }`}
            >
              EMA 9/20/50
            </button>
            <button
              onClick={() => setShowVWAP(!showVWAP)}
              className={`px-2 py-1 rounded border transition-colors ${
                showVWAP
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 font-medium'
                  : 'bg-slate-800/40 border-slate-700/40 text-slate-500 hover:text-slate-300'
              }`}
            >
              VWAP
            </button>
            <button
              onClick={() => setShowBollinger(!showBollinger)}
              className={`px-2 py-1 rounded border transition-colors ${
                showBollinger
                  ? 'bg-purple-500/15 border-purple-500/30 text-purple-400 font-medium'
                  : 'bg-slate-800/40 border-slate-700/40 text-slate-500 hover:text-slate-300'
              }`}
            >
              Bollinger Bands
            </button>
            <button
              onClick={() => setShowSR(!showSR)}
              className={`px-2 py-1 rounded border transition-colors ${
                showSR
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 font-medium'
                  : 'bg-slate-800/40 border-slate-700/40 text-slate-500 hover:text-slate-300'
              }`}
            >
              S/R Levels
            </button>
          </div>
        </div>

        {/* Sub-panel selector */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-slate-400 text-[11px] mr-1 hidden sm:inline">Indicator:</span>
          {(['volume', 'rsi', 'macd'] as const).map(panel => (
            <button
              key={panel}
              onClick={() => setActiveSubChart(panel)}
              className={`px-2 py-1 rounded text-[11px] font-medium uppercase transition-colors ${
                activeSubChart === panel
                  ? 'bg-slate-700 text-slate-100 border border-slate-600'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {panel}
            </button>
          ))}

          <button
            onClick={() => setIsCollapsed(true)}
            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer ml-1"
            title="Hide / Minimize Chart"
          >
            <EyeOff className="w-3 h-3 text-slate-400" />
            <span className="hidden sm:inline">Hide</span>
          </button>
        </div>
      </div>

      {/* Hover Information Bar */}
      {activeCandle && (
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/70 text-slate-300">
          <div className="text-slate-400">
            {new Date(activeCandle.time * 1000).toLocaleString('en-IN', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          <div>O: <span className="font-semibold text-slate-100">{activeCandle.open.toFixed(2)}</span></div>
          <div>H: <span className="font-semibold text-slate-100">{activeCandle.high.toFixed(2)}</span></div>
          <div>L: <span className="font-semibold text-slate-100">{activeCandle.low.toFixed(2)}</span></div>
          <div>
            C:{' '}
            <span
              className={`font-semibold ${
                activeCandle.close >= activeCandle.open ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {activeCandle.close.toFixed(2)}
            </span>
          </div>
          <div className="hidden sm:inline">
            Vol: <span className="text-slate-300">{activeCandle.volume.toLocaleString()}</span>
          </div>
          {showVWAP && vwap[hoverIndex !== null ? hoverIndex : count - 1] && (
            <div className="text-amber-400 hidden md:inline">
              VWAP: {(vwap[hoverIndex !== null ? hoverIndex : count - 1] || 0).toFixed(1)}
            </div>
          )}
          {showEMA && ema20[hoverIndex !== null ? hoverIndex : count - 1] && (
            <div className="text-blue-400 hidden md:inline">
              EMA20: {(ema20[hoverIndex !== null ? hoverIndex : count - 1] || 0).toFixed(1)}
            </div>
          )}
        </div>
      )}

      {/* SVG Chart Container */}
      <div className="relative w-full overflow-hidden select-none">
        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center z-20">
            <div className="text-xs text-emerald-400 font-mono animate-pulse">Loading live market candles...</div>
          </div>
        )}

        <svg
          viewBox={`0 0 ${width} ${mainHeight + subHeight}`}
          className="w-full h-auto cursor-crosshair"
          onMouseMove={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = (e.clientX - rect.left) / rect.width * width - padding.left;
            const idx = Math.round(relX / candleStep);
            if (idx >= 0 && idx < count) {
              setHoverIndex(idx);
            }
          }}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="bullGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="bbGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.2, 0.4, 0.6, 0.8].map(ratio => {
            const y = padding.top + plotHeight * ratio;
            const price = maxPrice - priceRange * ratio;
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#334155"
                  strokeDasharray="3 3"
                  strokeOpacity="0.4"
                />
                <text
                  x={width - padding.right + 6}
                  y={y + 4}
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {price.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Support and Resistance Horizontal Lines */}
          {showSR && srLevels.resistances.map((res, i) => (
            <g key={`res_${i}`}>
              <line
                x1={padding.left}
                y1={getY(res)}
                x2={width - padding.right}
                y2={getY(res)}
                stroke="#f43f5e"
                strokeWidth="1.2"
                strokeDasharray="4 2"
                strokeOpacity="0.75"
              />
              <text x={padding.left + 5} y={getY(res) - 3} fill="#f43f5e" fontSize="9" fontWeight="bold">
                R: {res.toFixed(0)}
              </text>
            </g>
          ))}

          {showSR && srLevels.supports.map((sup, i) => (
            <g key={`sup_${i}`}>
              <line
                x1={padding.left}
                y1={getY(sup)}
                x2={width - padding.right}
                y2={getY(sup)}
                stroke="#10b981"
                strokeWidth="1.2"
                strokeDasharray="4 2"
                strokeOpacity="0.75"
              />
              <text x={padding.left + 5} y={getY(sup) + 11} fill="#10b981" fontSize="9" fontWeight="bold">
                S: {sup.toFixed(0)}
              </text>
            </g>
          ))}

          {/* Bollinger Bands Overlay */}
          {showBollinger && bollinger && (
            <>
              <path
                d={candles.map((_, i) => {
                  const upperY = getY(bollinger.upper[i] || candles[i].close);
                  return `${i === 0 ? 'M' : 'L'} ${getX(i)} ${upperY}`;
                }).join(' ')}
                fill="none"
                stroke="#a855f7"
                strokeWidth="1"
                strokeOpacity="0.7"
              />
              <path
                d={candles.map((_, i) => {
                  const lowerY = getY(bollinger.lower[i] || candles[i].close);
                  return `${i === 0 ? 'M' : 'L'} ${getX(i)} ${lowerY}`;
                }).join(' ')}
                fill="none"
                stroke="#a855f7"
                strokeWidth="1"
                strokeOpacity="0.7"
              />
            </>
          )}

          {/* VWAP Line Overlay */}
          {showVWAP && vwap.length > 0 && (
            <path
              d={candles.map((_, i) => {
                const val = vwap[i];
                if (isNaN(val)) return '';
                return `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(val)}`;
              }).filter(Boolean).join(' ')}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.6"
              strokeOpacity="0.85"
            />
          )}

          {/* EMA Lines Overlay */}
          {showEMA && ema20.length > 0 && (
            <path
              d={candles.map((_, i) => {
                const val = ema20[i];
                if (isNaN(val)) return '';
                return `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(val)}`;
              }).filter(Boolean).join(' ')}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.5"
            />
          )}

          {/* Candlesticks or Line */}
          {chartType === 'candle' ? (
            candles.map((c, i) => {
              const x = getX(i);
              const isBull = c.close >= c.open;
              const color = isBull ? '#10b981' : '#f43f5e';
              const highY = getY(c.high);
              const lowY = getY(c.low);
              const openY = getY(c.open);
              const closeY = getY(c.close);
              const bodyTop = Math.min(openY, closeY);
              const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));

              return (
                <g key={i}>
                  {/* Upper & lower wick */}
                  <line
                    x1={x}
                    y1={highY}
                    x2={x}
                    y2={lowY}
                    stroke={color}
                    strokeWidth="1.2"
                  />
                  {/* Candle Body */}
                  <rect
                    x={x - candleBarWidth / 2}
                    y={bodyTop}
                    width={candleBarWidth}
                    height={bodyHeight}
                    fill={color}
                    rx="1"
                  />
                </g>
              );
            })
          ) : (
            <path
              d={candles.map((c, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(c.close)}`).join(' ')}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
            />
          )}

          {/* Signal Level Markers (Entry, Stop Loss, Target 1) */}
          {signal && signal.action !== 'NO TRADE' && (
            <g>
              {/* Stop loss line */}
              <line
                x1={padding.left}
                y1={getY(signal.underlyingPrice * (signal.action.includes('CALL') ? 0.995 : 1.005))}
                x2={width - padding.right}
                y2={getY(signal.underlyingPrice * (signal.action.includes('CALL') ? 0.995 : 1.005))}
                stroke="#f43f5e"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <text
                x={width - padding.right - 80}
                y={getY(signal.underlyingPrice * (signal.action.includes('CALL') ? 0.995 : 1.005)) - 4}
                fill="#f43f5e"
                fontSize="9"
                fontWeight="bold"
              >
                SL Trigger
              </text>
            </g>
          )}

          {/* Crosshair Hover Lines */}
          {hoverIndex !== null && hoverIndex < count && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={padding.top}
                x2={getX(hoverIndex)}
                y2={mainHeight + subHeight - 15}
                stroke="#cbd5e1"
                strokeWidth="1"
                strokeDasharray="2 2"
                strokeOpacity="0.6"
              />
              <line
                x1={padding.left}
                y1={getY(candles[hoverIndex].close)}
                x2={width - padding.right}
                y2={getY(candles[hoverIndex].close)}
                stroke="#cbd5e1"
                strokeWidth="1"
                strokeDasharray="2 2"
                strokeOpacity="0.6"
              />
              <rect
                x={width - padding.right}
                y={getY(candles[hoverIndex].close) - 9}
                width="62"
                height="18"
                fill="#1e293b"
                stroke="#475569"
                rx="3"
              />
              <text
                x={width - padding.right + 4}
                y={getY(candles[hoverIndex].close) + 3}
                fill="#f8fafc"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {candles[hoverIndex].close.toFixed(2)}
              </text>
            </g>
          )}

          {/* Divider between Main Chart and Sub Chart */}
          <line
            x1={padding.left}
            y1={mainHeight}
            x2={width - padding.right}
            y2={mainHeight}
            stroke="#334155"
            strokeWidth="1"
          />

          {/* Subchart rendering (Volume, RSI, MACD) */}
          <g transform={`translate(0, ${mainHeight})`}>
            {/* Subchart Title */}
            <text x={padding.left + 5} y="15" fill="#94a3b8" fontSize="10" fontWeight="bold">
              {activeSubChart === 'volume' ? 'VOLUME' : activeSubChart === 'rsi' ? 'RSI (14)' : 'MACD (12, 26, 9)'}
            </text>

            {activeSubChart === 'volume' &&
              candles.map((c, i) => {
                const x = getX(i);
                const volHeight = Math.max(1, (c.volume / maxVol) * (subHeight - 25));
                const y = subHeight - 10 - volHeight;
                const isBull = c.close >= c.open;
                return (
                  <rect
                    key={i}
                    x={x - candleBarWidth / 2}
                    y={y}
                    width={candleBarWidth}
                    height={volHeight}
                    fill={isBull ? '#10b981' : '#f43f5e'}
                    fillOpacity="0.65"
                  />
                );
              })}

            {activeSubChart === 'rsi' && (
              <>
                {/* 70 / 30 reference lines */}
                <line
                  x1={padding.left}
                  y1={getSubY(70, 0, 100)}
                  x2={width - padding.right}
                  y2={getSubY(70, 0, 100)}
                  stroke="#f43f5e"
                  strokeDasharray="2 2"
                  strokeOpacity="0.5"
                />
                <line
                  x1={padding.left}
                  y1={getSubY(30, 0, 100)}
                  x2={width - padding.right}
                  y2={getSubY(30, 0, 100)}
                  stroke="#10b981"
                  strokeDasharray="2 2"
                  strokeOpacity="0.5"
                />
                <text x={width - padding.right + 4} y={getSubY(70, 0, 100) + 3} fill="#f43f5e" fontSize="9">
                  70
                </text>
                <text x={width - padding.right + 4} y={getSubY(30, 0, 100) + 3} fill="#10b981" fontSize="9">
                  30
                </text>
                {/* RSI curve */}
                <path
                  d={candles.map((_, i) => {
                    const r = rsi[i];
                    if (isNaN(r)) return '';
                    return `${i === 14 ? 'M' : 'L'} ${getX(i)} ${getSubY(r, 0, 100)}`;
                  }).filter(Boolean).join(' ')}
                  fill="none"
                  stroke="#eab308"
                  strokeWidth="1.6"
                />
              </>
            )}

            {activeSubChart === 'macd' && (
              <>
                {/* Zero line */}
                <line
                  x1={padding.left}
                  y1={subHeight / 2}
                  x2={width - padding.right}
                  y2={subHeight / 2}
                  stroke="#475569"
                  strokeDasharray="2 2"
                />
                {/* MACD Histogram */}
                {candles.map((_, i) => {
                  const h = macd.histogram[i];
                  if (isNaN(h)) return null;
                  const x = getX(i);
                  const barH = Math.min(25, Math.abs(h) * 1.5);
                  const y = h >= 0 ? subHeight / 2 - barH : subHeight / 2;
                  return (
                    <rect
                      key={i}
                      x={x - candleBarWidth / 2}
                      y={y}
                      width={candleBarWidth}
                      height={Math.max(1, barH)}
                      fill={h >= 0 ? '#10b981' : '#f43f5e'}
                      fillOpacity="0.8"
                    />
                  );
                })}
              </>
            )}
          </g>
        </svg>
      </div>

      {/* Chart Legend */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
        <div className="flex items-center gap-3">
          {showEMA && (
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-1 bg-sky-400 rounded-full" />
              <span>EMA 20</span>
            </div>
          )}
          {showVWAP && (
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-1 bg-amber-400 rounded-full" />
              <span>VWAP</span>
            </div>
          )}
          {showBollinger && (
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-1 bg-purple-400 rounded-full" />
              <span>Bollinger (20, 2)</span>
            </div>
          )}
        </div>
        <div className="text-slate-500 font-mono text-[10px]">
          Timeframe: {interval} • Candles: {count} • Real-time Feeds
        </div>
      </div>
    </div>
  );
};
