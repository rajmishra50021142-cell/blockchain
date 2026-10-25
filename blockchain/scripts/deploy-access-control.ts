import { ethers, network as hardhatNetwork } from "hardhat";
import * as fs from "fs";
import * as path from "path";

export async function deployAccessControl(): Promise<{
  address: string;
  txHash: string;
  blockNumber: number;
  registryAddress: string;
  deployer: string;
}> {
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  const isSepolia = hardhatNetwork.name === "sepolia" || chainId === 11155111;
  const targetDirName = isSepolia ? "sepolia" : "localhost";
  const networkDisplayName = isSepolia ? "Ethereum Sepolia Testnet" : "local blockchain";

  console.log(`Starting AccessControl deployment to ${networkDisplayName}...\n`);

  const signers = await ethers.getSigners();
  if (!signers || signers.length === 0) {
    if (isSepolia) {
      throw new Error(
        "No deployer signer configured for Sepolia. Ensure SEPOLIA_RPC_URL and SEPOLIA_DEPLOYER_PRIVATE_KEY are set in your environment."
      );
    }
    throw new Error("No deployer signer available on connected network.");
  }

  const [deployer] = signers;
  const deployerAddress = await deployer.getAddress();
  const deployerBalance = await ethers.provider.getBalance(deployerAddress);

  console.log(`Target Network:   ${targetDirName} (Chain ID: ${chainId})`);
  console.log(`Deployer Address: ${deployerAddress}`);
  console.log(`Deployer Balance: ${ethers.formatEther(deployerBalance)} ETH\n`);

  if (deployerBalance === 0n) {
    console.warn(`[WARN] Deployer account balance is 0 ETH. Transaction may fail if gas is needed.\n`);
  }

  // 1. Consume authoritative DocumentRegistry deployment artifact for the target network
  const registryArtifactPath = path.resolve(
    __dirname,
    `../deployments/${targetDirName}/DocumentRegistry.json`
  );

  let registryAddress = "";
  if (fs.existsSync(registryArtifactPath)) {
    const registryArtifact = JSON.parse(fs.readFileSync(registryArtifactPath, "utf8"));
    registryAddress = registryArtifact.address;
    console.log(`Loaded ${targetDirName} DocumentRegistry address from artifact: ${registryAddress}`);
  } else if (isSepolia && process.env.SEPOLIA_DOCUMENT_REGISTRY_ADDRESS) {
    registryAddress = process.env.SEPOLIA_DOCUMENT_REGISTRY_ADDRESS;
    console.log(`Using DocumentRegistry address from SEPOLIA_DOCUMENT_REGISTRY_ADDRESS: ${registryAddress}`);
  } else if (!isSepolia && process.env.CONTRACT_DOCUMENT_REGISTRY) {
    registryAddress = process.env.CONTRACT_DOCUMENT_REGISTRY;
    console.log(`Using DocumentRegistry address from CONTRACT_DOCUMENT_REGISTRY: ${registryAddress}`);
  }

  if (!registryAddress || !ethers.isAddress(registryAddress)) {
    throw new Error(
      `${networkDisplayName} DocumentRegistry deployment artifact not found at: ${registryArtifactPath}. Ensure DocumentRegistry is deployed first (e.g. npm run deploy:doc-registry${isSepolia ? ":sepolia" : ""}).`
    );
  }

  console.log(`Using Authoritative DocumentRegistry Address: ${registryAddress}`);

  // 2. Deploy AccessControl with authoritative DocumentRegistry address
  const factory = await ethers.getContractFactory("AccessControl", deployer);
  console.log("Submitting contract creation transaction...");

  const accessControl = await factory.deploy(registryAddress);
  await accessControl.waitForDeployment();

  const contractAddress = await accessControl.getAddress();
  const deploymentTx = accessControl.deploymentTransaction();

  if (!deploymentTx) {
    throw new Error("Deployment transaction was not found.");
  }

  const receipt = await deploymentTx.wait(isSepolia ? 2 : 1);

  if (!receipt) {
    throw new Error("Deployment confirmation receipt could not be obtained.");
  }

  // 3. Post-deployment verification of linked DocumentRegistry address
  const linkedRegistry = await accessControl.documentRegistry();
  if (linkedRegistry.toLowerCase() !== registryAddress.toLowerCase()) {
    throw new Error(
      `Configuration mismatch: AccessControl linked to ${linkedRegistry}, expected ${registryAddress}`
    );
  }
  console.log("Verified: AccessControl points to authoritative DocumentRegistry.\n");

  console.log("--- AccessControl Deployed Successfully ---");
  console.log(`Network:                ${targetDirName}`);
  console.log(`Contract Address:       ${contractAddress}`);
  console.log(`Transaction Hash:       ${deploymentTx.hash}`);
  console.log(`Block Number:           ${receipt.blockNumber}`);
  console.log(`Gas Used:               ${receipt.gasUsed.toString()}`);
  console.log(`Linked Registry:        ${linkedRegistry}`);
  console.log(`Deployer:               ${deployerAddress}\n`);

  // 4. Save deployment artifact to blockchain/deployments/<targetDirName>/AccessControl.json
  const deploymentsDir = path.resolve(__dirname, `../deployments/${targetDirName}`);
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const artifactPath = path.resolve(
    __dirname,
    "../artifacts/contracts/AccessControl.sol/AccessControl.json"
  );

  let abi: any[] = [];
  if (fs.existsSync(artifactPath)) {
    const artifactJson = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    abi = artifactJson.abi;
  }

  const deploymentData = {
    contractName: "AccessControl",
    network: targetDirName,
    address: contractAddress,
    transactionHash: deploymentTx.hash,
    blockNumber: receipt.blockNumber,
    chainId: chainId,
    registryAddress: registryAddress,
    deployer: deployerAddress,
    deployedAt: new Date().toISOString(),
    abi,
  };

  const outputPath = path.join(deploymentsDir, "AccessControl.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentData, null, 2), "utf8");
  console.log(`Deployment artifact saved to: ${outputPath}\n`);

  return {
    address: contractAddress,
    txHash: deploymentTx.hash,
    blockNumber: receipt.blockNumber,
    registryAddress: registryAddress,
    deployer: deployerAddress,
  };
}

if (require.main === module) {
  deployAccessControl()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Deployment failed:", error);
      process.exit(1);
    });
}
