/**
 * Phase 10: Document Verification Service
 *
 * Implements deterministic verification logic:
 * - Compares candidate SHA-256 digest against authoritative on-chain document hash
 * - Verifies caller authorization against DocumentRegistry and AccessControl
 * - Checks document revocation status
 * - Measures real runtime verification latency
 */

import { blockchainService } from "./blockchain.service";
import { VerificationResult } from "../types";
import { AppError } from "../middleware/error-handler";

class VerificationService {
  /**
   * Verifies a candidate document hash against on-chain state.
   */
  public async verifyDocument(
    documentId: string,
    candidateHash: string,
    callerAddress: string
  ): Promise<VerificationResult> {
    const startTime = performance.now();
    const normalizedDocId = documentId.toLowerCase();
    const normalizedCandidateHash = candidateHash.startsWith("0x")
      ? candidateHash.toLowerCase()
      : `0x${candidateHash.toLowerCase()}`;
    const normalizedCaller = callerAddress.toLowerCase();

    // 1. Check document existence and retrieve on-chain metadata
    let doc;
    try {
      doc = await blockchainService.getDocument(normalizedDocId);
    } catch (err: unknown) {
      if (err instanceof AppError && err.code === "DOCUMENT_NOT_FOUND") {
        const duration = Math.round(performance.now() - startTime);
        return {
          status: "NOT_FOUND",
          documentId: normalizedDocId,
          candidateHash: normalizedCandidateHash,
          match: false,
          verificationDurationMs: duration,
        };
      }
      throw err;
    }

    const duration = Math.round(performance.now() - startTime);

    // 2. Check authorization: caller must be owner or granted verifier
    const isOwner = doc.owner === normalizedCaller;
    let isAuthorized = isOwner;

    if (!isAuthorized) {
      isAuthorized = doc.revoked
        ? await blockchainService.isDirectAccessGranted(normalizedDocId, normalizedCaller)
        : await blockchainService.hasAccess(normalizedDocId, normalizedCaller);
    }

    if (!isAuthorized) {
      return {
        status: "UNAUTHORIZED",
        documentId: normalizedDocId,
        candidateHash: normalizedCandidateHash,
        match: false,
        owner: doc.owner,
        verificationDurationMs: Math.round(performance.now() - startTime),
      };
    }

    // 3. Check revocation status
    if (doc.revoked) {
      const hashesMatch = doc.fileHash === normalizedCandidateHash;
      return {
        status: "REVOKED",
        documentId: normalizedDocId,
        onChainHash: doc.fileHash,
        candidateHash: normalizedCandidateHash,
        match: hashesMatch,
        revoked: true,
        owner: doc.owner,
        cid: doc.cid,
        timestamp: doc.createdAt,
        verificationDurationMs: Math.round(performance.now() - startTime),
      };
    }

    // 4. Compare candidate hash against on-chain hash
    const hashesMatch = doc.fileHash === normalizedCandidateHash;

    if (!hashesMatch) {
      return {
        status: "TAMPER_DETECTED",
        documentId: normalizedDocId,
        onChainHash: doc.fileHash,
        candidateHash: normalizedCandidateHash,
        match: false,
        revoked: false,
        owner: doc.owner,
        cid: doc.cid,
        timestamp: doc.createdAt,
        verificationDurationMs: Math.round(performance.now() - startTime),
      };
    }

    return {
      status: "VERIFIED",
      documentId: normalizedDocId,
      onChainHash: doc.fileHash,
      candidateHash: normalizedCandidateHash,
      match: true,
      revoked: false,
      owner: doc.owner,
      cid: doc.cid,
      timestamp: doc.createdAt,
      verificationDurationMs: Math.round(performance.now() - startTime),
    };
  }
}

export const verificationService = new VerificationService();
