import { Request, Response } from 'express';
import { mcpTools } from './tools';
import { buildQuickCheck, generateFullReport } from '../core/reportBuilder';
import { callGroq } from '../ai/groqClient';
import { getMarketPulse } from '../data/okxMarket';

export function getTools(req: Request, res: Response) {
  res.json({
    success: true,
    tools: mcpTools
  });
}

export async function handleQuickCheck(req: Request, res: Response) {
  try {
    const { symbol, chain } = req.body;
    if (!symbol) return res.status(400).json({ success: false, error: 'Symbol required' });
    
    const result = await buildQuickCheck(symbol, chain);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function handleAnalyzeToken(req: Request, res: Response) {
  try {
    const { symbol, chain } = req.body;
    if (!symbol) return res.status(400).json({ success: false, error: 'Symbol required' });
    
    const result = await generateFullReport(symbol, chain);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function handlePortfolioScan(req: Request, res: Response) {
  try {
    const { symbols } = req.body;
    if (!Array.isArray(symbols) || symbols.length === 0 || symbols.length > 5) {
      return res.status(400).json({ success: false, error: 'Provide an array of 1 to 5 symbols' });
    }
    
    // Process concurrently
    const promises = symbols.map(sym => generateFullReport(sym));
    const results = await Promise.allSettled(promises);
    
    const successful = results
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<any>).value);
      
    res.json({
      success: true,
      data: {
        scanned: successful.length,
        reports: successful
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function handlePulse(req: Request, res: Response) {
  try {
    const data = await getMarketPulse();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function handleFollowUp(req: Request, res: Response) {
  try {
    const { question, context } = req.body;
    if (!question) return res.status(400).json({ success: false, error: 'Question required' });
    const prompt = 'Context:\n' + JSON.stringify(context) + '\n\nUser Question: ' + question;
    const sys = 'You are an AI crypto analyst answering a follow-up question based on your previous report context. Be concise and professional.';
    const answer = await callGroq(prompt, sys, 500);
    res.json({ success: true, data: { answer } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
