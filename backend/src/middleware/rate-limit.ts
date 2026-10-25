/**
 * Phase 10: Rate Limiting Middleware
 *
 * Implements protective rate limiting per client IP to mitigate brute force
 * and denial-of-service attempts against sensitive endpoints.
 */

import rateLimit from "express-rate-limit";

// Rate limiter for authentication challenge and verification (30 requests / 15 minutes)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many authentication attempts. Please try again later.",
      service: "AUTH",
      timestamp: Date.now(),
    },
  },
});

// Rate limiter for IPFS upload operations (30 requests / 15 minutes)
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "IPFS upload rate limit exceeded. Please wait before submitting more payloads.",
      service: "IPFS",
      timestamp: Date.now(),
    },
  },
});

// Rate limiter for verification requests (120 requests / 15 minutes)
export const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Verification rate limit exceeded. Please try again shortly.",
      service: "VERIFY",
      timestamp: Date.now(),
    },
  },
});

// General API rate limiter (300 requests / 15 minutes)
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests to document locker API. Please slow down.",
      service: "API",
      timestamp: Date.now(),
    },
  },
});
