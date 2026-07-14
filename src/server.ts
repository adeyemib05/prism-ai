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
app.use(express.static(path.join(__dirname, '../public')));

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// MCP Endpoints
app.get('/tools', getTools);
app.post('/tools/quick_check', handleQuickCheck);
app.post('/tools/analyze_token', requirePayment(0.50), handleAnalyzeToken);
app.post('/tools/portfolio_scan', requirePayment(1.50), handlePortfolioScan);
app.post('/tools/follow_up', requirePayment(0.10), handleFollowUp);
app.get('/tools/pulse', handlePulse);

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
