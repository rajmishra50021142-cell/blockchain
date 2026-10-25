"use client";

import React, { ReactNode } from "react";

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, string> = {
    default: "bg-zinc-800/80 text-zinc-300 border-zinc-700/60",
    success: "bg-emerald-950/60 text-emerald-300 border-emerald-800/60",
    warning: "bg-amber-950/60 text-amber-300 border-amber-800/60",
    danger: "bg-rose-950/60 text-rose-300 border-rose-800/60",
    info: "bg-blue-950/60 text-blue-300 border-blue-800/60",
    neutral: "bg-zinc-900/60 text-zinc-400 border-zinc-800/60",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-mono font-medium tracking-tight ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
