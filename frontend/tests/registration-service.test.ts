/**
 * Phase 12: Registration Service & Helper Unit Tests
 *
 * Verifies document ID generation, network validation, wallet-session alignment,
 * and cryptographic preparation pipeline without synthetic runtime data.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ethers } from "ethers";
import {
  generateSecureDocumentId,
  validateNetwork,
  validateWalletSessionAlignment,
} from "../lib/registration/registration-service";
import { config } from "../lib/config/env";
import { hashDocument, encryptDocument, decryptDocument } from "../lib/crypto/document-crypto";

describe("Phase 12: Registration Service & Cryptographic Unit Tests", () => {
  describe("Secure Document ID Generation", () => {
    it("should generate a valid bytes32 hex string (0x-prefixed 64 hex characters)", () => {
      const docId = generateSecureDocumentId();
      assert.match(docId, /^0x[0-9a-fA-F]{64}$/, "Must be 0x-prefixed 64-hex string");
      assert.equal(ethers.getBytes(docId).length, 32, "Must be exactly 32 bytes");
    });

    it("should produce non-repeating nonces with 256 bits of CSPRNG entropy", () => {
      const set = new Set<string>();
      const iterations = 50;
      for (let i = 0; i < iterations; i++) {
        const id = generateSecureDocumentId();
        assert.ok(!set.has(id), `Duplicate document ID generated at iteration ${i}`);
        set.add(id);
      }
      assert.equal(set.size, iterations);
    });
  });

  describe("Network Validation", () => {
    it("should pass validation when chain ID matches expectedChainId", () => {
      assert.doesNotThrow(() => {
        validateNetwork(config.expectedChainId);
      });
    });

    it("should throw error if chain ID is null or undefined", () => {
      assert.throws(
        () => validateNetwork(null),
        /Unable to detect blockchain network/
      );
    });

    it("should throw error if chain ID does not match expectedChainId", () => {
      const wrongChainId = config.expectedChainId + 1;
      assert.throws(
        () => validateNetwork(wrongChainId),
        /Incorrect network detected/
      );
    });
  });

  describe("Wallet & Session Alignment", () => {
    it("should pass when connected wallet matches authenticated backend identity", () => {
      const addr = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
      assert.doesNotThrow(() => {
        validateWalletSessionAlignment(addr, addr);
      });
    });

    it("should pass when addresses differ only by case", () => {
      const addrLower = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";
      const addrMixed = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
      assert.doesNotThrow(() => {
        validateWalletSessionAlignment(addrLower, addrMixed);
      });
    });

    it("should reject when wallet address is null", () => {
      assert.throws(
        () => validateWalletSessionAlignment(null, "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"),
        /Wallet not connected/
      );
    });

    it("should reject when authenticated session address is null", () => {
      assert.throws(
        () => validateWalletSessionAlignment("0x70997970C51812dc3A010C7d01b50e0d17dc79C8", null),
        /Backend authentication missing/
      );
    });

    it("should reject when connected wallet does not match authenticated identity", () => {
      const addrA = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
      const addrB = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
      assert.throws(
        () => validateWalletSessionAlignment(addrA, addrB),
        /Session mismatch/
      );
    });
  });

  describe("Cryptographic Preparation Pipeline", () => {
    it("should compute canonical bytes32 SHA-256 digest from raw document bytes", async () => {
      const testBytes = new TextEncoder().encode("CONFIDENTIAL AGREEMENT: Phase 12 sovereign document test.");
      const hashRes = await hashDocument(testBytes);

      assert.match(hashRes.bytes32, /^0x[0-9a-fA-F]{64}$/);
      assert.equal(ethers.getBytes(hashRes.bytes32).length, 32);
    });

    it("should encrypt document using AES-256-GCM and restore original bytes on decryption", async () => {
      const testBytes = new TextEncoder().encode("EMERGENCY MEDICAL RECORD #908123 — RESTRICTED ACCESS");
      const encRes = await encryptDocument(testBytes);

      assert.ok(encRes.serialized.length > testBytes.length);
      assert.equal(encRes.keyBytes.length, 32, "Key must be 256 bits");

      const decrypted = await decryptDocument(encRes.serialized, encRes.keyBytes);
      assert.deepEqual(decrypted, testBytes, "Decrypted bytes must match original bytes exactly");
    });
  });
});
