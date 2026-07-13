import { NormalizedTokenData, RiskAnalysis, MarketAnalysis, TradePlan } from '../types';
import { callGroq, parseJSONResponse } from './groqClient';

const SYSTEM_PROMPT = `You are an experienced crypto trading strategist. You create precise, data-driven trade plans with specific price levels. You always prioritize capital preservation. You always output valid JSON. You never give financial advice — only strategic frameworks based on data. You MUST respond with ONLY JSON, no other text.`;

export async function createTradePlan(tokenData: NormalizedTokenData, risk: RiskAnalysis, market: MarketAnalysis): Promise<TradePlan> {
  const prompt = `Create a trade plan for ${tokenData.symbol} based on this complete analysis.

TOKEN SUMMARY:
- Symbol: ${tokenData.symbol}
- Current Price: $${tokenData.price}
- Risk Score: ${risk.score}/100 (${risk.level})
- Market Trend: ${market.trend} (strength: ${market.strength}/100)
- Support: ${market.support ? '$' + market.support : 'Unknown'}
- Resistance: ${market.resistance ? '$' + market.resistance : 'Unknown'}

KEY CONTEXT:
- Risk Flags: ${risk.flags.join('; ')}
- Volume Pattern: ${market.volumeAnomaly}
- Market Summary: ${market.summary}

TRADE PLAN REQUIREMENTS:
- If risk score > 75: verdict MUST be AVOID
- If risk score 50-75 and trend BEARISH: verdict should be WATCH at best
- If risk score < 30 and trend BULLISH: consider ACCUMULATE or HIGH_CONVICTION
- Entry zone should be BELOW current price for buys (await pullback) UNLESS trend is very strong
- Stop loss must be BELOW support or 8-15% below entry, whichever is closer
- TP1 should be conservative (5-15% above entry)
- TP2 should be moderate (15-35% above entry)  
- TP3 should be aggressive (35-80% above entry based on trend strength)
- R/R ratio should ideally be 1:2 minimum
- Confidence score is 0-100 based on how clear the setup is

CRITICAL: If data is insufficient (no candle history, unknown market cap, extreme risk), set verdict to AVOID and explain why in reasoning.

Respond with ONLY valid JSON in this exact format:
{
  "verdict": <"AVOID" | "WATCH" | "ACCUMULATE" | "HIGH_CONVICTION">,
  "verdictEmoji": <"🔴" | "🟡" | "🟢" | "🚀">,
  "confidenceScore": <number 0-100>,
  "entryZone": { "low": <number>, "high": <number> },
  "stopLoss": <number>,
  "takeProfits": { "tp1": <number>, "tp2": <number>, "tp3": <number> },
  "riskRewardRatio": "<string like '1:2.4'>",
  "reasoning": "<2-3 sentences explaining the verdict and key factors>"
}`;

  const price = tokenData.price;
  const safeDefaults: TradePlan = {
    verdict: 'WATCH',
    verdictEmoji: '🟡',
    confidenceScore: 30,
    entryZone: { low: price * 0.95, high: price * 0.98 },
    stopLoss: price * 0.88,
    takeProfits: { tp1: price * 1.10, tp2: price * 1.25, tp3: price * 1.50 },
    riskRewardRatio: '1:2.0',
    reasoning: 'AI plan generation encountered validation errors. Providing conservative technical defaults based on current price.'
  };

  try {
    const rawResponse = await callGroq(prompt, SYSTEM_PROMPT);
    const parsed = parseJSONResponse(rawResponse);
    
    const p = parsed;
    const isVerdictValid = ['AVOID', 'WATCH', 'ACCUMULATE', 'HIGH_CONVICTION'].includes(p.verdict);
    
    // For meme coins/AVOID verdicts, the AI might set TP to 0 or null.
    // If the AI explicitly says AVOID, we accept it even if the trade levels make no sense.
    let isValid = isVerdictValid;
    
    if (p.verdict !== 'AVOID') {
      const isEntryValid = p.entryZone?.low <= p.entryZone?.high;
      const isStopValid = p.stopLoss < p.entryZone?.low;
      const isTPValid = p.takeProfits?.tp1 <= p.takeProfits?.tp2 && p.takeProfits?.tp2 <= p.takeProfits?.tp3;
      const isTPAboveEntry = p.takeProfits?.tp1 > p.entryZone?.high;
      isValid = isVerdictValid && isEntryValid && isStopValid && isTPValid && isTPAboveEntry;
    }

    if (isValid) {
      return {
        verdict: p.verdict as any,
        verdictEmoji: p.verdictEmoji || '🟡',
        confidenceScore: Math.min(100, Math.max(0, p.confidenceScore || 50)),
        entryZone: { low: p.entryZone?.low || price*0.95, high: p.entryZone?.high || price*0.98 },
        stopLoss: p.stopLoss || price*0.8,
        takeProfits: { 
           tp1: p.takeProfits?.tp1 || price*1.1, 
           tp2: p.takeProfits?.tp2 || price*1.2, 
           tp3: p.takeProfits?.tp3 || price*1.3 
        },
        riskRewardRatio: p.riskRewardRatio || 'Unknown',
        reasoning: p.reasoning || 'Trade plan generated.'
      };
    }
    
    return safeDefaults;
  } catch (error) {
    return safeDefaults;
  }
}
