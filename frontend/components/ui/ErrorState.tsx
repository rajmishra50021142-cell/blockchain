"use client";

import React from "react";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorState({
  title = "Error Encountered",
  message,
  onRetry,
  onDismiss,
}: ErrorStateProps) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-5 text-red-200 backdrop-blur-sm shadow-lg shadow-red-950/30">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/20 text-red-400 font-bold">
          !
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold tracking-wide uppercase text-red-300">
            {title}
          </h4>
          <p className="mt-1 text-sm text-red-200/90 leading-relaxed font-mono break-all">
            {message}
          </p>
          {(onRetry || onDismiss) && (
            <div className="mt-4 flex items-center gap-3">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="rounded-lg bg-red-500/20 px-3.5 py-1.5 text-xs font-medium text-red-200 hover:bg-red-500/30 transition-colors"
                >
                  Retry Action
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="rounded-lg border border-red-500/20 px-3.5 py-1.5 text-xs font-medium text-red-300/80 hover:bg-red-500/10 transition-colors"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
