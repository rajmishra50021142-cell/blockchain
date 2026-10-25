"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../lib/auth/AuthContext";
import { useWallet } from "../../lib/wallet/WalletContext";
import { config } from "../../lib/config/env";
import { apiClient } from "../../lib/api/client";
import { formatAddress } from "../../lib/wallet/wallet-utils";
import { useDocumentVerification } from "../../lib/verification/useDocumentVerification";
import { formatVerificationVerdict } from "../../lib/verification/verification-service";
import { DocumentRecord } from "../../lib/api/types";
import { Badge } from "../ui/Badge";
import { ErrorState } from "../ui/ErrorState";
import { LoadingState } from "../ui/LoadingState";
import { EmptyState } from "../ui/EmptyState";

export function VerifyView() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id") || "";

  const { isAuthenticated, login, authState } = useAuth();
  const { address, chainId } = useWallet();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const keyInputRef = useRef<HTMLInputElement | null>(null);

  const {
    state,
    setDocumentId,
    selectCandidateFile,
    setCandidateHash,
    selectKeyFile,
    setKeyHex,
    clearKey,
    executeVerification,
    executeStoredObjectAudit,
    reset,
  } = useDocumentVerification(initialId);

  // Accessible documents for quick selection
  const [accessibleDocs, setAccessibleDocs] = useState<DocumentRecord[]>([]);
  const [loadingDocs, setLoadingDocs] = useState<boolean>(false);
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);
  const [manualKeyText, setManualKeyText] = useState<string>("");

  useEffect(() => {
    if (isAuthenticated) {
      setLoadingDocs(true);
      apiClient
        .getDocuments()
        .then((res) => setAccessibleDocs(res.documents || []))
        .catch(() => setAccessibleDocs([]))
        .finally(() => setLoadingDocs(false));
    } else {
      setAccessibleDocs([]);
    }
  }, [isAuthenticated, address]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      selectCandidateFile(e.target.files[0]);
    }
  };

  const handleKeyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      selectKeyFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      selectCandidateFile(e.dataTransfer.files[0]);
    }
  };

  const isWrongNetwork = chainId !== null && chainId !== config.expectedChainId;

  const verdict = state.result
    ? formatVerificationVerdict(state.result.status)
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-zinc-800/80 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="info">Phase 14 Production Workflow</Badge>
          <span className="text-xs text-zinc-500 font-mono">
            Candidate File → SHA-256 → DocumentRegistry.sol
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
          Independent Document Verification
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Cryptographically compare candidate document bytes against the authoritative immutable hash recorded in DocumentRegistry.sol, with real authorization and revocation checks.
        </p>
      </div>

      {/* Network or Auth Checks */}
      {!address ? (
        <EmptyState
          title="Wallet Connection Required"
          description="Connect MetaMask to execute verified on-chain cryptographic queries."
        />
      ) : isWrongNetwork ? (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-6 text-rose-200 space-y-2">
          <div className="font-semibold text-sm">Unsupported Network Detected</div>
          <p className="text-xs text-rose-300">
            Your wallet is connected to Chain ID {chainId}. DocumentRegistry is deployed on Chain ID {config.expectedChainId} ({config.contractNetwork}). Please switch network in MetaMask.
          </p>
        </div>
      ) : !isAuthenticated ? (
        <EmptyState
          title="Backend Authentication Required"
          description="Sign in with your Ethereum wallet to authenticate API requests and validate on-chain permissions against AccessControl.sol."
          action={
            <button
              onClick={login}
              disabled={authState === "waiting-signature" || authState === "verifying"}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 text-xs font-semibold shadow-md transition-colors"
            >
              {authState === "waiting-signature"
                ? "Confirm in MetaMask..."
                : authState === "verifying"
                ? "Verifying Signature..."
                : "Sign in with Ethereum"}
            </button>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Step 1: Document Selection */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 md:p-8 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300 font-mono">
                Step 1: Target Document ID
              </h2>
              {accessibleDocs.length > 0 && (
                <span className="text-xs text-zinc-500 font-mono">
                  {accessibleDocs.length} accessible record(s) found
                </span>
              )}
            </div>

            {/* Quick selector if accessible docs exist */}
            {accessibleDocs.length > 0 && (
              <div className="space-y-1">
                <label className="text-xs text-zinc-400 font-medium">
                  Select from your registered or shared documents:
                </label>
                <select
                  value={state.documentId}
                  onChange={(e) => setDocumentId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-xs font-mono text-zinc-200 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">-- Choose an on-chain document --</option>
                  {accessibleDocs.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.id} ({doc.isOwner ? "Owner" : "Granted Verifier"} {doc.revoked ? "• REVOKED" : ""})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Manual Document ID Input */}
            <div className="space-y-1.5">
              <label htmlFor="documentIdInput" className="text-xs text-zinc-400 font-medium">
                Or enter EVM bytes32 Document ID:
              </label>
              <input
                id="documentIdInput"
                type="text"
                value={state.documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                placeholder="0x..."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Step 2: Candidate File Selection */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 md:p-8 backdrop-blur-sm space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300 font-mono">
              Step 2: Candidate Document File
            </h2>

            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-700/80 hover:border-indigo-500/80 rounded-xl p-8 text-center cursor-pointer transition-colors bg-zinc-950/40 hover:bg-zinc-900/40"
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="space-y-2">
                <span className="text-3xl">🔍</span>
                <div className="text-sm font-medium text-zinc-200">
                  {state.candidateFileName ? (
                    <span className="text-indigo-400 font-mono">{state.candidateFileName}</span>
                  ) : (
                    "Click to select candidate file or drag and drop here"
                  )}
                </div>
                {state.candidateFileSize !== null && (
                  <div className="text-xs text-zinc-500 font-mono">
                    Size: {(state.candidateFileSize / 1024).toFixed(2)} KB ({state.candidateFileSize} bytes)
                  </div>
                )}
                <p className="text-[11px] text-zinc-500">
                  Exact raw file bytes are hashed in local browser memory via Web Crypto SHA-256. Plaintext is never transmitted to the blockchain or backend.
                </p>
              </div>
            </div>

            {/* Computed Candidate Hash */}
            {state.candidateHash && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-1.5 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 uppercase text-[10px]">Computed Candidate SHA-256</span>
                  <span className="text-emerald-400 text-[10px]">Web Crypto SHA-256</span>
                </div>
                <p className="text-zinc-200 break-all select-all">{state.candidateHash}</p>
              </div>
            )}
          </div>

          {/* Optional Stored-Object Key Input (Section 14 & 15) */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-mono flex items-center gap-1.5">
                  <span>🔐</span> Optional: Stored-Object Cryptographic Audit
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Audit whether the encrypted IPFS ciphertext decrypts to exact bytes matching the on-chain hash.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowKeyInput(!showKeyInput)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-mono underline"
              >
                {showKeyInput ? "Hide Key Input" : "Provide Decryption Key"}
              </button>
            </div>

            {showKeyInput && (
              <div className="pt-2 space-y-3 border-t border-zinc-800/60">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-[11px] text-zinc-400 leading-relaxed">
                  <span className="font-semibold text-zinc-300 font-mono">Key Isolation Notice:</span> On-chain access permissions do not transmit raw AES encryption keys. To audit the stored IPFS object, supply your document key backup (<code className="text-indigo-300 font-mono">.key</code>) or 64-character hex key. The key remains exclusively in browser memory.
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    ref={keyInputRef}
                    type="file"
                    accept=".key,.bin"
                    className="hidden"
                    onChange={handleKeyFileChange}
                  />
                  <button
                    type="button"
                    onClick={() => keyInputRef.current?.click()}
                    className="rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 text-xs font-mono font-semibold transition-colors"
                  >
                    📂 Load Key File (.key)
                  </button>

                  <span className="text-xs text-zinc-500 font-mono">or enter 64-hex key:</span>

                  <div className="flex-1 flex gap-2 w-full">
                    <input
                      type="password"
                      value={manualKeyText}
                      onChange={(e) => setManualKeyText(e.target.value)}
                      placeholder="64 hex characters (256-bit AES key)"
                      className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:border-indigo-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setKeyHex(manualKeyText)}
                      className="rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-2 text-xs font-mono font-semibold transition-colors"
                    >
                      Set Key
                    </button>
                  </div>
                </div>

                {state.keyBytes && (
                  <div className="flex items-center justify-between rounded-lg bg-emerald-950/20 border border-emerald-500/30 px-3 py-2 text-xs font-mono text-emerald-400">
                    <span>✓ 256-bit AES-GCM Key loaded into browser memory ({state.keyFileName || "Hex"})</span>
                    <button
                      type="button"
                      onClick={clearKey}
                      className="text-zinc-500 hover:text-zinc-300 text-[11px]"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={reset}
              className="rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 px-4 py-2 text-xs font-semibold transition-colors"
            >
              Reset
            </button>

            <button
              onClick={executeVerification}
              disabled={
                state.stage === "HASHING_CANDIDATE" ||
                state.stage === "VERIFYING_CANDIDATE" ||
                state.stage === "DECRYPTING_STORED" ||
                !state.documentId ||
                !state.candidateHash
              }
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 text-xs font-semibold shadow-md transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {state.stage === "VERIFYING_CANDIDATE" ? (
                "Querying Blockchain..."
              ) : state.stage === "DECRYPTING_STORED" ? (
                "Auditing IPFS Ciphertext..."
              ) : (
                "Run Cryptographic Verification →"
              )}
            </button>
          </div>

          {/* Loading Indicator */}
          {(state.stage === "VERIFYING_CANDIDATE" || state.stage === "DECRYPTING_STORED") && (
            <LoadingState
              message={
                state.stage === "VERIFYING_CANDIDATE"
                  ? "Querying on-chain DocumentRegistry and AccessControl records..."
                  : "Retrieving IPFS ciphertext and testing AES-256-GCM authentication..."
              }
            />
          )}

          {/* Error Banner */}
          {state.error && (
            <ErrorState
              title="Verification Could Not Be Completed"
              message={state.error}
              onRetry={executeVerification}
            />
          )}

          {/* Result Outcome Card */}
          {state.result && verdict && (
            <div
              className={`rounded-2xl border p-6 md:p-8 backdrop-blur-sm space-y-6 ${
                verdict.variant === "success"
                  ? "border-emerald-500/40 bg-emerald-950/20"
                  : verdict.variant === "warning"
                  ? "border-amber-500/40 bg-amber-950/20"
                  : "border-rose-500/40 bg-rose-950/20"
              }`}
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {verdict.variant === "success"
                      ? "✓"
                      : verdict.variant === "warning"
                      ? "⚠"
                      : "✗"}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-zinc-100">
                      {verdict.title}
                    </h3>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">
                      Verification Latency: {state.result.verificationDurationMs ?? 0} ms
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={verdict.variant}>
                    {state.result.status.replace("_", " ")}
                  </Badge>
                  {state.result.revoked && <Badge variant="warning">REVOKED ON-CHAIN</Badge>}
                </div>
              </div>

              {/* Truthful Description (Section 21 False-Certification Rule) */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 text-xs leading-relaxed text-zinc-300">
                {verdict.description}
              </div>

              {/* Cryptographic Comparison Evidence */}
              <div className="space-y-4 font-mono text-xs">
                <div className="space-y-1">
                  <span className="text-zinc-500 text-[10px] uppercase">Candidate SHA-256 Digest (Local File)</span>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-3 text-zinc-200 break-all select-all">
                    {state.result.candidateHash}
                  </div>
                </div>

                {state.result.onChainHash && (
                  <div className="space-y-1">
                    <span className="text-zinc-500 text-[10px] uppercase">Authoritative On-Chain Digest (DocumentRegistry.sol)</span>
                    <div
                      className={`rounded-xl border p-3 break-all select-all ${
                        state.result.match
                          ? "border-emerald-500/30 bg-zinc-950/80 text-emerald-400"
                          : "border-rose-500/30 bg-zinc-950/80 text-rose-400"
                      }`}
                    >
                      {state.result.onChainHash}
                    </div>
                  </div>
                )}
              </div>

              {/* Provenance Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs font-mono">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 space-y-1">
                  <span className="text-zinc-500 text-[10px] uppercase">Document ID</span>
                  <p className="text-zinc-300 truncate" title={state.result.documentId}>
                    {state.result.documentId}
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 space-y-1">
                  <span className="text-zinc-500 text-[10px] uppercase">Registered Owner</span>
                  <p className="text-zinc-300">
                    {state.result.owner ? formatAddress(state.result.owner) : "Unknown"}
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 space-y-1">
                  <span className="text-zinc-500 text-[10px] uppercase">Network</span>
                  <p className="text-zinc-300">Chain ID {config.expectedChainId}</p>
                </div>
              </div>

              {/* Stored-Object Cryptographic Audit Result (Section 15 & 16) */}
              {state.storedObjectResult && state.storedObjectResult.attempted && (
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-mono">
                      Stored-Object Cryptographic Audit (IPFS → AES-256-GCM)
                    </span>
                    <Badge
                      variant={
                        state.storedObjectResult.status === "SUCCESS"
                          ? "success"
                          : "danger"
                      }
                    >
                      {state.storedObjectResult.status}
                    </Badge>
                  </div>

                  {state.storedObjectResult.status === "SUCCESS" ? (
                    <div className="space-y-2 text-xs font-mono text-zinc-300">
                      <p className="text-emerald-400">
                        ✓ Ciphertext successfully retrieved from IPFS and authenticated via AES-256-GCM.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-zinc-500">Recovered Plaintext: </span>
                          <span>{state.storedObjectResult.recoveredPlaintextLength} bytes</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Decrypted Hash Matches On-Chain: </span>
                          <span className="text-emerald-400 font-bold">YES</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs font-mono text-rose-300 space-y-1">
                      <p>✗ Stored-object audit could not confirm integrity:</p>
                      <p className="text-[11px] text-rose-400">{state.storedObjectResult.error}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Links */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href={`/documents/${state.result.documentId}`}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-xs font-semibold shadow-md transition-colors"
                >
                  View Document Details →
                </Link>
                <Link
                  href="/documents"
                  className="rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 px-4 py-2 text-xs font-semibold transition-colors"
                >
                  Document Inventory
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
