"use client";

import React, { useState } from "react";
import { useWallet } from "@/lib/wallet/WalletContext";
import { formatAddress } from "@/lib/wallet/wallet-utils";
import { ErrorState } from "@/components/ui/ErrorState";

export function WalletConnect() {
  const {
    state,
    address,
    chainId,
    expectedChainId,
    balance,
    isMetaMask,
    error,
    connect,
    disconnect,
    switchNetwork,
    clearError,
  } = useWallet();

  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-md shadow-2xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Identity & State Badge */}
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-zinc-100 tracking-tight">
              Web3 Wallet Status
            </h2>
            {/* Status indicator pill */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                state === "connected"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : state === "connecting"
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                  : state === "wrong-network"
                  ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                  : state === "wallet-unavailable" || state === "error"
                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                  : "bg-zinc-800 text-zinc-400 border border-zinc-700/50"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  state === "connected"
                    ? "bg-emerald-400"
                    : state === "connecting"
                    ? "bg-amber-400"
                    : state === "wrong-network"
                    ? "bg-amber-300"
                    : state === "wallet-unavailable" || state === "error"
                    ? "bg-red-400"
                    : "bg-zinc-500"
                }`}
              />
              {state}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            {state === "connected"
              ? "Wallet connected via standard EIP-1193 injected provider."
              : state === "wrong-network"
              ? `Connected to chain ID ${chainId}, but expected chain ID ${expectedChainId}.`
              : state === "wallet-unavailable"
              ? "No injected Web3 provider detected in browser environment."
              : "Connect your Ethereum wallet to interact with the document locker."}
          </p>
        </div>

        {/* Right: Connect / Disconnect Buttons */}
        <div className="flex items-center gap-3">
          {state === "disconnected" && (
            <button
              onClick={connect}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:from-blue-500 hover:to-indigo-500 transition-all active:scale-[0.98]"
            >
              Connect MetaMask
            </button>
          )}

          {state === "connecting" && (
            <button
              disabled
              className="inline-flex items-center justify-center rounded-xl bg-zinc-800 px-5 py-2.5 text-sm font-semibold text-zinc-400 cursor-not-allowed"
            >
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-zinc-400"
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
              Connecting...
            </button>
          )}

          {state === "wrong-network" && (
            <button
              onClick={switchNetwork}
              className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-zinc-950 shadow-md hover:bg-amber-400 transition-all"
            >
              Switch to Chain {expectedChainId}
            </button>
          )}

          {state === "connected" && (
            <button
              onClick={disconnect}
              className="inline-flex items-center justify-center rounded-xl border border-zinc-700/60 bg-zinc-800/80 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-700/60 transition-colors"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>

      {/* Error state display */}
      {error && (
        <div className="mt-4">
          <ErrorState message={error} onDismiss={clearError} />
        </div>
      )}

      {/* Connected Details Grid */}
      {state === "connected" && address && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-zinc-800/80 pt-6">
          {/* Account Address Card */}
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-4">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Active Wallet Address
            </span>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-mono text-sm font-semibold text-zinc-200">
                {formatAddress(address)}
              </span>
              <button
                onClick={copyAddress}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                title={address}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="mt-1 font-mono text-[10px] text-zinc-500 break-all select-all">
              {address}
            </div>
          </div>

          {/* Balance Card */}
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-4">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Native Balance
            </span>
            <div className="mt-1 text-base font-bold text-zinc-100">
              {balance !== null ? `${balance} ETH` : "Unavailable"}
            </div>
            <span className="mt-1 inline-block text-[10px] text-zinc-500">
              Queried dynamically from provider
            </span>
          </div>

          {/* Network / Provider Info Card */}
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-4">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Network & Provider
            </span>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-200">
                Chain ID: {chainId}
              </span>
              <span className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-mono text-indigo-400 border border-indigo-500/20">
                {isMetaMask ? "MetaMask" : "Injected Web3"}
              </span>
            </div>
            <span className="mt-1 inline-block text-[10px] text-zinc-500">
              Expected Chain ID: {expectedChainId}
            </span>
          </div>
        </div>
      )}

      {/* Wallet Unavailable Banner */}
      {state === "wallet-unavailable" && (
        <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-950/10 p-4 text-xs text-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span>
            MetaMask extension was not detected. Please install a compatible
            injected Ethereum browser wallet to proceed.
          </span>
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-amber-500/20 px-3 py-1.5 font-semibold text-amber-300 hover:bg-amber-500/30 transition-colors"
          >
            Install MetaMask &rarr;
          </a>
        </div>
      )}
    </div>
  );
}
