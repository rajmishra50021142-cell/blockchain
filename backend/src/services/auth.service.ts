/**
 * Phase 10: Authentication Service
 *
 * Implements EIP-191 challenge-response authentication:
 * - Generates cryptographically secure nonces via CSPRNG
 * - Constructs canonical human-readable sign-in messages
 * - Enforces single-use nonces and expiration TTL
 * - Verifies ECDSA signatures with ethers.verifyMessage
 * - Issues standard HMAC-SHA256 signed JSON Web Tokens
 */

import * as crypto from "crypto";
import { ethers } from "ethers";
import jwt from "jsonwebtoken";
import { config } from "../config/env";
import { AuthChallenge, JwtClaims } from "../types";
import { AppError } from "../middleware/error-handler";

class AuthService {
  // In-memory challenge store keyed by normalized address
  private challenges: Map<string, AuthChallenge> = new Map();

  /**
   * Generates a new cryptographically random challenge for an address.
   */
  public createChallenge(address: string, chainIdOverride?: number): AuthChallenge {
    const normalizedAddress = ethers.getAddress(address).toLowerCase();
    const nonce = crypto.randomBytes(32).toString("hex");
    const now = Date.now();
    const expiresAt = now + config.authChallengeTtlSeconds * 1000;
    const chainId = chainIdOverride || config.chainId;

    const message = [
      "Document Locker Authentication",
      `Wallet: ${ethers.getAddress(normalizedAddress)}`,
      `Chain ID: ${chainId}`,
      `Nonce: ${nonce}`,
      `Issued At: ${new Date(now).toISOString()}`,
      `Expires At: ${new Date(expiresAt).toISOString()}`,
      "Purpose: Sign to authenticate session. No gas will be consumed.",
    ].join("\n");

    const challenge: AuthChallenge = {
      address: normalizedAddress,
      nonce,
      message,
      issuedAt: now,
      expiresAt,
      chainId,
    };

    // Store in-memory
    this.challenges.set(normalizedAddress, challenge);

    // Periodic sweep of expired challenges
    this.cleanExpiredChallenges();

    return challenge;
  }

  /**
   * Retrieves active challenge for an address.
   */
  public getChallenge(address: string): AuthChallenge | undefined {
    const normalizedAddress = address.toLowerCase();
    return this.challenges.get(normalizedAddress);
  }

  /**
   * Verifies the wallet signature against the stored challenge,
   * invalidates the challenge immediately (single-use), and issues a JWT.
   */
  public verifySignatureAndIssueJwt(address: string, signature: string): {
    token: string;
    address: string;
    expiresIn: string;
  } {
    const normalizedAddress = address.toLowerCase();
    const challenge = this.challenges.get(normalizedAddress);

    if (!challenge) {
      throw new AppError(
        "No active authentication challenge found for this address. Request a challenge first.",
        401,
        "CHALLENGE_NOT_FOUND",
        "AUTH"
      );
    }

    // Immediately consume the challenge to prevent replay attacks
    this.challenges.delete(normalizedAddress);

    // Check expiration
    if (Date.now() > challenge.expiresAt) {
      throw new AppError(
        "Authentication challenge has expired. Request a new challenge.",
        401,
        "CHALLENGE_EXPIRED",
        "AUTH"
      );
    }

    // Recover address from signature using ethers
    let recoveredAddress: string;
    try {
      recoveredAddress = ethers.verifyMessage(challenge.message, signature).toLowerCase();
    } catch {
      throw new AppError(
        "Cryptographic signature verification failed: signature is malformed.",
        401,
        "SIGNATURE_INVALID",
        "AUTH"
      );
    }

    if (recoveredAddress !== normalizedAddress) {
      throw new AppError(
        `Signature verification failed: recovered address (${recoveredAddress}) does not match challenged address (${normalizedAddress}).`,
        401,
        "SIGNATURE_MISMATCH",
        "AUTH"
      );
    }

    // Issue JWT
    const claims: Omit<JwtClaims, "iat" | "exp"> = {
      sub: ethers.getAddress(normalizedAddress),
      chainId: challenge.chainId,
      jti: crypto.randomUUID(),
    };

    const token = jwt.sign(claims, config.authJwtSecret, {
      expiresIn: config.authJwtExpiresIn as any,
    });

    return {
      token,
      address: ethers.getAddress(normalizedAddress),
      expiresIn: config.authJwtExpiresIn,
    };
  }

  /**
   * Cleans up expired nonces to maintain bounded memory footprint.
   */
  private cleanExpiredChallenges() {
    const now = Date.now();
    for (const [addr, c] of this.challenges.entries()) {
      if (now > c.expiresAt) {
        this.challenges.delete(addr);
      }
    }
  }

  /**
   * For testing: resets internal cache.
   */
  public reset() {
    this.challenges.clear();
  }
}

export const authService = new AuthService();
