"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DocumentRecord } from "../../lib/api/types";
import { useWallet } from "../../lib/wallet/WalletContext";
import { useAuth } from "../../lib/auth/AuthContext";
import { useDocumentSharing } from "../../lib/sharing/useDocumentSharing";
import { validateVerifierAddress } from "../../lib/sharing/sharing-service";
import { formatAddress } from "../../lib/wallet/wallet-utils";
import { config } from "../../lib/config/env";
import { Badge } from "../ui/Badge";
import { LoadingState } from "../ui/LoadingState";

interface DocumentSharingViewProps {
  document: DocumentRecord;
  onRefresh?: () => void;
}

export function DocumentSharingView({
  document,
  onRefresh,
}: DocumentSharingViewProps) {
  const { address, chainId } = useWallet();
  const { isAuthenticated } = useAuth();
  const [verifierInput, setVerifierInput] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const {
    state,
    lastProvenance,
    verifiers,
    loadingVerifiers,
    activeVerifierCurrentAccess,
    inspectVerifierAccess,
    grantAccess,
    revokeAccess,
    resetState,
    loadVerifiers,
  } = useDocumentSharing({
    document,
    onPermissionChanged: onRefresh,
  });

  const isOwner =
    Boolean(address &&
    document.owner &&
    address.toLowerCase() === document.owner.toLowerCase());

  const isWrongNetwork =
    chainId !== null &&
    chainId !== config.expectedChainId;

  // Real-time input validation & on-chain state inspection
  useEffect(() => {
    if (!verifierInput.trim()) {
      setValidationError(null);
      return;
    }

    const validation = validateVerifierAddress(verifierInput, document.owner);
    if (!validation.valid) {
      setValidationError(validation.error || "Invalid verifier address");
    } else {
      setValidationError(null);
      inspectVerifierAccess(verifierInput);
    }
  }, [verifierInput, document.owner, inspectVerifierAccess]);

  const handleGrantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validationError && verifierInput.trim()) {
      grantAccess(verifierInput.trim());
    }
  };

  return (
    <div className="space-y-6">
      {/* Network Alert */}
      {isWrongNetwork && (
        <div className="rounded-xl border border-amber-800/80 bg-amber-950/40 p-4 text-xs text-amber-300">
          <div className="font-semibold text-amber-200">
            Network Mismatch Detected
          </div>
          <p className="mt-1">
            MetaMask is connected to Chain ID {chainId}. Please switch to Chain ID{" "}
            {config.expectedChainId} ({config.contractNetwork}) to submit access-control transactions.
          </p>
        </div>
      )}

      {/* Non-Owner Notice */}
      {!isOwner && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5 text-xs text-zinc-400 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="warning">Read-Only Mode</Badge>
            <span className="font-semibold text-zinc-300">
              Owner Authorization Required
            </span>
          </div>
          <p>
            Only the sovereign document owner ({formatAddress(document.owner)}) can grant or revoke
            on-chain verification access. Connected wallet ({formatAddress(address || "")}) does not hold ownership.
          </p>
        </div>
      )}

      {/* Document Revoked Notice */}
      {document.revoked && (
        <div className="rounded-xl border border-rose-800/80 bg-rose-950/40 p-4 text-xs text-rose-300">
          <div className="font-semibold text-rose-200 flex items-center gap-2">
            <Badge variant="danger">Document Revoked</Badge>
            <span>New Grants Disabled</span>
          </div>
          <p className="mt-1">
            This document has been permanently revoked on-chain in DocumentRegistry.sol. Under smart-contract
            invariants, AccessControl.sol strictly reverts any attempt to grant new access for a revoked document.
          </p>
        </div>
      )}

      {/* Section 1: Grant Access Form (Available to Owner only when document is not revoked) */}
      {isOwner && !document.revoked && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-sm shadow-xl space-y-6">
          <div className="border-b border-zinc-800/80 pb-4">
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <span>Grant On-Chain Verification Access</span>
              <span className="text-xs font-mono font-normal text-zinc-400">
                (AccessControl.grantAccess)
              </span>
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Authorize a verifier wallet address to query document verification APIs and inspect on-chain integrity.
            </p>
          </div>

          <form onSubmit={handleGrantSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="verifier-address"
                className="block text-xs font-medium text-zinc-300 uppercase tracking-wider font-mono mb-2"
              >
                Verifier Ethereum Address (0x...)
              </label>
              <div className="relative">
                <input
                  id="verifier-address"
                  type="text"
                  value={verifierInput}
                  onChange={(e) => setVerifierInput(e.target.value)}
                  placeholder="0x..."
                  disabled={state.stage !== "IDLE" && state.stage !== "ERROR" && state.stage !== "CANCELLED" && state.stage !== "COMPLETED"}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>

              {/* Validation Feedback */}
              {validationError && (
                <p className="mt-2 text-xs text-rose-400 font-sans">
                  {validationError}
                </p>
              )}

              {/* On-Chain Access Inspection Indicator */}
              {!validationError && verifierInput.trim() && activeVerifierCurrentAccess !== null && (
                <div className="mt-2 text-xs flex items-center gap-2">
                  <span className="text-zinc-500">Current On-Chain State:</span>
                  {activeVerifierCurrentAccess ? (
                    <Badge variant="success">Already Authorized</Badge>
                  ) : (
                    <Badge variant="neutral">Not Authorized</Badge>
                  )}
                </div>
              )}
            </div>

            {/* Pre-Transaction Summary Card */}
            {!validationError && verifierInput.trim() && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3 font-mono text-xs">
                <div className="text-[11px] uppercase tracking-wider text-zinc-500 font-sans font-semibold">
                  Pre-Transaction Preview
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-300">
                  <div>
                    <span className="text-zinc-500">Document ID: </span>
                    <span className="text-zinc-200">{formatAddress(document.id)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Owner: </span>
                    <span className="text-zinc-200">{formatAddress(document.owner)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Verifier: </span>
                    <span className="text-indigo-400 break-all">{verifierInput.trim()}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Network: </span>
                    <span className="text-zinc-200">
                      {config.contractNetwork} ({config.expectedChainId})
                    </span>
                  </div>
                </div>

                {/* Cryptographic Key Isolation Notice */}
                <div className="mt-3 rounded-lg border border-amber-900/60 bg-amber-950/20 p-3 text-[11px] font-sans text-amber-300/90 leading-relaxed">
                  <span className="font-semibold text-amber-200">Security Boundary Note: </span>
                  Granting on-chain verification permission authorizes this verifier to query on-chain document hashes
                  and verify candidate file equivalence. It does <strong className="text-amber-100">NOT</strong> transfer
                  or expose the document&apos;s symmetric AES-256 decryption key.
                </div>
              </div>
            )}

            {/* Action Buttons & Status Indicators */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <button
                type="submit"
                disabled={
                  Boolean(validationError) ||
                  !verifierInput.trim() ||
                  isWrongNetwork ||
                  (state.stage !== "IDLE" &&
                    state.stage !== "ERROR" &&
                    state.stage !== "CANCELLED" &&
                    state.stage !== "COMPLETED") ||
                  activeVerifierCurrentAccess === true
                }
                className="rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md transition-colors flex items-center justify-center gap-2"
              >
                {state.stage === "WALLET_CONFIRMING" ? (
                  <>
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Confirm in MetaMask...</span>
                  </>
                ) : state.stage === "CONFIRMING" ? (
                  <>
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Mining Transaction...</span>
                  </>
                ) : state.stage === "VERIFYING_POST_STATE" ? (
                  <>
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Verifying On-Chain State...</span>
                  </>
                ) : (
                  <span>Sign & Grant Access</span>
                )}
              </button>

              {state.stage !== "IDLE" && (
                <button
                  type="button"
                  onClick={resetState}
                  className="text-xs text-zinc-400 hover:text-zinc-200 underline font-mono"
                >
                  Clear Status
                </button>
              )}
            </div>
          </form>

          {/* Real-time Status Banners */}
          {state.stage === "TRANSACTION_SUBMITTED" && (
            <div className="rounded-xl border border-blue-800/80 bg-blue-950/40 p-4 text-xs text-blue-200 font-mono space-y-1">
              <div className="font-semibold text-blue-100 flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                <span>Transaction Submitted to Blockchain</span>
              </div>
              <div className="break-all text-[11px] text-blue-300">
                Tx Hash: {state.txHash}
              </div>
            </div>
          )}

          {state.stage === "ERROR" && (
            <div className="rounded-xl border border-rose-800/80 bg-rose-950/40 p-4 text-xs text-rose-300 space-y-1">
              <div className="font-semibold text-rose-200">
                Transaction Reverted / Failed
              </div>
              <p className="font-mono text-[11px] break-all">
                {state.errorMessage}
              </p>
            </div>
          )}

          {state.stage === "CANCELLED" && (
            <div className="rounded-xl border border-zinc-700 bg-zinc-800/40 p-4 text-xs text-zinc-300 space-y-1">
              <div className="font-semibold text-zinc-200">
                Transaction Cancelled
              </div>
              <p className="text-zinc-400">
                {state.errorMessage || "User rejected the transaction in MetaMask."}
              </p>
            </div>
          )}

          {state.stage === "COMPLETED" && lastProvenance && (
            <div className="rounded-xl border border-emerald-800/80 bg-emerald-950/30 p-5 text-xs text-emerald-200 space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-emerald-900/60 pb-2">
                <span className="font-bold text-emerald-100 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span>
                    {lastProvenance.action === "grant"
                      ? "Access Granted & Verified on Blockchain"
                      : "Access Revoked & Verified on Blockchain"}
                  </span>
                </span>
                <Badge variant="success">Confirmed</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-emerald-500">Verifier: </span>
                  <span className="text-emerald-100 break-all">{lastProvenance.verifier}</span>
                </div>
                <div>
                  <span className="text-emerald-500">Block Number: </span>
                  <span className="text-emerald-100">#{lastProvenance.blockNumber}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-emerald-500">Transaction Hash: </span>
                  <span className="text-emerald-100 break-all select-all font-mono">
                    {lastProvenance.transactionHash}
                  </span>
                </div>
                <div>
                  <span className="text-emerald-500">Post-Verification: </span>
                  <span className="text-emerald-200 font-semibold">
                    hasAccess == {lastProvenance.hasAccess ? "true" : "false"} (Verified)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Section 2: Known Verifiers & Access Registry Table */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-sm shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <span>Authorized Verifier Registry</span>
              <span className="text-xs font-mono font-normal text-zinc-400">
                ({verifiers.length} {verifiers.length === 1 ? "record" : "records"})
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Reconstructed directly from authoritative on-chain AccessGranted and AccessRevoked event logs.
            </p>
          </div>
          <button
            onClick={() => loadVerifiers()}
            className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors font-mono self-start sm:self-center"
          >
            Refresh Registry
          </button>
        </div>

        {loadingVerifiers ? (
          <div className="py-6 text-center text-xs text-zinc-500 font-mono">
            Querying on-chain audit event logs & access mapping...
          </div>
        ) : verifiers.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500 space-y-1">
            <p className="font-semibold text-zinc-400">No verifiers granted yet</p>
            <p>No AccessGranted events have been recorded for this document on-chain.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 pr-4">Verifier Address</th>
                  <th className="py-2.5 px-4">On-Chain Access</th>
                  <th className="py-2.5 px-4">Last Activity</th>
                  {isOwner && <th className="py-2.5 pl-4 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {verifiers.map((v) => (
                  <tr key={v.verifier} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="py-3 pr-4 text-zinc-200 select-all break-all">
                      {v.verifier}
                    </td>
                    <td className="py-3 px-4">
                      {v.hasAccess ? (
                        <Badge variant="success">Active Access</Badge>
                      ) : (
                        <Badge variant="danger">Revoked</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-zinc-400 font-sans text-[11px]">
                      {v.lastRevokedAt && (!v.lastGrantedAt || v.lastRevokedAt >= v.lastGrantedAt)
                        ? `Revoked on ${new Date(v.lastRevokedAt * 1000).toLocaleString()}`
                        : v.lastGrantedAt
                        ? `Granted on ${new Date(v.lastGrantedAt * 1000).toLocaleString()}`
                        : "—"}
                    </td>
                    {isOwner && (
                      <td className="py-3 pl-4 text-right">
                        {v.hasAccess ? (
                          <button
                            onClick={() => revokeAccess(v.verifier)}
                            disabled={
                              state.stage !== "IDLE" &&
                              state.stage !== "ERROR" &&
                              state.stage !== "CANCELLED" &&
                              state.stage !== "COMPLETED"
                            }
                            className="rounded-lg border border-rose-800/80 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 px-3 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50"
                          >
                            Revoke Access
                          </button>
                        ) : (
                          <span className="text-[11px] text-zinc-500 font-sans italic">
                            Revoked
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
