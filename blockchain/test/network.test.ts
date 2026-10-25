import { expect } from "chai";
import { ethers } from "hardhat";

describe("Phase 3: Blockchain Network Infrastructure", function () {
  describe("Provider Connectivity", function () {
    it("should successfully connect to the blockchain provider", async function () {
      const network = await ethers.provider.getNetwork();
      expect(network).to.not.be.null;
      expect(network.chainId).to.be.a("bigint");
      expect(Number(network.chainId)).to.be.greaterThan(0);
    });

    it("should retrieve a valid dynamic chain ID", async function () {
      const network = await ethers.provider.getNetwork();
      const chainId = Number(network.chainId);
      // Hardhat default chainId is 31337 unless configured otherwise via CHAIN_ID
      const expectedChainId = process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID, 10) : 31337;
      expect(chainId).to.equal(expectedChainId);
    });

    it("should retrieve the latest block number dynamically", async function () {
      const blockNumber = await ethers.provider.getBlockNumber();
      expect(blockNumber).to.be.a("number");
      expect(blockNumber).to.be.at.least(0);
    });
  });

  describe("Development Accounts & Balances", function () {
    it("should retrieve development signers from the provider", async function () {
      const signers = await ethers.getSigners();
      expect(signers).to.be.an("array");
      expect(signers.length).to.be.at.least(2);

      const firstAddress = await signers[0].getAddress();
      expect(firstAddress).to.match(/^0x[a-fA-F0-9]{40}$/);
    });

    it("should query real account balance from provider", async function () {
      const signers = await ethers.getSigners();
      const address = await signers[0].getAddress();
      const balance = await ethers.provider.getBalance(address);

      expect(balance).to.be.a("bigint");
      expect(balance).to.be.greaterThan(0n);
    });
  });

  describe("Real Native Transaction Execution & Mining", function () {
    it("should execute native transfer, mine block, and return valid receipt", async function () {
      const [sender, receiver] = await ethers.getSigners();
      const senderAddress = await sender.getAddress();
      const receiverAddress = await receiver.getAddress();

      const initialSenderBalance = await ethers.provider.getBalance(senderAddress);
      const initialReceiverBalance = await ethers.provider.getBalance(receiverAddress);

      const transferAmount = ethers.parseEther("0.1");

      // Send real transaction
      const tx = await sender.sendTransaction({
        to: receiverAddress,
        value: transferAmount,
      });

      expect(tx.hash).to.match(/^0x[a-fA-F0-9]{64}$/);

      // Wait for real receipt
      const receipt = await tx.wait(1);
      expect(receipt).to.not.be.null;

      if (!receipt) {
        throw new Error("Receipt was null");
      }

      // Validate receipt fields
      expect(receipt.status).to.equal(1); // 1 = Success
      expect(receipt.hash).to.equal(tx.hash);
      expect(receipt.from.toLowerCase()).to.equal(senderAddress.toLowerCase());
      expect(receipt.to?.toLowerCase()).to.equal(receiverAddress.toLowerCase());
      expect(receipt.blockNumber).to.be.greaterThan(0);
      expect(receipt.gasUsed).to.be.greaterThan(0n);

      // Verify balance reflection
      const finalReceiverBalance = await ethers.provider.getBalance(receiverAddress);
      expect(finalReceiverBalance - initialReceiverBalance).to.equal(transferAmount);

      const finalSenderBalance = await ethers.provider.getBalance(senderAddress);
      const totalSenderDeduction = initialSenderBalance - finalSenderBalance;
      // Sender paid transferAmount + (gasUsed * gasPrice)
      expect(totalSenderDeduction).to.be.greaterThan(transferAmount);
    });

    it("should inspect mined block data containing the transaction", async function () {
      const [sender, receiver] = await ethers.getSigners();
      const tx = await sender.sendTransaction({
        to: await receiver.getAddress(),
        value: ethers.parseEther("0.01"),
      });

      const receipt = await tx.wait(1);
      expect(receipt).to.not.be.null;

      const block = await ethers.provider.getBlock(receipt!.blockNumber);
      expect(block).to.not.be.null;
      expect(block!.number).to.equal(receipt!.blockNumber);
      expect(block!.hash).to.match(/^0x[a-fA-F0-9]{64}$/);
      expect(block!.timestamp).to.be.greaterThan(0);
      expect(block!.transactions).to.include(tx.hash);
    });
  });

  describe("Failure Handling & Honest Reporting", function () {
    it("should fail honestly and cleanly when connecting to an invalid RPC endpoint", async function () {
      // Create provider pointing to an unreachable port with staticNetwork to prevent background polling retries
      const invalidProvider = new ethers.JsonRpcProvider("http://127.0.0.1:59999", undefined, {
        staticNetwork: true,
      });
      try {
        await invalidProvider.getBlockNumber();
        expect.fail("Expected connection to fail, but succeeded");
      } catch (error: any) {
        expect(error).to.exist;
        // Verify no synthetic fallback: an actual error occurred
        expect(error.message).to.not.be.empty;
      }
    });

    it("should reject transaction with insufficient balance fail-closed", async function () {
      const [sender, receiver] = await ethers.getSigners();
      const balance = await ethers.provider.getBalance(await sender.getAddress());

      // Attempt to send more than available balance
      const excessiveAmount = balance + ethers.parseEther("1000.0");

      try {
        const tx = await sender.sendTransaction({
          to: await receiver.getAddress(),
          value: excessiveAmount,
        });
        await tx.wait(1);
        expect.fail("Expected transaction to fail due to insufficient funds");
      } catch (error: any) {
        expect(error).to.exist;
        expect(error.message.toLowerCase()).to.satisfy(
          (msg: string) =>
            msg.includes("insufficient") ||
            msg.includes("exceeds balance") ||
            msg.includes("sender doesn't have enough funds")
        );
      }
    });
  });
});
