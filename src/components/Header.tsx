import React, { useState, useEffect } from 'react';
import { IndexQuote } from '../types/market';
import { Activity, RefreshCw, Sun, Moon, Clock, TrendingUp, TrendingDown, ShieldAlert } from 'lucide-react';

interface HeaderProps {
  nifty: IndexQuote | null;
  sensex: IndexQuote | null;
  vix: { value: number; change: number; changePercent: number; status: string } | null;
  lastUpdated: string;
  onRefresh: () => void;
  isLoading: boolean;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  countdownSeconds?: number;
}

export const Header: React.FC<HeaderProps> = ({
  nifty,
  sensex,
  vix,
  lastUpdated,
  onRefresh,
  isLoading,
  theme,
  setTheme,
  countdownSeconds = 300,
}) => {
  const [istTime, setIstTime] = useState<string>('');

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setIstTime(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const sessionStatus = nifty?.marketStatus || 'REGULAR_OPEN';
  const isMarketOpen = sessionStatus === 'REGULAR_OPEN';

  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-40 text-slate-100">
      {/* Top Banner / Ticker Row */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Market Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg shadow-sm">
              ₹
            </div>
            <div>
              <h1 className="font-bold text-sm sm:text-base tracking-tight flex items-center gap-1.5 text-white">
                NIFTY & SENSEX <span className="text-emerald-400 text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 font-mono">F&O PRO</span>
              </h1>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Institutional Derivatives Analytics & Trade Signals
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border border-slate-700/60 bg-slate-800/60">
            <span
              className={`w-2 h-2 rounded-full ${
                isMarketOpen
                  ? 'bg-emerald-500 animate-pulse'
                  : sessionStatus === 'PRE_OPEN'
                  ? 'bg-amber-400'
                  : 'bg-slate-500'
              }`}
            />
            <span className="text-slate-300 text-[11px]">
              {isMarketOpen ? 'NSE/BSE LIVE' : sessionStatus === 'PRE_OPEN' ? 'PRE-OPEN' : 'MARKET CLOSED'}
            </span>
          </div>
        </div>

        {/* Live Index Tickers */}
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto py-1 max-w-full">
          {/* NIFTY 50 Ticker */}
          <div className="bg-slate-800/80 border border-slate-700/60 px-3 py-1 rounded-lg flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">NIFTY 50</span>
            <span className="font-mono font-bold text-slate-100">
              {nifty ? nifty.price.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '22,520.45'}
            </span>
            <span
              className={`font-mono text-[11px] flex items-center font-semibold ${
                (nifty?.change || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {(nifty?.change || 0) >= 0 ? (
                <TrendingUp className="w-3 h-3 mr-0.5" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-0.5" />
              )}
              {(nifty?.change || 0) >= 0 ? '+' : ''}
              {nifty?.change ?? 0} ({(nifty?.changePercent || 0) >= 0 ? '+' : ''}
              {nifty?.changePercent ?? 0}%)
            </span>
          </div>

          {/* SENSEX Ticker */}
          <div className="bg-slate-800/80 border border-slate-700/60 px-3 py-1 rounded-lg flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">SENSEX</span>
            <span className="font-mono font-bold text-slate-100">
              {sensex ? sensex.price.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '72,472.30'}
            </span>
            <span
              className={`font-mono text-[11px] flex items-center font-semibold ${
                (sensex?.change || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {(sensex?.change || 0) >= 0 ? (
                <TrendingUp className="w-3 h-3 mr-0.5" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-0.5" />
              )}
              {(sensex?.change || 0) >= 0 ? '+' : ''}
              {sensex?.change ?? 0} ({(sensex?.changePercent || 0) >= 0 ? '+' : ''}
              {sensex?.changePercent ?? 0}%)
            </span>
          </div>

          {/* INDIA VIX Ticker */}
          <div className="bg-slate-800/80 border border-slate-700/60 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs hidden md:flex">
            <span className="text-slate-400 font-medium">INDIA VIX</span>
            <span className="font-mono font-bold text-amber-400">
              {vix ? vix.value.toFixed(2) : '14.38'}
            </span>
            <span
              className={`text-[10px] px-1 py-0.2 rounded ${
                (vix?.value || 0) > 18
                  ? 'bg-rose-500/20 text-rose-300'
                  : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              {vix?.status || 'Moderate'}
            </span>
          </div>
        </div>

        {/* Time, Refresh & Settings */}
        <div className="flex items-center gap-2 text-xs">
          <div className="hidden lg:flex items-center gap-1 text-slate-400 font-mono text-[11px]">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>IST: {istTime}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700/80 rounded-md px-2 py-1 text-[11px] text-slate-300 font-mono">
            <span className="text-slate-500 hidden sm:inline">Auto 5m:</span>
            <span className="text-emerald-400 font-bold">{formatCountdown(countdownSeconds)}</span>
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh Market Data Immediately"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline text-[11px]">Refresh</span>
          </button>

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-300" />}
          </button>
        </div>
      </div>
    </header>
  );
};
