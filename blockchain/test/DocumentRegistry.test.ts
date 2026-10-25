import { expect } from "chai";
import { ethers } from "hardhat";
import { DocumentRegistry } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Phase 5: DocumentRegistry Smart Contract", function () {
  let documentRegistry: DocumentRegistry;
  let owner: HardhatEthersSigner;
  let otherAccount: HardhatEthersSigner;

  // Helper to generate a unique 32-byte document ID
  function generateDocId(): string {
    return ethers.hexlify(ethers.randomBytes(32));
  }

  // Helper to generate a 32-byte SHA-256 digest fixture
  function generateDocHash(content: string): string {
    return ethers.sha256(ethers.toUtf8Bytes(content));
  }

  const sampleCid = "bafybeic56t72vgtfvqvhdfn3p3j2f7bopqj2g2e2n5q3w";

  beforeEach(async function () {
    [owner, otherAccount] = await ethers.getSigners();

    const factory = await ethers.getContractFactory("DocumentRegistry");
    documentRegistry = (await factory.deploy()) as DocumentRegistry;
    await documentRegistry.waitForDeployment();
  });

  describe("Deployment & Initialization", function () {
    it("should deploy with a valid contract address", async function () {
      const address = await documentRegistry.getAddress();
      expect(address).to.match(/^0x[a-fA-F0-9]{40}$/);
    });

    it("should report non-existence for unregistered document IDs", async function () {
      const docId = generateDocId();
      expect(await documentRegistry.documentExists(docId)).to.be.false;
    });

    it("should return an empty document array for accounts with no registrations", async function () {
      const docs = await documentRegistry.getUserDocuments(owner.address);
      expect(docs).to.be.an("array").that.is.empty;
    });
  });

  describe("Document Registration", function () {
    it("should successfully register a document and emit DocumentRegistered event", async function () {
      const docId = generateDocId();
      const docHash = generateDocHash("original-document-bytes-v1");

      const tx = await documentRegistry.registerDocument(docId, docHash, sampleCid);
      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1);

      // Verify event emission
      await expect(tx)
        .to.emit(documentRegistry, "DocumentRegistered")
        .withArgs(docId, owner.address, docHash, sampleCid, (val: bigint) => val > 0n);

      // Verify on-chain document state
      const doc = await documentRegistry.getDocument(docId);
      expect(doc.documentId).to.equal(docId);
      expect(doc.owner).to.equal(owner.address);
      expect(doc.documentHash).to.equal(docHash);
      expect(doc.ipfsCid).to.equal(sampleCid);
      expect(doc.registeredAt).to.be.greaterThan(0n);
      expect(doc.revoked).to.be.false;

      // Verify user document tracking
      const userDocs = await documentRegistry.getUserDocuments(owner.address);
      expect(userDocs).to.deep.equal([docId]);
      expect(await documentRegistry.documentExists(docId)).to.be.true;
    });

    it("should assign document ownership strictly to msg.sender", async function () {
      const docId = generateDocId();
      const docHash = generateDocHash("second-document-owner-test");

      // Register from otherAccount
      await documentRegistry
        .connect(otherAccount)
        .registerDocument(docId, docHash, sampleCid);

      const doc = await documentRegistry.getDocument(docId);
      expect(doc.owner).to.equal(otherAccount.address);
      expect(doc.owner).to.not.equal(owner.address);
    });

    it("should revert with InvalidDocumentId if documentId is bytes32(0)", async function () {
      const zeroId = ethers.ZeroHash;
      const docHash = generateDocHash("valid-hash");

      await expect(
        documentRegistry.registerDocument(zeroId, docHash, sampleCid)
      ).to.be.revertedWithCustomError(documentRegistry, "InvalidDocumentId");
    });

    it("should revert with InvalidDocumentHash if documentHash is bytes32(0)", async function () {
      const docId = generateDocId();
      const zeroHash = ethers.ZeroHash;

      await expect(
        documentRegistry.registerDocument(docId, zeroHash, sampleCid)
      ).to.be.revertedWithCustomError(documentRegistry, "InvalidDocumentHash");
    });

    it("should revert with InvalidIpfsCid if ipfsCid is empty string", async function () {
      const docId = generateDocId();
      const docHash = generateDocHash("valid-hash");

      await expect(
        documentRegistry.registerDocument(docId, docHash, "")
      ).to.be.revertedWithCustomError(documentRegistry, "InvalidIpfsCid");
    });

    it("should revert with DocumentAlreadyExists on duplicate registration attempt", async function () {
      const docId = generateDocId();
      const docHash = generateDocHash("unique-content");

      await documentRegistry.registerDocument(docId, docHash, sampleCid);

      // Attempt to register again with same ID
      await expect(
        documentRegistry.registerDocument(docId, docHash, sampleCid)
      ).to.be.revertedWithCustomError(documentRegistry, "DocumentAlreadyExists")
        .withArgs(docId);
    });
  });

  describe("Document Lookup", function () {
    it("should return the exact stored document struct", async function () {
      const docId = generateDocId();
      const docHash = generateDocHash("lookup-test-content");

      await documentRegistry.registerDocument(docId, docHash, sampleCid);
      const doc = await documentRegistry.getDocument(docId);

      expect(doc.documentId).to.equal(docId);
      expect(doc.documentHash).to.equal(docHash);
      expect(doc.ipfsCid).to.equal(sampleCid);
    });

    it("should revert with DocumentNotFound when querying an unregistered document ID", async function () {
      const unregisteredId = generateDocId();

      await expect(
        documentRegistry.getDocument(unregisteredId)
      ).to.be.revertedWithCustomError(documentRegistry, "DocumentNotFound")
        .withArgs(unregisteredId);
    });
  });

  describe("Document Revocation", function () {
    it("should allow the document owner to revoke a document and emit DocumentRevoked", async function () {
      const docId = generateDocId();
      const docHash = generateDocHash("revocation-test-doc");

      await documentRegistry.registerDocument(docId, docHash, sampleCid);
      expect(await documentRegistry.isRevoked(docId)).to.be.false;

      const tx = await documentRegistry.revokeDocument(docId);

      await expect(tx)
        .to.emit(documentRegistry, "DocumentRevoked")
        .withArgs(docId, owner.address, (val: bigint) => val > 0n);

      expect(await documentRegistry.isRevoked(docId)).to.be.true;

      const doc = await documentRegistry.getDocument(docId);
      expect(doc.revoked).to.be.true;
      // Core fields remain intact
      expect(doc.owner).to.equal(owner.address);
      expect(doc.documentHash).to.equal(docHash);
    });

    it("should revert with NotDocumentOwner if non-owner attempts revocation", async function () {
      const docId = generateDocId();
      const docHash = generateDocHash("unauthorized-revocation-test");

      await documentRegistry.registerDocument(docId, docHash, sampleCid);

      await expect(
        documentRegistry.connect(otherAccount).revokeDocument(docId)
      ).to.be.revertedWithCustomError(documentRegistry, "NotDocumentOwner")
        .withArgs(docId, otherAccount.address);
    });

    it("should revert with DocumentAlreadyRevoked if owner revokes an already-revoked document", async function () {
      const docId = generateDocId();
      const docHash = generateDocHash("double-revocation-test");

      await documentRegistry.registerDocument(docId, docHash, sampleCid);
      await documentRegistry.revokeDocument(docId);

      await expect(
        documentRegistry.revokeDocument(docId)
      ).to.be.revertedWithCustomError(documentRegistry, "DocumentAlreadyRevoked")
        .withArgs(docId);
    });

    it("should revert with DocumentNotFound if attempting to revoke an unregistered document", async function () {
      const unregisteredId = generateDocId();

      await expect(
        documentRegistry.revokeDocument(unregisteredId)
      ).to.be.revertedWithCustomError(documentRegistry, "DocumentNotFound")
        .withArgs(unregisteredId);
    });

    it("should revert with DocumentNotFound if querying isRevoked on an unregistered document", async function () {
      const unregisteredId = generateDocId();

      await expect(
        documentRegistry.isRevoked(unregisteredId)
      ).to.be.revertedWithCustomError(documentRegistry, "DocumentNotFound")
        .withArgs(unregisteredId);
    });
  });
});
