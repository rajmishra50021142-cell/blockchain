import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

export async function deployDocumentRegistry(): Promise<{
  address: string;
  txHash: string;
  blockNumber: number;
  deployer: string;
}> {
  console.log("Starting DocumentRegistry deployment to local blockchain...\n");

  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const deployerBalance = await ethers.provider.getBalance(deployerAddress);

  console.log(`Deployer Address: ${deployerAddress}`);
  console.log(`Deployer Balance: ${ethers.formatEther(deployerBalance)} ETH\n`);

  const network = await ethers.provider.getNetwork();
  console.log(`Connected Chain ID: ${network.chainId.toString()}`);

  const factory = await ethers.getContractFactory("DocumentRegistry", deployer);
  console.log("Submitting contract creation transaction...");

  const documentRegistry = await factory.deploy();
  await documentRegistry.waitForDeployment();

  const contractAddress = await documentRegistry.getAddress();
  const deploymentTx = documentRegistry.deploymentTransaction();

  if (!deploymentTx) {
    throw new Error("Deployment transaction was not found.");
  }

  const receipt = await deploymentTx.wait(1);

  if (!receipt) {
    throw new Error("Deployment confirmation receipt could not be obtained.");
  }

  console.log("\n--- DocumentRegistry Deployed Successfully ---");
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Transaction Hash: ${deploymentTx.hash}`);
  console.log(`Block Number:     ${receipt.blockNumber}`);
  console.log(`Gas Used:         ${receipt.gasUsed.toString()}`);
  console.log(`Deployer:         ${deployerAddress}\n`);

  // Save deployment artifact to blockchain/deployments/localhost/DocumentRegistry.json
  const deploymentsDir = path.resolve(__dirname, "../deployments/localhost");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Read generated ABI from Hardhat artifacts
  const artifactPath = path.resolve(
    __dirname,
    "../artifacts/contracts/DocumentRegistry.sol/DocumentRegistry.json"
  );

  let abi: any[] = [];
  if (fs.existsSync(artifactPath)) {
    const artifactJson = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    abi = artifactJson.abi;
  }

  const deploymentData = {
    contractName: "DocumentRegistry",
    address: contractAddress,
    transactionHash: deploymentTx.hash,
    blockNumber: receipt.blockNumber,
    chainId: Number(network.chainId),
    deployer: deployerAddress,
    deployedAt: new Date().toISOString(),
    abi,
  };

  const outputPath = path.join(deploymentsDir, "DocumentRegistry.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentData, null, 2), "utf8");
  console.log(`Deployment artifact saved to: ${outputPath}\n`);

  return {
    address: contractAddress,
    txHash: deploymentTx.hash,
    blockNumber: receipt.blockNumber,
    deployer: deployerAddress,
  };
}

if (require.main === module) {
  deployDocumentRegistry()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Deployment failed:", error);
      process.exit(1);
    });
}
