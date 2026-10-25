/**
 * Phase 10: Authentication Controller
 *
 * Handles /api/auth/challenge and /api/auth/verify routes.
 */

import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import { validateEthereumAddress, validateSignature } from "../middleware/validation";

export async function handleChallenge(req: Request, res: Response, next: NextFunction) {
  try {
    const address = validateEthereumAddress(req.body?.address, "address");
    const challenge = authService.createChallenge(address);

    res.status(200).json({
      challenge: challenge.message,
      nonce: challenge.nonce,
      expiresAt: challenge.expiresAt,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleVerify(req: Request, res: Response, next: NextFunction) {
  try {
    const address = validateEthereumAddress(req.body?.address, "address");
    const signature = validateSignature(req.body?.signature);

    const result = authService.verifySignatureAndIssueJwt(address, signature);

    res.status(200).json({
      token: result.token,
      address: result.address,
      expiresIn: result.expiresIn,
    });
  } catch (err) {
    next(err);
  }
}
