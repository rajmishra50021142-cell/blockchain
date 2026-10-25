/**
 * Phase 12: Document Registration Types & State Machine Definitions
 *
 * Enforces strict stage transitions without fake progress percentages.
 * Captures real cryptographic, IPFS, blockchain, and verification results.
 */

export type RegistrationStage =
  | "IDLE"
  | "FILE_SELECTED"
  | "HASHING"
  | "ENCRYPTING"
  | "UPLOADING"
  | "CID_READY"
  | "READY_TO_SIGN"
  | "WALLET_CONFIRMING"
  | "TRANSACTION_SUBMITTED"
  | "CONFIRMING"
  | "VERIFYING_CHAIN_STATE"
  | "REGISTERED"
  | "ERROR"
  | "CANCELLED";

export interface PostVerificationDetails {
  chainOwnerMatch: boolean;
  hashMatch: boolean;
  cidMatch: boolean;
  notRevoked: boolean;
  recoveredBytesMatch: boolean;
  executionDurationMs?: number;
}

export interface RegistrationState {
  stage: RegistrationStage;
  file: File | null;
  fileName: string | null;
  fileSizeBytes: number | null;
  documentHash: string | null; // 0x-prefixed 64-hex SHA-256 digest
  ipfsCid: string | null;
  documentId: string | null; // 0x-prefixed 64-hex bytes32 identifier
  txHash: string | null;
  blockNumber: number | null;
  gasUsed: string | null;
  registeredAt: number | null;
  owner: string | null;
  error: string | null;
  errorCode: string | null;
  postVerificationDetails: PostVerificationDetails | null;
  // Ephemeral key reference held in active memory during session solely for
  // the post-registration decryption integrity verification & optional local key file download.
  ephemeralKeyBytes: Uint8Array | null;
}

export interface RegistrationProvenance {
  documentId: string;
  owner: string;
  documentHash: string;
  ipfsCid: string;
  txHash: string;
  blockNumber: number;
  registeredAt: number;
  network: string;
  chainId: number;
  contractAddress: string;
}
