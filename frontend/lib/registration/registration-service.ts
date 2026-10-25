/**
 * Phase 12: Registration Service & Helper Utilities
 *
 * Provides cryptographic generation, file processing, on-chain registration,
 * and post-write consistency validation without synthetic data.
 */

import { ethers } from "ethers";
import { config } from "../config/env";
import { hashDocument, encryptDocument, decryptDocument } from "../crypto/document-crypto";
import { apiClient } from "../api/client";
import { readDocumentFromChain, registerDocumentOnChain } from "../contracts/document-registry";
import { PostVerificationDetails } from "./types";

/**
 * Generates a cryptographically secure 256-bit (32-byte) document ID.
 * Employs CSPRNG (Web Crypto or ethers.randomBytes) providing 256 bits of entropy.
 */
export function generateSecureDocumentId(): string {
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    const bytes = new Uint8Array(32);
    window.crypto.getRandomValues(bytes);
    return "0x" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return ethers.hexlify(ethers.randomBytes(32));
}

/**
 * Reads binary bytes from a browser File object without altering binary encoding.
 */
export async function extractFileBytes(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Validates that the active network chain ID matches the application's required chain ID.
 */
export function validateNetwork(currentChainId: number | null): void {
  if (!currentChainId) {
    throw new Error("Unable to detect blockchain network. Please ensure your wallet is connected.");
  }
  if (currentChainId !== config.expectedChainId) {
    throw new Error(
      `Incorrect network detected: Chain ID ${currentChainId}. Please switch your wallet to network chain ID ${config.expectedChainId} (${config.contractNetwork}).`
    );
  }
}

/**
 * Validates that the connected wallet address matches the authenticated backend session identity.
 */
export function validateWalletSessionAlignment(
  walletAddress: string | null,
  authAddress: string | null
): void {
  if (!walletAddress) {
    throw new Error("Wallet not connected. Connect MetaMask to register documents.");
  }
  if (!authAddress) {
    throw new Error("Backend authentication missing. Sign in with your wallet before registering.");
  }
  if (walletAddress.toLowerCase() !== authAddress.toLowerCase()) {
    throw new Error(
      `Session mismatch: Connected wallet (${walletAddress}) does not match authenticated identity (${authAddress}). Please re-authenticate.`
    );
  }
}

/**
 * Executes post-registration on-chain and IPFS verification:
 * 1. Reads authoritative record from DocumentRegistry.sol
 * 2. Checks owner matches transaction signer
 * 3. Checks documentHash matches original SHA-256
 * 4. Checks ipfsCid matches uploaded CID
 * 5. Checks revoked is false
 * 6. Downloads encrypted payload from IPFS via backend
 * 7. Decrypts payload with local key and verifies recovered bytes equal original bytes
 */
export async function verifyPostRegistrationState(
  runner: ethers.ContractRunner,
  documentId: string,
  expectedOwner: string,
  expectedHash: string,
  expectedCid: string,
  originalBytes: Uint8Array,
  encryptionKeyBytes: Uint8Array
): Promise<PostVerificationDetails> {
  const startTime = Date.now();

  // 1. Read directly from DocumentRegistry smart contract
  const chainRecord = await readDocumentFromChain(runner, documentId);

  const chainOwnerMatch = chainRecord.owner.toLowerCase() === expectedOwner.toLowerCase();
  const hashMatch = chainRecord.documentHash.toLowerCase() === expectedHash.toLowerCase();
  const cidMatch = chainRecord.ipfsCid === expectedCid;
  const notRevoked = chainRecord.revoked === false;

  if (!chainOwnerMatch || !hashMatch || !cidMatch || !notRevoked) {
    throw new Error(
      `Post-registration chain consistency check failed: ` +
        `ownerMatch=${chainOwnerMatch}, hashMatch=${hashMatch}, cidMatch=${cidMatch}, notRevoked=${notRevoked}`
    );
  }

  // 2. Download encrypted payload from IPFS via backend relay
  const downloadedCiphertext = await apiClient.downloadIpfsPayload(expectedCid);

  // 3. Decrypt payload using the local ephemeral encryption key
  const recoveredPlaintext = await decryptDocument(downloadedCiphertext, encryptionKeyBytes);

  // 4. Assert exact byte-for-byte fidelity with original file bytes
  if (recoveredPlaintext.length !== originalBytes.length) {
    throw new Error(
      `Recovered document length mismatch: expected ${originalBytes.length} bytes, received ${recoveredPlaintext.length} bytes.`
    );
  }

  let recoveredBytesMatch = true;
  for (let i = 0; i < originalBytes.length; i++) {
    if (recoveredPlaintext[i] !== originalBytes[i]) {
      recoveredBytesMatch = false;
      break;
    }
  }

  if (!recoveredBytesMatch) {
    throw new Error("Cryptographic roundtrip failed: Decrypted bytes do not match original file bytes.");
  }

  const duration = Date.now() - startTime;

  return {
    chainOwnerMatch,
    hashMatch,
    cidMatch,
    notRevoked,
    recoveredBytesMatch,
    executionDurationMs: duration,
  };
}
