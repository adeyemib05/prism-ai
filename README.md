# Prism AI

> *Raw data enters, five clear intelligence signals exit.*

Put your token through Prism — institutional-grade crypto intelligence in 30 seconds. Prism provides risk analysis, market structure, and AI-powered trade plans for any token, using official OKX market data and Groq AI.

## Features
- **Token Snapshots**: Real-time market metrics
- **Risk Shield**: Identifies volume anomalies, low liquidity, and extreme volatility
- **Market Structure**: Computes support, resistance, and volume patterns
- **AI Trade Planner**: Actionable frameworks with Entry, Stop-Loss, and Take-Profit zones
- **Agentic Endpoint**: Native A2MCP compatibility for OKX.AI

## Tech Stack
- Node.js, Express, TypeScript
- Groq AI (Llama-3.3-70b)
- OKX Public REST API v5, GeckoTerminal API, DexScreener API
- Free tier hosting via Render.com

## Setup Instructions
1. Clone the repository
2. Run `npm install`
3. Copy `.env.example` to `.env` and configure your `GROQ_API_KEY`
4. Run `npm run dev` to start the local server on port 3000

## API Endpoints
| Method | Endpoint | Description | Pricing |
|--------|----------|-------------|---------|
| `GET` | `/tools` | MCP Tool Manifest Discovery | Free |
| `POST` | `/tools/quick_check` | Snapshot and basic risk level | Free |
| `POST` | `/tools/analyze_token` | Comprehensive AI intelligence report | $0.50 USDT (mocked) |
| `POST` | `/tools/portfolio_scan` | Scan up to 5 tokens at once | $1.50 USDT (mocked) |

## Deployment
This project is configured for Render.com free tier hosting. Ensure your `GROQ_API_KEY` is added to your Render web service environment variables. UptimeRobot is recommended to keep the service awake.
