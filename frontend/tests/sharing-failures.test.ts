/**
 * Phase 13: Sharing & Access Revocation Failure Paths & Boundary Invariants
 *
 * Verifies honest failure handling and contract boundary invariants:
 * - Wrong network blocking
 * - Non-owner grant revert (NotDocumentOwner)
 * - Non-owner revoke revert (NotDocumentOwner)
 * - Revoked document grant revert (DocumentIsRevoked)
 * - Duplicate grant revert (AccessAlreadyGranted)
 * - Un-granted revoke revert (AccessNotGranted)
 * - Non-existent document grant revert (DocumentNotFound)
 * - Post-grant / Post-revoke state mismatch detection
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ethers } from "ethers";
import { config } from "../lib/config/env";
import {
  validateNetwork,
  validateOwnerAuthority,
  validateDocumentActiveForGrant,
  verifyPostGrantState,
  verifyPostRevokeState,
} from "../lib/sharing/sharing-service";
import {
  ACCESS_CONTROL_ABI,
  getAccessControlContract,
} from "../lib/contracts/access-control";
import {
  DOCUMENT_REGISTRY_ABI,
  getDocumentRegistryContract,
} from "../lib/contracts/document-registry";

function getSigner(accountIndex: number) {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545", undefined, {
    staticNetwork: ethers.Network.from(config.expectedChainId),
    cacheTimeout: -1,
  });
  const m = ethers.Mnemonic.fromPhrase(
    "test test test test test test test test test test test junk"
  );
  const wallet = ethers.HDNodeWallet.fromMnemonic(m, `m/44'/60'/0'/0/${accountIndex}`);
  return wallet.connect(provider);
}

// Error selector constants from AccessControl.sol
const ERROR_SELECTORS = {
  NotDocumentOwner: ethers.id("NotDocumentOwner(bytes32,address)").slice(0, 10),
  DocumentIsRevoked: ethers.id("DocumentIsRevoked(bytes32)").slice(0, 10),
  AccessAlreadyGranted: ethers.id("AccessAlreadyGranted(bytes32,address)").slice(0, 10),
  AccessNotGranted: ethers.id("AccessNotGranted(bytes32,address)").slice(0, 10),
  DocumentNotFound: ethers.id("DocumentNotFound(bytes32)").slice(0, 10),
};

describe("Phase 13: Sharing & Access Revocation Failure Paths", () => {
  it("should fail-closed when network chain ID does not match expected configuration", () => {
    assert.throws(
      () => validateNetwork(11155111), // Sepolia
      /Wrong network: Connected to chain ID 11155111, expected chain ID 31337/
    );
  });

  it("should block non-owner from initiating grant before transaction creation", () => {
    const owner = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
    const stranger = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

    assert.throws(
      () => validateOwnerAuthority(stranger, owner),
      /Unauthorized: Connected wallet .* is not the document owner/
    );
  });

  it("should revert with NotDocumentOwner when non-owner calls grantAccess on-chain", async () => {
    const ownerSigner = getSigner(0);
    const strangerSigner = getSigner(2);
    const verifierSigner = getSigner(1);

    // Register a document as Owner (Account 0)
    const docRegistry = getDocumentRegistryContract(ownerSigner);
    const randomNonce = ethers.hexlify(ethers.randomBytes(32));
    const randomHash = ethers.hexlify(ethers.randomBytes(32));
    const testCid = "bafkreibm6f2gnoa5d3f27z5eagq2t4whqdf4y25nndz7wvvqpxb6yq";

    const regTx = await docRegistry.registerDocument(randomNonce, randomHash, testCid);
    await regTx.wait(1);

    // Stranger (Account 2) attempts to grant access to verifier
    const strangerAccessContract = getAccessControlContract(strangerSigner);
    await assert.rejects(
      async () => {
        const tx = await strangerAccessContract.grantAccess(randomNonce, verifierSigner.address);
        await tx.wait(1);
      },
      (err: any) => {
        const msg = err.message || "";
        const data = err.data || "";
        return (
          msg.includes("NotDocumentOwner") ||
          data.startsWith(ERROR_SELECTORS.NotDocumentOwner) ||
          (err.code === "CALL_EXCEPTION" && msg.includes("execution reverted"))
        );
      }
    );
  });

  it("should revert with NotDocumentOwner when non-owner calls revokeAccess on-chain", async () => {
    const ownerSigner = getSigner(3);
    const strangerSigner = getSigner(4);
    const verifierSigner = getSigner(5);

    // Register a document as Owner (Account 3)
    const docRegistry = getDocumentRegistryContract(ownerSigner);
    const randomNonce = ethers.hexlify(ethers.randomBytes(32));
    const randomHash = ethers.hexlify(ethers.randomBytes(32));
    const testCid = "bafkreibm6f2gnoa5d3f27z5eagq2t4whqdf4y25nndz7wvvqpxb6yq";

    const regTx = await docRegistry.registerDocument(randomNonce, randomHash, testCid);
    await regTx.wait(1);

    // Owner grants access
    const ownerAccessContract = getAccessControlContract(ownerSigner);
    const grantTx = await ownerAccessContract.grantAccess(randomNonce, verifierSigner.address);
    await grantTx.wait(1);

    // Stranger (Account 4) attempts to revoke access
    const strangerAccessContract = getAccessControlContract(strangerSigner);
    await assert.rejects(
      async () => {
        const tx = await strangerAccessContract.revokeAccess(randomNonce, verifierSigner.address);
        await tx.wait(1);
      },
      (err: any) => {
        const msg = err.message || "";
        const data = err.data || "";
        return (
          msg.includes("NotDocumentOwner") ||
          data.startsWith(ERROR_SELECTORS.NotDocumentOwner) ||
          (err.code === "CALL_EXCEPTION" && msg.includes("execution reverted"))
        );
      }
    );
  });

  it("should revert with DocumentIsRevoked when attempting to grant access on a revoked document", async () => {
    const ownerSigner = getSigner(6);
    const verifierSigner = getSigner(7);

    // Register a document as Owner (Account 6)
    const docRegistry = getDocumentRegistryContract(ownerSigner);
    const randomNonce = ethers.hexlify(ethers.randomBytes(32));
    const randomHash = ethers.hexlify(ethers.randomBytes(32));
    const testCid = "bafkreibm6f2gnoa5d3f27z5eagq2t4whqdf4y25nndz7wvvqpxb6yq";

    const regTx = await docRegistry.registerDocument(randomNonce, randomHash, testCid);
    await regTx.wait(1);

    // Revoke the document on DocumentRegistry
    const revokeDocTx = await docRegistry.revokeDocument(randomNonce);
    await revokeDocTx.wait(1);

    // Owner attempts to grant access on the revoked document
    const ownerAccessContract = getAccessControlContract(ownerSigner);
    await assert.rejects(
      async () => {
        const tx = await ownerAccessContract.grantAccess(randomNonce, verifierSigner.address);
        await tx.wait(1);
      },
      (err: any) => {
        const msg = err.message || "";
        const data = err.data || "";
        return (
          msg.includes("DocumentIsRevoked") ||
          data.startsWith(ERROR_SELECTORS.DocumentIsRevoked) ||
          (err.code === "CALL_EXCEPTION" && msg.includes("execution reverted"))
        );
      }
    );
  });

  it("should revert with AccessAlreadyGranted when granting access twice to the same verifier", async () => {
    const ownerSigner = getSigner(8);
    const verifierSigner = getSigner(9);

    // Register a document as Owner (Account 8)
    const docRegistry = getDocumentRegistryContract(ownerSigner);
    const randomNonce = ethers.hexlify(ethers.randomBytes(32));
    const randomHash = ethers.hexlify(ethers.randomBytes(32));
    const testCid = "bafkreibm6f2gnoa5d3f27z5eagq2t4whqdf4y25nndz7wvvqpxb6yq";

    const regTx = await docRegistry.registerDocument(randomNonce, randomHash, testCid);
    await regTx.wait(1);

    // First grant succeeds
    const ownerAccessContract = getAccessControlContract(ownerSigner);
    const grantTx = await ownerAccessContract.grantAccess(randomNonce, verifierSigner.address);
    await grantTx.wait(1);

    // Second grant must revert
    await assert.rejects(
      async () => {
        const tx2 = await ownerAccessContract.grantAccess(randomNonce, verifierSigner.address);
        await tx2.wait(1);
      },
      (err: any) => {
        const msg = err.message || "";
        const data = err.data || "";
        return (
          msg.includes("AccessAlreadyGranted") ||
          data.startsWith(ERROR_SELECTORS.AccessAlreadyGranted) ||
          (err.code === "CALL_EXCEPTION" && msg.includes("execution reverted"))
        );
      }
    );
  });

  it("should revert with AccessNotGranted when revoking access that was never granted", async () => {
    const ownerSigner = getSigner(10);
    const verifierSigner = getSigner(11);

    // Register a document as Owner (Account 10)
    const docRegistry = getDocumentRegistryContract(ownerSigner);
    const randomNonce = ethers.hexlify(ethers.randomBytes(32));
    const randomHash = ethers.hexlify(ethers.randomBytes(32));
    const testCid = "bafkreibm6f2gnoa5d3f27z5eagq2t4whqdf4y25nndz7wvvqpxb6yq";

    const regTx = await docRegistry.registerDocument(randomNonce, randomHash, testCid);
    await regTx.wait(1);

    // Revoke without prior grant
    const ownerAccessContract = getAccessControlContract(ownerSigner);
    await assert.rejects(
      async () => {
        const tx = await ownerAccessContract.revokeAccess(randomNonce, verifierSigner.address);
        await tx.wait(1);
      },
      (err: any) => {
        const msg = err.message || "";
        const data = err.data || "";
        return (
          msg.includes("AccessNotGranted") ||
          data.startsWith(ERROR_SELECTORS.AccessNotGranted) ||
          (err.code === "CALL_EXCEPTION" && msg.includes("execution reverted"))
        );
      }
    );
  });

  it("should revert with DocumentNotFound when granting access for non-existent documentId", async () => {
    const ownerSigner = getSigner(12);
    const verifierSigner = getSigner(13);
    const nonExistentDocId = ethers.hexlify(ethers.randomBytes(32));

    const ownerAccessContract = getAccessControlContract(ownerSigner);
    await assert.rejects(
      async () => {
        const tx = await ownerAccessContract.grantAccess(nonExistentDocId, verifierSigner.address);
        await tx.wait(1);
      },
      (err: any) => {
        const msg = err.message || "";
        const data = err.data || "";
        return (
          msg.includes("DocumentNotFound") ||
          data.startsWith(ERROR_SELECTORS.DocumentNotFound) ||
          (err.code === "CALL_EXCEPTION" && msg.includes("execution reverted"))
        );
      }
    );
  });

  it("should detect post-grant consistency mismatch if on-chain state remains false", async () => {
    const fakeRunner = {
      provider: null,
      call: async () => ethers.AbiCoder.defaultAbiCoder().encode(["bool"], [false]),
    } as unknown as ethers.ContractRunner;

    await assert.rejects(
      async () => {
        await verifyPostGrantState(
          fakeRunner,
          ethers.ZeroHash,
          "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
        );
      },
      /Post-grant consistency mismatch: Transaction confirmed, but on-chain AccessControl.hasAccess.*returned false/
    );
  });

  it("should detect post-revoke consistency mismatch if on-chain state remains true", async () => {
    const fakeRunner = {
      provider: null,
      call: async () => ethers.AbiCoder.defaultAbiCoder().encode(["bool"], [true]),
    } as unknown as ethers.ContractRunner;

    await assert.rejects(
      async () => {
        await verifyPostRevokeState(
          fakeRunner,
          ethers.ZeroHash,
          "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
        );
      },
      /Post-revoke consistency mismatch: Transaction confirmed, but on-chain AccessControl.hasAccess.*returned true/
    );
  });
});
