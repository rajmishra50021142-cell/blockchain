/**
 * Phase 10: Verification API Test Suite
 *
 * Tests:
 * - POST /api/verify authentication enforcement
 * - Hash equivalence evaluation (VERIFIED, match: true)
 * - Single-bit modification / mutation detection (TAMPER_DETECTED, match: false)
 * - On-chain document revocation detection (REVOKED, revoked: true)
 * - Unauthorized verifier defense (UNAUTHORIZED, HTTP 403)
 * - Unregistered document handling (NOT_FOUND, HTTP 404)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { ethers } from "ethers";
import { createApp } from "../src/app";
import {
  HARDHAT_ACCOUNT_0_KEY,
  HARDHAT_ACCOUNT_1_KEY,
  getSigner,
  generateJwt,
  registerTestDocument,
  grantTestAccess,
  revokeTestDocument,
} from "./helpers";
import { hashDocument } from "../../frontend/lib/crypto";

describe("Phase 10: Verification API Endpoint (POST /api/verify)", () => {
  const app = createApp();

  const ownerSigner = getSigner(HARDHAT_ACCOUNT_0_KEY);
  const verifierSigner = getSigner(HARDHAT_ACCOUNT_1_KEY);

  const ownerToken = generateJwt(ownerSigner.address);
  const verifierToken = generateJwt(verifierSigner.address);
  const unauthorizedWallet = ethers.Wallet.createRandom();
  const unauthorizedToken = generateJwt(unauthorizedWallet.address);

  it("should reject verification request without authentication token", async () => {
    const res = await request(app)
      .post("/api/verify")
      .send({ documentId: ethers.ZeroHash, candidateHash: ethers.ZeroHash });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.error.code, "WALLET_NOT_CONNECTED");
  });

  it("should reject malformed documentId or candidateHash format", async () => {
    const resBadId = await request(app)
      .post("/api/verify")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ documentId: "invalid", candidateHash: ethers.ZeroHash });

    assert.strictEqual(resBadId.status, 400);
    assert.strictEqual(resBadId.body.error.code, "INVALID_BYTES32");

    const resBadHash = await request(app)
      .post("/api/verify")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ documentId: ethers.ZeroHash, candidateHash: "short-hash" });

    assert.strictEqual(resBadHash.status, 400);
    assert.strictEqual(resBadHash.body.error.code, "INVALID_HASH");
  });

  it("should return 404 NOT_FOUND when document does not exist on-chain", async () => {
    const nonExistentDocId = ethers.hexlify(ethers.randomBytes(32));
    const randomHash = ethers.hexlify(ethers.randomBytes(32));

    const res = await request(app)
      .post("/api/verify")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ documentId: nonExistentDocId, candidateHash: randomHash });

    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.status, "NOT_FOUND");
    assert.strictEqual(res.body.match, false);
    assert.ok(typeof res.body.verificationDurationMs === "number");
  });

  it("should return 403 UNAUTHORIZED when caller is neither owner nor granted verifier", async () => {
    const testDocId = ethers.hexlify(ethers.randomBytes(32));
    const testDocHash = ethers.hexlify(ethers.randomBytes(32));
    const testCid = "bafkreihyqf6zswmzcck4hkclhi3uxaalmckyw2hngm53hgf33srq5j57cy";

    await registerTestDocument(ownerSigner, testDocId, testDocHash, testCid);

    const res = await request(app)
      .post("/api/verify")
      .set("Authorization", `Bearer ${unauthorizedToken}`)
      .send({ documentId: testDocId, candidateHash: testDocHash });

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.status, "UNAUTHORIZED");
    assert.strictEqual(res.body.match, false);
  });

  it("should return VERIFIED (match: true) when candidate hash matches on-chain document hash", async () => {
    // 1. Create real document bytes & compute real SHA-256 hash (Phase 8)
    const originalPlaintext = new TextEncoder().encode(
      "Verified Sovereign Academic Degree: Diploma #10982-A, Issued 2026."
    );
    const originalHash = await hashDocument(originalPlaintext);

    const testDocId = ethers.hexlify(ethers.randomBytes(32));
    const testCid = "bafkreihyqf6zswmzcck4hkclhi3uxaalmckyw2hngm53hgf33srq5j57cy";

    // 2. Register on-chain
    await registerTestDocument(ownerSigner, testDocId, originalHash.bytes32, testCid);

    // 3. Owner performs verification
    const res = await request(app)
      .post("/api/verify")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        documentId: testDocId,
        candidateHash: originalHash.hex, // 64-char plain hex
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, "VERIFIED");
    assert.strictEqual(res.body.match, true);
    assert.strictEqual(res.body.revoked, false);
    assert.strictEqual(res.body.onChainHash.toLowerCase(), originalHash.bytes32.toLowerCase());
    assert.strictEqual(res.body.candidateHash.toLowerCase(), originalHash.bytes32.toLowerCase());
    assert.strictEqual(res.body.owner.toLowerCase(), ownerSigner.address.toLowerCase());
    assert.ok(typeof res.body.verificationDurationMs === "number");
  });

  it("should return TAMPER_DETECTED (match: false) when candidate hash differs from on-chain hash", async () => {
    const originalPlaintext = new TextEncoder().encode("Authentic unaltered contract agreement.");
    const originalHash = await hashDocument(originalPlaintext);

    // Tampered bytes
    const tamperedPlaintext = new TextEncoder().encode("Tampered malicious contract agreement.");
    const tamperedHash = await hashDocument(tamperedPlaintext);

    const testDocId = ethers.hexlify(ethers.randomBytes(32));
    const testCid = "bafkreihyqf6zswmzcck4hkclhi3uxaalmckyw2hngm53hgf33srq5j57cy";

    await registerTestDocument(ownerSigner, testDocId, originalHash.bytes32, testCid);

    // Verify with mutated hash
    const res = await request(app)
      .post("/api/verify")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        documentId: testDocId,
        candidateHash: tamperedHash.bytes32,
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, "TAMPER_DETECTED");
    assert.strictEqual(res.body.match, false);
    assert.strictEqual(res.body.revoked, false);
    assert.strictEqual(res.body.onChainHash.toLowerCase(), originalHash.bytes32.toLowerCase());
    assert.strictEqual(res.body.candidateHash.toLowerCase(), tamperedHash.bytes32.toLowerCase());
  });

  it("should return REVOKED (revoked: true) when verifying a revoked document", async () => {
    const originalPlaintext = new TextEncoder().encode("Document destined for on-chain revocation.");
    const originalHash = await hashDocument(originalPlaintext);

    const testDocId = ethers.hexlify(ethers.randomBytes(32));
    const testCid = "bafkreihyqf6zswmzcck4hkclhi3uxaalmckyw2hngm53hgf33srq5j57cy";

    // 1. Register
    await registerTestDocument(ownerSigner, testDocId, originalHash.bytes32, testCid);

    // 2. Grant access to verifier
    await grantTestAccess(ownerSigner, testDocId, verifierSigner.address);

    // 3. Revoke document
    await revokeTestDocument(ownerSigner, testDocId);

    // 4. Owner calls verify
    const res = await request(app)
      .post("/api/verify")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        documentId: testDocId,
        candidateHash: originalHash.bytes32,
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, "REVOKED");
    assert.strictEqual(res.body.match, true);
    assert.strictEqual(res.body.revoked, true);
  });
});
