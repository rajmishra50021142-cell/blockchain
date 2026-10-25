"use client";

import React from "react";

interface LoadingStateProps {
  message?: string;
  detail?: string;
}

export function LoadingState({
  message = "Loading...",
  detail,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/30 p-10 text-center backdrop-blur-sm"
    >
      <div className="relative flex h-10 w-10 items-center justify-center mb-4">
        <div className="absolute h-10 w-10 rounded-full border-2 border-indigo-500/20" />
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-transparent border-t-indigo-500" />
      </div>
      <p className="text-sm font-medium text-zinc-200">{message}</p>
      {detail && (
        <p className="mt-1 text-xs text-zinc-500 font-mono">{detail}</p>
      )}
      <span className="sr-only">Loading</span>
    </div>
  );
}
