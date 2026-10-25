import { ethers } from "ethers";

/**
 * Retrieves the expected Chain ID from environment configuration.
 * Defaults to 31337 (local Hardhat development node).
 */
export function getExpectedChainId(): number {
  if (process.env.NEXT_PUBLIC_CHAIN_ID) {
    const parsed = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID, 10);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  return 31337;
}

/**
 * Formats a 42-character Ethereum address for display (e.g., 0x1234...5678).
 */
export function formatAddress(address: string | null): string {
  if (!address || address.length < 10) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Generates a human-readable proof-of-ownership challenge with a cryptographically
 * random runtime nonce and timestamp.
 */
export function generateOwnershipChallenge(
  address: string,
  chainId: number
): { message: string; nonce: string; timestamp: string } {
  // Generate cryptographically random nonce
  const nonce =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : ethers.hexlify(ethers.randomBytes(16));

  const timestamp = new Date().toISOString();

  const message = [
    "Digital Document Locker — Proof of Wallet Ownership",
    "",
    `Wallet Address: ${address}`,
    `Chain ID: ${chainId}`,
    `Nonce: ${nonce}`,
    `Timestamp: ${timestamp}`,
    "",
    "Signing this message verifies control of your wallet address. This action incurs zero gas fees.",
  ].join("\n");

  return { message, nonce, timestamp };
}

/**
 * Cryptographically verifies an EIP-191 personal signature using ethers.js.
 * Recovers the public signing address and compares it to the expected address.
 */
export function verifyOwnershipSignature(
  message: string,
  signature: string,
  expectedAddress: string
): { verified: boolean; recoveredAddress: string; error?: string } {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    const verified =
      recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();

    return {
      verified,
      recoveredAddress,
      error: verified
        ? undefined
        : `Recovered address (${recoveredAddress}) does not match expected address (${expectedAddress})`,
    };
  } catch (err: any) {
    return {
      verified: false,
      recoveredAddress: "",
      error: err.message || "Failed to cryptographically verify signature.",
    };
  }
}

/**
 * Resolves the authentic MetaMask EIP-1193 provider.
 * Supports multi-provider environments (EIP-5749 / EIP-6963 / window.ethereum.providers)
 * by prioritizing pure MetaMask over third-party extensions that spoof `isMetaMask`.
 */
export function getInjectedMetaMaskProvider(): any {
  if (typeof window === "undefined") return null;

  const anyWindow = window as any;
  const ethereum = anyWindow.ethereum;

  if (!ethereum) return null;

  // Handle multi-provider arrays (e.g., MetaMask + Phantom + Coinbase installed concurrently)
  if (Array.isArray(ethereum.providers) && ethereum.providers.length > 0) {
    // 1. Look for authentic MetaMask (excluding third-party wallets that spoof isMetaMask)
    const authenticMetaMask = ethereum.providers.find(
      (p: any) =>
        Boolean(p.isMetaMask) &&
        !p.isPhantom &&
        !p.isCoinbaseWallet &&
        !p.isBraveWallet &&
        !p.isRabby &&
        !p.isTrust
    );
    if (authenticMetaMask) return authenticMetaMask;

    // 2. Fall back to any provider with isMetaMask flag
    const anyMetaMask = ethereum.providers.find((p: any) => Boolean(p.isMetaMask));
    if (anyMetaMask) return anyMetaMask;

    // 3. Fall back to first available provider
    return ethereum.providers[0];
  }

  return ethereum;
}

/**
 * Normalizes an unknown wallet / RPC error into an object with visible properties,
 * avoiding the JavaScript `{}` serialization trap of Error prototypes in console logs.
 */
export function formatWalletError(err: any): {
  code: number | string;
  message: string;
  name: string;
  data?: any;
} {
  const code = err?.code ?? err?.error?.code ?? "UNKNOWN";
  const name = err?.name || "ProviderRpcError";
  const message =
    err?.message ||
    err?.error?.message ||
    (typeof err === "string" ? err : "Unknown provider error");
  const data = err?.data ?? err?.error?.data;

  return { code, message, name, data };
}

