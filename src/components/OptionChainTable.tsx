import React, { useState, useMemo } from 'react';
import { OptionChainData, StrikeRow, OptionItem, MarketIndexSymbol } from '../types/market';
import { Search, Filter, ShieldCheck, ChevronDown, ArrowUpDown, Zap, Info, Eye, EyeOff, Layers } from 'lucide-react';

interface OptionChainTableProps {
  optionChain: OptionChainData | null;
  symbol: MarketIndexSymbol;
  onTradeOption: (item: OptionItem, strike: number, type: 'CE' | 'PE', expiry: string) => void;
  isLoading: boolean;
  onExpiryChange?: (expiry: string) => void;
}

export const OptionChainTable: React.FC<OptionChainTableProps> = ({
  optionChain,
  symbol,
  onTradeOption,
  isLoading,
  onExpiryChange,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [strikeRange, setStrikeRange] = useState<'10' | '15' | '25' | 'all'>('15');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showGreeks, setShowGreeks] = useState<boolean>(false);
  const [selectedExpiry, setSelectedExpiry] = useState<string>('current');

  // Filter strikes based on strikeRange and searchQuery (unconditional hook)
  const filteredStrikes = useMemo(() => {
    if (!optionChain || !optionChain.strikes) return [];
    let list = [...optionChain.strikes];

    if (searchQuery.trim()) {
      const q = searchQuery.trim();
      return list.filter(s => s.strike.toString().includes(q));
    }

    if (strikeRange !== 'all') {
      const rangeNum = parseInt(strikeRange, 10);
      const atmIndex = list.findIndex(s => s.isATM);
      if (atmIndex !== -1) {
        const start = Math.max(0, atmIndex - rangeNum);
        const end = Math.min(list.length, atmIndex + rangeNum + 1);
        return list.slice(start, end);
      }
    }

    return list;
  }, [optionChain, strikeRange, searchQuery]);

  if (!optionChain) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        <div className="animate-spin inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full mb-2" />
        <p className="text-sm">Loading complete {symbol} option chain...</p>
      </div>
    );
  }

  if (isCollapsed) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-200">
            {symbol} Option Chain (PCR: {optionChain.pcrOI.toFixed(2)} • Max Pain: ₹{optionChain.maxPain.toLocaleString('en-IN')})
          </span>
          <span className="text-[10px] text-slate-500 font-mono">• Hidden</span>
        </div>
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 transition-colors cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Show Option Chain</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
      {/* Top Header / Statistics Bar */}
      <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
              <span>{symbol} Complete Option Chain</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                Spot: ₹{optionChain.underlyingPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              European cash-settled contracts • Real Greeks & Open Interest Analytics
            </p>
          </div>
        </div>

        {/* PCR and Max Pain Indicators */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* PCR OI */}
          <div className="bg-slate-850 border border-slate-750 px-2.5 py-1 rounded-lg text-xs">
            <span className="text-slate-400 text-[10px] block">PCR (OI)</span>
            <span
              className={`font-mono font-bold ${
                optionChain.pcrOI > 1.2
                  ? 'text-emerald-400'
                  : optionChain.pcrOI < 0.8
                  ? 'text-rose-400'
                  : 'text-amber-400'
              }`}
            >
              {optionChain.pcrOI.toFixed(2)}
            </span>
          </div>

          {/* PCR Volume */}
          <div className="bg-slate-850 border border-slate-750 px-2.5 py-1 rounded-lg text-xs hidden sm:block">
            <span className="text-slate-400 text-[10px] block">PCR (Vol)</span>
            <span className="font-mono font-bold text-slate-200">
              {optionChain.pcrVolume.toFixed(2)}
            </span>
          </div>

          {/* Max Pain Estimate */}
          <div className="bg-slate-850 border border-slate-750 px-2.5 py-1 rounded-lg text-xs" title="Estimated strike where option sellers/writers lose the least. Not a guaranteed target.">
            <div className="flex items-center gap-1">
              <span className="text-slate-400 text-[10px]">Max Pain (Est.)</span>
              <Info className="w-2.5 h-2.5 text-slate-500" />
            </div>
            <span className="font-mono font-bold text-amber-400">
              ₹{optionChain.maxPain.toLocaleString('en-IN')}
            </span>
          </div>

          {/* ATM Strike */}
          <div className="bg-slate-850 border border-slate-750 px-2.5 py-1 rounded-lg text-xs">
            <span className="text-slate-400 text-[10px] block">ATM Strike</span>
            <span className="font-mono font-bold text-sky-400">
              ₹{optionChain.atmStrike.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Hide / Minimize Button */}
          <button
            onClick={() => setIsCollapsed(true)}
            className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            title="Hide / Minimize Option Chain"
          >
            <EyeOff className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Hide</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Expiry Selector, Strike Range, Search, Greeks Toggle */}
      <div className="p-3 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Expiry Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Expiry:</span>
            <select
              value={selectedExpiry}
              onChange={e => {
                setSelectedExpiry(e.target.value);
                if (onExpiryChange) onExpiryChange(e.target.value);
              }}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="current">{optionChain.availableExpiries[0] || 'Current Weekly'}</option>
              <option value="next">{optionChain.availableExpiries[1] || 'Next Weekly'}</option>
              <option value="monthly">{optionChain.availableExpiries[2] || 'Monthly Expiry'}</option>
            </select>
          </div>

          {/* Strike Range Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px] hidden sm:inline">Range:</span>
            <div className="flex items-center bg-slate-800 rounded-md border border-slate-700 p-0.5">
              {(['10', '15', '25', 'all'] as const).map(rng => (
                <button
                  key={rng}
                  onClick={() => setStrikeRange(rng)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    strikeRange === rng ? 'bg-slate-700 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {rng === 'all' ? 'All' : `±${rng}`}
                </button>
              ))}
            </div>
          </div>

          {/* Toggle Greeks */}
          <button
            onClick={() => setShowGreeks(!showGreeks)}
            className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
              showGreeks
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {showGreeks ? 'Hide Greeks' : 'Show Greeks (Δ, Θ, Γ, ν)'}
          </button>
        </div>

        {/* Search by strike */}
        <div className="relative w-full sm:w-48">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search strike..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-md pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>
      </div>

      {/* Option Chain Table */}
      <div className="overflow-x-auto max-h-[560px] relative scrollbar-thin scrollbar-thumb-slate-700">
        <table className="w-full text-xs text-left border-collapse select-none">
          {/* Table Header */}
          <thead className="sticky top-0 z-20 bg-slate-950 text-slate-300 font-mono text-[11px] uppercase border-b border-slate-800 shadow-sm">
            <tr>
              {/* CALLS HEADER */}
              <th colSpan={showGreeks ? 9 : 6} className="text-center py-1.5 bg-emerald-950/40 text-emerald-400 border-r border-slate-800 font-bold tracking-wider">
                CALL OPTIONS (CE)
              </th>
              {/* STRIKE HEADER */}
              <th className="text-center py-1.5 bg-slate-900 text-slate-200 font-bold border-r border-l border-slate-800 px-3 min-w-[90px]">
                STRIKE
              </th>
              {/* PUTS HEADER */}
              <th colSpan={showGreeks ? 9 : 6} className="text-center py-1.5 bg-rose-950/40 text-rose-400 border-l border-slate-800 font-bold tracking-wider">
                PUT OPTIONS (PE)
              </th>
            </tr>
            <tr className="border-b border-slate-800 text-[10px] text-slate-400 bg-slate-900/90">
              {/* Call Columns */}
              <th className="py-1.5 px-2 text-right">OI</th>
              <th className="py-1.5 px-2 text-right">Chg OI</th>
              <th className="py-1.5 px-2 text-right">Vol</th>
              <th className="py-1.5 px-1.5 text-right">IV%</th>
              {showGreeks && (
                <>
                  <th className="py-1.5 px-1.5 text-right text-purple-300">Delta</th>
                  <th className="py-1.5 px-1.5 text-right text-purple-300">Theta</th>
                  <th className="py-1.5 px-1.5 text-right text-purple-300">Vega</th>
                </>
              )}
              <th className="py-1.5 px-2 text-right">Chg</th>
              <th className="py-1.5 px-2.5 text-right text-emerald-300 font-bold border-r border-slate-800">LTP</th>

              {/* Strike Column */}
              <th className="py-1.5 px-3 text-center bg-slate-900 text-slate-100 font-bold border-r border-l border-slate-800">
                Strike
              </th>

              {/* Put Columns */}
              <th className="py-1.5 px-2.5 text-left text-rose-300 font-bold border-l border-slate-800">LTP</th>
              <th className="py-1.5 px-2 text-left">Chg</th>
              {showGreeks && (
                <>
                  <th className="py-1.5 px-1.5 text-left text-purple-300">Delta</th>
                  <th className="py-1.5 px-1.5 text-left text-purple-300">Theta</th>
                  <th className="py-1.5 px-1.5 text-left text-purple-300">Vega</th>
                </>
              )}
              <th className="py-1.5 px-1.5 text-left">IV%</th>
              <th className="py-1.5 px-2 text-left">Vol</th>
              <th className="py-1.5 px-2 text-left">Chg OI</th>
              <th className="py-1.5 px-2 text-left">OI</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
            {filteredStrikes.map(row => {
              const isATM = row.isATM;
              const callITM = row.call.inTheMoney;
              const putITM = row.put.inTheMoney;

              return (
                <tr
                  key={row.strike}
                  className={`hover:bg-slate-800/60 transition-colors ${
                    isATM ? 'bg-sky-950/40 ring-1 ring-sky-500/40' : ''
                  }`}
                >
                  {/* Call OI */}
                  <td className={`py-1.5 px-2 text-right ${callITM ? 'bg-amber-950/20' : ''}`}>
                    {(row.call.openInterest / 1000).toFixed(1)}k
                  </td>
                  {/* Call Chg OI */}
                  <td
                    className={`py-1.5 px-2 text-right ${callITM ? 'bg-amber-950/20' : ''} ${
                      row.call.changeInOI >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {row.call.changeInOI >= 0 ? '+' : ''}
                    {(row.call.changeInOI / 1000).toFixed(1)}k
                  </td>
                  {/* Call Volume */}
                  <td className={`py-1.5 px-2 text-right text-slate-400 ${callITM ? 'bg-amber-950/20' : ''}`}>
                    {(row.call.volume / 1000).toFixed(1)}k
                  </td>
                  {/* Call IV */}
                  <td className={`py-1.5 px-1.5 text-right text-slate-300 ${callITM ? 'bg-amber-950/20' : ''}`}>
                    {row.call.iv.toFixed(1)}
                  </td>
                  {/* Call Greeks */}
                  {showGreeks && (
                    <>
                      <td className={`py-1.5 px-1.5 text-right text-purple-300 ${callITM ? 'bg-amber-950/20' : ''}`}>
                        {row.call.greeks.delta.toFixed(2)}
                      </td>
                      <td className={`py-1.5 px-1.5 text-right text-purple-300 ${callITM ? 'bg-amber-950/20' : ''}`}>
                        {row.call.greeks.theta.toFixed(1)}
                      </td>
                      <td className={`py-1.5 px-1.5 text-right text-purple-300 ${callITM ? 'bg-amber-950/20' : ''}`}>
                        {row.call.greeks.vega.toFixed(1)}
                      </td>
                    </>
                  )}
                  {/* Call Chg */}
                  <td
                    className={`py-1.5 px-2 text-right ${callITM ? 'bg-amber-950/20' : ''} ${
                      row.call.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {row.call.change >= 0 ? '+' : ''}
                    {row.call.change.toFixed(2)}
                  </td>
                  {/* Call LTP with Quick Trade button on hover */}
                  <td
                    className={`py-1.5 px-2.5 text-right font-bold text-emerald-300 border-r border-slate-800 relative group cursor-pointer ${
                      callITM ? 'bg-amber-950/30' : ''
                    }`}
                    onClick={() => onTradeOption(row.call, row.strike, 'CE', optionChain.expiryDate)}
                    title="Click to trade this Call"
                  >
                    <span>{row.call.ltp.toFixed(2)}</span>
                    <button className="hidden group-hover:inline-flex absolute right-1 top-1/2 -translate-y-1/2 bg-emerald-500 text-slate-950 px-1 py-0.5 rounded text-[9px] font-sans font-bold shadow items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5" /> Buy
                    </button>
                  </td>

                  {/* STRIKE PRICE CENTER */}
                  <td
                    className={`py-1.5 px-3 text-center font-bold border-r border-l border-slate-800 ${
                      isATM
                        ? 'bg-sky-500/20 text-sky-300 font-extrabold border-sky-500/50'
                        : 'bg-slate-900 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>{row.strike}</span>
                      {isATM && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-sky-500 text-slate-950 font-bold uppercase tracking-tight font-sans">
                          ATM
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Put LTP with Quick Trade button */}
                  <td
                    className={`py-1.5 px-2.5 text-left font-bold text-rose-300 border-l border-slate-800 relative group cursor-pointer ${
                      putITM ? 'bg-amber-950/30' : ''
                    }`}
                    onClick={() => onTradeOption(row.put, row.strike, 'PE', optionChain.expiryDate)}
                    title="Click to trade this Put"
                  >
                    <span>{row.put.ltp.toFixed(2)}</span>
                    <button className="hidden group-hover:inline-flex absolute left-1 top-1/2 -translate-y-1/2 bg-rose-500 text-white px-1 py-0.5 rounded text-[9px] font-sans font-bold shadow items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5" /> Buy
                    </button>
                  </td>
                  {/* Put Chg */}
                  <td
                    className={`py-1.5 px-2 text-left ${putITM ? 'bg-amber-950/20' : ''} ${
                      row.put.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {row.put.change >= 0 ? '+' : ''}
                    {row.put.change.toFixed(2)}
                  </td>
                  {/* Put Greeks */}
                  {showGreeks && (
                    <>
                      <td className={`py-1.5 px-1.5 text-left text-purple-300 ${putITM ? 'bg-amber-950/20' : ''}`}>
                        {row.put.greeks.delta.toFixed(2)}
                      </td>
                      <td className={`py-1.5 px-1.5 text-left text-purple-300 ${putITM ? 'bg-amber-950/20' : ''}`}>
                        {row.put.greeks.theta.toFixed(1)}
                      </td>
                      <td className={`py-1.5 px-1.5 text-left text-purple-300 ${putITM ? 'bg-amber-950/20' : ''}`}>
                        {row.put.greeks.vega.toFixed(1)}
                      </td>
                    </>
                  )}
                  {/* Put IV */}
                  <td className={`py-1.5 px-1.5 text-left text-slate-300 ${putITM ? 'bg-amber-950/20' : ''}`}>
                    {row.put.iv.toFixed(1)}
                  </td>
                  {/* Put Volume */}
                  <td className={`py-1.5 px-2 text-left text-slate-400 ${putITM ? 'bg-amber-950/20' : ''}`}>
                    {(row.put.volume / 1000).toFixed(1)}k
                  </td>
                  {/* Put Chg OI */}
                  <td
                    className={`py-1.5 px-2 text-left ${putITM ? 'bg-amber-950/20' : ''} ${
                      row.put.changeInOI >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {row.put.changeInOI >= 0 ? '+' : ''}
                    {(row.put.changeInOI / 1000).toFixed(1)}k
                  </td>
                  {/* Put OI */}
                  <td className={`py-1.5 px-2 text-left ${putITM ? 'bg-amber-950/20' : ''}`}>
                    {(row.put.openInterest / 1000).toFixed(1)}k
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer / Legend */}
      <div className="p-2.5 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-amber-950/40 border border-amber-700/40 rounded-xs" />
            <span>In-The-Money (ITM)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-sky-500/30 border border-sky-400 rounded-xs" />
            <span>At-The-Money (ATM)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-slate-900 border border-slate-700 rounded-xs" />
            <span>Out-The-Money (OTM)</span>
          </div>
        </div>

        <div className="text-slate-500 font-mono text-[10px]">
          Tip: Hover & click any LTP to open order form • Last evaluated: {optionChain.lastUpdated}
        </div>
      </div>
    </div>
  );
};
