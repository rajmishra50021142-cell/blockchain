"use client";

import React from "react";
import { Badge } from "./Badge";

export type TransactionState =
  | "idle"
  | "prompting"
  | "pending"
  | "confirmed"
  | "failed";

export interface TransactionInfo {
  state: TransactionState;
  hash?: string | null;
  blockNumber?: number | null;
  error?: string | null;
  description?: string;
}

interface TransactionStatusProps {
  transaction: TransactionInfo;
  onReset?: () => void;
}

export function TransactionStatus({
  transaction,
  onReset,
}: TransactionStatusProps) {
  const { state, hash, blockNumber, error, description } = transaction;

  if (state === "idle") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 backdrop-blur-sm space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {state === "prompting" && (
            <Badge variant="warning">Awaiting Wallet Signature</Badge>
          )}
          {state === "pending" && (
            <Badge variant="info">Transaction Pending</Badge>
          )}
          {state === "confirmed" && (
            <Badge variant="success">Transaction Confirmed</Badge>
          )}
          {state === "failed" && (
            <Badge variant="danger">Transaction Failed</Badge>
          )}
        </div>
        {onReset && (state === "confirmed" || state === "failed") && (
          <button
            onClick={onReset}
            className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {description && (
        <p className="text-xs text-zinc-300">{description}</p>
      )}

      {state === "prompting" && (
        <p className="text-xs text-zinc-400">
          Please confirm the transaction in MetaMask...
        </p>
      )}

      {hash && (
        <div className="rounded-lg bg-zinc-950 p-2.5 border border-zinc-800/80 font-mono text-xs space-y-1">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
            Transaction Hash
          </div>
          <div className="text-zinc-300 break-all select-all font-mono">
            {hash}
          </div>
          {blockNumber && (
            <div className="text-[11px] text-zinc-400 pt-1">
              Mined in Block #{blockNumber}
            </div>
          )}
        </div>
      )}

      {state === "failed" && error && (
        <div className="text-xs text-rose-300 bg-rose-950/20 border border-rose-900/40 p-2.5 rounded-lg break-all font-mono">
          {error}
        </div>
      )}
    </div>
  );
}
