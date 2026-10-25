/**
 * Phase 10: Verification Controller
 *
 * Handles /api/verify.
 * Compares candidate SHA-256 digest against authoritative on-chain state.
 */

import { Request, Response, NextFunction } from "express";
import { verificationService } from "../services/verification.service";
import { validateBytes32, validateSha256Hex } from "../middleware/validation";

export async function handleVerify(req: Request, res: Response, next: NextFunction) {
  try {
    const documentId = validateBytes32(req.body?.documentId, "documentId");
    const candidateHash = validateSha256Hex(req.body?.candidateHash, "candidateHash");
    const callerAddress = req.user!.address;

    const result = await verificationService.verifyDocument(
      documentId,
      candidateHash,
      callerAddress
    );

    if (result.status === "NOT_FOUND") {
      return res.status(404).json({
        ...result,
        error: {
          code: "DOCUMENT_NOT_FOUND",
          message: `Document not found for ID: "${documentId}".`,
          service: "DocumentRegistry",
          timestamp: Date.now(),
        },
      });
    }

    if (result.status === "UNAUTHORIZED") {
      return res.status(403).json({
        ...result,
        error: {
          code: "ACCESS_DENIED",
          message: "Access denied: you do not possess on-chain permission for this document.",
          service: "AccessControl",
          timestamp: Date.now(),
        },
      });
    }

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
