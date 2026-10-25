import { ethers } from "hardhat";

export async function sendTestTransaction(): Promise<{
  txHash: string;
  from: string;
  to: string;
  value: string;
  blockNumber: number;
  status: number;
  gasUsed: string;
  blockHash: string;
  timestamp: number;
}> {
  console.log("Starting Real Native Blockchain Transaction Test...\n");

  try {
    // 1. Retrieve development signers dynamically from provider
    const signers = await ethers.getSigners();
    if (signers.length < 2) {
      throw new Error("At least two development accounts are required to perform a transaction test.");
    }

    const sender = signers[0];
    const receiver = signers[1];

    const senderAddress = await sender.getAddress();
    const receiverAddress = await receiver.getAddress();

    console.log(`Sender Account:   ${senderAddress}`);
    console.log(`Receiver Account: ${receiverAddress}`);

    const senderInitialBalance = await ethers.provider.getBalance(senderAddress);
    const receiverInitialBalance = await ethers.provider.getBalance(receiverAddress);

    console.log(`Sender Initial Balance:   ${ethers.formatEther(senderInitialBalance)} ETH`);
    console.log(`Receiver Initial Balance: ${ethers.formatEther(receiverInitialBalance)} ETH\n`);

    // Amount to transfer: 0.05 ETH
    const transferAmountWei = ethers.parseEther("0.05");

    console.log("Submitting native transfer transaction...");
    const txResponse = await sender.sendTransaction({
      to: receiverAddress,
      value: transferAmountWei,
    });

    console.log(`Transaction submitted with hash: ${txResponse.hash}`);
    console.log("Waiting for block confirmation and receipt...");

    // Wait for 1 confirmation
    const receipt = await txResponse.wait(1);

    if (!receipt) {
      throw new Error("Transaction was submitted, but confirmation receipt could not be obtained.");
    }

    if (receipt.status !== 1) {
      throw new Error(`Transaction failed with status: ${receipt.status}`);
    }

    console.log("\n--- Real Transaction Confirmed ---");
    console.log(`Transaction Hash:    ${receipt.hash}`);
    console.log(`Status:              ${receipt.status === 1 ? "SUCCESS (1)" : "FAILED (0)"}`);
    console.log(`Block Number:        ${receipt.blockNumber}`);
    console.log(`From:                ${receipt.from}`);
    console.log(`To:                  ${receipt.to}`);
    console.log(`Value Transferred:   ${ethers.formatEther(transferAmountWei)} ETH`);
    console.log(`Gas Used:            ${receipt.gasUsed.toString()}`);
    console.log(
      `Effective Gas Price: ${receipt.gasPrice ? ethers.formatUnits(receipt.gasPrice, "gwei") + " Gwei" : "N/A"}`
    );

    // Retrieve and inspect the actual mined block
    const block = await ethers.provider.getBlock(receipt.blockNumber);
    if (!block) {
      throw new Error(`Unable to fetch block data for block number ${receipt.blockNumber}`);
    }

    console.log("\n--- Mined Block Inspection ---");
    console.log(`Block Number:        ${block.number}`);
    console.log(`Block Hash:          ${block.hash}`);
    console.log(`Timestamp:           ${new Date(block.timestamp * 1000).toISOString()} (${block.timestamp})`);
    console.log(`Transactions Count:  ${block.transactions.length}`);

    // Verify balance changes
    const senderFinalBalance = await ethers.provider.getBalance(senderAddress);
    const receiverFinalBalance = await ethers.provider.getBalance(receiverAddress);

    console.log("\n--- Post-Transaction Balances ---");
    console.log(`Sender Final Balance:     ${ethers.formatEther(senderFinalBalance)} ETH`);
    console.log(`Receiver Final Balance:   ${ethers.formatEther(receiverFinalBalance)} ETH\n`);

    return {
      txHash: receipt.hash,
      from: receipt.from,
      to: receipt.to || receiverAddress,
      value: ethers.formatEther(transferAmountWei),
      blockNumber: receipt.blockNumber,
      status: receipt.status,
      gasUsed: receipt.gasUsed.toString(),
      blockHash: block.hash || "N/A",
      timestamp: block.timestamp,
    };
  } catch (error: any) {
    console.error("\nERROR: Real transaction test failed.");
    console.error(`Details: ${error.message}`);
    process.exitCode = 1;
    throw error;
  }
}

// Run directly when called via hardhat run
if (require.main === module) {
  sendTestTransaction().catch(() => {
    process.exit(1);
  });
}
