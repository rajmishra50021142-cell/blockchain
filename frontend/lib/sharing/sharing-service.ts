/**
 * Phase 13: Document Sharing & Access Revocation Service
 *
 * Core domain service enforcing:
 * 1. Strict Ethereum address validation (rejecting empty, malformed, and zero addresses).
 * 2. Non-custodial owner authorization guardrails.
 * 3. Document revocation invariants (revoked documents cannot receive new grants).
 * 4. Post-transaction on-chain state verification.
 * 5. Deterministic verifier reconstruction from on-chain audit events.
 *
 * CRITICAL RULE: Zero synthetic or fabricated permission records.
 */

import { ethers } from "ethers";
import { config } from "../config/env";
import {
  checkHasAccessOnChain,
  checkDirectAccessGrantedOnChain,
} from "../contracts/access-control";
import {
  SharingValidationResult,
  VerifierPermissionRecord,
} from "./types";
import { NormalizedAuditEvent } from "../api/types";

/**
 * Validates a verifier's Ethereum wallet address.
 * Rejects empty strings, malformed strings, and the zero address.
 */
export function validateVerifierAddress(
  address: string,
  ownerAddress?: string
): SharingValidationResult {
  if (!address || typeof address !== "string") {
    return { valid: false, error: "Verifier address is required." };
  }

  const trimmed = address.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: "Verifier address cannot be empty." };
  }

  if (!ethers.isAddress(trimmed)) {
    return {
      valid: false,
      error: `Invalid Ethereum address format: "${trimmed}". Expected 20-byte hexadecimal address (0x...).`,
    };
  }

  const normalized = trimmed.toLowerCase();

  // Reject zero address
  if (normalized === ethers.ZeroAddress.toLowerCase()) {
    return {
      valid: false,
      error: "Zero address (0x0000...0000) cannot be authorized as a verifier.",
    };
  }

  // Reject self-granting by document owner
  if (ownerAddress && normalized === ownerAddress.toLowerCase()) {
    return {
      valid: false,
      error: "Document owner already holds sovereign access. You cannot grant access to yourself.",
    };
  }

  return {
    valid: true,
    normalizedAddress: normalized,
  };
}

/**
 * Validates that the connected wallet holds sovereign document ownership.
 * Fails closed if wallet is not connected or does not match document owner.
 */
export function validateOwnerAuthority(
  connectedWallet: string | null,
  documentOwner: string
): void {
  if (!connectedWallet) {
    throw new Error("Wallet not connected. Connect the document owner wallet to proceed.");
  }

  if (connectedWallet.toLowerCase() !== documentOwner.toLowerCase()) {
    throw new Error(
      `Unauthorized: Connected wallet (${connectedWallet}) is not the document owner (${documentOwner}). Only the owner can manage access permissions.`
    );
  }
}

/**
 * Validates that the document is active and has not been revoked on-chain.
 * Revoked documents cannot receive new active access grants.
 */
export function validateDocumentActiveForGrant(isRevoked: boolean): void {
  if (isRevoked) {
    throw new Error(
      "Cannot grant access: This document has been revoked on-chain in DocumentRegistry.sol."
    );
  }
}

/**
 * Validates that the active network matches the expected chain ID.
 */
export function validateNetwork(
  currentChainId: number | null,
  expectedChainId: number = config.expectedChainId
): void {
  if (currentChainId === null || currentChainId === undefined) {
    throw new Error("Blockchain network not detected. Please connect MetaMask.");
  }

  if (currentChainId !== expectedChainId) {
    throw new Error(
      `Wrong network: Connected to chain ID ${currentChainId}, expected chain ID ${expectedChainId} (${config.contractNetwork}).`
    );
  }
}

/**
 * Post-grant on-chain state verification.
 * Reads AccessControl.hasAccess(documentId, verifier) directly from chain
 * and asserts that it has transitioned to true.
 */
export async function verifyPostGrantState(
  runner: ethers.ContractRunner,
  documentId: string,
  verifier: string,
  contractAddress: string = config.contractAccessControl
): Promise<boolean> {
  const hasAccess = await checkHasAccessOnChain(
    runner,
    documentId,
    verifier,
    contractAddress
  );

  if (!hasAccess) {
    throw new Error(
      `Post-grant consistency mismatch: Transaction confirmed, but on-chain AccessControl.hasAccess("${documentId}", "${verifier}") returned false.`
    );
  }

  return true;
}

/**
 * Post-revoke on-chain state verification.
 * Reads AccessControl.hasAccess(documentId, verifier) directly from chain
 * and asserts that it has transitioned to false.
 */
export async function verifyPostRevokeState(
  runner: ethers.ContractRunner,
  documentId: string,
  verifier: string,
  contractAddress: string = config.contractAccessControl
): Promise<boolean> {
  const hasAccess = await checkHasAccessOnChain(
    runner,
    documentId,
    verifier,
    contractAddress
  );

  if (hasAccess) {
    throw new Error(
      `Post-revoke consistency mismatch: Transaction confirmed, but on-chain AccessControl.hasAccess("${documentId}", "${verifier}") returned true.`
    );
  }

  return false;
}

/**
 * Reconstructs the complete list of known verifiers and queries their authoritative
 * on-chain access states directly from the contract.
 *
 * Verifiers are discovered from real on-chain AccessGranted / AccessRevoked event logs.
 */
export async function reconstructVerifiersWithLiveState(
  runner: ethers.ContractRunner,
  documentId: string,
  auditEvents: NormalizedAuditEvent[],
  contractAddress: string = config.contractAccessControl
): Promise<VerifierPermissionRecord[]> {
  const verifierMap = new Map<string, {
    lastGrantedAt?: number;
    lastRevokedAt?: number;
    grantTxHash?: string;
    revokeTxHash?: string;
    mostRecentTime: number;
  }>();

  for (const event of auditEvents) {
    const rawVerifier = event.details?.verifier;
    const verifier = typeof rawVerifier === "string" ? rawVerifier.toLowerCase() : undefined;
    if (!verifier || !ethers.isAddress(verifier)) continue;

    const existing = verifierMap.get(verifier) || { mostRecentTime: 0 };

    if (event.eventName === "AccessGranted") {
      existing.lastGrantedAt = event.timestamp;
      existing.grantTxHash = event.transactionHash;
      if (event.timestamp > existing.mostRecentTime) {
        existing.mostRecentTime = event.timestamp;
      }
    } else if (event.eventName === "AccessRevoked") {
      existing.lastRevokedAt = event.timestamp;
      existing.revokeTxHash = event.transactionHash;
      if (event.timestamp > existing.mostRecentTime) {
        existing.mostRecentTime = event.timestamp;
      }
    }

    verifierMap.set(verifier, existing);
  }

  const records: VerifierPermissionRecord[] = [];

  for (const [verifier, meta] of verifierMap.entries()) {
    try {
      const [hasAccess, isDirectGranted] = await Promise.all([
        checkHasAccessOnChain(runner, documentId, verifier, contractAddress),
        checkDirectAccessGrantedOnChain(runner, documentId, verifier, contractAddress),
      ]);

      records.push({
        verifier,
        hasAccess,
        isDirectGranted,
        lastGrantedAt: meta.lastGrantedAt,
        lastRevokedAt: meta.lastRevokedAt,
        grantTxHash: meta.grantTxHash,
        revokeTxHash: meta.revokeTxHash,
      });
    } catch {
      // If individual read fails, skip rather than fabricate
    }
  }

  // Sort by active access first, then by last granted timestamp desc
  return records.sort((a, b) => {
    if (a.hasAccess && !b.hasAccess) return -1;
    if (!a.hasAccess && b.hasAccess) return 1;
    return (b.lastGrantedAt || 0) - (a.lastGrantedAt || 0);
  });
}
