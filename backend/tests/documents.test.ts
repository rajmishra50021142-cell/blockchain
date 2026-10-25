/**
 * Phase 10: Documents API Test Suite
 *
 * Tests:
 * - GET /api/documents (empty state & real on-chain document inventory)
 * - GET /api/documents/:id (metadata lookup, owner access, verifier access, unauthorized 403, not found 404)
 * - Real on-chain state reads against DocumentRegistry & AccessControl
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
} from "./helpers";

describe("Phase 10: Documents API Endpoints", () => {
  const app = createApp();

  const ownerSigner = getSigner(HARDHAT_ACCOUNT_0_KEY);
  const verifierSigner = getSigner(HARDHAT_ACCOUNT_1_KEY);

  const ownerToken = generateJwt(ownerSigner.address);
  const verifierToken = generateJwt(verifierSigner.address);
  const randomUserWallet = ethers.Wallet.createRandom();
  const randomUserToken = generateJwt(randomUserWallet.address);

  describe("GET /api/documents", () => {
    it("should reject requests lacking authentication token", async () => {
      const res = await request(app).get("/api/documents");
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.error.code, "WALLET_NOT_CONNECTED");
    });

    it("should return empty documents array for wallet with zero registrations", async () => {
      const res = await request(app)
        .get("/api/documents")
        .set("Authorization", `Bearer ${randomUserToken}`);

      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.documents));
      assert.strictEqual(res.body.documents.length, 0);
    });

    it("should return on-chain registered documents for the authenticated owner", async () => {
      // 1. Mine a real on-chain document registration
      const testDocId = ethers.hexlify(ethers.randomBytes(32));
      const testFileHash = ethers.hexlify(ethers.randomBytes(32));
      const testCid = "bafkreihyqf6zswmzcck4hkclhi3uxaalmckyw2hngm53hgf33srq5j57cy";

      await registerTestDocument(ownerSigner, testDocId, testFileHash, testCid);

      // 2. Query API
      const res = await request(app)
        .get("/api/documents")
        .set("Authorization", `Bearer ${ownerToken}`);

      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.documents));
      assert.ok(res.body.documents.length >= 1);

      const found = res.body.documents.find((d: any) => d.id === testDocId.toLowerCase());
      assert.ok(found, "Newly registered document must be returned in user's documents list");
      assert.strictEqual(found.owner.toLowerCase(), ownerSigner.address.toLowerCase());
      assert.strictEqual(found.cid, testCid);
      assert.strictEqual(found.fileHash.toLowerCase(), testFileHash.toLowerCase());
      assert.strictEqual(found.revoked, false);
      assert.strictEqual(found.isOwner, true);
    });
  });

  describe("GET /api/documents/:id", () => {
    it("should reject malformed document ID string", async () => {
      const res = await request(app)
        .get("/api/documents/invalid-id")
        .set("Authorization", `Bearer ${ownerToken}`);

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error.code, "INVALID_BYTES32");
    });

    it("should return 404 for an unregistered document ID", async () => {
      const nonExistentDocId = ethers.hexlify(ethers.randomBytes(32));
      const res = await request(app)
        .get(`/api/documents/${nonExistentDocId}`)
        .set("Authorization", `Bearer ${ownerToken}`);

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.error.code, "DOCUMENT_NOT_FOUND");
    });

    it("should deny access with 403 Forbidden to an unauthorized third-party wallet", async () => {
      // Register document under owner
      const testDocId = ethers.hexlify(ethers.randomBytes(32));
      const testFileHash = ethers.hexlify(ethers.randomBytes(32));
      const testCid = "bafkreihyqf6zswmzcck4hkclhi3uxaalmckyw2hngm53hgf33srq5j57cy";

      await registerTestDocument(ownerSigner, testDocId, testFileHash, testCid);

      // Third-party queries document
      const res = await request(app)
        .get(`/api/documents/${testDocId}`)
        .set("Authorization", `Bearer ${randomUserToken}`);

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.error.code, "ACCESS_DENIED");
    });

    it("should allow access and return metadata when queried by a granted verifier", async () => {
      // 1. Register document under owner
      const testDocId = ethers.hexlify(ethers.randomBytes(32));
      const testFileHash = ethers.hexlify(ethers.randomBytes(32));
      const testCid = "bafkreihyqf6zswmzcck4hkclhi3uxaalmckyw2hngm53hgf33srq5j57cy";

      await registerTestDocument(ownerSigner, testDocId, testFileHash, testCid);

      // 2. Grant verifier access
      await grantTestAccess(ownerSigner, testDocId, verifierSigner.address);

      // 3. Verifier queries document metadata
      const res = await request(app)
        .get(`/api/documents/${testDocId}`)
        .set("Authorization", `Bearer ${verifierToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.id, testDocId.toLowerCase());
      assert.strictEqual(res.body.owner, ownerSigner.address.toLowerCase());
      assert.strictEqual(res.body.hasAccess, true);
      assert.strictEqual(res.body.isOwner, false);
    });
  });
});
