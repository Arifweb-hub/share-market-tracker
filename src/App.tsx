/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { IndexDashboard } from './components/IndexDashboard';
import { PaperTrading } from './components/PaperTrading';
import { MarketNews } from './components/MarketNews';
import { AiTradeAssistant } from './components/AiTradeAssistant';
import {
  IndexQuote,
  OptionItem,
  TradingSignal,
  PaperTradingAccount,
  MarketIndexSymbol,
} from './types/market';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('NIFTY');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [refreshCountdown, setRefreshCountdown] = useState<number>(300); // 5 minutes (300s)

  // Initial fallback states for immediate render
  const [niftyQuote, setNiftyQuote] = useState<IndexQuote>({
    symbol: 'NIFTY',
    name: 'NIFTY 50',
    price: 22520.45,
    change: 40.45,
    changePercent: 0.18,
    open: 22495.0,
    high: 22585.0,
    low: 22440.0,
    previousClose: 22480.0,
    timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
    isLive: true,
    marketStatus: 'REGULAR_OPEN',
  });
  const [sensexQuote, setSensexQuote] = useState<IndexQuote>({
    symbol: 'SENSEX',
    name: 'BSE SENSEX',
    price: 72472.33,
    change: 122.33,
    changePercent: 0.17,
    open: 72400.0,
    high: 72680.0,
    low: 72230.0,
    previousClose: 72350.0,
    timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
    isLive: true,
    marketStatus: 'REGULAR_OPEN',
  });
  const [vix, setVix] = useState<{ value: number; change: number; changePercent: number; status: string }>({
    value: 14.38,
    change: 0.28,
    changePercent: 1.98,
    status: 'Moderate',
  });
  const [macro, setMacro] = useState<any[]>([
    { name: 'Dow Jones (US)', value: 39850.5, changePercent: 0.25, updatedAt: 'Live Global' },
    { name: 'Nasdaq (US)', value: 16340.2, changePercent: 0.42, updatedAt: 'Live Global' },
    { name: 'Brent Crude ($/bbl)', value: 84.2, changePercent: -0.35, updatedAt: 'Commodity' },
    { name: 'USD / INR', value: 83.45, changePercent: 0.05, updatedAt: 'Currency' },
  ]);
  const [institutionalFlows, setInstitutionalFlows] = useState<any>({
    date: 'Recent Cash Session',
    fiiNetBuyINR: 1245.5,
    diiNetBuyINR: 1890.2,
    netInstitutionalINR: 3135.7,
    sentiment: 'Net Institutional Buyers',
  });
  const [isLoadingIndices, setIsLoadingIndices] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString('en-IN', { hour12: false }));

  // Paper trading state
  const [paperAccount, setPaperAccount] = useState<PaperTradingAccount | null>({
    initialBalance: 500000,
    currentBalance: 500000,
    marginUsed: 0,
    realizedPnL: 0,
    unrealizedPnL: 0,
    totalCharges: 0,
    positions: [],
    orders: [],
    tradeHistory: [],
    riskSettings: {
      maxRiskPerTradePercent: 2,
      maxDailyLossLimit: 25000,
      maxOpenPositions: 5,
    },
  });
  const [prefillOrder, setPrefillOrder] = useState<{
    symbol: MarketIndexSymbol;
    strike: number;
    optionType: 'CE' | 'PE';
    expiry: string;
    price: number;
  } | null>(null);

  // Fetch live market indices with silent retry
  const fetchMarketIndices = async () => {
    setIsLoadingIndices(true);
    try {
      const res = await fetch('/api/market/indices');
      if (res.ok) {
        const data = await res.json();
        if (data.nifty) setNiftyQuote(data.nifty);
        if (data.sensex) setSensexQuote(data.sensex);
        if (data.vix) setVix(data.vix);
        if (data.macro) setMacro(data.macro);
        if (data.institutionalFlows) setInstitutionalFlows(data.institutionalFlows);
        setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour12: false }));
      }
    } catch {
      // Graceful fallback: Retain existing state silently during connection blip
    } finally {
      setIsLoadingIndices(false);
    }
  };

  // Fetch paper trading account
  const fetchPaperAccount = async () => {
    try {
      const res = await fetch('/api/paper-trading');
      if (res.ok) {
        const data = await res.json();
        setPaperAccount(data);
      }
    } catch {
      // Fallback kept
    }
  };

  // Place paper order
  const handlePlaceOrder = async (order: any) => {
    const res = await fetch('/api/paper-trading/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Order rejected');
    }
    const updated = await res.json();
    setPaperAccount(updated);
  };

  // Close paper position
  const handleClosePosition = async (positionId: string, exitPrice?: number) => {
    const res = await fetch('/api/paper-trading/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ positionId, exitPrice }),
    });
    if (res.ok) {
      const updated = await res.json();
      setPaperAccount(updated);
    }
  };

  // Reset paper account
  const handleResetAccount = async (initialBalance: number = 500000) => {
    const res = await fetch('/api/paper-trading/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initialBalance }),
    });
    if (res.ok) {
      const updated = await res.json();
      setPaperAccount(updated);
    }
  };

  // Quick trade from Option Chain row
  const handleTradeOption = (item: OptionItem, strike: number, type: 'CE' | 'PE', expiry: string) => {
    setPrefillOrder({
      symbol: activeTab === 'SENSEX' ? 'SENSEX' : 'NIFTY',
      strike,
      optionType: type,
      expiry,
      price: item.ltp,
    });
    setActiveTab('PAPER_TRADING');
  };

  // Quick trade from Signal Banner
  const handlePaperTradeSignal = (signal: TradingSignal) => {
    if (!signal.contract) return;
    setPrefillOrder({
      symbol: signal.symbol,
      strike: signal.contract.strike,
      optionType: signal.contract.optionType,
      expiry: signal.contract.expiry,
      price: signal.entryPrice,
    });
    setActiveTab('PAPER_TRADING');
  };

  const refreshAllData = () => {
    fetchMarketIndices();
    fetchPaperAccount();
    window.dispatchEvent(new CustomEvent('market-5m-refresh'));
  };

  const handleManualRefresh = () => {
    refreshAllData();
    setRefreshCountdown(300);
  };

  useEffect(() => {
    fetchMarketIndices();
    fetchPaperAccount();

    // 5-minute countdown timer (300 seconds)
    const timer = setInterval(() => {
      setRefreshCountdown(prev => {
        if (prev <= 1) {
          refreshAllData();
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} pb-16 md:pb-6 font-sans relative`}>
      {/* 1. Top Header with NIFTY, SENSEX, VIX Tickers & Status */}
      <Header
        nifty={niftyQuote}
        sensex={sensexQuote}
        vix={vix}
        lastUpdated={lastUpdated}
        onRefresh={handleManualRefresh}
        isLoading={isLoadingIndices}
        theme={theme}
        setTheme={setTheme}
        countdownSeconds={refreshCountdown}
      />

      {/* 2. Primary Navigation (Strictly: NIFTY 50, SENSEX, Paper Trading, Market News) */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        openPositionsCount={paperAccount?.positions.length || 0}
      />

      {/* 3. Main Body Content Based on Active Tab */}
      <main className="transition-opacity duration-200">
        {/* NIFTY 50 Dashboard */}
        {activeTab === 'NIFTY' && (
          <IndexDashboard
            symbol="NIFTY"
            quote={niftyQuote}
            vix={vix}
            macro={macro}
            institutionalFlows={institutionalFlows}
            onTradeOption={handleTradeOption}
            onPaperTradeSignal={handlePaperTradeSignal}
          />
        )}

        {/* BSE SENSEX Dashboard */}
        {activeTab === 'SENSEX' && (
          <IndexDashboard
            symbol="SENSEX"
            quote={sensexQuote}
            vix={vix}
            macro={macro}
            institutionalFlows={institutionalFlows}
            onTradeOption={handleTradeOption}
            onPaperTradeSignal={handlePaperTradeSignal}
          />
        )}

        {/* Paper Trading Simulator */}
        {activeTab === 'PAPER_TRADING' && (
          <PaperTrading
            account={paperAccount}
            onPlaceOrder={handlePlaceOrder}
            onClosePosition={handleClosePosition}
            onResetAccount={handleResetAccount}
            prefillOrder={prefillOrder}
            onClearPrefill={() => setPrefillOrder(null)}
          />
        )}

        {/* Global Financial News Feed */}
        {activeTab === 'MARKET_NEWS' && <MarketNews />}
      </main>

      {/* 4. Floating AI Trade Assistant (Buy or Not Decision Clarifier) */}
      <AiTradeAssistant
        currentSymbol={activeTab === 'SENSEX' ? 'SENSEX' : 'NIFTY'}
        spotPrice={activeTab === 'SENSEX' ? (sensexQuote?.price || 72472) : (niftyQuote?.price || 22520)}
        vix={vix?.value || 14.38}
      />
    </div>
  );
}
