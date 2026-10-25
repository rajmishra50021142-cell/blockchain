/**
 * Phase 10: Authentication Test Suite
 *
 * Tests:
 * - Challenge generation & CSPRNG nonces
 * - Single-use nonce enforcement (replay attack defense)
 * - Challenge expiration TTL enforcement
 * - Cryptographic signature verification using real EIP-191 personal signatures
 * - Signature tampering, wrong wallet, and altered message defense
 * - JWT issuance, verification, tampering, expiration, and header validation
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { ethers } from "ethers";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app";
import { authService } from "../src/services/auth.service";
import { config } from "../src/config/env";

describe("Phase 10: Authentication APIs & Security Middleware", () => {
  const app = createApp();

  beforeEach(() => {
    authService.reset();
  });

  describe("POST /api/auth/challenge", () => {
    it("should issue a valid challenge for a well-formed Ethereum address", async () => {
      const wallet = ethers.Wallet.createRandom();
      const res = await request(app)
        .post("/api/auth/challenge")
        .send({ address: wallet.address });

      assert.strictEqual(res.status, 200);
      assert.ok(res.body.challenge, "Challenge message must be returned");
      assert.ok(res.body.nonce, "Nonce must be returned");
      assert.ok(res.body.expiresAt, "Expiration timestamp must be returned");

      assert.match(res.body.challenge, /Document Locker Authentication/);
      assert.match(res.body.challenge, new RegExp(wallet.address, "i"));
      assert.match(res.body.challenge, /No gas will be consumed/);
      assert.strictEqual(res.body.nonce.length, 64, "Nonce must be a 32-byte (64 hex) CSPRNG string");
    });

    it("should reject invalid or missing Ethereum addresses fail-closed", async () => {
      const resEmpty = await request(app)
        .post("/api/auth/challenge")
        .send({});

      assert.strictEqual(resEmpty.status, 400);
      assert.strictEqual(resEmpty.body.error.code, "INVALID_ADDRESS");

      const resMalformed = await request(app)
        .post("/api/auth/challenge")
        .send({ address: "not-an-address" });

      assert.strictEqual(resMalformed.status, 400);
      assert.strictEqual(resMalformed.body.error.code, "INVALID_ADDRESS");
    });

    it("should produce non-repeating nonces across subsequent challenge calls", async () => {
      const wallet = ethers.Wallet.createRandom();

      const res1 = await request(app)
        .post("/api/auth/challenge")
        .send({ address: wallet.address });

      const res2 = await request(app)
        .post("/api/auth/challenge")
        .send({ address: wallet.address });

      assert.notStrictEqual(
        res1.body.nonce,
        res2.body.nonce,
        "Subsequent challenges must possess distinct CSPRNG nonces"
      );
    });
  });

  describe("POST /api/auth/verify", () => {
    it("should successfully verify authentic wallet signature and issue a valid JWT", async () => {
      const wallet = ethers.Wallet.createRandom();

      // 1. Get challenge
      const chalRes = await request(app)
        .post("/api/auth/challenge")
        .send({ address: wallet.address });

      const challengeMessage = chalRes.body.challenge;

      // 2. Sign with real private key
      const signature = await wallet.signMessage(challengeMessage);

      // 3. Verify
      const verifyRes = await request(app)
        .post("/api/auth/verify")
        .send({
          address: wallet.address,
          signature,
        });

      assert.strictEqual(verifyRes.status, 200);
      assert.ok(verifyRes.body.token, "JWT token must be returned");
      assert.strictEqual(verifyRes.body.address.toLowerCase(), wallet.address.toLowerCase());

      // 4. Verify decoded claims
      const decoded = jwt.verify(verifyRes.body.token, config.authJwtSecret) as any;
      assert.strictEqual(decoded.sub.toLowerCase(), wallet.address.toLowerCase());
      assert.strictEqual(decoded.chainId, config.chainId);
      assert.ok(decoded.jti, "JWT ID claim must be present");
      assert.ok(decoded.exp, "Expiration claim must be present");
    });

    it("should reject replaying the same challenge/signature (single-use invariant)", async () => {
      const wallet = ethers.Wallet.createRandom();

      const chalRes = await request(app)
        .post("/api/auth/challenge")
        .send({ address: wallet.address });

      const signature = await wallet.signMessage(chalRes.body.challenge);

      // First verification succeeds
      const firstRes = await request(app)
        .post("/api/auth/verify")
        .send({ address: wallet.address, signature });

      assert.strictEqual(firstRes.status, 200);

      // Second verification with identical parameters MUST fail
      const replayRes = await request(app)
        .post("/api/auth/verify")
        .send({ address: wallet.address, signature });

      assert.strictEqual(replayRes.status, 401);
      assert.strictEqual(replayRes.body.error.code, "CHALLENGE_NOT_FOUND");
    });

    it("should reject signature if signed by a different wallet address", async () => {
      const victimWallet = ethers.Wallet.createRandom();
      const attackerWallet = ethers.Wallet.createRandom();

      // Challenge issued for victim
      const chalRes = await request(app)
        .post("/api/auth/challenge")
        .send({ address: victimWallet.address });

      // Attacker signs victim's challenge
      const attackerSignature = await attackerWallet.signMessage(chalRes.body.challenge);

      // Attempt to verify as victim
      const verifyRes = await request(app)
        .post("/api/auth/verify")
        .send({
          address: victimWallet.address,
          signature: attackerSignature,
        });

      assert.strictEqual(verifyRes.status, 401);
      assert.strictEqual(verifyRes.body.error.code, "SIGNATURE_MISMATCH");
    });

    it("should reject verification if the message content was altered before signing", async () => {
      const wallet = ethers.Wallet.createRandom();

      await request(app)
        .post("/api/auth/challenge")
        .send({ address: wallet.address });

      // Sign altered text
      const tamperedMessage = "Different message pretending to authenticate.";
      const signature = await wallet.signMessage(tamperedMessage);

      const verifyRes = await request(app)
        .post("/api/auth/verify")
        .send({
          address: wallet.address,
          signature,
        });

      assert.strictEqual(verifyRes.status, 401);
      assert.strictEqual(verifyRes.body.error.code, "SIGNATURE_MISMATCH");
    });

    it("should reject verification if the challenge has expired", async () => {
      const wallet = ethers.Wallet.createRandom();

      // Manually inject expired challenge into service
      const challenge = authService.createChallenge(wallet.address);
      // Force expired timestamp
      (challenge as any).expiresAt = Date.now() - 1000;

      const signature = await wallet.signMessage(challenge.message);

      const verifyRes = await request(app)
        .post("/api/auth/verify")
        .send({
          address: wallet.address,
          signature,
        });

      assert.strictEqual(verifyRes.status, 401);
      assert.strictEqual(verifyRes.body.error.code, "CHALLENGE_EXPIRED");
    });
  });

  describe("JWT Validation Middleware (requireAuth)", () => {
    it("should reject protected requests with missing Authorization header", async () => {
      const res = await request(app).get("/api/documents");
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.error.code, "WALLET_NOT_CONNECTED");
    });

    it("should reject protected requests with malformed Authorization header", async () => {
      const res = await request(app)
        .get("/api/documents")
        .set("Authorization", "Basic invalidtoken");

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.error.code, "INVALID_AUTH_HEADER");
    });

    it("should reject protected requests with tampered or invalid JWT signature", async () => {
      const wallet = ethers.Wallet.createRandom();
      const fakeToken = jwt.sign(
        { sub: wallet.address, chainId: 31337 },
        "wrong-secret-key"
      );

      const res = await request(app)
        .get("/api/documents")
        .set("Authorization", `Bearer ${fakeToken}`);

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.error.code, "TOKEN_INVALID");
    });

    it("should reject protected requests with expired JWT", async () => {
      const wallet = ethers.Wallet.createRandom();
      const expiredToken = jwt.sign(
        { sub: wallet.address, chainId: 31337 },
        config.authJwtSecret,
        { expiresIn: "0s" }
      );

      const res = await request(app)
        .get("/api/documents")
        .set("Authorization", `Bearer ${expiredToken}`);

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.error.code, "TOKEN_EXPIRED");
    });
  });
});
