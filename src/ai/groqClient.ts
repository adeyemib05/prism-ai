import Groq from 'groq-sdk';
import { config } from '../config';

const groq = new Groq({
  apiKey: config.groqApiKey,
});

export const PRIMARY_MODEL = 'llama-3.3-70b-versatile';
export const FALLBACK_MODEL = 'llama-3.1-8b-instant';

export async function callGroq(prompt: string, systemPrompt: string, maxTokens: number = 800): Promise<string> {
  const tryModel = async (modelName: string): Promise<string> => {
    if (config.isDev) console.log(`[Groq] Calling ${modelName}...`);
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      model: modelName,
      temperature: 0.3,
      max_tokens: maxTokens,
    });
    
    const content = completion.choices[0]?.message?.content || '';
    if (config.isDev) console.log(`[Groq] Response received (${content.length} chars)`);
    return content;
  };

  try {
    return await tryModel(PRIMARY_MODEL);
  } catch (error: any) {
    if (config.isDev) console.warn(`[Groq] Primary model failed: ${error.message}. Retrying with fallback in 2s...`);
    await new Promise(r => setTimeout(r, 2000));
    try {
      return await tryModel(FALLBACK_MODEL);
    } catch (fallbackError: any) {
      if (config.isDev) console.error(`[Groq] Fallback model failed: ${fallbackError.message}`);
      throw new Error('GroqError: AI analysis temporarily unavailable');
    }
  }
}

export function parseJSONResponse(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch (e1) {
    try {
      const match = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (match && match[1]) {
        return JSON.parse(match[1]);
      }
    } catch (e2) {}
    
    try {
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        return JSON.parse(raw.substring(start, end + 1));
      }
    } catch (e3) {}
    
    throw new Error('Failed to parse AI response as JSON');
  }
}
