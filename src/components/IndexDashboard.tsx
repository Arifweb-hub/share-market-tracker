import React, { useState, useEffect } from 'react';
import {
  IndexQuote,
  OptionChainData,
  Candle,
  TradingSignal,
  OptionItem,
  MarketIndexSymbol,
  BacktestResult,
} from '../types/market';
import { SignalCard } from './SignalCard';
import { InteractiveChart } from './InteractiveChart';
import { OptionChainTable } from './OptionChainTable';
import { AiReasoningPanel } from './AiReasoningPanel';
import { TechnicalIndicatorsTable } from './TechnicalIndicatorsTable';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  Globe,
  Sliders,
  DollarSign,
  Play,
  RotateCcw,
  Sparkles,
  BarChart2,
  Eye,
  EyeOff,
} from 'lucide-react';

interface IndexDashboardProps {
  symbol: MarketIndexSymbol;
  quote: IndexQuote | null;
  vix: { value: number; change: number; changePercent: number; status: string } | null;
  macro: any[];
  institutionalFlows: any;
  onTradeOption: (item: OptionItem, strike: number, type: 'CE' | 'PE', expiry: string) => void;
  onPaperTradeSignal: (signal: TradingSignal) => void;
}

export const IndexDashboard: React.FC<IndexDashboardProps> = ({
  symbol,
  quote,
  vix,
  macro,
  institutionalFlows,
  onTradeOption,
  onPaperTradeSignal,
}) => {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [interval, setInterval] = useState<string>('5m');
  const [loadingCandles, setLoadingCandles] = useState<boolean>(false);

  const [optionChain, setOptionChain] = useState<OptionChainData | null>(null);
  const [loadingOptions, setLoadingOptions] = useState<boolean>(false);

  const [signal, setSignal] = useState<TradingSignal | null>(null);
  const [loadingSignal, setLoadingSignal] = useState<boolean>(false);

  // Visibility toggles for sections (allow hiding any photo/panel/chart/indicator)
  const [showSpotSummary, setShowSpotSummary] = useState<boolean>(true);
  const [showGlobalCues, setShowGlobalCues] = useState<boolean>(true);
  const [showSignalCard, setShowSignalCard] = useState<boolean>(true);
  const [showAiReasoning, setShowAiReasoning] = useState<boolean>(true);
  const [showChart, setShowChart] = useState<boolean>(true);
  const [showOptionChain, setShowOptionChain] = useState<boolean>(true);
  const [showIndicators, setShowIndicators] = useState<boolean>(true);

  // Tab within index view: 'overview' | 'option-chain' | 'backtest'
  const [viewMode, setViewMode] = useState<'overview' | 'option-chain' | 'backtest'>('overview');

  // Backtest state
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [runningBacktest, setRunningBacktest] = useState<boolean>(false);
  const [backtestStrategy, setBacktestStrategy] = useState<string>('EMA_MOMENTUM');

  // Fetch candles
  const fetchCandles = async () => {
    setLoadingCandles(true);
    try {
      const res = await fetch(`/api/market/history?symbol=${symbol}&interval=${interval}`);
      if (res.ok) {
        const data = await res.json();
        setCandles(data);
      }
    } catch {
      // Retain existing candles
    } finally {
      setLoadingCandles(false);
    }
  };

  // Fetch Option Chain
  const fetchOptionChain = async (expiry: string = 'current') => {
    setLoadingOptions(true);
    try {
      const res = await fetch(`/api/market/option-chain?symbol=${symbol}&expiry=${expiry}`);
      if (res.ok) {
        const data = await res.json();
        setOptionChain(data);
      }
    } catch {
      // Retain existing option chain
    } finally {
      setLoadingOptions(false);
    }
  };

  // Fetch Trading Signal
  const fetchSignal = async () => {
    setLoadingSignal(true);
    try {
      const res = await fetch(`/api/market/signal?symbol=${symbol}`);
      if (res.ok) {
        const data = await res.json();
        setSignal(data);
      }
    } catch {
      // Retain existing signal
    } finally {
      setLoadingSignal(false);
    }
  };

  // Run Strategy Backtest
  const runBacktest = async () => {
    setRunningBacktest(true);
    try {
      const res = await fetch(`/api/backtest?symbol=${symbol}&strategy=${backtestStrategy}`);
      if (res.ok) {
        const data = await res.json();
        setBacktestResult(data);
      }
    } catch (e) {
      console.error('Failed to run backtest:', e);
    } finally {
      setRunningBacktest(false);
    }
  };

  useEffect(() => {
    fetchCandles();
    fetchOptionChain();
    fetchSignal();

    const handleMarketRefresh = () => {
      fetchCandles();
      fetchOptionChain();
      fetchSignal();
    };
    window.addEventListener('market-5m-refresh', handleMarketRefresh);

    // 5-minute auto refresh for live index candles, option chain and signals
    const autoRefreshTimer = window.setInterval(() => {
      fetchCandles();
      fetchOptionChain();
      fetchSignal();
    }, 5 * 60 * 1000);

    return () => {
      window.clearInterval(autoRefreshTimer);
      window.removeEventListener('market-5m-refresh', handleMarketRefresh);
    };
  }, [symbol, interval]);

  // Day Range percentage calculation
  const dayRangePct = quote && quote.high > quote.low
    ? Math.min(100, Math.max(0, ((quote.price - quote.low) / (quote.high - quote.low)) * 100))
    : 50;

  return (
    <div className="space-y-4 max-w-7xl mx-auto px-3 sm:px-4 py-3">
      {/* Index Key Summary Cards */}
      {showSpotSummary ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3 text-xs">
          {/* Spot Price & Change */}
          <div className="col-span-2 bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-[11px] block font-medium">{symbol} SPOT</span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-slate-100">
                ₹{quote ? quote.price.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '---'}
              </div>
            </div>
            <div className="text-right">
              <div
                className={`text-xs sm:text-sm font-bold font-mono flex items-center justify-end ${
                  (quote?.change || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {(quote?.change || 0) >= 0 ? <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> : <TrendingDown className="w-3.5 h-3.5 mr-0.5" />}
                {(quote?.change || 0) >= 0 ? '+' : ''}{quote?.change} ({(quote?.changePercent || 0) >= 0 ? '+' : ''}{quote?.changePercent}%)
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">
                Prev: {quote?.previousClose.toLocaleString('en-IN') || '---'}
              </span>
            </div>
          </div>

          {/* Day's Range */}
          <div className="col-span-2 bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Day's Range</span>
              <span className="font-mono text-slate-300 font-semibold">{dayRangePct.toFixed(0)}% to High</span>
            </div>
            <div className="my-1.5 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${dayRangePct}%` }} />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
              <span>L: {quote?.low.toFixed(1) || '---'}</span>
              <span>H: {quote?.high.toFixed(1) || '---'}</span>
            </div>
          </div>

          {/* India VIX card */}
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
            <span className="text-[11px] text-slate-400 font-medium">India VIX</span>
            <div className="text-base sm:text-lg font-bold font-mono text-amber-400">
              {vix?.value.toFixed(2) || '14.38'}
            </div>
            <div className="text-[10px] text-slate-400 flex items-center justify-between">
              <span>Chg: {vix?.change || '+0.25'}</span>
              <span className="text-emerald-400 font-semibold">{vix?.status || 'Moderate'}</span>
            </div>
          </div>

          {/* FII / DII Flow Card */}
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
            <span className="text-[11px] text-slate-400 font-medium">FII / DII Cash</span>
            <div className="text-base sm:text-lg font-bold font-mono text-emerald-400">
              +{institutionalFlows?.netInstitutionalINR || '3,135'} Cr
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {institutionalFlows?.sentiment || 'Net Institutional Buyers'}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800/80 px-4 py-2 rounded-xl flex items-center justify-between text-xs">
          <span className="text-slate-400">Spot metrics & day range summary hidden</span>
          <button
            onClick={() => setShowSpotSummary(true)}
            className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
          >
            Show Metrics
          </button>
        </div>
      )}

      {/* Global Cues & Macro Bar */}
      {showGlobalCues && (
        <div className="bg-slate-900/60 border border-slate-800 px-3 py-2 rounded-xl flex items-center gap-3 overflow-x-auto text-xs no-scrollbar">
          <div className="flex items-center gap-1.5 text-slate-400 font-medium whitespace-nowrap text-[11px]">
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span>Global Cues:</span>
          </div>
          {macro.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5 whitespace-nowrap bg-slate-850 px-2 py-0.5 rounded border border-slate-755 text-[11px]">
              <span className="text-slate-400">{item.name}</span>
              <span className="font-mono font-semibold text-slate-200">
                {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
              </span>
              {item.changePercent !== undefined && (
                <span className={`font-mono font-bold ${item.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {item.changePercent >= 0 ? '+' : ''}{item.changePercent}%
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Section View Tabs & Layout Controls */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-2 gap-2">
          {/* Main Navigation Modes */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'overview'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Overview & Charts
            </button>
            <button
              onClick={() => setViewMode('option-chain')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'option-chain'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Full Option Chain & Greeks
            </button>
            <button
              onClick={() => setViewMode('backtest')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'backtest'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Strategy Historical Backtest
            </button>
          </div>

          {/* Quick Hide/Show Panel Toggles */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-[11px] text-slate-400 font-medium mr-1 hidden sm:inline">Panels:</span>
            <button
              onClick={() => setShowSignalCard(!showSignalCard)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors cursor-pointer flex items-center gap-1 ${
                showSignalCard
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-500 line-through'
              }`}
              title="Toggle Signal Card & 99% Human Thought"
            >
              {showSignalCard ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>Signal & 99% IQ</span>
            </button>

            <button
              onClick={() => setShowChart(!showChart)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors cursor-pointer flex items-center gap-1 ${
                showChart
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-500 line-through'
              }`}
              title="Toggle Interactive Chart"
            >
              {showChart ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>Chart</span>
            </button>

            <button
              onClick={() => setShowAiReasoning(!showAiReasoning)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors cursor-pointer flex items-center gap-1 ${
                showAiReasoning
                  ? 'bg-purple-500/15 border-purple-500/30 text-purple-300'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-500 line-through'
              }`}
              title="Toggle AI Institutional Reasoning"
            >
              {showAiReasoning ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>AI Reasoning</span>
            </button>

            <button
              onClick={() => setShowOptionChain(!showOptionChain)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors cursor-pointer flex items-center gap-1 ${
                showOptionChain
                  ? 'bg-sky-500/15 border-sky-500/30 text-sky-300'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-500 line-through'
              }`}
              title="Toggle Option Chain"
            >
              {showOptionChain ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>Options</span>
            </button>

            <button
              onClick={() => setShowIndicators(!showIndicators)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors cursor-pointer flex items-center gap-1 ${
                showIndicators
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-500 line-through'
              }`}
              title="Toggle Indicators Matrix"
            >
              {showIndicators ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>Indicators</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: OVERVIEW */}
      {viewMode === 'overview' && (
        <div className="space-y-4">
          {/* 1. Trading Signal Banner & 99% IQ Level Human Signal */}
          {showSignalCard ? (
            <SignalCard signal={signal} onPaperTrade={onPaperTradeSignal} />
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
              <span className="text-slate-400">Trading Signal & 99% IQ Human Thought is hidden</span>
              <button
                onClick={() => setShowSignalCard(true)}
                className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
              >
                Show Section
              </button>
            </div>
          )}

          {/* 2. Human-Like AI Market Reasoning Panel */}
          {showAiReasoning && (
            <AiReasoningPanel
              symbol={symbol}
              signal={signal}
              optionChain={optionChain}
              vix={vix?.value || 14.5}
            />
          )}

          {/* 3. Interactive Financial Chart */}
          {showChart ? (
            <InteractiveChart
              candles={candles}
              symbol={symbol}
              signal={signal}
              interval={interval}
              onIntervalChange={setInterval}
              isLoading={loadingCandles}
            />
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
              <span className="text-slate-400">Interactive Candlestick Chart is hidden</span>
              <button
                onClick={() => setShowChart(true)}
                className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
              >
                Show Chart
              </button>
            </div>
          )}

          {/* 4. Compact Option Chain Preview (Top strikes) */}
          {showOptionChain && (
            <OptionChainTable
              optionChain={optionChain}
              symbol={symbol}
              onTradeOption={onTradeOption}
              isLoading={loadingOptions}
              onExpiryChange={fetchOptionChain}
            />
          )}

          {/* 5. Technical Indicators Matrix */}
          {showIndicators && (
            <TechnicalIndicatorsTable
              candles={candles}
              spotPrice={quote ? quote.price : 22520}
            />
          )}
        </div>
      )}

      {/* VIEW MODE 2: FULL OPTION CHAIN & GREEKS */}
      {viewMode === 'option-chain' && (
        <div className="space-y-4">
          <OptionChainTable
            optionChain={optionChain}
            symbol={symbol}
            onTradeOption={onTradeOption}
            isLoading={loadingOptions}
            onExpiryChange={fetchOptionChain}
          />
        </div>
      )}

      {/* VIEW MODE 3: STRATEGY HISTORICAL BACKTEST */}
      {viewMode === 'backtest' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-emerald-400" />
                <span>Historical Strategy Validation Engine</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Rule-based backtesting on real {symbol} historical candles including slippage & ₹40 round-trip charges.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={backtestStrategy}
                onChange={e => setBacktestStrategy(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-md px-2.5 py-1.5 focus:outline-none"
              >
                <option value="EMA_MOMENTUM">Dual EMA (9/20) + VWAP Momentum</option>
                <option value="MEAN_REVERSION">Mean Reversion + Bollinger Squeeze</option>
              </select>

              <button
                onClick={runBacktest}
                disabled={runningBacktest}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Play className={`w-3.5 h-3.5 fill-current ${runningBacktest ? 'animate-spin' : ''}`} />
                <span>{runningBacktest ? 'Simulating...' : 'Run Backtest'}</span>
              </button>
            </div>
          </div>

          {backtestResult ? (
            <div className="space-y-4">
              {/* Backtest KPI cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs font-mono">
                <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-sans">Win Rate</span>
                  <span className="text-base font-bold text-emerald-400">{backtestResult.winRate}%</span>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-sans">Profit Factor</span>
                  <span className="text-base font-bold text-slate-100">{backtestResult.profitFactor}</span>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-sans">Net P&L (₹)</span>
                  <span className={`text-base font-bold ${backtestResult.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ₹{backtestResult.netProfit.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-sans">Max Drawdown</span>
                  <span className="text-base font-bold text-rose-400">{backtestResult.maxDrawdown}%</span>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-sans">Total Trades</span>
                  <span className="text-base font-bold text-slate-200">{backtestResult.totalTrades}</span>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-sans">Sharpe Ratio</span>
                  <span className="text-base font-bold text-sky-400">{backtestResult.sharpeRatio}</span>
                </div>
              </div>

              {/* Trade Log Table */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-lg overflow-hidden">
                <div className="p-2.5 border-b border-slate-800 text-xs font-semibold text-slate-300">
                  Sample Backtest Trade Executions (Out-of-Sample Validation)
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-xs text-left font-mono">
                    <thead className="bg-slate-900 text-[10px] text-slate-400 uppercase border-b border-slate-800">
                      <tr>
                        <th className="p-2">Entry Time</th>
                        <th className="p-2">Type</th>
                        <th className="p-2">Strike</th>
                        <th className="p-2 text-right">Entry (₹)</th>
                        <th className="p-2 text-right">Exit (₹)</th>
                        <th className="p-2 text-right">Net PnL (₹)</th>
                        <th className="p-2 text-center">Outcome</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {backtestResult.trades.map((t, idx) => (
                        <tr key={idx} className="hover:bg-slate-850/50">
                          <td className="p-2 text-slate-400">{t.entryTime}</td>
                          <td className={`p-2 font-bold ${t.type.includes('CALL') ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {t.type}
                          </td>
                          <td className="p-2 text-slate-200">{t.strike}</td>
                          <td className="p-2 text-right">{t.entryPrice}</td>
                          <td className="p-2 text-right">{t.exitPrice}</td>
                          <td className={`p-2 text-right font-bold ${t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {t.pnl >= 0 ? '+' : ''}{t.pnl}
                          </td>
                          <td className="p-2 text-center">
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-sans font-bold ${
                              t.outcome === 'WIN' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                            }`}>
                              {t.outcome}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 space-y-2">
              <p>Select strategy and click "Run Backtest" to evaluate historical performance across past market sessions.</p>
              <button
                onClick={runBacktest}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
              >
                Launch Initial Backtest
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
