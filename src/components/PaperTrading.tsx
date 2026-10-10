import React, { useState } from 'react';
import {
  PaperTradingAccount,
  PaperTradePosition,
  PaperTradeOrder,
  PaperTradeHistoryItem,
  MarketIndexSymbol,
} from '../types/market';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Shield,
  PlusCircle,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  X,
  Zap,
} from 'lucide-react';

interface PaperTradingProps {
  account: PaperTradingAccount | null;
  onPlaceOrder: (order: any) => Promise<void>;
  onClosePosition: (posId: string, exitPrice?: number) => Promise<void>;
  onResetAccount: (newBalance?: number) => Promise<void>;
  prefillOrder?: {
    symbol: MarketIndexSymbol;
    strike: number;
    optionType: 'CE' | 'PE';
    expiry: string;
    price: number;
  } | null;
  onClearPrefill?: () => void;
}

export const PaperTrading: React.FC<PaperTradingProps> = ({
  account,
  onPlaceOrder,
  onClosePosition,
  onResetAccount,
  prefillOrder,
  onClearPrefill,
}) => {
  const [activeTab, setActiveTab] = useState<'positions' | 'orders' | 'history' | 'analytics'>('positions');
  const [showOrderModal, setShowOrderModal] = useState<boolean>(!!prefillOrder);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);

  // Order form state
  const [orderSymbol, setOrderSymbol] = useState<MarketIndexSymbol>(prefillOrder?.symbol || 'NIFTY');
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');
  const [optionType, setOptionType] = useState<'CE' | 'PE'>(prefillOrder?.optionType || 'CE');
  const [strike, setStrike] = useState<number>(prefillOrder?.strike || 22550);
  const [expiry, setExpiry] = useState<string>(prefillOrder?.expiry || '15 May 2026');
  const [lots, setLots] = useState<number>(1);
  const [executionType, setExecutionType] = useState<'MARKET' | 'LIMIT' | 'TRIGGER'>('MARKET');
  const [price, setPrice] = useState<number>(prefillOrder?.price || 145);
  const [stopLoss, setStopLoss] = useState<string>('');
  const [target, setTarget] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [resetBalanceInput, setResetBalanceInput] = useState<number>(500000);

  // Sync if prefill changed
  React.useEffect(() => {
    if (prefillOrder) {
      setOrderSymbol(prefillOrder.symbol);
      setStrike(prefillOrder.strike);
      setOptionType(prefillOrder.optionType);
      setExpiry(prefillOrder.expiry);
      setPrice(prefillOrder.price);
      setShowOrderModal(true);
    }
  }, [prefillOrder]);

  if (!account) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center text-slate-400">
        <div className="animate-spin inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full mb-2" />
        <p className="text-xs">Loading paper trading account...</p>
      </div>
    );
  }

  const lotSize = orderSymbol === 'NIFTY' ? 25 : 10;
  const totalUnits = lots * lotSize;
  const estimatedOrderValue = price * totalUnits;
  const estimatedCharges = Number((20 + 20 * 0.18 + (orderType === 'SELL' ? estimatedOrderValue * 0.000625 : 0)).toFixed(2));

  // Analytics calculations
  const history = account.tradeHistory || [];
  const winningTrades = history.filter(h => h.netPnL > 0);
  const losingTrades = history.filter(h => h.netPnL <= 0);
  const totalTradesCount = history.length;
  const winRate = totalTradesCount > 0 ? Number(((winningTrades.length / totalTradesCount) * 100).toFixed(1)) : 0;
  const grossProfit = winningTrades.reduce((acc, t) => acc + t.netPnL, 0);
  const grossLoss = Math.abs(losingTrades.reduce((acc, t) => acc + t.netPnL, 0));
  const profitFactor = grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : (grossProfit > 0 ? 3.5 : 0);
  const avgProfit = winningTrades.length > 0 ? Number((grossProfit / winningTrades.length).toFixed(0)) : 0;
  const avgLoss = losingTrades.length > 0 ? Number((grossLoss / losingTrades.length).toFixed(0)) : 0;

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onPlaceOrder({
        symbol: orderSymbol,
        strike: Number(strike),
        optionType,
        expiry,
        orderType,
        lots: Number(lots),
        lotSize,
        executionType,
        requestedPrice: Number(price),
        stopLoss: stopLoss ? Number(stopLoss) : undefined,
        target: target ? Number(target) : undefined,
      });
      setShowOrderModal(false);
      if (onClearPrefill) onClearPrefill();
    } catch (err: any) {
      alert(err.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 space-y-4">
      {/* Disclaimer banner */}
      <div className="bg-amber-950/20 border border-amber-800/40 px-3.5 py-2 rounded-xl flex items-center justify-between text-xs text-amber-300">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Simulated Paper Trading:</strong> Test NIFTY & SENSEX option signals with zero real capital risk. Includes realistic Indian brokerage (₹20), STT, GST, and slippage.
          </span>
        </div>
        <button
          onClick={() => setShowResetModal(true)}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] whitespace-nowrap cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" /> Reset Account
        </button>
      </div>

      {/* Account KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <span className="text-[10px] text-slate-400 block font-sans">Virtual Capital</span>
          <span className="text-base sm:text-lg font-bold text-slate-100">
            ₹{account.currentBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <span className="text-[10px] text-slate-400 block font-sans">Margin Deployed</span>
          <span className="text-base sm:text-lg font-bold text-sky-400">
            ₹{account.marginUsed.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <span className="text-[10px] text-slate-400 block font-sans">Realized P&L</span>
          <span
            className={`text-base sm:text-lg font-bold ${
              account.realizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {account.realizedPnL >= 0 ? '+' : ''}₹{account.realizedPnL.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <span className="text-[10px] text-slate-400 block font-sans">Total Charges (STT/GST)</span>
          <span className="text-base sm:text-lg font-bold text-slate-300">
            ₹{account.totalCharges.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <span className="text-[10px] text-slate-400 block font-sans">Win Rate</span>
          <span className="text-base sm:text-lg font-bold text-emerald-400">{winRate}%</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <span className="text-[10px] text-slate-400 block font-sans">Profit Factor</span>
          <span className="text-base sm:text-lg font-bold text-amber-400">{profitFactor}</span>
        </div>
      </div>

      {/* Main Tabs and Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('positions')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                activeTab === 'positions'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Open Positions ({account.positions.length})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Order Log ({account.orders.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Trade History ({account.tradeHistory.length})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Performance Analytics
            </button>
          </div>

          <button
            onClick={() => setShowOrderModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Option Trade</span>
          </button>
        </div>

        {/* 1. Open Positions View */}
        {activeTab === 'positions' && (
          <div className="overflow-x-auto">
            {account.positions.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                <Wallet className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p>No open F&O positions currently active.</p>
                <p className="text-[11px] text-slate-500">
                  Click "New Option Trade" or simulate any signal directly from NIFTY / SENSEX.
                </p>
              </div>
            ) : (
              <table className="w-full text-xs text-left font-mono">
                <thead className="bg-slate-950 text-[10px] text-slate-400 uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Contract</th>
                    <th className="p-3">Side</th>
                    <th className="p-3 text-right">Lots (Qty)</th>
                    <th className="p-3 text-right">Avg Buy (₹)</th>
                    <th className="p-3 text-right">Current LTP (₹)</th>
                    <th className="p-3 text-right">Unrealized P&L</th>
                    <th className="p-3 text-right">Target / SL</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {account.positions.map(pos => {
                    const ltp = pos.currentLtp;
                    const pnl = (ltp - pos.avgEntryPrice) * pos.quantity * (pos.orderType === 'BUY' ? 1 : -1);
                    const pnlPct = ((pnl) / (pos.avgEntryPrice * pos.quantity)) * 100;

                    return (
                      <tr key={pos.id} className="hover:bg-slate-850/50">
                        <td className="p-3 font-bold text-slate-100 font-sans">
                          {pos.symbol} {pos.strike} {pos.optionType}
                          <span className="block font-mono text-[10px] text-slate-400 font-normal">
                            Exp: {pos.expiry} • Entered: {pos.entryTime}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-sans font-bold ${
                              pos.orderType === 'BUY'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {pos.orderType}
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold text-slate-200">
                          {pos.lots} ({pos.quantity})
                        </td>
                        <td className="p-3 text-right font-bold text-slate-200">
                          ₹{pos.avgEntryPrice.toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-bold text-emerald-300">
                          ₹{ltp.toFixed(2)}
                        </td>
                        <td
                          className={`p-3 text-right font-bold ${
                            pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {pnl >= 0 ? '+' : ''}₹{pnl.toFixed(1)} ({pnlPct >= 0 ? '+' : ''}
                          {pnlPct.toFixed(1)}%)
                        </td>
                        <td className="p-3 text-right text-slate-400 text-[11px]">
                          T: {pos.target ? `₹${pos.target}` : '---'} | SL: {pos.stopLoss ? `₹${pos.stopLoss}` : '---'}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => onClosePosition(pos.id, ltp)}
                            className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[11px] font-sans font-semibold transition-colors cursor-pointer"
                          >
                            Square Off
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 2. Order Log View */}
        {activeTab === 'orders' && (
          <div className="overflow-x-auto">
            {account.orders.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No orders placed yet.</div>
            ) : (
              <table className="w-full text-xs text-left font-mono">
                <thead className="bg-slate-950 text-[10px] text-slate-400 uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Time</th>
                    <th className="p-3">Contract</th>
                    <th className="p-3">Side</th>
                    <th className="p-3 text-right">Lots</th>
                    <th className="p-3 text-right">Requested (₹)</th>
                    <th className="p-3 text-right">Executed (₹)</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {account.orders.map(ord => (
                    <tr key={ord.id} className="hover:bg-slate-850/50">
                      <td className="p-3 text-slate-400">{ord.timestamp}</td>
                      <td className="p-3 font-sans font-semibold text-slate-100">
                        {ord.symbol} {ord.strike} {ord.optionType}
                      </td>
                      <td className="p-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-sans font-bold ${ord.orderType === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                          {ord.orderType}
                        </span>
                      </td>
                      <td className="p-3 text-right text-slate-200">{ord.lots}</td>
                      <td className="p-3 text-right text-slate-300">₹{ord.requestedPrice}</td>
                      <td className="p-3 text-right text-emerald-400 font-bold">₹{ord.executedPrice || ord.requestedPrice}</td>
                      <td className="p-3 text-center">
                        <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                          {ord.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 3. Trade History View */}
        {activeTab === 'history' && (
          <div className="overflow-x-auto">
            {account.tradeHistory.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No closed trades recorded yet.</div>
            ) : (
              <table className="w-full text-xs text-left font-mono">
                <thead className="bg-slate-950 text-[10px] text-slate-400 uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Contract</th>
                    <th className="p-3">Side</th>
                    <th className="p-3 text-right">Entry (₹)</th>
                    <th className="p-3 text-right">Exit (₹)</th>
                    <th className="p-3 text-right">Charges (₹)</th>
                    <th className="p-3 text-right">Net P&L (₹)</th>
                    <th className="p-3 text-center">Exit Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {account.tradeHistory.map(item => (
                    <tr key={item.id} className="hover:bg-slate-850/50">
                      <td className="p-3 font-sans font-semibold text-slate-100">
                        {item.symbol} {item.strike} {item.optionType}
                        <span className="block font-mono text-[10px] text-slate-400 font-normal">
                          {item.entryTime} → {item.exitTime}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-300">{item.orderType}</td>
                      <td className="p-3 text-right text-slate-300">₹{item.entryPrice}</td>
                      <td className="p-3 text-right text-slate-300">₹{item.exitPrice}</td>
                      <td className="p-3 text-right text-slate-400">₹{item.charges}</td>
                      <td className={`p-3 text-right font-bold ${item.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {item.netPnL >= 0 ? '+' : ''}₹{item.netPnL}
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {item.reason}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 4. Performance Analytics View */}
        {activeTab === 'analytics' && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-sans">Total Trades Closed</span>
                <span className="text-base font-bold text-slate-200">{totalTradesCount}</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-sans">Average Winning Trade</span>
                <span className="text-base font-bold text-emerald-400">+₹{avgProfit}</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-sans">Average Losing Trade</span>
                <span className="text-base font-bold text-rose-400">-₹{avgLoss}</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-sans">Expectancy per Trade</span>
                <span className="text-base font-bold text-sky-400">
                  ₹{totalTradesCount > 0 ? ((account.realizedPnL) / totalTradesCount).toFixed(0) : '0'}
                </span>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-lg space-y-2 text-xs">
              <h4 className="font-bold text-slate-200 font-sans">Trading Discipline & Risk Rule Checklist:</h4>
              <ul className="space-y-1.5 text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Max risk per trade enforced at {account.riskSettings.maxRiskPerTradePercent}% of capital.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Hard daily loss threshold configured at ₹{account.riskSettings.maxDailyLossLimit.toLocaleString()}.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Max simultaneous open positions limited to {account.riskSettings.maxOpenPositions} contracts.</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* NEW ORDER MODAL */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-4 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>Simulate F&O Order</span>
              </h3>
              <button
                onClick={() => {
                  setShowOrderModal(false);
                  if (onClearPrefill) onClearPrefill();
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleOrderSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">Index Symbol</label>
                  <select
                    value={orderSymbol}
                    onChange={e => setOrderSymbol(e.target.value as MarketIndexSymbol)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-md p-2"
                  >
                    <option value="NIFTY">NIFTY 50 (Lot: 25)</option>
                    <option value="SENSEX">SENSEX (Lot: 10)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">Order Side</label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-800 p-0.5 rounded-md border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setOrderType('BUY')}
                      className={`py-1 rounded font-bold cursor-pointer ${
                        orderType === 'BUY' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
                      }`}
                    >
                      BUY
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderType('SELL')}
                      className={`py-1 rounded font-bold cursor-pointer ${
                        orderType === 'SELL' ? 'bg-rose-500 text-white' : 'text-slate-400'
                      }`}
                    >
                      SELL
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">Option Type</label>
                  <select
                    value={optionType}
                    onChange={e => setOptionType(e.target.value as 'CE' | 'PE')}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-md p-2"
                  >
                    <option value="CE">Call (CE)</option>
                    <option value="PE">Put (PE)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">Strike Price</label>
                  <input
                    type="number"
                    value={strike}
                    onChange={e => setStrike(Number(e.target.value))}
                    step={orderSymbol === 'NIFTY' ? 50 : 100}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-md p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">Lots (1 Lot={lotSize})</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={lots}
                    onChange={e => setLots(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-md p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">Execution Type</label>
                  <select
                    value={executionType}
                    onChange={e => setExecutionType(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-md p-2"
                  >
                    <option value="MARKET">Market Order</option>
                    <option value="LIMIT">Limit Order</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">Price (₹)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={price}
                    onChange={e => setPrice(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-md p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">Stop Loss (Optional)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 110"
                    value={stopLoss}
                    onChange={e => setStopLoss(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-md p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">Target (Optional)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 210"
                    value={target}
                    onChange={e => setTarget(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-md p-2 font-mono"
                  />
                </div>
              </div>

              {/* Order breakdown */}
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] font-mono space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Units: {totalUnits}</span>
                  <span>Est. Margin Required: ₹{estimatedOrderValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Estimated Taxes & Charges:</span>
                  <span>₹{estimatedCharges}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-2.5 rounded-lg font-bold text-xs shadow-md transition-colors cursor-pointer ${
                  orderType === 'BUY'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    : 'bg-rose-500 hover:bg-rose-400 text-white'
                }`}
              >
                {isSubmitting ? 'Submitting...' : `Confirm ${orderType} ${lots} Lot(s)`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* RESET ACCOUNT MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-4 space-y-4">
            <h3 className="font-bold text-slate-100 text-sm">Reset Virtual Account</h3>
            <p className="text-xs text-slate-400">
              This will clear all active paper positions, pending orders, and history, resetting your balance.
            </p>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Starting Capital (₹)</label>
              <input
                type="number"
                value={resetBalanceInput}
                onChange={e => setResetBalanceInput(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-md p-2 text-xs font-mono"
              />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onResetAccount(resetBalanceInput);
                  setShowResetModal(false);
                }}
                className="px-3 py-1.5 rounded bg-rose-500 text-white text-xs font-bold hover:bg-rose-400 cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
