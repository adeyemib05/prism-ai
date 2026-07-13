import { AlphaReport, QuickCheckResult } from '../types';
import { config } from '../config';

const reportCache = new Map<string, { data: AlphaReport; expiresAt: number }>();
const quickCache = new Map<string, { data: QuickCheckResult; expiresAt: number }>();

export function getCachedReport(identifier: string): AlphaReport | null {
  const cached = reportCache.get(identifier.toLowerCase());
  if (cached && Date.now() < cached.expiresAt) {
    if (config.isDev) console.log(`[Cache] HIT report for ${identifier}`);
    return cached.data;
  }
  if (cached) reportCache.delete(identifier.toLowerCase());
  return null;
}

export function setCachedReport(identifier: string, report: AlphaReport): void {
  reportCache.set(identifier.toLowerCase(), {
    data: report,
    expiresAt: Date.now() + config.cacheTtlSeconds * 1000,
  });
}

export function getCachedQuickCheck(identifier: string): QuickCheckResult | null {
  const cached = quickCache.get(identifier.toLowerCase());
  if (cached && Date.now() < cached.expiresAt) {
    if (config.isDev) console.log(`[Cache] HIT quick check for ${identifier}`);
    return cached.data;
  }
  if (cached) quickCache.delete(identifier.toLowerCase());
  return null;
}

export function setCachedQuickCheck(identifier: string, result: QuickCheckResult): void {
  quickCache.set(identifier.toLowerCase(), {
    data: result,
    expiresAt: Date.now() + config.cacheTtlSeconds * 1000,
  });
}
