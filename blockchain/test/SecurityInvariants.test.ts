import { expect } from "chai";
import { ethers } from "hardhat";
import { DocumentRegistry, AccessControl } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Phase 7: Smart Contract Security, Hardening & Invariants", function () {
  let documentRegistry: DocumentRegistry;
  let accessControl: AccessControl;
  let owner: HardhatEthersSigner;
  let verifier1: HardhatEthersSigner;
  let verifier2: HardhatEthersSigner;
  let attacker: HardhatEthersSigner;

  function generateDocId(): string {
    return ethers.hexlify(ethers.randomBytes(32));
  }

  function generateDocHash(label: string): string {
    return ethers.sha256(ethers.toUtf8Bytes(`adversarial-test-payload-${label}-${Date.now()}`));
  }

  const sampleCid = "bafybeihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku";

  beforeEach(async function () {
    [owner, verifier1, verifier2, attacker] = await ethers.getSigners();

    // 1. Deploy DocumentRegistry
    const registryFactory = await ethers.getContractFactory("DocumentRegistry", owner);
    documentRegistry = (await registryFactory.deploy()) as DocumentRegistry;
    await documentRegistry.waitForDeployment();

    // 2. Deploy AccessControl linked to DocumentRegistry
    const accessControlFactory = await ethers.getContractFactory("AccessControl", owner);
    accessControl = (await accessControlFactory.deploy(
      await documentRegistry.getAddress()
    )) as AccessControl;
    await accessControl.waitForDeployment();
  });

  // =========================================================================
  // 1. SECURITY INVARIANT TESTS
  // =========================================================================

  describe("Security Invariant 1: Sovereign Ownership Binding", function () {
    it("must bind document ownership irrevocably to msg.sender", async function () {
      const docId = generateDocId();
      const docHash = generateDocHash("owner-binding");

      await documentRegistry.connect(owner).registerDocument(docId, docHash, sampleCid);
      const doc = await documentRegistry.getDocument(docId);

      expect(doc.owner).to.equal(owner.address);
      expect(doc.owner).to.not.equal(attacker.address);
    });

    it("must prevent an attacker from registering a document under someone else's address", async function () {
      const docId = generateDocId();
      const docHash = generateDocHash("attacker-impersonate");

      // Attacker registers: ownership MUST be assigned to attacker.address, never owner.address
      await documentRegistry.connect(attacker).registerDocument(docId, docHash, sampleCid);
      const doc = await documentRegistry.getDocument(docId);

      expect(doc.owner).to.equal(attacker.address);
      expect(doc.owner).to.not.equal(owner.address);
    });
  });

  describe("Security Invariant 2: Authorization Integrity (Non-Owner Attacks)", function () {
    let docId: string;

    beforeEach(async function () {
      docId = generateDocId();
      await documentRegistry.connect(owner).registerDocument(docId, generateDocHash("auth-attack"), sampleCid);
    });

    it("must reject attacker attempts to grant access to an owner document", async function () {
      await expect(
        accessControl.connect(attacker).grantAccess(docId, attacker.address)
      )
        .to.be.revertedWithCustomError(accessControl, "NotDocumentOwner")
        .withArgs(docId, attacker.address);

      expect(await accessControl.hasAccess(docId, attacker.address)).to.be.false;
    });

    it("must reject attacker attempts to revoke access from a legitimate verifier", async function () {
      await accessControl.connect(owner).grantAccess(docId, verifier1.address);
      expect(await accessControl.hasAccess(docId, verifier1.address)).to.be.true;

      await expect(
        accessControl.connect(attacker).revokeAccess(docId, verifier1.address)
      )
        .to.be.revertedWithCustomError(accessControl, "NotDocumentOwner")
        .withArgs(docId, attacker.address);

      // Verifier access must remain untouched
      expect(await accessControl.hasAccess(docId, verifier1.address)).to.be.true;
    });

    it("must reject attacker attempts to revoke an owner's document in DocumentRegistry", async function () {
      await expect(
        documentRegistry.connect(attacker).revokeDocument(docId)
      )
        .to.be.revertedWithCustomError(documentRegistry, "NotDocumentOwner")
        .withArgs(docId, attacker.address);

      expect(await documentRegistry.isRevoked(docId)).to.be.false;
    });
  });

  describe("Security Invariant 3: Multi-Tenant & Cross-Document Isolation", function () {
    it("must strictly enforce cross-document permission boundaries", async function () {
      const docA = generateDocId();
      const docB = generateDocId();

      await documentRegistry.connect(owner).registerDocument(docA, generateDocHash("docA"), sampleCid);
      await documentRegistry.connect(owner).registerDocument(docB, generateDocHash("docB"), sampleCid);

      // Grant Doc A to Verifier 1, Doc B to Verifier 2
      await accessControl.connect(owner).grantAccess(docA, verifier1.address);
      await accessControl.connect(owner).grantAccess(docB, verifier2.address);

      // Verifier 1 check
      expect(await accessControl.hasAccess(docA, verifier1.address)).to.be.true;
      expect(await accessControl.hasAccess(docB, verifier1.address)).to.be.false;

      // Verifier 2 check
      expect(await accessControl.hasAccess(docA, verifier2.address)).to.be.false;
      expect(await accessControl.hasAccess(docB, verifier2.address)).to.be.true;

      // Attacker check (neither)
      expect(await accessControl.hasAccess(docA, attacker.address)).to.be.false;
      expect(await accessControl.hasAccess(docB, attacker.address)).to.be.false;
    });
  });

  describe("Security Invariant 4: Stale Permission Invalidation on Document Revocation", function () {
    it("must override active verifier permissions immediately upon document revocation", async function () {
      const docId = generateDocId();
      await documentRegistry.connect(owner).registerDocument(docId, generateDocHash("revocation-override"), sampleCid);

      await accessControl.connect(owner).grantAccess(docId, verifier1.address);
      expect(await accessControl.hasAccess(docId, verifier1.address)).to.be.true;
      expect(await accessControl.isDirectAccessGranted(docId, verifier1.address)).to.be.true;

      // Owner revokes document in DocumentRegistry
      await documentRegistry.connect(owner).revokeDocument(docId);
      expect(await documentRegistry.isRevoked(docId)).to.be.true;

      // hasAccess must immediately evaluate to false
      expect(await accessControl.hasAccess(docId, verifier1.address)).to.be.false;

      // Direct mapping preserved for historical auditability
      expect(await accessControl.isDirectAccessGranted(docId, verifier1.address)).to.be.true;

      // New grants on revoked document must be blocked
      await expect(
        accessControl.connect(owner).grantAccess(docId, verifier2.address)
      )
        .to.be.revertedWithCustomError(accessControl, "DocumentIsRevoked")
        .withArgs(docId);
    });
  });

  describe("Security Invariant 5: Non-Existent Document Protection", function () {
    it("must reject grant and revoke calls on unregistered documents", async function () {
      const nonExistentDoc = generateDocId();

      await expect(
        accessControl.connect(owner).grantAccess(nonExistentDoc, verifier1.address)
      )
        .to.be.revertedWithCustomError(accessControl, "DocumentNotFound")
        .withArgs(nonExistentDoc);

      await expect(
        accessControl.connect(owner).revokeAccess(nonExistentDoc, verifier1.address)
      )
        .to.be.revertedWithCustomError(accessControl, "DocumentNotFound")
        .withArgs(nonExistentDoc);
    });

    it("must safely return false for hasAccess on unregistered documents without reverting", async function () {
      const nonExistentDoc = generateDocId();
      expect(await accessControl.hasAccess(nonExistentDoc, verifier1.address)).to.be.false;
      expect(await accessControl.isDirectAccessGranted(nonExistentDoc, verifier1.address)).to.be.false;
    });
  });

  describe("Security Invariant 6: Registration Immutability", function () {
    it("must reject overwriting or modifying an existing document registration", async function () {
      const docId = generateDocId();
      const initialHash = generateDocHash("initial-file");
      await documentRegistry.connect(owner).registerDocument(docId, initialHash, sampleCid);

      const modifiedHash = generateDocHash("tampered-file");
      await expect(
        documentRegistry.connect(owner).registerDocument(docId, modifiedHash, "bafybeimodified")
      )
        .to.be.revertedWithCustomError(documentRegistry, "DocumentAlreadyExists")
        .withArgs(docId);

      // Verify stored data remains unchanged
      const doc = await documentRegistry.getDocument(docId);
      expect(doc.documentHash).to.equal(initialHash);
      expect(doc.ipfsCid).to.equal(sampleCid);
    });
  });

  describe("Security Invariant 7: Event-State Coherence", function () {
    it("must ensure events reflect actual on-chain state updates and revert without side effects", async function () {
      const docId = generateDocId();
      await documentRegistry.connect(owner).registerDocument(docId, generateDocHash("event-state"), sampleCid);

      // Successful grant emits event and updates state
      const grantTx = await accessControl.connect(owner).grantAccess(docId, verifier1.address);
      await expect(grantTx)
        .to.emit(accessControl, "AccessGranted")
        .withArgs(docId, owner.address, verifier1.address, (ts: bigint) => ts > 0n);

      expect(await accessControl.hasAccess(docId, verifier1.address)).to.be.true;

      // Duplicate grant reverts: state unchanged, zero new events
      await expect(
        accessControl.connect(owner).grantAccess(docId, verifier1.address)
      ).to.be.revertedWithCustomError(accessControl, "AccessAlreadyGranted");
    });
  });

  // =========================================================================
  // 2. SPECIFIED ADVERSARIAL SCENARIOS (Scenarios A through F)
  // =========================================================================

  describe("Adversarial Scenarios (A through F)", function () {
    it("Scenario A: Register Document A -> Grant Bob -> Check Bob == true", async function () {
      const docA = generateDocId();
      await documentRegistry.connect(owner).registerDocument(docA, generateDocHash("sc-A"), sampleCid);
      await accessControl.connect(owner).grantAccess(docA, verifier1.address);

      expect(await accessControl.hasAccess(docA, verifier1.address)).to.be.true;
    });

    it("Scenario B: Register Document A -> Grant Bob -> Revoke Bob -> Check Bob == false", async function () {
      const docA = generateDocId();
      await documentRegistry.connect(owner).registerDocument(docA, generateDocHash("sc-B"), sampleCid);
      await accessControl.connect(owner).grantAccess(docA, verifier1.address);
      expect(await accessControl.hasAccess(docA, verifier1.address)).to.be.true;

      await accessControl.connect(owner).revokeAccess(docA, verifier1.address);
      expect(await accessControl.hasAccess(docA, verifier1.address)).to.be.false;
    });

    it("Scenario C: Register Document A -> Grant Bob -> Revoke Document A -> Check Bob == false", async function () {
      const docA = generateDocId();
      await documentRegistry.connect(owner).registerDocument(docA, generateDocHash("sc-C"), sampleCid);
      await accessControl.connect(owner).grantAccess(docA, verifier1.address);
      expect(await accessControl.hasAccess(docA, verifier1.address)).to.be.true;

      await documentRegistry.connect(owner).revokeDocument(docA);
      expect(await accessControl.hasAccess(docA, verifier1.address)).to.be.false;
    });

    it("Scenario D: Register Doc A & Doc B -> Grant Bob on A -> Check Bob on B == false", async function () {
      const docA = generateDocId();
      const docB = generateDocId();
      await documentRegistry.connect(owner).registerDocument(docA, generateDocHash("sc-D1"), sampleCid);
      await documentRegistry.connect(owner).registerDocument(docB, generateDocHash("sc-D2"), sampleCid);

      await accessControl.connect(owner).grantAccess(docA, verifier1.address);

      expect(await accessControl.hasAccess(docA, verifier1.address)).to.be.true;
      expect(await accessControl.hasAccess(docB, verifier1.address)).to.be.false;
    });

    it("Scenario E: Register Document A -> Attempt grant from non-owner -> Reverts with NotDocumentOwner", async function () {
      const docA = generateDocId();
      await documentRegistry.connect(owner).registerDocument(docA, generateDocHash("sc-E"), sampleCid);

      await expect(
        accessControl.connect(attacker).grantAccess(docA, verifier1.address)
      )
        .to.be.revertedWithCustomError(accessControl, "NotDocumentOwner")
        .withArgs(docA, attacker.address);
    });

    it("Scenario F: Revoke Document A -> Attempt grant Bob -> Reverts with DocumentIsRevoked", async function () {
      const docA = generateDocId();
      await documentRegistry.connect(owner).registerDocument(docA, generateDocHash("sc-F"), sampleCid);
      await documentRegistry.connect(owner).revokeDocument(docA);

      await expect(
        accessControl.connect(owner).grantAccess(docA, verifier1.address)
      )
        .to.be.revertedWithCustomError(accessControl, "DocumentIsRevoked")
        .withArgs(docA);
    });
  });

  // =========================================================================
  // 3. GAS & COST SANITY AUDIT
  // =========================================================================

  describe("Gas & Cost Sanity Checks", function () {
    it("should measure gas usage within acceptable operational bounds", async function () {
      const docId = generateDocId();
      const docHash = generateDocHash("gas-audit");

      // 1. registerDocument
      const regTx = await documentRegistry.connect(owner).registerDocument(docId, docHash, sampleCid);
      const regReceipt = await regTx.wait();
      const regGas = regReceipt?.gasUsed || 0n;
      expect(regGas).to.be.lessThan(300_000n); // Baseline expectation: ~229,000

      // 2. grantAccess
      const grantTx = await accessControl.connect(owner).grantAccess(docId, verifier1.address);
      const grantReceipt = await grantTx.wait();
      const grantGas = grantReceipt?.gasUsed || 0n;
      expect(grantGas).to.be.lessThan(100_000n); // Baseline expectation: ~71,000

      // 3. revokeAccess
      const revokeTx = await accessControl.connect(owner).revokeAccess(docId, verifier1.address);
      const revokeReceipt = await revokeTx.wait();
      const revokeGas = revokeReceipt?.gasUsed || 0n;
      expect(revokeGas).to.be.lessThan(80_000n); // Baseline expectation: ~49,000

      // 4. revokeDocument
      const docRevokeTx = await documentRegistry.connect(owner).revokeDocument(docId);
      const docRevokeReceipt = await docRevokeTx.wait();
      const docRevokeGas = docRevokeReceipt?.gasUsed || 0n;
      expect(docRevokeGas).to.be.lessThan(70_000n); // Baseline expectation: ~48,000
    });
  });
});
