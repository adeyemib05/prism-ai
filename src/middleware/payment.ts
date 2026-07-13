import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

// Mock x402 payment verification
export function requirePayment(price: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (config.paymentMode === 'mock') {
      // In mock mode, we assume payment is always successful for testing
      req.headers['x-mock-payment-status'] = 'paid';
      return next();
    }
    
    // In a real environment, you would verify the L402/x402 macaroon header here
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('L402 ')) {
      return res.status(402).json({
        success: false,
        error: 'Payment Required',
        price_usdt: price,
        payment_address: '0xMockPaymentAddressForDemo',
        message: 'Please complete L402 payment to access this premium tool.'
      });
    }
    
    next();
  };
}
