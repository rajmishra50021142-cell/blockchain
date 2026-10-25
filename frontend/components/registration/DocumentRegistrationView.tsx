"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { useDocumentRegistration } from "../../lib/registration/useDocumentRegistration";
import { useWallet } from "../../lib/wallet/WalletContext";
import { useAuth } from "../../lib/auth/AuthContext";
import { config } from "../../lib/config/env";
import { formatAddress } from "../../lib/wallet/wallet-utils";
import { Badge } from "../ui/Badge";
import { LoadingState } from "../ui/LoadingState";
import { ErrorState } from "../ui/ErrorState";
import { EmptyState } from "../ui/EmptyState";

export function DocumentRegistrationView() {
  const { address, chainId } = useWallet();
  const { isAuthenticated, login, authState } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    state,
    selectFile,
    prepareDocument,
    submitRegistration,
    reset,
    downloadKeyBackup,
  } = useDocumentRegistration();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      selectFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      selectFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const isPreparing =
    state.stage === "HASHING" ||
    state.stage === "ENCRYPTING" ||
    state.stage === "UPLOADING";

  const isTransacting =
    state.stage === "WALLET_CONFIRMING" ||
    state.stage === "TRANSACTION_SUBMITTED" ||
    state.stage === "CONFIRMING" ||
    state.stage === "VERIFYING_CHAIN_STATE";

  const isWrongNetwork = chainId !== null && chainId !== config.expectedChainId;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-zinc-800/80 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="info">Phase 12 Production Workflow</Badge>
          <span className="text-xs text-zinc-500 font-mono">
            MetaMask → IPFS → DocumentRegistry
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
          Register New Document
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Encrypt your document with client-side AES-256-GCM, pin the ciphertext to IPFS, and anchor cryptographic proof of ownership on the Ethereum blockchain.
        </p>
      </div>

      {/* Network or Auth Warnings */}
      {!address ? (
        <EmptyState
          title="Wallet Connection Required"
          description="Connect your MetaMask wallet to initiate sovereign document registration."
        />
      ) : !isAuthenticated ? (
        <EmptyState
          title="Backend Authentication Required"
          description="Sign in with your wallet to authenticate with the backend API and access the decentralized IPFS upload relay."
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
      ) : isWrongNetwork ? (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-6 text-rose-200 space-y-2">
          <div className="font-semibold text-sm">Unsupported Network Detected</div>
          <p className="text-xs text-rose-300">
            Your wallet is connected to Chain ID {chainId}. DocumentRegistry is deployed on Chain ID {config.expectedChainId} ({config.contractNetwork}). Please switch your network in MetaMask to proceed.
          </p>
        </div>
      ) : state.stage === "REGISTERED" ? (
        /* Registration Confirmed Card */
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-6 md:p-8 backdrop-blur-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/20 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="success">Confirmed On-Chain</Badge>
                <span className="text-xs font-mono text-emerald-400">
                  Block #{state.blockNumber}
                </span>
              </div>
              <h2 className="text-lg font-bold text-zinc-100 mt-2">
                Document Successfully Registered
              </h2>
            </div>
            <button
              onClick={downloadKeyBackup}
              className="rounded-xl border border-indigo-500/40 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 px-4 py-2 text-xs font-mono font-semibold transition-colors flex items-center gap-2"
            >
              <span>⬇</span> Download Key Backup (.key)
            </button>
          </div>

          {/* Provenance Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-1">
              <span className="text-zinc-500 text-[10px] uppercase">Document ID</span>
              <p className="text-zinc-200 break-all select-all">{state.documentId}</p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-1">
              <span className="text-zinc-500 text-[10px] uppercase">Transaction Hash</span>
              <p className="text-emerald-400 break-all select-all">{state.txHash}</p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-1">
              <span className="text-zinc-500 text-[10px] uppercase">Original SHA-256 Digest</span>
              <p className="text-zinc-300 break-all select-all">{state.documentHash}</p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-1">
              <span className="text-zinc-500 text-[10px] uppercase">IPFS Content Identifier (CID)</span>
              <p className="text-zinc-300 break-all select-all">{state.ipfsCid}</p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-1">
              <span className="text-zinc-500 text-[10px] uppercase">Registered Owner</span>
              <p className="text-zinc-300">{state.owner}</p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-1">
              <span className="text-zinc-500 text-[10px] uppercase">Gas Used</span>
              <p className="text-zinc-300">{state.gasUsed || "—"} units</p>
            </div>
          </div>

          {/* Verified Invariants Checklist */}
          {state.postVerificationDetails && (
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-4 space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
                Post-Registration Cryptographic & State Verification
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <div className="flex items-center gap-2 text-emerald-400">
                  <span>✓</span> On-chain owner matches connected wallet
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <span>✓</span> On-chain hash matches computed SHA-256
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <span>✓</span> On-chain CID matches pinned IPFS object
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <span>✓</span> Decrypted IPFS payload matches original file bytes
                </div>
              </div>
            </div>
          )}

          {/* Post-Registration Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/documents"
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-xs font-semibold shadow-md transition-colors"
            >
              View in Document Inventory →
            </Link>
            <Link
              href={`/verify?id=${state.documentId}`}
              className="rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 px-4 py-2 text-xs font-semibold transition-colors"
            >
              Verify on Blockchain
            </Link>
            <button
              onClick={reset}
              className="rounded-xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 px-4 py-2 text-xs font-semibold transition-colors"
            >
              Register Another Document
            </button>
          </div>
        </div>
      ) : (
        /* Active Workflow Container */
        <div className="space-y-6">
          {/* Error & Cancellation Banners */}
          {state.stage === "CANCELLED" && (
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6 text-amber-200 space-y-3">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <Badge variant="warning">Transaction Cancelled</Badge>
                <span>Wallet Request Rejected</span>
              </div>
              <p className="text-xs text-amber-300 leading-relaxed">{state.error}</p>
              <div className="pt-2">
                <button
                  onClick={reset}
                  className="rounded-lg border border-amber-500/40 bg-amber-500/20 px-3 py-1.5 text-xs font-semibold hover:bg-amber-500/30 transition-colors"
                >
                  Start Over
                </button>
              </div>
            </div>
          )}

          {state.stage === "ERROR" && (
            <ErrorState
              title="Registration Pipeline Error"
              message={state.error || "An unexpected error occurred during document registration."}
              onRetry={reset}
            />
          )}

          {/* Step 1: File Selection Card */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 md:p-8 backdrop-blur-sm space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300 font-mono">
              Step 1: Choose Document
            </h2>

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-700/80 hover:border-indigo-500/80 rounded-xl p-8 text-center cursor-pointer transition-colors bg-zinc-950/40 hover:bg-zinc-900/40"
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                disabled={isPreparing || isTransacting}
              />
              <div className="space-y-2">
                <span className="text-3xl">📄</span>
                <div className="text-sm font-medium text-zinc-200">
                  {state.fileName ? (
                    <span className="text-indigo-400 font-mono">{state.fileName}</span>
                  ) : (
                    "Click to select a file or drag and drop here"
                  )}
                </div>
                {state.fileSizeBytes !== null && (
                  <div className="text-xs text-zinc-500 font-mono">
                    Size: {(state.fileSizeBytes / 1024).toFixed(2)} KB ({state.fileSizeBytes} bytes)
                  </div>
                )}
                <p className="text-[11px] text-zinc-500">
                  Any file format supported. Plaintext is processed locally in browser memory and never transmitted unencrypted.
                </p>
              </div>
            </div>

            {state.file && state.stage === "FILE_SELECTED" && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={prepareDocument}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 text-xs font-semibold shadow-md transition-colors"
                >
                  Prepare Document (Hash, Encrypt & Pin) →
                </button>
              </div>
            )}
          </div>

          {/* Step 2: Indeterminate Stage Progress */}
          {isPreparing && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 backdrop-blur-sm">
              <LoadingState
                message={
                  state.stage === "HASHING"
                    ? "Computing deterministic SHA-256 fingerprint..."
                    : state.stage === "ENCRYPTING"
                    ? "Generating 256-bit AES-GCM key and encrypting binary payload..."
                    : state.stage === "UPLOADING"
                    ? "Uploading encrypted ciphertext to Pinata IPFS gateway..."
                    : "Processing..."
                }
              />
            </div>
          )}

          {/* Step 3: Pre-Transaction Preview & Signing Card */}
          {state.stage === "READY_TO_SIGN" && (
            <div className="rounded-2xl border border-indigo-500/30 bg-zinc-900/40 p-6 md:p-8 backdrop-blur-sm space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-indigo-400 font-mono">
                    Step 2: Pre-Transaction Verification & Signing
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Review authentic cryptographic values before submitting the transaction to MetaMask.
                  </p>
                </div>
                <Badge variant="warning">Ready for Signature</Badge>
              </div>

              {/* Preview Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase">File Name</span>
                  <p className="text-zinc-200 truncate">{state.fileName}</p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase">Generated Document ID</span>
                  <p className="text-zinc-200 break-all">{state.documentId}</p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase">Original SHA-256 Digest</span>
                  <p className="text-zinc-300 break-all">{state.documentHash}</p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase">Authentic IPFS CID</span>
                  <p className="text-zinc-300 break-all">{state.ipfsCid}</p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase">Target Contract</span>
                  <p className="text-zinc-300">{formatAddress(config.contractDocumentRegistry)}</p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase">Signing Wallet</span>
                  <p className="text-zinc-300">{formatAddress(address || "")}</p>
                </div>
              </div>

              {/* Key Security Notice */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-300 font-mono flex items-center gap-1.5">
                    <span>🔐</span> Document Encryption Key
                  </span>
                  <button
                    onClick={downloadKeyBackup}
                    className="rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1 text-[11px] font-mono transition-colors"
                  >
                    Download Key Backup (.key)
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Your document was encrypted using a fresh 256-bit AES-GCM key. This key is never transmitted to IPFS, the blockchain, or backend servers. Download and store your key backup file safely; it is required to decrypt the document.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={reset}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 px-4 py-2 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>

                <button
                  onClick={submitRegistration}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
                >
                  <span>🦊</span> Sign & Register on Blockchain →
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Transaction & Confirmation Progress */}
          {isTransacting && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 md:p-8 backdrop-blur-sm space-y-4">
              <LoadingState
                message={
                  state.stage === "WALLET_CONFIRMING"
                    ? "Awaiting transaction signature in MetaMask..."
                    : state.stage === "TRANSACTION_SUBMITTED"
                    ? `Transaction submitted: ${state.txHash?.slice(0, 16)}...`
                    : state.stage === "CONFIRMING"
                    ? "Waiting for blockchain confirmation..."
                    : state.stage === "VERIFYING_CHAIN_STATE"
                    ? "Verifying on-chain state and testing IPFS payload decryption..."
                    : "Finalizing registration..."
                }
              />

              {state.txHash && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-xs font-mono text-center">
                  <span className="text-zinc-500">Transaction Hash: </span>
                  <span className="text-zinc-300 break-all">{state.txHash}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
