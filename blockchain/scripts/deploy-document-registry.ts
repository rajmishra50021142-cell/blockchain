import { ethers, network as hardhatNetwork } from "hardhat";
import * as fs from "fs";
import * as path from "path";

export async function deployDocumentRegistry(): Promise<{
  address: string;
  txHash: string;
  blockNumber: number;
  deployer: string;
}> {
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  const isSepolia = hardhatNetwork.name === "sepolia" || chainId === 11155111;
  const targetDirName = isSepolia ? "sepolia" : "localhost";
  const networkDisplayName = isSepolia ? "Ethereum Sepolia Testnet" : "local blockchain";

  console.log(`Starting DocumentRegistry deployment to ${networkDisplayName}...\n`);

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

  const factory = await ethers.getContractFactory("DocumentRegistry", deployer);
  console.log("Submitting contract creation transaction...");

  const documentRegistry = await factory.deploy();
  await documentRegistry.waitForDeployment();

  const contractAddress = await documentRegistry.getAddress();
  const deploymentTx = documentRegistry.deploymentTransaction();

  if (!deploymentTx) {
    throw new Error("Deployment transaction was not found.");
  }

  const receipt = await deploymentTx.wait(isSepolia ? 2 : 1);

  if (!receipt) {
    throw new Error("Deployment confirmation receipt could not be obtained.");
  }

  console.log("\n--- DocumentRegistry Deployed Successfully ---");
  console.log(`Network:          ${targetDirName}`);
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Transaction Hash: ${deploymentTx.hash}`);
  console.log(`Block Number:     ${receipt.blockNumber}`);
  console.log(`Gas Used:         ${receipt.gasUsed.toString()}`);
  console.log(`Deployer:         ${deployerAddress}\n`);

  // Save deployment artifact to blockchain/deployments/<targetDirName>/DocumentRegistry.json
  const deploymentsDir = path.resolve(__dirname, `../deployments/${targetDirName}`);
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
    network: targetDirName,
    address: contractAddress,
    transactionHash: deploymentTx.hash,
    blockNumber: receipt.blockNumber,
    chainId: chainId,
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
