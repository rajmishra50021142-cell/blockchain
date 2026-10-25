"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useWallet } from "../../lib/wallet/WalletContext";
import { useAuth } from "../../lib/auth/AuthContext";
import { apiClient } from "../../lib/api/client";
import { DocumentRecord } from "../../lib/api/types";
import { formatAddress } from "../../lib/wallet/wallet-utils";
import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";
import { LoadingState } from "../ui/LoadingState";
import { ErrorState } from "../ui/ErrorState";

export function DocumentListView() {
  const { address } = useWallet();
  const { isAuthenticated, login, authState } = useAuth();

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getDocuments();
      setDocuments(res.documents || []);
    } catch (err: any) {
      console.error("Failed to load documents:", err);
      setError(err.message || "Failed to load documents.");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Document Inventory
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            All documents registered by your connected wallet on the Ethereum DocumentRegistry smart contract.
          </p>
        </div>

        {isAuthenticated && (
          <div className="flex items-center gap-2.5">
            <Link
              href="/register"
              className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5"
            >
              <span>+</span> Register Document
            </Link>
            <button
              onClick={loadDocuments}
              disabled={loading}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-1.5 text-xs font-mono text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh On-Chain"}
            </button>
          </div>
        )}
      </div>

      {!address ? (
        <EmptyState
          title="Wallet Not Connected"
          description="Connect your MetaMask wallet to view registered documents."
        />
      ) : !isAuthenticated ? (
        <EmptyState
          title="Authentication Required"
          description="Sign the EIP-191 challenge in your wallet to verify your identity and query document records."
          action={
            <button
              onClick={login}
              disabled={authState === "waiting-signature" || authState === "verifying"}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-xs font-semibold shadow-md transition-colors"
            >
              {authState === "waiting-signature"
                ? "Confirm in MetaMask..."
                : authState === "verifying"
                ? "Verifying..."
                : "Sign in with Ethereum"}
            </button>
          }
        />
      ) : loading ? (
        <LoadingState message="Fetching registered documents from blockchain..." />
      ) : error ? (
        <ErrorState
          title="Failed to Load Document Inventory"
          message={error}
          onRetry={loadDocuments}
        />
      ) : documents.length === 0 ? (
        <EmptyState
          title="No Documents Registered"
          description="Zero documents have been registered on-chain for this wallet address. Register your first document to encrypt and anchor it to the blockchain."
          action={
            <Link
              href="/register"
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 text-xs font-semibold shadow-md transition-colors inline-block"
            >
              Register Document Now →
            </Link>
          }
        />
      ) : (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 overflow-hidden backdrop-blur-sm shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-mono">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Document ID</th>
                  <th className="py-3.5 px-4 font-semibold">Owner</th>
                  <th className="py-3.5 px-4 font-semibold">SHA-256 Digest</th>
                  <th className="py-3.5 px-4 font-semibold">IPFS CID</th>
                  <th className="py-3.5 px-4 font-semibold">Registered</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono text-zinc-100 font-medium">
                      {formatAddress(doc.id)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-400">
                      {formatAddress(doc.owner)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-400">
                      {formatAddress(doc.fileHash)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-400">
                      {formatAddress(doc.cid)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-400">
                      {doc.createdAt
                        ? new Date(doc.createdAt * 1000).toLocaleString()
                        : "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      {doc.revoked ? (
                        <Badge variant="danger">Revoked</Badge>
                      ) : (
                        <Badge variant="success">Active</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/documents/${doc.id}`}
                          className="inline-flex items-center gap-1 rounded-md bg-indigo-950/60 border border-indigo-800/60 hover:bg-indigo-900/60 px-2.5 py-1 text-[11px] font-medium text-indigo-300 transition-colors"
                        >
                          Share / Access
                        </Link>
                        <Link
                          href={`/documents/${doc.id}`}
                          className="inline-flex items-center gap-1 rounded-md bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 text-[11px] font-medium text-zinc-200 transition-colors"
                        >
                          Inspect
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
