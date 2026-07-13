import { scoreRisk, analyzeMarket, createTradePlan } from './index';
import { NormalizedTokenData } from '../types';

async function run() {
  const mockToken: NormalizedTokenData = {
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 65000,
    priceChange24h: 2.5,
    volume24h: 40000000000,
    marketCap: 1200000000000,
    fullyDilutedValue: 1300000000000,
    high24h: 66000,
    low24h: 64000,
    liquidityUSD: 100000000,
    source: 'okx',
    candles: [
        {timestamp: "1", open: 60000, high: 66000, low: 59000, close: 65000, volume: 1000}
    ]
  };

  console.log('--- Testing AI Pipeline ---');
  
  console.log('1. Risk Scorer');
  const risk = await scoreRisk(mockToken);
  console.log('Risk Result:', risk);

  console.log('\n2. Market Analyst');
  const market = await analyzeMarket(mockToken, risk);
  console.log('Market Result:', market);

  console.log('\n3. Trade Planner');
  const plan = await createTradePlan(mockToken, risk, market);
  console.log('Plan Result:', plan);
}

run().catch(console.error);
