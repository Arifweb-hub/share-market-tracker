import React, { useState, useEffect } from 'react';
import { NewsItem } from '../types/market';
import {
  Newspaper,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

export const MarketNews: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [filterSentiment, setFilterSentiment] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [newsCountdown, setNewsCountdown] = useState<number>(300);

  const fetchNews = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/news');
      if (res.ok) {
        const data = await res.json();
        setNews(data);
        setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour12: false }));
        setNewsCountdown(300);
      }
    } catch {
      // Retain existing news on temporary connection glitch
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    const handleRefresh = () => fetchNews();
    window.addEventListener('market-5m-refresh', handleRefresh);

    const timer = setInterval(() => {
      setNewsCountdown(prev => {
        if (prev <= 1) {
          fetchNews();
          return 300;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      clearInterval(timer);
      window.removeEventListener('market-5m-refresh', handleRefresh);
    };
  }, []);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const filteredNews = news.filter(item => {
    if (filterSentiment !== 'ALL' && item.sentiment !== filterSentiment) return false;
    if (filterCategory !== 'ALL' && item.relatedAsset !== filterCategory) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 space-y-4">
      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-emerald-400" />
            <span>Global & Indian Financial News Feed</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time macroeconomic headlines from The Economic Times Markets • Deduplicated & Sentiment-Enriched
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700/80 rounded-md px-2 py-1 text-[11px] text-slate-300 font-mono">
            <span className="text-slate-500 hidden sm:inline">Auto 5m:</span>
            <span className="text-emerald-400 font-bold">{formatCountdown(newsCountdown)}</span>
          </div>

          <button
            onClick={fetchNews}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">{isLoading ? 'Updating...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 text-[11px] flex items-center gap-1">
            <Filter className="w-3 h-3" /> Sentiment:
          </span>
          {['ALL', 'POSITIVE', 'NEGATIVE', 'NEUTRAL', 'MIXED'].map(sent => (
            <button
              key={sent}
              onClick={() => setFilterSentiment(sent)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                filterSentiment === sent
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                  : 'bg-slate-850 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {sent}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 text-[11px]">Category:</span>
          {['ALL', 'NIFTY', 'SENSEX', 'MACRO', 'COMMODITY', 'GLOBAL'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                filterCategory === cat
                  ? 'bg-slate-700 text-white font-bold border border-slate-600'
                  : 'bg-slate-850 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* News Articles Grid */}
      {isLoading && news.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-400">
          <div className="inline-block animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full mb-2" />
          <p>Fetching and deduplicating latest financial market news...</p>
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500 bg-slate-900 border border-slate-800 rounded-xl">
          No articles match the current filter selection.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredNews.map(item => {
            const isPositive = item.sentiment === 'POSITIVE';
            const isNegative = item.sentiment === 'NEGATIVE';

            return (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-xs transition-colors"
              >
                <div className="space-y-2">
                  {/* Badges row */}
                  <div className="flex items-center justify-between text-[11px] gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-semibold font-mono">
                        {item.relatedAsset}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          isPositive
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : isNegative
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {item.sentiment}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-850 text-slate-400 text-[10px]">
                        Relevance: {item.relevance}
                      </span>
                    </div>

                    <span className="text-slate-500 font-mono text-[10px] shrink-0">
                      {new Date(item.pubDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Headline */}
                  <h3 className="font-bold text-sm text-slate-100 hover:text-emerald-400 transition-colors leading-snug">
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="flex items-start gap-1">
                      <span>{item.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-1 inline" />
                    </a>
                  </h3>

                  {/* AI Implication Synthesis */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 text-xs space-y-1.5">
                    <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      <span>F&O Market Impact Analysis</span>
                    </div>
                    <div className="text-[11px] text-slate-300 flex items-start gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item.bullishImplications}</span>
                    </div>
                    <div className="text-[11px] text-slate-300 flex items-start gap-1">
                      <TrendingDown className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />
                      <span>{item.bearishImplications}</span>
                    </div>
                  </div>
                </div>

                {/* Footer publisher info */}
                <div className="border-t border-slate-800/80 pt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Source: {item.source}</span>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Read Full Story</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
