/**
 * EcoMind AI — Security & Cryptography Utilities
 * Implements PBKDF2 with salt, constant-time verification, bounded rate-limiting,
 * input sanitization, and enterprise security headers.
 */

import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

const HASH_ITERATIONS = 12000;
const KEY_LEN = 64;
const DIGEST = 'sha512';

/**
 * Hashes a plaintext password using crypto.pbkdf2Sync with secure salt
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  if (!password || typeof password !== 'string' || password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.pbkdf2Sync(password, salt, HASH_ITERATIONS, KEY_LEN, DIGEST);
  return {
    hash: derivedKey.toString('hex'),
    salt,
  };
}

/**
 * Verifies a password in constant time using crypto.timingSafeEqual
 */
export function verifyPassword(password: string, storedHash: string, storedSalt: string): boolean {
  if (!password || !storedHash || !storedSalt) return false;
  try {
    const derivedKey = crypto.pbkdf2Sync(password, storedSalt, HASH_ITERATIONS, KEY_LEN, DIGEST);
    const storedBuf = Buffer.from(storedHash, 'hex');
    if (derivedKey.length !== storedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(derivedKey, storedBuf);
  } catch {
    return false;
  }
}

/**
 * Generates an unguessable 256-bit cryptographically secure session token
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * SHA-256 helper for audit chain hashing and compliance stamps
 */
export function sha256(data: string): string {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

/**
 * Bounded sliding-window rate limiter
 * Protects login, password reset, and AI endpoints from brute-force & denial of service.
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class BoundedRateLimiter {
  private map = new Map<string, RateLimitEntry>();
  private maxCapacity = 5000; // Cap map size to prevent heap exhaustion
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs = 60_000, maxRequests = 100, maxCapacity = 5000) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.maxCapacity = maxCapacity;

    // Periodic GC of expired keys
    setInterval(() => this.cleanup(), 30_000).unref();
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.map.entries()) {
      if (entry.resetAt <= now) {
        this.map.delete(key);
      }
    }
  }

  public check(key: string): { allowed: boolean; remaining: number; resetInMs: number } {
    const now = Date.now();
    let entry = this.map.get(key);

    if (!entry || entry.resetAt <= now) {
      // Check capacity before adding new key
      if (this.map.size >= this.maxCapacity) {
        this.cleanup();
        if (this.map.size >= this.maxCapacity) {
          // If still full after cleanup, evict oldest entry
          const firstKey = this.map.keys().next().value;
          if (firstKey) this.map.delete(firstKey);
        }
      }
      entry = { count: 1, resetAt: now + this.windowMs };
      this.map.set(key, entry);
      return { allowed: true, remaining: this.maxRequests - 1, resetInMs: this.windowMs };
    }

    entry.count += 1;
    const remaining = Math.max(0, this.maxRequests - entry.count);
    const resetInMs = Math.max(0, entry.resetAt - now);

    return {
      allowed: entry.count <= this.maxRequests,
      remaining,
      resetInMs,
    };
  }

  public reset(key: string): void {
    this.map.delete(key);
  }

  public getActiveCount(): number {
    return this.map.size;
  }
}

// Pre-configured rate limiters
export const authRateLimiter = new BoundedRateLimiter(5 * 60_000, 10); // 10 attempts per 5 mins
export const aiRateLimiter = new BoundedRateLimiter(60_000, 20); // 20 requests per min
export const generalApiLimiter = new BoundedRateLimiter(60_000, 150); // 150 requests per min

/**
 * Safe IP address resolution (ignores arbitrary spoofed headers unless from trusted loopback)
 */
export function getClientIp(req: Request): string {
  const connectionIp = req.socket.remoteAddress || '127.0.0.1';
  // In development/local proxy, if from loopback, we can inspect x-forwarded-for safely
  const isLoopback = connectionIp === '127.0.0.1' || connectionIp === '::1' || connectionIp === '::ffff:127.0.0.1';
  if (isLoopback && req.headers['x-forwarded-for']) {
    const forwarded = req.headers['x-forwarded-for'];
    const parts = (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(',');
    return parts[0].trim();
  }
  return connectionIp;
}

/**
 * Middleware: Rate limit by client IP and path
 */
export function rateLimitMiddleware(limiter: BoundedRateLimiter, prefix = 'api') {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = getClientIp(req);
    const key = `${prefix}:${ip}:${req.path}`;
    const result = limiter.check(key);

    res.setHeader('X-RateLimit-Limit', limiter['maxRequests']);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetInMs / 1000));

    if (!result.allowed) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please wait before retrying.',
        retryAfterSeconds: Math.ceil(result.resetInMs / 1000),
      });
    }
    next();
  };
}

/**
 * Enterprise Security Headers Middleware
 */
export function enterpriseSecurityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent MIME-type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Clickjacking defense
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  // Cross-site scripting filter
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Privacy referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Disable dangerous browser permissions
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // Ensure caching doesn't store sensitive API data
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
  }
  next();
}

/**
 * Input sanitization & validation helpers
 */
export function sanitizeString(val: unknown, maxLen = 255): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

export function validatePositiveNumber(val: unknown, fieldName: string, max = 1_000_000_000): number {
  if (typeof val !== 'number' || Number.isNaN(val) || !Number.isFinite(val)) {
    throw new Error(`Invalid number for ${fieldName}`);
  }
  if (val < 0) {
    throw new Error(`${fieldName} cannot be negative`);
  }
  if (val > max) {
    throw new Error(`${fieldName} exceeds maximum allowable threshold`);
  }
  return val;
}
