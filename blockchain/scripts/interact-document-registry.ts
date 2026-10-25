import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

export async function interactWithDocumentRegistry(
  existingContractAddress?: string
): Promise<void> {
  console.log("Starting DocumentRegistry interaction test on local blockchain...\n");

  const [owner, otherUser] = await ethers.getSigners();
  const ownerAddress = await owner.getAddress();
  const otherAddress = await otherUser.getAddress();

  console.log(`Document Owner Address: ${ownerAddress}`);
  console.log(`Other Account Address:  ${otherAddress}\n`);

  let contractAddress = existingContractAddress;

  const network = await ethers.provider.getNetwork();
  const isSepolia = Number(network.chainId) === 11155111;
  const targetDir = isSepolia ? "sepolia" : "localhost";

  if (!contractAddress) {
    // Attempt to load from deployments/<targetDir>/DocumentRegistry.json
    const deploymentPath = path.resolve(
      __dirname,
      `../deployments/${targetDir}/DocumentRegistry.json`
    );

    if (fs.existsSync(deploymentPath)) {
      const data = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
      contractAddress = data.address;
      console.log(`Loaded deployed contract address from artifacts: ${contractAddress}\n`);
    } else {
      console.log("No existing deployment found. Deploying fresh instance...");
      const factory = await ethers.getContractFactory("DocumentRegistry", owner);
      const instance = await factory.deploy();
      await instance.waitForDeployment();
      contractAddress = await instance.getAddress();
      console.log(`Fresh contract deployed at: ${contractAddress}\n`);
    }
  }

  const documentRegistry = await ethers.getContractAt(
    "DocumentRegistry",
    contractAddress,
    owner
  );

  // 1. Generate opaque 32-byte document ID and 32-byte SHA-256 digest
  const documentId = ethers.hexlify(ethers.randomBytes(32));
  const documentHash = ethers.sha256(
    ethers.toUtf8Bytes("authentic-institutional-document-payload-2026")
  );
  const ipfsCid = "bafybeihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku";

  console.log("--- 1. Registering Document On-Chain ---");
  console.log(`Document ID:   ${documentId}`);
  console.log(`Document Hash: ${documentHash} (SHA-256)`);
  console.log(`IPFS CID:      ${ipfsCid}`);

  const registerTx = await documentRegistry.registerDocument(
    documentId,
    documentHash,
    ipfsCid
  );
  console.log(`Registration Tx Submitted: ${registerTx.hash}`);
  const registerReceipt = await registerTx.wait(1);

  if (!registerReceipt || registerReceipt.status !== 1) {
    throw new Error("Registration transaction failed on-chain.");
  }

  console.log(`Registration Mined in Block: ${registerReceipt.blockNumber}`);
  console.log(`Gas Used for Registration:   ${registerReceipt.gasUsed.toString()}\n`);

  // 2. Read back registered state
  console.log("--- 2. Verifying Stored On-Chain State ---");
  const storedDoc = await documentRegistry.getDocument(documentId);
  console.log(`Stored Owner:         ${storedDoc.owner}`);
  console.log(`Stored Hash:          ${storedDoc.documentHash}`);
  console.log(`Stored CID:           ${storedDoc.ipfsCid}`);
  console.log(`Stored Timestamp:     ${storedDoc.registeredAt.toString()} (${new Date(Number(storedDoc.registeredAt) * 1000).toISOString()})`);
  console.log(`Stored Revoked Flag:  ${storedDoc.revoked}\n`);

  if (storedDoc.owner.toLowerCase() !== ownerAddress.toLowerCase()) {
    throw new Error("Document owner does not match msg.sender.");
  }

  // 3. User documents lookup
  const userDocs = await documentRegistry.getUserDocuments(ownerAddress);
  console.log(`Owner Registered Documents Count: ${userDocs.length}`);
  console.log(`Contains Current Document ID:     ${userDocs.includes(documentId)}\n`);

  // 4. Test Revocation
  console.log("--- 3. Testing Owner Revocation ---");
  const revokeTx = await documentRegistry.revokeDocument(documentId);
  console.log(`Revocation Tx Submitted: ${revokeTx.hash}`);
  const revokeReceipt = await revokeTx.wait(1);

  if (!revokeReceipt || revokeReceipt.status !== 1) {
    throw new Error("Revocation transaction failed on-chain.");
  }

  console.log(`Revocation Mined in Block: ${revokeReceipt.blockNumber}`);
  console.log(`Gas Used for Revocation:   ${revokeReceipt.gasUsed.toString()}`);

  const isRevokedState = await documentRegistry.isRevoked(documentId);
  console.log(`isRevoked Query Result:    ${isRevokedState}\n`);

  if (!isRevokedState) {
    throw new Error("Document revocation failed to persist on-chain.");
  }

  console.log("--- DocumentRegistry Interaction Test Completed Successfully ---");
}

if (require.main === module) {
  interactWithDocumentRegistry()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Interaction failed:", error);
      process.exit(1);
    });
}
