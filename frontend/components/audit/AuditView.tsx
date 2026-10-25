"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../../lib/auth/AuthContext";
import { apiClient } from "../../lib/api/client";
import { NormalizedAuditEvent, ApiError } from "../../lib/api/types";
import { formatAddress } from "../../lib/wallet/wallet-utils";
import { Badge, BadgeVariant } from "../ui/Badge";
import { LoadingState } from "../ui/LoadingState";
import { ErrorState } from "../ui/ErrorState";
import { EmptyState } from "../ui/EmptyState";

export function AuditView() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id") || "";

  const { isAuthenticated, login, authState } = useAuth();

  const [documentId, setDocumentId] = useState<string>(initialId);
  const [events, setEvents] = useState<NormalizedAuditEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(Boolean(initialId));
  const [error, setError] = useState<string | null>(null);

  const fetchAudit = useCallback(
    async (idToQuery: string) => {
      const cleanId = idToQuery.trim();
      if (!cleanId) return;

      setLoading(true);
      setError(null);
      setHasSearched(true);

      try {
        const res = await apiClient.getAuditTrail(cleanId);
        setEvents(res.events || res.auditTrail || []);
      } catch (err: any) {
        console.error("Audit query error:", err);
        setEvents([]);
        if (err instanceof ApiError) {
          if (err.status === 403) {
            setError("Access Denied: You must be the document owner or an authorized verifier to query the audit history.");
          } else if (err.status === 404) {
            setError("Document Not Found: No document with this ID is registered in DocumentRegistry.");
          } else {
            setError(err.message);
          }
        } else {
          setError(err.message || "Failed to load audit history.");
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (initialId && isAuthenticated) {
      fetchAudit(initialId);
    }
  }, [initialId, isAuthenticated, fetchAudit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentId.trim()) {
      setError("Please provide a Document ID to query.");
      return;
    }
    fetchAudit(documentId);
  };

  const getEventBadgeVariant = (name: string): BadgeVariant => {
    switch (name) {
      case "DocumentRegistered":
        return "success";
      case "AccessGranted":
        return "info";
      case "AccessRevoked":
        return "warning";
      case "DocumentRevoked":
        return "danger";
      default:
        return "default";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="border-b border-zinc-800/80 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
          On-Chain Audit Trail
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Inspect the chronological, immutable lineage of blockchain events emitted by DocumentRegistry and AccessControl smart contracts.
        </p>
      </div>

      {/* Query Bar */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-sm space-y-4">
          <label
            htmlFor="auditDocId"
            className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 font-mono"
          >
            Target Document ID (bytes32 hex)
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="auditDocId"
              type="text"
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
              placeholder="0x..."
              className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={loading || !isAuthenticated}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 text-xs font-semibold shadow-md transition-colors disabled:opacity-50 shrink-0"
            >
              {loading ? "Querying Chain..." : "Fetch Audit Trail"}
            </button>
          </div>
        </div>
      </form>

      {!isAuthenticated ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-center backdrop-blur-sm">
          <h3 className="text-base font-semibold text-zinc-100">
            Authentication Required
          </h3>
          <p className="mt-2 text-sm text-zinc-400 max-w-md mx-auto">
            Audit logs are restricted to authorized parties. Sign in with your wallet to inspect event lineage.
          </p>
          <div className="mt-6">
            <button
              onClick={login}
              disabled={authState === "waiting-signature" || authState === "verifying"}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 text-xs font-semibold shadow-md transition-colors"
            >
              Sign In to Inspect
            </button>
          </div>
        </div>
      ) : loading ? (
        <LoadingState
          message="Reconstructing audit lineage from blockchain event logs..."
          detail={`Inspecting ${formatAddress(documentId)}`}
        />
      ) : error ? (
        <ErrorState
          title="Audit Query Failed"
          message={error}
          onRetry={() => fetchAudit(documentId)}
        />
      ) : !hasSearched ? (
        <EmptyState
          title="Awaiting Query"
          description="Enter a document ID above to query its on-chain event history."
        />
      ) : events.length === 0 ? (
        <EmptyState
          title="Zero Audit Events Found"
          description="No event logs were returned for this document ID in DocumentRegistry or AccessControl."
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>Chronological Event Lineage ({events.length} events)</span>
            <span>Target: {formatAddress(documentId)}</span>
          </div>

          <div className="relative border-l-2 border-zinc-800 ml-4 space-y-8 pl-6 py-2">
            {events.map((evt, idx) => (
              <div key={`${evt.transactionHash}-${evt.logIndex}-${idx}`} className="relative group">
                {/* Timeline node */}
                <span className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-zinc-900 bg-indigo-500 ring-4 ring-zinc-950" />

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-sm space-y-3 hover:border-zinc-700 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/60 pb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={getEventBadgeVariant(evt.eventName)}>
                        {evt.eventName}
                      </Badge>
                      <span className="text-xs font-mono text-zinc-400">
                        Block #{evt.blockNumber}
                      </span>
                    </div>

                    <span className="text-xs text-zinc-500 font-mono">
                      {new Date(evt.timestamp * 1000).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="space-y-1">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                        Actor / Signer
                      </div>
                      <div className="text-zinc-200 select-all break-all">
                        {evt.actor}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                        Transaction Hash
                      </div>
                      <div className="text-zinc-300 select-all break-all">
                        {evt.transactionHash}
                      </div>
                    </div>

                    {evt.details && Object.keys(evt.details).length > 0 && (
                      <div className="space-y-1 md:col-span-2 pt-1 border-t border-zinc-800/40">
                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                          Event Parameters
                        </div>
                        <div className="rounded-lg bg-zinc-950/80 p-2.5 text-[11px] text-zinc-300 font-mono space-y-1">
                          {Object.entries(evt.details).map(([k, v]) => (
                            <div key={k} className="flex flex-col sm:flex-row sm:gap-2">
                              <span className="text-zinc-500">{k}:</span>
                              <span className="text-zinc-300 break-all">{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
