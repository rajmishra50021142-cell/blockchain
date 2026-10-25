"use client";

import React, { ReactNode } from "react";
import { WalletProvider } from "../../lib/wallet/WalletContext";
import { AuthProvider } from "../../lib/auth/AuthContext";
import { Header } from "./Header";
import { Navigation } from "./Navigation";
import { Footer } from "./Footer";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <WalletProvider>
      <AuthProvider>
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
          <Header />
          <Navigation />
          <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </WalletProvider>
  );
}
