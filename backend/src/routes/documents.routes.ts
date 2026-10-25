/**
 * Phase 10: Documents Routes
 */

import { Router } from "express";
import { handleListDocuments, handleGetDocument } from "../controllers/documents.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, handleListDocuments);
router.get("/:id", requireAuth, handleGetDocument);

export default router;
