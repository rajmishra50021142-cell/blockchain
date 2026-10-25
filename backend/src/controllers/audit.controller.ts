/**
 * Phase 10: Audit Controller
 *
 * Handles /api/audit/:documentId.
 * Queries emitted smart contract event logs for document lifecycle provenance.
 */

import { Request, Response, NextFunction } from "express";
import { auditService } from "../services/audit.service";
import { validateBytes32 } from "../middleware/validation";

export async function handleGetAudit(req: Request, res: Response, next: NextFunction) {
  try {
    const documentId = validateBytes32(req.params.documentId, "documentId");
    const callerAddress = req.user!.address;

    const result = await auditService.getAuditHistory(documentId, callerAddress);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
