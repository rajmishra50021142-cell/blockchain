"use client";

import React from "react";
import { useWallet } from "../../lib/wallet/WalletContext";
import { useAuth } from "../../lib/auth/AuthContext";
import { WalletConnect } from "./WalletConnect";
import { ProofOfOwnership } from "./ProofOfOwnership";
import { Badge } from "../ui/Badge";
import { ErrorState } from "../ui/ErrorState";

export function WalletView() {
  const { address, state: walletState } = useWallet();
  const {
    isAuthenticated,
    authState,
    authAddress,
    error: authError,
    login,
    logout,
    clearError,
  } = useAuth();

  return (
    <div className="space-y-8">
      <div className="border-b border-zinc-800/80 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
          Cryptographic Wallet & Identity
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Sovereign identity anchoring via MetaMask and backend session token issuance via EIP-191 challenge-response.
        </p>
      </div>

      {/* Module 1: Web3 Wallet Connection */}
      <section aria-labelledby="wallet-heading">
        <WalletConnect />
      </section>

      {/* Module 2: Backend API Authentication Panel */}
      <section aria-labelledby="auth-heading" className="space-y-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 md:p-8 backdrop-blur-md shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
            <div>
              <h2
                id="auth-heading"
                className="text-lg font-bold text-zinc-100 tracking-tight"
              >
                Backend API Authentication Session
              </h2>
              <p className="mt-1 text-xs text-zinc-400">
                Phase 10 Node.js/Express authentication using single-use CSPRNG nonces and wallet signatures.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <Badge variant="success">Active Session</Badge>
              ) : (
                <Badge variant="neutral">No Session</Badge>
              )}
            </div>
          </div>

          {authError && (
            <ErrorState
              title="Authentication Issue"
              message={authError}
              onDismiss={clearError}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-4 space-y-1">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                Session Status
              </div>
              <div className="text-sm font-semibold text-zinc-200">
                {authState === "authenticated"
                  ? "Authenticated (JWT Verified)"
                  : authState === "waiting-signature"
                  ? "Awaiting Wallet Signature..."
                  : authState === "verifying"
                  ? "Verifying Signature with API..."
                  : authState === "requesting-challenge"
                  ? "Requesting Challenge..."
                  : "Unauthenticated"}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-4 space-y-1">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                Authenticated Address
              </div>
              <div className="text-sm font-semibold text-zinc-200 break-all select-all">
                {authAddress || "None"}
              </div>
            </div>

            {isAuthenticated && (
              <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-4 space-y-1 md:col-span-2">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Session Security & Bearer Isolation</span>
                  <span className="text-[10px] text-emerald-400">HMAC-SHA256 • Active</span>
                </div>
                <div className="text-xs text-emerald-400/90 font-mono flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Session token safely isolated in sessionStorage (Bearer credentials shielded from visible view)
                </div>
                <p className="text-[11px] text-zinc-500 font-sans mt-2">
                  Single-use cryptographic challenge verified on backend. Token securely injected via Authorization header on all protected API endpoints.
                </p>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center gap-3">
            {walletState === "connected" && address ? (
              !isAuthenticated ? (
                <button
                  onClick={login}
                  disabled={authState === "waiting-signature" || authState === "verifying"}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 text-xs font-semibold shadow-md transition-colors disabled:opacity-50"
                >
                  {authState === "waiting-signature"
                    ? "Confirm in MetaMask..."
                    : authState === "verifying"
                    ? "Verifying..."
                    : "Sign In with Wallet (EIP-191)"}
                </button>
              ) : (
                <button
                  onClick={logout}
                  className="rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 text-xs font-medium transition-colors"
                >
                  Terminate API Session
                </button>
              )
            ) : (
              <p className="text-xs text-zinc-500">
                Connect your MetaMask wallet above to initiate authentication.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Module 3: Cryptographic Proof of Ownership (Phase 4 Foundation) */}
      <section aria-labelledby="ownership-heading">
        <ProofOfOwnership />
      </section>
    </div>
  );
}
