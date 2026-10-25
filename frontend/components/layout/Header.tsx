"use client";

import React from "react";
import Link from "next/link";
import { useWallet } from "../../lib/wallet/WalletContext";
import { useAuth } from "../../lib/auth/AuthContext";
import { formatAddress } from "../../lib/wallet/wallet-utils";
import { Badge } from "../ui/Badge";

export function Header() {
  const { state: walletState, address, chainId, expectedChainId, connect, disconnect } = useWallet();
  const { isAuthenticated, authState, login, logout } = useAuth();

  const isWrongNetwork = chainId !== null && chainId !== expectedChainId;

  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center font-bold text-white text-xs shadow-md shadow-indigo-500/20">
            DL
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-zinc-100 flex items-center gap-2">
              Digital Document Locker
              <span className="text-[10px] font-mono font-normal text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                v1.0
              </span>
            </h1>
            <p className="text-[10px] text-zinc-400 font-mono hidden sm:block">
              Decentralized • Zero-Trust • EVM Anchored
            </p>
          </div>
        </Link>

        {/* Status Indicators & Wallet Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Network Badge */}
          {walletState === "connected" && (
            <>
              {isWrongNetwork ? (
                <Badge variant="danger">Wrong Network ({chainId})</Badge>
              ) : (
                <Badge variant="success">Hardhat ({chainId})</Badge>
              )}
            </>
          )}

          {/* Authentication Badge */}
          {walletState === "connected" && (
            <>
              {isAuthenticated ? (
                <Badge variant="success">API Authenticated</Badge>
              ) : (
                <Badge variant="warning">
                  {authState === "waiting-signature"
                    ? "Sign in Wallet..."
                    : authState === "verifying"
                    ? "Verifying..."
                    : "Not Authenticated"}
                </Badge>
              )}
            </>
          )}

          {/* Wallet Actions */}
          {walletState === "connected" && address ? (
            <div className="flex items-center gap-2">
              {!isAuthenticated && (
                <button
                  onClick={login}
                  disabled={authState === "waiting-signature" || authState === "verifying"}
                  className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 shadow-sm"
                >
                  {authState === "waiting-signature"
                    ? "Confirming..."
                    : authState === "verifying"
                    ? "Verifying..."
                    : "Sign In"}
                </button>
              )}

              <div className="relative group">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs font-mono text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  {formatAddress(address)}
                </button>
                <div className="absolute right-0 mt-1 hidden group-hover:block w-48 rounded-xl border border-zinc-800 bg-zinc-950 p-2 shadow-xl z-50">
                  <div className="px-2 py-1.5 text-[10px] font-mono text-zinc-500 break-all border-b border-zinc-800/80 mb-1">
                    {address}
                  </div>
                  {isAuthenticated && (
                    <button
                      onClick={logout}
                      className="w-full text-left px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900 rounded-lg transition-colors"
                    >
                      Sign Out (API)
                    </button>
                  )}
                  <button
                    onClick={disconnect}
                    className="w-full text-left px-2 py-1.5 text-xs text-rose-300 hover:bg-rose-950/20 rounded-lg transition-colors"
                  >
                    Disconnect Wallet
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={walletState === "connecting"}
              className="rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {walletState === "connecting" ? "Connecting..." : "Connect Wallet"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
