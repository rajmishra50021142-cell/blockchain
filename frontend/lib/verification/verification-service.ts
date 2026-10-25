/**
 * Phase 14: Verification Service & Utilities
 *
 * Implements real candidate file byte processing, SHA-256 digest calculation,
 * stored-object AES-256-GCM verification, network validation, and truthful
 * evidence-based verdict formatting.
 *
 * ZERO SYNTHETIC DATA: Operates strictly on real binary bytes and on-chain records.
 */

import { config } from "../config/env";
import {
  hashDocument,
  decryptDocument,
  AuthenticationError,
  MalformedPayloadError,
  HashResult,
} from "../crypto/document-crypto";
import {
  VerificationStatus,
  StoredObjectVerificationResult,
} from "./types";

/**
 * Extracts raw binary bytes from a browser File without altering binary encoding.
 */
export async function extractFileBytes(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Computes deterministic SHA-256 digest from candidate document bytes.
 * Reuses Phase 8 Web Crypto implementation.
 */
export async function computeCandidateHash(bytes: Uint8Array): Promise<HashResult> {
  return hashDocument(bytes);
}

/**
 * Validates and normalizes raw 256-bit AES-GCM key input.
 * Accepts 32-byte binary (from .key backup file) or 64-character hex string.
 */
export function parseKeyBytes(input: Uint8Array | string): Uint8Array {
  if (input instanceof Uint8Array) {
    if (input.length !== 32) {
      throw new Error(
        `Invalid key length: expected 32 bytes (256 bits), received ${input.length} bytes.`
      );
    }
    return input;
  }

  const cleanHex = input.trim().replace(/^0x/i, "");
  if (cleanHex.length !== 64) {
    throw new Error(
      `Invalid key format: expected 64 hex characters (32 bytes), received ${cleanHex.length} characters.`
    );
  }

  if (!/^[0-9a-fA-F]{64}$/.test(cleanHex)) {
    throw new Error("Invalid key format: key contains non-hexadecimal characters.");
  }

  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Validates that the active network chain ID matches the required application chain ID.
 */
export function validateNetwork(currentChainId: number | null): void {
  if (!currentChainId) {
    throw new Error("Unable to detect blockchain network. Please connect your Web3 wallet.");
  }
  if (currentChainId !== config.expectedChainId) {
    throw new Error(
      `Incorrect network: Connected to Chain ID ${currentChainId}. Please switch to network ${config.expectedChainId} (${config.contractNetwork}).`
    );
  }
}

/**
 * Executes stored-object cryptographic verification where a legitimate AES key exists:
 * 1. Downloads ciphertext from IPFS via backend relay
 * 2. Decrypts using AES-256-GCM with caller-provided key
 * 3. Hashes recovered plaintext with SHA-256
 * 4. Compares with authoritative on-chain document hash
 */
export async function verifyStoredObjectCiphertext(
  cid: string,
  keyBytes: Uint8Array,
  expectedOnChainHash: string,
  downloadPayloadFn: (cid: string) => Promise<Uint8Array>
): Promise<StoredObjectVerificationResult> {
  const startTime = Date.now();

  try {
    // 1. Download authentic ciphertext from IPFS
    const ciphertext = await downloadPayloadFn(cid);

    // 2. Decrypt using provided key
    const recoveredPlaintext = await decryptDocument(ciphertext, keyBytes);

    // 3. Compute SHA-256 of decrypted plaintext
    const hashRes = await hashDocument(recoveredPlaintext);
    const computedHash = hashRes.bytes32;

    const normalizedExpected = expectedOnChainHash.toLowerCase();
    const normalizedComputed = computedHash.toLowerCase();
    const matchesOnChainHash = normalizedComputed === normalizedExpected;

    return {
      attempted: true,
      status: "SUCCESS",
      recoveredPlaintextLength: recoveredPlaintext.length,
      computedHash,
      matchesOnChainHash,
      durationMs: Date.now() - startTime,
    };
  } catch (err: unknown) {
    const duration = Date.now() - startTime;
    if (err instanceof AuthenticationError || err instanceof MalformedPayloadError) {
      return {
        attempted: true,
        status: "DECRYPTION_FAILED",
        durationMs: duration,
        error:
          "AES-256-GCM authentication failed: The provided key is incorrect or the ciphertext was altered.",
      };
    }

    const message = err instanceof Error ? err.message : "Failed to retrieve IPFS payload.";
    return {
      attempted: true,
      status: "IPFS_UNAVAILABLE",
      durationMs: duration,
      error: message,
    };
  }
}

/**
 * Formats truthful, evidence-based verdict descriptions adhering strictly to Section 21
 * (False-Certification Rule: no '100% authentic', 'fraud-proof', 'guaranteed genuine').
 */
export function formatVerificationVerdict(status: VerificationStatus): {
  title: string;
  description: string;
  variant: "success" | "danger" | "warning" | "info";
} {
  switch (status) {
    case "VERIFIED":
      return {
        title: "Cryptographic Verification Succeeded",
        description:
          "The candidate document SHA-256 digest matches the on-chain hash recorded in DocumentRegistry. The document is active and not revoked.",
        variant: "success",
      };
    case "TAMPER_DETECTED":
      return {
        title: "Tamper Detected: Hash Mismatch",
        description:
          "The candidate document SHA-256 digest differs from the hash recorded on-chain in DocumentRegistry.",
        variant: "danger",
      };
    case "REVOKED":
      return {
        title: "Document Revoked on Blockchain",
        description:
          "The document hash was found on-chain, but the document has been revoked by its registered owner and is no longer valid.",
        variant: "warning",
      };
    case "UNAUTHORIZED":
      return {
        title: "Access Denied",
        description:
          "Your connected wallet does not possess on-chain permission in AccessControl.sol to verify this document.",
        variant: "danger",
      };
    case "DOCUMENT_NOT_FOUND":
    case "NOT_FOUND":
      return {
        title: "Document Not Found",
        description:
          "The requested document ID is not registered in the DocumentRegistry smart contract.",
        variant: "warning",
      };
    case "DECRYPTION_FAILED":
      return {
        title: "Stored-Object Decryption Failed",
        description:
          "AES-256-GCM authentication tag verification failed. The provided key does not match or the IPFS ciphertext has been altered.",
        variant: "danger",
      };
    case "DECRYPTION_UNAVAILABLE":
      return {
        title: "Decryption Key Unavailable",
        description:
          "On-chain access permission does not include the raw AES encryption key. Decryption requires the document owner's key backup.",
        variant: "info",
      };
    case "IPFS_UNAVAILABLE":
      return {
        title: "IPFS Gateway Unavailable",
        description:
          "Unable to retrieve the encrypted document payload from the decentralized storage gateway.",
        variant: "danger",
      };
    case "BLOCKCHAIN_UNAVAILABLE":
      return {
        title: "Blockchain Unavailable",
        description:
          "Unable to query DocumentRegistry or AccessControl on the configured Ethereum provider.",
        variant: "danger",
      };
    case "INVALID_INPUT":
      return {
        title: "Invalid Input Parameters",
        description:
          "The provided Document ID or candidate hash format is invalid (expected 32-byte hex).",
        variant: "danger",
      };
    default:
      return {
        title: "Verification Error",
        description: "An unexpected error occurred while executing the verification request.",
        variant: "danger",
      };
  }
}
