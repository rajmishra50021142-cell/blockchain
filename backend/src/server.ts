/**
 * Phase 10: Server Process Listener
 *
 * Bootstraps the Express application and listens on the configured PORT.
 */

import { createApp } from "./app";
import { config } from "./config/env";
import { blockchainService } from "./services/blockchain.service";

async function main() {
  const app = createApp();

  // Pre-initialize smart contract interfaces
  await blockchainService.init();

  const host = config.host;
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : config.port;

  const server = app.listen(port, host, () => {
    console.log(`[PASS] Document Locker API server listening on http://${host}:${port}`);
    console.log(`       Environment:      ${config.isProduction ? "production" : "development"}`);
    console.log(`       Target Chain ID:  ${config.chainId}`);
    console.log(`       DocumentRegistry: ${config.contractDocumentRegistry || "Not configured"}`);
    console.log(`       AccessControl:    ${config.contractAccessControl || "Not configured"}`);
  });

  const shutdown = () => {
    console.log("\n[INFO] Gracefully shutting down API server...");
    server.close(() => {
      console.log("[INFO] Server closed.");
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

if (process.env.NODE_ENV !== "test") {
  main().catch((err) => {
    console.error("[FATAL] Failed to start API server:", err);
    process.exit(1);
  });
}
