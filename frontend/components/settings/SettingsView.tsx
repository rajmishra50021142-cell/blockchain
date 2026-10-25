"use client";

import React, { useEffect, useState, useCallback } from "react";
import { config, validateConfig } from "../../lib/config/env";
import { apiClient } from "../../lib/api/client";
import { ReadyResponse, HealthResponse } from "../../lib/api/types";
import { Badge } from "../ui/Badge";
import { LoadingState } from "../ui/LoadingState";
import { ErrorState } from "../ui/ErrorState";

export function SettingsView() {
  const [configValidation] = useState(validateConfig());
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [ready, setReady] = useState<ReadyResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [h, r] = await Promise.allSettled([
        apiClient.getHealth(),
        apiClient.getReady(),
      ]);

      if (h.status === "fulfilled") {
        setHealth(h.value);
      } else {
        setHealth(null);
      }

      if (r.status === "fulfilled") {
        setReady(r.value);
      } else {
        setReady(null);
      }

      if (h.status === "rejected" && r.status === "rejected") {
        setError("Unable to connect to backend server. Make sure the Node.js/Express API is running on " + config.apiBaseUrl);
      }
    } catch (err: any) {
      setError(err.message || "Failed to inspect system readiness.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            System Configuration & Readiness
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Inspection of smart contract addresses, RPC network parameters, and live backend health probes.
          </p>
        </div>

        <button
          onClick={checkStatus}
          disabled={loading}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-1.5 text-xs font-mono text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-50"
        >
          {loading ? "Probing..." : "Probe Services"}
        </button>
      </div>

      {error && (
        <ErrorState
          title="Backend Service Unreachable"
          message={error}
          onRetry={checkStatus}
        />
      )}

      {/* Live System Health Section */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 md:p-8 backdrop-blur-sm space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300 font-mono">
            Live Dependency Probes
          </h2>
          <div className="flex items-center gap-2">
            {ready?.status === "ready" ? (
              <Badge variant="success">All Systems Operational</Badge>
            ) : health?.status === "ok" ? (
              <Badge variant="warning">API Live, Dependencies Degraded</Badge>
            ) : (
              <Badge variant="danger">Backend Offline</Badge>
            )}
          </div>
        </div>

        {loading ? (
          <LoadingState message="Checking connection to Ethereum RPC and Pinata IPFS..." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            {/* Express API Probe */}
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-4 space-y-2">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                Express API Server
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    health?.status === "ok" ? "bg-emerald-400" : "bg-rose-500"
                  }`}
                />
                <span className="text-sm font-bold text-zinc-200">
                  {health?.status === "ok" ? "ONLINE" : "OFFLINE"}
                </span>
              </div>
              {health?.uptime !== undefined && (
                <div className="text-[11px] text-zinc-400">
                  Uptime: {Math.floor(health.uptime)}s
                </div>
              )}
            </div>

            {/* Ethereum Node RPC Probe */}
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-4 space-y-2">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                Ethereum RPC Node
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    (ready?.blockchain?.connected ?? (ready?.services?.rpc?.status === "healthy"))
                      ? "bg-emerald-400"
                      : "bg-rose-500"
                  }`}
                />
                <span className="text-sm font-bold text-zinc-200">
                  {(ready?.blockchain?.connected ?? (ready?.services?.rpc?.status === "healthy"))
                    ? "CONNECTED"
                    : "UNAVAILABLE"}
                </span>
              </div>
              {ready?.blockchain?.blockNumber !== undefined ? (
                <div className="text-[11px] text-zinc-400">
                  Block Height: #{ready.blockchain.blockNumber}
                </div>
              ) : ready?.services?.rpc?.latencyMs !== undefined ? (
                <div className="text-[11px] text-zinc-400">
                  Latency: {ready.services.rpc.latencyMs.toFixed(1)}ms
                </div>
              ) : null}
            </div>

            {/* Pinata IPFS Probe */}
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-4 space-y-2">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                IPFS Decentralized Gateway
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    (ready?.ipfs?.configured ?? (ready?.services?.pinata?.status === "healthy"))
                      ? "bg-emerald-400"
                      : "bg-rose-500"
                  }`}
                />
                <span className="text-sm font-bold text-zinc-200">
                  {(ready?.ipfs?.configured ?? (ready?.services?.pinata?.status === "healthy"))
                    ? "CONFIGURED"
                    : "UNAVAILABLE"}
                </span>
              </div>
              {ready?.ipfs?.apiUrl ? (
                <div className="text-[11px] text-zinc-400 truncate max-w-full">
                  Endpoint: {ready.ipfs.apiUrl}
                </div>
              ) : ready?.services?.pinata?.latencyMs !== undefined ? (
                <div className="text-[11px] text-zinc-400">
                  Latency: {ready.services.pinata.latencyMs.toFixed(1)}ms
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Configuration Metadata Table */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 md:p-8 backdrop-blur-sm space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300 font-mono">
            Environment & Contract Addresses
          </h2>
          <Badge variant={configValidation.valid ? "success" : "danger"}>
            {configValidation.valid ? "Config Valid" : "Config Incomplete"}
          </Badge>
        </div>

        <div className="space-y-4 font-mono text-xs">
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-4 space-y-1">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
              DocumentRegistry Smart Contract (Phase 5)
            </div>
            <div className="text-zinc-200 select-all break-all">
              {config.contractDocumentRegistry}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-4 space-y-1">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
              AccessControl Smart Contract (Phase 6)
            </div>
            <div className="text-zinc-200 select-all break-all">
              {config.contractAccessControl}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-4 space-y-1">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                Backend API Gateway URL
              </div>
              <div className="text-zinc-200 select-all break-all">
                {config.apiBaseUrl}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-4 space-y-1">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                Expected Network (Chain ID)
              </div>
              <div className="text-zinc-200">
                {config.contractNetwork} ({config.expectedChainId})
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
