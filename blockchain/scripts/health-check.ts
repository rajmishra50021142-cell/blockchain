import { ethers } from "hardhat";

export async function runHealthCheck(): Promise<{
  connected: boolean;
  chainId: string;
  latestBlock: number;
  account: string;
  balance: string;
}> {
  console.log("Starting Blockchain Health Check...\n");

  try {
    // 1. Verify provider connectivity
    const network = await ethers.provider.getNetwork();
    const actualChainId = network.chainId.toString();

    // 2. Network verification if expected CHAIN_ID is set in environment
    const expectedChainId = process.env.CHAIN_ID;
    if (expectedChainId && expectedChainId.trim() !== "") {
      if (actualChainId !== expectedChainId.trim()) {
        console.error("Expected network:");
        console.error(`Chain ID: ${expectedChainId}`);
        console.error("\nActual network:");
        console.error(`Chain ID: ${actualChainId}`);
        console.error("\nERROR:");
        console.error("Connected network does not match the expected network.");
        throw new Error("Connected network does not match expected network.");
      }
    }

    // 3. Retrieve actual latest block number
    const latestBlock = await ethers.provider.getBlockNumber();

    // 4. Retrieve development accounts dynamically
    const signers = await ethers.getSigners();
    if (!signers || signers.length === 0) {
      throw new Error("No development accounts available from provider.");
    }

    const firstAccount = signers[0];
    const accountAddress = await firstAccount.getAddress();

    // 5. Retrieve actual balance from provider
    const balanceWei = await ethers.provider.getBalance(accountAddress);
    const balanceEth = ethers.formatEther(balanceWei);

    // Print verified runtime output
    console.log("Blockchain Health Check\n");
    console.log("RPC: Connected");
    console.log(`Chain ID: ${actualChainId}`);
    console.log(`Latest Block: ${latestBlock}`);
    console.log(`Account: ${accountAddress}`);
    console.log(`Balance: ${balanceEth} ETH\n`);
    console.log("Status: HEALTHY");

    return {
      connected: true,
      chainId: actualChainId,
      latestBlock,
      account: accountAddress,
      balance: balanceEth,
    };
  } catch (error: any) {
    console.error("\nStatus: UNHEALTHY");
    if (
      error.code === "ECONNREFUSED" ||
      error.message?.includes("could not detect network") ||
      error.message?.includes("connection")
    ) {
      console.error("ERROR: Blockchain connection failed.");
    } else if (error.message?.includes("does not match expected network")) {
      console.error("ERROR: Connected network does not match expected network.");
    } else {
      console.error(`ERROR: Blockchain health check failed: ${error.message}`);
    }
    process.exitCode = 1;
    throw error;
  }
}

// Run directly when called via hardhat run
if (require.main === module) {
  runHealthCheck().catch(() => {
    process.exit(1);
  });
}
