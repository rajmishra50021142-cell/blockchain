/**
 * Phase 10: Express Application Entrypoint
 *
 * Configures middleware pipeline, security headers, routing tables,
 * and centralized fail-closed error handling.
 */

import express, { Request, Response } from "express";
import { securityHeaders, correlationIdMiddleware } from "./middleware/security";
import { corsMiddleware } from "./middleware/cors";
import { generalLimiter } from "./middleware/rate-limit";
import { errorHandler } from "./middleware/error-handler";

import authRoutes from "./routes/auth.routes";
import ipfsRoutes from "./routes/ipfs.routes";
import documentsRoutes from "./routes/documents.routes";
import verifyRoutes from "./routes/verify.routes";
import auditRoutes from "./routes/audit.routes";
import { blockchainService } from "./services/blockchain.service";
import { config } from "./config/env";

export function createApp() {
  const app = express();

  // 1. Security & Correlation ID
  app.use(securityHeaders);
  app.use(correlationIdMiddleware);
  app.use(corsMiddleware);

  // 2. Global Rate Limiter
  app.use(generalLimiter);

  // 3. Body Parsers (Note: raw binary for /api/ipfs/upload is parsed route-specifically)
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // 4. Health & Readiness Probes
  app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
      service: "document-locker-api",
      timestamp: Date.now(),
      uptime: process.uptime(),
    });
  });

  app.get("/ready", async (req: Request, res: Response) => {
    const chainCheck = await blockchainService.checkConnection();
    const ipfsReady = Boolean(config.ipfsJwt);

    const isReady = chainCheck.connected && ipfsReady;
    const statusCode = isReady ? 200 : 503;

    res.status(statusCode).json({
      status: isReady ? "ready" : "degraded",
      blockchain: {
        connected: chainCheck.connected,
        chainId: chainCheck.chainId,
        blockNumber: chainCheck.blockNumber,
        expectedChainId: config.chainId,
      },
      ipfs: {
        configured: ipfsReady,
        apiUrl: config.ipfsApiUrl,
      },
      timestamp: Date.now(),
    });
  });

  // 5. REST API Route Mounts
  app.use("/api/auth", authRoutes);
  app.use("/api/ipfs", ipfsRoutes);
  app.use("/api/documents", documentsRoutes);
  app.use("/api/verify", verifyRoutes);
  app.use("/api/audit", auditRoutes);

  // 6. 404 Route Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: {
        code: "ROUTE_NOT_FOUND",
        message: `Endpoint ${req.method} ${req.originalUrl} does not exist.`,
        service: "ROUTER",
        timestamp: Date.now(),
      },
    });
  });

  // 7. Centralized Error Handler
  app.use(errorHandler);

  return app;
}
