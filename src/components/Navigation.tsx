import React from 'react';
import { LineChart, BarChart3, Wallet, Newspaper } from 'lucide-react';

export type TabType = 'NIFTY' | 'SENSEX' | 'PAPER_TRADING' | 'MARKET_NEWS';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  openPositionsCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  openPositionsCount,
}) => {
  const tabs = [
    {
      id: 'NIFTY' as TabType,
      label: 'NIFTY 50',
      description: 'NSE Benchmark & F&O',
      icon: LineChart,
      badge: null,
    },
    {
      id: 'SENSEX' as TabType,
      label: 'SENSEX',
      description: 'BSE 30 & Derivatives',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'PAPER_TRADING' as TabType,
      label: 'Paper Trading',
      description: 'Virtual F&O Execution',
      icon: Wallet,
      badge: openPositionsCount > 0 ? `${openPositionsCount} Pos` : null,
    },
    {
      id: 'MARKET_NEWS' as TabType,
      label: 'Market News',
      description: 'Live Macro & Headlines',
      icon: Newspaper,
      badge: 'Live',
    },
  ];

  return (
    <>
      {/* Desktop / Tablet Navigation Bar */}
      <nav className="border-b border-slate-800 bg-slate-900/60 sticky top-[57px] z-30 backdrop-blur">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex items-center space-x-1 sm:space-x-3 overflow-x-auto no-scrollbar py-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                        tab.id === 'PAPER_TRADING' && openPositionsCount > 0
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-700/80 text-slate-300'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 border-t border-slate-800 backdrop-blur md:hidden">
        <div className="grid grid-cols-4 py-1.5 px-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center justify-center py-1 px-1 rounded-md text-[11px] font-medium transition-colors relative ${
                  isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5 mb-0.5" />
                  {tab.id === 'PAPER_TRADING' && openPositionsCount > 0 && (
                    <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-emerald-500 text-slate-950 rounded-full text-[9px] font-mono font-bold flex items-center justify-center">
                      {openPositionsCount}
                    </span>
                  )}
                </div>
                <span className="truncate max-w-[70px]">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
