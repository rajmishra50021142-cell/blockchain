/**
 * Phase 14: Verification Service Unit Tests
 *
 * Validates candidate file hashing, AES-256 key parsing, network validation,
 * stored-object verification logic, and false-certification compliance.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeCandidateHash,
  parseKeyBytes,
  validateNetwork,
  formatVerificationVerdict,
  verifyStoredObjectCiphertext,
} from "../lib/verification/verification-service";
import {
  encryptDocument,
  hashDocument,
  uint8ArrayToHex,
} from "../lib/crypto/document-crypto";
import { config } from "../lib/config/env";

describe("Phase 14: Verification Service Unit Tests", () => {
  describe("Candidate File Hashing & Determinism", () => {
    it("should compute canonical bytes32 SHA-256 digest from candidate bytes", async () => {
      const candidateBytes = new TextEncoder().encode("Authentic Real Estate Deed #9841");
      const hashResult = await computeCandidateHash(candidateBytes);

      assert.equal(typeof hashResult.hex, "string");
      assert.equal(hashResult.hex.length, 64);
      assert.ok(hashResult.bytes32.startsWith("0x"));
      assert.equal(hashResult.bytes32.length, 66);
      assert.equal(hashResult.raw.length, 32);
    });

    it("should produce identical hashes for identical inputs", async () => {
      const bytesA = new Uint8Array([10, 20, 30, 40, 50, 60]);
      const bytesB = new Uint8Array([10, 20, 30, 40, 50, 60]);

      const hashA = await computeCandidateHash(bytesA);
      const hashB = await computeCandidateHash(bytesB);

      assert.equal(hashA.bytes32, hashB.bytes32);
    });

    it("should produce distinctly different hashes on 1-byte mutation", async () => {
      const original = new TextEncoder().encode("Agreement between Party A and Party B for $100,000");
      const mutated = new Uint8Array(original);
      mutated[original.length - 2] = 57; // change '0' to '9' ($100,090)

      const hashOriginal = await computeCandidateHash(original);
      const hashMutated = await computeCandidateHash(mutated);

      assert.notEqual(hashOriginal.bytes32, hashMutated.bytes32);
    });
  });

  describe("AES Key Parsing & Security Boundaries", () => {
    it("should accept valid 32-byte (256-bit) binary key from .key file", () => {
      const raw32 = new Uint8Array(32);
      for (let i = 0; i < 32; i++) raw32[i] = i;

      const parsed = parseKeyBytes(raw32);
      assert.equal(parsed.length, 32);
      assert.deepEqual(parsed, raw32);
    });

    it("should reject binary key with invalid byte length", () => {
      assert.throws(
        () => parseKeyBytes(new Uint8Array(16)),
        /Invalid key length: expected 32 bytes/
      );
      assert.throws(
        () => parseKeyBytes(new Uint8Array(64)),
        /Invalid key length: expected 32 bytes/
      );
    });

    it("should accept valid 64-character hex string (with or without 0x)", () => {
      const hex = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
      const parsedWithout0x = parseKeyBytes(hex);
      assert.equal(parsedWithout0x.length, 32);

      const parsedWith0x = parseKeyBytes(`0x${hex}`);
      assert.equal(parsedWith0x.length, 32);
      assert.deepEqual(parsedWith0x, parsedWithout0x);
    });

    it("should reject invalid hex string lengths or non-hex characters", () => {
      assert.throws(
        () => parseKeyBytes("short-hex"),
        /Invalid key format: expected 64 hex characters/
      );
      assert.throws(
        () => parseKeyBytes("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdeg"), // 'g' is non-hex
        /key contains non-hexadecimal characters/
      );
    });
  });

  describe("Network Validation", () => {
    it("should pass when chainId matches expectedChainId (31337)", () => {
      assert.doesNotThrow(() => validateNetwork(config.expectedChainId));
    });

    it("should throw error if chainId is null or undefined", () => {
      assert.throws(
        () => validateNetwork(null),
        /Unable to detect blockchain network/
      );
    });

    it("should throw error if chainId does not match expectedChainId", () => {
      assert.throws(
        () => validateNetwork(1),
        /Incorrect network: Connected to Chain ID 1/
      );
    });
  });

  describe("Stored-Object Cryptographic Verification Unit", () => {
    it("should verify valid ciphertext, decrypt, and match on-chain hash", async () => {
      const docBytes = new TextEncoder().encode("Verified confidential contract text");
      const expectedHashRes = await hashDocument(docBytes);
      const encryption = await encryptDocument(docBytes);

      // Mock IPFS download helper returning serialized payload
      const mockDownload = async (_cid: string) => encryption.serialized;

      const result = await verifyStoredObjectCiphertext(
        "bafkreihfakecid123",
        encryption.keyBytes,
        expectedHashRes.bytes32,
        mockDownload
      );

      assert.equal(result.attempted, true);
      assert.equal(result.status, "SUCCESS");
      assert.equal(result.matchesOnChainHash, true);
      assert.equal(result.recoveredPlaintextLength, docBytes.length);
    });

    it("should return DECRYPTION_FAILED when ciphertext has been tampered with", async () => {
      const docBytes = new TextEncoder().encode("Original text");
      const expectedHashRes = await hashDocument(docBytes);
      const encryption = await encryptDocument(docBytes);

      // Mutate 1 byte of ciphertext (simulating bit-rot or malicious alteration)
      const tamperedSerialized = new Uint8Array(encryption.serialized);
      tamperedSerialized[tamperedSerialized.length - 5] ^= 0xff;

      const mockDownload = async (_cid: string) => tamperedSerialized;

      const result = await verifyStoredObjectCiphertext(
        "bafkreihfakecid123",
        encryption.keyBytes,
        expectedHashRes.bytes32,
        mockDownload
      );

      assert.equal(result.attempted, true);
      assert.equal(result.status, "DECRYPTION_FAILED");
      assert.ok(result.error?.includes("AES-256-GCM authentication failed"));
    });

    it("should return DECRYPTION_FAILED when decrypted with wrong key", async () => {
      const docBytes = new TextEncoder().encode("Secret text");
      const expectedHashRes = await hashDocument(docBytes);
      const encryption = await encryptDocument(docBytes);

      // Different 256-bit key
      const wrongKey = new Uint8Array(32);
      wrongKey.fill(0xee);

      const mockDownload = async (_cid: string) => encryption.serialized;

      const result = await verifyStoredObjectCiphertext(
        "bafkreihfakecid123",
        wrongKey,
        expectedHashRes.bytes32,
        mockDownload
      );

      assert.equal(result.attempted, true);
      assert.equal(result.status, "DECRYPTION_FAILED");
    });
  });

  describe("False-Certification Compliance (Section 21)", () => {
    const statuses = [
      "VERIFIED",
      "TAMPER_DETECTED",
      "REVOKED",
      "UNAUTHORIZED",
      "DOCUMENT_NOT_FOUND",
      "DECRYPTION_FAILED",
      "DECRYPTION_UNAVAILABLE",
      "IPFS_UNAVAILABLE",
      "BLOCKCHAIN_UNAVAILABLE",
    ] as const;

    it("should never use forbidden false-certification phrases in any verdict", () => {
      const forbiddenTerms = [
        "100% authentic",
        "guaranteed genuine",
        "fraud-proof",
        "legally certified",
        "original for sure",
      ];

      for (const status of statuses) {
        const verdict = formatVerificationVerdict(status);
        const text = `${verdict.title} ${verdict.description}`.toLowerCase();

        for (const term of forbiddenTerms) {
          assert.equal(
            text.includes(term),
            false,
            `Verdict for ${status} must not contain forbidden phrase: "${term}"`
          );
        }
      }
    });

    it("should use evidence-based wording for VERIFIED verdict", () => {
      const verdict = formatVerificationVerdict("VERIFIED");
      assert.ok(verdict.description.includes("SHA-256 digest matches the on-chain hash"));
      assert.equal(verdict.variant, "success");
    });

    it("should use neutral tamper-detection language for TAMPER_DETECTED", () => {
      const verdict = formatVerificationVerdict("TAMPER_DETECTED");
      assert.ok(verdict.description.includes("differs from the hash recorded on-chain"));
      assert.equal(verdict.variant, "danger");
      // Must not speculate about who modified it
      assert.equal(verdict.description.includes("hacker"), false);
      assert.equal(verdict.description.includes("attacker"), false);
    });
  });
});
