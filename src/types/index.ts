// Token input types
export interface TokenInput {
  identifier: string;    // Could be BTC, BTC-USDT, or 0x contract address
  chain?: string;        // 'ethereum', 'solana', 'bsc', etc. (for contract addresses)
  identifierType: 'symbol' | 'contract';
}

// OKX market data shape
export interface OKXTickerData {
  instId: string;
  last: string;          // Last traded price
  lastSz: string;        // Last traded size
  askPx: string;         // Best ask price
  bidPx: string;         // Best bid price
  open24h: string;       // 24h open price
  high24h: string;       // 24h high
  low24h: string;        // 24h low
  vol24h: string;        // 24h volume (base currency)
  volCcy24h: string;     // 24h volume (quote currency)
  ts: string;            // Timestamp
}

export interface OKXCandleData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// GeckoTerminal data shape
export interface GeckoTokenData {
  name: string;
  symbol: string;
  address: string;
  price_usd: string;
  fdv_usd: string;
  market_cap_usd: string | null;
  volume_usd: {
    h24: string;
  };
  price_change_percentage: {
    h1: string;
    h6: string;
    h24: string;
  };
  top_pools?: Array<{
    dex: { name: string };
    reserve_in_usd: string;
  }>;
}

// Normalized data shape (what our AI layers consume)
export interface NormalizedTokenData {
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;        // percentage
  volume24h: number;             // in USD
  marketCap: number | null;
  fullyDilutedValue: number | null;
  high24h: number;
  low24h: number;
  liquidityUSD: number | null;   // from pools
  source: 'okx' | 'gecko' | 'dexscreener' | 'combined';
  candles?: OKXCandleData[];     // 30 days of OHLC
  fundingRate?: number | null;   // for perpetuals
  openInterest?: number | null;  // for perpetuals
  instId?: string;               // OKX instrument ID if available
  rawOKX?: OKXTickerData;
  rawGecko?: GeckoTokenData;
}

// Risk Analysis
export interface RiskAnalysis {
  score: number;               // 0-100 (100 = extremely risky)
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  flags: string[];             // Specific risk factors found
  summary: string;             // 1-2 sentence human-readable summary
}

// Market Analysis
export interface MarketAnalysis {
  trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS' | 'VOLATILE';
  strength: number;            // 0-100 (trend strength)
  support: number | null;
  resistance: number | null;
  volumeAnomaly: 'NORMAL' | 'UNUSUAL_SPIKE' | 'DUMP_DETECTED' | 'LOW_ACTIVITY';
  summary: string;
}

// Trade Plan
export interface TradePlan {
  verdict: 'AVOID' | 'WATCH' | 'ACCUMULATE' | 'HIGH_CONVICTION';
  verdictEmoji: '🔴' | '🟡' | '🟢' | '🚀';
  confidenceScore: number;     // 0-100
  entryZone: { low: number; high: number };
  stopLoss: number;
  takeProfits: { tp1: number; tp2: number; tp3: number };
  riskRewardRatio: string;     // e.g., "1:3.2"
  reasoning: string;           // 2-3 sentences
}

// Final Report
export interface AlphaReport {
  requestId: string;
  timestamp: string;
  token: NormalizedTokenData;
  risk: RiskAnalysis;
  market: MarketAnalysis;
  trade: TradePlan;
  markdown: string;            // Full formatted markdown version
  generatedInMs: number;       // How long it took
}

// Quick check (free tier)
export interface QuickCheckResult {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  riskLevel: string;
  verdict: string;
  note: string;                // "Upgrade to full analysis for trade plan"
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
}
