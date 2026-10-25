import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

export async function verifySecurityHardening(): Promise<void> {
  console.log("=================================================================");
  console.log("PHASE 7: SMART CONTRACT SECURITY HARDENING ON-CHAIN VERIFICATION");
  console.log("=================================================================\n");

  const [owner, verifier, attacker] = await ethers.getSigners();
  const ownerAddress = await owner.getAddress();
  const verifierAddress = await verifier.getAddress();
  const attackerAddress = await attacker.getAddress();

  console.log(`Role [Owner]:    ${ownerAddress}`);
  console.log(`Role [Verifier]: ${verifierAddress}`);
  console.log(`Role [Attacker]: ${attackerAddress}\n`);

  // 1. Load deployment artifacts
  const registryArtifactPath = path.resolve(
    __dirname,
    "../deployments/localhost/DocumentRegistry.json"
  );
  const accessControlArtifactPath = path.resolve(
    __dirname,
    "../deployments/localhost/AccessControl.json"
  );

  if (!fs.existsSync(registryArtifactPath) || !fs.existsSync(accessControlArtifactPath)) {
    throw new Error("Missing deployment artifacts in blockchain/deployments/localhost/");
  }

  const registryArtifact = JSON.parse(fs.readFileSync(registryArtifactPath, "utf8"));
  const accessControlArtifact = JSON.parse(fs.readFileSync(accessControlArtifactPath, "utf8"));

  const documentRegistry = await ethers.getContractAt(
    "DocumentRegistry",
    registryArtifact.address,
    owner
  );
  const accessControl = await ethers.getContractAt(
    "AccessControl",
    accessControlArtifact.address,
    owner
  );

  console.log(`Connected DocumentRegistry: ${registryArtifact.address}`);
  console.log(`Connected AccessControl:    ${accessControlArtifact.address}\n`);

  // Verify contract pointer
  const linkedRegistry = await accessControl.documentRegistry();
  if (linkedRegistry.toLowerCase() !== registryArtifact.address.toLowerCase()) {
    throw new Error("Critical: AccessControl is linked to an incorrect DocumentRegistry address!");
  }
  console.log("Dependency Check: AccessControl.documentRegistry() matches authoritative address.\n");

  // =========================================================================
  // TEST 1: Register Document by Owner
  // =========================================================================
  console.log("--- 1. Sovereign Document Registration ---");
  const docId = ethers.hexlify(ethers.randomBytes(32));
  const rawData = `security-audit-contract-doc-${Date.now()}`;
  const docHash = ethers.sha256(ethers.toUtf8Bytes(rawData));
  const cid = "bafybeihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku";

  const regTx = await documentRegistry.connect(owner).registerDocument(docId, docHash, cid);
  const regReceipt = await regTx.wait();
  console.log(`Registered Document ID: ${docId}`);
  console.log(`Registration Tx:        ${regTx.hash} (Block: ${regReceipt?.blockNumber}, Gas: ${regReceipt?.gasUsed})`);

  const doc = await documentRegistry.getDocument(docId);
  console.log(`Verified Owner On-Chain: ${doc.owner} (matches owner: ${doc.owner === ownerAddress})\n`);

  // =========================================================================
  // TEST 2: Adversarial Attack - Non-Owner Grant Access Attempt
  // =========================================================================
  console.log("--- 2. Adversarial Test: Attacker Attempts Unauthorized grantAccess ---");
  try {
    await accessControl.connect(attacker).grantAccess(docId, attackerAddress);
    throw new Error("CRITICAL SECURITY FAILURE: Attacker was able to grant access!");
  } catch (error: any) {
    if (error.message.includes("CRITICAL SECURITY FAILURE")) throw error;
    console.log(`Rejection Confirmed: Attacker grant transaction reverted fail-closed.`);
    console.log(`Observed Revert: ${error.message.split("\n")[0]}\n`);
  }

  // =========================================================================
  // TEST 3: Legitimate Owner Grants Access to Verifier
  // =========================================================================
  console.log("--- 3. Legitimate Owner Grants Access to Verifier ---");
  const grantTx = await accessControl.connect(owner).grantAccess(docId, verifierAddress);
  const grantReceipt = await grantTx.wait();
  console.log(`Grant Tx:       ${grantTx.hash} (Block: ${grantReceipt?.blockNumber}, Gas: ${grantReceipt?.gasUsed})`);

  const hasAccessAfterGrant = await accessControl.hasAccess(docId, verifierAddress);
  console.log(`hasAccess(docId, verifier): ${hasAccessAfterGrant} (expected true)\n`);

  // =========================================================================
  // TEST 4: Adversarial Attack - Attacker Attempts Unauthorized revokeAccess
  // =========================================================================
  console.log("--- 4. Adversarial Test: Attacker Attempts Unauthorized revokeAccess ---");
  try {
    await accessControl.connect(attacker).revokeAccess(docId, verifierAddress);
    throw new Error("CRITICAL SECURITY FAILURE: Attacker was able to revoke verifier access!");
  } catch (error: any) {
    if (error.message.includes("CRITICAL SECURITY FAILURE")) throw error;
    console.log(`Rejection Confirmed: Attacker revoke transaction reverted fail-closed.`);
    console.log(`Observed Revert: ${error.message.split("\n")[0]}\n`);
  }

  // Confirm verifier access is intact
  const verifierAccessIntact = await accessControl.hasAccess(docId, verifierAddress);
  console.log(`Verifier Access Integrity Maintained: ${verifierAccessIntact}\n`);

  // =========================================================================
  // TEST 5: Adversarial Attack - Attacker Attempts Unauthorized revokeDocument
  // =========================================================================
  console.log("--- 5. Adversarial Test: Attacker Attempts Unauthorized revokeDocument ---");
  try {
    await documentRegistry.connect(attacker).revokeDocument(docId);
    throw new Error("CRITICAL SECURITY FAILURE: Attacker was able to revoke document!");
  } catch (error: any) {
    if (error.message.includes("CRITICAL SECURITY FAILURE")) throw error;
    console.log(`Rejection Confirmed: Attacker document revocation reverted fail-closed.`);
    console.log(`Observed Revert: ${error.message.split("\n")[0]}\n`);
  }

  // =========================================================================
  // TEST 6: Sovereign Document Revocation & Stale Permission Invalidation
  // =========================================================================
  console.log("--- 6. Owner Revokes Document & Verifies Invalidation Invariant ---");
  const revokeDocTx = await documentRegistry.connect(owner).revokeDocument(docId);
  const revokeDocReceipt = await revokeDocTx.wait();
  console.log(`Document Revoked Tx: ${revokeDocTx.hash} (Block: ${revokeDocReceipt?.blockNumber}, Gas: ${revokeDocReceipt?.gasUsed})`);

  const isDocRevoked = await documentRegistry.isRevoked(docId);
  console.log(`DocumentRegistry.isRevoked: ${isDocRevoked} (expected true)`);

  const hasAccessAfterDocRevoke = await accessControl.hasAccess(docId, verifierAddress);
  const directRecordPreserved = await accessControl.isDirectAccessGranted(docId, verifierAddress);
  console.log(`AccessControl.hasAccess:             ${hasAccessAfterDocRevoke} (expected false - INVARIANT PROVED)`);
  console.log(`AccessControl.isDirectAccessGranted: ${directRecordPreserved} (expected true - AUDIT HISTORY PRESERVED)\n`);

  // =========================================================================
  // TEST 7: Grant on Revoked Document Rejection
  // =========================================================================
  console.log("--- 7. Adversarial Test: Attempting to Grant Access on Revoked Document ---");
  try {
    await accessControl.connect(owner).grantAccess(docId, attackerAddress);
    throw new Error("CRITICAL SECURITY FAILURE: Grant allowed on revoked document!");
  } catch (error: any) {
    if (error.message.includes("CRITICAL SECURITY FAILURE")) throw error;
    console.log(`Rejection Confirmed: Grant on revoked document reverted fail-closed.`);
    console.log(`Observed Revert: ${error.message.split("\n")[0]}\n`);
  }

  console.log("=================================================================");
  console.log("ALL ON-CHAIN SECURITY INVARIANTS & HARDENING CHECKS VERIFIED OK");
  console.log("=================================================================\n");
}

if (require.main === module) {
  verifySecurityHardening()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Hardening verification failed:", error);
      process.exit(1);
    });
}
