/**
 * Phase 10: Audit Service
 *
 * Reconstructs document lifecycle history from authoritative blockchain event logs.
 * Zero synthetic events; all timestamps, transactions, and block numbers come from EVM logs.
 */

import { blockchainService } from "./blockchain.service";
import { NormalizedAuditEvent } from "../types";
import { AppError } from "../middleware/error-handler";

class AuditService {
  /**
   * Retrieves complete blockchain event audit history for a document.
   */
  public async getAuditHistory(
    documentId: string,
    callerAddress: string
  ): Promise<{ documentId: string; events: NormalizedAuditEvent[] }> {
    const normalizedDocId = documentId.toLowerCase();
    const normalizedCaller = callerAddress.toLowerCase();

    // 1. Check document existence and access permissions
    const doc = await blockchainService.getDocument(normalizedDocId);

    const isOwner = doc.owner === normalizedCaller;
    let isAuthorized = isOwner;

    if (!isAuthorized) {
      isAuthorized = await blockchainService.hasAccess(normalizedDocId, normalizedCaller);
    }

    if (!isAuthorized) {
      throw new AppError(
        "Unauthorized to inspect audit history for this document.",
        403,
        "ACCESS_DENIED",
        "AUDIT"
      );
    }

    // 2. Query event lineage from blockchain logs
    const events = await blockchainService.getDocumentAuditEvents(normalizedDocId);

    return {
      documentId: normalizedDocId,
      events,
    };
  }
}

export const auditService = new AuditService();
