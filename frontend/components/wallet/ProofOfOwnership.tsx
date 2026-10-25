"use client";

import React from "react";
import { useWallet } from "@/lib/wallet/WalletContext";
import { EmptyState } from "@/components/ui/EmptyState";

export function ProofOfOwnership() {
  const {
    state,
    address,
    signatureProof,
    isSigning,
    signOwnershipChallenge,
  } = useWallet();

  if (state !== "connected" || !address) {
    return (
      <EmptyState
        title="Wallet Not Connected"
        description="Connect your MetaMask wallet above to perform cryptographic proof-of-ownership verification."
      />
    );
  }

  return (
    <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-md shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-zinc-100 tracking-tight">
              Cryptographic Proof of Ownership
            </h3>
            {signatureProof?.verified && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                VERIFIED (EIP-191)
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Sign a runtime challenge message in MetaMask to prove control over
            your Ethereum wallet address without gas fees.
          </p>
        </div>

        <div>
          <button
            onClick={signOwnershipChallenge}
            disabled={isSigning}
            className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-xs font-semibold shadow-md transition-all ${
              isSigning
                ? "bg-zinc-800 text-zinc-400 cursor-not-allowed"
                : signatureProof?.verified
                ? "border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                : "bg-indigo-600 text-white hover:bg-indigo-500 active:scale-[0.98]"
            }`}
          >
            {isSigning ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-zinc-400"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Confirm in MetaMask...
              </>
            ) : signatureProof?.verified ? (
              "Re-verify Ownership"
            ) : (
              "Prove Wallet Ownership"
            )}
          </button>
        </div>
      </div>

      {/* Signature Proof Inspection Details */}
      {signatureProof && signatureProof.verified ? (
        <div className="mt-6 space-y-4 border-t border-zinc-800/80 pt-6">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Cryptographic Proof Verification Success
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                {signatureProof.timestamp}
              </span>
            </div>
            <p className="mt-1 text-xs text-emerald-300/80">
              ECDSA signature was verified using{" "}
              <code className="text-emerald-300 font-mono">
                ethers.verifyMessage
              </code>
              . The recovered public signer matches the active wallet address.
            </p>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg bg-zinc-950/60 p-2.5 border border-zinc-800/60">
                <span className="text-[10px] text-zinc-500 block uppercase font-mono">
                  Connected Wallet
                </span>
                <span className="font-mono text-zinc-200 text-xs break-all">
                  {address}
                </span>
              </div>
              <div className="rounded-lg bg-zinc-950/60 p-2.5 border border-zinc-800/60">
                <span className="text-[10px] text-zinc-500 block uppercase font-mono">
                  Recovered Signer
                </span>
                <span className="font-mono text-emerald-400 text-xs break-all">
                  {signatureProof.recoveredAddress}
                </span>
              </div>
            </div>
          </div>

          {/* Signed Message Payload */}
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider font-mono">
                Signed Message (EIP-191 Payload)
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                Nonce: {signatureProof.nonce.slice(0, 8)}...
              </span>
            </div>
            <pre className="font-mono text-[11px] text-zinc-300 bg-zinc-900/90 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap leading-relaxed border border-zinc-800">
              {signatureProof.message}
            </pre>
          </div>

          {/* Raw ECDSA Signature */}
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/50 p-4">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider font-mono block mb-2">
              Raw ECDSA Signature (r, s, v - 65 bytes)
            </span>
            <div className="font-mono text-[11px] text-indigo-300 bg-zinc-900/90 p-3 rounded-lg break-all border border-zinc-800 select-all">
              {signatureProof.signature}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-zinc-800/60 bg-zinc-950/30 p-6 text-center">
          <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
            No proof of ownership has been generated for the active account yet.
            Click <strong className="text-zinc-200">Prove Wallet Ownership</strong>{" "}
            to initiate an authentic signature challenge in MetaMask.
          </p>
        </div>
      )}
    </div>
  );
}
