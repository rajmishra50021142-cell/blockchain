/**
 * Phase 10: Request Validation Helpers
 *
 * Strict validation routines ensuring zero malformed, unvalidated,
 * or spoofed parameters enter backend services.
 */

import { ethers } from "ethers";
import { AppError } from "./error-handler";

export function validateEthereumAddress(address: string, fieldName = "address"): string {
  if (!address || typeof address !== "string") {
    throw new AppError(`Missing or invalid ${fieldName}. Expected Ethereum address string.`, 400, "INVALID_ADDRESS");
  }
  const trimmed = address.trim();
  if (!ethers.isAddress(trimmed)) {
    throw new AppError(`Invalid Ethereum address format for ${fieldName}: "${address}".`, 400, "INVALID_ADDRESS");
  }
  return trimmed.toLowerCase();
}

export function validateBytes32(hexStr: string, fieldName = "documentId"): string {
  if (!hexStr || typeof hexStr !== "string") {
    throw new AppError(`Missing or invalid ${fieldName}. Expected bytes32 hex string.`, 400, "INVALID_BYTES32");
  }
  const trimmed = hexStr.trim();
  if (!/^0x[0-9a-fA-F]{64}$/.test(trimmed)) {
    throw new AppError(`Invalid bytes32 format for ${fieldName}: must be 0x-prefixed 64-hex string.`, 400, "INVALID_BYTES32");
  }
  return trimmed.toLowerCase();
}

export function validateSha256Hex(hash: string, fieldName = "candidateHash"): string {
  if (!hash || typeof hash !== "string") {
    throw new AppError(`Missing or invalid ${fieldName}. Expected SHA-256 hash string.`, 400, "INVALID_HASH");
  }
  const trimmed = hash.trim();
  // Support both 64-char plain hex and 0x-prefixed 66-char hex
  if (/^0x[0-9a-fA-F]{64}$/.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return `0x${trimmed.toLowerCase()}`;
  }
  throw new AppError(`Invalid SHA-256 hash format for ${fieldName}: must be 64 hex characters.`, 400, "INVALID_HASH");
}

export function validateSignature(signature: string): string {
  if (!signature || typeof signature !== "string") {
    throw new AppError("Missing signature in request body.", 400, "INVALID_SIGNATURE");
  }
  const trimmed = signature.trim();
  if (!/^0x[0-9a-fA-F]{130}$/.test(trimmed)) {
    throw new AppError("Invalid ECDSA signature format. Expected 65-byte 0x-prefixed hex string.", 400, "INVALID_SIGNATURE");
  }
  return trimmed;
}
