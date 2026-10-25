/**
 * Phase 11: Frontend API Client Types
 *
 * Reflects authentic Phase 10 REST API responses with zero synthetic assumptions.
 */

export interface AuthChallenge {
  address: string;
  nonce: string;
  message: string;
  issuedAt: number;
  expiresAt: number;
  chainId: number;
}

export interface AuthChallengeResponse {
  challenge: string; // Canonical message string
  nonce: string;
  expiresAt: number;
}

export interface AuthVerifyResponse {
  token: string;
  address: string;
  expiresIn: string;
}

export interface DocumentRecord {
  id: string; // bytes32 hex
  owner: string; // 0x...
  cid: string; // IPFS CID
  fileHash: string; // bytes32 hex
  createdAt: number; // unix timestamp
  revoked: boolean;
  isOwner?: boolean;
  hasAccess?: boolean;
}

export interface DocumentsListResponse {
  documents: DocumentRecord[];
}

export interface DocumentDetailResponse extends DocumentRecord {
  isOwner: boolean;
  hasAccess: boolean;
}

export type VerificationStatus =
  | "VERIFIED"
  | "TAMPER_DETECTED"
  | "REVOKED"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "DOCUMENT_NOT_FOUND"
  | "INVALID_INPUT"
  | "DECRYPTION_UNAVAILABLE"
  | "DECRYPTION_FAILED"
  | "IPFS_UNAVAILABLE"
  | "BLOCKCHAIN_UNAVAILABLE"
  | "ERROR";

export interface VerificationResult {
  status: VerificationStatus;
  documentId: string;
  onChainHash?: string;
  candidateHash: string;
  match: boolean;
  revoked?: boolean;
  owner?: string;
  cid?: string;
  timestamp?: number;
  isOwner?: boolean;
  hasAccess?: boolean;
  verificationDurationMs?: number;
  executionLatencyMs?: number;
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

export interface AuditResponse {
  documentId: string;
  events?: NormalizedAuditEvent[];
  auditTrail?: NormalizedAuditEvent[];
  totalEvents?: number;
}

export interface IpfsUploadResponse {
  cid: string;
  size: number;
  pinnedAt?: number;
}

export interface IpfsDownloadResponse {
  cid: string;
  size: number;
  payloadBase64: string;
}

export interface HealthResponse {
  status: string;
  uptime: number;
  timestamp: number;
}

export interface ServiceHealth {
  status: string;
  latencyMs?: number;
  error?: string;
  [key: string]: unknown;
}

export interface ReadyResponse {
  status: string;
  blockchain?: {
    connected: boolean;
    chainId: number;
    blockNumber: number;
    expectedChainId: number;
  };
  ipfs?: {
    configured: boolean;
    apiUrl?: string;
  };
  services?: {
    rpc?: ServiceHealth;
    pinata?: ServiceHealth;
    [key: string]: ServiceHealth | undefined;
  };
  timestamp?: number;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    service?: string;
    timestamp: number;
    requestId?: string;
  };
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly service?: string;
  public readonly requestId?: string;

  constructor(status: number, code: string, message: string, service?: string, requestId?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.service = service;
    this.requestId = requestId;
  }
}
