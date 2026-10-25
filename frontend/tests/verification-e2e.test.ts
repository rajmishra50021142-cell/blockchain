/**
 * Phase 14: Real End-to-End Document Verification & Tamper Detection Workflow
 *
 * Executes the complete verification lifecycle against live Hardhat blockchain and live backend:
 * 1. Owner registers real document on DocumentRegistry.sol with real SHA-256 and IPFS upload.
 * 2. Owner grants access to Verifier on AccessControl.sol.
 * 3. Exact candidate file verification by Owner -> VERIFIED (match: true, revoked: false).
 * 4. Exact candidate file verification by Verifier -> VERIFIED (match: true, revoked: false).
 * 5. One-byte mutated candidate file verification -> TAMPER_DETECTED (match: false).
 * 6. Completely different candidate file -> TAMPER_DETECTED (match: false).
 * 7. Unauthorized stranger wallet attempt -> UNAUTHORIZED (HTTP 403 Access Denied).
 * 8. Stored-object cryptographic audit with authentic key -> IPFS download -> AES-256-GCM decrypt -> SHA-256 matches on-chain hash.
 * 9. Stored-object cryptographic audit with mutated ciphertext -> DECRYPTION_FAILED.
 * 10. Owner revokes document on DocumentRegistry.sol -> verification returns REVOKED.
 *
 * CRITICAL RULE: Uses real Hardhat blockchain, live Express backend, and real Web Crypto. Zero synthetic data.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ethers } from "ethers";
import { config } from "../lib/config/env";
import { ApiClient } from "../lib/api/client";
import {
  hashDocument,
  encryptDocument,
} from "../lib/crypto/document-crypto";
import {
  getDocumentRegistryContract,
  registerDocumentOnChain,
  revokeDocumentOnChain,
} from "../lib/contracts/document-registry";
import {
  getAccessControlContract,
  grantAccessOnChain,
} from "../lib/contracts/access-control";
import {
  verifyStoredObjectCiphertext,
} from "../lib/verification/verification-service";

// Standard Hardhat development keys
// Account #0 = Owner
const HARDHAT_ACC0_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
// Account #1 = Verifier
const HARDHAT_ACC1_KEY =
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
// Account #2 = Unauthorized Stranger
const HARDHAT_ACC2_KEY =
  "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a";

function getSigner(privateKey: string) {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545", undefined, {
    staticNetwork: ethers.Network.from(config.expectedChainId),
    cacheTimeout: -1,
  });
  return new ethers.Wallet(privateKey, provider);
}

async function authenticateWallet(client: ApiClient, signer: ethers.Wallet) {
  const challengeRes = await client.getChallenge(signer.address);
  const signature = await signer.signMessage(challengeRes.challenge);
  const verifyRes = await client.verifySignature(signer.address, signature);
  return verifyRes.token;
}

describe("Phase 14: Complete End-to-End Document Verification & Tamper Detection", () => {
  it("should execute the complete authentic candidate and stored-object verification lifecycle", async () => {
    const ownerSigner = getSigner(HARDHAT_ACC0_KEY);
    const verifierSigner = getSigner(HARDHAT_ACC1_KEY);
    const strangerSigner = getSigner(HARDHAT_ACC2_KEY);

    const client = new ApiClient(config.apiBaseUrl);

    // 1. Authenticate wallets with live backend
    const ownerToken = await authenticateWallet(client, ownerSigner);
    const verifierToken = await authenticateWallet(client, verifierSigner);
    const strangerToken = await authenticateWallet(client, strangerSigner);

    // 2. Prepare real document: Plaintext bytes -> SHA-256 -> AES-256-GCM -> IPFS upload
    const originalFileBytes = new TextEncoder().encode(
      "CONFIDENTIAL ASSET ACQUISITION AGREEMENT #E2E-PHASE-14\n" +
      "Timestamp: " + new Date().toISOString() + "\n" +
      "Amount: $15,500,000 USD\n" +
      "Authoritative Sovereign Document."
    );

    const hashRes = await hashDocument(originalFileBytes);
    const originalHash = hashRes.bytes32;

    const encryptionRes = await encryptDocument(originalFileBytes);
    const serializedCiphertext = encryptionRes.serialized;
    const encryptionKeyBytes = encryptionRes.keyBytes;

    client.setAuthToken(ownerToken);
    const uploadRes = await client.uploadIpfsPayload(
      serializedCiphertext,
      "AssetAcquisitionAgreement.docx"
    );
    assert.ok(uploadRes.cid, "Must receive authentic IPFS CID");
    const docCid = uploadRes.cid;

    // 3. Register document on live DocumentRegistry.sol
    const docId = ethers.hexlify(ethers.randomBytes(32));
    const regReceipt = await registerDocumentOnChain(
      ownerSigner,
      docId,
      originalHash,
      docCid
    );
    assert.ok(regReceipt.status === 1, "Document registration transaction must succeed");

    // 4. Grant access to Verifier on live AccessControl.sol
    const grantReceipt = await grantAccessOnChain(
      ownerSigner,
      docId,
      verifierSigner.address
    );
    assert.ok(grantReceipt.status === 1, "Access grant transaction must succeed");

    // --- STEP 1: Owner verifies exact original file ---
    client.setAuthToken(ownerToken);
    const ownerVerifyRes = await client.verifyDocument(docId, originalHash);
    assert.equal(ownerVerifyRes.status, "VERIFIED");
    assert.equal(ownerVerifyRes.match, true);
    assert.equal(ownerVerifyRes.revoked, false);
    assert.equal(ownerVerifyRes.owner?.toLowerCase(), ownerSigner.address.toLowerCase());
    assert.equal(ownerVerifyRes.candidateHash.toLowerCase(), originalHash.toLowerCase());
    assert.equal(ownerVerifyRes.onChainHash?.toLowerCase(), originalHash.toLowerCase());
    assert.equal(ownerVerifyRes.cid, docCid);

    // --- STEP 2: Granted Verifier verifies exact original file ---
    client.setAuthToken(verifierToken);
    const verifierVerifyRes = await client.verifyDocument(docId, originalHash);
    assert.equal(verifierVerifyRes.status, "VERIFIED");
    assert.equal(verifierVerifyRes.match, true);
    assert.equal(verifierVerifyRes.revoked, false);

    // --- STEP 3: One-byte mutated file -> TAMPER_DETECTED ---
    const mutatedBytes = new Uint8Array(originalFileBytes);
    mutatedBytes[mutatedBytes.length - 2] ^= 0x01; // subtle bit flip in plaintext
    const mutatedHashRes = await hashDocument(mutatedBytes);
    const mutatedHash = mutatedHashRes.bytes32;

    const tamperRes = await client.verifyDocument(docId, mutatedHash);
    assert.equal(tamperRes.status, "TAMPER_DETECTED");
    assert.equal(tamperRes.match, false);
    assert.equal(tamperRes.candidateHash.toLowerCase(), mutatedHash.toLowerCase());
    assert.equal(tamperRes.onChainHash?.toLowerCase(), originalHash.toLowerCase());
    assert.notEqual(tamperRes.candidateHash, tamperRes.onChainHash);

    // --- STEP 4: Completely different document -> TAMPER_DETECTED ---
    const differentBytes = new TextEncoder().encode("Completely unrelated document content");
    const differentHashRes = await hashDocument(differentBytes);

    const differentRes = await client.verifyDocument(docId, differentHashRes.bytes32);
    assert.equal(differentRes.status, "TAMPER_DETECTED");
    assert.equal(differentRes.match, false);

    // --- STEP 5: Unauthorized stranger attempts verification -> 403 UNAUTHORIZED ---
    client.setAuthToken(strangerToken);
    await assert.rejects(
      async () => {
        await client.verifyDocument(docId, originalHash);
      },
      (err: any) => {
        assert.equal(err.status, 403);
        assert.equal(err.code, "ACCESS_DENIED");
        return true;
      }
    );

    // --- STEP 6: Stored-Object Cryptographic Verification with Owner's Authentic Key ---
    client.setAuthToken(ownerToken);
    const storedAuditResult = await verifyStoredObjectCiphertext(
      docCid,
      encryptionKeyBytes,
      originalHash,
      (cid) => client.downloadIpfsPayload(cid)
    );

    assert.equal(storedAuditResult.attempted, true);
    assert.equal(storedAuditResult.status, "SUCCESS");
    assert.equal(storedAuditResult.matchesOnChainHash, true);
    assert.equal(storedAuditResult.recoveredPlaintextLength, originalFileBytes.length);
    assert.equal(storedAuditResult.computedHash?.toLowerCase(), originalHash.toLowerCase());

    // --- STEP 7: Stored-Object Audit with Tampered Ciphertext -> DECRYPTION_FAILED ---
    const tamperedCiphertextAudit = await verifyStoredObjectCiphertext(
      docCid,
      encryptionKeyBytes,
      originalHash,
      async (cid) => {
        const authentic = await client.downloadIpfsPayload(cid);
        const tampered = new Uint8Array(authentic);
        tampered[tampered.length - 3] ^= 0xff; // corrupt tag / ciphertext byte
        return tampered;
      }
    );

    assert.equal(tamperedCiphertextAudit.attempted, true);
    assert.equal(tamperedCiphertextAudit.status, "DECRYPTION_FAILED");
    assert.ok(tamperedCiphertextAudit.error?.includes("AES-256-GCM authentication failed"));

    // --- STEP 8: Owner revokes document on-chain -> verification returns REVOKED ---
    const revokeReceipt = await revokeDocumentOnChain(ownerSigner, docId);
    assert.ok(revokeReceipt.status === 1, "Revoke transaction must succeed");

    client.setAuthToken(verifierToken);
    const postRevokeRes = await client.verifyDocument(docId, originalHash);
    assert.equal(postRevokeRes.status, "REVOKED");
    assert.equal(postRevokeRes.revoked, true);
    assert.equal(postRevokeRes.match, true);
    assert.notEqual(postRevokeRes.status, "VERIFIED");
  });
});
