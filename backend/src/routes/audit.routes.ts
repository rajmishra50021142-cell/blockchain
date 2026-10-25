/**
 * Phase 10: Audit Routes
 */

import { Router } from "express";
import { handleGetAudit } from "../controllers/audit.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/:documentId", requireAuth, handleGetAudit);

export default router;
