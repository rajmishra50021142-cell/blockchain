/**
 * Phase 14: Document Verification & Tamper Detection Types
 *
 * Strict non-synthetic data typing for candidate verification,
 * stored-object cryptographic auditing, provenance, and verification states.
 */

import { VerificationStatus, VerificationResult } from "../api/types";

export type { VerificationStatus, VerificationResult };

export type StoredObjectVerificationStatus =
  | "NOT_ATTEMPTED"
  | "SUCCESS"
  | "DECRYPTION_FAILED"
  | "IPFS_UNAVAILABLE"
  | "DECRYPTION_UNAVAILABLE";

export interface StoredObjectVerificationResult {
  attempted: boolean;
  status: StoredObjectVerificationStatus;
  recoveredPlaintextLength?: number;
  computedHash?: string;
  matchesOnChainHash?: boolean;
  durationMs?: number;
  error?: string;
}

export interface VerificationProvenance {
  documentId: string;
  candidateHash: string;
  onChainHash: string | null;
  owner: string | null;
  cid: string | null;
  chainId: number;
  network: string;
  isRevoked: boolean;
  isAuthorized: boolean;
  isOwner: boolean;
  timestamp: number | null;
  verificationDurationMs: number;
}

export type VerificationStage =
  | "IDLE"
  | "HASHING_CANDIDATE"
  | "VERIFYING_CANDIDATE"
  | "DECRYPTING_STORED"
  | "COMPLETE"
  | "ERROR";

export interface VerificationWorkflowState {
  stage: VerificationStage;
  documentId: string;
  candidateFile: File | null;
  candidateFileName: string | null;
  candidateFileSize: number | null;
  candidateHash: string | null;
  result: VerificationResult | null;
  storedObjectResult: StoredObjectVerificationResult | null;
  keyFileName: string | null;
  keyBytes: Uint8Array | null;
  error: string | null;
  errorCode: string | null;
}
