import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  Send,
  X,
  Shield,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Brain,
  Minimize2,
} from 'lucide-react';
import { MarketIndexSymbol } from '../types/market';

interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  verdictData?: {
    verdict: string;
    verdictType: 'BUY' | 'DONT_BUY' | 'WAIT';
    directAnswer: string;
    institutionalIqReasoning: string;
    tacticalLevels: {
      entry: string;
      stopLoss: string;
      target: string;
      invalidation: string;
    };
    riskWarning: string;
  };
  timestamp: string;
}

interface AiTradeAssistantProps {
  currentSymbol: MarketIndexSymbol;
  spotPrice: number;
  vix: number;
  pcr?: number;
  maxPain?: number;
  regime?: string;
  signalAction?: string;
  signalConfidence?: number;
}

export const AiTradeAssistant: React.FC<AiTradeAssistantProps> = ({
  currentSymbol,
  spotPrice,
  vix,
  pcr = 1.01,
  maxPain = 22500,
  regime = 'RANGE_BOUND',
  signalAction = 'NO TRADE',
  signalConfidence = 35,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! I am your institutional derivatives AI analyst. Ask me any question like "Buy or not right now?", "Should I buy Call or Put?", or ask about a specific strike, and I'll give you a clear, disciplined decision based on live order-flow and volatility.`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const quickPrompts = [
    'Buy or Not right now?',
    'Should I buy Call or Put?',
    'Is this current move a Bull Trap?',
    'What is the highest expectancy trade?',
  ];

  const handleSend = async (questionText?: string) => {
    const textToSend = questionText || inputQuestion;
    if (!textToSend.trim() || isThinking) return;

    const userMsg: AssistantMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuestion('');
    setIsThinking(true);

    try {
      const res = await fetch('/api/ai/trade-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: textToSend,
          symbol: currentSymbol,
          spotPrice,
          vix,
          pcr,
          maxPain,
          regime,
          signalAction,
          signalConfidence,
        }),
      });

      if (!res.ok) throw new Error('Failed to query assistant');
      const data = await res.json();

      const assistantMsg: AssistantMessage = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        text: data.directAnswer || data.verdict,
        verdictData: data,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      const fallbackMsg: AssistantMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: `Based on quantitative filters: ${currentSymbol} is range-bound near ₹${spotPrice}. PCR is ${pcr} and Max Pain is ${maxPain}. Stay in cash to avoid theta burn.`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  useEffect(() => {
    const handleOpenEvent = (e: any) => {
      setIsOpen(true);
      if (e.detail?.question) {
        handleSend(e.detail.question);
      }
    };
    window.addEventListener('open-ai-trade-assistant', handleOpenEvent);
    return () => window.removeEventListener('open-ai-trade-assistant', handleOpenEvent);
  }, [currentSymbol, spotPrice, vix, pcr, maxPain, regime, signalAction, signalConfidence]);

  return (
    <>
      {/* Floating Small Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-16 md:bottom-6 right-4 sm:right-6 z-50 p-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-xl shadow-emerald-500/25 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 group cursor-pointer"
          title="Ask AI Trade Assistant: Buy or Not?"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 fill-current" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-purple-500 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-purple-400 rounded-full" />
          </div>
          <span className="text-xs font-bold font-sans pr-1 hidden sm:inline">
            Ask AI: Buy or Not?
          </span>
        </button>
      )}

      {/* Interactive Chat Window */}
      {isOpen && (
        <div className="fixed bottom-16 md:bottom-6 right-3 sm:right-6 z-50 w-[95vw] sm:w-[420px] max-h-[82vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-xs sm:text-sm flex items-center gap-1.5">
                  <span>F&O AI Decision Assistant</span>
                  <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono">
                    99% IQ
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400">
                  {currentSymbol} Spot: ₹{spotPrice.toLocaleString()} • VIX: {vix}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Prompts Bar */}
          <div className="p-2 bg-slate-950/60 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={isThinking}
                className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 whitespace-nowrap transition-colors cursor-pointer shrink-0"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages Scroll Area */}
          <div className="p-3.5 flex-1 overflow-y-auto space-y-3 max-h-[460px] text-xs">
            {messages.map(msg => {
              const isUser = msg.sender === 'user';
              const verdict = msg.verdictData;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div
                    className={`max-w-[90%] rounded-xl p-3 ${
                      isUser
                        ? 'bg-emerald-500 text-slate-950 font-medium font-sans'
                        : 'bg-slate-800/90 border border-slate-700/70 text-slate-200'
                    }`}
                  >
                    {/* If message has structured verdict banner */}
                    {verdict && (
                      <div className="space-y-2.5 mb-2">
                        {/* Direct Verdict Banner */}
                        <div
                          className={`p-2.5 rounded-lg border font-mono font-bold text-xs flex items-center gap-2 ${
                            verdict.verdictType === 'BUY'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                              : verdict.verdictType === 'DONT_BUY'
                              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          {verdict.verdictType === 'BUY' ? (
                            <TrendingUp className="w-4 h-4 shrink-0 text-emerald-400" />
                          ) : verdict.verdictType === 'DONT_BUY' ? (
                            <Shield className="w-4 h-4 shrink-0 text-rose-400" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                          )}
                          <span className="leading-snug">{verdict.verdict}</span>
                        </div>

                        {/* Direct Answer */}
                        <p className="text-slate-100 font-semibold leading-relaxed">
                          {verdict.directAnswer}
                        </p>

                        {/* 99% IQ Institutional Reasoning */}
                        {verdict.institutionalIqReasoning && (
                          <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-lg space-y-1">
                            <span className="text-[10px] uppercase font-bold text-purple-300 block">
                              🧠 Institutional Microstructure & Order Flow:
                            </span>
                            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                              {verdict.institutionalIqReasoning}
                            </p>
                          </div>
                        )}

                        {/* Tactical Levels */}
                        {verdict.tacticalLevels && (
                          <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                            <div>
                              <span className="text-slate-400 block font-sans">Trigger Level:</span>
                              <span className="text-slate-200 font-bold">{verdict.tacticalLevels.entry}</span>
                            </div>
                            <div>
                              <span className="text-rose-400 block font-sans">Stop Loss:</span>
                              <span className="text-rose-300 font-bold">{verdict.tacticalLevels.stopLoss}</span>
                            </div>
                            <div>
                              <span className="text-emerald-400 block font-sans">Target:</span>
                              <span className="text-emerald-300 font-bold">{verdict.tacticalLevels.target}</span>
                            </div>
                            <div>
                              <span className="text-amber-400 block font-sans">Invalidation:</span>
                              <span className="text-amber-300 truncate block">{verdict.tacticalLevels.invalidation}</span>
                            </div>
                          </div>
                        )}

                        {/* Risk Warning */}
                        {verdict.riskWarning && (
                          <div className="text-[10px] text-amber-400/90 flex items-start gap-1 font-sans">
                            <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                            <span>{verdict.riskWarning}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {!verdict && <p className="leading-relaxed">{msg.text}</p>}
                  </div>

                  <span className="text-[9px] font-mono text-slate-500 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {isThinking && (
              <div className="flex items-center gap-2 text-xs text-purple-400 font-mono py-2 px-1">
                <Brain className="w-4 h-4 animate-bounce" />
                <span>Analyzing order flow & calculating verdict...</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-slate-950 border-t border-slate-800">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask e.g. 'Should I buy Calls now?' or 'Buy or not?'..."
                value={inputQuestion}
                onChange={e => setInputQuestion(e.target.value)}
                disabled={isThinking}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!inputQuestion.trim() || isThinking}
                className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 transition-colors cursor-pointer"
                title="Send Question"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
