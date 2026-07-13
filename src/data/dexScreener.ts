import axios from 'axios';
import { NormalizedTokenData } from '../types';
import { config } from '../config';

const api = axios.create({
  baseURL: config.dexApiBase,
  timeout: 8000
});

export async function searchDexScreener(query: string): Promise<NormalizedTokenData | null> {
  try {
    if (config.isDev) console.log(`[DexScreener] Searching for ${query}`);
    const response = await api.get(`/search?q=${query}`);
    
    if (!response.data || !response.data.pairs || response.data.pairs.length === 0) {
      return null;
    }

    const pairs = response.data.pairs;
    let targetPair = pairs[0];

    // Try to find exact symbol match
    if (!query.startsWith('0x') && query.length < 20) {
      const match = pairs.find((p: any) => p.baseToken?.symbol?.toLowerCase() === query.toLowerCase());
      if (match) targetPair = match;
    }

    const priceUsd = parseFloat(targetPair.priceUsd || '0');
    
    return {
      symbol: targetPair.baseToken?.symbol?.toUpperCase() || 'UNKNOWN',
      name: targetPair.baseToken?.name || 'Unknown',
      price: priceUsd,
      priceChange24h: targetPair.priceChange?.h24 || 0,
      volume24h: targetPair.volume?.h24 || 0,
      marketCap: targetPair.marketCap || targetPair.fdv || null,
      fullyDilutedValue: targetPair.fdv || null,
      high24h: 0,
      low24h: 0,
      liquidityUSD: targetPair.liquidity?.usd || null,
      source: 'dexscreener',
      candles: [] // free API doesn't provide OHLCV series
    };

  } catch (error) {
    if (config.isDev) console.error(`[DexScreener] Search error for ${query}:`, error);
    return null;
  }
}
