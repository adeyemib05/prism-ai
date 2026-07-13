export const mcpTools = [
  {
    name: "prism_quick_check",
    description: "Get a quick, free risk snapshot of any crypto token.",
    parameters: {
      type: "object",
      properties: {
        symbol: {
          type: "string",
          description: "The token symbol or contract address (e.g., BTC, PEPE, 0x...)"
        },
        chain: {
          type: "string",
          description: "Optional network name if providing a contract address (e.g., ethereum, solana)"
        }
      },
      required: ["symbol"]
    },
    price: 0
  },
  {
    name: "prism_analyze_token",
    description: "Generate a comprehensive, institutional-grade AI analysis report and trade plan for a token.",
    parameters: {
      type: "object",
      properties: {
        symbol: {
          type: "string",
          description: "The token symbol or contract address (e.g., SOL, ETH, 0x...)"
        },
        chain: {
          type: "string",
          description: "Optional network name if providing a contract address"
        }
      },
      required: ["symbol"]
    },
    price: 0.50
  },
  {
    name: "prism_portfolio_scan",
    description: "Analyze up to 5 tokens at once for a discounted bundle price.",
    parameters: {
      type: "object",
      properties: {
        symbols: {
          type: "array",
          items: { type: "string" },
          description: "List of token symbols to analyze (max 5)"
        }
      },
      required: ["symbols"]
    },
    price: 1.50
  }
];
