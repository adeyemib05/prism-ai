import dotenv from 'dotenv';

dotenv.config();

if (!process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY is missing from environment variables');
}

export const config = {
  groqApiKey: process.env.GROQ_API_KEY,
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  okxApiBase: process.env.OKX_API_BASE || 'https://www.okx.com/api/v5',
  geckoApiBase: process.env.GECKO_API_BASE || 'https://api.geckoterminal.com/api/v2',
  dexApiBase: process.env.DEX_API_BASE || 'https://api.dexscreener.com/latest/dex',
  paymentMode: process.env.PAYMENT_MODE || 'mock',
  cacheTtlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || '300', 10),
};
