/**
 * Phase 10: Strict CORS Configuration
 *
 * Binds Access-Control-Allow-Origin strictly to configured frontend origins (e.g. Vercel production domain).
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

    const normalizedOrigin = origin.trim().replace(/\/$/, "");

    // Parse comma-separated list of allowed origins from config
    const allowedOrigins = config.corsOrigin
      .split(",")
      .map((o) => o.trim().replace(/\/$/, ""))
      .filter(Boolean);

    // Direct match against configured origins
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    // Support Vercel deployment preview domains if Vercel is configured in CORS_ORIGIN
    const hasVercelConfigured = allowedOrigins.some((o) =>
      o.includes(".vercel.app")
    );
    if (
      hasVercelConfigured &&
      /^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/i.test(normalizedOrigin)
    ) {
      return callback(null, true);
    }

    // Localhost variations for local development flexibility (e.g. 127.0.0.1 vs localhost)
    if (
      normalizedOrigin === "http://localhost:3000" ||
      normalizedOrigin === "http://127.0.0.1:3000" ||
      normalizedOrigin === "http://localhost:3001" ||
      normalizedOrigin === "http://127.0.0.1:3001"
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
