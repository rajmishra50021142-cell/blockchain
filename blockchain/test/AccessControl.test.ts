import { expect } from "chai";
import { ethers } from "hardhat";
import { DocumentRegistry, AccessControl } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Phase 6: AccessControl Smart Contract", function () {
  let documentRegistry: DocumentRegistry;
  let accessControl: AccessControl;
  let owner: HardhatEthersSigner;
  let verifier1: HardhatEthersSigner;
  let verifier2: HardhatEthersSigner;
  let unauthorizedAccount: HardhatEthersSigner;

  function generateDocId(): string {
    return ethers.hexlify(ethers.randomBytes(32));
  }

  function generateDocHash(content: string): string {
    return ethers.sha256(ethers.toUtf8Bytes(content));
  }

  const sampleCid = "bafybeic56t72vgtfvqvhdfn3p3j2f7bopqj2g2e2n5q3w";

  beforeEach(async function () {
    [owner, verifier1, verifier2, unauthorizedAccount] = await ethers.getSigners();

    // 1. Deploy DocumentRegistry
    const registryFactory = await ethers.getContractFactory("DocumentRegistry");
    documentRegistry = (await registryFactory.deploy()) as DocumentRegistry;
    await documentRegistry.waitForDeployment();

    // 2. Deploy AccessControl with DocumentRegistry address
    const accessControlFactory = await ethers.getContractFactory("AccessControl");
    accessControl = (await accessControlFactory.deploy(
      await documentRegistry.getAddress()
    )) as AccessControl;
    await accessControl.waitForDeployment();
  });

  describe("Deployment & Configuration", function () {
    it("should deploy AccessControl with a valid contract address", async function () {
      const address = await accessControl.getAddress();
      expect(address).to.match(/^0x[a-fA-F0-9]{40}$/);
    });

    it("should correctly store and return the linked DocumentRegistry address", async function () {
      const registryAddress = await documentRegistry.getAddress();
      expect(await accessControl.documentRegistry()).to.equal(registryAddress);
      expect(await accessControl.getDocumentRegistry()).to.equal(registryAddress);
    });

    it("should revert if initialized with zero address registry", async function () {
      const accessControlFactory = await ethers.getContractFactory("AccessControl");
      await expect(
        accessControlFactory.deploy(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(accessControl, "InvalidRegistryAddress");
    });

    it("should report false for ungranted access on deployment", async function () {
      const docId = generateDocId();
      expect(await accessControl.hasAccess(docId, verifier1.address)).to.be.false;
      expect(await accessControl.isDirectAccessGranted(docId, verifier1.address)).to.be.false;
    });
  });

  describe("Grant Access", function () {
    let docId: string;
    let docHash: string;

    beforeEach(async function () {
      docId = generateDocId();
      docHash = generateDocHash("doc-for-access-test");
      await documentRegistry.registerDocument(docId, docHash, sampleCid);
    });

    it("should allow the document owner to grant access and emit AccessGranted event", async function () {
      const tx = await accessControl.grantAccess(docId, verifier1.address);
      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1);

      await expect(tx)
        .to.emit(accessControl, "AccessGranted")
        .withArgs(docId, owner.address, verifier1.address, (val: bigint) => val > 0n);

      expect(await accessControl.hasAccess(docId, verifier1.address)).to.be.true;
      expect(await accessControl.isDirectAccessGranted(docId, verifier1.address)).to.be.true;
    });

    it("should revert with NotDocumentOwner when non-owner attempts to grant access", async function () {
      await expect(
        accessControl.connect(unauthorizedAccount).grantAccess(docId, verifier1.address)
      )
        .to.be.revertedWithCustomError(accessControl, "NotDocumentOwner")
        .withArgs(docId, unauthorizedAccount.address);
    });

    it("should revert with InvalidDocumentId if documentId is bytes32(0)", async function () {
      await expect(
        accessControl.grantAccess(ethers.ZeroHash, verifier1.address)
      ).to.be.revertedWithCustomError(accessControl, "InvalidDocumentId");
    });

    it("should revert with InvalidVerifierAddress if verifier is zero address", async function () {
      await expect(
        accessControl.grantAccess(docId, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(accessControl, "InvalidVerifierAddress");
    });

    it("should revert with DocumentNotFound when granting access for an unregistered document", async function () {
      const unregId = generateDocId();
      await expect(
        accessControl.grantAccess(unregId, verifier1.address)
      )
        .to.be.revertedWithCustomError(accessControl, "DocumentNotFound")
        .withArgs(unregId);
    });

    it("should revert with AccessAlreadyGranted when granting access twice to the same verifier", async function () {
      await accessControl.grantAccess(docId, verifier1.address);

      await expect(
        accessControl.grantAccess(docId, verifier1.address)
      )
        .to.be.revertedWithCustomError(accessControl, "AccessAlreadyGranted")
        .withArgs(docId, verifier1.address);
    });

    it("should revert with DocumentIsRevoked when attempting to grant access on a revoked document", async function () {
      await documentRegistry.revokeDocument(docId);

      await expect(
        accessControl.grantAccess(docId, verifier1.address)
      )
        .to.be.revertedWithCustomError(accessControl, "DocumentIsRevoked")
        .withArgs(docId);
    });
  });

  describe("Revoke Access", function () {
    let docId: string;

    beforeEach(async function () {
      docId = generateDocId();
      const docHash = generateDocHash("doc-for-revoke-test");
      await documentRegistry.registerDocument(docId, docHash, sampleCid);
      await accessControl.grantAccess(docId, verifier1.address);
    });

    it("should allow document owner to revoke access and emit AccessRevoked event", async function () {
      expect(await accessControl.hasAccess(docId, verifier1.address)).to.be.true;

      const tx = await accessControl.revokeAccess(docId, verifier1.address);
      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1);

      await expect(tx)
        .to.emit(accessControl, "AccessRevoked")
        .withArgs(docId, owner.address, verifier1.address, (val: bigint) => val > 0n);

      expect(await accessControl.hasAccess(docId, verifier1.address)).to.be.false;
      expect(await accessControl.isDirectAccessGranted(docId, verifier1.address)).to.be.false;
    });

    it("should revert with NotDocumentOwner when non-owner attempts to revoke access", async function () {
      await expect(
        accessControl.connect(unauthorizedAccount).revokeAccess(docId, verifier1.address)
      )
        .to.be.revertedWithCustomError(accessControl, "NotDocumentOwner")
        .withArgs(docId, unauthorizedAccount.address);
    });

    it("should revert with InvalidDocumentId if documentId is bytes32(0)", async function () {
      await expect(
        accessControl.revokeAccess(ethers.ZeroHash, verifier1.address)
      ).to.be.revertedWithCustomError(accessControl, "InvalidDocumentId");
    });

    it("should revert with InvalidVerifierAddress if verifier is zero address", async function () {
      await expect(
        accessControl.revokeAccess(docId, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(accessControl, "InvalidVerifierAddress");
    });

    it("should revert with DocumentNotFound when revoking access for an unregistered document", async function () {
      const unregId = generateDocId();
      await expect(
        accessControl.revokeAccess(unregId, verifier1.address)
      )
        .to.be.revertedWithCustomError(accessControl, "DocumentNotFound")
        .withArgs(unregId);
    });

    it("should revert with AccessNotGranted when revoking access that was never granted", async function () {
      await expect(
        accessControl.revokeAccess(docId, verifier2.address)
      )
        .to.be.revertedWithCustomError(accessControl, "AccessNotGranted")
        .withArgs(docId, verifier2.address);
    });

    it("should revert with AccessNotGranted when revoking already-revoked access", async function () {
      await accessControl.revokeAccess(docId, verifier1.address);

      await expect(
        accessControl.revokeAccess(docId, verifier1.address)
      )
        .to.be.revertedWithCustomError(accessControl, "AccessNotGranted")
        .withArgs(docId, verifier1.address);
    });
  });

  describe("Document-Level Revocation Interaction & Invariants", function () {
    it("should invalidate active access immediately when document is revoked in DocumentRegistry", async function () {
      const docId = generateDocId();
      const docHash = generateDocHash("revocation-override-test");
      await documentRegistry.registerDocument(docId, docHash, sampleCid);

      // 1. Grant access to verifier1
      await accessControl.grantAccess(docId, verifier1.address);
      expect(await accessControl.hasAccess(docId, verifier1.address)).to.be.true;
      expect(await accessControl.isDirectAccessGranted(docId, verifier1.address)).to.be.true;

      // 2. Revoke the document itself in DocumentRegistry
      await documentRegistry.revokeDocument(docId);
      expect(await documentRegistry.isRevoked(docId)).to.be.true;

      // 3. Verify hasAccess reports false despite direct permission entry
      expect(await accessControl.hasAccess(docId, verifier1.address)).to.be.false;
      // Direct permission is preserved for historical audit trail
      expect(await accessControl.isDirectAccessGranted(docId, verifier1.address)).to.be.true;
    });

    it("should return false for hasAccess on unregistered document IDs without reverting", async function () {
      const unregId = generateDocId();
      expect(await accessControl.hasAccess(unregId, verifier1.address)).to.be.false;
    });

    it("should return false for hasAccess when querying zero address verifier or zero documentId", async function () {
      const docId = generateDocId();
      expect(await accessControl.hasAccess(docId, ethers.ZeroAddress)).to.be.false;
      expect(await accessControl.hasAccess(ethers.ZeroHash, verifier1.address)).to.be.false;
    });
  });

  describe("Cross-Document & Cross-Verifier Isolation", function () {
    it("should strictly isolate permissions across documents and verifiers", async function () {
      const docA = generateDocId();
      const docB = generateDocId();

      await documentRegistry.registerDocument(docA, generateDocHash("docA"), sampleCid);
      await documentRegistry.registerDocument(docB, generateDocHash("docB"), sampleCid);

      // Grant Doc A to Verifier 1 only, Doc B to Verifier 2 only
      await accessControl.grantAccess(docA, verifier1.address);
      await accessControl.grantAccess(docB, verifier2.address);

      // Verifier 1 checks
      expect(await accessControl.hasAccess(docA, verifier1.address)).to.be.true;
      expect(await accessControl.hasAccess(docB, verifier1.address)).to.be.false;

      // Verifier 2 checks
      expect(await accessControl.hasAccess(docA, verifier2.address)).to.be.false;
      expect(await accessControl.hasAccess(docB, verifier2.address)).to.be.true;

      // Unauthorized account check
      expect(await accessControl.hasAccess(docA, unauthorizedAccount.address)).to.be.false;
      expect(await accessControl.hasAccess(docB, unauthorizedAccount.address)).to.be.false;

      // Revoking Doc A from Verifier 1 must not alter Doc B for Verifier 2
      await accessControl.revokeAccess(docA, verifier1.address);
      expect(await accessControl.hasAccess(docA, verifier1.address)).to.be.false;
      expect(await accessControl.hasAccess(docB, verifier2.address)).to.be.true;
    });
  });
});
