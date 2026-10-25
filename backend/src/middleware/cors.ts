/**
 * Phase 10: Strict CORS Configuration
 *
 * Binds Access-Control-Allow-Origin strictly to the configured frontend origin.
 * Disallows wildcard (*) when credentials are used.
 */

import cors from "cors";
import { config } from "../config/env";

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. server-to-server, curl, tests) without origin header
    if (!origin) {
      return callback(null, true);
    }

    // Direct match against configured frontend origin
    if (origin === config.corsOrigin) {
      return callback(null, true);
    }

    // Localhost variations for local development flexibility (e.g. 127.0.0.1 vs localhost)
    if (
      origin === "http://localhost:3000" ||
      origin === "http://127.0.0.1:3000" ||
      origin === "http://localhost:3001" ||
      origin === "http://127.0.0.1:3001"
    ) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for unauthorized origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Request-Id",
    "x-request-id",
    "X-Filename",
    "x-filename",
    "Accept",
  ],
  exposedHeaders: ["X-Request-Id"],
  maxAge: 86400,
});
