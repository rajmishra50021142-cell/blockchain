/**
 * Phase 10: JWT Authentication Middleware
 *
 * Validates bearer token, verifies HMAC signature using AUTH_JWT_SECRET,
 * validates claims, and binds authenticated wallet identity to request context.
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/env";
import { JwtClaims } from "../types";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: {
        code: "WALLET_NOT_CONNECTED",
        message: "Authorization header with Bearer token is required.",
        service: "AUTH",
        timestamp: Date.now(),
      },
    });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return res.status(401).json({
      error: {
        code: "INVALID_AUTH_HEADER",
        message: "Malformed authorization header. Expected 'Bearer <token>'.",
        service: "AUTH",
        timestamp: Date.now(),
      },
    });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, config.authJwtSecret) as JwtClaims;

    if (!decoded.sub || !decoded.sub.startsWith("0x")) {
      return res.status(401).json({
        error: {
          code: "INVALID_TOKEN_CLAIMS",
          message: "JWT does not contain a valid Ethereum wallet subject.",
          service: "AUTH",
          timestamp: Date.now(),
        },
      });
    }

    req.user = {
      address: decoded.sub.toLowerCase(),
      chainId: decoded.chainId || config.chainId,
    };

    next();
  } catch (err: unknown) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: {
          code: "TOKEN_EXPIRED",
          message: "Authentication token has expired. Please re-authenticate.",
          service: "AUTH",
          timestamp: Date.now(),
        },
      });
    }

    return res.status(401).json({
      error: {
        code: "TOKEN_INVALID",
        message: "Invalid authentication token signature or claims.",
        service: "AUTH",
        timestamp: Date.now(),
      },
    });
  }
}
