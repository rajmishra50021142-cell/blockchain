/**
 * Phase 10: Documents Controller
 *
 * Handles /api/documents and /api/documents/:id.
 * Queries DocumentRegistry and AccessControl smart contracts in real time.
 */

import { Request, Response, NextFunction } from "express";
import { blockchainService } from "../services/blockchain.service";
import { validateBytes32 } from "../middleware/validation";
import { AppError } from "../middleware/error-handler";

export async function handleListDocuments(req: Request, res: Response, next: NextFunction) {
  try {
    const callerAddress = req.user!.address;
    const documents = await blockchainService.getUserDocuments(callerAddress);

    res.status(200).json({
      documents,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleGetDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const documentId = validateBytes32(req.params.id, "documentId");
    const callerAddress = req.user!.address;

    const doc = await blockchainService.getDocument(documentId);

    const isOwner = doc.owner === callerAddress.toLowerCase();
    let hasAccess = isOwner;

    if (!hasAccess) {
      hasAccess = await blockchainService.hasAccess(documentId, callerAddress);
    }

    if (!hasAccess) {
      throw new AppError(
        "Access denied: you do not possess on-chain permission for this document.",
        403,
        "ACCESS_DENIED",
        "DOCUMENT"
      );
    }

    res.status(200).json({
      id: doc.id,
      owner: doc.owner,
      cid: doc.cid,
      fileHash: doc.fileHash,
      createdAt: doc.createdAt,
      revoked: doc.revoked,
      isOwner,
      hasAccess,
    });
  } catch (err) {
    next(err);
  }
}
