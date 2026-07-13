import { NormalizedTokenData, RiskAnalysis, MarketAnalysis, OKXCandleData } from '../types';
import { callGroq, parseJSONResponse } from './groqClient';

const SYSTEM_PROMPT = `You are a technical analyst and market structure expert. You analyze price action, volume patterns, and market structure to identify trends. You always output valid JSON. Your analysis is data-driven and free from speculation. You MUST respond with ONLY JSON, no other text.`;

function formatNumber(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
  return n.toFixed(2);
}

function buildCandleSummary(candles: OKXCandleData[]): string {
  const recent14 = candles.slice(-14);
  const high = Math.max(...recent14.map(c => c.high));
  const low = Math.min(...recent14.map(c => c.low));
  const avgVol = recent14.reduce((sum, c) => sum + c.volume, 0) / recent14.length;
  
  const recent7 = candles.slice(-7).map(c => c.close.toFixed(4)).join(', ');
  
  return `- 14-day OHLC summary: High=$${high}, Low=$${low}, Avg Volume=$${formatNumber(avgVol)}
- Recent 7 days close prices: ${recent7}`;
}

export async function analyzeMarket(tokenData: NormalizedTokenData, risk: RiskAnalysis): Promise<MarketAnalysis> {
  const prompt = `Analyze the market structure for ${tokenData.symbol} based on the following data.

PRICE DATA:
- Current Price: $${tokenData.price}
- 24h High: $${tokenData.high24h}
- 24h Low: $${tokenData.low24h}  
- 24h Change: ${tokenData.priceChange24h.toFixed(2)}%
- 24h Volume: $${formatNumber(tokenData.volume24h)}
${tokenData.marketCap ? `- Market Cap: $${formatNumber(tokenData.marketCap)}` : ''}
${tokenData.candles && tokenData.candles.length >= 7 ? buildCandleSummary(tokenData.candles) : '- Historical data: Limited'}

RISK CONTEXT:
- Risk Level: ${risk.level} (score: ${risk.score}/100)

ANALYSIS REQUIRED:
1. Identify the dominant trend over the available data period
2. Calculate the most significant support level (recent meaningful low)
3. Calculate the most significant resistance level (recent meaningful high)  
4. Evaluate volume patterns for anomalies

Respond with ONLY valid JSON in this exact format:
{
  "trend": <"BULLISH" | "BEARISH" | "SIDEWAYS" | "VOLATILE">,
  "strength": <number 0-100, trend strength/confidence>,
  "support": <nearest key support price as number, or null if insufficient data>,
  "resistance": <nearest key resistance price as number, or null if insufficient data>,
  "volumeAnomaly": <"NORMAL" | "UNUSUAL_SPIKE" | "DUMP_DETECTED" | "LOW_ACTIVITY">,
  "summary": "<2 sentences describing the market structure>"
}`;

  try {
    const rawResponse = await callGroq(prompt, SYSTEM_PROMPT);
    const parsed = parseJSONResponse(rawResponse);
    
    if (['BULLISH', 'BEARISH', 'SIDEWAYS', 'VOLATILE'].includes(parsed.trend) && typeof parsed.strength === 'number') {
      return {
        trend: parsed.trend as any,
        strength: Math.min(100, Math.max(0, parsed.strength)),
        support: typeof parsed.support === 'number' ? parsed.support : null,
        resistance: typeof parsed.resistance === 'number' ? parsed.resistance : null,
        volumeAnomaly: parsed.volumeAnomaly || 'NORMAL',
        summary: parsed.summary || 'Market structure analysis complete.'
      };
    }
    throw new Error('Invalid JSON structure');
  } catch (error) {
    let support = null;
    let resistance = null;
    if (tokenData.candles && tokenData.candles.length > 0) {
      support = Math.min(...tokenData.candles.slice(-14).map(c => c.close));
      resistance = Math.max(...tokenData.candles.slice(-14).map(c => c.close));
    }
    
    return {
      trend: 'SIDEWAYS',
      strength: 30,
      support,
      resistance,
      volumeAnomaly: 'NORMAL',
      summary: 'Automated AI market analysis failed. Providing baseline estimates.'
    };
  }
}
