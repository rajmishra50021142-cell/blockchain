/**
 * Phase 13: Document Sharing & Access Revocation Service Unit Tests
 *
 * Verifies domain logic, address validation, authority checks, and revocation invariants.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ethers } from "ethers";
import {
  validateVerifierAddress,
  validateOwnerAuthority,
  validateDocumentActiveForGrant,
  validateNetwork,
} from "../lib/sharing/sharing-service";
import { config } from "../lib/config/env";

describe("Phase 13: Sharing Service & Address Validation Unit Tests", () => {
  describe("Verifier Address Validation", () => {
    it("should accept valid checksummed Ethereum address", () => {
      const validAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
      const result = validateVerifierAddress(validAddress);
      assert.equal(result.valid, true);
      assert.equal(result.normalizedAddress, validAddress.toLowerCase());
      assert.equal(result.error, undefined);
    });

    it("should accept valid lowercase 20-byte address", () => {
      const validLower = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";
      const result = validateVerifierAddress(validLower);
      assert.equal(result.valid, true);
      assert.equal(result.normalizedAddress, validLower);
    });

    it("should trim surrounding whitespace from otherwise valid address", () => {
      const padded = "   0x70997970C51812dc3A010C7d01b50e0d17dc79C8   ";
      const result = validateVerifierAddress(padded);
      assert.equal(result.valid, true);
      assert.equal(result.normalizedAddress, "0x70997970c51812dc3a010c7d01b50e0d17dc79c8");
    });

    it("should reject empty or whitespace-only address fail-closed", () => {
      const resEmpty = validateVerifierAddress("");
      assert.equal(resEmpty.valid, false);
      assert.match(resEmpty.error!, /Verifier address/);

      const resWhitespace = validateVerifierAddress("   ");
      assert.equal(resWhitespace.valid, false);
      assert.match(resWhitespace.error!, /cannot be empty/);
    });

    it("should reject malformed or non-hex strings", () => {
      const res1 = validateVerifierAddress("not-an-address");
      assert.equal(res1.valid, false);
      assert.match(res1.error!, /Invalid Ethereum address format/);

      const res2 = validateVerifierAddress("0xZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ");
      assert.equal(res2.valid, false);
      assert.match(res2.error!, /Invalid Ethereum address format/);
    });

    it("should reject truncated or short hex strings", () => {
      const res = validateVerifierAddress("0x123456");
      assert.equal(res.valid, false);
      assert.match(res.error!, /Expected 20-byte/);
    });

    it("should strictly reject the zero address", () => {
      const zeroAddr = ethers.ZeroAddress;
      const result = validateVerifierAddress(zeroAddr);
      assert.equal(result.valid, false);
      assert.match(result.error!, /Zero address .* cannot be authorized/);
    });

    it("should reject self-granting by document owner", () => {
      const owner = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
      const result = validateVerifierAddress(owner, owner);
      assert.equal(result.valid, false);
      assert.match(result.error!, /Document owner already holds sovereign access/);
    });
  });

  describe("Owner Authority Validation", () => {
    const ownerAddress = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";

    it("should pass when connected wallet matches document owner", () => {
      assert.doesNotThrow(() => {
        validateOwnerAuthority(ownerAddress, ownerAddress);
      });
    });

    it("should pass when addresses differ only by casing", () => {
      assert.doesNotThrow(() => {
        validateOwnerAuthority(
          "0xF39FD6E51AAD88F6F4CE6AB8827279CFFFB92266",
          ownerAddress
        );
      });
    });

    it("should throw error if connected wallet is null", () => {
      assert.throws(
        () => validateOwnerAuthority(null, ownerAddress),
        /Wallet not connected/
      );
    });

    it("should throw error if connected wallet does not match document owner", () => {
      const strangerAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
      assert.throws(
        () => validateOwnerAuthority(strangerAddress, ownerAddress),
        /Unauthorized: Connected wallet .* is not the document owner/
      );
    });
  });

  describe("Document Revocation Invariant Check", () => {
    it("should allow granting access when document is active (not revoked)", () => {
      assert.doesNotThrow(() => {
        validateDocumentActiveForGrant(false);
      });
    });

    it("should throw error when document is revoked on-chain", () => {
      assert.throws(
        () => validateDocumentActiveForGrant(true),
        /Cannot grant access: This document has been revoked on-chain/
      );
    });
  });

  describe("Network Validation", () => {
    it("should pass when chainId matches expected configured chain", () => {
      assert.doesNotThrow(() => {
        validateNetwork(config.expectedChainId);
      });
    });

    it("should throw error when chainId is null", () => {
      assert.throws(
        () => validateNetwork(null),
        /Blockchain network not detected/
      );
    });

    it("should throw error when connected to wrong chain ID", () => {
      assert.throws(
        () => validateNetwork(1), // Ethereum Mainnet
        /Wrong network: Connected to chain ID 1, expected chain ID 31337/
      );
    });
  });
});
