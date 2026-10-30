"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "../../lib/auth/AuthContext";
import { apiClient } from "../../lib/api/client";
import { DocumentRecord } from "../../lib/api/types";
import { formatAddress } from "../../lib/wallet/wallet-utils";
import { Badge } from "../ui/Badge";
import { LoadingState } from "../ui/LoadingState";
import { ErrorState } from "../ui/ErrorState";
import { DocumentSharingView } from "../sharing/DocumentSharingView";

interface DocumentDetailViewProps {
  documentId: string;
}

export function DocumentDetailView({ documentId }: DocumentDetailViewProps) {
  const { isAuthenticated, login, authState } = useAuth();
  const [doc, setDoc] = useState<DocumentRecord | null>(null);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocument = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getDocument(documentId);
      setDoc(res);
      setIsOwner(res.isOwner);
      setHasAccess(res.hasAccess);
    } catch (err: any) {
      console.error("Failed to load document:", err);
      setError(err.message || "Failed to load document metadata.");
      setDoc(null);
    } finally {
      setLoading(false);
    }
  }, [documentId, isAuthenticated]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-center backdrop-blur-sm">
          <h2 className="text-lg font-bold text-zinc-100">
            Authentication Required
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            You must authenticate with your wallet signature to query on-chain document provenance.
          </p>
          <div className="mt-6">
            <button
              onClick={login}
              disabled={authState === "waiting-signature" || authState === "verifying"}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 text-xs font-semibold shadow-md transition-colors"
            >
              Sign In to View Document
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <LoadingState
        message="Loading on-chain document provenance..."
        detail={`Querying ${formatAddress(documentId)}`}
      />
    );
  }

  if (error || !doc) {
    return (
      <div className="space-y-4">
        <Link
          href="/documents"
          className="text-xs text-indigo-400 hover:text-indigo-300 font-mono"
        >
          ← Back to Documents
        </Link>
        <ErrorState
          title="Document Retrieval Failed"
          message={error || "Document not found."}
          onRetry={loadDocument}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/documents"
          className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors font-mono"
        >
          ← Back to Documents
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/verify?id=${doc.id}`}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white transition-colors"
          >
            Verify Integrity
          </Link>
        </div>
      </div>

      {/* Main Metadata Card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 md:p-8 backdrop-blur-sm shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="text-xs text-zinc-400 font-mono uppercase tracking-wider">
              Document Provenance Record
            </div>
            <h1 className="mt-1 text-xl font-bold font-mono text-zinc-100 break-all">
              {doc.id}
            </h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {doc.revoked ? (
              <Badge variant="danger">Revoked On-Chain</Badge>
            ) : (
              <Badge variant="success">Active On-Chain</Badge>
            )}
            {isOwner && <Badge variant="info">Owner</Badge>}
            {!isOwner && hasAccess && <Badge variant="info">Authorized Verifier</Badge>}
          </div>
        </div>

        {/* Provenance Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Owner */}
          <div className="space-y-1.5 rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-4 font-mono">
            <div className="text-[11px] text-zinc-500 uppercase tracking-wider flex items-center justify-between">
              <span>Document Owner</span>
              <span className="text-[10px] text-emerald-400">DocumentRegistry</span>
            </div>
            <div className="text-xs text-zinc-200 break-all select-all">
              {doc.owner}
            </div>
          </div>

          {/* Registration Date */}
          <div className="space-y-1.5 rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-4 font-mono">
            <div className="text-[11px] text-zinc-500 uppercase tracking-wider flex items-center justify-between">
              <span>Registration Timestamp</span>
              <span className="text-[10px] text-emerald-400">Block Header</span>
            </div>
            <div className="text-xs text-zinc-200">
              {doc.createdAt
                ? `${new Date(doc.createdAt * 1000).toUTCString()} (Unix: ${doc.createdAt})`
                : "—"}
            </div>
          </div>

          {/* On-Chain SHA-256 Digest */}
          <div className="space-y-1.5 rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-4 font-mono md:col-span-2">
            <div className="text-[11px] text-zinc-500 uppercase tracking-wider flex items-center justify-between">
              <span>Authoritative SHA-256 Fingerprint</span>
              <span className="text-[10px] text-emerald-400">EVM bytes32</span>
            </div>
            <div className="text-xs text-zinc-200 break-all select-all font-mono">
              {doc.fileHash}
            </div>
            <p className="text-[11px] text-zinc-500 font-sans mt-1">
              Immutable hash digest anchored during registration. Used to verify byte-for-byte integrity upon retrieval.
            </p>
          </div>

          {/* IPFS CID */}
          <div className="space-y-1.5 rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-4 font-mono md:col-span-2">
            <div className="text-[11px] text-zinc-500 uppercase tracking-wider flex items-center justify-between">
              <span>Decentralized Storage Reference (IPFS CID)</span>
              <span className="text-[10px] text-blue-400">Pinata V3</span>
            </div>
            <div className="text-xs text-zinc-200 break-all select-all font-mono">
              {doc.cid}
            </div>
            <p className="text-[11px] text-zinc-500 font-sans mt-1">
              Points to the client-side AES-256-GCM encrypted ciphertext stored on decentralized IPFS cluster.
            </p>
          </div>
        </div>

        {/* Access Control & Sharing Section */}
        <div className="pt-2">
          <DocumentSharingView
            document={doc}
            onRefresh={loadDocument}
          />
        </div>
      </div>
    </div>
  );
}

