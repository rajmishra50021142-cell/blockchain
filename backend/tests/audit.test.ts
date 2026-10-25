/**
 * Phase 10: Audit API Test Suite
 *
 * Tests:
 * - GET /api/audit/:documentId authentication enforcement
 * - Full blockchain lifecycle provenance reconstruction:
 *   DocumentRegistered -> AccessGranted -> AccessRevoked -> DocumentRevoked
 * - Deterministic chronological ordering (blockNumber asc, logIndex asc)
 * - Validation of real mined block numbers, tx hashes, and event parameters
 * - Rejection of unauthorized callers fail-closed
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
  revokeTestAccess,
  revokeTestDocument,
} from "./helpers";

describe("Phase 10: Audit API Endpoint (GET /api/audit/:documentId)", () => {
  const app = createApp();

  const ownerSigner = getSigner(HARDHAT_ACCOUNT_0_KEY);
  const verifierSigner = getSigner(HARDHAT_ACCOUNT_1_KEY);

  const ownerToken = generateJwt(ownerSigner.address);
  const unauthorizedWallet = ethers.Wallet.createRandom();
  const unauthorizedToken = generateJwt(unauthorizedWallet.address);

  it("should reject audit query without authentication token", async () => {
    const res = await request(app).get("/api/audit/0x1234");
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.error.code, "WALLET_NOT_CONNECTED");
  });

  it("should reject malformed documentId format", async () => {
    const res = await request(app)
      .get("/api/audit/not-a-bytes32-id")
      .set("Authorization", `Bearer ${ownerToken}`);

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error.code, "INVALID_BYTES32");
  });

  it("should return 404 NOT_FOUND for an unregistered document ID", async () => {
    const nonExistentDocId = ethers.hexlify(ethers.randomBytes(32));
    const res = await request(app)
      .get(`/api/audit/${nonExistentDocId}`)
      .set("Authorization", `Bearer ${ownerToken}`);

    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.error.code, "DOCUMENT_NOT_FOUND");
  });

  it("should return 403 ACCESS_DENIED when an unauthorized stranger queries audit history", async () => {
    const testDocId = ethers.hexlify(ethers.randomBytes(32));
    const testFileHash = ethers.hexlify(ethers.randomBytes(32));
    const testCid = "bafkreihyqf6zswmzcck4hkclhi3uxaalmckyw2hngm53hgf33srq5j57cy";

    await registerTestDocument(ownerSigner, testDocId, testFileHash, testCid);

    const res = await request(app)
      .get(`/api/audit/${testDocId}`)
      .set("Authorization", `Bearer ${unauthorizedToken}`);

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.error.code, "ACCESS_DENIED");
  });

  it("should reconstruct the full chronological on-chain event lineage from real mined transactions", async () => {
    const testDocId = ethers.hexlify(ethers.randomBytes(32));
    const testFileHash = ethers.hexlify(ethers.randomBytes(32));
    const testCid = "bafkreihyqf6zswmzcck4hkclhi3uxaalmckyw2hngm53hgf33srq5j57cy";

    // Step 1: Register Document
    const regReceipt = await registerTestDocument(ownerSigner, testDocId, testFileHash, testCid);

    // Step 2: Grant Access
    const grantReceipt = await grantTestAccess(ownerSigner, testDocId, verifierSigner.address);

    // Step 3: Revoke Access
    const revAccessReceipt = await revokeTestAccess(ownerSigner, testDocId, verifierSigner.address);

    // Step 4: Revoke Document
    const revDocReceipt = await revokeTestDocument(ownerSigner, testDocId);

    // Query Audit API
    const res = await request(app)
      .get(`/api/audit/${testDocId}`)
      .set("Authorization", `Bearer ${ownerToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.documentId, testDocId.toLowerCase());
    assert.ok(Array.isArray(res.body.events));
    assert.strictEqual(res.body.events.length, 4, "Must contain exactly the 4 mined on-chain events");

    const events = res.body.events;

    // Event 1: DocumentRegistered
    assert.strictEqual(events[0].eventName, "DocumentRegistered");
    assert.strictEqual(events[0].blockNumber, regReceipt.blockNumber);
    assert.strictEqual(events[0].transactionHash.toLowerCase(), regReceipt.hash.toLowerCase());
    assert.strictEqual(events[0].actor.toLowerCase(), ownerSigner.address.toLowerCase());
    assert.strictEqual(events[0].details.cid, testCid);
    assert.strictEqual(events[0].details.fileHash.toLowerCase(), testFileHash.toLowerCase());

    // Event 2: AccessGranted
    assert.strictEqual(events[1].eventName, "AccessGranted");
    assert.strictEqual(events[1].blockNumber, grantReceipt.blockNumber);
    assert.strictEqual(events[1].transactionHash.toLowerCase(), grantReceipt.hash.toLowerCase());
    assert.strictEqual(events[1].actor.toLowerCase(), ownerSigner.address.toLowerCase());
    assert.strictEqual(events[1].details.verifier.toLowerCase(), verifierSigner.address.toLowerCase());

    // Event 3: AccessRevoked
    assert.strictEqual(events[2].eventName, "AccessRevoked");
    assert.strictEqual(events[2].blockNumber, revAccessReceipt.blockNumber);
    assert.strictEqual(events[2].transactionHash.toLowerCase(), revAccessReceipt.hash.toLowerCase());
    assert.strictEqual(events[2].actor.toLowerCase(), ownerSigner.address.toLowerCase());
    assert.strictEqual(events[2].details.verifier.toLowerCase(), verifierSigner.address.toLowerCase());

    // Event 4: DocumentRevoked
    assert.strictEqual(events[3].eventName, "DocumentRevoked");
    assert.strictEqual(events[3].blockNumber, revDocReceipt.blockNumber);
    assert.strictEqual(events[3].transactionHash.toLowerCase(), revDocReceipt.hash.toLowerCase());
    assert.strictEqual(events[3].actor.toLowerCase(), ownerSigner.address.toLowerCase());

    // Assert chronological sequence
    assert.ok(events[0].blockNumber <= events[1].blockNumber);
    assert.ok(events[1].blockNumber <= events[2].blockNumber);
    assert.ok(events[2].blockNumber <= events[3].blockNumber);
  });
});
