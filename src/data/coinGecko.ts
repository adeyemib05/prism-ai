import axios from 'axios';
import { NormalizedTokenData } from '../types';
import { config } from '../config';

const api = axios.create({
  baseURL: 'https://api.coingecko.com/api/v3',
  timeout: 6000,
  headers: { 'Accept': 'application/json', 'User-Agent': 'Prism/1.0' }
});

// Map of common uppercase trading symbols → CoinGecko coin ID
const SYMBOL_TO_ID: Record<string, string> = {
  BTC:   'bitcoin',
  ETH:   'ethereum',
  SOL:   'solana',
  BNB:   'binancecoin',
  XRP:   'ripple',
  USDT:  'tether',
  USDC:  'usd-coin',
  ADA:   'cardano',
  AVAX:  'avalanche-2',
  DOGE:  'dogecoin',
  TRX:   'tron',
  LINK:  'chainlink',
  MATIC: 'matic-network',
  POL:   'matic-network',
  DOT:   'polkadot',
  SHIB:  'shiba-inu',
  UNI:   'uniswap',
  LTC:   'litecoin',
  BCH:   'bitcoin-cash',
  NEAR:  'near',
  APT:   'aptos',
  OP:    'optimism',
  ARB:   'arbitrum',
  ATOM:  'cosmos',
  FIL:   'filecoin',
  ICP:   'internet-computer',
  SUI:   'sui',
  INJ:   'injective-protocol',
  FTM:   'fantom',
  SAND:  'the-sandbox',
  MANA:  'decentraland',
  AAVE:  'aave',
  MKR:   'maker',
  SNX:   'havven',
  CRV:   'curve-dao-token',
  PEPE:  'pepe',
  FLOKI: 'floki',
  BONK:  'bonk',
  WIF:   'dogwifcoin',
  RENDER:'render-token',
  FET:   'fetch-ai',
  TAO:   'bittensor',
  SEI:   'sei-network',
  TIA:   'celestia',
  JUP:   'jupiter-exchange-solana',
  PYTH:  'pyth-network',
  W:     'wormhole',
  ENA:   'ethena',
  TON:   'the-open-network',
  NOT:   'notcoin',
  BLUR:  'blur',
  GMX:   'gmx',
  STX:   'blockstack',
  RUNE:  'thorchain',
  DYDX:  'dydx',
  LDO:   'lido-dao',
  RPL:   'rocket-pool',
  GRT:   'the-graph',
  SUSHI: 'sushi',
  ZRX:   '0x',
  BAT:   'basic-attention-token',
  ENS:   'ethereum-name-service',
  IMX:   'immutable-x',
  GALA:  'gala',
  AXS:   'axie-infinity',
  FLOW:  'flow',
  EGLD:  'elrond-erd-2',
  VET:   'vechain',
  ALGO:  'algorand',
  XLM:   'stellar',
  XMR:   'monero',
  ETC:   'ethereum-classic',
};

export function getCoinGeckoId(symbol: string): string | null {
  return SYMBOL_TO_ID[symbol.toUpperCase()] || null;
}

export interface CoinGeckoEnrichment {
  marketCap: number | null;
  fullyDilutedValue: number | null;
  volume24h: number | null;
  priceChange24h: number | null;
}

export async function getCoinGeckoMarketData(symbol: string): Promise<CoinGeckoEnrichment | null> {
  const id = getCoinGeckoId(symbol);
  if (!id) return null;

  try {
    if (config.isDev) console.log(`[CoinGecko] Fetching market data for ${symbol} (id: ${id})`);
    const res = await api.get(`/simple/price`, {
      params: {
        ids: id,
        vs_currencies: 'usd',
        include_market_cap: true,
        include_24hr_vol: true,
        include_24hr_change: true,
      }
    });

    const data = res.data?.[id];
    if (!data) return null;

    return {
      marketCap: data.usd_market_cap || null,
      fullyDilutedValue: data.usd_market_cap || null, // best approximation from simple API
      volume24h: data.usd_24h_vol || null,
      priceChange24h: data.usd_24h_change || null,
    };
  } catch (e) {
    if (config.isDev) console.error(`[CoinGecko] Error fetching ${symbol}:`, e);
    return null;
  }
}
