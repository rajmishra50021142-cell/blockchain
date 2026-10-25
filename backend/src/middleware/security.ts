/**
 * Phase 10: Security Middleware & Headers
 *
 * Implements Helmet headers, anti-clickjacking, CSP, and request correlation IDs.
 */

import { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import * as crypto from "crypto";

// Extend Express Request interface to include correlation id
declare global {
  namespace Express {
    interface Request {
      id?: string;
      user?: {
        address: string;
        chainId: number;
      };
    }
  }
}

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const reqId = (req.headers["x-request-id"] as string) || crypto.randomUUID();
  req.id = reqId;
  res.setHeader("X-Request-Id", reqId);
  next();
}
