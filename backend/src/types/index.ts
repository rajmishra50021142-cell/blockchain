/**
 * Phase 10: Backend API Layer Core Types
 *
 * Strict non-synthetic data typing for wallet authentication,
 * blockchain state representations, IPFS operations, verification, and audit event logs.
 */

export interface AuthenticatedUser {
  address: string; // Lowercase checksummed or 0x address
  chainId: number;
}

export interface AuthChallenge {
  address: string;
  nonce: string;
  message: string;
  issuedAt: number;
  expiresAt: number;
  chainId: number;
}

export interface JwtClaims {
  sub: string; // Wallet address
  chainId: number;
  iat: number;
  exp: number;
  jti: string;
}

export interface DocumentRecord {
  id: string; // bytes32 hex (0x...)
  owner: string; // 0x...
  cid: string; // authentic IPFS CID
  fileHash: string; // bytes32 hex (0x...)
  createdAt: number; // Unix timestamp in seconds
  revoked: boolean;
  isOwner?: boolean;
  hasAccess?: boolean;
}

export type VerificationStatus =
  | "VERIFIED"
  | "TAMPER_DETECTED"
  | "HASH_MISMATCH"
  | "REVOKED"
  | "UNAUTHORIZED"
  | "NOT_FOUND";

export interface VerificationResult {
  status: VerificationStatus;
  documentId: string;
  onChainHash?: string;
  candidateHash: string;
  match: boolean;
  revoked?: boolean;
  timestamp?: number;
  owner?: string;
  cid?: string;
  verificationDurationMs: number;
}

export interface NormalizedAuditEvent {
  eventName: "DocumentRegistered" | "DocumentRevoked" | "AccessGranted" | "AccessRevoked";
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
  actor: string;
  timestamp: number;
  contractAddress: string;
  details: Record<string, unknown>;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    service?: string;
    timestamp: number;
  };
}
