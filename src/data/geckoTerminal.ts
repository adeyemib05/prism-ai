import axios from 'axios';
import { GeckoTokenData, OKXCandleData, NormalizedTokenData } from '../types';
import { config } from '../config';

const api = axios.create({
  baseURL: config.geckoApiBase,
  timeout: 8000,
  headers: {
    'Accept': 'application/json'
  }
});

const CHAIN_MAP: Record<string, string[]> = {
  ethereum: ['0x'],
  solana: [],
  bsc: ['0x'],
  arbitrum: ['0x'],
  polygon: ['0x'],
  base: ['0x'],
};

export function detectChain(address: string): string {
  if (address.startsWith('0x') && address.length === 42) {
    return 'ethereum'; 
  }
  if (!address.startsWith('0x') && address.length >= 32 && address.length <= 44) {
    return 'solana';
  }
  return 'ethereum';
}

export async function searchTokenBySymbol(symbol: string): Promise<GeckoTokenData | null> {
  try {
    if (config.isDev) console.log(`[GeckoTerminal] Searching for symbol ${symbol}`);
    const response = await api.get(`/search?query=${symbol}&network=all`);
    
    if (response.data?.data && response.data.data.length > 0) {
      const match = response.data.data.find((item: any) => 
        item.attributes?.symbol?.toLowerCase() === symbol.toLowerCase()
      );
      
      const target = match || response.data.data[0];
      const address = target.attributes?.address;
      const network = target.attributes?.network?.identifier || 'ethereum';
      
      if (address) {
        return getGeckoTokenByAddress(address, network);
      }
    }
    return null;
  } catch (error) {
    if (config.isDev) console.error(`[GeckoTerminal] Search error for ${symbol}:`, error);
    return null;
  }
}

export async function getGeckoTokenByAddress(address: string, chain?: string): Promise<GeckoTokenData | null> {
  try {
    const network = chain || detectChain(address);
    if (config.isDev) console.log(`[GeckoTerminal] Fetching token ${address} on ${network}`);
    const response = await api.get(`/networks/${network}/tokens/${address}?include=top_pools`);
    
    if (response.data?.data?.attributes) {
      const attrs = response.data.data.attributes;
      const included = response.data.included || [];
      
      const top_pools = included
        .filter((inc: any) => inc.type === 'pool' && inc.attributes)
        .map((inc: any) => ({
          dex: { name: inc.attributes.dex?.name || 'Unknown' },
          reserve_in_usd: inc.attributes.reserve_in_usd
        }));
        
      return {
        name: attrs.name,
        symbol: attrs.symbol,
        address: attrs.address,
        price_usd: attrs.price_usd,
        fdv_usd: attrs.fdv_usd,
        market_cap_usd: attrs.market_cap_usd,
        volume_usd: attrs.volume_usd,
        price_change_percentage: attrs.price_change_percentage,
        top_pools
      };
    }
    return null;
  } catch (error) {
    if (config.isDev) console.error(`[GeckoTerminal] Token fetch error for ${address}:`, error);
    return null;
  }
}

export async function getGeckoOHLCV(address: string, chain: string, limit: number = 30): Promise<OKXCandleData[]> {
  try {
    const poolRes = await api.get(`/networks/${chain}/tokens/${address}/pools?page=1`);
    if (!poolRes.data?.data || poolRes.data.data.length === 0) return [];
    
    const poolAddress = poolRes.data.data[0].attributes?.address;
    if (!poolAddress) return [];
    
    const ohlcvRes = await api.get(`/networks/${chain}/pools/${poolAddress}/ohlcv/day?limit=${limit}`);
    const ohlcvList = ohlcvRes.data?.data?.attributes?.ohlcv_list || [];
    
    return ohlcvList.map((c: any[]) => ({
      timestamp: String(c[0] * 1000), 
      open: parseFloat(c[1]),
      high: parseFloat(c[2]),
      low: parseFloat(c[3]),
      close: parseFloat(c[4]),
      volume: parseFloat(c[5])
    })).reverse(); // gecko returns oldest first or newest? usually need to check, OKX returns newest first. 
    // API docs: Gecko returns newest first. Reverse to oldest first for consistency.
  } catch (error) {
    if (config.isDev) console.error(`[GeckoTerminal] OHLCV fetch error:`, error);
    return [];
  }
}

export async function getGeckoMarketData(input: string): Promise<NormalizedTokenData | null> {
  const isContract = input.startsWith('0x') || (input.length >= 32 && input.length <= 44 && !input.includes('-'));
  
  let geckoData: GeckoTokenData | null = null;
  let chain = 'ethereum'; 
  
  if (isContract) {
    chain = detectChain(input);
    geckoData = await getGeckoTokenByAddress(input, chain);
  } else {
    geckoData = await searchTokenBySymbol(input);
  }
  
  if (!geckoData) return null;
  
  chain = detectChain(geckoData.address);
  
  const candles = await getGeckoOHLCV(geckoData.address, chain);
  
  const liquidityUSD = geckoData.top_pools?.reduce((sum, pool) => {
    return sum + (parseFloat(pool.reserve_in_usd || '0'));
  }, 0) || null;

  return {
    symbol: geckoData.symbol.toUpperCase(),
    name: geckoData.name,
    price: parseFloat(geckoData.price_usd || '0'),
    priceChange24h: parseFloat(geckoData.price_change_percentage?.h24 || '0'),
    volume24h: parseFloat(geckoData.volume_usd?.h24 || '0'),
    marketCap: geckoData.market_cap_usd ? parseFloat(geckoData.market_cap_usd) : null,
    fullyDilutedValue: geckoData.fdv_usd ? parseFloat(geckoData.fdv_usd) : null,
    high24h: 0, 
    low24h: 0,
    liquidityUSD,
    source: 'gecko',
    candles,
    rawGecko: geckoData
  };
}
