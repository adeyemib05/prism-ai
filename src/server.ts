import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config';

// Import handlers and middleware
import { getTools, handleQuickCheck, handleAnalyzeToken, handlePortfolioScan, handleFollowUp, handlePulse } from './mcp/handlers';
import { requirePayment } from './middleware/payment';

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));
app.use(morgan('dev'));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { success: false, error: 'Too many requests, please try again later.' }
});

app.use('/tools', limiter);
app.use('/api', limiter);
app.use(express.static(path.join(__dirname, '../public')));

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ── A2MCP Agent Discovery (OKX Marketplace) ──────────────────────────────────
// This manifest tells OKX marketplace agents how to discover and call Prism AI.
// Reference: https://okx.ai/docs/a2mcp
app.get('/.well-known/agent.json', (req: Request, res: Response) => {
  res.json({
    schemaVersion: '1.0',
    agentId: '5781',
    name: 'Prism AI',
    description: 'Institutional-grade AI token analysis. Input any crypto token symbol or contract address and receive a full Risk Shield assessment, Market Structure breakdown, and AI Trade Plan in seconds.',
    version: '1.0.0',
    homepage: 'https://prism-ai-theta.vercel.app',
    services: [
      {
        id: 'token-analysis',
        name: 'Token Analysis',
        description: 'Full AI analysis: Risk Shield (7-factor score), Market Structure, and AI Trade Plan with entry/target/stop-loss levels.',
        type: 'A2MCP',
        endpoint: 'https://prism-ai-theta.vercel.app/api/analyze',
        method: 'POST',
        contentType: 'application/json',
        fee: '0.50',
        currency: 'USDT',
        network: 'XLayer',
        paymentProtocol: 'x402',
        input: {
          type: 'object',
          required: ['symbol'],
          properties: {
            symbol: { type: 'string', description: 'Token symbol (e.g. BTC, ETH, PEPE) or contract address (0x...)' },
            chain: { type: 'string', description: 'Optional chain hint (e.g. ethereum, bsc, solana)' }
          }
        },
        output: {
          type: 'object',
          description: 'Full Prism AI analysis report including token data, risk score, market structure, and trade plan'
        }
      }
    ],
    contact: {
      email: 'adeyemib05@gmail.com'
    }
  });
});

// ── MCP Endpoints (legacy path) ───────────────────────────────────────────────
app.get('/tools', getTools);
app.post('/tools/quick_check', handleQuickCheck);
app.post('/tools/analyze_token', requirePayment(0.50), handleAnalyzeToken);
app.post('/tools/portfolio_scan', requirePayment(1.50), handlePortfolioScan);
app.post('/tools/follow_up', requirePayment(0.10), handleFollowUp);
app.get('/tools/pulse', handlePulse);

// ── /api/* Endpoints (registered A2MCP path on OKX.AI) ───────────────────────
// This is the canonical endpoint registered on OKX marketplace as Agent #5781.
// OKX A2MCP agents call POST /api/analyze with the token symbol in the body.
// They first receive a 402 challenge, pay via x402 on XLayer, then replay with X-Payment header.
app.get('/api/analyze', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Prism AI A2MCP Endpoint is active. Please send a POST request with {"symbol": "..."} to run an analysis.',
    documentation: 'https://prism-ai-theta.vercel.app/.well-known/agent.json'
  });
});
app.post('/api/analyze', requirePayment(0.50), handleAnalyzeToken);
app.post('/api/quick_check', handleQuickCheck);
app.get('/api/pulse', handlePulse);

// ── 404 & Error handlers ──────────────────────────────────────────────────────
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
});

if (process.env.NODE_ENV !== 'production' || process.env.IS_LOCAL) {
  app.listen(config.port, () => {
    console.log(`🔷 Prism is running on port ${config.port} in ${config.nodeEnv} mode`);
    console.log(`   Put your token through Prism → http://localhost:${config.port}`);
  });
}

export default app;

