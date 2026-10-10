import React, { useState, useEffect } from 'react';
import { MarketIndexSymbol, TradingSignal, OptionChainData } from '../types/market';
import { Sparkles, Brain, Shield, TrendingUp, TrendingDown, RefreshCw, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface AiReasoningProps {
  symbol: MarketIndexSymbol;
  signal: TradingSignal | null;
  optionChain: OptionChainData | null;
  vix: number;
}

interface AiAnalysisResult {
  regimeSummary: string;
  institutionalThesis: string;
  bullishScenario: string;
  bearishScenario: string;
  analystVerdict: string;
}

export const AiReasoningPanel: React.FC<AiReasoningProps> = ({
  symbol,
  signal,
  optionChain,
  vix,
}) => {
  const [analysis, setAnalysis] = useState<AiAnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const fetchAiAnalysis = async () => {
    if (!signal || !optionChain) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/analyze-market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          spotPrice: optionChain.underlyingPrice,
          changePercent: signal.underlyingPrice ? 0.35 : 0,
          regime: signal.regime,
          pcr: optionChain.pcrOI,
          maxPain: optionChain.maxPain,
          vix,
          supportingEvidence: signal.supportingEvidence,
          conflictingEvidence: signal.conflictingEvidence,
        }),
      });
      if (!res.ok) throw new Error('Failed to generate AI analysis');
      const data = await res.json();
      setAnalysis(data);
    } catch {
      setError('AI reasoning unavailable temporarily. Using quantitative strategy logic.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (signal && optionChain && !analysis) {
      fetchAiAnalysis();
    }
  }, [symbol, signal?.id]);

  if (isCollapsed) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Brain className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-200">
            Human-Like AI Market Reasoning (Gemini 3.8 Flash)
          </span>
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">• Hidden</span>
        </div>

        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-300 hover:bg-purple-500/25 border border-purple-500/30 transition-colors cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Show Analysis</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <span>Human-Like AI Market Reasoning</span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                Gemini 3.8 Flash
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">
              Senior Derivatives Strategist Thesis • Disciplined Risk Management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsCollapsed(true)}
            className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            title="Hide / Minimize AI Reasoning Box"
          >
            <EyeOff className="w-3 h-3 text-slate-400" />
            <span>Hide</span>
          </button>

          <button
            onClick={fetchAiAnalysis}
            disabled={loading}
            className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-purple-400' : ''}`} />
            <span>{loading ? 'Analyzing...' : 'Re-Evaluate'}</span>
          </button>
        </div>
      </div>

      {loading && !analysis ? (
        <div className="py-6 text-center text-xs text-slate-400">
          <div className="inline-block animate-spin w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full mb-2" />
          <p>Synthesizing price action, options chain and macroeconomic cues...</p>
        </div>
      ) : analysis ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Regime & Institutional Thesis */}
          <div className="space-y-2">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                1. Market Structure & Regime
              </span>
              <p className="text-slate-300 leading-relaxed">
                {analysis.regimeSummary}
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                2. Institutional F&O Positioning
              </span>
              <p className="text-slate-300 leading-relaxed">
                {analysis.institutionalThesis}
              </p>
            </div>
          </div>

          {/* Bull vs Bear Scenarios & Verdict */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-lg p-2.5">
                <div className="flex items-center gap-1 text-emerald-400 font-bold text-[10px] uppercase mb-1">
                  <TrendingUp className="w-3 h-3" /> Bullish Case
                </div>
                <p className="text-slate-300 text-[11px] leading-snug">
                  {analysis.bullishScenario}
                </p>
              </div>

              <div className="bg-rose-950/20 border border-rose-900/30 rounded-lg p-2.5">
                <div className="flex items-center gap-1 text-rose-400 font-bold text-[10px] uppercase mb-1">
                  <TrendingDown className="w-3 h-3" /> Bearish Case
                </div>
                <p className="text-slate-300 text-[11px] leading-snug">
                  {analysis.bearishScenario}
                </p>
              </div>
            </div>

            <div className="bg-purple-950/20 border border-purple-900/30 rounded-lg p-3">
              <div className="flex items-center gap-1 text-purple-300 font-bold text-[10px] uppercase mb-1">
                <Shield className="w-3 h-3" /> Senior Analyst Verdict
              </div>
              <p className="text-purple-100 font-medium text-[11px] leading-relaxed">
                {analysis.analystVerdict}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-slate-500 text-xs py-4 text-center">
          Click "Re-Evaluate" to trigger an AI-assisted synthesis of current market conditions.
        </div>
      )}
    </div>
  );
};
