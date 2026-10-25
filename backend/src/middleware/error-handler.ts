/**
 * Phase 10: Centralized Error Handler Middleware
 *
 * Catches all runtime errors, strips sensitive traces and credentials,
 * and formats consistent, machine-readable JSON error responses.
 */

import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public service?: string;

  constructor(message: string, statusCode = 500, code = "INTERNAL_ERROR", service = "API") {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.service = service;
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  let statusCode = 500;
  let code = "INTERNAL_ERROR";
  let service = "API";
  let message = "An internal server error occurred.";

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    service = err.service || "API";
    message = err.message;
  } else if (err.name === "InvalidCidError" || err.message.includes("Invalid IPFS CID")) {
    statusCode = 400;
    code = "INVALID_CID";
    service = "IPFS";
    message = err.message;
  } else if (err.name === "IpfsUploadError" || err.message.includes("IPFS upload failed")) {
    statusCode = 502;
    code = "IPFS_UNAVAILABLE";
    service = "IPFS";
    message = "IPFS storage provider failure or unreachable.";
  } else if (err.name === "IpfsDownloadError" || err.message.includes("IPFS download")) {
    statusCode = 502;
    code = "IPFS_GATEWAY_ERROR";
    service = "IPFS";
    message = "IPFS gateway retrieval failed or timed out.";
  } else if (err.message.includes("could not detect network") || err.message.includes("ECONNREFUSED")) {
    statusCode = 503;
    code = "BLOCKCHAIN_UNREACHABLE";
    service = "BLOCKCHAIN";
    message = "Ethereum blockchain JSON-RPC node is unreachable.";
  }

  // Safe error logging without secret leak
  const sanitizedLog = `[${req.id || "REQ"}] ${req.method} ${req.originalUrl} -> ${statusCode} [${code}]: ${message}`;
  if (statusCode >= 500) {
    console.error(`[ERROR] ${sanitizedLog}`);
  } else {
    console.warn(`[WARN] ${sanitizedLog}`);
  }

  res.status(statusCode).json({
    error: {
      code,
      message,
      service,
      timestamp: Date.now(),
    },
  });
}
