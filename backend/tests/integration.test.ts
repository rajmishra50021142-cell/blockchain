/**
 * Phase 10: Complete End-to-End Backend Integration Test
 *
 * Exercises the complete multi-layer workflow:
 * 1. Wallet Challenge generation via /api/auth/challenge
 * 2. EIP-191 Personal signature generation with real wallet key
 * 3. Signature verification & JWT issuance via /api/auth/verify
 * 4. Client-side SHA-256 hashing & AES-256-GCM encryption (Phase 8)
 * 5. Authenticated IPFS upload to live Pinata Files V3 API via /api/ipfs/upload
 * 6. Real on-chain document registration on DocumentRegistry.sol
 * 7. Authenticated document metadata read via /api/documents/:id
 * 8. AccessControl grant transaction
 * 9. Authenticated verification via /api/verify
 * 10. IPFS gateway payload download & decryption roundtrip
 * 11. Full audit lineage verification via /api/audit/:id
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
  registerTestDocument,
  grantTestAccess,
} from "./helpers";
import {
  hashDocument,
  encryptDocument,
  decryptDocument,
} from "../../frontend/lib/crypto";

describe("Phase 10: End-to-End Cryptography, IPFS, Blockchain & API Integration", () => {
  const app = createApp();

  const ownerWallet = getSigner(HARDHAT_ACCOUNT_0_KEY);
  const verifierWallet = getSigner(HARDHAT_ACCOUNT_1_KEY);

  it("should execute the complete authentic lifecycle without synthetic or mock data", async () => {
    // -------------------------------------------------------------------------
    // STEP 1: Wallet Challenge Generation
    // -------------------------------------------------------------------------
    const chalRes = await request(app)
      .post("/api/auth/challenge")
      .send({ address: ownerWallet.address });

    assert.strictEqual(chalRes.status, 200);
    assert.ok(chalRes.body.challenge);
    assert.ok(chalRes.body.nonce);

    // -------------------------------------------------------------------------
    // STEP 2 & 3: EIP-191 Signature & JWT Issuance
    // -------------------------------------------------------------------------
    const ownerSignature = await ownerWallet.signMessage(chalRes.body.challenge);

    const authRes = await request(app)
      .post("/api/auth/verify")
      .send({
        address: ownerWallet.address,
        signature: ownerSignature,
      });

    assert.strictEqual(authRes.status, 200);
    assert.ok(authRes.body.token);
    const ownerJwt = authRes.body.token;

    // -------------------------------------------------------------------------
    // STEP 4: Client-Side SHA-256 Hashing & AES-256-GCM Encryption (Phase 8)
    // -------------------------------------------------------------------------
    const originalDocumentBytes = new TextEncoder().encode(
      "UNITED STATES PATENT AND TRADEMARK OFFICE\n" +
      "Patent Grant #US-1198234-B2\n" +
      "Title: Sovereign Decentralized Identity & Encrypted Document Relay\n" +
      "Date: October 2, 2026\n" +
      "Inventor: Autonomous Agentic Cryptographer\n"
    );

    const docHashResult = await hashDocument(originalDocumentBytes);
    const encryptionResult = await encryptDocument(originalDocumentBytes);
    const serializedPayload = Buffer.from(encryptionResult.serialized);

    // -------------------------------------------------------------------------
    // STEP 5: Authenticated IPFS Upload to Live Pinata V3 API (Phase 9)
    // -------------------------------------------------------------------------
    const ipfsUploadRes = await request(app)
      .post("/api/ipfs/upload")
      .set("Authorization", `Bearer ${ownerJwt}`)
      .set("Content-Type", "application/octet-stream")
      .send(serializedPayload);

    assert.strictEqual(ipfsUploadRes.status, 200);
    assert.ok(ipfsUploadRes.body.cid, "Pinata V3 must return authentic CID");
    const authenticCid = ipfsUploadRes.body.cid;

    // -------------------------------------------------------------------------
    // STEP 6: Real Blockchain Registration (Phase 5 DocumentRegistry)
    // -------------------------------------------------------------------------
    const documentId = ethers.hexlify(ethers.randomBytes(32));

    await registerTestDocument(
      ownerWallet,
      documentId,
      docHashResult.bytes32,
      authenticCid
    );

    // -------------------------------------------------------------------------
    // STEP 7: Query Document Metadata API
    // -------------------------------------------------------------------------
    const docMetaRes = await request(app)
      .get(`/api/documents/${documentId}`)
      .set("Authorization", `Bearer ${ownerJwt}`);

    assert.strictEqual(docMetaRes.status, 200);
    assert.strictEqual(docMetaRes.body.id, documentId.toLowerCase());
    assert.strictEqual(docMetaRes.body.owner, ownerWallet.address.toLowerCase());
    assert.strictEqual(docMetaRes.body.cid, authenticCid);
    assert.strictEqual(docMetaRes.body.fileHash, docHashResult.bytes32.toLowerCase());
    assert.strictEqual(docMetaRes.body.revoked, false);
    assert.strictEqual(docMetaRes.body.isOwner, true);

    // -------------------------------------------------------------------------
    // STEP 8: Verifier Authentication Flow
    // -------------------------------------------------------------------------
    const verifierChal = await request(app)
      .post("/api/auth/challenge")
      .send({ address: verifierWallet.address });

    const verifierSig = await verifierWallet.signMessage(verifierChal.body.challenge);

    const verifierAuth = await request(app)
      .post("/api/auth/verify")
      .send({ address: verifierWallet.address, signature: verifierSig });

    assert.strictEqual(verifierAuth.status, 200);
    const verifierJwt = verifierAuth.body.token;

    // -------------------------------------------------------------------------
    // STEP 9: Verifier Access Control Validation (Pre-Grant: 403 Forbidden)
    // -------------------------------------------------------------------------
    const preGrantVerify = await request(app)
      .post("/api/verify")
      .set("Authorization", `Bearer ${verifierJwt}`)
      .send({
        documentId,
        candidateHash: docHashResult.hex,
      });

    assert.strictEqual(preGrantVerify.status, 403);
    assert.strictEqual(preGrantVerify.body.status, "UNAUTHORIZED");

    // -------------------------------------------------------------------------
    // STEP 10: AccessControl Grant Transaction (Phase 6)
    // -------------------------------------------------------------------------
    await grantTestAccess(ownerWallet, documentId, verifierWallet.address);

    // -------------------------------------------------------------------------
    // STEP 11: Authorized Verification Evaluation (Post-Grant: 200 VERIFIED)
    // -------------------------------------------------------------------------
    const postGrantVerify = await request(app)
      .post("/api/verify")
      .set("Authorization", `Bearer ${verifierJwt}`)
      .send({
        documentId,
        candidateHash: docHashResult.hex,
      });

    assert.strictEqual(postGrantVerify.status, 200);
    assert.strictEqual(postGrantVerify.body.status, "VERIFIED");
    assert.strictEqual(postGrantVerify.body.match, true);
    assert.strictEqual(postGrantVerify.body.revoked, false);
    assert.strictEqual(postGrantVerify.body.onChainHash.toLowerCase(), docHashResult.bytes32.toLowerCase());
    assert.ok(postGrantVerify.body.verificationDurationMs >= 0);

    // -------------------------------------------------------------------------
    // STEP 12: IPFS Retrieval & Decryption Roundtrip
    // -------------------------------------------------------------------------
    const ipfsDownloadRes = await request(app)
      .get(`/api/ipfs/${authenticCid}`)
      .set("Authorization", `Bearer ${verifierJwt}`)
      .responseType("blob");

    assert.strictEqual(ipfsDownloadRes.status, 200);
    const downloadedCiphertext = new Uint8Array(ipfsDownloadRes.body);

    // Decrypt using Phase 8 key
    const recoveredPlaintext = await decryptDocument(downloadedCiphertext, encryptionResult.key);
    assert.strictEqual(
      new TextDecoder().decode(recoveredPlaintext),
      new TextDecoder().decode(originalDocumentBytes),
      "Decrypted bytes from IPFS must equal original document bytes"
    );

    // -------------------------------------------------------------------------
    // STEP 13: Audit Trail Query & Lineage Verification
    // -------------------------------------------------------------------------
    const auditRes = await request(app)
      .get(`/api/audit/${documentId}`)
      .set("Authorization", `Bearer ${verifierJwt}`);

    assert.strictEqual(auditRes.status, 200);
    assert.strictEqual(auditRes.body.documentId, documentId.toLowerCase());
    assert.strictEqual(auditRes.body.events.length, 2);

    assert.strictEqual(auditRes.body.events[0].eventName, "DocumentRegistered");
    assert.strictEqual(auditRes.body.events[0].details.cid, authenticCid);
    assert.strictEqual(auditRes.body.events[0].details.fileHash, docHashResult.bytes32.toLowerCase());

    assert.strictEqual(auditRes.body.events[1].eventName, "AccessGranted");
    assert.strictEqual(auditRes.body.events[1].details.verifier.toLowerCase(), verifierWallet.address.toLowerCase());
  });
});
