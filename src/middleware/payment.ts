import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

/**
 * x402 / L402 Payment Middleware
 *
 * Implements the x402 payment-required protocol:
 *   1. If no payment header is present → HTTP 402 with pricing info (standard x402 challenge)
 *   2. If X-Payment or Authorization header is present → validate and proceed
 *   3. In dev/mock mode → always allow (for local UI testing)
 *
 * OKX A2MCP agents read the 402 response, execute the on-chain payment,
 * then replay the request with X-Payment header attached.
 */
export function requirePayment(price: number) {
  return (req: Request, res: Response, next: NextFunction) => {

    // ── Dev / mock mode: bypass payment for UI testing ──────────────────
    if (config.paymentMode === 'mock' || config.isDev) {
      req.headers['x-payment-status'] = 'bypassed-dev';
      return next();
    }

    // ── Check for x402 payment token ────────────────────────────────────
    const xPayment = req.headers['x-payment'] as string | undefined;
    const authHeader = req.headers['authorization'] as string | undefined;

    const hasPayment =
      (xPayment && xPayment.length > 10) ||
      (authHeader && (authHeader.startsWith('L402 ') || authHeader.startsWith('Bearer ')));

    if (!hasPayment) {
      // Return standard x402 challenge so A2MCP agents know how to pay
      res.setHeader('X-Payment-Required', 'true');
      res.setHeader('X-Payment-Amount', price.toFixed(2));
      res.setHeader('X-Payment-Currency', 'USDT');
      res.setHeader('X-Payment-Network', 'XLayer');
      res.setHeader('X-Payment-Address', process.env.PAYMENT_ADDRESS || '0x785f469dd4103dff06aa54467fbd5dfaa4d316f1');
      res.setHeader('Access-Control-Expose-Headers', 'X-Payment-Required, X-Payment-Amount, X-Payment-Currency, X-Payment-Network, X-Payment-Address');

      return res.status(402).json({
        ok: false,
        error: 'Payment Required',
        x402: {
          version: '1.0',
          price: price,
          currency: 'USDT',
          network: 'XLayer',
          paymentAddress: process.env.PAYMENT_ADDRESS || '0x785f469dd4103dff06aa54467fbd5dfaa4d316f1',
          agentId: '5781',
          description: `Prism AI Token Analysis — ${price} USDT per call`,
          instructions: 'Complete payment on XLayer, then replay this request with the X-Payment header containing your signed payment receipt.'
        }
      });
    }

    // ── Payment header present: accept and proceed ───────────────────────
    // In production you would cryptographically verify the payment receipt here.
    // For hackathon demo: presence of a valid-length token is sufficient proof.
    req.headers['x-payment-status'] = 'accepted';
    next();
  };
}

