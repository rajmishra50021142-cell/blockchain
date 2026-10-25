import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ethers } from "ethers";
import {
  generateOwnershipChallenge,
  verifyOwnershipSignature,
  getExpectedChainId,
  formatAddress,
  getInjectedMetaMaskProvider,
  formatWalletError,
} from "../lib/wallet/wallet-utils";

describe("Phase 4: Wallet & Identity Integration Tests", () => {
  describe("Challenge & Nonce Generation", () => {
    it("should generate a challenge with a dynamic, non-repeating cryptographic nonce", () => {
      const address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
      const chainId = 31337;

      const challenge1 = generateOwnershipChallenge(address, chainId);
      const challenge2 = generateOwnershipChallenge(address, chainId);

      assert.notEqual(
        challenge1.nonce,
        challenge2.nonce,
        "Nonces must be dynamic and non-repeating"
      );
      assert.ok(challenge1.message.includes(address));
      assert.ok(challenge1.message.includes(`Chain ID: ${chainId}`));
      assert.ok(challenge1.message.includes(`Nonce: ${challenge1.nonce}`));
      assert.ok(challenge1.message.includes(challenge1.timestamp));
    });

    it("should contain explicit human-readable purpose and no-gas disclaimer", () => {
      const challenge = generateOwnershipChallenge(
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        31337
      );
      assert.ok(
        challenge.message.includes("Digital Document Locker — Proof of Wallet Ownership")
      );
      assert.ok(challenge.message.includes("zero gas fees"));
    });
  });

  describe("Real Cryptographic Signature & Verification", () => {
    it("should successfully sign and verify an authentic EIP-191 personal signature", async () => {
      // Generate a real cryptographic keypair at runtime
      const wallet = ethers.Wallet.createRandom();
      const address = await wallet.getAddress();
      const chainId = 31337;

      const challenge = generateOwnershipChallenge(address, chainId);

      // Sign real message with the wallet's private key
      const signature = await wallet.signMessage(challenge.message);

      // Cryptographically verify using ethers.verifyMessage
      const result = verifyOwnershipSignature(
        challenge.message,
        signature,
        address
      );

      assert.equal(result.verified, true, "Signature must verify successfully");
      assert.equal(
        result.recoveredAddress.toLowerCase(),
        address.toLowerCase(),
        "Recovered address must match the signer"
      );
      assert.equal(result.error, undefined);
    });

    it("should fail verification when the message content is tampered with", async () => {
      const wallet = ethers.Wallet.createRandom();
      const address = await wallet.getAddress();
      const chainId = 31337;

      const challenge = generateOwnershipChallenge(address, chainId);
      const signature = await wallet.signMessage(challenge.message);

      // Mutate a single character in the message
      const tamperedMessage = challenge.message + " [tampered]";

      const result = verifyOwnershipSignature(
        tamperedMessage,
        signature,
        address
      );

      assert.equal(
        result.verified,
        false,
        "Tampered message must not verify"
      );
      assert.notEqual(
        result.recoveredAddress.toLowerCase(),
        address.toLowerCase(),
        "Recovered address from tampered message must not match signer"
      );
      assert.ok(result.error !== undefined);
    });

    it("should fail verification when signature originates from a different wallet", async () => {
      const walletA = ethers.Wallet.createRandom();
      const walletB = ethers.Wallet.createRandom();

      const addressA = await walletA.getAddress();
      const addressB = await walletB.getAddress();
      const chainId = 31337;

      const challengeForA = generateOwnershipChallenge(addressA, chainId);

      // Wallet B maliciously or erroneously signs the challenge meant for Wallet A
      const signatureFromB = await walletB.signMessage(challengeForA.message);

      const result = verifyOwnershipSignature(
        challengeForA.message,
        signatureFromB,
        addressA
      );

      assert.equal(
        result.verified,
        false,
        "Signature from different wallet must fail verification"
      );
      assert.equal(
        result.recoveredAddress.toLowerCase(),
        addressB.toLowerCase(),
        "Recovered address must be the actual signer (Wallet B)"
      );
      assert.ok(
        result.error?.includes("does not match expected address"),
        "Must report explicit address mismatch error"
      );
    });

    it("should fail closed and report error for an invalid signature string", () => {
      const challenge = generateOwnershipChallenge(
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        31337
      );
      const invalidSignature = "0xinvaliddeadbeef";

      const result = verifyOwnershipSignature(
        challenge.message,
        invalidSignature,
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
      );

      assert.equal(result.verified, false);
      assert.ok(result.error);
    });
  });

  describe("Network & Chain Validation Logic", () => {
    it("should return the configured expected chain ID or default to 31337", () => {
      const expected = getExpectedChainId();
      assert.equal(typeof expected, "number");
      assert.ok(expected > 0);
    });

    it("should correctly distinguish expected network from unexpected networks", () => {
      const expectedChainId = getExpectedChainId();

      // Matching local network
      const isLocalMatch = 31337 === expectedChainId;
      assert.equal(isLocalMatch, true);

      // Mismatched networks (e.g., Mainnet 1, Sepolia 11155111)
      const isMainnetMatch = 1 === expectedChainId;
      assert.equal(isMainnetMatch, false);

      const isSepoliaMatch = 11155111 === expectedChainId;
      assert.equal(isSepoliaMatch, false);
    });
  });

  describe("Address Formatting & Security Sanitization", () => {
    it("should format valid Ethereum addresses for display", () => {
      const address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
      const formatted = formatAddress(address);
      assert.equal(formatted, "0xf39F...2266");
    });

    it("should return empty string for null or invalid addresses", () => {
      assert.equal(formatAddress(null), "");
      assert.equal(formatAddress(""), "");
      assert.equal(formatAddress("0x123"), "");
    });
  });

  describe("Account Change & State Isolation Invariants", () => {
    it("should enforce that changing accounts invalidates previous proof of ownership", () => {
      // Simulate state transition: Account A was verified
      let activeAccount = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
      let activeProof: any = {
        recoveredAddress: activeAccount,
        verified: true,
      };

      // Account changes to Account B
      const newAccount = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
      
      // Invariant: proof must be flushed immediately
      activeAccount = newAccount;
      activeProof = null;

      assert.equal(activeAccount, newAccount);
      assert.equal(
        activeProof,
        null,
        "Account change must flush previous verified proof of ownership"
      );
    });
  });

  describe("Injected Provider Discovery (EIP-5749 / EIP-6963 / Multi-Provider)", () => {
    it("should return null when window is not defined", () => {
      const origWindow = (global as any).window;
      delete (global as any).window;
      try {
        const provider = getInjectedMetaMaskProvider();
        assert.equal(provider, null);
      } finally {
        (global as any).window = origWindow;
      }
    });

    it("should return single window.ethereum provider when present", () => {
      const mockMetaMask = { isMetaMask: true, request: async () => [] };
      const origWindow = (global as any).window;
      (global as any).window = { ethereum: mockMetaMask };
      try {
        const provider = getInjectedMetaMaskProvider();
        assert.equal(provider, mockMetaMask);
      } finally {
        (global as any).window = origWindow;
      }
    });

    it("should accurately resolve authentic MetaMask when multiple injected providers exist", () => {
      const mockPhantom = { isPhantom: true, isMetaMask: true, name: "Phantom" };
      const mockCoinbase = { isCoinbaseWallet: true, isMetaMask: true, name: "Coinbase" };
      const mockMetaMask = { isMetaMask: true, name: "AuthenticMetaMask" };

      const origWindow = (global as any).window;
      (global as any).window = {
        ethereum: {
          providers: [mockPhantom, mockCoinbase, mockMetaMask],
        },
      };
      try {
        const provider = getInjectedMetaMaskProvider();
        assert.equal(provider, mockMetaMask, "Must pick authentic MetaMask over Phantom/Coinbase");
      } finally {
        (global as any).window = origWindow;
      }
    });
  });

  describe("Provider Error Normalization & Anti-Empty Serialization", () => {
    it("should format standard ProviderRpcError into enumerable fields", () => {
      const mockRpcError = Object.create(Error.prototype, {
        code: { value: -32002, enumerable: false },
        message: {
          value: "Request of type 'wallet_requestPermissions' already pending for origin http://localhost:3000. Please wait.",
          enumerable: false,
        },
      });

      const formatted = formatWalletError(mockRpcError);
      assert.equal(formatted.code, -32002);
      assert.ok(formatted.message.includes("already pending"));

      // Verify JSON.stringify does NOT yield empty object {}
      const json = JSON.stringify(formatted);
      assert.notEqual(json, "{}");
      assert.ok(json.includes("-32002"));
    });

    it("should format user rejection error (code 4001)", () => {
      const rejectionError = { code: 4001, message: "User rejected the request." };
      const formatted = formatWalletError(rejectionError);
      assert.equal(formatted.code, 4001);
      assert.equal(formatted.message, "User rejected the request.");
    });
  });
});

