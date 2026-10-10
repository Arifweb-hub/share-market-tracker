import React, { useState, useEffect } from 'react';
import { TradingSignal } from '../types/market';
import {
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  Target,
  Percent,
  Layers,
  ArrowRight,
  Brain,
  RefreshCw,
  Newspaper,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

interface SignalCardProps {
  signal: TradingSignal | null;
  onPaperTrade: (signal: TradingSignal) => void;
  isInitiallyCollapsed?: boolean;
}

interface HumanIqThinking {
  humanMonologue: string;
  newsAssessment: string;
  indicatorStrategyVerdict: string;
  operatorTrapAnalysis: string;
  finalDecision: string;
  decisionVerdictType: 'DONT_BUY' | 'BUY_CALL' | 'BUY_PUT' | 'WAIT';
  whyBuyOrNot: string;
  changeMindTrigger: string;
}

export const SignalCard: React.FC<SignalCardProps> = ({ signal, onPaperTrade, isInitiallyCollapsed = false }) => {
  const [isCardCollapsed, setIsCardCollapsed] = useState<boolean>(isInitiallyCollapsed);
  const [showIqBreakdown, setShowIqBreakdown] = useState<boolean>(true);
  const [humanThinking, setHumanThinking] = useState<HumanIqThinking | null>(null);
  const [isThinkingLoading, setIsThinkingLoading] = useState<boolean>(false);

  const fetchHumanThinking = async () => {
    if (!signal) return;
    setIsThinkingLoading(true);
    try {
      const res = await fetch('/api/ai/human-iq-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: signal.symbol,
          spotPrice: signal.underlyingPrice,
          changePercent: 0.18,
          vix: 14.38,
          pcr: 1.01,
          maxPain: signal.underlyingPrice > 50000 ? 72500 : 22500,
          regime: signal.regime,
          signalAction: signal.action,
          supportingEvidence: signal.supportingEvidence,
          conflictingEvidence: signal.conflictingEvidence,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setHumanThinking(data);
      }
    } catch {
      // Keep existing thinking
    } finally {
      setIsThinkingLoading(false);
    }
  };

  const handleAskAiToClarify = () => {
    if (!signal) return;
    const q = `Clarify clearly: Should I buy or not right now on ${signal.symbol}? My spot is ${signal.underlyingPrice.toFixed(1)} and strategy says ${signal.action}.`;
    window.dispatchEvent(new CustomEvent('open-ai-trade-assistant', { detail: { question: q } }));
  };

  useEffect(() => {
    if (signal && !humanThinking) {
      fetchHumanThinking();
    }
  }, [signal?.id]);

  if (!signal) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-400">
        <div className="animate-spin inline-block w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full mb-2" />
        <p className="text-xs">Evaluating market regime & calculating trading signals...</p>
      </div>
    );
  }

  const isNoTrade = signal.action === 'NO TRADE';
  const isCall = signal.action.includes('CALL');
  const isPut = signal.action.includes('PUT');
  const isBuy = signal.action.startsWith('BUY');

  // Badge styling
  const actionColor = isNoTrade
    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    : isCall
    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
    : 'bg-rose-500/20 text-rose-400 border-rose-500/40';

  // If card is collapsed by user
  if (isCardCollapsed) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`px-2.5 py-0.5 rounded border font-mono font-bold text-xs ${actionColor}`}>
            {signal.action}
          </div>
          <div>
            <span className="text-xs font-bold text-slate-200">
              {signal.symbol} Trading Signal & 99% IQ Human Thought
            </span>
            <span className="text-[11px] text-slate-400 ml-2 font-mono">
              (Confidence: {signal.confidenceScore}%)
            </span>
            <span className="text-[10px] text-slate-500 ml-2">• Hidden</span>
          </div>
        </div>

        <button
          onClick={() => setIsCardCollapsed(false)}
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 transition-colors cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Show Signal & Human IQ</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
      {/* Top Banner */}
      <div className="p-3.5 sm:p-4 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`px-3 py-1 rounded-lg border font-mono font-bold text-xs sm:text-sm tracking-wide flex items-center gap-1.5 ${actionColor}`}
          >
            {isNoTrade ? (
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            ) : isCall ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-400" />
            )}
            <span>{signal.action}</span>
          </div>

          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-slate-200">
              {signal.strategyName}
            </h3>
            <p className="text-[10px] text-slate-400">
              Regime: <span className="font-mono text-slate-300">{signal.regime.replace('_', ' ')}</span> • Underlying Spot: <span className="font-mono text-slate-300 font-semibold">{signal.underlyingPrice.toFixed(1)}</span>
            </p>
          </div>
        </div>

        {/* Confidence Score Bar */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Signal Evidence Score</span>
            <div className="flex items-center gap-1.5">
              <div className="w-20 bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
                <div
                  className={`h-full rounded-full transition-all ${
                    signal.confidenceScore >= 70
                      ? 'bg-emerald-500'
                      : signal.confidenceScore >= 50
                      ? 'bg-amber-400'
                      : 'bg-slate-500'
                  }`}
                  style={{ width: `${signal.confidenceScore}%` }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-slate-200">
                {signal.confidenceScore}/100
              </span>
            </div>
          </div>

          {!isNoTrade && signal.contract && (
            <button
              onClick={() => onPaperTrade(signal)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Simulate Trade</span>
            </button>
          )}

          {/* Hide / Minimize Entire Signal Card Button */}
          <button
            onClick={() => setIsCardCollapsed(true)}
            className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-colors cursor-pointer"
            title="Hide / Minimize Signal Card"
          >
            <EyeOff className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Hide</span>
          </button>
        </div>
      </div>

      {/* Main Content Details */}
      <div className="p-3.5 sm:p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left Column: Contract & Execution Levels */}
        <div className="space-y-3">
          {signal.contract ? (
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
              <div className="text-[11px] text-slate-400 uppercase font-semibold mb-1">
                Recommended Contract
              </div>
              <div className="text-sm font-bold font-mono text-slate-100 flex items-center justify-between">
                <span>
                  {signal.contract.symbol} {signal.contract.strike} {signal.contract.optionType}
                </span>
                <span className="text-emerald-400">₹{signal.contract.currentPremium}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                <span>Expiry: {signal.contract.expiry}</span>
                <span>Lot Size: {signal.contract.lotSize} units</span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 text-slate-400 text-xs">
              <p className="font-medium text-amber-300 flex items-center gap-1 mb-1">
                <ShieldAlert className="w-3.5 h-3.5" /> No Trade Stance
              </p>
              <p className="text-[11px] text-slate-400">
                Markets are range-bound with mixed institutional flows. Staying in cash protects trading capital.
              </p>
            </div>
          )}

          {/* Pricing Grid */}
          {!isNoTrade && (
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-800/40 border border-slate-700/60 p-2 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-sans">Entry Range</span>
                <span className="text-slate-100 font-bold">
                  ₹{signal.entryRange[0]} - ₹{signal.entryRange[1]}
                </span>
              </div>
              <div className="bg-slate-800/40 border border-slate-700/60 p-2 rounded-lg">
                <span className="text-[10px] text-rose-400 block font-sans">Stop Loss</span>
                <span className="text-rose-300 font-bold">₹{signal.stopLoss}</span>
              </div>
              <div className="bg-slate-800/40 border border-slate-700/60 p-2 rounded-lg">
                <span className="text-[10px] text-emerald-400 block font-sans">Target 1</span>
                <span className="text-emerald-300 font-bold">₹{signal.target1}</span>
              </div>
              <div className="bg-slate-800/40 border border-slate-700/60 p-2 rounded-lg">
                <span className="text-[10px] text-emerald-400 block font-sans">Target 2</span>
                <span className="text-emerald-300 font-bold">₹{signal.target2}</span>
              </div>
            </div>
          )}

          {/* Risk/Reward and Position limits */}
          {!isNoTrade && (
            <div className="flex items-center justify-between text-xs bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/60">
              <div>
                <span className="text-[10px] text-slate-400 block">Risk : Reward</span>
                <span className="font-bold font-mono text-emerald-400">{signal.riskRewardRatio} : 1</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Max Risk / Lot</span>
                <span className="font-bold font-mono text-rose-400">₹{signal.maxLoss}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Potential Gain</span>
                <span className="font-bold font-mono text-emerald-400">₹{signal.potentialReward}</span>
              </div>
            </div>
          )}
        </div>

        {/* Center Column: Supporting Evidence */}
        <div className="space-y-2">
          <div className="text-[11px] uppercase font-semibold text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Supporting Evidence ({signal.supportingEvidence.length})</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 space-y-1.5 max-h-48 overflow-y-auto">
            {signal.supportingEvidence.map((ev, i) => (
              <div key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">•</span>
                <span className="leading-snug">{ev}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Conflicting Evidence & Invalidation */}
        <div className="space-y-2">
          <div className="text-[11px] uppercase font-semibold text-slate-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Key Risks & Invalidation Triggers</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 space-y-1.5 max-h-48 overflow-y-auto">
            {signal.conflictingEvidence.map((conf, i) => (
              <div key={i} className="text-xs text-amber-300/90 flex items-start gap-1.5">
                <span className="text-amber-400 font-bold">!</span>
                <span className="leading-snug">{conf}</span>
              </div>
            ))}
            {signal.invalidationConditions.map((inv, i) => (
              <div key={`inv_${i}`} className="text-xs text-slate-400 flex items-start gap-1.5">
                <span className="text-rose-400 font-bold">✕</span>
                <span className="leading-snug text-slate-400">{inv}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 99% IQ Level Human Signal Engine */}
      <div className="px-3.5 py-3 border-t border-slate-800 bg-slate-950/90 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono text-[11px] font-bold uppercase tracking-wider">
              99% IQ LEVEL HUMAN SIGNAL
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-200">
              How a Master Human Trader Thinks: Buy or Not?
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchHumanThinking}
              disabled={isThinkingLoading}
              className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh human trader thought process"
            >
              <RefreshCw className={`w-3 h-3 text-purple-400 ${isThinkingLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isThinkingLoading ? 'Synthesizing...' : 'Re-Think'}</span>
            </button>

            <button
              onClick={() => setShowIqBreakdown(!showIqBreakdown)}
              className="flex items-center gap-1 text-[11px] font-semibold text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
            >
              {showIqBreakdown ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Hide Breakdown</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Show Breakdown</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 1 & 2: Monologue and 4 Reference Pillars (Collapsible via Hide Breakdown) */}
        {showIqBreakdown && (
          <div className="space-y-3 pt-1">
            {/* 1. The Human Monologue / Thinking Voice */}
            <div className="bg-slate-900 border border-purple-500/30 rounded-xl p-3 sm:p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold text-purple-300 flex items-center gap-1.5 font-mono">
                  <Brain className="w-3.5 h-3.5 text-purple-400" />
                  <span>1. My Internal Monologue as a Veteran Human Trader</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                  Synthesizing Greed, Fear & Mathematical Edge
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed italic bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 font-sans">
                "{humanThinking?.humanMonologue || signal.institutionalIqAnalysis?.microstructureSummary || 'Evaluating market balance: In range-bound setups, retail impatience is the primary fuel for option seller profits. Staying disciplined protects capital.'}"
              </p>
            </div>

            {/* 2. Grid of 4 Key Reference Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
              {/* News & Macro Reality */}
              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg space-y-1">
                <div className="flex items-center gap-1 text-[10px] text-sky-400 uppercase font-bold">
                  <Newspaper className="w-3 h-3" />
                  <span>News & Macro Filter</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {humanThinking?.newsAssessment || 'News headlines are creating retail noise, but underlying volume shows institutional writers are defending round strikes.'}
                </p>
              </div>

              {/* Technical Indicator Verdict */}
              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg space-y-1">
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 uppercase font-bold">
                  <Layers className="w-3 h-3" />
                  <span>Technical Proof</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {humanThinking?.indicatorStrategyVerdict || signal.institutionalIqAnalysis?.gammaThetaProfile || 'Price is testing intraday VWAP without momentum divergence. Moving averages are clustering.'}
                </p>
              </div>

              {/* The Trap I Am Dodging */}
              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg space-y-1">
                <div className="flex items-center gap-1 text-[10px] text-amber-400 uppercase font-bold">
                  <AlertTriangle className="w-3 h-3" />
                  <span>The Trap I Avoid</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {humanThinking?.operatorTrapAnalysis || signal.institutionalIqAnalysis?.trapDetection || 'Refusing to chase intra-range pops. Theta decay will punish options buyers before any real breakout.'}
                </p>
              </div>

              {/* The Condition That Changes My Mind */}
              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg space-y-1">
                <div className="flex items-center gap-1 text-[10px] text-purple-400 uppercase font-bold">
                  <Zap className="w-3 h-3" />
                  <span>What Flips My Stance</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {humanThinking?.changeMindTrigger || 'A sustained 15-minute close above day high or below day low with significant volume expansion.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3. The Definitive Human Call Banner (Always Shown as Requested in 2nd Photo) */}
        <div className="bg-slate-900/95 border border-purple-500/40 rounded-xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            <div className="px-3 py-1.5 rounded-lg font-mono font-bold text-xs bg-slate-950 border border-purple-500/50 text-slate-100 flex items-center gap-2 shadow-inner whitespace-nowrap">
              <Target className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="tracking-wide">
                {humanThinking?.finalDecision || (isNoTrade ? '🚫 MY CALL: DO NOT BUY - STAY IN CASH / THETA PIN TRAP' : `⚡ MY CALL: ${signal.action}`)}
              </span>
            </div>
            <span className="text-slate-300 text-xs flex-1 min-w-[220px] leading-relaxed">
              {humanThinking?.whyBuyOrNot || (isNoTrade ? 'Do not buy calls or puts right now because Nifty is trapped in a low-volatility theta pin around the 22,500 Max Pain strike, meaning options buyers will bleed premium while institutional writers harvest the decay.' : 'Execute strictly within the defined entry range with stop-loss protection.')}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleAskAiToClarify}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
              title="Ask AI Assistant to clarify Buy or Not"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Clarify "Buy or Not" with AI</span>
            </button>

            {!isNoTrade && signal.contract && (
              <button
                onClick={() => onPaperTrade(signal)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow transition-colors cursor-pointer whitespace-nowrap"
              >
                <Zap className="w-3 h-3 fill-current" />
                <span>Test Trade</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer Summary */}
      <div className="px-3.5 py-2 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <p className="text-slate-300 line-clamp-1 italic">
          "{signal.aiAnalysisSummary}"
        </p>
        <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500 whitespace-nowrap">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>Evaluated at: {signal.timestamp}</span>
        </div>
      </div>
    </div>
  );
};
