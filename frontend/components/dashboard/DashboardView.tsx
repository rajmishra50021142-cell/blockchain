"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useWallet } from "../../lib/wallet/WalletContext";
import { useAuth } from "../../lib/auth/AuthContext";
import { apiClient } from "../../lib/api/client";
import { DocumentRecord, ReadyResponse } from "../../lib/api/types";
import { formatAddress } from "../../lib/wallet/wallet-utils";
import { config } from "../../lib/config/env";
import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";
import { LoadingState } from "../ui/LoadingState";
import { ErrorState } from "../ui/ErrorState";

export function DashboardView() {
  const { address, state: walletState, chainId, expectedChainId } = useWallet();
  const { isAuthenticated, authState, login } = useAuth();

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [readyStatus, setReadyStatus] = useState<ReadyResponse | null>(null);

  const isWrongNetwork = chainId !== null && chainId !== expectedChainId;

  // Fetch documents when authenticated
  const loadDocuments = useCallback(async () => {
    if (!isAuthenticated) {
      setDocuments([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getDocuments();
      setDocuments(res.documents || []);
    } catch (err: any) {
      console.error("Failed to load documents:", err);
      setError(err.message || "Failed to load documents from backend.");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Fetch backend readiness probe
  useEffect(() => {
    let isMounted = true;
    apiClient
      .getReady()
      .then((res) => {
        if (isMounted) setReadyStatus(res);
      })
      .catch(() => {
        if (isMounted) setReadyStatus(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            System Overview & Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Real-time status of your decentralized identity, registered documents, and blockchain connectivity.
          </p>
        </div>

        {/* Readiness indicator */}
        <div className="flex items-center gap-2">
          {readyStatus ? (
            <Badge variant="success">Backend & RPC Ready</Badge>
          ) : (
            <Badge variant="warning">Backend Standby</Badge>
          )}
        </div>
      </div>

      {/* Network Warning Banner */}
      {isWrongNetwork && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-amber-200 text-xs font-mono">
          <strong>Network Mismatch:</strong> Your wallet is connected to Chain #{chainId}. Please switch to Hardhat Localhost (Chain #{expectedChainId}) to interact with smart contracts.
        </div>
      )}

      {/* Status Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Wallet Metric */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-sm">
          <div className="text-xs text-zinc-400 font-mono uppercase tracking-wider">
            Connected Wallet
          </div>
          <div className="mt-2 text-lg font-bold text-zinc-100 font-mono">
            {address ? formatAddress(address) : "Not Connected"}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Badge variant={walletState === "connected" ? "success" : "neutral"}>
              {walletState}
            </Badge>
          </div>
        </div>

        {/* Authentication Metric */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-sm">
          <div className="text-xs text-zinc-400 font-mono uppercase tracking-wider">
            Backend API Session
          </div>
          <div className="mt-2 text-lg font-bold text-zinc-100">
            {isAuthenticated ? "Authenticated" : "Unauthenticated"}
          </div>
          <div className="mt-3 flex items-center gap-2">
            {isAuthenticated ? (
              <Badge variant="success">JWT Active</Badge>
            ) : walletState === "connected" ? (
              <button
                onClick={login}
                disabled={authState === "waiting-signature" || authState === "verifying"}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium underline"
              >
                Sign In to API
              </button>
            ) : (
              <Badge variant="neutral">Connect First</Badge>
            )}
          </div>
        </div>

        {/* Document Inventory Metric */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-sm">
          <div className="text-xs text-zinc-400 font-mono uppercase tracking-wider">
            Registered Documents
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-100">
            {loading ? "..." : isAuthenticated ? documents.length : "—"}
          </div>
          <div className="mt-3 text-[11px] text-zinc-400 font-mono">
            {isAuthenticated ? "From on-chain event logs" : "Requires sign-in"}
          </div>
        </div>

        {/* Network Metric */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-sm">
          <div className="text-xs text-zinc-400 font-mono uppercase tracking-wider">
            Target Chain ID
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-100 font-mono">
            {config.expectedChainId}
          </div>
          <div className="mt-3 text-[11px] text-zinc-400 font-mono">
            {config.contractNetwork}
          </div>
        </div>
      </div>

      {/* Main Content Split: Documents & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Document Feed / List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-100">
              Registered Documents
            </h2>
            {isAuthenticated && (
              <button
                onClick={loadDocuments}
                className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors font-mono"
              >
                Refresh
              </button>
            )}
          </div>

          {!address ? (
            <EmptyState
              title="Wallet Not Connected"
              description="Connect your MetaMask wallet to view documents anchored to your cryptographic address."
            />
          ) : !isAuthenticated ? (
            <EmptyState
              title="API Session Required"
              description="Sign in with your wallet signature to query the on-chain document registry through the secure backend."
              action={
                <button
                  onClick={login}
                  disabled={authState === "waiting-signature" || authState === "verifying"}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-xs font-semibold shadow-md transition-colors"
                >
                  {authState === "waiting-signature"
                    ? "Confirm in MetaMask..."
                    : authState === "verifying"
                    ? "Verifying Signature..."
                    : "Sign in with Ethereum"}
                </button>
              }
            />
          ) : loading ? (
            <LoadingState message="Querying document registry from blockchain..." />
          ) : error ? (
            <ErrorState
              title="Failed to Load Documents"
              message={error}
              onRetry={loadDocuments}
            />
          ) : documents.length === 0 ? (
            <EmptyState
              title="No Documents Found"
              description="You have zero documents registered on-chain for this wallet address."
              action={
                <Link
                  href="/register"
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 text-xs font-semibold shadow-md transition-colors inline-block"
                >
                  Register First Document →
                </Link>
              }
            />
          ) : (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 overflow-hidden backdrop-blur-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950/60 border-b border-zinc-800/80 text-zinc-400 font-mono">
                    <tr>
                      <th className="py-3 px-4">Document ID</th>
                      <th className="py-3 px-4">IPFS CID</th>
                      <th className="py-3 px-4">Registered</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {documents.slice(0, 5).map((doc) => (
                      <tr key={doc.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3 px-4 font-mono text-zinc-200">
                          {formatAddress(doc.id)}
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-400">
                          {formatAddress(doc.cid)}
                        </td>
                        <td className="py-3 px-4 text-zinc-400 font-mono">
                          {doc.createdAt
                            ? new Date(doc.createdAt * 1000).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="py-3 px-4">
                          {doc.revoked ? (
                            <Badge variant="danger">Revoked</Badge>
                          ) : (
                            <Badge variant="success">Active</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/documents/${doc.id}`}
                            className="text-indigo-400 hover:text-indigo-300 font-medium"
                          >
                            Details →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {documents.length > 5 && (
                <div className="p-3 border-t border-zinc-800/80 text-center bg-zinc-950/40">
                  <Link
                    href="/documents"
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    View all {documents.length} documents →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Navigation Cards */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-zinc-100">
            Quick Actions
          </h2>

          <div className="space-y-3">
            <Link
              href="/register"
              className="block rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-4 hover:border-indigo-500/60 hover:bg-indigo-500/10 transition-all backdrop-blur-sm group"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-indigo-300 group-hover:text-indigo-200 transition-colors flex items-center gap-1.5">
                  <span>+</span> Register Document
                </span>
                <span className="text-indigo-400 font-mono">→</span>
              </div>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                Encrypt a document with client-side AES-GCM, pin to IPFS, and anchor on-chain proof via MetaMask.
              </p>
            </Link>

            <Link
              href="/verify"
              className="block rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4 hover:border-zinc-700 hover:bg-zinc-800/40 transition-all backdrop-blur-sm group"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-200 group-hover:text-indigo-300 transition-colors">
                  Verify Document
                </span>
                <span className="text-zinc-500 font-mono">→</span>
              </div>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                Cryptographically compare a candidate file hash against on-chain proof with instant tamper detection.
              </p>
            </Link>

            <Link
              href="/audit"
              className="block rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4 hover:border-zinc-700 hover:bg-zinc-800/40 transition-all backdrop-blur-sm group"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-200 group-hover:text-indigo-300 transition-colors">
                  Audit Trail
                </span>
                <span className="text-zinc-500 font-mono">→</span>
              </div>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                Inspect historical on-chain event lineage for registrations, grants, and revocations.
              </p>
            </Link>

            <Link
              href="/wallet"
              className="block rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4 hover:border-zinc-700 hover:bg-zinc-800/40 transition-all backdrop-blur-sm group"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-200 group-hover:text-indigo-300 transition-colors">
                  Wallet & Identity
                </span>
                <span className="text-zinc-500 font-mono">→</span>
              </div>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                View cryptographic address credentials, session TTL, and sign ownership challenges.
              </p>
            </Link>

            <Link
              href="/settings"
              className="block rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4 hover:border-zinc-700 hover:bg-zinc-800/40 transition-all backdrop-blur-sm group"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-200 group-hover:text-indigo-300 transition-colors">
                  System Configuration
                </span>
                <span className="text-zinc-500 font-mono">→</span>
              </div>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                Verify smart contract addresses and live service health for RPC and IPFS.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
