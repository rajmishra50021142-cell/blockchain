/**
 * Phase 10: IPFS API Test Suite
 *
 * Tests:
 * - Authentication enforcement for /api/ipfs/upload and /api/ipfs/:cid
 * - Strict ciphertext validation (rejects unencrypted plaintext, version mismatches, IV length errors)
 * - Live Pinata Files V3 API integration
 * - Byte-for-byte retrieval and decryption fidelity
 * - Fail-closed handling on invalid or non-existent CIDs
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { ethers } from "ethers";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app";
import { config } from "../src/config/env";
import {
  encryptDocument,
  decryptDocument,
  hashDocument,
} from "../../frontend/lib/crypto";

describe("Phase 10: IPFS API Endpoints", () => {
  const app = createApp();

  // Helper to generate a valid test JWT
  function generateAuthToken(address?: string) {
    const walletAddress = address || ethers.Wallet.createRandom().address;
    return jwt.sign(
      { sub: walletAddress, chainId: config.chainId, jti: "test-jti" },
      config.authJwtSecret,
      { expiresIn: "15m" }
    );
  }

  describe("POST /api/ipfs/upload (Validation & Authentication)", () => {
    it("should reject upload without authentication header", async () => {
      const res = await request(app)
        .post("/api/ipfs/upload")
        .send({ payload: "test" });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.error.code, "WALLET_NOT_CONNECTED");
    });

    it("should allow CORS preflight with x-filename, authorization, and content-type headers", async () => {
      const res = await request(app)
        .options("/api/ipfs/upload")
        .set("Origin", "http://localhost:3000")
        .set("Access-Control-Request-Method", "POST")
        .set("Access-Control-Request-Headers", "authorization, content-type, x-filename, accept");

      assert.strictEqual(res.status, 204);
      assert.strictEqual(res.headers["access-control-allow-origin"], "http://localhost:3000");
      const allowedHeaders = res.headers["access-control-allow-headers"] || "";
      assert(allowedHeaders.includes("x-filename") || allowedHeaders.includes("X-Filename"));
      assert(allowedHeaders.includes("Authorization"));
      assert(allowedHeaders.includes("Content-Type"));
    });

    it("should reject empty payload", async () => {
      const token = generateAuthToken();
      const res = await request(app)
        .post("/api/ipfs/upload")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error.code, "MISSING_PAYLOAD");
    });

    it("should reject payload shorter than 30 bytes fail-closed", async () => {
      const token = generateAuthToken();
      const shortBytes = Buffer.from([1, 2, 3, 4]);

      const res = await request(app)
        .post("/api/ipfs/upload")
        .set("Authorization", `Bearer ${token}`)
        .set("Content-Type", "application/octet-stream")
        .send(shortBytes);

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error.code, "INVALID_PAYLOAD_FORMAT");
    });

    it("should reject payload with unsupported protocol version", async () => {
      const token = generateAuthToken();
      const invalidVersionBytes = Buffer.alloc(40);
      invalidVersionBytes[0] = 99; // Invalid version
      invalidVersionBytes[1] = 12; // Valid IV len

      const res = await request(app)
        .post("/api/ipfs/upload")
        .set("Authorization", `Bearer ${token}`)
        .set("Content-Type", "application/octet-stream")
        .send(invalidVersionBytes);

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error.code, "UNSUPPORTED_VERSION");
    });

    it("should reject payload with invalid IV length (non-GCM 12 bytes)", async () => {
      const token = generateAuthToken();
      const invalidIvBytes = Buffer.alloc(40);
      invalidIvBytes[0] = 1; // Valid version
      invalidIvBytes[1] = 16; // Invalid IV len (AES-GCM requires 12)

      const res = await request(app)
        .post("/api/ipfs/upload")
        .set("Authorization", `Bearer ${token}`)
        .set("Content-Type", "application/octet-stream")
        .send(invalidIvBytes);

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error.code, "INVALID_IV_LENGTH");
    });
  });

  describe("GET /api/ipfs/:cid (Validation & Boundary Defense)", () => {
    it("should reject retrieval without authentication header", async () => {
      const res = await request(app).get("/api/ipfs/bafkreihyqf6zswmzcck4hkclhi3uxaalmckyw2hngm53hgf33srq5j57cy");
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.error.code, "WALLET_NOT_CONNECTED");
    });

    it("should reject malformed CID string fail-closed", async () => {
      const token = generateAuthToken();
      const res = await request(app)
        .get("/api/ipfs/not-a-valid-cid-format")
        .set("Authorization", `Bearer ${token}`);

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error.code, "INVALID_CID");
    });
  });

  describe("Live Pinata V3 Upload & Gateway Retrieval Roundtrip", () => {
    it("should upload real Phase 8 encrypted bytes to Pinata V3, retrieve via gateway, and assert byte-for-byte integrity", async () => {
      const token = generateAuthToken();

      // 1. Prepare realistic original document
      const plaintext = new TextEncoder().encode(
        "Confidential Medical Record: Patient 98721, Status Verified Authentic, Date 2026-10-02"
      );
      const preHash = await hashDocument(plaintext);

      // 2. Encrypt with Phase 8 AES-256-GCM
      const encryptRes = await encryptDocument(plaintext);
      const serializedBytes = Buffer.from(encryptRes.serialized);

      // 3. Upload via API POST /api/ipfs/upload
      const uploadRes = await request(app)
        .post("/api/ipfs/upload")
        .set("Authorization", `Bearer ${token}`)
        .set("Content-Type", "application/octet-stream")
        .send(serializedBytes);

      assert.strictEqual(uploadRes.status, 200);
      assert.ok(uploadRes.body.cid, "Must return authentic CID");
      assert.ok(uploadRes.body.cid.startsWith("baf") || uploadRes.body.cid.startsWith("Qm"));
      assert.strictEqual(uploadRes.body.size, serializedBytes.length);

      const authenticCid = uploadRes.body.cid;

      // 4. Retrieve via API GET /api/ipfs/:cid
      const downloadRes = await request(app)
        .get(`/api/ipfs/${authenticCid}`)
        .set("Authorization", `Bearer ${token}`)
        .responseType("blob");

      assert.strictEqual(downloadRes.status, 200);
      assert.strictEqual(downloadRes.header["content-type"], "application/octet-stream");

      const downloadedBytes = new Uint8Array(downloadRes.body);

      // 5. Byte-for-byte fidelity check
      assert.strictEqual(
        downloadedBytes.length,
        serializedBytes.length,
        "Downloaded length must equal uploaded length exactly"
      );

      let bytesMatch = true;
      for (let i = 0; i < serializedBytes.length; i++) {
        if (serializedBytes[i] !== downloadedBytes[i]) {
          bytesMatch = false;
          break;
        }
      }
      assert.strictEqual(bytesMatch, true, "Downloaded bytes must match uploaded bytes 100% byte-for-byte");

      // 6. Decrypt and verify recovered plaintext
      const recoveredPlaintext = await decryptDocument(downloadedBytes, encryptRes.key);
      assert.strictEqual(
        new TextDecoder().decode(recoveredPlaintext),
        new TextDecoder().decode(plaintext),
        "Recovered plaintext must match original document exactly"
      );

      // 7. Verify SHA-256 integrity
      const postHash = await hashDocument(recoveredPlaintext);
      assert.strictEqual(postHash.hex, preHash.hex, "Recovered document SHA-256 must match original hash");
    });
  });
});
