import { NormalizedTokenData } from '../types';
import { getOKXMarketData } from './okxMarket';
import { getGeckoMarketData } from './geckoTerminal';
import { searchDexScreener } from './dexScreener';
import { config } from '../config';

export async function resolveTokenData(input: string, chain?: string): Promise<NormalizedTokenData> {
  const cleanInput = input.trim().replace(/^\$/, '');
  const isContract = cleanInput.startsWith('0x') || (cleanInput.length >= 32 && cleanInput.length <= 44 && !cleanInput.includes('-'));

  if (isContract) {
    if (config.isDev) console.log(`[Aggregator] Detected contract address: ${cleanInput}`);
    
    // 1. Try GeckoTerminal
    let data = await getGeckoMarketData(cleanInput);
    if (data) return data;
    
    // 2. Try DexScreener
    data = await searchDexScreener(cleanInput);
    if (data) return data;
    
    throw new Error('Token not found on any network. Please verify the contract address.');
  }

  // Symbol flow
  if (config.isDev) console.log(`[Aggregator] Detected symbol: ${cleanInput}`);
  
  // 1. Try OKX
  let okxData = await getOKXMarketData(cleanInput);
  
  if (okxData) {
    try {
      const geckoData = await getGeckoMarketData(cleanInput);
      if (geckoData) {
        okxData.marketCap = geckoData.marketCap;
        okxData.fullyDilutedValue = geckoData.fullyDilutedValue;
        okxData.liquidityUSD = geckoData.liquidityUSD;
        okxData.source = 'combined';
      }
    } catch (e) {
      // Ignore enhancement errors
    }
    return okxData;
  }

  // 3. Fallback to GeckoTerminal
  let geckoData = await getGeckoMarketData(cleanInput);
  if (geckoData) return geckoData;
  
  // 4. Fallback to DexScreener
  let dexData = await searchDexScreener(cleanInput);
  if (dexData) return dexData;

  throw new Error('Token not found. Please check the symbol or use a contract address instead.');
}
