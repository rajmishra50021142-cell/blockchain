/**
 * Phase 10: Authentication Routes
 */

import { Router } from "express";
import { handleChallenge, handleVerify } from "../controllers/auth.controller";
import { authLimiter } from "../middleware/rate-limit";

const router = Router();

router.post("/challenge", authLimiter, handleChallenge);
router.post("/verify", authLimiter, handleVerify);

export default router;
