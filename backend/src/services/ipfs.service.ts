/**
 * Phase 10: Real IPFS Service Integration
 *
 * Consumes the Phase 9 decentralized storage implementation:
 * - Validates client-side ciphertext-only format (rejects plaintext uploads)
 * - Relays to Pinata IPFS Files V3 API using secure server-side JWT
 * - Retrieves authentic binary ciphertext payloads via IPFS gateway
 * - Zero mock CIDs, zero synthetic fallbacks
 */

import {
  uploadEncryptedPayload,
  downloadEncryptedPayload,
  isValidCid,
  IpfsUploadResult,
  IpfsDownloadResult,
  IpfsUploadError,
  IpfsDownloadError,
  InvalidCidError,
} from "../../../frontend/lib/ipfs";
import { config } from "../config/env";
import { AppError } from "../middleware/error-handler";

class IpfsService {
  /**
   * Uploads an authenticated client-side encrypted document payload to IPFS.
   * Rejects unencrypted plaintext (must be valid Phase 8 canonical serialization).
   */
  public async uploadPayload(
    rawBytes: Uint8Array,
    fileName?: string
  ): Promise<IpfsUploadResult> {
    if (!config.ipfsJwt) {
      throw new AppError(
        "IPFS service is not configured (missing IPFS_JWT credentials).",
        502,
        "IPFS_CREDENTIALS_MISSING",
        "IPFS"
      );
    }

    // Phase 8 validation: minimum 30 bytes [version (1) + ivLen (1) + iv (12) + tag (16)]
    if (rawBytes.length < 30) {
      throw new AppError(
        "Rejected upload: payload is too short to be an encrypted document payload (minimum 30 bytes).",
        400,
        "INVALID_PAYLOAD_FORMAT",
        "IPFS"
      );
    }

    // Version validation (Protocol version 1)
    if (rawBytes[0] !== 1) {
      throw new AppError(
        `Rejected upload: unsupported payload protocol version (${rawBytes[0]}). Expected Version 1.`,
        400,
        "UNSUPPORTED_VERSION",
        "IPFS"
      );
    }

    // IV length validation (AES-GCM standard 12 bytes)
    if (rawBytes[1] !== 12) {
      throw new AppError(
        `Rejected upload: invalid IV length (${rawBytes[1]}). Expected 12 bytes for AES-256-GCM.`,
        400,
        "INVALID_IV_LENGTH",
        "IPFS"
      );
    }

    try {
      const result = await uploadEncryptedPayload(
        rawBytes,
        {
          name: fileName || `locker-record-${Date.now()}.bin`,
        },
        {
          apiUrl: config.ipfsApiUrl,
          jwt: config.ipfsJwt,
        }
      );

      return result;
    } catch (err: unknown) {
      if (err instanceof IpfsUploadError) {
        throw new AppError(err.message, 502, "IPFS_UPLOAD_FAILED", "IPFS");
      }
      throw new AppError("Failed to upload encrypted payload to IPFS.", 502, "IPFS_PROVIDER_ERROR", "IPFS");
    }
  }

  /**
   * Retrieves an authentic encrypted payload from IPFS via its CID.
   */
  public async downloadPayload(cid: string): Promise<IpfsDownloadResult> {
    if (!isValidCid(cid)) {
      throw new AppError(`Invalid IPFS CID format: "${cid}".`, 400, "INVALID_CID", "IPFS");
    }

    try {
      const result = await downloadEncryptedPayload(cid, {
        gatewayUrl: config.ipfsGateway,
        jwt: config.ipfsJwt,
        timeoutMs: 25000,
      });

      return result;
    } catch (err: unknown) {
      if (err instanceof InvalidCidError) {
        throw new AppError(err.message, 400, "INVALID_CID", "IPFS");
      }
      if (err instanceof IpfsDownloadError) {
        throw new AppError(err.message, 502, "IPFS_GATEWAY_TIMEOUT", "IPFS");
      }
      throw new AppError(`Failed to retrieve IPFS content for CID "${cid}".`, 502, "IPFS_DOWNLOAD_FAILED", "IPFS");
    }
  }

  public validateCid(cid: string): boolean {
    return isValidCid(cid);
  }
}

export const ipfsService = new IpfsService();
