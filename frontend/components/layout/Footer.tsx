"use client";

import React from "react";
import Link from "next/link";
import { config } from "../../lib/config/env";
import { formatAddress } from "../../lib/wallet/wallet-utils";

export function Footer() {
  return (
    <footer className="border-t border-zinc-800/60 bg-zinc-950 py-6 text-xs text-zinc-500 font-mono">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
          <span>Digital Document Locker</span>
          <span className="hidden sm:inline">•</span>
          <span className="text-[11px] text-zinc-400">
            Chain ID: {config.expectedChainId}
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="text-[11px] text-zinc-400" title={config.contractDocumentRegistry}>
            DocRegistry: {formatAddress(config.contractDocumentRegistry)}
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <Link
            href="/settings"
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            System Readiness & Contracts
          </Link>
          <span>•</span>
          <span className="text-zinc-500">Non-Synthetic Policy (ai_rules.md)</span>
        </div>
      </div>
    </footer>
  );
}
