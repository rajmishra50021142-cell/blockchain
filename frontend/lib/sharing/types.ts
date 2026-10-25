/**
 * Phase 13: Document Sharing & Access Revocation Types
 *
 * Defines the state machine, transaction provenance, and permission records
 * for on-chain AccessControl operations.
 */

export type SharingAction = "grant" | "revoke";

export type SharingStage =
  | "IDLE"
  | "VALIDATING_INPUT"
  | "CHECKING_ONCHAIN_STATE"
  | "READY_TO_SIGN"
  | "WALLET_CONFIRMING"
  | "TRANSACTION_SUBMITTED"
  | "CONFIRMING"
  | "VERIFYING_POST_STATE"
  | "COMPLETED"
  | "ERROR"
  | "CANCELLED";

export interface VerifierPermissionRecord {
  verifier: string;
  hasAccess: boolean;
  isDirectGranted: boolean;
  lastGrantedAt?: number;
  lastRevokedAt?: number;
  grantTxHash?: string;
  revokeTxHash?: string;
}

export interface SharingState {
  stage: SharingStage;
  action: SharingAction | null;
  verifierAddress: string;
  txHash: string | null;
  blockNumber: number | null;
  errorMessage: string | null;
  postVerifiedAccess: boolean | null;
}

export interface ShareProvenance {
  action: SharingAction;
  documentId: string;
  owner: string;
  verifier: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
  hasAccess: boolean;
  network: string;
}

export interface SharingValidationResult {
  valid: boolean;
  normalizedAddress?: string;
  error?: string;
}
