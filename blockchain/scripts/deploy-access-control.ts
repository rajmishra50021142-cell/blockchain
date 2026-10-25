import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

export async function deployAccessControl(): Promise<{
  address: string;
  txHash: string;
  blockNumber: number;
  registryAddress: string;
  deployer: string;
}> {
  console.log("Starting AccessControl deployment to local blockchain...\n");

  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const deployerBalance = await ethers.provider.getBalance(deployerAddress);

  console.log(`Deployer Address: ${deployerAddress}`);
  console.log(`Deployer Balance: ${ethers.formatEther(deployerBalance)} ETH\n`);

  const network = await ethers.provider.getNetwork();
  console.log(`Connected Chain ID: ${network.chainId.toString()}`);

  // 1. Consume actual DocumentRegistry deployment artifact
  const registryArtifactPath = path.resolve(
    __dirname,
    "../deployments/localhost/DocumentRegistry.json"
  );

  if (!fs.existsSync(registryArtifactPath)) {
    throw new Error(
      `DocumentRegistry deployment artifact not found at: ${registryArtifactPath}. Ensure DocumentRegistry is deployed first.`
    );
  }

  const registryArtifact = JSON.parse(fs.readFileSync(registryArtifactPath, "utf8"));
  const registryAddress = registryArtifact.address;

  if (!registryAddress || !ethers.isAddress(registryAddress)) {
    throw new Error(
      `Invalid DocumentRegistry address found in deployment artifact: ${registryAddress}`
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

  const receipt = await deploymentTx.wait(1);

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
  console.log(`Contract Address:       ${contractAddress}`);
  console.log(`Transaction Hash:       ${deploymentTx.hash}`);
  console.log(`Block Number:           ${receipt.blockNumber}`);
  console.log(`Gas Used:               ${receipt.gasUsed.toString()}`);
  console.log(`Linked Registry:        ${linkedRegistry}`);
  console.log(`Deployer:               ${deployerAddress}\n`);

  // 4. Save deployment artifact to blockchain/deployments/localhost/AccessControl.json
  const deploymentsDir = path.resolve(__dirname, "../deployments/localhost");
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
    address: contractAddress,
    transactionHash: deploymentTx.hash,
    blockNumber: receipt.blockNumber,
    chainId: Number(network.chainId),
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
