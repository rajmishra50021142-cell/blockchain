/**
 * Phase 13: Real End-to-End Document Sharing & Access Revocation Workflow
 *
 * Executes the complete real multi-wallet sharing lifecycle:
 * 1. Owner registers document on DocumentRegistry.sol with real SHA-256 and IPFS upload.
 * 2. Initial state: Verifier hasAccess == false; Verifier GET /api/documents/:id -> 403 Forbidden.
 * 3. Owner executes real grantAccess transaction on AccessControl.sol.
 * 4. Mined receipt verified; post-grant on-chain state hasAccess == true.
 * 5. Verifier queries GET /api/documents/:id -> 200 OK (hasAccess: true).
 * 6. Audit endpoint verifies presence of real AccessGranted event.
 * 7. Owner executes real revokeAccess transaction on AccessControl.sol.
 * 8. Mined receipt verified; post-revoke on-chain state hasAccess == false.
 * 9. Verifier queries GET /api/documents/:id -> 403 Forbidden.
 * 10. Audit endpoint verifies presence of real AccessRevoked event in chronological order.
 *
 * CRITICAL RULE: Uses real Hardhat blockchain and live Express backend. Zero synthetic data.
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
} from "../lib/contracts/document-registry";
import {
  getAccessControlContract,
  grantAccessOnChain,
  revokeAccessOnChain,
  checkHasAccessOnChain,
} from "../lib/contracts/access-control";

// Standard Hardhat development keys
// Account #0 = Owner
const HARDHAT_ACC0_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
// Account #1 = Verifier
const HARDHAT_ACC1_KEY =
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

function getSigner(privateKey: string) {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545", undefined, {
    staticNetwork: ethers.Network.from(config.expectedChainId),
    cacheTimeout: -1,
  });
  return new ethers.Wallet(privateKey, provider);
}

describe("Phase 13: Complete End-to-End Document Sharing & Access Revocation", () => {
  it("should execute full multi-party grant, on-chain state transition, audit lineage, and revocation lifecycle", async () => {
    const ownerSigner = getSigner(HARDHAT_ACC0_KEY);
    const verifierSigner = getSigner(HARDHAT_ACC1_KEY);
    const ownerAddress = ownerSigner.address;
    const verifierAddress = verifierSigner.address;

    const apiClient = new ApiClient("http://127.0.0.1:3001");

    // -------------------------------------------------------------------------
    // STEP 1: Authenticate Owner with backend via EIP-191 challenge-response
    // -------------------------------------------------------------------------
    const ownerChallenge = await apiClient.getChallenge(ownerAddress);
    assert.ok(ownerChallenge.challenge, "Owner challenge must be returned");
    const ownerSignature = await ownerSigner.signMessage(ownerChallenge.challenge);
    const ownerVerify = await apiClient.verifySignature(ownerAddress, ownerSignature);
    const ownerToken = ownerVerify.token;
    assert.ok(ownerToken, "Owner session JWT must be issued");

    // -------------------------------------------------------------------------
    // STEP 2: Authenticate Verifier with backend via EIP-191 challenge-response
    // -------------------------------------------------------------------------
    const verifierChallenge = await apiClient.getChallenge(verifierAddress);
    assert.ok(verifierChallenge.challenge, "Verifier challenge must be returned");
    const verifierSignature = await verifierSigner.signMessage(verifierChallenge.challenge);
    const verifierVerify = await apiClient.verifySignature(verifierAddress, verifierSignature);
    const verifierToken = verifierVerify.token;
    assert.ok(verifierToken, "Verifier session JWT must be issued");

    // -------------------------------------------------------------------------
    // STEP 3: Create, hash, encrypt and register a real document as Owner
    // -------------------------------------------------------------------------
    const documentContent = `Confidential Audit Agreement - ${Date.now()}`;
    const rawBytes = new TextEncoder().encode(documentContent);
    const { bytes32: documentHash } = await hashDocument(rawBytes);
    const { serialized } = await encryptDocument(rawBytes);

    // Upload encrypted payload to Pinata IPFS via backend relay
    const ipfsUploadRes = await apiClient.uploadIpfsPayload(
      serialized,
      `agreement-${Date.now()}.enc`,
      ownerToken
    );
    const ipfsCid = ipfsUploadRes.cid;
    assert.ok(ipfsCid, "Authentic IPFS CID must be returned");

    // Register on DocumentRegistry.sol
    const documentId = ethers.hexlify(ethers.randomBytes(32));
    const docRegistry = getDocumentRegistryContract(ownerSigner);
    const regTx = await docRegistry.registerDocument(documentId, documentHash, ipfsCid);
    const regReceipt = await regTx.wait(1);
    assert.equal(regReceipt?.status, 1, "Document registration transaction must confirm");

    // -------------------------------------------------------------------------
    // STEP 4: Initial State Checks (Before Grant)
    // -------------------------------------------------------------------------
    const provider = ownerSigner.provider!;
    const initialHasAccess = await checkHasAccessOnChain(
      provider,
      documentId,
      verifierAddress
    );
    assert.equal(initialHasAccess, false, "Initial hasAccess must be false");

    // Verifier queries document via backend: must fail with 403 ACCESS_DENIED
    await assert.rejects(
      async () => {
        await apiClient.getDocument(documentId, verifierToken);
      },
      (err: any) => {
        return (err.status === 403 || err.statusCode === 403) && err.code === "ACCESS_DENIED";
      },
      "Unauthorized verifier must receive 403 ACCESS_DENIED"
    );

    // -------------------------------------------------------------------------
    // STEP 5: Owner grants access to Verifier via AccessControl.sol
    // -------------------------------------------------------------------------
    const grantReceipt = await grantAccessOnChain(
      ownerSigner,
      documentId,
      verifierAddress
    );
    assert.equal(grantReceipt.status, 1, "Grant transaction must be confirmed on-chain");
    assert.ok(grantReceipt.hash, "Real grant transaction hash must be present");
    assert.ok(grantReceipt.blockNumber > 0, "Real mined block number must be present");

    // -------------------------------------------------------------------------
    // STEP 6: Post-Grant On-Chain State Verification
    // -------------------------------------------------------------------------
    const postGrantHasAccess = await checkHasAccessOnChain(
      provider,
      documentId,
      verifierAddress
    );
    assert.equal(postGrantHasAccess, true, "Post-grant hasAccess must be true on-chain");

    // -------------------------------------------------------------------------
    // STEP 7: Verifier now queries GET /api/documents/:id -> 200 OK (hasAccess: true)
    // -------------------------------------------------------------------------
    const verifierDocView = await apiClient.getDocument(documentId, verifierToken);
    assert.equal(verifierDocView.id, documentId.toLowerCase());
    assert.equal(verifierDocView.owner, ownerAddress.toLowerCase());
    assert.equal(verifierDocView.isOwner, false, "Verifier is not document owner");
    assert.equal(verifierDocView.hasAccess, true, "Verifier hasAccess must be true");

    // -------------------------------------------------------------------------
    // STEP 8: Verify Audit Trail contains AccessGranted event
    // -------------------------------------------------------------------------
    const auditAfterGrant = await apiClient.getAuditTrail(documentId, ownerToken);
    const grantEvent = auditAfterGrant.events?.find(
      (e) => e.eventName === "AccessGranted"
    );
    assert.ok(grantEvent, "AccessGranted event must exist in audit trail");
    assert.equal(
      grantEvent.actor.toLowerCase(),
      ownerAddress.toLowerCase(),
      "Grant event actor must be owner"
    );
    assert.equal(
      (grantEvent.details?.verifier as string)?.toLowerCase(),
      verifierAddress.toLowerCase(),
      "Grant event details must contain verifier address"
    );
    assert.equal(
      grantEvent.transactionHash,
      grantReceipt.hash,
      "Audit event txHash must match grant receipt"
    );

    // -------------------------------------------------------------------------
    // STEP 9: Owner revokes access from Verifier via AccessControl.sol
    // -------------------------------------------------------------------------
    const revokeReceipt = await revokeAccessOnChain(
      ownerSigner,
      documentId,
      verifierAddress
    );
    assert.equal(revokeReceipt.status, 1, "Revoke transaction must be confirmed on-chain");
    assert.ok(revokeReceipt.hash, "Real revoke transaction hash must be present");

    // -------------------------------------------------------------------------
    // STEP 10: Post-Revoke On-Chain State Verification
    // -------------------------------------------------------------------------
    const postRevokeHasAccess = await checkHasAccessOnChain(
      provider,
      documentId,
      verifierAddress
    );
    assert.equal(postRevokeHasAccess, false, "Post-revoke hasAccess must be false on-chain");

    // -------------------------------------------------------------------------
    // STEP 11: Verifier queries GET /api/documents/:id -> 403 Forbidden
    // -------------------------------------------------------------------------
    await assert.rejects(
      async () => {
        await apiClient.getDocument(documentId, verifierToken);
      },
      (err: any) => {
        return (err.status === 403 || err.statusCode === 403) && err.code === "ACCESS_DENIED";
      },
      "Revoked verifier must receive 403 ACCESS_DENIED"
    );

    // -------------------------------------------------------------------------
    // STEP 12: Verify Audit Trail contains AccessRevoked event in chronological order
    // -------------------------------------------------------------------------
    const auditAfterRevoke = await apiClient.getAuditTrail(documentId, ownerToken);
    const events = auditAfterRevoke.events || [];

    const regEvent = events.find((e) => e.eventName === "DocumentRegistered");
    const foundGrant = events.find((e) => e.eventName === "AccessGranted");
    const foundRevoke = events.find((e) => e.eventName === "AccessRevoked");

    assert.ok(regEvent, "DocumentRegistered event must exist");
    assert.ok(foundGrant, "AccessGranted event must exist");
    assert.ok(foundRevoke, "AccessRevoked event must exist");

    // Check chronological ordering
    const regIdx = events.indexOf(regEvent);
    const grantIdx = events.indexOf(foundGrant);
    const revokeIdx = events.indexOf(foundRevoke);

    assert.ok(regIdx < grantIdx, "DocumentRegistered must precede AccessGranted");
    assert.ok(grantIdx < revokeIdx, "AccessGranted must precede AccessRevoked");
    assert.equal(
      foundRevoke.transactionHash,
      revokeReceipt.hash,
      "Revoke audit event txHash must match revoke receipt"
    );
  });
});
