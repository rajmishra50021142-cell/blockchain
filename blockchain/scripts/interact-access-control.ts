import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

export async function interactAccessControl(): Promise<void> {
  console.log("Starting AccessControl interaction test on local blockchain...\n");

  const [owner, verifier, unauthorized] = await ethers.getSigners();
  const ownerAddress = await owner.getAddress();
  const verifierAddress = await verifier.getAddress();
  const unauthorizedAddress = await unauthorized.getAddress();

  console.log(`Document Owner Address: ${ownerAddress}`);
  console.log(`Verifier Address:       ${verifierAddress}`);
  console.log(`Unauthorized Address:   ${unauthorizedAddress}\n`);

  // 1. Load deployment artifacts for connected network
  const network = await ethers.provider.getNetwork();
  const isSepolia = Number(network.chainId) === 11155111;
  const targetDir = isSepolia ? "sepolia" : "localhost";

  const registryArtifactPath = path.resolve(
    __dirname,
    `../deployments/${targetDir}/DocumentRegistry.json`
  );
  const accessControlArtifactPath = path.resolve(
    __dirname,
    `../deployments/${targetDir}/AccessControl.json`
  );

  if (!fs.existsSync(registryArtifactPath)) {
    throw new Error(`DocumentRegistry deployment artifact missing at: ${registryArtifactPath}`);
  }
  if (!fs.existsSync(accessControlArtifactPath)) {
    throw new Error(`AccessControl deployment artifact missing at: ${accessControlArtifactPath}`);
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

  console.log(`Loaded DocumentRegistry: ${registryArtifact.address}`);
  console.log(`Loaded AccessControl:    ${accessControlArtifact.address}\n`);

  // Confirm configuration
  const linkedRegistry = await accessControl.documentRegistry();
  if (linkedRegistry.toLowerCase() !== registryArtifact.address.toLowerCase()) {
    throw new Error(
      `AccessControl is linked to ${linkedRegistry}, expected ${registryArtifact.address}`
    );
  }

  // =========================================================================
  // FLOW 1: Standard Grant & Revoke Flow
  // =========================================================================
  console.log("=================================================================");
  console.log("FLOW 1: Document Registration -> Grant Access -> Revoke Access");
  console.log("=================================================================\n");

  const docId1 = ethers.hexlify(ethers.randomBytes(32));
  const rawContent1 = `sovereign-confidential-document-flow-1-${Date.now()}`;
  const docHash1 = ethers.sha256(ethers.toUtf8Bytes(rawContent1));
  const ipfsCid1 = "bafybeihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku";

  console.log(`[1.1] Registering Document 1 in DocumentRegistry...`);
  console.log(`Document ID:   ${docId1}`);
  console.log(`Document Hash: ${docHash1}`);
  console.log(`IPFS CID:      ${ipfsCid1}`);

  const regTx1 = await documentRegistry.registerDocument(docId1, docHash1, ipfsCid1);
  const regReceipt1 = await regTx1.wait();
  console.log(`Registration Tx: ${regTx1.hash}`);
  console.log(`Mined in Block:  ${regReceipt1?.blockNumber} (Gas Used: ${regReceipt1?.gasUsed.toString()})\n`);

  // Initial access check
  const initialAccess = await accessControl.hasAccess(docId1, verifierAddress);
  console.log(`Initial hasAccess(docId1, verifier): ${initialAccess} (expected false)\n`);

  console.log(`[1.2] Owner Granting Access to Verifier...`);
  const grantTx = await accessControl.grantAccess(docId1, verifierAddress);
  const grantReceipt = await grantTx.wait();
  console.log(`Grant Tx Hash:  ${grantTx.hash}`);
  console.log(`Mined in Block: ${grantReceipt?.blockNumber} (Gas Used: ${grantReceipt?.gasUsed.toString()})`);

  // Verify access state after grant
  const postGrantAccess = await accessControl.hasAccess(docId1, verifierAddress);
  const postGrantDirect = await accessControl.isDirectAccessGranted(docId1, verifierAddress);
  console.log(`Post-Grant hasAccess:             ${postGrantAccess} (expected true)`);
  console.log(`Post-Grant isDirectAccessGranted: ${postGrantDirect} (expected true)\n`);

  if (!postGrantAccess) {
    throw new Error("Flow 1 Error: hasAccess returned false after grantAccess transaction!");
  }

  console.log(`[1.3] Owner Revoking Access from Verifier...`);
  const revokeTx = await accessControl.revokeAccess(docId1, verifierAddress);
  const revokeReceipt = await revokeTx.wait();
  console.log(`Revoke Tx Hash: ${revokeTx.hash}`);
  console.log(`Mined in Block: ${revokeReceipt?.blockNumber} (Gas Used: ${revokeReceipt?.gasUsed.toString()})`);

  // Verify access state after revocation
  const postRevokeAccess = await accessControl.hasAccess(docId1, verifierAddress);
  const postRevokeDirect = await accessControl.isDirectAccessGranted(docId1, verifierAddress);
  console.log(`Post-Revoke hasAccess:             ${postRevokeAccess} (expected false)`);
  console.log(`Post-Revoke isDirectAccessGranted: ${postRevokeDirect} (expected false)\n`);

  if (postRevokeAccess) {
    throw new Error("Flow 1 Error: hasAccess returned true after revokeAccess transaction!");
  }

  // =========================================================================
  // FLOW 2: Document Revocation Override Invariant Flow
  // =========================================================================
  console.log("=================================================================");
  console.log("FLOW 2: Document Revocation Override Invariant Flow");
  console.log("=================================================================\n");

  const docId2 = ethers.hexlify(ethers.randomBytes(32));
  const rawContent2 = `sovereign-confidential-document-flow-2-${Date.now()}`;
  const docHash2 = ethers.sha256(ethers.toUtf8Bytes(rawContent2));
  const ipfsCid2 = "bafybeic56t72vgtfvqvhdfn3p3j2f7bopqj2g2e2n5q3w";

  console.log(`[2.1] Registering Document 2 in DocumentRegistry...`);
  const regTx2 = await documentRegistry.registerDocument(docId2, docHash2, ipfsCid2);
  await regTx2.wait();

  console.log(`[2.2] Granting Access to Verifier for Document 2...`);
  const grantTx2 = await accessControl.grantAccess(docId2, verifierAddress);
  await grantTx2.wait();

  const accessBeforeDocRevoke = await accessControl.hasAccess(docId2, verifierAddress);
  console.log(`hasAccess before Document Revocation: ${accessBeforeDocRevoke} (expected true)`);

  console.log(`[2.3] Revoking the Document Itself in DocumentRegistry...`);
  const docRevokeTx = await documentRegistry.revokeDocument(docId2);
  const docRevokeReceipt = await docRevokeTx.wait();
  console.log(`DocumentRegistry.revokeDocument Tx: ${docRevokeTx.hash}`);
  console.log(`Mined in Block: ${docRevokeReceipt?.blockNumber}`);

  const isDocRevokedOnRegistry = await documentRegistry.isRevoked(docId2);
  console.log(`DocumentRegistry.isRevoked(docId2): ${isDocRevokedOnRegistry} (expected true)\n`);

  console.log(`[2.4] Evaluating AccessControl.hasAccess on Revoked Document...`);
  const accessAfterDocRevoke = await accessControl.hasAccess(docId2, verifierAddress);
  const directAfterDocRevoke = await accessControl.isDirectAccessGranted(docId2, verifierAddress);

  console.log(`AccessControl.hasAccess:             ${accessAfterDocRevoke} (expected false - OVERRIDE CONFIRMED)`);
  console.log(`AccessControl.isDirectAccessGranted: ${directAfterDocRevoke} (expected true - AUDIT LOG PRESERVED)\n`);

  if (accessAfterDocRevoke) {
    throw new Error(
      "Flow 2 Invariant Violation: hasAccess returned true for a document revoked in DocumentRegistry!"
    );
  }

  console.log("--- All AccessControl On-Chain Interaction Tests Passed Successfully ---");
}

if (require.main === module) {
  interactAccessControl()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Interaction test failed:", error);
      process.exit(1);
    });
}
