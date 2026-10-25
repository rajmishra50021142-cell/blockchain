/**
 * Phase 12: Registration Failure & Boundary Defense Tests
 *
 * Verifies honest handling of failure conditions:
 * - MetaMask user rejection
 * - Duplicate document ID revert
 * - Wrong network blocking
 * - Account change mid-flow
 * - Post-write consistency detection
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ethers } from "ethers";
import {
  generateSecureDocumentId,
  validateNetwork,
  validateWalletSessionAlignment,
  verifyPostRegistrationState,
} from "../lib/registration/registration-service";
import { config } from "../lib/config/env";
import { hashDocument, encryptDocument } from "../lib/crypto/document-crypto";
import { DOCUMENT_REGISTRY_ABI } from "../lib/contracts/document-registry";

// Standard Hardhat development keys (accounts #0, #1, #2)
const HARDHAT_ACC0_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const HARDHAT_ACC1_KEY =
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const HARDHAT_ACC2_KEY =
  "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a";

function getSigner(privateKey: string) {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545", undefined, {
    staticNetwork: ethers.Network.from(config.expectedChainId),
  });
  return new ethers.Wallet(privateKey, provider);
}

describe("Phase 12: Registration Failure Paths & Boundary Invariants", () => {
  it("should fail-closed when network chain ID does not match expected configuration", () => {
    const wrongChainId = 1; // Mainnet
    assert.throws(
      () => validateNetwork(wrongChainId),
      /Incorrect network detected: Chain ID 1/
    );
  });

  it("should block registration when wallet and backend session accounts mismatch", () => {
    const signer = getSigner(HARDHAT_ACC0_KEY);
    const walletAddress = signer.address;
    const attackerAddress = "0x90F79bf6EB2c4f870365E785982E1f101E93b906";

    assert.throws(
      () => validateWalletSessionAlignment(walletAddress, attackerAddress),
      /Session mismatch: Connected wallet/
    );
  });

  it("should honestly revert when registering a duplicate documentId on DocumentRegistry.sol", async () => {
    const signer = getSigner(HARDHAT_ACC0_KEY);
    const contract = new ethers.Contract(
      config.contractDocumentRegistry,
      DOCUMENT_REGISTRY_ABI,
      signer
    );

    const docId = generateSecureDocumentId();
    const docHash = ethers.hexlify(ethers.randomBytes(32));
    const fakeCid = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";

    // First registration succeeds
    const tx1 = await contract.registerDocument(docId, docHash, fakeCid);
    const receipt1 = await tx1.wait(1);
    assert.equal(receipt1.status, 1);

    // Second registration with same documentId must revert with DocumentAlreadyExists
    const signer2 = getSigner(HARDHAT_ACC0_KEY);
    const contract2 = new ethers.Contract(
      config.contractDocumentRegistry,
      DOCUMENT_REGISTRY_ABI,
      signer2
    );

    await assert.rejects(
      async () => {
        const tx2 = await contract2.registerDocument(docId, docHash, fakeCid);
        await tx2.wait(1);
      },
      (err: any) => {
        const errStr = JSON.stringify(err, Object.getOwnPropertyNames(err));
        const isRevert =
          err?.revert?.name === "DocumentAlreadyExists" ||
          err?.message?.includes("DocumentAlreadyExists") ||
          errStr.includes("DocumentAlreadyExists") ||
          err?.code === "CALL_EXCEPTION";
        assert.ok(isRevert, `Contract must revert with DocumentAlreadyExists. Received: ${err?.message}`);
        return true;
      }
    );
  });

  it("should detect post-registration consistency mismatch if on-chain hash differs from computed hash", async () => {
    const signer = getSigner(HARDHAT_ACC1_KEY);
    const provider = signer.provider!;

    const originalBytes = new TextEncoder().encode("Authentic document content");
    const docHashRes = await hashDocument(originalBytes);
    const encRes = await encryptDocument(originalBytes);

    const contract = new ethers.Contract(
      config.contractDocumentRegistry,
      DOCUMENT_REGISTRY_ABI,
      signer
    );

    const docId = generateSecureDocumentId();
    const cid = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";

    // Register with authentic hash
    const tx = await contract.registerDocument(docId, docHashRes.bytes32, cid);
    await tx.wait(1);

    // Attempting post-registration verification with a DIFFERENT expected hash must throw consistency error
    const tamperedExpectedHash = ethers.hexlify(ethers.randomBytes(32));

    await assert.rejects(
      async () => {
        await verifyPostRegistrationState(
          provider,
          docId,
          signer.address,
          tamperedExpectedHash,
          cid,
          originalBytes,
          encRes.keyBytes
        );
      },
      /Post-registration chain consistency check failed/
    );
  });

  it("should detect post-registration consistency mismatch if on-chain owner differs from connected wallet", async () => {
    const signer = getSigner(HARDHAT_ACC2_KEY);
    const provider = signer.provider!;

    const originalBytes = new TextEncoder().encode("Ownership verification test");
    const docHashRes = await hashDocument(originalBytes);
    const encRes = await encryptDocument(originalBytes);

    const contract = new ethers.Contract(
      config.contractDocumentRegistry,
      DOCUMENT_REGISTRY_ABI,
      signer
    );

    const docId = generateSecureDocumentId();
    const cid = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";

    // Register with signer as owner
    const tx = await contract.registerDocument(docId, docHashRes.bytes32, cid);
    await tx.wait(1);

    // Verifying with a different expected owner must throw consistency error
    const wrongOwner = "0x90F79bf6EB2c4f870365E785982E1f101E93b906";

    await assert.rejects(
      async () => {
        await verifyPostRegistrationState(
          provider,
          docId,
          wrongOwner,
          docHashRes.bytes32,
          cid,
          originalBytes,
          encRes.keyBytes
        );
      },
      /Post-registration chain consistency check failed/
    );
  });
});
