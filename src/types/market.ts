export type MarketIndexSymbol = 'NIFTY' | 'SENSEX';

export interface IndexQuote {
  symbol: MarketIndexSymbol;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  timestamp: string;
  isLive: boolean;
  marketStatus: 'PRE_OPEN' | 'REGULAR_OPEN' | 'POST_CLOSE' | 'CLOSED_WEEKEND' | 'HOLIDAY';
}

export interface MacroIndicator {
  name: string;
  value: number | string;
  change?: number;
  changePercent?: number;
  status?: string;
  updatedAt: string;
}

export interface Candle {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OptionGreeks {
  delta: number;
  gamma: number;
  theta: number; // Daily theta decay in INR
  vega: number;  // Per 1% IV change in INR
}

export interface OptionItem {
  strike: number;
  optionType: 'CE' | 'PE';
  ltp: number;
  change: number;
  changePercent: number;
  bid: number;
  ask: number;
  volume: number;
  openInterest: number;
  changeInOI: number;
  iv: number; // Implied Volatility %
  greeks: OptionGreeks;
  inTheMoney: boolean;
}

export interface StrikeRow {
  strike: number;
  call: OptionItem;
  put: OptionItem;
  isATM: boolean;
  distanceFromSpot: number;
}

export interface OptionChainData {
  symbol: MarketIndexSymbol;
  underlyingPrice: number;
  expiryDate: string;
  availableExpiries: string[];
  strikes: StrikeRow[];
  atmStrike: number;
  pcrOI: number;
  pcrVolume: number;
  maxPain: number;
  totalCallOI: number;
  totalPutOI: number;
  lastUpdated: string;
}

export type SignalAction = 'BUY CALL' | 'SELL CALL' | 'BUY PUT' | 'SELL PUT' | 'NO TRADE';

export interface TradingSignal {
  id: string;
  symbol: MarketIndexSymbol;
  action: SignalAction;
  underlyingPrice: number;
  confidenceScore: number; // 0 - 100 evidence-based score
  regime: 'TRENDING_BULLISH' | 'TRENDING_BEARISH' | 'RANGE_BOUND' | 'HIGH_VOLATILITY';
  strategyName: string;
  contract: {
    symbol: MarketIndexSymbol;
    strike: number;
    optionType: 'CE' | 'PE';
    expiry: string;
    lotSize: number;
    currentPremium: number;
  } | null;
  entryPrice: number;
  entryRange: [number, number];
  stopLoss: number;
  target1: number;
  target2: number;
  riskRewardRatio: number;
  recommendedLots: number;
  maxLoss: number;
  potentialReward: number;
  expectedHoldingPeriod: string;
  supportingEvidence: string[];
  conflictingEvidence: string[];
  invalidationConditions: string[];
  aiAnalysisSummary: string;
  institutionalIqAnalysis?: {
    microstructureSummary: string;
    trapDetection: string;
    gammaThetaProfile: string;
    mathExpectancy: string;
    executionPlaybook: string[];
  };
  timestamp: string;
  isStale: boolean;
}

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  source: string;
  category: string;
  relatedAsset: 'NIFTY' | 'SENSEX' | 'MACRO' | 'COMMODITY' | 'GLOBAL';
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED';
  relevance: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'CONFIRMED' | 'SCHEDULED' | 'SPECULATIVE';
  summary?: string;
  bullishImplications?: string;
  bearishImplications?: string;
  isPricedIn?: boolean;
}

export interface PaperTradePosition {
  id: string;
  symbol: MarketIndexSymbol;
  strike: number;
  optionType: 'CE' | 'PE';
  expiry: string;
  orderType: 'BUY' | 'SELL';
  quantity: number; // in units (lots * lotSize)
  lots: number;
  lotSize: number;
  avgEntryPrice: number;
  currentLtp: number;
  stopLoss?: number;
  target?: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  charges: number; // Brokerage, STT, GST
  entryTime: string;
}

export interface PaperTradeOrder {
  id: string;
  symbol: MarketIndexSymbol;
  strike: number;
  optionType: 'CE' | 'PE';
  expiry: string;
  orderType: 'BUY' | 'SELL';
  lots: number;
  lotSize: number;
  executionType: 'MARKET' | 'LIMIT' | 'TRIGGER';
  requestedPrice: number;
  executedPrice?: number;
  status: 'PENDING' | 'FILLED' | 'CANCELLED' | 'REJECTED';
  stopLoss?: number;
  target?: number;
  timestamp: string;
  notes?: string;
}

export interface PaperTradeHistoryItem {
  id: string;
  symbol: MarketIndexSymbol;
  strike: number;
  optionType: 'CE' | 'PE';
  orderType: 'BUY' | 'SELL';
  lots: number;
  lotSize: number;
  entryPrice: number;
  exitPrice: number;
  realizedPnL: number;
  charges: number;
  netPnL: number;
  entryTime: string;
  exitTime: string;
  reason: 'TARGET_HIT' | 'STOP_LOSS_HIT' | 'MANUAL_EXIT' | 'EXPIRED';
}

export interface PaperTradingAccount {
  initialBalance: number;
  currentBalance: number;
  marginUsed: number;
  realizedPnL: number;
  unrealizedPnL: number;
  totalCharges: number;
  positions: PaperTradePosition[];
  orders: PaperTradeOrder[];
  tradeHistory: PaperTradeHistoryItem[];
  riskSettings: {
    maxRiskPerTradePercent: number; // e.g. 2%
    maxDailyLossLimit: number;      // e.g. 25000
    maxOpenPositions: number;       // e.g. 5
  };
}

export interface BacktestResult {
  strategyName: string;
  symbol: MarketIndexSymbol;
  period: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number; // %
  profitFactor: number;
  netProfit: number; // in INR
  maxDrawdown: number; // %
  expectancy: number; // in INR per trade
  sharpeRatio: number;
  averageWin: number;
  averageLoss: number;
  trades: {
    entryTime: string;
    exitTime: string;
    type: 'BUY CALL' | 'BUY PUT' | 'SELL CALL' | 'SELL PUT';
    strike: number;
    entryPrice: number;
    exitPrice: number;
    pnl: number;
    outcome: 'WIN' | 'LOSS';
    reason: string;
  }[];
}
