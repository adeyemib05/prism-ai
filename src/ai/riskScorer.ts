import { NormalizedTokenData, RiskAnalysis, OKXCandleData } from '../types';
import { callGroq, parseJSONResponse } from './groqClient';

const SYSTEM_PROMPT = `You are a crypto risk analyst with 10+ years of experience. You analyze token data and identify risk factors with precision. You always output valid JSON. You are objective, data-driven, and concise. You MUST respond with ONLY JSON, no other text.`;

function formatNumber(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
  return n.toFixed(2);
}

function describePriceTrend(candles: OKXCandleData[]): string {
  if (!candles || candles.length === 0) return "No trend data available.";
  const recent = candles.slice(-7);
  if (recent.length < 2) return "Insufficient data.";
  
  const start = recent[0].open;
  const end = recent[recent.length - 1].close;
  const change = ((end - start) / start) * 100;
  
  if (change > 15) return `Up ${change.toFixed(1)}% over recent days.`;
  if (change < -15) return `Down ${Math.abs(change).toFixed(1)}% over recent days.`;
  return "Relatively flat.";
}

export async function scoreRisk(tokenData: NormalizedTokenData): Promise<RiskAnalysis> {
  const prompt = `Analyze the following crypto token data and provide a risk assessment.

TOKEN DATA:
- Symbol: ${tokenData.symbol}
- Price: $${tokenData.price}
- 24h Change: ${tokenData.priceChange24h.toFixed(2)}%
- 24h Volume: $${formatNumber(tokenData.volume24h)}
- Market Cap: ${tokenData.marketCap ? '$' + formatNumber(tokenData.marketCap) : 'Unknown'}
- Fully Diluted Value: ${tokenData.fullyDilutedValue ? '$' + formatNumber(tokenData.fullyDilutedValue) : 'Unknown'}
- Liquidity: ${tokenData.liquidityUSD ? '$' + formatNumber(tokenData.liquidityUSD) : 'Unknown'}
- Data Source: ${tokenData.source}
${tokenData.fundingRate !== null && tokenData.fundingRate !== undefined ? `- Funding Rate: ${(tokenData.fundingRate * 100).toFixed(4)}%` : ''}

RISK FACTORS TO EVALUATE:
1. Volume-to-market-cap ratio (low ratio = suspicious)
2. Liquidity depth (below $100k = HIGH risk, below $500k = MEDIUM risk)
3. Price volatility (24h change > 30% either direction = concern)
4. Unknown market cap (flag this ONLY IF 24h volume is less than $10,000,000. If volume is massive, assume it is a major CEX token and ignore the missing market cap/liquidity).
5. Funding rate extremes (above 0.1% or below -0.1% = concern)
${tokenData.candles && tokenData.candles.length > 0 ? `- Recent price trend: ${describePriceTrend(tokenData.candles)}` : ''}

Respond with ONLY valid JSON in this exact format:
{
  "score": <number 0-100, where 100 = extremely risky>,
  "level": <"LOW" | "MEDIUM" | "HIGH" | "EXTREME">,
  "flags": [<array of specific risk factors found, max 5 items, each under 60 chars>],
  "summary": "<1-2 sentence human-readable risk summary>"
}`;

  try {
    const rawResponse = await callGroq(prompt, SYSTEM_PROMPT);
    const parsed = parseJSONResponse(rawResponse);
    
    if (typeof parsed.score === 'number' && ['LOW', 'MEDIUM', 'HIGH', 'EXTREME'].includes(parsed.level)) {
      return {
        score: Math.min(100, Math.max(0, parsed.score)),
        level: parsed.level as any,
        flags: Array.isArray(parsed.flags) ? parsed.flags.slice(0, 5) : [],
        summary: parsed.summary || 'Risk analysis completed.'
      };
    }
    throw new Error('Invalid JSON structure returned by AI');
  } catch (error) {
    return {
      score: 50,
      level: 'MEDIUM',
      flags: ['Unable to assess risk accurately due to AI parsing failure'],
      summary: 'Risk analysis failed. Exercise caution.'
    };
  }
}
