import { NormalizedTokenData } from '../types';
import { getOKXMarketData } from './okxMarket';
import { getGeckoMarketData } from './geckoTerminal';
import { searchDexScreener } from './dexScreener';
import { getCoinGeckoMarketData } from './coinGecko';
import { config } from '../config';

export async function resolveTokenData(input: string, chain?: string): Promise<NormalizedTokenData> {
  const cleanInput = input.trim().replace(/^\$/, '');
  const isContract = cleanInput.startsWith('0x') || (cleanInput.length >= 32 && cleanInput.length <= 44 && !cleanInput.includes('-'));

  // === Contract address flow ===
  if (isContract) {
    if (config.isDev) console.log(`[Aggregator] Detected contract address: ${cleanInput}`);
    
    // 1. Try GeckoTerminal
    let data = await getGeckoMarketData(cleanInput);
    
    // 2. Try DexScreener
    const dexData = await searchDexScreener(cleanInput);
    
    // Merge if necessary
    if (data && (!data.marketCap || !data.liquidityUSD) && dexData && dexData.marketCap) {
      data.marketCap = dexData.marketCap;
      data.fullyDilutedValue = dexData.fullyDilutedValue;
      data.liquidityUSD = dexData.liquidityUSD;
      data.source = 'combined';
    } else if (!data && dexData) {
      data = dexData;
    }

    if (data) return data;
    
    throw new Error('Token not found on any network. Please verify the contract address.');
  }

  // === Symbol flow ===
  if (config.isDev) console.log(`[Aggregator] Detected symbol: ${cleanInput}`);
  
  // 1. Try OKX for real-time price and candle data
  let okxData = await getOKXMarketData(cleanInput);
  
  if (okxData) {
    try {
      // 2a. CoinGecko first — covers 60+ major tokens with real market cap
      const cgData = await getCoinGeckoMarketData(cleanInput);
      if (cgData && cgData.marketCap) {
        okxData.marketCap = cgData.marketCap;
        okxData.fullyDilutedValue = cgData.fullyDilutedValue;
        okxData.source = 'combined';
        if (config.isDev) console.log(`[Aggregator] Enriched ${cleanInput} with CoinGecko: MC=$${cgData.marketCap.toFixed(0)}`);
      } else {
        // 2b. GeckoTerminal fallback (DEX tokens, meme coins not in CoinGecko map)
        const geckoData = await getGeckoMarketData(cleanInput);
        if (geckoData) {
          okxData.marketCap = geckoData.marketCap;
          okxData.fullyDilutedValue = geckoData.fullyDilutedValue;
          okxData.liquidityUSD = geckoData.liquidityUSD;
          okxData.source = 'combined';
        } else {
          // 2c. DexScreener last resort
          const dexData = await searchDexScreener(cleanInput);
          if (dexData) {
            okxData.marketCap = dexData.marketCap;
            okxData.fullyDilutedValue = dexData.fullyDilutedValue;
            okxData.liquidityUSD = dexData.liquidityUSD;
            okxData.source = 'combined';
          }
        }
      }
    } catch (e) {
      if (config.isDev) console.error(`[Aggregator] Enrichment error for ${cleanInput}:`, e);
    }
    return okxData;
  }

  // 3. Fallback to GeckoTerminal (token not on OKX at all)
  let geckoData = await getGeckoMarketData(cleanInput);
  if (geckoData) return geckoData;
  
  // 4. Fallback to DexScreener
  let dexData = await searchDexScreener(cleanInput);
  if (dexData) return dexData;

  throw new Error('Token not found. Please check the symbol or use a contract address instead.');
}
