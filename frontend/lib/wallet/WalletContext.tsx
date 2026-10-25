"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { ethers } from "ethers";
import { WalletState, WalletContextType, SignatureProof } from "./types";
import {
  getExpectedChainId,
  generateOwnershipChallenge,
  verifyOwnershipSignature,
  getInjectedMetaMaskProvider,
  formatWalletError,
} from "./wallet-utils";

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>("initializing");
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isMetaMask, setIsMetaMask] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [signatureProof, setSignatureProof] = useState<SignatureProof | null>(
    null
  );
  const [isSigning, setIsSigning] = useState<boolean>(false);

  const expectedChainId = getExpectedChainId();
  const addressRef = useRef<string | null>(address);
  useEffect(() => {
    addressRef.current = address;
  }, [address]);

  // Helper to retrieve balance from live provider
  const fetchBalance = useCallback(
    async (accountAddress: string, provider: ethers.BrowserProvider) => {
      try {
        const balWei = await provider.getBalance(accountAddress);
        setBalance(ethers.formatEther(balWei));
      } catch (err: any) {
        const formatted = formatWalletError(err);
        console.error(
          `Failed to fetch balance [code: ${formatted.code}]: ${formatted.message}`,
          formatted
        );
        setBalance(null);
      }
    },
    []
  );

  // Initialize wallet state on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const ethereum = getInjectedMetaMaskProvider();

    if (!ethereum) {
      setState("wallet-unavailable");
      return;
    }

    setIsMetaMask(Boolean(ethereum.isMetaMask));

    const checkExistingConnection = async () => {
      try {
        const accounts = await ethereum.request({ method: "eth_accounts" });

        if (accounts && accounts.length > 0) {
          const currentAccount = accounts[0];
          setAddress(currentAccount);

          const chainIdHex = await ethereum
            .request({ method: "eth_chainId" })
            .catch(() => null);
          const provider = new ethers.BrowserProvider(ethereum, "any");
          const currentChainId = chainIdHex
            ? parseInt(chainIdHex, 16)
            : Number((await provider.getNetwork()).chainId);
          setChainId(currentChainId);

          await fetchBalance(currentAccount, provider);

          if (currentChainId !== expectedChainId) {
            setState("wrong-network");
          } else {
            setState("connected");
          }
        } else {
          setState("disconnected");
        }
      } catch (err: any) {
        const formatted = formatWalletError(err);
        console.error(
          `Wallet initialization error [code: ${formatted.code}]: ${formatted.message}`,
          formatted
        );
        setError(formatted.message || "Failed to initialize wallet provider.");
        setState("error");
      }
    };

    checkExistingConnection();

    // Event handler for account changes
    const handleAccountsChanged = async (accounts: string[]) => {
      setSignatureProof(null);

      if (!accounts || accounts.length === 0) {
        setAddress(null);
        setBalance(null);
        setState("disconnected");
        return;
      }

      const newAccount = accounts[0];
      setAddress(newAccount);

      try {
        const provider = new ethers.BrowserProvider(ethereum, "any");
        await fetchBalance(newAccount, provider);

        const chainIdHex = await ethereum
          .request({ method: "eth_chainId" })
          .catch(() => null);
        const currentChainId = chainIdHex
          ? parseInt(chainIdHex, 16)
          : Number((await provider.getNetwork()).chainId);
        setChainId(currentChainId);

        if (currentChainId !== expectedChainId) {
          setState("wrong-network");
        } else {
          setState("connected");
        }
      } catch (err: any) {
        const formatted = formatWalletError(err);
        console.error(
          `Error updating account [code: ${formatted.code}]: ${formatted.message}`,
          formatted
        );
      }
    };

    // Event handler for network changes
    const handleChainChanged = (chainIdHex: string) => {
      const newChainId = parseInt(chainIdHex, 16);
      setChainId(newChainId);

      if (newChainId !== expectedChainId) {
        setState("wrong-network");
      } else if (addressRef.current) {
        setState("connected");
        const provider = new ethers.BrowserProvider(ethereum, "any");
        fetchBalance(addressRef.current, provider);
      }
    };

    if (ethereum.on) {
      ethereum.on("accountsChanged", handleAccountsChanged);
      ethereum.on("chainChanged", handleChainChanged);
    }

    return () => {
      if (ethereum.removeListener) {
        ethereum.removeListener("accountsChanged", handleAccountsChanged);
        ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [expectedChainId, fetchBalance]);

  // Connect wallet action
  const connect = async () => {
    setError(null);
    const ethereum = getInjectedMetaMaskProvider();

    if (!ethereum) {
      setState("wallet-unavailable");
      setError(
        "MetaMask or compatible Web3 provider not found. Please install or enable MetaMask."
      );
      return;
    }

    try {
      setState("connecting");

      // 1. Check if an account is already authorized on this site
      let accounts: string[] = [];
      try {
        accounts = await ethereum.request({ method: "eth_accounts" });
      } catch (checkErr) {
        // Proceed to explicit request
      }

      // 2. If no accounts authorized yet, request authorization via eth_requestAccounts
      if (!accounts || accounts.length === 0) {
        try {
          accounts = await ethereum.request({
            method: "eth_requestAccounts",
          });
        } catch (reqErr: any) {
          // If request is already pending in MetaMask (code -32002)
          if (reqErr?.code === -32002) {
            // Attempt a fresh read in case the user approved it in MetaMask popup
            const retry = await ethereum
              .request({ method: "eth_accounts" })
              .catch(() => []);
            if (retry && retry.length > 0) {
              accounts = retry;
            } else {
              throw reqErr;
            }
          } else {
            throw reqErr;
          }
        }
      }

      if (!accounts || accounts.length === 0) {
        setState("disconnected");
        setError("No accounts were authorized by MetaMask.");
        return;
      }

      const connectedAccount = accounts[0];
      setAddress(connectedAccount);

      // Read current network chainId
      let currentChainId: number | null = null;
      try {
        const chainIdHex = await ethereum.request({ method: "eth_chainId" });
        if (chainIdHex) {
          currentChainId = parseInt(chainIdHex, 16);
        }
      } catch (chainErr) {
        // Fallback to BrowserProvider
      }

      const provider = new ethers.BrowserProvider(ethereum, "any");
      if (currentChainId === null) {
        const network = await provider.getNetwork();
        currentChainId = Number(network.chainId);
      }
      setChainId(currentChainId);

      await fetchBalance(connectedAccount, provider);

      if (currentChainId !== expectedChainId) {
        setState("wrong-network");
      } else {
        setState("connected");
      }
    } catch (err: any) {
      const formatted = formatWalletError(err);
      console.error(
        `Connection failed [code: ${formatted.code}]: ${formatted.message}`,
        formatted
      );

      if (formatted.code === 4001 || formatted.code === "ACTION_REJECTED") {
        setError("Connection request rejected by user in MetaMask.");
      } else if (formatted.code === -32002) {
        setError(
          "Connection request already pending in MetaMask. Please open your MetaMask extension popup to approve the connection."
        );
      } else {
        setError(formatted.message || "Failed to connect wallet.");
      }
      setState("disconnected");
    }
  };

  // Disconnect / Reset action
  const disconnect = () => {
    setAddress(null);
    setBalance(null);
    setSignatureProof(null);
    setError(null);
    setState("disconnected");
  };

  // Sign ownership challenge action
  const signOwnershipChallenge = async () => {
    if (!address || !chainId) {
      setError("Cannot sign challenge: wallet not connected.");
      return;
    }

    const ethereum = getInjectedMetaMaskProvider();
    if (!ethereum) {
      setState("wallet-unavailable");
      return;
    }

    try {
      setIsSigning(true);
      setError(null);

      const challenge = generateOwnershipChallenge(address, chainId);
      const provider = new ethers.BrowserProvider(ethereum, "any");
      const signer = await provider.getSigner();

      // Request EIP-191 personal sign in MetaMask
      const signature = await signer.signMessage(challenge.message);

      // Perform real cryptographic verification of signature
      const verification = verifyOwnershipSignature(
        challenge.message,
        signature,
        address
      );

      if (!verification.verified) {
        throw new Error(
          verification.error ||
            "Cryptographic signature verification failed: recovered address does not match."
        );
      }

      setSignatureProof({
        message: challenge.message,
        signature,
        recoveredAddress: verification.recoveredAddress,
        verified: true,
        timestamp: challenge.timestamp,
        nonce: challenge.nonce,
      });
    } catch (err: any) {
      const formatted = formatWalletError(err);
      console.error(
        `Signing failed [code: ${formatted.code}]: ${formatted.message}`,
        formatted
      );
      if (formatted.code === 4001 || formatted.code === "ACTION_REJECTED") {
        setError(
          "Signature request was rejected by user. No proof of wallet ownership was created."
        );
      } else {
        setError(formatted.message || "Cryptographic signing failed.");
      }
      setSignatureProof(null);
    } finally {
      setIsSigning(false);
    }
  };

  // Switch network action
  const switchNetwork = async () => {
    const ethereum = getInjectedMetaMaskProvider();
    if (!ethereum) return;

    const hexChainId = `0x${expectedChainId.toString(16)}`;

    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hexChainId }],
      });
    } catch (switchError: any) {
      const formatted = formatWalletError(switchError);
      console.error(
        `Switch network error [code: ${formatted.code}]: ${formatted.message}`,
        formatted
      );

      if (switchError.code === 4902) {
        try {
          if (expectedChainId === 31337) {
            await ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: hexChainId,
                  chainName: "Hardhat Local Network",
                  nativeCurrency: {
                    name: "Ethereum",
                    symbol: "ETH",
                    decimals: 18,
                  },
                  rpcUrls: ["http://127.0.0.1:8545"],
                },
              ],
            });
          } else if (expectedChainId === 11155111) {
            await ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: hexChainId,
                  chainName: "Sepolia Test Network",
                  nativeCurrency: {
                    name: "Sepolia Ether",
                    symbol: "SEP",
                    decimals: 18,
                  },
                  rpcUrls: ["https://rpc.sepolia.org"],
                  blockExplorerUrls: ["https://sepolia.etherscan.io"],
                },
              ],
            });
          }
        } catch (addError: any) {
          const addFormatted = formatWalletError(addError);
          setError(
            addFormatted.message || "Failed to add network to MetaMask."
          );
        }
      } else if (switchError.code === 4001) {
        setError("Network switch request was rejected in MetaMask.");
      } else {
        setError(formatted.message || "Failed to switch network.");
      }
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <WalletContext.Provider
      value={{
        state,
        address,
        chainId,
        expectedChainId,
        balance,
        isMetaMask,
        error,
        signatureProof,
        isSigning,
        connect,
        disconnect,
        signOwnershipChallenge,
        switchNetwork,
        clearError,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
