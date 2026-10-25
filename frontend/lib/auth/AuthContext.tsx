"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { ethers } from "ethers";
import { useWallet } from "../wallet/WalletContext";
import { getInjectedMetaMaskProvider, formatWalletError } from "../wallet/wallet-utils";
import { apiClient } from "../api/client";
import { ApiError } from "../api/types";
import { AuthState, AuthContextType } from "./types";

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_PREFIX = "dl_auth_jwt_";

export function AuthProvider({ children }: { children: ReactNode }) {
  const { address, state: walletState } = useWallet();
  const [authState, setAuthState] = useState<AuthState>("idle");
  const [token, setToken] = useState<string | null>(null);
  const [authAddress, setAuthAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync token with centralized API client
  useEffect(() => {
    apiClient.setAuthToken(token);
  }, [token]);

  // Synchronize authentication with wallet lifecycle & enforce strict account isolation
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!address || walletState !== "connected") {
      // Wallet is not connected: clear active session
      setToken(null);
      setAuthAddress(null);
      setAuthState("idle");
      return;
    }

    const normalizedAddress = address.toLowerCase();

    // If current authenticated address does not match active connected wallet: purge immediately
    if (authAddress && authAddress.toLowerCase() !== normalizedAddress) {
      setToken(null);
      setAuthAddress(null);
      setAuthState("idle");
      sessionStorage.removeItem(`${STORAGE_PREFIX}${authAddress.toLowerCase()}`);
    }

    // Check for existing session token for this connected address
    const savedToken = sessionStorage.getItem(`${STORAGE_PREFIX}${normalizedAddress}`);
    if (savedToken) {
      try {
        // Quick verification of JWT expiration without third-party library
        const parts = savedToken.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const nowSec = Math.floor(Date.now() / 1000);
          if (payload.exp && payload.exp > nowSec && payload.sub?.toLowerCase() === normalizedAddress) {
            setToken(savedToken);
            setAuthAddress(normalizedAddress);
            setAuthState("authenticated");
            return;
          }
        }
        // Token was invalid or expired
        sessionStorage.removeItem(`${STORAGE_PREFIX}${normalizedAddress}`);
      } catch {
        sessionStorage.removeItem(`${STORAGE_PREFIX}${normalizedAddress}`);
      }
    }

    // No valid saved token
    if (!token) {
      setAuthState("idle");
    }
  }, [address, walletState, authAddress, token]);

  const clearError = useCallback(() => setError(null), []);

  const logout = useCallback(() => {
    if (typeof window !== "undefined" && authAddress) {
      sessionStorage.removeItem(`${STORAGE_PREFIX}${authAddress.toLowerCase()}`);
    }
    setToken(null);
    setAuthAddress(null);
    setAuthState("idle");
    setError(null);
    apiClient.setAuthToken(null);
  }, [authAddress]);

  const login = useCallback(async () => {
    setError(null);

    if (!address || walletState !== "connected") {
      setError("Please connect your Web3 wallet first.");
      setAuthState("error");
      return;
    }

    const ethereum = getInjectedMetaMaskProvider();
    if (!ethereum) {
      setError("MetaMask or compatible Ethereum wallet provider not detected.");
      setAuthState("error");
      return;
    }

    const normalizedAddress = address.toLowerCase();

    try {
      // 1. Request cryptographic challenge nonce from backend
      setAuthState("requesting-challenge");
      const challengeResponse = await apiClient.getChallenge(address);
      const messageToSign =
        typeof challengeResponse.challenge === "string"
          ? challengeResponse.challenge
          : (challengeResponse as any).challenge?.message || challengeResponse.challenge;

      if (!messageToSign) {
        throw new Error("Invalid challenge payload received from authentication gateway.");
      }

      // 2. Request EIP-191 personal signature from connected MetaMask wallet
      setAuthState("waiting-signature");
      const provider = new ethers.BrowserProvider(ethereum, "any");
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(messageToSign);

      // 3. Verify signature cryptographically with backend and receive JWT session
      setAuthState("verifying");
      const verifyResponse = await apiClient.verifySignature(address, signature);

      if (!verifyResponse || !verifyResponse.token) {
        throw new Error("Authentication gateway did not return a valid session token.");
      }

      // 4. Save session token
      const sessionToken = verifyResponse.token;
      setToken(sessionToken);
      setAuthAddress(normalizedAddress);
      setAuthState("authenticated");

      if (typeof window !== "undefined") {
        sessionStorage.setItem(`${STORAGE_PREFIX}${normalizedAddress}`, sessionToken);
      }
    } catch (err: unknown) {
      const formatted = formatWalletError(err);
      console.error(`Authentication flow error [${formatted.code}]: ${formatted.message}`, formatted);
      let userMsg = "Authentication failed. Please try again.";

      if (err instanceof ApiError) {
        userMsg = err.message;
      } else if (formatted.code === 4001 || formatted.code === "ACTION_REJECTED") {
        userMsg = "Signature request was rejected in your wallet.";
      } else if (formatted.code === -32002) {
        userMsg = "Signature request already pending in MetaMask. Please open your MetaMask popup to sign.";
      } else if (formatted.message) {
        userMsg = formatted.message;
      }

      setError(userMsg);
      setAuthState("error");
    }
  }, [address, walletState]);

  const isAuthenticated = authState === "authenticated" && Boolean(token);

  return (
    <AuthContext.Provider
      value={{
        authState,
        isAuthenticated,
        token,
        authAddress,
        error,
        login,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
