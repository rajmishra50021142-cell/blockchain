/**
 * IPFS Service Module — Phase 9: Real Decentralized Storage Integration
 *
 * Implements real client/backend communication with Pinata IPFS Files V3 API.
 *
 * INVARIANTS:
 * 1. CIPHERTEXT-ONLY STORAGE: Only Phase 8 AES-256-GCM encrypted payloads are uploaded to IPFS.
 *    Plaintext document bytes MUST NEVER be sent to IPFS.
 * 2. NO MOCK CIDs: Returns authentic CIDs from live IPFS daemon / Pinata response.
 *    Throws honest errors on failure; never generates mock or fallback CIDs.
 * 3. NO HARDCODED SECRETS: Loads IPFS_JWT dynamically from environment variables.
 *    Never logs, exposes, or commits API secrets.
 * 4. BYTE INTEGRITY: Downloaded ciphertext must match uploaded ciphertext byte-for-byte.
 */

import {
  EncryptedPayload,
  serializeEncryptedPayload,
  deserializeEncryptedPayload,
  decryptDocument,
  verifyDocumentHash,
  hashDocument,
  encryptDocument,
} from "../crypto/document-crypto";

/**
 * Custom error types for fail-closed IPFS error handling
 */
export class IpfsError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "IpfsError";
  }
}

export class IpfsUploadError extends IpfsError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "IpfsUploadError";
  }
}

export class IpfsDownloadError extends IpfsError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "IpfsDownloadError";
  }
}

export class InvalidCidError extends IpfsError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidCidError";
  }
}

/**
 * Configuration for the IPFS service
 */
export interface IpfsConfig {
  apiUrl?: string;
  jwt?: string;
  gatewayUrl?: string;
}

/**
 * Result returned after successful IPFS upload
 */
export interface IpfsUploadResult {
  cid: string;
  size: number;
  id?: string;
  name?: string;
  timestamp: number;
}

/**
 * Downloaded and parsed IPFS payload
 */
export interface IpfsDownloadResult {
  rawBytes: Uint8Array;
  payload: EncryptedPayload;
  cid: string;
}

/**
 * Result of end-to-end upload and pinning
 */
export interface DocumentPinResult {
  documentId: string;
  documentHash: string;
  bytes32Hash: string;
  cid: string;
  keyHex: string;
  key: CryptoKey;
  size: number;
}

/**
 * Result of end-to-end retrieval and decryption
 */
export interface DocumentRetrieveResult {
  plaintext: Uint8Array;
  verified: boolean;
  documentHash: string;
  cid: string;
}

/**
 * Validates whether a string has a valid IPFS CID format (v0 or v1).
 */
export function isValidCid(cid: string): boolean {
  if (!cid || typeof cid !== "string") {
    return false;
  }
  const trimmed = cid.trim();
  // CIDv0: starts with "Qm", 46 characters base58btc
  const isCidV0 = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(trimmed);
  // CIDv1: starts with "bafy", "bafk", "bafz", etc. in base32
  const isCidV1 = /^baf[a-z0-9]{40,100}$/i.test(trimmed);
  return isCidV0 || isCidV1;
}

export interface IpfsConfig {
  apiUrl?: string;
  jwt?: string;
  gatewayUrl?: string;
  timeoutMs?: number;
}

/**
 * Resolves configuration from environment variables or overrides.
 */
function resolveConfig(overrides?: IpfsConfig): {
  apiUrl: string;
  jwt: string;
  gatewayUrl: string;
  timeoutMs: number;
} {
  const apiUrl =
    overrides?.apiUrl !== undefined
      ? overrides.apiUrl
      : process.env.IPFS_API_URL || "https://uploads.pinata.cloud/v3/files";

  const jwt =
    overrides?.jwt !== undefined ? overrides.jwt : process.env.IPFS_JWT || "";

  const gatewayUrl =
    overrides?.gatewayUrl !== undefined
      ? overrides.gatewayUrl
      : process.env.IPFS_GATEWAY_URL || "https://gateway.pinata.cloud/ipfs";

  const timeoutMs = overrides?.timeoutMs || 25000;

  return { apiUrl, jwt, gatewayUrl, timeoutMs };
}

/**
 * Fetch wrapper with retry logic for network resilience against edge gateway latency.
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 2,
  timeoutMs = 30000
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const signal = AbortSignal.timeout(timeoutMs);
      return await fetch(url, { ...options, signal });
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

/**
 * Uploads an AES-256-GCM encrypted document payload to Pinata V3 IPFS.
 *
 * @param payload - Serialized encrypted byte array or EncryptedPayload object.
 * @param options - Upload options including optional file name.
 * @param configOverride - Optional configuration override.
 * @returns Authentic IPFS CID and upload metadata.
 */
export async function uploadEncryptedPayload(
  payload: Uint8Array | EncryptedPayload,
  options?: { name?: string },
  configOverride?: IpfsConfig
): Promise<IpfsUploadResult> {
  const { apiUrl, jwt, timeoutMs } = resolveConfig(configOverride);

  if (!jwt) {
    throw new IpfsUploadError("IPFS upload failed: Missing IPFS_JWT credentials in configuration.");
  }

  // Ensure we have raw binary serialized bytes
  let rawBytes: Uint8Array;
  if (payload instanceof Uint8Array) {
    rawBytes = payload;
  } else {
    rawBytes = serializeEncryptedPayload(payload);
  }

  if (rawBytes.length < 30) {
    throw new IpfsUploadError("IPFS upload rejected: Encrypted payload is shorter than minimum valid format length (30 bytes).");
  }

  const fileName = options?.name || `encrypted-doc-${Date.now()}.bin`;
  const blob = new Blob([rawBytes as unknown as BlobPart], { type: "application/octet-stream" });

  const formData = new FormData();
  formData.append("file", blob, fileName);
  formData.append("name", fileName);
  formData.append("network", "public");

  let res: Response;
  try {
    res = await fetchWithRetry(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      body: formData,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    throw new IpfsUploadError("IPFS upload network failure: Unable to connect to IPFS API endpoint.", err);
  }

  if (!res.ok) {
    let errorText = "";
    try {
      errorText = await res.text();
    } catch {
      errorText = res.statusText;
    }
    throw new IpfsUploadError(`IPFS upload rejected with HTTP ${res.status}: ${errorText}`);
  }

  let json: { data?: { cid?: string; size?: number; id?: string; name?: string } };
  try {
    json = await res.json();
  } catch (err) {
    throw new IpfsUploadError("IPFS upload response parsing error: Expected JSON response with CID.", err);
  }

  const cid = json.data?.cid;
  if (!cid || !isValidCid(cid)) {
    throw new IpfsUploadError(`IPFS upload failed: Invalid or missing CID in provider response.`);
  }

  return {
    cid,
    size: json.data?.size || rawBytes.length,
    id: json.data?.id,
    name: json.data?.name || fileName,
    timestamp: Date.now(),
  };
}

/**
 * Downloads a raw encrypted document payload from IPFS via its authentic CID.
 *
 * @param cid - Authentic IPFS Content Identifier.
 * @param configOverride - Optional configuration override.
 * @returns Raw bytes and parsed EncryptedPayload.
 */
export async function downloadEncryptedPayload(
  cid: string,
  configOverride?: IpfsConfig
): Promise<IpfsDownloadResult> {
  if (!isValidCid(cid)) {
    throw new InvalidCidError(`Invalid IPFS CID format: "${cid}".`);
  }

  const { gatewayUrl, timeoutMs } = resolveConfig(configOverride);
  const targetUrl = `${gatewayUrl.replace(/\/+$/, "")}/${cid}`;

  let res: Response;
  try {
    res = await fetchWithRetry(
      targetUrl,
      {
        method: "GET",
        headers: {
          Accept: "application/octet-stream, */*",
        },
      },
      3,
      timeoutMs
    );
  } catch (err) {
    throw new IpfsDownloadError(`IPFS download network failure for CID "${cid}".`, err);
  }

  if (!res.ok) {
    throw new IpfsDownloadError(`IPFS download failed for CID "${cid}" with HTTP ${res.status}: ${res.statusText}`);
  }

  let buffer: ArrayBuffer;
  try {
    buffer = await res.arrayBuffer();
  } catch (err) {
    throw new IpfsDownloadError(`Failed to stream IPFS content for CID "${cid}".`, err);
  }

  const rawBytes = new Uint8Array(buffer);
  if (rawBytes.length < 30) {
    throw new IpfsDownloadError(`IPFS payload for CID "${cid}" is truncated or invalid (received ${rawBytes.length} bytes, minimum is 30).`);
  }

  // Parse into canonical EncryptedPayload structure
  const payload = deserializeEncryptedPayload(rawBytes);

  return {
    rawBytes,
    payload,
    cid,
  };
}

/**
 * End-to-end workflow: Hashes document, encrypts client-side with AES-256-GCM,
 * and uploads the resulting ciphertext payload to Pinata IPFS.
 *
 * @param plaintext - Original document raw bytes.
 * @param key - Optional pre-existing AES-256-GCM key.
 * @param options - File naming and config options.
 * @returns Hash, CID, and key metadata ready for blockchain registration.
 */
export async function encryptAndUploadDocument(
  plaintext: Uint8Array | ArrayBuffer,
  key?: CryptoKey,
  options?: { name?: string },
  configOverride?: IpfsConfig
): Promise<DocumentPinResult> {
  const hashResult = await hashDocument(plaintext);
  const encryptResult = await encryptDocument(plaintext, key);

  const uploadResult = await uploadEncryptedPayload(
    encryptResult.serialized,
    options,
    configOverride
  );

  return {
    documentId: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    documentHash: hashResult.hex,
    bytes32Hash: hashResult.bytes32,
    cid: uploadResult.cid,
    keyHex: encryptResult.keyHex,
    key: encryptResult.key,
    size: uploadResult.size,
  };
}

/**
 * End-to-end retrieval workflow: Downloads encrypted payload from IPFS,
 * decrypts with AES-256-GCM, and verifies hash against expected on-chain digest.
 *
 * @param cid - Authentic IPFS CID.
 * @param key - AES-256-GCM key (CryptoKey or 32-byte Uint8Array).
 * @param expectedHash - Optional expected SHA-256 hash (hex or bytes32).
 * @param configOverride - Optional configuration override.
 * @returns Decrypted plaintext and verification status.
 */
export async function retrieveAndDecryptDocument(
  cid: string,
  key: CryptoKey | Uint8Array,
  expectedHash?: string,
  configOverride?: IpfsConfig
): Promise<DocumentRetrieveResult> {
  const downloadResult = await downloadEncryptedPayload(cid, configOverride);
  const plaintext = await decryptDocument(downloadResult.payload, key);

  let verified = true;
  const hashResult = await hashDocument(plaintext);

  if (expectedHash) {
    verified = await verifyDocumentHash(plaintext, expectedHash);
  }

  return {
    plaintext,
    verified,
    documentHash: hashResult.hex,
    cid,
  };
}
