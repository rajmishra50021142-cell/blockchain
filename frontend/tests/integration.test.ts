/**
 * Phase 11: Real Frontend-to-Backend-to-Blockchain Integration Tests
 *
 * Validates real communication:
 * Next.js ApiClient -> Node/Express Backend -> Hardhat EVM Node -> DocumentRegistry & AccessControl
 *
 * CRITICAL RULE: Real runtime data only. Zero mock CIDs, zero synthetic fallbacks.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ethers } from "ethers";
import { ApiClient } from "../lib/api/client";
import { config } from "../lib/config/env";

const RPC_URL = "http://127.0.0.1:8545";
const BACKEND_URL = "http://127.0.0.1:3001";

// Hardhat standard test account #0
const HARDHAT_ACC0_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const DOCUMENT_REGISTRY_ABI = [
  "function registerDocument(bytes32 documentId, bytes32 documentHash, string calldata ipfsCid) external",
  "function getDocument(bytes32 documentId) external view returns (tuple(bytes32 documentId, address owner, bytes32 documentHash, string ipfsCid, uint256 registrationTime, bool isRevoked))",
  "event DocumentRegistered(bytes32 indexed documentId, address indexed owner, bytes32 documentHash, string ipfsCid, uint256 timestamp)",
];

describe("Phase 11: Real Frontend-to-Backend-to-Blockchain Integration", () => {
  const client = new ApiClient(BACKEND_URL);
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(HARDHAT_ACC0_PRIVATE_KEY, provider);

  it("should communicate with real backend /health and /ready endpoints", async () => {
    const health = await client.getHealth();
    assert.equal(health.status, "ok");
    assert(health.uptime >= 0);

    const ready = await client.getReady();
    assert.equal(ready.status, "ready");
    assert.equal(ready.blockchain?.chainId, config.expectedChainId);
    assert.equal(ready.ipfs?.configured, true);
  });

  it("should execute real wallet-challenge-response authentication flow", async () => {
    const address = await signer.getAddress();

    // 1. Request authentic challenge
    const challengeRes = await client.getChallenge(address);
    assert(challengeRes.challenge.includes(address));
    assert(challengeRes.nonce.length > 10);

    // 2. Sign authentic challenge with real EIP-191 personal signature
    const signature = await signer.signMessage(challengeRes.challenge);
    assert(signature.startsWith("0x"));

    // 3. Verify signature with backend and receive authentic JWT
    const verifyRes = await client.verifySignature(address, signature);
    assert(verifyRes.token.length > 20);
    assert.equal(verifyRes.address.toLowerCase(), address.toLowerCase());

    // 4. Assert client configured with JWT
    assert.equal(client.getAuthToken(), verifyRes.token);
  });

  it("should interact with live DocumentRegistry and query live state through ApiClient", async () => {
    const registryAddress = config.contractDocumentRegistry;
    const registry = new ethers.Contract(registryAddress, DOCUMENT_REGISTRY_ABI, signer);

    // Generate unique document identifiers
    const randomEntropy = ethers.hexlify(ethers.randomBytes(32));
    const testDocId = ethers.keccak256(ethers.toUtf8Bytes(`phase11-doc-${Date.now()}-${randomEntropy}`));
    const testDocHash = ethers.keccak256(ethers.toUtf8Bytes(`plaintext-content-${Date.now()}`));
    const testCid = "bafkreib3m3z6vff2v526x3x74gskgwh2e4w3a4h4v7rkm7qf6655cvr5ye";

    // Register document on-chain directly via real transaction
    const tx = await registry.registerDocument(testDocId, testDocHash, testCid);
    const receipt = await tx.wait(1);
    assert.equal(receipt.status, 1);

    // Authenticate with backend API
    const address = await signer.getAddress();
    const challengeRes = await client.getChallenge(address);
    const signature = await signer.signMessage(challengeRes.challenge);
    const authRes = await client.verifySignature(address, signature);

    // 1. Query document inventory
    const docsRes = await client.getDocuments(authRes.token);
    assert(Array.isArray(docsRes.documents));
    const registeredDoc = docsRes.documents.find((d) => d.id.toLowerCase() === testDocId.toLowerCase());
    assert(registeredDoc, "Newly registered document must be returned in caller document list");
    assert.equal(registeredDoc.owner.toLowerCase(), address.toLowerCase());

    // 2. Query document detail metadata
    const detailRes = await client.getDocument(testDocId, authRes.token);
    assert.equal(detailRes.id.toLowerCase(), testDocId.toLowerCase());
    assert.equal(detailRes.isOwner, true);
    assert.equal(detailRes.revoked, false);

    // 3. Verify valid candidate hash
    const matchVerification = await client.verifyDocument(testDocId, testDocHash, authRes.token);
    assert.equal(matchVerification.status, "VERIFIED");
    assert.equal(matchVerification.match, true);
    assert.equal(matchVerification.revoked, false);
    const latency = matchVerification.verificationDurationMs ?? matchVerification.executionLatencyMs;
    assert(latency !== undefined && latency >= 0);

    // 4. Verify tampered candidate hash
    const fakeHash = ethers.keccak256(ethers.toUtf8Bytes("corrupted-tampered-data"));
    const tamperVerification = await client.verifyDocument(testDocId, fakeHash, authRes.token);
    assert.equal(tamperVerification.status, "TAMPER_DETECTED");
    assert.equal(tamperVerification.match, false);

    // 5. Query on-chain audit trail
    const auditRes = await client.getAuditTrail(testDocId, authRes.token);
    assert.equal(auditRes.documentId.toLowerCase(), testDocId.toLowerCase());
    const auditEvents = auditRes.events || auditRes.auditTrail || [];
    assert(auditEvents.length >= 1);
    assert.equal(auditEvents[0].eventName, "DocumentRegistered");
    assert.equal(auditEvents[0].actor.toLowerCase(), address.toLowerCase());
    assert.equal(auditEvents[0].transactionHash.toLowerCase(), receipt.hash.toLowerCase());
  });
});
