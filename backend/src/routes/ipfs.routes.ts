/**
 * Phase 10: IPFS Routes
 */

import { Router, raw } from "express";
import { handleUpload, handleDownload } from "../controllers/ipfs.controller";
import { requireAuth } from "../middleware/auth";
import { uploadLimiter } from "../middleware/rate-limit";

const router = Router();

// Apply raw body parser specifically for octet-stream uploads up to 50MB
router.post(
  "/upload",
  requireAuth,
  uploadLimiter,
  raw({ type: ["application/octet-stream", "application/binary"], limit: "50mb" }),
  handleUpload
);

router.get("/:cid", requireAuth, handleDownload);

export default router;
