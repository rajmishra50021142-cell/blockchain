/**
 * Phase 10: Verification Routes
 */

import { Router } from "express";
import { handleVerify } from "../controllers/verify.controller";
import { requireAuth } from "../middleware/auth";
import { verifyLimiter } from "../middleware/rate-limit";

const router = Router();

router.post("/", requireAuth, verifyLimiter, handleVerify);

export default router;
