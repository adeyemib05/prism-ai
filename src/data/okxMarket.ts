import axios from 'axios';
import { OKXTickerData, OKXCandleData, NormalizedTokenData } from '../types';
import { config } from '../config';

const api = axios.create({
  baseURL: config.okxApiBase,
  timeout: 8000,
});

export function normalizeSymbol(input: string): string {
  let instId = input.trim().toUpperCase();
  if (instId === 'BITCOIN') return 'BTC-USDT';
  if (instId === 'ETHEREUM') return 'ETH-USDT';
  if (!instId.includes('-')) {
    instId = `${instId}-USDT`;
  }
  return instId;
}

export async function getOKXTicker(instId: string): Promise<OKXTickerData | null> {
  try {
    if (config.isDev) console.log(`[OKX] Fetching ticker for ${instId}`);
    const response = await api.get(`/market/ticker?instId=${instId}`);
    if (response.data && response.data.data && response.data.data.length > 0) {
      return response.data.data[0] as OKXTickerData;
    }
    return null;
  } catch (error) {
    if (config.isDev) console.error(`[OKX] getOKXTicker error for ${instId}:`, error);
    return null;
  }
}

export async function getOKXCandles(instId: string, days: number = 30): Promise<OKXCandleData[]> {
  try {
    if (config.isDev) console.log(`[OKX] Fetching candles for ${instId}`);
    const response = await api.get(`/market/candles?instId=${instId}&bar=1D&limit=${days}`);
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      // OKX candles come in NEWEST-FIRST order — reverse the array
      const candles = response.data.data.map((c: string[]) => ({
        timestamp: c[0],
        open: parseFloat(c[1]),
        high: parseFloat(c[2]),
        low: parseFloat(c[3]),
        close: parseFloat(c[4]),
        volume: parseFloat(c[5])
      })).reverse();
      return candles;
    }
    return [];
  } catch (error) {
    if (config.isDev) console.error(`[OKX] getOKXCandles error for ${instId}:`, error);
    return [];
  }
}

export async function getOKXFundingRate(instId: string): Promise<number | null> {
  try {
    const perpId = instId.replace('-USDT', '-USDT-SWAP');
    if (config.isDev) console.log(`[OKX] Fetching funding rate for ${perpId}`);
    const response = await api.get(`/public/funding-rate?instId=${perpId}`);
    if (response.data && response.data.data && response.data.data.length > 0) {
      return parseFloat(response.data.data[0].fundingRate);
    }
    return null;
  } catch (error) {
    // Expected to fail for tokens that don't have perps
    return null;
  }
}

export async function getOKXMarketData(symbol: string): Promise<NormalizedTokenData | null> {
  const instId = normalizeSymbol(symbol);
  
  const ticker = await getOKXTicker(instId);
  if (!ticker) return null;

  const [candles, fundingRate] = await Promise.all([
    getOKXCandles(instId),
    getOKXFundingRate(instId)
  ]);

  const price = parseFloat(ticker.last);
  const open24h = parseFloat(ticker.open24h);
  const priceChange24h = open24h > 0 ? ((price - open24h) / open24h) * 100 : 0;

  return {
    symbol: instId.split('-')[0],
    name: instId.split('-')[0],
    price,
    priceChange24h,
    volume24h: parseFloat(ticker.volCcy24h),
    marketCap: null,
    fullyDilutedValue: null,
    high24h: parseFloat(ticker.high24h),
    low24h: parseFloat(ticker.low24h),
    liquidityUSD: null,
    source: 'okx',
    candles,
    fundingRate,
    openInterest: null, 
    instId,
    rawOKX: ticker
  };
}
